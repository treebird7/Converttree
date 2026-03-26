import { Image, Text, View, Platform } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { ConversionFile } from "@/lib/conversion-context";

const IMAGE_FORMATS = ["png", "jpg", "jpeg"];

const FORMAT_COLORS: Record<string, string> = {
  pdf: "#E53E3E",
  docx: "#2B6CB0",
  txt: "#718096",
  md: "#6B46C1",
  png: "#2F855A",
  jpg: "#DD6B20",
  jpeg: "#DD6B20",
};

interface FilePreviewThumbnailProps {
  file: ConversionFile;
  size?: number;
}

export function FilePreviewThumbnail({ file, size = 80 }: FilePreviewThumbnailProps) {
  const colors = useColors();
  const isImage = IMAGE_FORMATS.includes(file.format);

  if (isImage) {
    // On web, base64 is pre-read; on native, URI works directly
    const imageSource =
      Platform.OS === "web" && file.base64
        ? { uri: `data:image/${file.format};base64,${file.base64}` }
        : { uri: file.uri };

    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: 12,
          overflow: "hidden",
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Image
          source={imageSource}
          style={{ width: size, height: size }}
          resizeMode="cover"
        />
      </View>
    );
  }

  // Document: coloured badge with format label
  const badgeColor = FORMAT_COLORS[file.format] ?? colors.primary;
  const label = file.format.toUpperCase();

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 12,
        backgroundColor: `${badgeColor}18`,
        borderWidth: 2,
        borderColor: `${badgeColor}40`,
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
      }}
    >
      {/* Folded-corner document icon via nested views */}
      <View style={{ alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: size * 0.36, lineHeight: size * 0.4 }}>📄</Text>
      </View>
      <View
        style={{
          backgroundColor: badgeColor,
          borderRadius: 4,
          paddingHorizontal: 5,
          paddingVertical: 1,
        }}
      >
        <Text style={{ color: "#fff", fontSize: 9, fontWeight: "800", letterSpacing: 0.5 }}>
          {label}
        </Text>
      </View>
    </View>
  );
}
