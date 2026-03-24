import { ScrollView, Text, View, TouchableOpacity, FlatList, ActivityIndicator, Alert } from "react-native";
import { router } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useBatch, BatchItem } from "@/lib/batch-context";
import { ConversionFile } from "@/lib/conversion-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { trpc } from "@/lib/trpc";
import * as Haptics from "expo-haptics";
import { useState } from "react";

const SUPPORTED_FORMATS = ["txt", "md", "docx", "pdf", "png", "jpg", "jpeg"];
const CONVERSION_MAP: Record<string, string[]> = {
  txt: ["md", "docx", "pdf"],
  md: ["txt", "docx", "pdf"],
  docx: ["txt", "md", "pdf"],
  pdf: ["txt", "md", "docx", "png", "jpg"],
  png: ["pdf", "jpg"],
  jpg: ["pdf", "png"],
  jpeg: ["pdf", "png"],
};

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

    const fileInfo = await FileSystem.getInfoAsync(file.uri);
    const size = (fileInfo as any).size || 0;
    const nameWithoutPath = file.name || "file";
    const format = nameWithoutPath.split(".").pop()?.toLowerCase() || "unknown";

    if (!SUPPORTED_FORMATS.includes(format)) {
      throw new Error(`Unsupported file format: .${format}`);
    }

    return { uri: file.uri, name: nameWithoutPath, size, format };
  } catch (error) {
    console.error("Error picking file:", error);
    throw error;
  }
}

