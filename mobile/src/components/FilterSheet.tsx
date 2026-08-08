import React, { useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, View } from "react-native";

import { useThemeMode } from "@/theme/ThemeProvider";
import { radius, spacing, typography } from "@/theme/typography";
import { SelectField, TextField } from "./FormField";
import { Button } from "./Button";
import { ItemListFilter } from "@/db/repositories/itemsRepo";
import { CATEGORY_META, CATEGORY_ORDER } from "@/types/categoryFields";
import { ITEM_CONDITIONS } from "@/types/models";

interface FilterSheetProps {
  visible: boolean;
  initialFilter: ItemListFilter;
  onClose: () => void;
  onApply: (filter: ItemListFilter) => void;
}

export function FilterSheet({ visible, initialFilter, onClose, onApply }: FilterSheetProps) {
  const { colors } = useThemeMode();
  const [filter, setFilter] = useState<ItemListFilter>(initialFilter);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <Text style={[typography.title, { color: colors.textPrimary, marginBottom: spacing.md }]}>Filters</Text>
          <ScrollView>
            <SelectField
              label="Category"
              value={filter.categoryKey ? CATEGORY_META[filter.categoryKey].name : "All"}
              options={["All", ...CATEGORY_ORDER.map((k) => CATEGORY_META[k].name)]}
              onChange={(name) => {
                const key = CATEGORY_ORDER.find((k) => CATEGORY_META[k].name === name);
                setFilter((f) => ({ ...f, categoryKey: name === "All" ? undefined : key }));
              }}
            />
            <SelectField
              label="Condition"
              value={filter.condition ?? "All"}
              options={["All", ...ITEM_CONDITIONS.map((c) => c.value)]}
              onChange={(value) =>
                setFilter((f) => ({ ...f, condition: value === "All" ? undefined : (value as never) }))
              }
            />
            <TextField
              label="Country"
              value={filter.country ?? ""}
              onChangeText={(v) => setFilter((f) => ({ ...f, country: v || undefined }))}
              placeholder="e.g. Pakistan"
            />
            <TextField
              label="Year"
              value={filter.year ? String(filter.year) : ""}
              onChangeText={(v) => setFilter((f) => ({ ...f, year: v ? Number(v) : undefined }))}
              placeholder="e.g. 1999"
              keyboardType="numeric"
            />
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <TextField
                  label="Min Value"
                  value={filter.minValue != null ? String(filter.minValue) : ""}
                  onChangeText={(v) => setFilter((f) => ({ ...f, minValue: v ? Number(v) : undefined }))}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={{ width: spacing.md }} />
              <View style={{ flex: 1 }}>
                <TextField
                  label="Max Value"
                  value={filter.maxValue != null ? String(filter.maxValue) : ""}
                  onChangeText={(v) => setFilter((f) => ({ ...f, maxValue: v ? Number(v) : undefined }))}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
            <SelectField
              label="Special"
              value={filter.missingPhotos ? "Missing Photos" : filter.missingInfo ? "Missing Info" : "None"}
              options={["None", "Missing Photos", "Missing Info"]}
              onChange={(value) =>
                setFilter((f) => ({
                  ...f,
                  missingPhotos: value === "Missing Photos" ? true : undefined,
                  missingInfo: value === "Missing Info" ? true : undefined,
                }))
              }
            />
            <SelectField
              label="Sale Status"
              value={filter.forSaleOnly ? "For Sale Only" : "All Items"}
              options={["All Items", "For Sale Only"]}
              onChange={(value) => setFilter((f) => ({ ...f, forSaleOnly: value === "For Sale Only" ? true : undefined }))}
            />
          </ScrollView>
          <View style={styles.actions}>
            <View style={{ flex: 1 }}>
              <Button label="Clear" variant="ghost" onPress={() => setFilter({})} fullWidth />
            </View>
            <View style={{ width: spacing.md }} />
            <View style={{ flex: 1 }}>
              <Button
                label="Apply Filters"
                onPress={() => {
                  onApply(filter);
                  onClose();
                }}
                fullWidth
              />
            </View>
          </View>
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
    maxHeight: "85%",
  },
  row: { flexDirection: "row" },
  actions: { flexDirection: "row", marginTop: spacing.md },
});
