import { ScrollView, Text, View, TouchableOpacity, FlatList } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useConversion } from "@/lib/conversion-context";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";
import { trpc } from "@/lib/trpc";

const CONVERSION_MAP: Record<string, string[]> = {
  txt: ["md", "docx", "pdf"],
  md: ["txt", "docx", "pdf"],
  docx: ["txt", "md", "pdf"],
  pdf: ["txt", "md", "docx", "png", "jpg"],
  png: ["pdf", "jpg"],
  jpg: ["pdf", "png"],
  jpeg: ["pdf", "png"],
};

export default function FormatSelectionScreen() {
  const { inputFile, setOutputFormat, outputFormat } = useConversion();
  const params = useLocalSearchParams();
  const colors = useColors();

  const { data: supportedFormats } = trpc.conversion.supportedFormats.useQuery();

  if (!inputFile) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Text className="text-foreground">No file selected</Text>
      </ScreenContainer>
    );
  }

  const availableFormats = CONVERSION_MAP[inputFile.format] || [];

  const handleFormatSelect = (format: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOutputFormat(format);
  };

  const handleConvert = () => {
    if (!outputFormat) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/(tabs)/conversion-progress" as any);
  };

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="flex-1 gap-6">

          {/* Header */}
          <View>
            <TouchableOpacity onPress={() => router.back()} className="mb-4 flex-row items-center gap-2">
              <Text className="text-xl font-bold" style={{ color: colors.primary }}>←</Text>
              <Text className="font-semibold" style={{ color: colors.primary }}>Back</Text>
            </TouchableOpacity>

            <Text className="text-4xl font-bold text-foreground">Choose Format</Text>
            <Text className="text-sm text-muted mt-2">What would you like to convert to?</Text>
          </View>

          {/* Input File Info */}
          <View
            className="rounded-3xl p-4 border-2"
            style={{ borderColor: colors.border, backgroundColor: colors.surface }}
          >
            <Text className="text-xs text-muted uppercase tracking-wider font-bold">Your File</Text>
            <Text className="text-lg font-bold text-foreground mt-2">{inputFile.name}</Text>
            <View className="flex-row mt-3 gap-6">
              <View>
                <Text className="text-xs text-muted">Format</Text>
                <Text className="font-bold text-foreground mt-1">.{inputFile.format.toUpperCase()}</Text>
              </View>
              <View>
                <Text className="text-xs text-muted">Size</Text>
                <Text className="font-bold text-foreground mt-1">{(inputFile.size / 1024).toFixed(1)} KB</Text>
              </View>
            </View>
          </View>

          {/* Format Selection */}
          <View>
            <Text className="text-lg font-bold text-foreground mb-3">Available Formats</Text>
            <FlatList
              data={availableFormats}
              keyExtractor={(item) => item}
              scrollEnabled={false}
              renderItem={({ item: format }) => (
                <TouchableOpacity
                  onPress={() => handleFormatSelect(format)}
                  className="rounded-2xl p-4 mb-3 border-2"
                  style={{
                    borderColor: outputFormat === format ? colors.primary : colors.border,
                    backgroundColor:
                      outputFormat === format ? `${colors.primary}15` : colors.surface,
                  }}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text
                        className="text-lg font-bold"
                        style={{
                          color: outputFormat === format ? colors.primary : colors.foreground,
                        }}
                      >
                        .{format.toUpperCase()}
                      </Text>
                      <Text className="text-xs text-muted mt-1">
                        {getFormatDescription(format)}
                      </Text>
                    </View>
                    {outputFormat === format && (
                      <View
                        className="w-6 h-6 rounded-full items-center justify-center"
                        style={{ backgroundColor: colors.primary }}
                      >
                        <Text className="text-white text-xs font-bold">✓</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>

          {/* Note Card */}
          <View
            className="rounded-2xl p-4 border-2"
            style={{ borderColor: colors.warning, backgroundColor: `${colors.warning}15` }}
          >
            <Text className="text-xs text-foreground leading-relaxed">
              <Text className="font-bold">Note:</Text>{"  "}ConvertTree preserves your file's content and structure during conversion.
            </Text>
          </View>

          {/* Convert Button */}
          <TouchableOpacity
            onPress={handleConvert}
            disabled={!outputFormat}
            className="rounded-3xl py-5 items-center"
            style={{
              backgroundColor: outputFormat ? colors.primary : colors.muted,
              opacity: outputFormat ? 1 : 0.5,
            }}
          >
            <Text className="text-white font-bold text-lg">
              Convert to .{outputFormat?.toUpperCase() || "FORMAT"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function getFormatDescription(format: string): string {
  const descriptions: Record<string, string> = {
    txt: "Plain text document",
    md: "Markdown format",
    docx: "Microsoft Word document",
    pdf: "Portable Document Format",
    png: "PNG image",
    jpg: "JPEG image",
    jpeg: "JPEG image",
  };
  return descriptions[format] || format;
}
