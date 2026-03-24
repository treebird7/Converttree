import { Image, ScrollView, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { usePrivacy } from "@/lib/privacy-context";
import { useState } from "react";

const CHECK_ITEMS = [
  {
    title: "Server-Side Processing, No Third Parties",
    body: "Files are sent to ConvertTree's own server for conversion. They are never routed to external cloud services, third-party APIs, or AI services.",
  },
  {
    title: "No File Storage",
    body: "We never store your files. Temporary files are automatically deleted immediately after conversion completes.",
  },
  {
    title: "No Account Required",
    body: "Conversion works without signing in. An optional account lets you access additional features.",
  },
  {
    title: "Local History Only",
    body: "Your conversion history is stored on your device only — never on our servers.",
  },
  {
    title: "No Tracking or Analytics",
    body: "We don't track your activity, analyze your files, or sell your data.",
  },
];

const DONT_ITEMS = [
  "Sell or share your data",
  "Track your activity",
  "Send files to third-party services or AI",
  "Store files after conversion",
  "Require an account to convert files",
];

export default function PrivacyDisclosureScreen() {
  const colors = useColors();
  const router = useRouter();
  const { accept } = usePrivacy();
  const [accepting, setAccepting] = useState(false);

  const handleAccept = async () => {
    setAccepting(true);
    await accept();
    router.replace("/(tabs)");
  };

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]} className="flex-1">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Icon + heading */}
        <View className="items-center mt-8 mb-6">
          <Image
            source={require("@/assets/images/icon.png")}
            style={{ width: 96, height: 96, borderRadius: 22 }}
            resizeMode="contain"
          />
          <Text className="text-3xl font-bold text-foreground mt-4">Your Privacy Matters</Text>
          <Text className="text-sm text-muted text-center mt-2 leading-relaxed px-4">
            ConvertTree is built on a simple principle: your files are yours alone. Files are
            converted on ConvertTree's own secure server — not sent to any third-party cloud
            service or external API — and deleted immediately after conversion.
          </Text>
        </View>

        {/* Check items */}
        <View
          className="rounded-2xl p-5 border-2 gap-4 mb-4"
          style={{ borderColor: colors.border, backgroundColor: colors.surface }}
        >
          {CHECK_ITEMS.map(({ title, body }) => (
            <View key={title} className="flex-row gap-3">
              <Text style={{ color: colors.success }} className="text-base font-bold mt-0.5">
                ✓
              </Text>
              <View className="flex-1">
                <Text className="text-sm font-bold text-foreground">{title}</Text>
                <Text className="text-xs text-muted mt-0.5 leading-relaxed">{body}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Security guarantee */}
        <View
          className="rounded-2xl p-4 border-2 mb-4"
          style={{
            borderColor: colors.primary,
            backgroundColor: `${colors.primary}12`,
          }}
        >
          <Text className="text-sm font-bold mb-1" style={{ color: colors.primary }}>
            🔒  Security Guarantee
          </Text>
          <Text className="text-xs text-muted leading-relaxed">
            All conversions are processed securely on ConvertTree's own servers. Files are never
            stored, never shared with third parties, and automatically deleted after conversion
            completes.
          </Text>
        </View>

        {/* What we don't do */}
        <View
          className="rounded-2xl p-4 border-2 mb-6"
          style={{ borderColor: colors.border, backgroundColor: colors.surface }}
        >
          <Text className="text-sm font-bold text-foreground mb-3">What We Don't Do</Text>
          {DONT_ITEMS.map((item) => (
            <View key={item} className="flex-row gap-2 items-center mb-1.5">
              <Text style={{ color: colors.error }} className="text-xs font-bold">
                ✗
              </Text>
              <Text className="text-xs text-muted">We don't {item.toLowerCase()}</Text>
            </View>
          ))}
        </View>

        {/* Accept button */}
        <TouchableOpacity
          onPress={handleAccept}
          disabled={accepting}
          className="rounded-3xl py-4 items-center active:opacity-80"
          style={{ backgroundColor: colors.primary }}
        >
          {accepting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="font-bold text-lg text-white">Accept & Continue</Text>
          )}
        </TouchableOpacity>

        <Text className="text-xs text-muted text-center mt-3 leading-relaxed px-4">
          By continuing you acknowledge that you've read and understood how ConvertTree handles
          your files.
        </Text>
      </ScrollView>
    </ScreenContainer>
  );
}
