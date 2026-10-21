import { describe, expect, it } from "vitest";
import { appendHistory, createBatchItem, updateBatchItem, updateSettings } from "../lib/context-logic";
import { DEFAULT_SETTINGS } from "../lib/settings-context";
import type { ConversionFile } from "../lib/conversion-context";
import type { HistoryItem } from "../lib/history-context";
import { appRouter } from "../server/routers";

const file: ConversionFile = { uri: "file:///hello.txt", name: "hello.txt", size: 5, format: "txt" };

describe("ConvertTree state behavior", () => {
  it("creates a pending batch item and transitions it to success", () => {
    const item = createBatchItem(file, "pdf", "batch-1");
    expect(item).toMatchObject({ id: "batch-1", outputFormat: "pdf", status: "pending" });

    const converted = { ...file, name: "hello.pdf", format: "pdf" };
    const updated = updateBatchItem([item], "batch-1", "success", converted);
    expect(updated[0]).toMatchObject({ status: "success", convertedFile: converted });
  });

  it("records batch errors without changing other items", () => {
    const first = createBatchItem(file, "pdf", "first");
    const second = createBatchItem({ ...file, name: "other.txt" }, "md", "second");
    const updated = updateBatchItem([first, second], "first", "error", undefined, "bad input");
    expect(updated[0]).toMatchObject({ status: "error", error: "bad input" });
    expect(updated[1]).toMatchObject({ id: "second", status: "pending" });
  });

  it("prepends history and caps it at 50 entries", () => {
    const seed = Array.from({ length: 50 }, (_, index): HistoryItem => ({
      id: `old-${index}`, inputFileName: "old.txt", inputFormat: "txt", outputFormat: "md",
      timestamp: index, success: true,
    }));
    const updated = appendHistory(seed, {
      inputFileName: "new.txt", inputFormat: "txt", outputFormat: "pdf", success: true,
    }, "new", 100);
    expect(updated).toHaveLength(50);
    expect(updated[0]).toMatchObject({ id: "new", inputFileName: "new.txt" });
    expect(updated.some((entry) => entry.id === "old-49")).toBe(false);
  });

  it("merges settings and exposes stable defaults", () => {
    expect(DEFAULT_SETTINGS).toEqual({
      pdfQuality: "high", imageCompression: "medium", preserveFormatting: true, autoDownload: false,
    });
    expect(updateSettings(DEFAULT_SETTINGS, { autoDownload: true })).toMatchObject({
      pdfQuality: "high", autoDownload: true,
    });
  });

  it("exposes the supported conversion routing", async () => {
    const result = await appRouter.createCaller({
      subscriptionTier: "free",
      req: {} as never,
      res: {} as never,
    }).conversion.supportedFormats();
    expect(result.formats).toEqual(expect.arrayContaining(["txt", "md", "docx", "pdf", "zip"]));
    expect(result.conversions.pdf).toEqual(["txt", "md", "docx", "zip"]);
  });
});
