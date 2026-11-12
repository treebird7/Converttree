import { beforeAll, describe, expect, it } from "vitest";
import type { TrpcContext } from "../server/context";
import { resolveSubscriptionTier } from "../server/context";
import { ENTITLEMENT_MATRIX, MAX_ENCODED_REQUEST_BYTES, requiresPro } from "../shared/entitlements";

describe("conversion authentication contract", () => {
  let appRouter: typeof import("../server/routers").appRouter;

  const createContext = (subscriptionTier: TrpcContext["subscriptionTier"] = "free"): TrpcContext => ({
    subscriptionTier,
    req: {
      ip: "conversion-auth-test",
      socket: { remoteAddress: "conversion-auth-test" },
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  });

  beforeAll(async () => {
    ({ appRouter } = await import("../server/routers"));
  });

  it("allows an unauthenticated user to convert a text file", async () => {
    const result = await appRouter.createCaller(createContext()).conversion.convert({
      inputFormat: "txt",
      outputFormat: "md",
      fileBase64: Buffer.from("hello").toString("base64"),
      fileName: "hello.txt",
    });

    expect(result.success).toBe(true);
    expect(Buffer.from(result.fileBase64, "base64").toString("utf8")).toBe("hello");
  });

  it("rejects batch conversion without a Pro subscription", async () => {
    await expect(
      appRouter.createCaller(createContext()).conversion.convert({
        inputFormat: "txt",
        outputFormat: "md",
        fileBase64: Buffer.from("hello").toString("base64"),
        fileName: "hello.txt",
        isBatch: true,
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects multi-page image output without a Pro subscription", async () => {
    await expect(
      appRouter.createCaller(createContext()).conversion.convert({
        inputFormat: "pdf",
        outputFormat: "zip",
        fileBase64: Buffer.from("not a real pdf").toString("base64"),
        fileName: "document.pdf",
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("shares the entitlement matrix with the client policy", () => {
    expect(ENTITLEMENT_MATRIX.free.maxFileBytes).toBe(10 * 1024 * 1024);
    expect(ENTITLEMENT_MATRIX.pro.maxFileBytes).toBe(50 * 1024 * 1024);
    expect(requiresPro({ outputFormat: "zip" })).toBe(true);
    expect(requiresPro({ outputFormat: "pdf" })).toBe(false);
    expect(Buffer.alloc(ENTITLEMENT_MATRIX.pro.maxFileBytes).toString("base64").length)
      .toBeLessThan(MAX_ENCODED_REQUEST_BYTES);
  });

  it("lets a Pro context through the batch gate (the tier seam is honoured)", async () => {
    const result = await appRouter.createCaller(createContext("pro")).conversion.convert({
      inputFormat: "txt",
      outputFormat: "md",
      fileBase64: Buffer.from("batch").toString("base64"),
      fileName: "batch.txt",
      isBatch: true,
    });

    expect(result.success).toBe(true);
  });

  it("reports the request's tier through entitlements.current", async () => {
    await expect(appRouter.createCaller(createContext()).entitlements.current()).resolves.toEqual({
      subscriptionTier: "free",
    });
    await expect(appRouter.createCaller(createContext("pro")).entitlements.current()).resolves.toEqual({
      subscriptionTier: "pro",
    });
  });

  it("puts every real request on the free tier, whatever it sends", () => {
    const req = {
      headers: { authorization: "Bearer anything", cookie: "app_session_id=forged" },
    } as unknown as TrpcContext["req"];

    expect(resolveSubscriptionTier(req)).toBe("free");
  });

  it("rejects free files above 10 MB", async () => {
    const oversizedFile = Buffer.alloc(10 * 1024 * 1024 + 1).toString("base64");

    await expect(
      appRouter.createCaller(createContext()).conversion.convert({
        inputFormat: "txt",
        outputFormat: "md",
        fileBase64: oversizedFile,
        fileName: "large.txt",
      }),
    ).rejects.toMatchObject({ code: "PAYLOAD_TOO_LARGE" });
  });

  it("returns a safe conversion error for invalid input and cleans up temporary files", async () => {
    await expect(
      appRouter.createCaller(createContext()).conversion.convert({
        inputFormat: "pdf",
        outputFormat: "txt",
        fileBase64: Buffer.from("not a PDF").toString("base64"),
        fileName: "invalid.pdf",
      }),
    ).rejects.toThrow("Conversion error:");
  });
});
