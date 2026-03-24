import { ScrollView, Text, View, TouchableOpacity, FlatList, Alert } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useHistory } from "@/lib/history-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import * as Haptics from "expo-haptics";
import { useCallback } from "react";

export default function HistoryScreen() {
  const { history, clearHistory, removeFromHistory, loadHistory } = useHistory();
  const colors = useColors();

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  const handleClearHistory = () => {
    Alert.alert(
      "Clear History",
      "This will delete all conversion history. This action cannot be undone.",
      [
        { text: "Cancel" },
        {
          text: "Clear",
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await clearHistory();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
          style: "destructive",
        },
      ]
    );
  };

  const handleRemoveItem = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await removeFromHistory(id);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="flex-1 gap-6">

          {/* Header */}
          <View className="mt-2">
            <Text className="text-4xl font-bold text-foreground">History</Text>
            <Text className="text-sm text-muted mt-2">Your recent conversions</Text>
          </View>

          {history.length > 0 ? (
            <>
              <View>
                <Text className="text-lg font-bold text-foreground mb-3">
                  {history.length} conversion{history.length !== 1 ? "s" : ""}
                </Text>
                <FlatList
                  data={history}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  renderItem={({ item }) => (
                    <View
                      className="rounded-2xl p-4 mb-3 border-2 flex-row items-center"
                      style={{ borderColor: colors.border, backgroundColor: colors.surface }}
                    >
                      {/* Status indicator */}
                      <View
                        className="w-8 h-8 rounded-full items-center justify-center mr-3"
                        style={{
                          backgroundColor: item.success
                            ? `${colors.success}20`
                            : `${colors.error}20`,
                        }}
                      >
                        <IconSymbol
                          name={item.success ? "checkmark.circle.fill" : "arrow.2.squarepath"}
                          size={16}
                          color={item.success ? colors.success : colors.error}
                        />
                      </View>

                      <View className="flex-1">
                        <Text className="font-bold text-foreground" numberOfLines={1}>
                          {item.inputFileName}
                        </Text>
                        <Text className="text-xs text-muted mt-1">
                          .{item.inputFormat.toUpperCase()} → .{item.outputFormat.toUpperCase()}
                        </Text>
                        <Text className="text-xs text-muted mt-0.5">{formatDate(item.timestamp)}</Text>
                      </View>

                      <TouchableOpacity
                        onPress={() => handleRemoveItem(item.id)}
                        className="ml-2 p-2"
                        style={{ opacity: 0.5 }}
                      >
                        <Text className="text-foreground font-bold">✕</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                />
              </View>

              <TouchableOpacity
                onPress={handleClearHistory}
                className="rounded-3xl py-4 items-center border-2 active:opacity-70"
                style={{ borderColor: colors.error, backgroundColor: `${colors.error}10` }}
              >
                <Text className="font-bold text-lg" style={{ color: colors.error }}>
                  Clear All History
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <View className="flex-1 items-center justify-center gap-4 mt-16">
              <View
                className="w-20 h-20 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.surface }}
              >
                <IconSymbol name="clock.fill" size={36} color={colors.muted} />
              </View>
              <Text className="text-lg font-bold text-foreground">No History Yet</Text>
              <Text className="text-sm text-muted text-center">
                Your conversion history will appear here
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/(tabs)" as any)}
                className="rounded-3xl py-4 px-8 items-center mt-4"
                style={{ backgroundColor: colors.primary }}
              >
                <Text className="text-white font-bold">Start Converting</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
