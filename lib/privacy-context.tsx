import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

const PRIVACY_ACCEPTED_KEY = "privacy_accepted_v1";

interface PrivacyContextValue {
  hasAccepted: boolean;
  isLoading: boolean;
  accept: () => Promise<void>;
}

const PrivacyContext = createContext<PrivacyContextValue | null>(null);

export function PrivacyProvider({ children }: { children: React.ReactNode }) {
  const [hasAccepted, setHasAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(PRIVACY_ACCEPTED_KEY)
      .then((value) => setHasAccepted(value === "true"))
      .catch(() => setHasAccepted(false))
      .finally(() => setIsLoading(false));
  }, []);

  const accept = useCallback(async () => {
    await AsyncStorage.setItem(PRIVACY_ACCEPTED_KEY, "true");
    setHasAccepted(true);
  }, []);

  return (
    <PrivacyContext.Provider value={{ hasAccepted, isLoading, accept }}>
      {children}
    </PrivacyContext.Provider>
  );
}

export function usePrivacy(): PrivacyContextValue {
  const ctx = useContext(PrivacyContext);
  if (!ctx) throw new Error("usePrivacy must be used within PrivacyProvider");
  return ctx;
}
