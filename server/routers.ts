import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const COOKIE_NAME = "session";

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

const VALID_FORMATS = new Set(["txt", "md", "docx", "pdf", "png", "jpg", "jpeg"]);
const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50 MB

  conversion: router({
    convert: publicProcedure
      .input(
        z.object({
          inputFormat: z.string().refine((f) => VALID_FORMATS.has(f), { message: "Invalid input format" }),
          outputFormat: z.string().refine((f) => VALID_FORMATS.has(f), { message: "Invalid output format" }),
          fileBase64: z.string().max(MAX_FILE_BYTES * 2), // base64 is ~1.37x raw size
          fileName: z.string().min(1).max(255),
        })
      )
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.fileBase64, "base64");
        if (buffer.length > MAX_FILE_BYTES) {
          throw new Error("File exceeds 50 MB limit");
        }

        const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
        const tempDir = os.tmpdir();
        const inputFileName = `input_${Date.now()}_${safeName}`;
        const inputPath = path.join(tempDir, inputFileName);
        const outputFileName = `output_${Date.now()}.${input.outputFormat}`;
        const outputPath = path.join(tempDir, outputFileName);

        try {
          // Write pre-decoded buffer to input file
          fs.writeFileSync(inputPath, buffer);

          console.log(`[Conversion] Starting: ${input.inputFormat} -> ${input.outputFormat}`);
          console.log(`[Conversion] Input path: ${inputPath}`);
          console.log(`[Conversion] Output path: ${outputPath}`);

          // Run Python conversion script with improved error handling
          // Must use absolute path and clear PYTHONHOME/PYTHONPATH to avoid Python 3.13 override
          const cleanEnv = { ...process.env };
          delete cleanEnv.PYTHONHOME;
          delete cleanEnv.PYTHONPATH;
          delete cleanEnv.NUITKA_PYTHONPATH;
          await new Promise<void>((resolve, reject) => {
            const python = spawn("/usr/bin/python3.11", [
              path.join(__dirname, "conversion_utils.py"),
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
              reject(new Error(`Failed to spawn Python process: ${err.message}`));
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
      formats: ["txt", "md", "docx", "pdf", "png", "jpg", "jpeg"],
      conversions: {
        txt: ["md", "docx", "pdf"],
        md: ["txt", "docx", "pdf"],
        docx: ["txt", "md", "pdf"],
        pdf: ["txt", "md", "docx", "png", "jpg"],
        png: ["pdf", "jpg"],
        jpg: ["pdf", "png"],
        jpeg: ["pdf", "png"],
      },
    })),
  }),
});

export type AppRouter = typeof appRouter;
