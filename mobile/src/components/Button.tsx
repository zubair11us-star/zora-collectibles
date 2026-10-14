import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import type { ComponentProps } from "react";

import { useThemeMode } from "@/theme/ThemeProvider";
import { radius, spacing, typography } from "@/theme/typography";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  icon?: IoniconName;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  label,
  onPress,
  variant = "primary",
  icon,
  disabled,
  loading,
  fullWidth,
}: ButtonProps) {
  const { colors } = useThemeMode();

  // Only the primary CTA gets the gradient treatment — gradient-everywhere
  // reads as noisy, not modern. Everything else stays flat for hierarchy.
  const isGradient = variant === "primary" && !disabled;
  const bg =
    variant === "danger" ? colors.danger : variant === "secondary" ? colors.surfaceAlt : "transparent";
  const textColor = variant === "secondary" || variant === "ghost" ? colors.textPrimary : "#FFFFFF";
  const borderColor = variant === "ghost" ? colors.border : "transparent";

  const handlePress = () => {
    Haptics.impactAsync(
      variant === "danger" ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light
    ).catch(() => {});
    onPress();
  };

  const content = loading ? (
    <ActivityIndicator color={textColor} />
  ) : (
    <>
      {icon && <Ionicons name={icon} size={18} color={textColor} style={styles.icon} />}
      <Text style={[typography.bodyBold, { color: textColor }]}>{label}</Text>
    </>
  );

  return (
    <Pressable
      disabled={disabled || loading}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={({ pressed }) => [
        fullWidth && styles.fullWidth,
        { opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
      ]}
    >
      {isGradient ? (
        <LinearGradient
          colors={[colors.accent, colors.accentAlt]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.base}
        >
          {content}
        </LinearGradient>
      ) : (
        <View style={[styles.base, { backgroundColor: disabled ? colors.surfaceAlt : bg, borderColor, borderWidth: 1 }]}>
          {content}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fullWidth: { width: "100%" },
  base: {
    flexDirection: "row",
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: { marginRight: spacing.xs },
});
