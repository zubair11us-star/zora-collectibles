import React, { useCallback, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import { useThemeMode } from "@/theme/ThemeProvider";
import { radius, spacing, typography } from "@/theme/typography";
import { EmptyState } from "@/components/EmptyState";
import { listAllTransactions, TransactionWithItemName } from "@/db/repositories/transactionsRepo";
import { formatMoney } from "@/utils/currency";
import { TransactionType } from "@/types/models";
import { RootStackParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const TYPE_LABELS: Record<TransactionType, string> = {
  purchase: "Purchase",
  sale: "Sale",
  trade: "Trade",
  gift_received: "Gift Received",
  gift_given: "Gift Given",
  found: "Found",
  lost: "Lost",
  damaged: "Damaged",
};

const FILTER_OPTIONS: { label: string; value: TransactionType | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Purchases", value: "purchase" },
  { label: "Sales", value: "sale" },
  { label: "Trades", value: "trade" },
];

export function TransactionsListScreen() {
  const { colors } = useThemeMode();
  const navigation = useNavigation<Nav>();
  const [transactions, setTransactions] = useState<TransactionWithItemName[]>([]);
  const [filter, setFilter] = useState<TransactionType | "all">("all");

  const load = useCallback(async () => {
    const rows = await listAllTransactions(filter === "all" ? undefined : filter);
    setTransactions(rows);
  }, [filter]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={["bottom"]}>
      <View style={styles.filterRow}>
        {FILTER_OPTIONS.map((opt) => (
          <Pressable
            key={opt.value}
            onPress={() => setFilter(opt.value)}
            style={[
              styles.chip,
              { backgroundColor: filter === opt.value ? colors.accent : colors.surfaceAlt, borderColor: colors.border },
            ]}
          >
            <Text style={{ color: filter === opt.value ? "#fff" : colors.textSecondary, fontSize: 12 }}>{opt.label}</Text>
          </Pressable>
        ))}
      </View>

      {transactions.length === 0 ? (
        <EmptyState icon="receipt-outline" title="No transactions yet" body="Add a purchase, sale, or trade from any item's details page." />
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(t) => t.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const amount = item.type === "sale" ? item.netAmount : item.type === "purchase" ? item.totalCost : item.price;
            return (
              <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>{item.itemName}</Text>
                  <Text style={[typography.caption, { color: colors.textMuted }]}>
                    {TYPE_LABELS[item.type]} • {item.date.slice(0, 10)}
                    {item.counterparty ? ` • ${item.counterparty}` : ""}
                  </Text>
                </View>
                {amount != null && (
                  <Text style={[typography.bodyBold, { color: colors.accent }]}>
                    {formatMoney(amount, item.currency ?? "AED")}
                  </Text>
                )}
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  filterRow: { flexDirection: "row", gap: spacing.xs, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  chip: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 6 },
  listContent: { padding: spacing.lg, paddingTop: 0 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
});
