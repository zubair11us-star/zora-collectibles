import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";

import { useThemeMode } from "@/theme/ThemeProvider";
import { radius, spacing, typography } from "@/theme/typography";
import { formatMoney } from "@/utils/currency";
import { ItemListRow } from "@/db/repositories/itemsRepo";
import { SyncedImage } from "./SyncedImage";
import { CategoryIcon } from "./CategoryIcon";
import { CATEGORY_META } from "@/types/categoryFields";

interface ItemCardProps {
  item: ItemListRow;
  mode: "grid" | "list" | "gallery";
  onPress: () => void;
}

export function ItemCard({ item, mode, onPress: onPressProp }: ItemCardProps) {
  const { colors } = useThemeMode();
  const onPress = () => {
    Haptics.selectionAsync().catch(() => {});
    onPressProp();
  };
  const valueText =
    item.currentValue != null
      ? formatMoney(item.currentValue, item.currentValueCurrency ?? item.currency ?? "AED")
      : "No value set";

  const categoryColor = CATEGORY_META[item.category.key].color;

  const Thumb = () =>
    item.coverPhotoPath ? (
      <SyncedImage
        filePath={item.coverPhotoPath}
        cloudUrl={item.coverPhotoCloudUrl}
        style={styles.imageFill}
        resizeMode="cover"
      />
    ) : (
      <View style={[styles.imageFill, styles.placeholder, { backgroundColor: categoryColor + "1A" }]}>
        <CategoryIcon categoryKey={item.category.key} size={mode === "gallery" ? 34 : 24} color={categoryColor} />
      </View>
    );

  if (mode === "list") {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.listRow,
          { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <View style={styles.listThumb}>
          <Thumb />
        </View>
        <View style={styles.listBody}>
          <Text style={[typography.bodyBold, { color: colors.textPrimary }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[typography.caption, { color: colors.textMuted }]} numberOfLines={1}>
            {item.category.name}
            {item.country ? ` • ${item.country}` : ""}
            {item.year ? ` • ${item.year}` : ""}
          </Text>
        </View>
        <Text style={[typography.bodyBold, { color: colors.accent }]}>{valueText}</Text>
      </Pressable>
    );
  }

  const size = mode === "gallery" ? styles.galleryCard : styles.gridCard;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        size,
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View style={mode === "gallery" ? styles.galleryImageWrap : styles.gridImageWrap}>
        <Thumb />
      </View>
      {mode === "grid" && (
        <View style={styles.gridBody}>
          <Text style={[typography.bodyBold, { color: colors.textPrimary }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[typography.caption, { color: colors.textMuted }]} numberOfLines={1}>
            {item.category.name}
          </Text>
          <Text style={[typography.bodyBold, { color: colors.accent, marginTop: 2 }]}>{valueText}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: 1, overflow: "hidden" },
  gridCard: { width: "48%" },
  galleryCard: { width: "100%", marginBottom: spacing.md },
  gridImageWrap: { aspectRatio: 1, width: "100%" },
  galleryImageWrap: { aspectRatio: 1.4, width: "100%" },
  gridBody: { padding: spacing.sm },
  imageFill: { width: "100%", height: "100%" },
  placeholder: { alignItems: "center", justifyContent: "center" },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  listThumb: { width: 52, height: 52, borderRadius: radius.sm, overflow: "hidden" },
  listBody: { flex: 1 },
});
