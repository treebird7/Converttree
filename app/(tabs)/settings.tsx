import { ScrollView, Text, View, TouchableOpacity, Switch } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useSettings } from "@/lib/settings-context";
import * as Haptics from "expo-haptics";

export default function SettingsScreen() {
  const { settings, updateSettings, resetSettings } = useSettings();
  const colors = useColors();

  const handleQualityChange = (quality: "low" | "medium" | "high") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateSettings({ pdfQuality: quality });
  };

  const handleCompressionChange = (compression: "low" | "medium" | "high") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateSettings({ imageCompression: compression });
  };

  const handleToggleFormatting = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateSettings({ preserveFormatting: !settings.preserveFormatting });
  };

  const handleToggleAutoDownload = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateSettings({ autoDownload: !settings.autoDownload });
  };

  const handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    resetSettings();
  };

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="flex-1 gap-6">

          {/* Header */}
          <View className="mt-2">
            <Text className="text-4xl font-bold text-foreground">Settings</Text>
            <Text className="text-sm text-muted mt-2">Customize your conversion preferences</Text>
          </View>

          {/* PDF Quality */}
          <View className="gap-3">
            <Text className="text-lg font-bold text-foreground">PDF Quality</Text>
            {(["low", "medium", "high"] as const).map((quality) => (
              <TouchableOpacity
                key={quality}
                onPress={() => handleQualityChange(quality)}
                className="rounded-2xl p-4 border-2"
                style={{
                  borderColor: settings.pdfQuality === quality ? colors.primary : colors.border,
                  backgroundColor:
                    settings.pdfQuality === quality ? `${colors.primary}15` : colors.surface,
                }}
              >
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text
                      className="font-bold capitalize"
                      style={{
                        color:
                          settings.pdfQuality === quality ? colors.primary : colors.foreground,
                      }}
                    >
                      {quality.charAt(0).toUpperCase() + quality.slice(1)}
                    </Text>
                    <Text className="text-xs text-muted mt-1">
                      {quality === "low"
                        ? "Smaller file size, lower quality"
                        : quality === "medium"
                        ? "Balanced quality and size"
                        : "Best quality, larger file size"}
                    </Text>
                  </View>
                  {settings.pdfQuality === quality && (
                    <View
                      className="w-5 h-5 rounded-full"
                      style={{ backgroundColor: colors.primary }}
                    />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Image Compression */}
          <View className="gap-3">
            <Text className="text-lg font-bold text-foreground">Image Compression</Text>
            {(["low", "medium", "high"] as const).map((compression) => (
              <TouchableOpacity
                key={compression}
                onPress={() => handleCompressionChange(compression)}
                className="rounded-2xl p-4 border-2"
                style={{
                  borderColor:
                    settings.imageCompression === compression ? colors.primary : colors.border,
                  backgroundColor:
                    settings.imageCompression === compression
                      ? `${colors.primary}15`
                      : colors.surface,
                }}
              >
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text
                      className="font-bold capitalize"
                      style={{
                        color:
                          settings.imageCompression === compression
                            ? colors.primary
                            : colors.foreground,
                      }}
                    >
                      {compression.charAt(0).toUpperCase() + compression.slice(1)}
                    </Text>
                    <Text className="text-xs text-muted mt-1">
                      {compression === "low"
                        ? "Best quality, larger file"
                        : compression === "medium"
                        ? "Good balance"
                        : "Maximum compression"}
                    </Text>
                  </View>
                  {settings.imageCompression === compression && (
                    <View
                      className="w-5 h-5 rounded-full"
                      style={{ backgroundColor: colors.primary }}
                    />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Toggle Options */}
          <View className="gap-3">
            <Text className="text-lg font-bold text-foreground">Options</Text>

            <View
              className="rounded-2xl p-4 border-2 flex-row items-center justify-between"
              style={{ borderColor: colors.border, backgroundColor: colors.surface }}
            >
              <View className="flex-1 mr-4">
                <Text className="font-bold text-foreground">Preserve Formatting</Text>
                <Text className="text-xs text-muted mt-1">
                  Keep original document formatting
                </Text>
              </View>
              <Switch
                value={settings.preserveFormatting}
                onValueChange={handleToggleFormatting}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="white"
              />
            </View>

            <View
              className="rounded-2xl p-4 border-2 flex-row items-center justify-between"
              style={{ borderColor: colors.border, backgroundColor: colors.surface }}
            >
              <View className="flex-1 mr-4">
                <Text className="font-bold text-foreground">Auto Download</Text>
                <Text className="text-xs text-muted mt-1">
                  Automatically download converted files
                </Text>
              </View>
              <Switch
                value={settings.autoDownload}
                onValueChange={handleToggleAutoDownload}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="white"
              />
            </View>
          </View>

          {/* Reset Button */}
          <TouchableOpacity
            onPress={handleReset}
            className="rounded-3xl py-4 items-center border-2 active:opacity-70"
            style={{ borderColor: colors.warning, backgroundColor: `${colors.warning}15` }}
          >
            <Text className="font-bold text-lg" style={{ color: colors.warning }}>
              Reset to Defaults
            </Text>
          </TouchableOpacity>

          {/* Info Card */}
          <View
            className="rounded-2xl p-4 border-2"
            style={{ borderColor: colors.success, backgroundColor: `${colors.success}10` }}
          >
            <Text className="text-xs text-foreground leading-relaxed">
              <Text className="font-bold">Note:</Text>{"  "}These settings will be applied to all future conversions. You can change them anytime.
            </Text>
          </View>

          {/* About & Privacy */}
          <View className="gap-3">
            <Text className="text-lg font-bold text-foreground">About & Privacy</Text>

            <View
              className="rounded-2xl p-5 border-2 gap-4"
              style={{ borderColor: colors.border, backgroundColor: colors.surface }}
            >
              <Text className="text-base font-bold text-foreground">Your Privacy Matters</Text>
              <Text className="text-xs text-muted leading-relaxed">
                ConvertTree is built on a simple principle: your files are yours alone. Files are converted on ConvertTree's own secure server — not sent to any third-party cloud service or external API — and deleted immediately after conversion.
              </Text>

              {[
                { title: "Server-Side Processing, No Third Parties", body: "Files are sent to ConvertTree's own server for conversion. They are never routed to external cloud services, third-party APIs, or AI services." },
                { title: "No File Storage", body: "We never store your files. Temporary files are automatically deleted immediately after conversion completes." },
                { title: "No Account Required", body: "Conversion works without signing in. An optional account lets you access additional features." },
                { title: "Local History Only", body: "Your conversion history is stored on your device only — never on our servers." },
                { title: "No Tracking or Analytics", body: "We don't track your activity, analyze your files, or sell your data." },
              ].map(({ title, body }) => (
                <View key={title} className="flex-row gap-2">
                  <Text style={{ color: colors.success }} className="text-sm font-bold mt-0.5">✓</Text>
                  <View className="flex-1">
                    <Text className="text-xs font-bold text-foreground">{title}</Text>
                    <Text className="text-xs text-muted mt-0.5 leading-relaxed">{body}</Text>
                  </View>
                </View>
              ))}

              <View
                className="rounded-xl p-3 mt-1"
                style={{ backgroundColor: `${colors.primary}12` }}
              >
                <Text className="text-xs font-bold" style={{ color: colors.primary }}>Security Guarantee</Text>
                <Text className="text-xs text-muted mt-1 leading-relaxed">
                  All conversions are processed securely on ConvertTree's own servers. Files are never stored, never shared with third parties, and automatically deleted after conversion completes.
                </Text>
              </View>

              <View className="gap-1.5 mt-1">
                {[
                  "We don't sell or share your data",
                  "We don't track your activity",
                  "We don't send files to third-party services or AI",
                  "We don't store files after conversion",
                  "We don't require an account to convert files",
                ].map((item) => (
                  <View key={item} className="flex-row gap-2 items-center">
                    <Text style={{ color: colors.error }} className="text-xs font-bold">✗</Text>
                    <Text className="text-xs text-muted">{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
