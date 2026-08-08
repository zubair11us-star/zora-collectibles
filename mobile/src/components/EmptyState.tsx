import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

import { useThemeMode } from "@/theme/ThemeProvider";
import { radius, spacing, typography } from "@/theme/typography";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

export function EmptyState({ icon, title, body }: { icon: IoniconName; title: string; body?: string }) {
  const { colors } = useThemeMode();
  return (
    <View style={styles.wrap}>
      <View style={[styles.iconBadge, { backgroundColor: colors.surfaceAlt }]}>
        <Ionicons name={icon} size={32} color={colors.textMuted} />
      </View>
      <Text style={[typography.subtitle, { color: colors.textPrimary, marginTop: spacing.md }]}>{title}</Text>
      {body ? (
        <Text style={[typography.body, { color: colors.textMuted, textAlign: "center", marginTop: spacing.xs }]}>
          {body}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center", padding: spacing.xxl },
  iconBadge: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
});
