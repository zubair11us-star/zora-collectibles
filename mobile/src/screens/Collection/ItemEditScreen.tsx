import React, { useEffect, useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { useThemeMode } from "@/theme/ThemeProvider";
import { radius, spacing, typography } from "@/theme/typography";
import { Button } from "@/components/Button";
import { SelectField, TextField } from "@/components/FormField";
import { ConfidenceBadge, LowConfidenceWarning } from "@/components/ConfidenceBadge";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import {
  CreateItemInput,
  createItem,
  findPossibleDuplicate,
  getItemWithDetails,
  incrementQuantity,
  updateItem,
} from "@/db/repositories/itemsRepo";
import { addPhoto } from "@/db/repositories/photosRepo";
import { addValuation } from "@/db/repositories/valuationsRepo";
import { recordIdentification } from "@/db/repositories/aiRepo";
import { listLocations, listStorageBoxes } from "@/db/repositories/locationsRepo";
import { deleteWishlistEntry } from "@/db/repositories/wishlistRepo";
import { persistCollectibleImage } from "@/services/imageService";
import { useScanSessionStore } from "@/state/useScanSessionStore";
import { CATEGORY_META, CATEGORY_ORDER } from "@/types/categoryFields";
import {
  CategoryKey,
  ITEM_CONDITIONS,
  ItemCondition,
  Location,
  SaleStatus,
  StorageBox,
  SUPPORTED_CURRENCIES,
} from "@/types/models";

const SALE_STATUSES: { value: SaleStatus; label: string }[] = [
  { value: "not_for_sale", label: "Not For Sale" },
  { value: "planned", label: "Planned" },
  { value: "listed", label: "Listed" },
  { value: "reserved", label: "Reserved" },
  { value: "sold", label: "Sold" },
];

// Sale metadata beyond saleStatus/sellingPrice (which have dedicated columns)
// is stored as reserved item_attributes keys to avoid a schema migration.
const SALE_ATTR_MIN_PRICE = "_sale_minPrice";
const SALE_ATTR_MARKETPLACE = "_sale_marketplace";
const SALE_ATTR_LISTING_DATE = "_sale_listingDate";
const SALE_ATTR_BUYER = "_sale_buyer";
import { RootStackParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type EditRoute = RouteProp<RootStackParamList, "ItemEdit">;

type CommonFormState = {
  name: string;
  description: string;
  brand: string;
  country: string;
  manufacturer: string;
  year: string;
  series: string;
  setName: string;
  model: string;
  catalogNumber: string;
  cardNumber: string;
  denomination: string;
  currency: string;
  serialNumber: string;
  condition: ItemCondition;
  grade: string;
  quantity: string;
  purchaseDate: string;
  purchasePrice: string;
  purchaseCurrency: string;
  currentValue: string;
  currentValueCurrency: string;
  notes: string;
};

const BLANK_COMMON: CommonFormState = {
  name: "",
  description: "",
  brand: "",
  country: "",
  manufacturer: "",
  year: "",
  series: "",
  setName: "",
  model: "",
  catalogNumber: "",
  cardNumber: "",
  denomination: "",
  currency: "AED",
  serialNumber: "",
  condition: "unspecified",
  grade: "",
  quantity: "1",
  purchaseDate: "",
  purchasePrice: "",
  purchaseCurrency: "AED",
  currentValue: "",
  currentValueCurrency: "AED",
  notes: "",
};

export function ItemEditScreen() {
  const { colors } = useThemeMode();
  const navigation = useNavigation<Nav>();
  const route = useRoute<EditRoute>();
  const scanSession = useScanSessionStore();

  const isEditingExisting = !!route.params?.itemId;

  const [categoryKey, setCategoryKey] = useState<CategoryKey>(
    route.params?.categoryHint ?? scanSession.identification?.category ?? "other"
  );
  const [common, setCommon] = useState<CommonFormState>(BLANK_COMMON);
  const [attributes, setAttributes] = useState<Record<string, string>>({});
  const [locations, setLocations] = useState<Location[]>([]);
  const [boxes, setBoxes] = useState<StorageBox[]>([]);
  const [locationId, setLocationId] = useState<string | undefined>();
  const [storageBoxId, setStorageBoxId] = useState<string | undefined>();
  const [storagePosition, setStoragePosition] = useState("");
  const [barcode, setBarcode] = useState(scanSession.scannedBarcode ?? "");
  const [saleStatus, setSaleStatus] = useState<SaleStatus>("not_for_sale");
  const [sellingPrice, setSellingPrice] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [marketplace, setMarketplace] = useState("");
  const [listingDate, setListingDate] = useState("");
  const [buyer, setBuyer] = useState("");
  const [previousCurrentValue, setPreviousCurrentValue] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [existingPhotoPaths, setExistingPhotoPaths] = useState<string[]>([]);

  const identification = scanSession.identification;

  useEffect(() => {
    (async () => {
      setLocations(await listLocations());
      setBoxes(await listStorageBoxes());

      if (route.params?.itemId) {
        const details = await getItemWithDetails(route.params.itemId);
        if (!details) return;
        setCategoryKey(details.category.key);
        setCommon({
          name: details.name,
          description: details.description ?? "",
          brand: details.brand ?? "",
          country: details.country ?? "",
          manufacturer: details.manufacturer ?? "",
          year: details.year ? String(details.year) : "",
          series: details.series ?? "",
          setName: details.setName ?? "",
          model: details.model ?? "",
          catalogNumber: details.catalogNumber ?? "",
          cardNumber: details.cardNumber ?? "",
          denomination: details.denomination ?? "",
          currency: details.currency ?? "AED",
          serialNumber: details.serialNumber ?? "",
          condition: details.condition,
          grade: details.grade ?? "",
          quantity: String(details.quantity),
          purchaseDate: details.purchaseDate ?? "",
          purchasePrice: details.purchasePrice != null ? String(details.purchasePrice) : "",
          purchaseCurrency: details.purchaseCurrency ?? "AED",
          currentValue: details.currentValue != null ? String(details.currentValue) : "",
          currentValueCurrency: details.currentValueCurrency ?? "AED",
          notes: details.notes ?? "",
        });
        setAttributes(details.attributes);
        setLocationId(details.locationId ?? undefined);
        setStorageBoxId(details.storageBoxId ?? undefined);
        setStoragePosition(details.storagePosition ?? "");
        setBarcode(details.barcode ?? "");
        setSaleStatus(details.saleStatus);
        setSellingPrice(details.sellingPrice != null ? String(details.sellingPrice) : "");
        setMinPrice(details.attributes[SALE_ATTR_MIN_PRICE] ?? "");
        setMarketplace(details.attributes[SALE_ATTR_MARKETPLACE] ?? "");
        setListingDate(details.attributes[SALE_ATTR_LISTING_DATE] ?? "");
        setBuyer(details.attributes[SALE_ATTR_BUYER] ?? "");
        setPreviousCurrentValue(details.currentValue);
        setExistingPhotoPaths(details.photos.map((p) => p.filePath));
      } else if (identification?.ok) {
        const f = identification.fields;
        setCommon((c) => ({
          ...c,
          name: (f.name as string) ?? c.name,
          country: (f.country as string) ?? c.country,
          manufacturer: (f.manufacturer as string) ?? c.manufacturer,
          year: f.year != null ? String(f.year) : c.year,
          series: (f.series as string) ?? c.series,
          setName: (f.setName as string) ?? c.setName,
          model: (f.model as string) ?? c.model,
          catalogNumber: (f.catalogNumber as string) ?? c.catalogNumber,
          cardNumber: (f.cardNumber as string) ?? c.cardNumber,
          denomination: (f.denomination as string) ?? c.denomination,
          currency: (f.currency as string) ?? c.currency,
          serialNumber: (f.serialNumber as string) ?? c.serialNumber,
          condition: (f.condition as ItemCondition) ?? c.condition,
        }));
        const catFieldKeys = new Set(CATEGORY_META[identification.category].fields.map((fd) => fd.key));
        const attrs: Record<string, string> = {};
        for (const [key, value] of Object.entries(f)) {
          if (catFieldKeys.has(key) && value != null) attrs[key] = String(value);
        }
        setAttributes(attrs);
      } else if (route.params?.initialName) {
        setCommon((c) => ({ ...c, name: route.params!.initialName! }));
      }
    })();
  }, [route.params?.itemId, identification]);

  const categoryFields = CATEGORY_META[categoryKey].fields;

  const setCommonField = (key: keyof CommonFormState) => (value: string) =>
    setCommon((c) => ({ ...c, [key]: value }));

  const validate = (): string | null => {
    if (!common.name.trim()) return "Item name is required.";
    return null;
  };

  type DuplicateAction = "add_quantity" | "create_new" | "cancel";

  const askDuplicateAction = (existingName: string): Promise<DuplicateAction> =>
    new Promise((resolve) => {
      Alert.alert(
        "Possible Duplicate Found",
        `You already have "${existingName}" in your collection. What would you like to do?`,
        [
          { text: "Cancel", style: "cancel", onPress: () => resolve("cancel") },
          { text: "Create Separate Item", onPress: () => resolve("create_new") },
          { text: "Add 1 to Quantity", onPress: () => resolve("add_quantity") },
        ],
        { cancelable: true, onDismiss: () => resolve("cancel") }
      );
    });

  const handleSave = async () => {
    const error = validate();
    if (error) {
      Alert.alert("Missing information", error);
      return;
    }
    setSaving(true);
    try {
      if (!isEditingExisting) {
        const duplicate = await findPossibleDuplicate({
          categoryKey,
          name: common.name,
          setName: common.setName || undefined,
          year: common.year ? Number(common.year) : undefined,
          cardNumber: common.cardNumber || undefined,
          catalogNumber: common.catalogNumber || undefined,
          serialNumber: common.serialNumber || undefined,
          barcode: barcode || undefined,
        });

        if (duplicate) {
          const action = await askDuplicateAction(duplicate.name);
          if (action === "cancel") {
            setSaving(false);
            return;
          }
          if (action === "add_quantity") {
            await incrementQuantity(duplicate.id, common.quantity ? Number(common.quantity) : 1);
            for (const capture of scanSession.captures) {
              const stored = await persistCollectibleImage(capture.uri, duplicate.id);
              await addPhoto({
                itemId: duplicate.id,
                type: capture.side,
                filePath: stored.filePath,
                thumbnailPath: stored.thumbnailPath,
                width: stored.width,
                height: stored.height,
              });
            }
            scanSession.reset();
            navigation.replace("ItemDetails", { itemId: duplicate.id });
            return;
          }
          // action === "create_new": fall through to normal create flow below
        }
      }

      const input: CreateItemInput = {
        categoryKey,
        name: common.name.trim(),
        description: common.description || undefined,
        brand: common.brand || undefined,
        country: common.country || undefined,
        manufacturer: common.manufacturer || undefined,
        year: common.year ? Number(common.year) : undefined,
        series: common.series || undefined,
        setName: common.setName || undefined,
        model: common.model || undefined,
        catalogNumber: common.catalogNumber || undefined,
        cardNumber: common.cardNumber || undefined,
        denomination: common.denomination || undefined,
        currency: common.currency || undefined,
        serialNumber: common.serialNumber || undefined,
        condition: common.condition,
        grade: common.grade || undefined,
        quantity: common.quantity ? Number(common.quantity) : 1,
        purchaseDate: common.purchaseDate || undefined,
        purchasePrice: common.purchasePrice ? Number(common.purchasePrice) : undefined,
        purchaseCurrency: common.purchaseCurrency || undefined,
        currentValue: common.currentValue ? Number(common.currentValue) : undefined,
        currentValueCurrency: common.currentValueCurrency || undefined,
        locationId: locationId ?? null,
        storageBoxId: storageBoxId ?? null,
        storagePosition: storagePosition || null,
        barcode: barcode || undefined,
        identificationSource: identification?.ok ? "ai" : isEditingExisting ? undefined : "manual",
        aiConfidence: identification?.ok ? identification.confidence : undefined,
        notes: common.notes || undefined,
        saleStatus,
        sellingPrice: sellingPrice ? Number(sellingPrice) : undefined,
        attributes: {
          ...attributes,
          [SALE_ATTR_MIN_PRICE]: minPrice,
          [SALE_ATTR_MARKETPLACE]: marketplace,
          [SALE_ATTR_LISTING_DATE]: listingDate,
          [SALE_ATTR_BUYER]: buyer,
        },
      };

      let itemId = route.params?.itemId;
      if (itemId) {
        const newValue = input.currentValue;
        await updateItem(itemId, input);
        if (newValue != null && newValue !== previousCurrentValue) {
          await addValuation({
            itemId,
            value: newValue,
            currency: input.currentValueCurrency ?? "AED",
            source: "manual",
            updateItemCurrentValue: false,
          });
        }
      } else {
        itemId = await createItem(input);
        if (route.params?.fulfillsWishlistId) {
          await deleteWishlistEntry(route.params.fulfillsWishlistId);
        }
      }

      if (identification?.ok) {
        await recordIdentification(categoryKey, identification, itemId);
      }

      for (const capture of scanSession.captures) {
        const stored = await persistCollectibleImage(capture.uri, itemId);
        await addPhoto({
          itemId,
          type: capture.side,
          filePath: stored.filePath,
          thumbnailPath: stored.thumbnailPath,
          width: stored.width,
          height: stored.height,
        });
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      scanSession.reset();
      navigation.replace("ItemDetails", { itemId });
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      Alert.alert("Couldn't save item", err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  };

  const allPhotoUris = [...existingPhotoPaths, ...scanSession.captures.map((c) => c.uri)];

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        {identification && (
          <View style={styles.aiBanner}>
            <ConfidenceBadge confidence={identification.confidence} />
            {identification.confidence < 70 && <LowConfidenceWarning />}
          </View>
        )}

        {allPhotoUris.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoRow}>
            {allPhotoUris.map((uri, idx) => (
              <Image key={idx} source={{ uri }} style={styles.photoThumb} />
            ))}
          </ScrollView>
        )}

        {!isEditingExisting && (
          <SelectField
            label="Category"
            value={CATEGORY_META[categoryKey].name}
            options={CATEGORY_ORDER.map((k) => CATEGORY_META[k].name)}
            onChange={(name) => {
              const key = CATEGORY_ORDER.find((k) => CATEGORY_META[k].name === name);
              if (key) setCategoryKey(key);
            }}
          />
        )}

        <TextField label="Item Name" value={common.name} onChangeText={setCommonField("name")} placeholder="e.g. Pikachu" />

        <CollapsibleSection title="Identification Details" icon="information-circle-outline" defaultOpen>
          <TextField label="Description" value={common.description} onChangeText={setCommonField("description")} multiline />
          <View style={styles.row2}>
            <View style={styles.col}>
              <TextField label="Country" value={common.country} onChangeText={setCommonField("country")} />
            </View>
            <View style={styles.col}>
              <TextField label="Manufacturer" value={common.manufacturer} onChangeText={setCommonField("manufacturer")} />
            </View>
          </View>
          <View style={styles.row2}>
            <View style={styles.col}>
              <TextField label="Year" value={common.year} onChangeText={setCommonField("year")} keyboardType="numeric" />
            </View>
            <View style={styles.col}>
              <TextField label="Series" value={common.series} onChangeText={setCommonField("series")} />
            </View>
          </View>
          <View style={styles.row2}>
            <View style={styles.col}>
              <TextField label="Set" value={common.setName} onChangeText={setCommonField("setName")} />
            </View>
            <View style={styles.col}>
              <TextField label="Model" value={common.model} onChangeText={setCommonField("model")} />
            </View>
          </View>
          <View style={styles.row2}>
            <View style={styles.col}>
              <TextField label="Card Number" value={common.cardNumber} onChangeText={setCommonField("cardNumber")} />
            </View>
            <View style={styles.col}>
              <TextField label="Catalog Number" value={common.catalogNumber} onChangeText={setCommonField("catalogNumber")} />
            </View>
          </View>
          <View style={styles.row2}>
            <View style={styles.col}>
              <TextField label="Denomination" value={common.denomination} onChangeText={setCommonField("denomination")} />
            </View>
            <View style={styles.col}>
              <SelectField label="Currency" value={common.currency} options={[...SUPPORTED_CURRENCIES]} onChange={setCommonField("currency")} />
            </View>
          </View>
          <TextField label="Serial Number" value={common.serialNumber} onChangeText={setCommonField("serialNumber")} />
          <TextField label="Barcode / QR Code" value={barcode} onChangeText={setBarcode} placeholder="Scanned automatically, or enter manually" />
          <SelectField
            label="Condition"
            value={common.condition}
            options={ITEM_CONDITIONS.map((c) => c.value)}
            onChange={(v) => setCommonField("condition")(v)}
          />
          <TextField label="Grade" value={common.grade} onChangeText={setCommonField("grade")} placeholder="e.g. PSA 9" />
        </CollapsibleSection>

        {categoryFields.length > 0 && (
          <CollapsibleSection title={`${CATEGORY_META[categoryKey].name} Details`} icon="pricetags-outline" defaultOpen>
            {categoryFields.map((field) =>
              field.type === "select" ? (
                <SelectField
                  key={field.key}
                  label={field.label}
                  value={attributes[field.key] ?? ""}
                  options={field.options ?? []}
                  onChange={(v) => setAttributes((a) => ({ ...a, [field.key]: v }))}
                />
              ) : (
                <TextField
                  key={field.key}
                  label={field.label}
                  value={attributes[field.key] ?? ""}
                  onChangeText={(v) => setAttributes((a) => ({ ...a, [field.key]: v }))}
                  keyboardType={field.type === "number" ? "decimal-pad" : "default"}
                />
              )
            )}
          </CollapsibleSection>
        )}

        <CollapsibleSection title="Value & Purchase" icon="cash-outline" defaultOpen>
          <View style={styles.row2}>
            <View style={styles.col}>
              <TextField label="Quantity" value={common.quantity} onChangeText={setCommonField("quantity")} keyboardType="numeric" />
            </View>
            <View style={styles.col}>
              <TextField label="Purchase Date (YYYY-MM-DD)" value={common.purchaseDate} onChangeText={setCommonField("purchaseDate")} />
            </View>
          </View>
          <View style={styles.row2}>
            <View style={styles.col}>
              <TextField label="Purchase Price" value={common.purchasePrice} onChangeText={setCommonField("purchasePrice")} keyboardType="decimal-pad" />
            </View>
            <View style={styles.col}>
              <SelectField label="Purchase Currency" value={common.purchaseCurrency} options={[...SUPPORTED_CURRENCIES]} onChange={setCommonField("purchaseCurrency")} />
            </View>
          </View>
          <View style={styles.row2}>
            <View style={styles.col}>
              <TextField label="Estimated Current Value" value={common.currentValue} onChangeText={setCommonField("currentValue")} keyboardType="decimal-pad" />
            </View>
            <View style={styles.col}>
              <SelectField label="Value Currency" value={common.currentValueCurrency} options={[...SUPPORTED_CURRENCIES]} onChange={setCommonField("currentValueCurrency")} />
            </View>
          </View>
        </CollapsibleSection>

        <CollapsibleSection title="Storage Location" icon="location-outline">
          <SelectField
            label="Location"
            value={locations.find((l) => l.id === locationId)?.name ?? "None"}
            options={["None", ...locations.map((l) => l.name)]}
            onChange={(name) => setLocationId(name === "None" ? undefined : locations.find((l) => l.name === name)?.id)}
          />
          <SelectField
            label="Storage Box"
            value={boxes.find((b) => b.id === storageBoxId)?.name ?? "None"}
            options={["None", ...boxes.map((b) => b.name)]}
            onChange={(name) => setStorageBoxId(name === "None" ? undefined : boxes.find((b) => b.name === name)?.id)}
          />
          <TextField label="Position" value={storagePosition} onChangeText={setStoragePosition} placeholder="e.g. A-12" />
        </CollapsibleSection>

        <CollapsibleSection
          title="For Sale"
          icon="pricetag-outline"
          defaultOpen={saleStatus !== "not_for_sale"}
          badge={saleStatus !== "not_for_sale" ? SALE_STATUSES.find((s) => s.value === saleStatus)?.label : undefined}
        >
          <SelectField
            label="Sale Status"
            value={SALE_STATUSES.find((s) => s.value === saleStatus)?.label ?? "Not For Sale"}
            options={SALE_STATUSES.map((s) => s.label)}
            onChange={(label) => {
              const found = SALE_STATUSES.find((s) => s.label === label);
              if (found) setSaleStatus(found.value);
            }}
          />
          {saleStatus !== "not_for_sale" && (
            <>
              <View style={styles.row2}>
                <View style={styles.col}>
                  <TextField label="Selling Price" value={sellingPrice} onChangeText={setSellingPrice} keyboardType="decimal-pad" />
                </View>
                <View style={styles.col}>
                  <TextField label="Minimum Price" value={minPrice} onChangeText={setMinPrice} keyboardType="decimal-pad" />
                </View>
              </View>
              <TextField label="Marketplace" value={marketplace} onChangeText={setMarketplace} placeholder="e.g. eBay, local meetup" />
              <View style={styles.row2}>
                <View style={styles.col}>
                  <TextField label="Listing Date (YYYY-MM-DD)" value={listingDate} onChangeText={setListingDate} />
                </View>
                <View style={styles.col}>
                  <TextField label="Buyer" value={buyer} onChangeText={setBuyer} />
                </View>
              </View>
            </>
          )}
        </CollapsibleSection>

        <TextField label="Notes" value={common.notes} onChangeText={setCommonField("notes")} multiline />

        <View style={styles.actions}>
          <Button label={saving ? "Saving…" : "Confirm & Save"} onPress={handleSave} loading={saving} fullWidth />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
  aiBanner: { marginBottom: spacing.md, gap: spacing.sm },
  photoRow: { marginBottom: spacing.md },
  photoThumb: { width: 90, height: 90, borderRadius: radius.md, marginRight: spacing.sm },
  row2: { flexDirection: "row", gap: spacing.md },
  col: { flex: 1 },
  actions: { marginTop: spacing.lg },
});
