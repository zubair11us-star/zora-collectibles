import React, { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import { useThemeMode } from "@/theme/ThemeProvider";
import { spacing } from "@/theme/typography";
import { Button } from "@/components/Button";
import { SelectField, TextField } from "@/components/FormField";
import {
  addWishlistEntry,
  deleteWishlistEntry,
  getWishlistEntryById,
  updateWishlistEntry,
} from "@/db/repositories/wishlistRepo";
import { useScanSessionStore } from "@/state/useScanSessionStore";
import { CATEGORY_META, CATEGORY_ORDER } from "@/types/categoryFields";
import { CategoryKey, ITEM_CONDITIONS, ItemCondition, SUPPORTED_CURRENCIES, WishlistPriority } from "@/types/models";
import { RootStackParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type WishlistEditRoute = RouteProp<RootStackParamList, "WishlistEdit">;

const PRIORITIES: WishlistPriority[] = ["low", "medium", "high"];

export function WishlistEditScreen() {
  const { colors } = useThemeMode();
  const navigation = useNavigation<Nav>();
  const route = useRoute<WishlistEditRoute>();
  const scanSession = useScanSessionStore();

  const isEditingExisting = !!route.params?.wishlistId;

  const [name, setName] = useState("");
  const [categoryKey, setCategoryKey] = useState<CategoryKey | null>(null);
  const [desiredCondition, setDesiredCondition] = useState<ItemCondition>("unspecified");
  const [targetPrice, setTargetPrice] = useState("");
  const [targetCurrency, setTargetCurrency] = useState("AED");
  const [priority, setPriority] = useState<WishlistPriority>("medium");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      if (route.params?.wishlistId) {
        const entry = await getWishlistEntryById(route.params.wishlistId);
        if (!entry) return;
        setName(entry.name);
        setCategoryKey(entry.categoryKey);
        setDesiredCondition(entry.desiredCondition);
        setTargetPrice(entry.targetPrice != null ? String(entry.targetPrice) : "");
        setTargetCurrency(entry.targetCurrency ?? "AED");
        setPriority(entry.priority);
        setNotes(entry.notes ?? "");
      } else if (scanSession.intent === "wishlist" && scanSession.identification?.ok) {
        const f = scanSession.identification.fields;
        setName((f.name as string) ?? "");
        setCategoryKey(scanSession.identification.category);
      }
    })();
  }, [route.params?.wishlistId]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Missing information", "Item name is required.");
      return;
    }
    setSaving(true);
    try {
      const input = {
        name: name.trim(),
        categoryKey: categoryKey ?? undefined,
        desiredCondition,
        targetPrice: targetPrice ? Number(targetPrice) : undefined,
        targetCurrency,
        priority,
        notes: notes || undefined,
      };

      if (route.params?.wishlistId) {
        await updateWishlistEntry(route.params.wishlistId, input);
      } else {
        await addWishlistEntry(input);
      }

      scanSession.reset();
      navigation.goBack();
    } catch (err) {
      Alert.alert("Couldn't save wishlist item", err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  };

  const handleMoveToCollection = () => {
    if (!route.params?.wishlistId) return;
    navigation.replace("ItemEdit", {
      categoryHint: categoryKey ?? undefined,
      initialName: name,
      fulfillsWishlistId: route.params.wishlistId,
    });
  };

  const handleDelete = () => {
    if (!route.params?.wishlistId) return;
    Alert.alert("Remove from wishlist?", undefined, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          await deleteWishlistEntry(route.params.wishlistId!);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <TextField label="Item Name" value={name} onChangeText={setName} placeholder="e.g. Charizard Base Set" />
        <SelectField
          label="Category"
          value={categoryKey ? CATEGORY_META[categoryKey].name : "Any"}
          options={["Any", ...CATEGORY_ORDER.map((k) => CATEGORY_META[k].name)]}
          onChange={(name2) => {
            const key = CATEGORY_ORDER.find((k) => CATEGORY_META[k].name === name2);
            setCategoryKey(key ?? null);
          }}
        />
        <SelectField
          label="Desired Condition"
          value={desiredCondition}
          options={ITEM_CONDITIONS.map((c) => c.value)}
          onChange={(v) => setDesiredCondition(v as ItemCondition)}
        />
        <View style={styles.row2}>
          <View style={styles.col}>
            <TextField label="Target Price" value={targetPrice} onChangeText={setTargetPrice} keyboardType="decimal-pad" />
          </View>
          <View style={styles.col}>
            <SelectField label="Currency" value={targetCurrency} options={[...SUPPORTED_CURRENCIES]} onChange={setTargetCurrency} />
          </View>
        </View>
        <SelectField label="Priority" value={priority} options={PRIORITIES} onChange={(v) => setPriority(v as WishlistPriority)} />
        <TextField label="Notes" value={notes} onChangeText={setNotes} multiline />

        <View style={{ marginTop: spacing.lg }}>
          <Button label={saving ? "Saving…" : "Save"} onPress={handleSave} loading={saving} fullWidth />
        </View>

        {isEditingExisting && (
          <>
            <View style={{ marginTop: spacing.md }}>
              <Button label="Move to Collection" variant="secondary" onPress={handleMoveToCollection} fullWidth />
            </View>
            <View style={{ marginTop: spacing.md }}>
              <Button label="Remove from Wishlist" variant="danger" onPress={handleDelete} fullWidth />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
  row2: { flexDirection: "row", gap: spacing.md },
  col: { flex: 1 },
});
