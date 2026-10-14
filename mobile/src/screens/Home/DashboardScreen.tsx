import React, { useCallback, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { useThemeMode } from "@/theme/ThemeProvider";
import { radius, spacing, typography } from "@/theme/typography";
import { StatTile } from "@/components/StatTile";
import { CategoryCard } from "@/components/CategoryCard";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/Button";
import { DashboardSkeleton } from "@/components/Skeleton";
import {
  CategoryCountBarChart,
  CategoryValueBarChart,
  CountryDistributionChart,
  GrowthLineChart,
  PurchaseVsCurrentChart,
} from "@/components/ValueChart";
import { DashboardStats, getDashboardStats } from "@/db/repositories/statsRepo";
import { formatMoney } from "@/utils/currency";
import { RootStackParamList } from "@/navigation/types";
import { useSettingsStore } from "@/state/useSettingsStore";
import { CategoryKey } from "@/types/models";
import { CATEGORY_META } from "@/types/categoryFields";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function DashboardScreen() {
  const { colors } = useThemeMode();
  const navigation = useNavigation<Nav>();
  const settings = useSettingsStore((s) => s.settings);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await getDashboardStats();
      setStats(data);
      setLoadError(null);
    } catch (e) {
      console.error("Failed to load dashboard stats", e);
      setLoadError(e instanceof Error ? e.message : "Couldn't load your collection stats.");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const goToCategory = (categoryKey: CategoryKey) => {
    navigation.navigate("Tabs", { screen: "Collection", params: { categoryKey } });
  };

  if (loadError && !stats) {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={["top"]}>
        <View style={styles.center}>
          <EmptyState icon="alert-circle-outline" title="Couldn't load your dashboard" body={loadError} />
          <Button label="Try Again" onPress={load} />
        </View>
      </SafeAreaView>
    );
  }

  if (!stats) {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={["top"]}>
        <DashboardSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        <LinearGradient
          colors={[colors.accentAlt, colors.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <Text style={[typography.body, { color: "rgba(255,255,255,0.85)" }]}>
            {settings.name ? `${settings.name}'s Collection` : "Your Collection"}
          </Text>
          <Text style={styles.heroValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
            {formatMoney(stats.estimatedCollectionValue, stats.baseCurrency)}
          </Text>
          <Text style={[typography.caption, { color: "rgba(255,255,255,0.75)" }]}>
            {stats.totalItems} items • {stats.baseCurrency} base currency
          </Text>
        </LinearGradient>

        <View style={styles.statsGrid}>
          {(
            [
              { label: "Total Items", value: String(stats.totalItems), hint: `${stats.totalQuantity} total quantity` },
              { label: "Estimated Value", value: formatMoney(stats.estimatedCollectionValue, stats.baseCurrency) },
              { label: "Purchase Cost", value: formatMoney(stats.totalPurchaseCost, stats.baseCurrency) },
              {
                label: "Profit / Loss",
                value: formatMoney(stats.profitLoss, stats.baseCurrency),
                tone: stats.profitLoss >= 0 ? "success" : "danger",
              },
              { label: "Added This Month", value: String(stats.itemsAddedThisMonth) },
              {
                label: "Missing Info",
                value: String(stats.itemsMissingInfo),
                tone: stats.itemsMissingInfo > 0 ? "warning" : "default",
              },
              {
                label: "Missing Photos",
                value: String(stats.itemsMissingPhotos),
                tone: stats.itemsMissingPhotos > 0 ? "warning" : "default",
              },
              { label: "Items For Sale", value: String(stats.itemsForSale) },
            ] as { label: string; value: string; hint?: string; tone?: "default" | "success" | "danger" | "warning" }[]
          ).map((tile, i) => (
            <Animated.View
              key={tile.label}
              style={styles.statTileWrap}
              entering={FadeInDown.delay(i * 40).springify().damping(16)}
            >
              <StatTile label={tile.label} value={tile.value} hint={tile.hint} tone={tile.tone} />
            </Animated.View>
          ))}
        </View>

        <Text style={[typography.title, { color: colors.textPrimary, marginTop: spacing.xl, marginBottom: spacing.md }]}>
          Categories
        </Text>
        {stats.categories.length === 0 ? (
          <EmptyState icon="cube-outline" title="No items yet" body="Tap Scan to add your first collectible." />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {stats.categories.map((c, i) => (
              <Animated.View
                key={c.categoryKey}
                style={{ marginRight: spacing.md }}
                entering={FadeInDown.delay(i * 50).springify().damping(16)}
              >
                <CategoryCard
                  categoryKey={c.categoryKey}
                  name={c.categoryName}
                  itemCount={c.itemCount}
                  totalValue={c.totalValue}
                  currency={stats.baseCurrency}
                  onPress={() => goToCategory(c.categoryKey)}
                />
              </Animated.View>
            ))}
          </ScrollView>
        )}

        {(stats.mostValuableItem || stats.highestRoiItem) && (
          <View style={styles.highlightRow}>
            {stats.mostValuableItem && (
              <HighlightCard
                label="Most Valuable Item"
                title={stats.mostValuableItem.name}
                value={formatMoney(stats.mostValuableItem.value, stats.mostValuableItem.currency)}
                onPress={() => navigation.navigate("ItemDetails", { itemId: stats.mostValuableItem!.id })}
              />
            )}
            {stats.highestRoiItem && (
              <HighlightCard
                label="Highest ROI Item"
                title={stats.highestRoiItem.name}
                value={`${stats.highestRoiItem.roiPercent >= 0 ? "+" : ""}${stats.highestRoiItem.roiPercent.toFixed(1)}%`}
                tone={stats.highestRoiItem.roiPercent >= 0 ? "success" : "danger"}
                onPress={() => navigation.navigate("ItemDetails", { itemId: stats.highestRoiItem!.id })}
              />
            )}
          </View>
        )}

        {stats.categories.length > 0 && (
          <View style={{ marginTop: spacing.xl }}>
            <CategoryValueBarChart
              data={stats.categories.map((c) => ({
                label: c.categoryName,
                value: Math.round(c.totalValue),
                color: CATEGORY_META[c.categoryKey].color,
              }))}
            />
            <CategoryCountBarChart
              data={stats.categories.map((c) => ({
                label: c.categoryName,
                value: c.itemCount,
                color: CATEGORY_META[c.categoryKey].color,
              }))}
            />
            <CountryDistributionChart
              data={stats.countryDistribution.map((c) => ({ label: c.country, value: c.itemCount }))}
            />
            <PurchaseVsCurrentChart
              purchase={Math.round(stats.totalPurchaseCost)}
              current={Math.round(stats.estimatedCollectionValue)}
            />
            <GrowthLineChart
              data={stats.monthlyGrowth.map((g) => ({ label: g.month.slice(2), value: Math.round(g.value) }))}
            />
          </View>
        )}

        {(stats.latestPurchases.length > 0 || stats.latestSales.length > 0) && (
          <View style={styles.recentRow}>
            {stats.latestPurchases.length > 0 && (
              <View style={styles.recentCol}>
                <Text style={[typography.subtitle, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
                  Latest Purchases
                </Text>
                {stats.latestPurchases.map((t) => (
                  <RecentTxRow
                    key={t.id}
                    tx={t}
                    fallbackCurrency={stats.baseCurrency}
                    onPress={() => navigation.navigate("ItemDetails", { itemId: t.itemId })}
                  />
                ))}
              </View>
            )}
            {stats.latestSales.length > 0 && (
              <View style={styles.recentCol}>
                <Text style={[typography.subtitle, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
                  Latest Sales
                </Text>
                {stats.latestSales.map((t) => (
                  <RecentTxRow
                    key={t.id}
                    tx={t}
                    fallbackCurrency={stats.baseCurrency}
                    onPress={() => navigation.navigate("ItemDetails", { itemId: t.itemId })}
                  />
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function HighlightCard({
  label,
  title,
  value,
  tone,
  onPress,
}: {
  label: string;
  title: string;
  value: string;
  tone?: "success" | "danger";
  onPress: () => void;
}) {
  const { colors } = useThemeMode();
  const valueColor = tone === "success" ? colors.success : tone === "danger" ? colors.danger : colors.accent;
  return (
    <Pressable onPress={onPress}>
      <LinearGradient
        colors={[valueColor + "26", colors.surface]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.highlightCard, { borderColor: colors.border }]}
      >
        <Text style={[typography.label, { color: colors.textMuted }]}>{label.toUpperCase()}</Text>
        <Text style={[typography.bodyBold, { color: colors.textPrimary, marginTop: spacing.xs }]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[typography.bodyBold, { color: valueColor, marginTop: 2 }]}>{value}</Text>
      </LinearGradient>
    </Pressable>
  );
}

function RecentTxRow({
  tx,
  fallbackCurrency,
  onPress,
}: {
  tx: { itemName: string; date: string; amount: number | null; currency: string | null };
  fallbackCurrency: string;
  onPress: () => void;
}) {
  const { colors } = useThemeMode();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.recentTxRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <Text style={[typography.body, { color: colors.textPrimary, flex: 1 }]} numberOfLines={1}>
        {tx.itemName}
      </Text>
      <Text style={{ color: colors.textMuted, fontSize: 12 }}>
        {tx.amount != null ? formatMoney(tx.amount, tx.currency ?? fallbackCurrency) : "—"}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
  hero: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  heroValue: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "800",
    marginVertical: 2,
  },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  statTileWrap: { flexGrow: 1, minWidth: 150 },
  categoryScroll: { marginHorizontal: -spacing.lg, paddingHorizontal: spacing.lg },
  highlightRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.xl },
  highlightCard: { flex: 1, borderWidth: 1, borderRadius: 14, padding: spacing.md },
  recentRow: { flexDirection: "row", gap: spacing.lg, marginTop: spacing.md },
  recentCol: { flex: 1 },
  recentTxRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
});
