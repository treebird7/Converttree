import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface HistoryItem {
  id: string;
  inputFileName: string;
  inputFormat: string;
  outputFormat: string;
  timestamp: number;
  success: boolean;
}

interface HistoryContextType {
  history: HistoryItem[];
  addToHistory: (item: Omit<HistoryItem, "id" | "timestamp">) => Promise<void>;
  clearHistory: () => Promise<void>;
  removeFromHistory: (id: string) => Promise<void>;
  loadHistory: () => Promise<void>;
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);
const HISTORY_KEY = "@converttree_history";

export function HistoryProvider({ children }: { children: React.ReactNode }) {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const loadHistory = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(HISTORY_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setHistory(parsed);
      }
    } catch (error) {
      console.error("Failed to load history:", error);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const addToHistory = useCallback(
    async (item: Omit<HistoryItem, "id" | "timestamp">) => {
      try {
        const newItem: HistoryItem = {
          ...item,
          id: `${Date.now()}_${Math.random()}`,
          timestamp: Date.now(),
        };

        const updated = [newItem, ...history].slice(0, 50); // Keep last 50
        setHistory(updated);
        await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error("Failed to add to history:", error);
      }
    },
    [history]
  );

  const clearHistory = useCallback(async () => {
    try {
      setHistory([]);
      await AsyncStorage.removeItem(HISTORY_KEY);
    } catch (error) {
      console.error("Failed to clear history:", error);
    }
  }, []);

  const removeFromHistory = useCallback(
    async (id: string) => {
      try {
        const updated = history.filter((item) => item.id !== id);
        setHistory(updated);
        await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error("Failed to remove from history:", error);
      }
    },
    [history]
  );

  const value: HistoryContextType = {
    history,
    addToHistory,
    clearHistory,
    removeFromHistory,
    loadHistory,
  };

  return (
    <HistoryContext.Provider value={value}>
      {children}
    </HistoryContext.Provider>
  );
}

export function useHistory() {
  const context = useContext(HistoryContext);
  if (!context) {
    throw new Error("useHistory must be used within HistoryProvider");
  }
  return context;
}
