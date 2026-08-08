import React, { useCallback, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import { Ionicons } from "@expo/vector-icons";

import { useThemeMode } from "@/theme/ThemeProvider";
import { radius, spacing, typography } from "@/theme/typography";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { CategoryIcon } from "@/components/CategoryIcon";
import { CATEGORY_META } from "@/types/categoryFields";
import { listWishlist, WishlistRow } from "@/db/repositories/wishlistRepo";
import { useScanSessionStore } from "@/state/useScanSessionStore";
import { formatMoney } from "@/utils/currency";
import { RootStackParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const PRIORITY_COLOR: Record<string, "success" | "warning" | "danger"> = {
  low: "success",
  medium: "warning",
  high: "danger",
};

export function WishlistScreen() {
  const { colors } = useThemeMode();
  const navigation = useNavigation<Nav>();
  const scanSession = useScanSessionStore();
  const [entries, setEntries] = useState<WishlistRow[]>([]);

  const load = useCallback(async () => {
    setEntries(await listWishlist());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const startManual = () => {
    scanSession.reset();
    navigation.navigate("WishlistEdit", {});
  };

  const startScan = () => {
    scanSession.reset();
    scanSession.setIntent("wishlist");
    navigation.navigate("CameraScan", {});
  };

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={["top"]}>
      <View style={styles.header}>
        <Text style={[typography.title, { color: colors.textPrimary }]}>Wishlist</Text>
      </View>

      <View style={styles.addRow}>
        <View style={{ flex: 1 }}>
          <Button label="Add Manually" icon="add-outline" variant="secondary" onPress={startManual} fullWidth />
        </View>
        <View style={{ width: spacing.sm }} />
        <View style={{ flex: 1 }}>
          <Button label="Scan to Identify" icon="camera-outline" onPress={startScan} fullWidth />
        </View>
      </View>

      {entries.length === 0 ? (
        <EmptyState icon="star-outline" title="Your wishlist is empty" body="Add items you're hoping to find for your collection." />
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(e) => e.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => navigation.navigate("WishlistEdit", { wishlistId: item.id })}
              style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View
                style={[
                  styles.iconBadge,
                  { backgroundColor: (item.categoryKey ? CATEGORY_META[item.categoryKey].color : colors.textMuted) + "1A" },
                ]}
              >
                {item.categoryKey ? (
                  <CategoryIcon categoryKey={item.categoryKey} size={18} color={CATEGORY_META[item.categoryKey].color} />
                ) : (
                  <Ionicons name="star-outline" size={18} color={colors.textMuted} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>{item.name}</Text>
                <Text style={[typography.caption, { color: colors.textMuted }]}>
                  {item.categoryName ?? "Any category"}
                  {item.targetPrice != null ? ` • Target ${formatMoney(item.targetPrice, item.targetCurrency ?? "AED")}` : ""}
                </Text>
              </View>
              <View style={[styles.priorityBadge, { backgroundColor: colors[PRIORITY_COLOR[item.priority]] + "22" }]}>
                <Text style={{ color: colors[PRIORITY_COLOR[item.priority]], fontSize: 11, fontWeight: "700" }}>
                  {item.priority.toUpperCase()}
                </Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, marginBottom: spacing.md },
  addRow: { flexDirection: "row", paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  listContent: { padding: spacing.lg, paddingTop: 0 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  iconBadge: { width: 36, height: 36, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  priorityBadge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill },
});
