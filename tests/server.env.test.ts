import { describe, expect, it } from "vitest";
import { loadEnv } from "../server/env";

describe("server environment", () => {
  it("refuses to start without JWT_SECRET", () => {
    expect(() => loadEnv({})).toThrow(/JWT_SECRET/);
    expect(() => loadEnv({ JWT_SECRET: "" })).toThrow(/JWT_SECRET/);
  });

  it("applies defaults and coerces PORT", () => {
    expect(loadEnv({ JWT_SECRET: "x" })).toMatchObject({ PORT: 3000, NODE_ENV: "development" });
    expect(loadEnv({ JWT_SECRET: "x", PORT: "8080" }).PORT).toBe(8080);
  });

  it("rejects a malformed FRONTEND_URL or PORT", () => {
    expect(() => loadEnv({ JWT_SECRET: "x", FRONTEND_URL: "not a url" })).toThrow(/FRONTEND_URL/);
    expect(() => loadEnv({ JWT_SECRET: "x", PORT: "abc" })).toThrow(/PORT/);
  });
});
