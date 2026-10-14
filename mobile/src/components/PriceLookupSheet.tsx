import React, { useEffect, useState } from "react";
import { ActivityIndicator, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useThemeMode } from "@/theme/ThemeProvider";
import { radius, spacing, typography } from "@/theme/typography";
import { lookupReferencePrice, PriceLookupRequest, PriceLookupResult } from "@/services/priceLookupService";

interface PriceLookupSheetProps {
  visible: boolean;
  query: PriceLookupRequest | null;
  onClose: () => void;
}

/**
 * Shows reference pricing search results as plain links the user reviews
 * and opens themselves — never a number auto-filled into the form. Same
 * "assistive, human in the loop" pattern as AI identification results.
 */
export function PriceLookupSheet({ visible, query, onClose }: PriceLookupSheetProps) {
  const { colors } = useThemeMode();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PriceLookupResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!visible || !query) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const response = await lookupReferencePrice(query);
      if (cancelled) return;
      setLoading(false);
      if (response.ok) {
        setResults(response.results);
        setSearchQuery(response.searchQuery);
      } else {
        setError(response.error ?? "Price lookup failed.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible, query]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <View style={styles.header}>
            <Text style={[typography.title, { color: colors.textPrimary }]}>Reference Pricing</Text>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close">
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </Pressable>
          </View>
          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.md }]}>
            Web search results — review and open a link yourself; nothing here is added to your item
            automatically.
          </Text>

          {loading && (
            <View style={styles.center}>
              <ActivityIndicator color={colors.accent} />
            </View>
          )}

          {!loading && error && (
            <View style={styles.center}>
              <Ionicons name="alert-circle-outline" size={28} color={colors.danger} />
              <Text style={[typography.body, { color: colors.textSecondary, textAlign: "center", marginTop: spacing.sm }]}>
                {error}
              </Text>
            </View>
          )}

          {!loading && !error && results.length === 0 && (
            <View style={styles.center}>
              <Text style={[typography.body, { color: colors.textMuted }]}>No results found for "{searchQuery}".</Text>
            </View>
          )}

          {!loading && !error && results.length > 0 && (
            <ScrollView>
              {results.map((r, i) => (
                <Pressable
                  key={`${r.link}-${i}`}
                  onPress={() => r.link && Linking.openURL(r.link).catch(() => {})}
                  accessibilityRole="link"
                  style={[styles.resultCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
                >
                  <Text style={[typography.bodyBold, { color: colors.accent }]} numberOfLines={2}>
                    {r.title}
                  </Text>
                  <Text style={[typography.caption, { color: colors.textMuted }]} numberOfLines={1}>
                    {r.displayLink}
                  </Text>
                  {r.snippet ? (
                    <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.xs }]} numberOfLines={3}>
                      {r.snippet}
                    </Text>
                  ) : null}
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    maxHeight: "80%",
    minHeight: "40%",
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.xs },
  center: { alignItems: "center", justifyContent: "center", paddingVertical: spacing.xxl },
  resultCard: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
});
