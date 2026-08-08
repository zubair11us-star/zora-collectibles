import React, { useCallback, useState } from "react";
import { Alert, Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { useThemeMode } from "@/theme/ThemeProvider";
import { radius, spacing, typography } from "@/theme/typography";
import { Button } from "@/components/Button";
import { SyncedImage } from "@/components/SyncedImage";
import { CategoryIcon } from "@/components/CategoryIcon";
import { PhotoViewerModal } from "@/components/PhotoViewerModal";
import { ItemDetailsSkeleton } from "@/components/Skeleton";
import { ValueHistoryChart } from "@/components/ValueChart";
import { getItemWithDetails, softDeleteItem } from "@/db/repositories/itemsRepo";
import { listLocations, listStorageBoxes } from "@/db/repositories/locationsRepo";
import { listTransactionsByItem } from "@/db/repositories/transactionsRepo";
import { formatMoney } from "@/utils/currency";
import { ItemWithDetails, ITEM_CONDITIONS, SaleStatus, Transaction } from "@/types/models";
import { RootStackParamList } from "@/navigation/types";
import { CATEGORY_META } from "@/types/categoryFields";

const TRANSACTION_TYPE_LABELS: Record<Transaction["type"], string> = {
  purchase: "Purchase",
  sale: "Sale",
  trade: "Trade",
  gift_received: "Gift Received",
  gift_given: "Gift Given",
  found: "Found",
  lost: "Lost",
  damaged: "Damaged",
};

const SALE_STATUS_LABELS: Record<SaleStatus, string> = {
  not_for_sale: "Not For Sale",
  planned: "Planned",
  listed: "Listed",
  reserved: "Reserved",
  sold: "Sold",
};

type Nav = NativeStackNavigationProp<RootStackParamList>;
type DetailsRoute = RouteProp<RootStackParamList, "ItemDetails">;

export function ItemDetailsScreen() {
  const { colors } = useThemeMode();
  const navigation = useNavigation<Nav>();
  const route = useRoute<DetailsRoute>();
  const [item, setItem] = useState<ItemWithDetails | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [boxName, setBoxName] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);

  const load = useCallback(async () => {
    const details = await getItemWithDetails(route.params.itemId);
    setItem(details);
    if (details?.locationId) {
      const locations = await listLocations();
      setLocationName(locations.find((l) => l.id === details.locationId)?.name ?? null);
    }
    if (details?.storageBoxId) {
      const boxes = await listStorageBoxes();
      setBoxName(boxes.find((b) => b.id === details.storageBoxId)?.name ?? null);
    }
    setTransactions(await listTransactionsByItem(route.params.itemId));
  }, [route.params.itemId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (!item) {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={["bottom"]}>
        <ItemDetailsSkeleton />
      </SafeAreaView>
    );
  }

  const purchaseTotal = (item.purchasePrice ?? 0) * item.quantity;
  const currentTotal = (item.currentValue ?? 0) * item.quantity;
  const profitLoss = currentTotal - purchaseTotal;
  const roi = purchaseTotal > 0 ? (profitLoss / purchaseTotal) * 100 : null;
  const conditionLabel = ITEM_CONDITIONS.find((c) => c.value === item.condition)?.label ?? item.condition;
  const categoryMeta = CATEGORY_META[item.category.key];

  const confirmDelete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    Alert.alert("Remove item?", `This will remove "${item.name}" from your collection.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          await softDeleteItem(item.id);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        {item.photos.length > 0 ? (
          <View>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              style={styles.photoScroll}
              onMomentumScrollEnd={(e) =>
                setPreviewIndex(Math.round(e.nativeEvent.contentOffset.x / Dimensions.get("window").width))
              }
            >
              {item.photos.map((p, idx) => (
                <Pressable
                  key={p.id}
                  onPress={() => {
                    setPreviewIndex(idx);
                    setViewerOpen(true);
                  }}
                >
                  <SyncedImage filePath={p.filePath} cloudUrl={p.cloudUrl} style={styles.photo} resizeMode="cover" />
                </Pressable>
              ))}
            </ScrollView>
            {item.photos.length > 1 && (
              <View style={styles.dotsRow}>
                {item.photos.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      { backgroundColor: i === previewIndex ? colors.accent : colors.border },
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={[styles.photoPlaceholder, { backgroundColor: categoryMeta.color + "1A" }]}>
            <CategoryIcon categoryKey={item.category.key} size={56} color={categoryMeta.color} />
          </View>
        )}

        <PhotoViewerModal
          visible={viewerOpen}
          photos={item.photos.map((p) => ({ filePath: p.filePath, cloudUrl: p.cloudUrl }))}
          initialIndex={previewIndex}
          onClose={() => setViewerOpen(false)}
        />

        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[typography.display, { color: colors.textPrimary, fontSize: 24 }]}>{item.name}</Text>
            <View style={styles.categoryRow}>
              <CategoryIcon categoryKey={item.category.key} size={14} color={colors.textMuted} />
              <Text style={[typography.body, { color: colors.textMuted, marginLeft: spacing.xs }]}>
                {item.category.name}
                {item.subcategory ? ` • ${item.subcategory}` : ""}
              </Text>
            </View>
          </View>
          <View style={[styles.qtyBadge, { backgroundColor: colors.surfaceAlt }]}>
            <Text style={{ color: colors.textPrimary, fontWeight: "700" }}>×{item.quantity}</Text>
          </View>
        </View>

        <Section title="Identification" colors={colors}>
          <InfoRow label="Country" value={item.country} colors={colors} />
          <InfoRow label="Manufacturer" value={item.manufacturer} colors={colors} />
          <InfoRow label="Year" value={item.year ? String(item.year) : null} colors={colors} />
          <InfoRow label="Series" value={item.series} colors={colors} />
          <InfoRow label="Set" value={item.setName} colors={colors} />
          <InfoRow label="Card Number" value={item.cardNumber} colors={colors} />
          <InfoRow label="Catalog Number" value={item.catalogNumber} colors={colors} />
          <InfoRow label="Serial Number" value={item.serialNumber} colors={colors} />
          <InfoRow label="Condition" value={conditionLabel} colors={colors} />
          <InfoRow label="Grade" value={item.grade} colors={colors} />
          {Object.entries(item.attributes)
            .filter(([key]) => !key.startsWith("_sale_"))
            .map(([key, value]) => (
              <InfoRow
                key={key}
                label={categoryMeta.fields.find((f) => f.key === key)?.label ?? key}
                value={value}
                colors={colors}
              />
            ))}
          <InfoRow
            label="Identification Source"
            value={item.identificationSource.toUpperCase() + (item.aiConfidence ? ` (${Math.round(item.aiConfidence)}%)` : "")}
            colors={colors}
          />
        </Section>

        <Section title="Value" colors={colors}>
          <InfoRow label="Purchase Price" value={item.purchasePrice != null ? formatMoney(item.purchasePrice, item.purchaseCurrency ?? "AED") : null} colors={colors} />
          <InfoRow label="Current Value" value={item.currentValue != null ? formatMoney(item.currentValue, item.currentValueCurrency ?? "AED") : null} colors={colors} />
          <InfoRow
            label="Profit / Loss"
            value={item.currentValue != null && item.purchasePrice != null ? formatMoney(profitLoss, item.currentValueCurrency ?? "AED") : null}
            valueColor={profitLoss >= 0 ? colors.success : colors.danger}
            colors={colors}
          />
          <InfoRow label="ROI" value={roi != null ? `${roi.toFixed(1)}%` : null} valueColor={roi != null && roi >= 0 ? colors.success : colors.danger} colors={colors} />
        </Section>

        <ValueHistoryChart
          data={item.valuations.map((v) => ({ label: v.date.slice(5, 10), value: v.value }))}
          currency={item.currentValueCurrency ?? item.currency ?? "AED"}
        />

        {item.saleStatus !== "not_for_sale" && (
          <Section title="For Sale" colors={colors}>
            <InfoRow label="Status" value={SALE_STATUS_LABELS[item.saleStatus]} colors={colors} />
            <InfoRow
              label="Selling Price"
              value={item.sellingPrice != null ? formatMoney(item.sellingPrice, item.currentValueCurrency ?? "AED") : null}
              colors={colors}
            />
            <InfoRow label="Minimum Price" value={item.attributes["_sale_minPrice"] ? formatMoney(Number(item.attributes["_sale_minPrice"]), item.currentValueCurrency ?? "AED") : null} colors={colors} />
            <InfoRow label="Marketplace" value={item.attributes["_sale_marketplace"]} colors={colors} />
            <InfoRow label="Listing Date" value={item.attributes["_sale_listingDate"]} colors={colors} />
            <InfoRow label="Buyer" value={item.attributes["_sale_buyer"]} colors={colors} />
          </Section>
        )}

        <Section title="Storage" colors={colors}>
          <InfoRow label="Location" value={locationName} colors={colors} />
          <InfoRow label="Storage Box" value={boxName} colors={colors} />
          <InfoRow label="Position" value={item.storagePosition} colors={colors} />
        </Section>

        <Section title="Transactions" colors={colors}>
          {transactions.length === 0 ? (
            <Text style={[typography.body, { color: colors.textMuted }]}>No transactions recorded yet.</Text>
          ) : (
            transactions.map((t) => (
              <View key={t.id} style={styles.infoRow}>
                <Text style={[typography.caption, { color: colors.textMuted }]}>
                  {TRANSACTION_TYPE_LABELS[t.type]} • {t.date.slice(0, 10)}
                </Text>
                <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>
                  {t.price != null ? formatMoney(t.price, t.currency ?? "AED") : "—"}
                </Text>
              </View>
            ))
          )}
          <View style={{ marginTop: spacing.md, flexDirection: "row" }}>
            <View style={{ flex: 1 }}>
              <Button
                label="Add Transaction"
                variant="secondary"
                onPress={() => navigation.navigate("AddTransaction", { itemId: item.id, itemName: item.name })}
                fullWidth
              />
            </View>
            <View style={{ width: spacing.md }} />
            <View style={{ flex: 1 }}>
              <Button
                label="Scan Receipt"
                variant="secondary"
                onPress={() => navigation.navigate("ReceiptScan", { itemId: item.id })}
                fullWidth
              />
            </View>
          </View>
        </Section>

        {item.notes ? (
          <Section title="Notes" colors={colors}>
            <Text style={[typography.body, { color: colors.textSecondary }]}>{item.notes}</Text>
          </Section>
        ) : null}

        <View style={styles.actions}>
          <View style={{ flex: 1 }}>
            <Button label="Edit" onPress={() => navigation.navigate("ItemEdit", { itemId: item.id })} fullWidth />
          </View>
          <View style={{ width: spacing.md }} />
          <View style={{ flex: 1 }}>
            <Button label="Remove" variant="danger" onPress={confirmDelete} fullWidth />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children, colors }: { title: string; children: React.ReactNode; colors: ReturnType<typeof useThemeMode>["colors"] }) {
  return (
    <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[typography.subtitle, { color: colors.textPrimary, marginBottom: spacing.sm }]}>{title}</Text>
      {children}
    </View>
  );
}

function InfoRow({
  label,
  value,
  valueColor,
  colors,
}: {
  label: string;
  value: string | null | undefined;
  valueColor?: string;
  colors: ReturnType<typeof useThemeMode>["colors"];
}) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={[typography.caption, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[typography.bodyBold, { color: valueColor ?? colors.textPrimary }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { paddingBottom: spacing.xxl * 2 },
  photoScroll: { height: 280 },
  photo: { width: Dimensions.get("window").width, height: 280 },
  photoPlaceholder: { height: 220, alignItems: "center", justifyContent: "center" },
  dotsRow: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: spacing.sm },
  dot: { width: 6, height: 6, borderRadius: 3 },
  headerRow: { flexDirection: "row", alignItems: "flex-start", padding: spacing.lg },
  categoryRow: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  qtyBadge: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill },
  section: { marginHorizontal: spacing.lg, marginBottom: spacing.md, padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  actions: { flexDirection: "row", paddingHorizontal: spacing.lg, marginTop: spacing.md },
});
