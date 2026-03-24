import React, { createContext, useContext, useState, useCallback } from "react";

export interface ConversionFile {
  uri: string;
  name: string;
  size: number;
  format: string;
  /** Pre-read base64 content (used on web where FileSystem cannot read blob URIs) */
  base64?: string;
}

export interface ConversionState {
  inputFile: ConversionFile | null;
  outputFormat: string | null;
  isConverting: boolean;
  convertedFile: ConversionFile | null;
  error: string | null;
}

interface ConversionContextType extends ConversionState {
  setInputFile: (file: ConversionFile | null) => void;
  setOutputFormat: (format: string | null) => void;
  setIsConverting: (converting: boolean) => void;
  setConvertedFile: (file: ConversionFile | null) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const ConversionContext = createContext<ConversionContextType | undefined>(undefined);

export function ConversionProvider({ children }: { children: React.ReactNode }) {
  const [inputFile, setInputFile] = useState<ConversionFile | null>(null);
  const [outputFormat, setOutputFormat] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [convertedFile, setConvertedFile] = useState<ConversionFile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setInputFile(null);
    setOutputFormat(null);
    setIsConverting(false);
    setConvertedFile(null);
    setError(null);
  }, []);

  const value: ConversionContextType = {
    inputFile,
    setInputFile,
    outputFormat,
    setOutputFormat,
    isConverting,
    setIsConverting,
    convertedFile,
    setConvertedFile,
    error,
    setError,
    reset,
  };

  return (
    <ConversionContext.Provider value={value}>
      {children}
    </ConversionContext.Provider>
  );
}

export function useConversion() {
  const context = useContext(ConversionContext);
  if (!context) {
    throw new Error("useConversion must be used within ConversionProvider");
  }
  return context;
}
