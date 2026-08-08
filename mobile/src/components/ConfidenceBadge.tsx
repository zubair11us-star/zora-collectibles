import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useThemeMode } from "@/theme/ThemeProvider";
import { radius, spacing, typography } from "@/theme/typography";
import { isLowConfidence } from "@/services/aiIdentification";

export function ConfidenceBadge({ confidence }: { confidence: number }) {
  const { colors } = useThemeMode();
  const low = isLowConfidence(confidence);
  const color = confidence >= 90 ? colors.success : low ? colors.warning : colors.info;

  return (
    <View style={[styles.badge, { backgroundColor: color + "22", borderColor: color }]}>
      <Text style={[styles.text, { color }]}>Identification Confidence: {Math.round(confidence)}%</Text>
    </View>
  );
}

export function LowConfidenceWarning() {
  const { colors } = useThemeMode();
  return (
    <View style={[styles.warningBox, { backgroundColor: colors.warning + "18", borderColor: colors.warning }]}>
      <Text style={[styles.warningText, { color: colors.warning }]}>
        AI identification may be incorrect. Please review the information below.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  text: { ...typography.bodyBold, fontSize: 13 },
  warningBox: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  warningText: { ...typography.body, fontSize: 13 },
});
