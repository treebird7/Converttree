import { View, Text, ActivityIndicator, TouchableOpacity, Platform } from "react-native";
import { useEffect, useState } from "react";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useConversion, ConversionFile } from "@/lib/conversion-context";
import { useHistory } from "@/lib/history-context";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import * as FileSystem from "expo-file-system/legacy";
import * as Haptics from "expo-haptics";
import { trpc } from "@/lib/trpc";

type ScreenState = "converting" | "error";

export default function ConversionProgressScreen() {
  const { inputFile, outputFormat, setIsConverting, setConvertedFile, setError } = useConversion();
  const { addToHistory } = useHistory();
  const colors = useColors();
  const convertMutation = trpc.conversion.convert.useMutation();
  const [screenState, setScreenState] = useState<ScreenState>("converting");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    performConversion();
  }, []);

  const performConversion = async () => {
    if (!inputFile || !outputFormat) {
      showError("No file or output format selected. Please go back and try again.");
      return;
    }

    setScreenState("converting");
    setErrorMessage("");

    try {
      setIsConverting(true);

      // Read file as base64 — use pre-read base64 on web (FileSystem can't read blob: URIs)
      let fileBase64: string;
      if (inputFile.base64) {
        fileBase64 = inputFile.base64;
      } else {
        fileBase64 = await FileSystem.readAsStringAsync(inputFile.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }

      // Call conversion API
      const result = await convertMutation.mutateAsync({
        inputFormat: inputFile.format,
        outputFormat: outputFormat,
        fileBase64,
        fileName: inputFile.name,
      });

      if (result.success) {
        const convertedFile: ConversionFile = {
          uri: `data:application/octet-stream;base64,${result.fileBase64}`,
          name: result.fileName || `converted_${Date.now()}.${outputFormat}`,
          size: result.fileBase64.length,
          format: result.outputFormat || outputFormat,
        };

        setConvertedFile(convertedFile);
        setIsConverting(false);

        // Save to history
        await addToHistory({
          inputFileName: inputFile.name,
          inputFormat: inputFile.format,
          outputFormat: outputFormat,
          success: true,
        });

        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.push("/(tabs)/conversion-result" as any);
      } else {
        throw new Error("Conversion returned unsuccessful result");
      }
    } catch (error) {
      const raw = error instanceof Error ? error.message : String(error);
      // Make the error message user-friendly
      let friendly = raw;
      if (raw.includes("TRPC") || raw.includes("fetch")) {
        friendly = "Could not reach the conversion server. Please check your connection and try again.";
      } else if (raw.includes("Unsupported") || raw.includes("unsupported")) {
        friendly = `This file type cannot be converted to .${outputFormat?.toUpperCase()}. Please choose a different format.`;
      } else if (raw.includes("timeout") || raw.includes("Timeout")) {
        friendly = "Conversion timed out. The file may be too large. Please try a smaller file.";
      } else if (raw.includes("pandoc") || raw.includes("Pandoc")) {
        friendly = "Document conversion failed. The file may be corrupted or in an unsupported format.";
      }

      showError(friendly);
      setIsConverting(false);

      if (inputFile && outputFormat) {
        await addToHistory({
          inputFileName: inputFile.name,
          inputFormat: inputFile.format,
          outputFormat: outputFormat,
          success: false,
        });
      }

      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const showError = (message: string) => {
    setErrorMessage(message);
    setScreenState("error");
    setError(message);
  };

  const handleRetry = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    performConversion();
  };

  const handleGoBack = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  if (screenState === "error") {
    return (
      <ScreenContainer className="items-center justify-center p-6">
        <View className="gap-8 items-center w-full max-w-sm">
          {/* Error Icon */}
          <View
            className="w-24 h-24 rounded-full items-center justify-center"
            style={{ backgroundColor: `${colors.error}20` }}
          >
            <IconSymbol name="xmark.circle.fill" size={52} color={colors.error} />
          </View>

          {/* Error Text */}
          <View className="gap-3 items-center">
            <Text className="text-2xl font-bold text-foreground text-center">Conversion Failed</Text>
            <View
              className="rounded-2xl p-4 border-2 w-full"
              style={{ borderColor: colors.error, backgroundColor: `${colors.error}10` }}
            >
              <Text className="text-sm text-foreground text-center leading-relaxed">
                {errorMessage}
              </Text>
            </View>
          </View>

          {/* Conversion info */}
          {inputFile && outputFormat && (
            <View
              className="rounded-2xl p-4 border-2 w-full"
              style={{ borderColor: colors.border, backgroundColor: colors.surface }}
            >
              <Text className="text-xs text-muted text-center">
                Attempted: <Text className="font-semibold text-foreground">{inputFile.name}</Text>
              </Text>
              <Text className="text-xs text-muted text-center mt-1">
                .{inputFile.format.toUpperCase()} → .{outputFormat.toUpperCase()}
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <View className="gap-3 w-full">
            <TouchableOpacity
              onPress={handleRetry}
              className="rounded-3xl py-4 items-center flex-row justify-center gap-2 active:opacity-90"
              style={{ backgroundColor: colors.primary }}
            >
              <IconSymbol name="arrow.2.squarepath" size={18} color="white" />
              <Text className="text-white font-bold text-base">Try Again</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleGoBack}
              className="rounded-3xl py-4 items-center flex-row justify-center gap-2 border-2 active:opacity-70"
              style={{ borderColor: colors.border, backgroundColor: colors.surface }}
            >
              <IconSymbol name="chevron.left" size={18} color={colors.foreground} />
              <Text className="font-bold text-base text-foreground">Change Format</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="items-center justify-center">
      <View className="gap-8 items-center px-8">
        {/* Animated spinner */}
        <View
          className="w-24 h-24 rounded-full items-center justify-center"
          style={{ backgroundColor: `${colors.primary}20` }}
        >
          <ActivityIndicator size="large" color={colors.primary} />
        </View>

        <View className="gap-2 items-center">
          <Text className="text-2xl font-bold text-foreground">Converting...</Text>
          <Text className="text-sm text-muted text-center leading-relaxed">
            {inputFile?.name}
          </Text>
          <Text className="text-xs text-muted text-center">
            .{inputFile?.format?.toUpperCase()} to .{outputFormat?.toUpperCase()}
          </Text>
        </View>

        <View
          className="rounded-2xl p-4 border-2 w-full"
          style={{ borderColor: colors.border, backgroundColor: colors.surface }}
        >
          <Text className="text-xs text-muted text-center leading-relaxed">
            This may take a moment depending on file size.
          </Text>
        </View>
      </View>
    </ScreenContainer>
  );
}
