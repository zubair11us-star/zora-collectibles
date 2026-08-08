import React from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import { useThemeMode } from "@/theme/ThemeProvider";
import { radius, spacing, typography } from "@/theme/typography";
import { Button } from "@/components/Button";
import { ConfidenceBadge, LowConfidenceWarning } from "@/components/ConfidenceBadge";
import { EmptyState } from "@/components/EmptyState";
import { CategoryIcon } from "@/components/CategoryIcon";
import { RootStackParamList } from "@/navigation/types";
import { useScanSessionStore } from "@/state/useScanSessionStore";
import { CATEGORY_META } from "@/types/categoryFields";
import type { PossibleMatch } from "@/services/aiIdentification";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function IdentificationResultScreen() {
  const { colors } = useThemeMode();
  const navigation = useNavigation<Nav>();
  const scanSession = useScanSessionStore();
  const result = scanSession.identification;

  if (!result) {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]}>
        <EmptyState icon="alert-circle-outline" title="No scan in progress" body="Go back and scan an item first." />
      </SafeAreaView>
    );
  }

  const applyMatch = (match: PossibleMatch) => {
    scanSession.setIdentification({
      ...result,
      confidence: match.confidence,
      fields: { ...result.fields, ...match.fields },
    });
  };

  const scanAgain = () => {
    scanSession.reset();
    navigation.navigate("CameraScan", {});
  };

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        {scanSession.captures[0] && (
          <Image source={{ uri: scanSession.captures[0].uri }} style={styles.heroImage} resizeMode="cover" />
        )}

        {!result.ok ? (
          <View style={[styles.errorBox, { backgroundColor: colors.danger + "18", borderColor: colors.danger }]}>
            <Text style={{ color: colors.danger, fontWeight: "700", marginBottom: spacing.xs }}>
              AI identification unavailable
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
              {result.error ?? "Couldn't reach the AI server."} You can still enter the item manually.
            </Text>
          </View>
        ) : (
          <>
            <Text style={[typography.label, { color: colors.textMuted }]}>AI IDENTIFICATION</Text>
            <Text style={[typography.display, { color: colors.textPrimary, fontSize: 24, marginBottom: spacing.sm }]}>
              {(result.fields.name as string) ?? "Unidentified Item"}
            </Text>
            <View style={styles.categoryRow}>
              <CategoryIcon categoryKey={result.category} size={16} color={colors.textSecondary} />
              <Text style={[typography.body, { color: colors.textSecondary, marginLeft: spacing.xs }]}>
                {CATEGORY_META[result.category].name}
              </Text>
            </View>

            <View style={{ marginBottom: spacing.md }}>
              <ConfidenceBadge confidence={result.confidence} />
            </View>
            {result.confidence < 70 && <LowConfidenceWarning />}

            {result.possibleMatches.length > 0 && (
              <View style={{ marginTop: spacing.lg }}>
                <Text style={[typography.subtitle, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
                  Possible Matches
                </Text>
                {result.possibleMatches.map((match, idx) => (
                  <Pressable
                    key={idx}
                    onPress={() => applyMatch(match)}
                    style={[styles.matchRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  >
                    <Text style={{ color: colors.textPrimary, flex: 1 }} numberOfLines={1}>
                      {idx + 1}. {match.summary}
                    </Text>
                    <Text style={{ color: colors.accent, fontWeight: "700" }}>{Math.round(match.confidence)}%</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </>
        )}

        <View style={styles.actions}>
          <Button
            label={scanSession.intent === "wishlist" ? "Add to Wishlist" : "Confirm & Edit Details"}
            onPress={() =>
              scanSession.intent === "wishlist"
                ? navigation.replace("WishlistEdit", {})
                : navigation.replace("ItemEdit", { categoryHint: result.category })
            }
            fullWidth
          />
          <View style={{ height: spacing.md }} />
          <Button label="Scan Again" variant="secondary" onPress={scanAgain} fullWidth />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
  heroImage: { width: "100%", height: 200, borderRadius: radius.lg, marginBottom: spacing.lg },
  categoryRow: { flexDirection: "row", alignItems: "center", marginBottom: spacing.md },
  errorBox: { borderWidth: 1, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
  matchRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  actions: { marginTop: spacing.xl },
});
