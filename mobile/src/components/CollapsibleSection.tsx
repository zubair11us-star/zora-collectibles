import React, { useState } from "react";
import { LayoutAnimation, Platform, Pressable, StyleSheet, Text, UIManager, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useThemeMode } from "@/theme/ThemeProvider";
import { radius, spacing, typography } from "@/theme/typography";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface CollapsibleSectionProps {
  title: string;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  defaultOpen?: boolean;
  badge?: string;
  children: React.ReactNode;
}

export function CollapsibleSection({ title, icon, defaultOpen = false, badge, children }: CollapsibleSectionProps) {
  const { colors } = useThemeMode();
  const [open, setOpen] = useState(defaultOpen);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    Haptics.selectionAsync().catch(() => {});
    setOpen((o) => !o);
  };

  return (
    <View style={[styles.wrap, { borderColor: colors.border, backgroundColor: colors.surface }]}>
      <Pressable onPress={toggle} style={styles.header}>
        {icon && <Ionicons name={icon} size={18} color={colors.textSecondary} style={styles.headerIcon} />}
        <Text style={[typography.subtitle, { color: colors.textPrimary, flex: 1 }]}>{title}</Text>
        {badge && (
          <View style={[styles.badge, { backgroundColor: colors.accent + "1A" }]}>
            <Text style={{ color: colors.accent, fontSize: 11, fontWeight: "700" }}>{badge}</Text>
          </View>
        )}
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={18} color={colors.textMuted} style={{ marginLeft: spacing.sm }} />
      </Pressable>
      {open && <View style={styles.body}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderWidth: 1, borderRadius: radius.lg, marginBottom: spacing.md, overflow: "hidden" },
  header: { flexDirection: "row", alignItems: "center", padding: spacing.lg },
  headerIcon: { marginRight: spacing.sm },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill, marginRight: spacing.sm },
  body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
});
