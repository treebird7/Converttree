import { ScrollView, Text, View, TouchableOpacity, Image, Platform, Alert } from "react-native";
import { router } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { ScreenContainer } from "@/components/screen-container";
import { useConversion, ConversionFile } from "@/lib/conversion-context";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

const SUPPORTED_FORMATS = ["txt", "md", "docx", "pdf", "png", "jpg", "jpeg"];

/** Read a file as base64 — works on both native (FileSystem) and web (fetch blob URL) */
async function readFileAsBase64(uri: string): Promise<string> {
  if (Platform.OS === "web") {
    // On web, DocumentPicker returns a blob: URL — use fetch to read it
    const response = await fetch(uri);
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        // dataUrl is "data:<mime>;base64,<data>" — strip the prefix
        const base64 = dataUrl.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
  // Native: use expo-file-system
  return await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
}

async function pickFile(): Promise<ConversionFile | null> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        "text/plain",
        "text/markdown",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/pdf",
        "image/png",
        "image/jpeg",
      ],
    });

    if (result.canceled) return null;

    const file = result.assets[0];
    if (!file.uri) return null;

    const nameWithoutPath = file.name || "file";
    const format = nameWithoutPath.split(".").pop()?.toLowerCase() || "unknown";

    if (!SUPPORTED_FORMATS.includes(format)) {
      throw new Error(`Unsupported file format: .${format}`);
    }

    const size = file.size || 0;

    // Pre-read base64 on web so conversion-progress doesn't need FileSystem
    let base64: string | undefined;
    if (Platform.OS === "web") {
      base64 = await readFileAsBase64(file.uri);
    }

    return { uri: file.uri, name: nameWithoutPath, size, format, base64 };
  } catch (error) {
    console.error("Error picking file:", error);
    throw error;
  }
}

export default function HomeScreen() {
  const { setInputFile } = useConversion();
  const colors = useColors();

  const handleSelectFile = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const file = await pickFile();
      if (file) {
        setInputFile(file);
        router.push("/(tabs)/format-selection" as any);
      }
    } catch (error) {
      console.error("File selection error:", error);
    }
  };

  const handleQuickConversion = async (targetFormat: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const file = await pickFile();
      if (file) {
        setInputFile(file);
        router.push({
          pathname: "/(tabs)/format-selection" as any,
          params: { autoSelectFormat: targetFormat },
        });
      }
    } catch (error) {
      console.error("Quick conversion error:", error);
    }
  };

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="flex-1 gap-6">

          {/* Hero Section */}
          <View className="items-center gap-3 mt-4">
            {/* Tree Logo - large, with background matching app */}
            <View
              style={{
                width: 220,
                height: 220,
                borderRadius: 44,
                backgroundColor: colors.background,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.18,
                shadowRadius: 16,
                elevation: 6,
              }}
            >
              <Image
                source={require("@/assets/images/icon.png")}
                style={{ width: 208, height: 208, borderRadius: 40 }}
                resizeMode="cover"
              />
            </View>

            {/* Decorative divider */}
            <View className="h-0.5 w-12 rounded-full mt-2" style={{ backgroundColor: colors.primary }} />

            <Text className="text-base text-muted text-center">Transform freely</Text>

            <View className="h-0.5 w-12 rounded-full" style={{ backgroundColor: colors.success }} />
          </View>

          {/* Main Action Button */}
          <TouchableOpacity
            onPress={handleSelectFile}
            className="rounded-3xl py-5 px-8 items-center active:opacity-90"
            style={{ backgroundColor: colors.primary }}
          >
            <Text className="text-white font-bold text-lg">Choose File</Text>
            <Text className="text-white/80 text-xs mt-1">Pick any document or image</Text>
          </TouchableOpacity>

          {/* Supported Formats Card */}
          <View
            className="rounded-3xl p-5 border-2"
            style={{ borderColor: colors.border, backgroundColor: colors.surface }}
          >
            <Text className="text-sm font-bold text-foreground mb-3">What We Convert</Text>
            <View className="gap-2">
              <View className="flex-row items-center gap-2">
                <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.primary }} />
                <Text className="text-xs text-muted">
                  <Text className="font-semibold text-foreground">Documents:</Text>{"  "}.txt, .md, .docx, .pdf
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.primary }} />
                <Text className="text-xs text-muted">
                  <Text className="font-semibold text-foreground">Images:</Text>{"  "}.png, .jpg, .jpeg
                </Text>
              </View>
            </View>
          </View>

          {/* Quick Conversions */}
          <View className="gap-3">
            <Text className="text-lg font-bold text-foreground">Quick Conversions</Text>

            <TouchableOpacity
              onPress={() => handleQuickConversion("pdf")}
              className="rounded-2xl p-4 border-2 active:opacity-70"
              style={{ borderColor: colors.border, backgroundColor: colors.surface }}
            >
              <Text className="font-bold text-foreground">Convert to PDF</Text>
              <Text className="text-xs text-muted mt-1">From documents or images</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleQuickConversion("docx")}
              className="rounded-2xl p-4 border-2 active:opacity-70"
              style={{ borderColor: colors.border, backgroundColor: colors.surface }}
            >
              <Text className="font-bold text-foreground">Convert to Word</Text>
              <Text className="text-xs text-muted mt-1">From text, markdown, or PDF</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleQuickConversion("md")}
              className="rounded-2xl p-4 border-2 active:opacity-70"
              style={{ borderColor: colors.border, backgroundColor: colors.surface }}
            >
              <Text className="font-bold text-foreground">Convert to Markdown</Text>
              <Text className="text-xs text-muted mt-1">From text, Word, or PDF</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleQuickConversion("txt")}
              className="rounded-2xl p-4 border-2 active:opacity-70"
              style={{ borderColor: colors.success, backgroundColor: `${colors.success}10` }}
            >
              <Text className="font-bold text-foreground">Convert to Text</Text>
              <Text className="text-xs text-muted mt-1">Extract plain text from PDF, Word, or Markdown</Text>
            </TouchableOpacity>
          </View>

          {/* Tip Card */}
          <View
            className="rounded-2xl p-4 border-2"
            style={{ borderColor: colors.success, backgroundColor: `${colors.success}15` }}
          >
            <Text className="text-xs text-foreground leading-relaxed">
              <Text className="font-bold">Privacy:</Text>{"  "}Files are uploaded to our server for conversion and deleted immediately afterward. No files are stored. Conversion history is saved locally on your device only.
            </Text>
          </View>

          <View className="items-center pb-4">
            <Text className="text-xs text-muted">ConvertTree</Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