export default function BatchConversionScreen() {
  const { batchItems, addBatchItem, removeBatchItem, clearBatch, updateBatchItemStatus } = useBatch();
  const colors = useColors();
  const convertMutation = trpc.conversion.convert.useMutation();
  const [isConverting, setIsConverting] = useState(false);

  const handleAddFile = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const file = await pickFile();
      if (file) {
        // Default to PDF as output
        const defaultOutput = CONVERSION_MAP[file.format]?.[0] || "pdf";
        addBatchItem(file, defaultOutput);
      }
    } catch (error) {
      console.error("File selection error:", error);
    }
  };

  const handleConvertBatch = async () => {
    const pending = batchItems.filter((item) => item.status === "pending");
    if (pending.length === 0) {
      Alert.alert("Nothing to convert", "Add files to the batch first.");
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setIsConverting(true);

      for (const item of pending) {
        updateBatchItemStatus(item.id, "converting");
        try {
          const fileBase64 = await FileSystem.readAsStringAsync(item.inputFile.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });

          const result = await convertMutation.mutateAsync({
            inputFormat: item.inputFile.format,
            outputFormat: item.outputFormat,
            fileBase64,
            fileName: item.inputFile.name,
          });

          if (result.success) {
            const convertedFile: ConversionFile = {
              uri: `data:application/octet-stream;base64,${result.fileBase64}`,
              name: `converted_${Date.now()}.${item.outputFormat}`,
              size: result.fileBase64.length,
              format: item.outputFormat,
            };
            updateBatchItemStatus(item.id, "success", convertedFile);
          }
        } catch (error) {
          const msg = error instanceof Error ? error.message : "Conversion failed";
          updateBatchItemStatus(item.id, "error", undefined, msg);
        }
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Batch conversion error:", error);
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownloadAll = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const successItems = batchItems.filter((item) => item.status === "success" && item.convertedFile);

      if (successItems.length === 0) {
        Alert.alert("No files ready", "Convert files first before downloading.");
        return;
      }

      for (const item of successItems) {
        if (item.convertedFile) {
          const fileName = `converted_${Date.now()}.${item.convertedFile.format}`;
          const fileUri = `${FileSystem.documentDirectory}${fileName}`;

          if (item.convertedFile.uri.startsWith("data:")) {
            const base64Data = item.convertedFile.uri.split(",")[1];
            await FileSystem.writeAsStringAsync(fileUri, base64Data, {
              encoding: FileSystem.EncodingType.Base64,
            });
          }
        }
      }

      Alert.alert("Downloaded", `${successItems.length} file(s) saved successfully.`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Download error:", error);
      Alert.alert("Error", "Failed to download files");
    }
  };

  const getStatusColor = (status: BatchItem["status"]) => {
    switch (status) {
      case "success": return colors.success;
      case "error": return colors.error;
      case "converting": return colors.primary;
      default: return colors.muted;
    }
  };

  const getStatusLabel = (status: BatchItem["status"]) => {
    switch (status) {
      case "success": return "Done";
      case "error": return "Failed";
      case "converting": return "Converting...";
      default: return "Pending";
    }
  };

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="flex-1 gap-6">

          {/* Header */}
          <View className="mt-2">
            <Text className="text-4xl font-bold text-foreground">Batch Convert</Text>
            <Text className="text-sm text-muted mt-2">Convert multiple files at once</Text>
          </View>

          {/* Add File Button */}
          <TouchableOpacity
            onPress={handleAddFile}
            disabled={isConverting}
            className="rounded-3xl py-4 px-6 items-center flex-row justify-center gap-3 border-2"
            style={{
              borderColor: colors.primary,
              backgroundColor: `${colors.primary}10`,
              opacity: isConverting ? 0.5 : 1,
            }}
          >
            <IconSymbol name="square.stack.fill" size={20} color={colors.primary} />
            <Text className="font-bold text-lg" style={{ color: colors.primary }}>
              Add File
            </Text>
          </TouchableOpacity>

          {/* Batch Items List */}
          {batchItems.length > 0 ? (
            <View>
              <Text className="text-lg font-bold text-foreground mb-3">
                {batchItems.length} file{batchItems.length !== 1 ? "s" : ""}
              </Text>
              <FlatList
                data={batchItems}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <View
                    className="rounded-2xl p-4 mb-3 border-2 flex-row items-center"
                    style={{ borderColor: colors.border, backgroundColor: colors.surface }}
                  >
                    {/* Status dot */}
                    <View
                      className="w-2 h-2 rounded-full mr-3"
                      style={{ backgroundColor: getStatusColor(item.status) }}
                    />

                    <View className="flex-1">
                      <Text className="font-bold text-foreground" numberOfLines={1}>
                        {item.inputFile.name}
                      </Text>
                      <Text className="text-xs text-muted mt-1">
                        .{item.inputFile.format.toUpperCase()} → .{item.outputFormat.toUpperCase()}
                      </Text>
                      <Text
                        className="text-xs mt-1 font-semibold"
                        style={{ color: getStatusColor(item.status) }}
                      >
                        {item.status === "converting" ? (
                          <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                          getStatusLabel(item.status)
                        )}
                      </Text>
                    </View>

                    {item.status !== "converting" && (
                      <TouchableOpacity
                        onPress={() => removeBatchItem(item.id)}
                        className="ml-2 p-2"
                        style={{ opacity: 0.5 }}
                      >
                        <Text className="text-foreground font-bold">✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              />
            </View>
          ) : (
            <View
              className="rounded-2xl p-8 items-center gap-3"
              style={{ backgroundColor: colors.surface }}
            >
              <IconSymbol name="square.stack.fill" size={40} color={colors.muted} />
              <Text className="text-sm text-muted text-center">
                No files added yet. Tap "Add File" to get started.
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          {batchItems.length > 0 && (
            <View className="gap-3">
              <TouchableOpacity
                onPress={handleConvertBatch}
                disabled={isConverting}
                className="rounded-3xl py-5 items-center flex-row justify-center gap-3 active:opacity-90"
                style={{
                  backgroundColor: colors.primary,
                  opacity: isConverting ? 0.6 : 1,
                }}
              >
                {isConverting ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <IconSymbol name="arrow.left.arrow.right" size={20} color="white" />
                )}
                <Text className="text-white font-bold text-lg">
                  {isConverting ? "Converting..." : "Convert All"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleDownloadAll}
                disabled={isConverting}
                className="rounded-3xl py-5 items-center flex-row justify-center gap-3 border-2 active:opacity-70"
                style={{
                  borderColor: colors.primary,
                  backgroundColor: `${colors.primary}10`,
                  opacity: isConverting ? 0.5 : 1,
                }}
              >
                <IconSymbol name="tray.and.arrow.down.fill" size={20} color={colors.primary} />
                <Text className="font-bold text-lg" style={{ color: colors.primary }}>
                  Download All
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={clearBatch}
                disabled={isConverting}
                className="rounded-3xl py-5 items-center border-2 active:opacity-70"
                style={{
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  opacity: isConverting ? 0.5 : 1,
                }}
              >
                <Text className="font-bold text-lg text-foreground">Clear List</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
