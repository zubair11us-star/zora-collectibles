import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

import { useThemeMode } from "@/theme/ThemeProvider";
import { radius, spacing, typography } from "@/theme/typography";
import { RootStackParamList } from "@/navigation/types";
import { useScanSessionStore } from "@/state/useScanSessionStore";
import { CATEGORY_META, CATEGORY_ORDER } from "@/types/categoryFields";
import { CategoryKey } from "@/types/models";
import { CategoryIcon } from "@/components/CategoryIcon";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type IoniconName = ComponentProps<typeof Ionicons>["name"];

const OPTIONS: { icon: IoniconName; title: string; subtitle: string; key: string }[] = [
  { key: "ai", icon: "camera-outline", title: "AI Camera Scan", subtitle: "Photograph the item — Zora identifies it for you" },
  { key: "barcode", icon: "barcode-outline", title: "Barcode Scan", subtitle: "EAN, UPC, Code 128" },
  { key: "qr", icon: "qr-code-outline", title: "QR Code Scan", subtitle: "Scan a QR label" },
  { key: "upload", icon: "image-outline", title: "Upload Existing Photo", subtitle: "Identify from your gallery" },
  { key: "manual", icon: "create-outline", title: "Manual Entry", subtitle: "Skip AI and type in details yourself" },
];

export function ScanOptionsScreen() {
  const { colors } = useThemeMode();
  const navigation = useNavigation<Nav>();
  const scanSession = useScanSessionStore();
  const [category, setCategory] = useState<CategoryKey | null>(null);

  useEffect(() => {
    scanSession.reset();
  }, []);

  const handlePress = (key: string) => {
    scanSession.setCategoryHint(category);
    if (key === "ai") navigation.navigate("CameraScan", { categoryHint: category ?? undefined });
    else if (key === "barcode" || key === "qr") navigation.navigate("BarcodeScan");
    else if (key === "upload") navigation.navigate("PhotoUpload", { categoryHint: category ?? undefined });
    else if (key === "manual") navigation.replace("ItemEdit", { categoryHint: category ?? undefined });
  };

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[typography.subtitle, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
          What are you adding? (optional — helps AI accuracy)
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow}>
          <Pressable
            onPress={() => setCategory(null)}
            style={[
              styles.categoryChip,
              { backgroundColor: category === null ? colors.accent : colors.surfaceAlt, borderColor: colors.border },
            ]}
          >
            <Text style={{ color: category === null ? "#fff" : colors.textPrimary, fontSize: 12, fontWeight: "600" }}>
              Auto-detect
            </Text>
          </Pressable>
          {CATEGORY_ORDER.map((key) => {
            const selected = category === key;
            return (
              <Pressable
                key={key}
                onPress={() => setCategory(key)}
                style={[
                  styles.categoryChip,
                  { backgroundColor: selected ? colors.accent : colors.surfaceAlt, borderColor: colors.border },
                ]}
              >
                <CategoryIcon categoryKey={key} size={14} color={selected ? "#fff" : CATEGORY_META[key].color} />
                <Text style={{ color: selected ? "#fff" : colors.textPrimary, fontSize: 12, fontWeight: "600", marginLeft: 6 }}>
                  {CATEGORY_META[key].name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={{ marginTop: spacing.xl }}>
          {OPTIONS.map((opt) => (
            <Pressable
              key={opt.key}
              onPress={() => handlePress(opt.key)}
              style={({ pressed }) => [
                styles.optionCard,
                { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <View style={[styles.optionIconBadge, { backgroundColor: colors.accent + "1A" }]}>
                <Ionicons name={opt.icon} size={22} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>{opt.title}</Text>
                <Text style={[typography.caption, { color: colors.textMuted }]}>{opt.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.lg },
  categoryRow: { maxHeight: 40 },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    marginRight: spacing.xs,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  optionIconBadge: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
