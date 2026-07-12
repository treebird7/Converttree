import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import type { TrpcContext } from "./_core/context";
import { COOKIE_NAME } from "../shared/const.js";
import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { fileURLToPath, URL } from "url";
import {
  ENTITLEMENT_MATRIX,
  entitlementFor,
  requiresPro,
  type SubscriptionTier,
} from "../shared/entitlements.js";

const VALID_FORMATS = new Set(["txt", "md", "docx", "pdf", "png", "jpg", "jpeg", "zip"]);
const FREE_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

type RateLimitEntry = { count: number; windowStartedAt: number };
const conversionRateLimits = new Map<string, RateLimitEntry>();
const conversionScriptPath = fileURLToPath(new URL("./conversion_utils.py", import.meta.url));

function enforceConversionRateLimit(req: TrpcContext["req"]): void {
  const key = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const current = conversionRateLimits.get(key);

  if (!current || now - current.windowStartedAt >= FREE_RATE_LIMIT_WINDOW_MS) {
    conversionRateLimits.set(key, { count: 1, windowStartedAt: now });
    return;
  }

  if (current.count >= ENTITLEMENT_MATRIX.free.conversionsPerHour) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Free conversions are limited to 10 requests per hour. Please try again later or upgrade to Pro.",
    });
  }

  current.count += 1;
}

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  conversion: router({
    convert: publicProcedure
      .input(
        z.object({
          inputFormat: z.string().refine((f) => VALID_FORMATS.has(f), { message: "Invalid input format" }),
          outputFormat: z.string().refine((f) => VALID_FORMATS.has(f), { message: "Invalid output format" }),
          fileBase64: z.string().max(ENTITLEMENT_MATRIX.pro.maxFileBytes * 2), // base64 is ~1.37x raw size
          fileName: z.string().min(1).max(255),
          isBatch: z.boolean().default(false),
          highQuality: z.boolean().default(false),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const tier: SubscriptionTier = ctx.user?.subscriptionTier ?? "free";
        const isPro = tier === "pro";
        if (requiresPro(input) && !isPro) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: input.outputFormat === "zip"
              ? "Multi-page image output requires a Pro subscription."
              : "Batch or high-quality conversion requires a Pro subscription.",
          });
        }

        if (!isPro) enforceConversionRateLimit(ctx.req);

        const buffer = Buffer.from(input.fileBase64, "base64");
        const maxFileBytes = entitlementFor(tier).maxFileBytes;
        if (buffer.length > maxFileBytes) {
          throw new TRPCError({
            code: "PAYLOAD_TOO_LARGE",
            message: isPro
              ? "File exceeds the 50 MB limit."
              : "Free conversions support files up to 10 MB. Upgrade to Pro for files up to 50 MB.",
          });
        }

        const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
        const tempDir = os.tmpdir();
        const inputFileName = `input_${Date.now()}_${safeName}`;
        const inputPath = path.join(tempDir, inputFileName);
        const outputFileName = `output_${Date.now()}.${input.outputFormat}`;
        const outputPath = path.join(tempDir, outputFileName);

        try {
          // Write pre-decoded buffer to input file
          fs.writeFileSync(inputPath, buffer, { mode: 0o600 });

          console.log(`[Conversion] Starting: ${input.inputFormat} -> ${input.outputFormat}`);
          console.log(`[Conversion] Input path: ${inputPath}`);
          console.log(`[Conversion] Output path: ${outputPath}`);

          // Allowlist only what python3 needs — never pass server secrets to subprocess
          const cleanEnv = {
            PATH: process.env.PATH,
            HOME: process.env.HOME,
            TMPDIR: process.env.TMPDIR,
            TMP: process.env.TMP,
            TEMP: process.env.TEMP,
            LANG: process.env.LANG,
          } as unknown as NodeJS.ProcessEnv;
          await new Promise<void>((resolve, reject) => {
            const python = spawn("python3", [
              conversionScriptPath,
              inputPath,
              outputPath,
              input.inputFormat,
              input.outputFormat,
            ], { env: cleanEnv });

            let errorOutput = "";
            let standardOutput = "";
            let timedOut = false;

            // Set timeout
            const timeout = setTimeout(() => {
              timedOut = true;
              python.kill();
              reject(new Error("Conversion timed out after 60 seconds"));
            }, 60000);

            python.stdout?.on("data", (data) => {
              standardOutput += data.toString();
              console.log(`[Python stdout] ${data.toString()}`);
            });

            python.stderr.on("data", (data) => {
              errorOutput += data.toString();
              console.log(`[Python stderr] ${data.toString()}`);
            });

            python.on("close", (code) => {
              clearTimeout(timeout);
              if (timedOut) return;

              if (code !== 0) {
                console.error(`[Conversion] Failed (code ${code}): ${errorOutput || standardOutput}`);
                reject(new Error(`Conversion failed. Please check the file and try again.`));
              } else if (!fs.existsSync(outputPath)) {
                console.error(`[Conversion] Output missing: ${errorOutput || standardOutput}`);
                reject(new Error(`Conversion produced no output. Please try again.`));
              } else {
                console.log(`[Conversion] Success: output file created at ${outputPath}`);
                resolve();
              }
            });

            python.on("error", (err) => {
              clearTimeout(timeout);
              console.error("[Conversion] spawn error:", err);
              reject(new Error("Conversion unavailable — system configuration error"));
            });
          });

          // Read converted file and encode to base64
          const convertedBuffer = fs.readFileSync(outputPath);
          const convertedBase64 = convertedBuffer.toString("base64");

          console.log(
            `[Conversion] Converted file size: ${convertedBuffer.length} bytes`
          );

          // Cleanup
          fs.unlinkSync(inputPath);
          fs.unlinkSync(outputPath);

          return {
            success: true,
            fileBase64: convertedBase64,
            fileName: outputFileName,
            outputFormat: input.outputFormat,
          };
        } catch (error) {
          // Cleanup on error
          if (fs.existsSync(inputPath)) {
            try {
              fs.unlinkSync(inputPath);
            } catch (e) {
              console.error("Failed to cleanup input file:", e);
            }
          }
          if (fs.existsSync(outputPath)) {
            try {
              fs.unlinkSync(outputPath);
            } catch (e) {
              console.error("Failed to cleanup output file:", e);
            }
          }

          const errorMessage =
            error instanceof Error ? error.message : String(error);
          console.error(`[Conversion] Error: ${errorMessage}`);
          throw new Error(`Conversion error: ${errorMessage}`);
        }
      }),

    supportedFormats: publicProcedure.query(() => ({
      formats: ["txt", "md", "docx", "pdf", "png", "jpg", "jpeg", "zip"],
      conversions: {
        txt: ["md", "docx", "pdf"],
        md: ["txt", "docx", "pdf"],
        docx: ["txt", "md", "pdf"],
        pdf: ["txt", "md", "docx", "zip"],
        png: ["pdf", "jpg"],
        jpg: ["pdf", "png"],
        jpeg: ["pdf", "png"],
      },
    })),
  }),
});

export type AppRouter = typeof appRouter;
