import React, { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useFocusEffect, useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

import { useThemeMode } from "@/theme/ThemeProvider";
import { radius, spacing, typography } from "@/theme/typography";
import { ItemCard } from "@/components/ItemCard";
import { EmptyState } from "@/components/EmptyState";
import { FilterSheet } from "@/components/FilterSheet";
import {
  ItemListFilter,
  ItemListRow,
  ItemSortField,
  listItems,
} from "@/db/repositories/itemsRepo";
import { RootStackParamList } from "@/navigation/types";
import { BottomTabParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type CollectionRoute = RouteProp<BottomTabParamList, "Collection">;

type ViewMode = "grid" | "list" | "gallery";
type IoniconName = ComponentProps<typeof Ionicons>["name"];
const VIEW_MODE_ICONS: Record<ViewMode, IoniconName> = {
  grid: "grid-outline",
  list: "list-outline",
  gallery: "images-outline",
};
const SORT_OPTIONS: { field: ItemSortField; label: string }[] = [
  { field: "createdAt", label: "Recently Added" },
  { field: "name", label: "Name" },
  { field: "currentValue", label: "Value" },
  { field: "purchasePrice", label: "Purchase Price" },
  { field: "year", label: "Year" },
];

export function CollectionListScreen() {
  const { colors } = useThemeMode();
  const navigation = useNavigation<Nav>();
  const route = useRoute<CollectionRoute>();

  const [items, setItems] = useState<ItemListRow[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState<ItemListFilter>({});
  const [sortField, setSortField] = useState<ItemSortField>("createdAt");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [filterVisible, setFilterVisible] = useState(false);

  useEffect(() => {
    if (route.params?.categoryKey) {
      setFilter((f) => ({ ...f, categoryKey: route.params?.categoryKey }));
    }
  }, [route.params?.categoryKey]);

  // Debounce the search query so each keystroke doesn't hit the database —
  // the input itself still updates instantly, only the query is delayed.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    const rows = await listItems({
      filter: { ...filter, searchText: debouncedSearch || undefined },
      sortField,
      sortDir: sortField === "name" ? "asc" : "desc",
    });
    setItems(rows);
  }, [filter, debouncedSearch, sortField]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const activeFilterCount = Object.values(filter).filter((v) => v !== undefined).length;

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={["top"]}>
      <View style={styles.header}>
        <Text style={[typography.title, { color: colors.textPrimary }]}>Collection</Text>
        <View style={styles.viewModeRow}>
          {(["grid", "list", "gallery"] as ViewMode[]).map((mode) => (
            <Pressable
              key={mode}
              onPress={() => setViewMode(mode)}
              accessibilityRole="button"
              accessibilityLabel={`${mode.charAt(0).toUpperCase()}${mode.slice(1)} view`}
              accessibilityState={{ selected: viewMode === mode }}
              style={[
                styles.modeBtn,
                { backgroundColor: viewMode === mode ? colors.accent : colors.surfaceAlt },
              ]}
            >
              <Ionicons name={VIEW_MODE_ICONS[mode]} size={16} color={viewMode === mode ? "#fff" : colors.textSecondary} />
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search name, country, set, barcode…"
          placeholderTextColor={colors.textMuted}
          style={[styles.search, { backgroundColor: colors.surfaceAlt, color: colors.textPrimary, borderColor: colors.border }]}
        />
        <Pressable
          onPress={() => setFilterVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={activeFilterCount > 0 ? `Filters, ${activeFilterCount} active` : "Filters"}
          style={[styles.filterBtn, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
        >
          <Ionicons name="options-outline" size={20} color={colors.textPrimary} />
          {activeFilterCount > 0 && (
            <View style={[styles.filterBadge, { backgroundColor: colors.accent }]}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={SORT_OPTIONS}
        keyExtractor={(o) => o.field}
        style={styles.sortRow}
        contentContainerStyle={{ gap: spacing.xs }}
        renderItem={({ item: option }) => (
          <Pressable
            onPress={() => setSortField(option.field)}
            style={[
              styles.sortChip,
              {
                backgroundColor: sortField === option.field ? colors.accent : colors.surfaceAlt,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={{ color: sortField === option.field ? "#fff" : colors.textSecondary, fontSize: 12 }}>
              {option.label}
            </Text>
          </Pressable>
        )}
      />

      {items.length === 0 ? (
        <EmptyState icon="search-outline" title="No items found" body="Try adjusting your search or filters, or scan a new item." />
      ) : (
        <FlatList
          key={viewMode}
          data={items}
          keyExtractor={(i) => i.id}
          numColumns={viewMode === "grid" ? 2 : 1}
          columnWrapperStyle={viewMode === "grid" ? { justifyContent: "space-between" } : undefined}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={viewMode === "grid" ? { marginBottom: spacing.md } : undefined}>
              <ItemCard item={item} mode={viewMode} onPress={() => navigation.navigate("ItemDetails", { itemId: item.id })} />
            </View>
          )}
        />
      )}

      <FilterSheet
        visible={filterVisible}
        initialFilter={filter}
        onClose={() => setFilterVisible(false)}
        onApply={setFilter}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  viewModeRow: { flexDirection: "row", gap: spacing.xs },
  modeBtn: { width: 32, height: 32, borderRadius: radius.sm, alignItems: "center", justifyContent: "center" },
  searchRow: { flexDirection: "row", paddingHorizontal: spacing.lg, marginTop: spacing.md, gap: spacing.sm },
  search: { flex: 1, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.md, height: 44 },
  filterBtn: { width: 44, height: 44, borderRadius: radius.md, borderWidth: 1, alignItems: "center", justifyContent: "center", position: "relative" },
  filterBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  filterBadgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  sortRow: { paddingHorizontal: spacing.lg, marginTop: spacing.md, maxHeight: 40 },
  sortChip: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 6, marginRight: spacing.xs },
  listContent: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
});
