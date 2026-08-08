import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

import { useThemeMode } from "@/theme/ThemeProvider";
import { radius, spacing, typography } from "@/theme/typography";
import { RootStackParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type IoniconName = ComponentProps<typeof Ionicons>["name"];

const MENU: { icon: IoniconName; title: string; subtitle: string; screen: keyof RootStackParamList }[] = [
  { icon: "receipt-outline", title: "Transactions", subtitle: "All purchases, sales, and trades across your collection", screen: "Transactions" },
  { icon: "camera-outline", title: "Scan Receipt", subtitle: "Extract store, date, and price from a receipt photo", screen: "ReceiptScan" },
  { icon: "location-outline", title: "Locations & Storage", subtitle: "Manage where your collection physically lives", screen: "Locations" },
  { icon: "cloud-outline", title: "Account & Sync", subtitle: "Optional sign-in for cloud sync and backup", screen: "Account" },
  { icon: "swap-vertical-outline", title: "Import / Export", subtitle: "Backup, restore, and CSV/JSON import-export", screen: "ImportExport" },
  { icon: "settings-outline", title: "Settings", subtitle: "Name, base currency, theme, AI server, notifications", screen: "Settings" },
];

export function MoreScreen() {
  const { colors } = useThemeMode();
  const navigation = useNavigation<Nav>();

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[typography.title, { color: colors.textPrimary, marginBottom: spacing.lg }]}>More</Text>
        {MENU.map((item) => (
          <Pressable
            key={item.screen}
            onPress={() => navigation.navigate(item.screen as never)}
            style={({ pressed }) => [
              styles.row,
              { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <View style={[styles.iconBadge, { backgroundColor: colors.accent + "1A" }]}>
              <Ionicons name={item.icon} size={20} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>{item.title}</Text>
              <Text style={[typography.caption, { color: colors.textMuted }]}>{item.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        ))}

        <View style={styles.footer}>
          <Text style={[typography.caption, { color: colors.textMuted }]}>
            Everything above works fully offline — cloud sync is optional.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.lg },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: { marginTop: spacing.xl, alignItems: "center" },
});
