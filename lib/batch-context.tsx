import React, { createContext, useContext, useState, useCallback } from "react";
import { ConversionFile } from "./conversion-context";

export interface BatchItem {
  id: string;
  inputFile: ConversionFile;
  outputFormat: string;
  status: "pending" | "converting" | "success" | "error";
  convertedFile?: ConversionFile;
  error?: string;
}

interface BatchContextType {
  batchItems: BatchItem[];
  addBatchItem: (inputFile: ConversionFile, outputFormat: string) => string;
  removeBatchItem: (id: string) => void;
  updateBatchItemStatus: (id: string, status: BatchItem["status"], convertedFile?: ConversionFile, error?: string) => void;
  clearBatch: () => void;
  getBatchItem: (id: string) => BatchItem | undefined;
}

const BatchContext = createContext<BatchContextType | undefined>(undefined);

export function BatchProvider({ children }: { children: React.ReactNode }) {
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);

  const addBatchItem = useCallback((inputFile: ConversionFile, outputFormat: string) => {
    const id = `batch_${Date.now()}_${Math.random()}`;
    const newItem: BatchItem = {
      id,
      inputFile,
      outputFormat,
      status: "pending",
    };
    setBatchItems((prev) => [...prev, newItem]);
    return id;
  }, []);

  const removeBatchItem = useCallback((id: string) => {
    setBatchItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updateBatchItemStatus = useCallback(
    (id: string, status: BatchItem["status"], convertedFile?: ConversionFile, error?: string) => {
      setBatchItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, status, convertedFile, error }
            : item
        )
      );
    },
    []
  );

  const clearBatch = useCallback(() => {
    setBatchItems([]);
  }, []);

  const getBatchItem = useCallback(
    (id: string) => batchItems.find((item) => item.id === id),
    [batchItems]
  );

  const value: BatchContextType = {
    batchItems,
    addBatchItem,
    removeBatchItem,
    updateBatchItemStatus,
    clearBatch,
    getBatchItem,
  };

  return (
    <BatchContext.Provider value={value}>
      {children}
    </BatchContext.Provider>
  );
}

export function useBatch() {
  const context = useContext(BatchContext);
  if (!context) {
    throw new Error("useBatch must be used within BatchProvider");
  }
  return context;
}
