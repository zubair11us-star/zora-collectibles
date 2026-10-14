import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useThemeMode } from "@/theme/ThemeProvider";
import { cardElevation, radius, spacing, typography } from "@/theme/typography";

interface StatTileProps {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "success" | "danger" | "warning";
}

export function StatTile({ label, value, hint, tone = "default" }: StatTileProps) {
  const { colors } = useThemeMode();
  const toneColor =
    tone === "success" ? colors.success : tone === "danger" ? colors.danger : tone === "warning" ? colors.warning : colors.textPrimary;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.accent },
      ]}
    >
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.value, { color: toneColor }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
        {value}
      </Text>
      {hint ? <Text style={[styles.hint, { color: colors.textMuted }]}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexGrow: 1,
    minWidth: 150,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    ...cardElevation,
  },
  label: { ...typography.label, textTransform: "uppercase", marginBottom: spacing.xs },
  value: { ...typography.display, fontSize: 22 },
  hint: { ...typography.caption, marginTop: spacing.xs },
});
