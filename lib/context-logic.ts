import type { ConversionFile } from "./conversion-context";
import type { BatchItem } from "./batch-context";
import type { HistoryItem } from "./history-context";
import type { ConversionSettings } from "./settings-context";

export const DEFAULT_CONVERSION_SETTINGS: ConversionSettings = {
  pdfQuality: "high",
  imageCompression: "medium",
  preserveFormatting: true,
  autoDownload: false,
};

export function createBatchItem(
  inputFile: ConversionFile,
  outputFormat: string,
  id: string,
): BatchItem {
  return { id, inputFile, outputFormat, status: "pending" };
}

export function updateBatchItem(
  items: BatchItem[],
  id: string,
  status: BatchItem["status"],
  convertedFile?: ConversionFile,
  error?: string,
): BatchItem[] {
  return items.map((item) =>
    item.id === id ? { ...item, status, convertedFile, error } : item,
  );
}

export function appendHistory(
  history: HistoryItem[],
  item: Omit<HistoryItem, "id" | "timestamp">,
  id: string,
  timestamp: number,
): HistoryItem[] {
  return [{ ...item, id, timestamp }, ...history].slice(0, 50);
}

export function updateSettings(
  settings: ConversionSettings,
  changes: Partial<ConversionSettings>,
): ConversionSettings {
  return { ...settings, ...changes };
}
