import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import { useThemeMode } from "@/theme/ThemeProvider";
import { cardElevation, radius, spacing, typography } from "@/theme/typography";
import { formatMoney } from "@/utils/currency";
import { CategoryIcon } from "./CategoryIcon";
import { CATEGORY_META } from "@/types/categoryFields";
import { CategoryKey } from "@/types/models";

interface CategoryCardProps {
  categoryKey: CategoryKey;
  name: string;
  itemCount: number;
  totalValue: number;
  currency: string;
  onPress?: () => void;
}

export function CategoryCard({ categoryKey, name, itemCount, totalValue, currency, onPress }: CategoryCardProps) {
  const { colors } = useThemeMode();
  const accent = CATEGORY_META[categoryKey].color;
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress?.();
      }}
      onPressIn={() => {
        scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      }}
    >
      <Animated.View
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: accent },
          animatedStyle,
        ]}
      >
        <LinearGradient
          colors={[accent + "40", accent + "14"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconBadge}
        >
          <CategoryIcon categoryKey={categoryKey} size={20} color={accent} />
        </LinearGradient>
        <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
          {name}
        </Text>
        <View style={styles.row}>
          <Text style={[styles.count, { color: colors.textSecondary }]}>{itemCount} items</Text>
        </View>
        <Text style={[styles.value, { color: accent }]} numberOfLines={1} adjustsFontSizeToFit>
          {formatMoney(totalValue, currency)}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 156,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    ...cardElevation,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  name: { ...typography.subtitle, marginBottom: 2 },
  row: { flexDirection: "row", marginBottom: spacing.xs },
  count: { ...typography.caption },
  value: { ...typography.bodyBold, fontSize: 16 },
});
