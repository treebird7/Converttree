import "@/global.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useRef, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import "@/lib/nativewind-pressable";
import { ThemeProvider } from "@/lib/theme-provider";
import { SafeAreaProvider, initialWindowMetrics } from "react-native-safe-area-context";
import type { EdgeInsets, Rect } from "react-native-safe-area-context";

import { trpc, createTRPCClient } from "@/lib/trpc";
import { ConversionProvider } from "@/lib/conversion-context";
import { BatchProvider } from "@/lib/batch-context";
import { HistoryProvider } from "@/lib/history-context";
import { SettingsProvider } from "@/lib/settings-context";
import { PrivacyProvider, usePrivacy } from "@/lib/privacy-context";

const DEFAULT_WEB_INSETS: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };
const DEFAULT_WEB_FRAME: Rect = { x: 0, y: 0, width: 0, height: 0 };

export const unstable_settings = {
  anchor: "(tabs)",
};

/**
 * Runs inside the Stack navigator — redirects to privacy disclosure on first launch,
 * or back to tabs once accepted. Lives inside PrivacyProvider so usePrivacy() is safe.
 */
function PrivacyGate() {
  const { hasAccepted, isLoading } = usePrivacy();
  const router = useRouter();
  const redirected = useRef(false);

  useEffect(() => {
    if (isLoading || redirected.current) return;
    redirected.current = true;
    if (!hasAccepted) {
      router.replace("/privacy");
    }
  }, [isLoading, hasAccepted]);

  return null;
}

export default function RootLayout() {
  const initialInsets = initialWindowMetrics?.insets ?? DEFAULT_WEB_INSETS;
  const initialFrame = initialWindowMetrics?.frame ?? DEFAULT_WEB_FRAME;

  // Create clients once and reuse them
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Disable automatic refetching on window focus for mobile
            refetchOnWindowFocus: false,
            // Retry failed requests once
            retry: 1,
          },
        },
      }),
  );
  const [trpcClient] = useState(() => createTRPCClient());

  // Ensure minimum 8px padding for top and bottom on mobile
  const providerInitialMetrics = useMemo(() => {
    const metrics = initialWindowMetrics ?? { insets: initialInsets, frame: initialFrame };
    return {
      ...metrics,
      insets: {
        ...metrics.insets,
        top: Math.max(metrics.insets.top, 16),
        bottom: Math.max(metrics.insets.bottom, 12),
      },
    };
  }, [initialInsets, initialFrame]);

  const content = (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PrivacyProvider>
        <ConversionProvider>
          <BatchProvider>
            <HistoryProvider>
              <SettingsProvider>
                <trpc.Provider client={trpcClient} queryClient={queryClient}>
                  <QueryClientProvider client={queryClient}>
                    <Stack screenOptions={{ headerShown: false }}>
                      <Stack.Screen name="(tabs)" />
                      <Stack.Screen name="privacy" />
                    </Stack>
                    <StatusBar style="auto" />
                    <PrivacyGate />
                  </QueryClientProvider>
                </trpc.Provider>
              </SettingsProvider>
            </HistoryProvider>
          </BatchProvider>
        </ConversionProvider>
      </PrivacyProvider>
    </GestureHandlerRootView>
  );

  return (
    <ThemeProvider>
      <SafeAreaProvider initialMetrics={providerInitialMetrics}>{content}</SafeAreaProvider>
    </ThemeProvider>
  );
}
