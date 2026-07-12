// Keep test collection independent from a developer's shell environment.
// Production startup still validates JWT_SECRET in server/_core/env.ts.
process.env.JWT_SECRET ??= "convert-tree-vitest-only-secret";
