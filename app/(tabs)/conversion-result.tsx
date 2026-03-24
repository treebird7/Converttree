import { View, Text, TouchableOpacity, ScrollView, Alert, Platform } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useConversion } from "@/lib/conversion-context";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as Haptics from "expo-haptics";

export default function ConversionResultScreen() {
  const { convertedFile, inputFile, reset } = useConversion();
  const colors = useColors();

  if (!convertedFile) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Text className="text-foreground">No converted file available</Text>
      </ScreenContainer>
    );
  }

  const handleDownload = async () => {
    try {
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const fileName = convertedFile.name || `converted_${Date.now()}.${convertedFile.format}`;

      if (Platform.OS === "web") {
        // Web: use Blob + createObjectURL — works inside iframes unlike data: URLs
        const base64Data = convertedFile.uri.startsWith("data:")
          ? convertedFile.uri.split(",")[1]
          : convertedFile.uri;
        const mimeType = getMimeType(convertedFile.format);
        const byteChars = atob(base64Data);
        const byteNums = new Uint8Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) byteNums[i] = byteChars.charCodeAt(i);
        const blob = new Blob([byteNums], { type: mimeType });
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = fileName;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
        }, 1000);
        return;
      }

      // Native: save to document directory
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      if (convertedFile.uri.startsWith("data:")) {
        const base64Data = convertedFile.uri.split(",")[1];
        await FileSystem.writeAsStringAsync(fileUri, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });
      } else {
        await FileSystem.copyAsync({ from: convertedFile.uri, to: fileUri });
      }

      Alert.alert("Saved", `File saved as ${fileName}`, [{ text: "OK" }]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Download error:", error);
      Alert.alert("Error", "Failed to save file");
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleShare = async () => {
    try {
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      if (Platform.OS === "web") {
        // Web: use Web Share API if available, otherwise fall back to download
        const base64Data = convertedFile.uri.startsWith("data:")
          ? convertedFile.uri.split(",")[1]
          : convertedFile.uri;
        const mimeType = getMimeType(convertedFile.format);
        const fileName = convertedFile.name || `converted_${Date.now()}.${convertedFile.format}`;
        const byteChars = atob(base64Data);
        const byteNums = new Uint8Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) byteNums[i] = byteChars.charCodeAt(i);
        const blob = new Blob([byteNums], { type: mimeType });
        const file = new File([blob], fileName, { type: mimeType });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: fileName });
        } else {
          // Fallback: trigger download
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = blobUrl;
          link.download = fileName;
          link.target = "_blank";
          document.body.appendChild(link);
          link.click();
          setTimeout(() => { document.body.removeChild(link); URL.revokeObjectURL(blobUrl); }, 1000);
          Alert.alert("Downloaded", "Web Share not available — file downloaded instead.");
        }
        return;
      }

      const fileName = `converted_${Date.now()}.${convertedFile.format}`;
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

      if (convertedFile.uri.startsWith("data:")) {
        const base64Data = convertedFile.uri.split(",")[1];
        await FileSystem.writeAsStringAsync(fileUri, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });
      } else {
        await FileSystem.copyAsync({ from: convertedFile.uri, to: fileUri });
      }

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: getMimeType(convertedFile.format),
          dialogTitle: `Share ${fileName}`,
        });
      } else {
        Alert.alert("Error", "Sharing is not available on this device");
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Share error:", error);
      Alert.alert("Error", "Failed to share file");
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleConvertAnother = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    reset();
    router.push("/(tabs)" as any);
  };

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="flex-1 gap-6">

          {/* Success Header */}
          <View className="items-center gap-3 mt-4">
            <View
              className="w-20 h-20 rounded-full items-center justify-center"
              style={{ backgroundColor: `${colors.success}25` }}
            >
              <IconSymbol name="checkmark.circle.fill" size={48} color={colors.success} />
            </View>
            <Text className="text-4xl font-bold text-foreground text-center">Done!</Text>
            <Text className="text-sm text-muted text-center">Your file has been converted</Text>
          </View>

          {/* Conversion Summary */}
          <View className="gap-3">
            <View
              className="rounded-3xl p-4 border-2"
              style={{ borderColor: colors.border, backgroundColor: colors.surface }}
            >
              <Text className="text-xs text-muted uppercase tracking-wider font-bold">From</Text>
              <Text className="text-lg font-bold text-foreground mt-2">{inputFile?.name}</Text>
              <Text className="text-xs text-muted mt-1">
                .{inputFile?.format?.toUpperCase()}{"  "}·{"  "}{((inputFile?.size || 0) / 1024).toFixed(1)} KB
              </Text>
            </View>

            <View className="items-center">
              <View
                className="w-8 h-8 rounded-full items-center justify-center"
                style={{ backgroundColor: `${colors.primary}20` }}
              >
                <Text className="font-bold" style={{ color: colors.primary }}>↓</Text>
              </View>
            </View>

            <View
              className="rounded-3xl p-4 border-2"
              style={{ borderColor: colors.success, backgroundColor: `${colors.success}10` }}
            >
              <Text className="text-xs text-muted uppercase tracking-wider font-bold">To</Text>
              <Text className="text-lg font-bold text-foreground mt-2">{convertedFile.name}</Text>
              <Text className="text-xs text-muted mt-1">
                .{convertedFile.format.toUpperCase()}{"  "}·{"  "}{(convertedFile.size / 1024).toFixed(1)} KB
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="gap-3">
            <TouchableOpacity
              onPress={handleDownload}
              className="rounded-3xl py-5 items-center flex-row justify-center gap-3 active:opacity-90"
              style={{ backgroundColor: colors.primary }}
            >
              <IconSymbol name="tray.and.arrow.down.fill" size={20} color="white" />
              <Text className="text-white font-bold text-lg">Download File</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleShare}
              className="rounded-3xl py-5 items-center flex-row justify-center gap-3 border-2 active:opacity-70"
              style={{ borderColor: colors.primary, backgroundColor: `${colors.primary}10` }}
            >
              <IconSymbol name="square.and.arrow.up" size={20} color={colors.primary} />
              <Text className="font-bold text-lg" style={{ color: colors.primary }}>
                Share File
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleConvertAnother}
              className="rounded-3xl py-5 items-center flex-row justify-center gap-3 border-2 active:opacity-70"
              style={{ borderColor: colors.border, backgroundColor: colors.surface }}
            >
              <IconSymbol name="arrow.2.squarepath" size={20} color={colors.foreground} />
              <Text className="font-bold text-lg text-foreground">Convert Another</Text>
            </TouchableOpacity>
          </View>

          {/* Tip */}
          <View
            className="rounded-2xl p-4 border-2"
            style={{ borderColor: colors.success, backgroundColor: `${colors.success}10` }}
          >
            <Text className="text-xs text-foreground leading-relaxed">
              <Text className="font-bold">Tip:</Text>{"  "}You can find all your past conversions in the History tab.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function getMimeType(format: string): string {
  const mimeTypes: Record<string, string> = {
    txt: "text/plain",
    md: "text/markdown",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    pdf: "application/pdf",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
  };
  return mimeTypes[format] || "application/octet-stream";
}
