import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  // Extra browser origin allowed by CORS (e.g. the deployed web client).
  FRONTEND_URL: z.url().optional(),
  // Kept as a fail-fast deploy requirement. Nothing signs cookies or tokens
  // today (there are no accounts); see server/context.ts.
  JWT_SECRET: z.string().min(1, "JWT_SECRET env var is required — refusing to start"),
});

export type Env = z.infer<typeof EnvSchema>;

/** Validate process.env once at startup. Throws with every problem listed. */
export function loadEnv(source: Record<string, string | undefined> = process.env): Env {
  const parsed = EnvSchema.safeParse(source);
  if (!parsed.success) {
    const problems = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid server environment — ${problems}`);
  }
  return parsed.data;
}
