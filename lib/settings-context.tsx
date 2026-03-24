import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface ConversionSettings {
  pdfQuality: "low" | "medium" | "high";
  imageCompression: "low" | "medium" | "high";
  preserveFormatting: boolean;
  autoDownload: boolean;
}

interface SettingsContextType {
  settings: ConversionSettings;
  updateSettings: (settings: Partial<ConversionSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  loadSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);
const SETTINGS_KEY = "@converttree_settings";

const DEFAULT_SETTINGS: ConversionSettings = {
  pdfQuality: "high",
  imageCompression: "medium",
  preserveFormatting: true,
  autoDownload: false,
};

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<ConversionSettings>(DEFAULT_SETTINGS);

  const loadSettings = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updateSettings = useCallback(
    async (newSettings: Partial<ConversionSettings>) => {
      try {
        const updated = { ...settings, ...newSettings };
        setSettings(updated);
        await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error("Failed to update settings:", error);
      }
    },
    [settings]
  );

  const resetSettings = useCallback(async () => {
    try {
      setSettings(DEFAULT_SETTINGS);
      await AsyncStorage.removeItem(SETTINGS_KEY);
    } catch (error) {
      console.error("Failed to reset settings:", error);
    }
  }, []);

  const value: SettingsContextType = {
    settings,
    updateSettings,
    resetSettings,
    loadSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return context;
}
