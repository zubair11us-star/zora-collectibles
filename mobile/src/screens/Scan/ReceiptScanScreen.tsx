import React, { useState } from "react";
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import { useThemeMode } from "@/theme/ThemeProvider";
import { radius, spacing, typography } from "@/theme/typography";
import { Button } from "@/components/Button";
import { SelectField, TextField } from "@/components/FormField";
import { imageToBase64ForAI, persistCollectibleImage } from "@/services/imageService";
import { ocrReceipt, ReceiptOcrResponse } from "@/services/receiptOcrService";
import { recognizeTextOffline } from "@/services/offlineTextRecognitionService";
import { parseReceiptText } from "@/services/receiptTextParser";
import { addTransaction } from "@/db/repositories/transactionsRepo";
import { addPhoto } from "@/db/repositories/photosRepo";
import { SUPPORTED_CURRENCIES } from "@/types/models";
import { RootStackParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type ReceiptRoute = RouteProp<RootStackParamList, "ReceiptScan">;

export function ReceiptScanScreen() {
  const { colors } = useThemeMode();
  const navigation = useNavigation<Nav>();
  const route = useRoute<ReceiptRoute>();

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ReceiptOcrResponse | null>(null);
  const [store, setStore] = useState("");
  const [date, setDate] = useState("");
  const [total, setTotal] = useState("");
  const [currency, setCurrency] = useState("AED");
  const [saving, setSaving] = useState(false);

  const runScan = async (uri: string) => {
    setPhotoUri(uri);
    setScanning(true);
    try {
      // On-device OCR + regex parsing runs first — instant, free, fully
      // offline. Only falls back to the cloud OCR endpoint if ML Kit
      // couldn't read any text at all (e.g. a very blurry photo), since at
      // that point there's nothing for the regex parser to work with.
      const offlineText = await recognizeTextOffline(uri);
      const response: ReceiptOcrResponse =
        offlineText.ok && offlineText.lines.length > 0
          ? parseReceiptText(offlineText.text, offlineText.lines)
          : await ocrReceipt(await imageToBase64ForAI(uri));

      setResult(response);
      setStore(response.store ?? "");
      setDate(response.date ?? "");
      setTotal(response.total != null ? String(response.total) : "");
      setCurrency(response.currency ?? "AED");
    } finally {
      setScanning(false);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;
    const picked = await ImagePicker.launchCameraAsync({ quality: 0.9 });
    if (picked.canceled || picked.assets.length === 0) return;
    await runScan(picked.assets[0].uri);
  };

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.9 });
    if (picked.canceled || picked.assets.length === 0) return;
    await runScan(picked.assets[0].uri);
  };

  const saveAsTransaction = async () => {
    if (!route.params?.itemId || !photoUri) return;
    setSaving(true);
    try {
      await addTransaction({
        itemId: route.params.itemId,
        type: "purchase",
        date: date ? new Date(date).toISOString() : new Date().toISOString(),
        counterparty: store || undefined,
        price: total ? Number(total) : undefined,
        currency,
      });

      const stored = await persistCollectibleImage(photoUri, route.params.itemId);
      await addPhoto({
        itemId: route.params.itemId,
        type: "receipt",
        filePath: stored.filePath,
        thumbnailPath: stored.thumbnailPath,
        width: stored.width,
        height: stored.height,
      });

      navigation.replace("ItemDetails", { itemId: route.params.itemId });
    } catch (err) {
      Alert.alert("Couldn't save receipt", err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  };

  const startNewItemFromReceipt = () => {
    navigation.replace("ItemEdit", { initialName: store || "New Item" });
  };

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[typography.body, { color: colors.textSecondary, marginBottom: spacing.lg }]}>
          Photograph or choose a receipt. Zura will extract the store, date, and price for you to review — nothing
          is saved until you confirm.
        </Text>

        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.preview} resizeMode="cover" />
        ) : (
          <View style={[styles.placeholder, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
            <Text style={{ color: colors.textMuted }}>No receipt photo yet</Text>
          </View>
        )}

        <View style={styles.row2}>
          <View style={styles.col}>
            <Button label="Take Photo" onPress={takePhoto} fullWidth />
          </View>
          <View style={{ width: spacing.md }} />
          <View style={styles.col}>
            <Button label="Choose Photo" variant="secondary" onPress={pickPhoto} fullWidth />
          </View>
        </View>

        {scanning && (
          <View style={styles.center}>
            <ActivityIndicator color={colors.accent} />
            <Text style={{ color: colors.textMuted, marginTop: spacing.sm }}>Reading receipt…</Text>
          </View>
        )}

        {result && !scanning && (
          <View style={{ marginTop: spacing.lg }}>
            {!result.ok && (
              <View style={[styles.errorBox, { borderColor: colors.danger, backgroundColor: colors.danger + "18" }]}>
                <Text style={{ color: colors.danger, fontWeight: "700" }}>OCR unavailable</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: spacing.xs }}>
                  {result.error ?? "Couldn't reach the AI server."} You can still fill these in manually.
                </Text>
              </View>
            )}

            {result.items.length > 0 && (
              <View style={[styles.itemsBox, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <Text style={[typography.label, { color: colors.textMuted, marginBottom: spacing.xs }]}>LINE ITEMS</Text>
                {result.items.map((li, idx) => (
                  <Text key={idx} style={{ color: colors.textSecondary, fontSize: 13 }}>
                    {li.quantity ?? 1}× {li.name} {li.price != null ? `— ${li.price}` : ""}
                  </Text>
                ))}
              </View>
            )}

            <TextField label="Store / Seller" value={store} onChangeText={setStore} />
            <TextField label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} />
            <View style={styles.row2}>
              <View style={styles.col}>
                <TextField label="Total" value={total} onChangeText={setTotal} keyboardType="decimal-pad" />
              </View>
              <View style={styles.col}>
                <SelectField label="Currency" value={currency} options={[...SUPPORTED_CURRENCIES]} onChange={setCurrency} />
              </View>
            </View>

            {route.params?.itemId ? (
              <Button
                label={saving ? "Saving…" : "Save as Purchase Transaction"}
                onPress={saveAsTransaction}
                loading={saving}
                fullWidth
              />
            ) : (
              <Button label="Start New Item From This Receipt" onPress={startNewItemFromReceipt} fullWidth />
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
  preview: { width: "100%", height: 240, borderRadius: radius.lg, marginBottom: spacing.md },
  placeholder: { width: "100%", height: 240, borderRadius: radius.lg, borderWidth: 1, alignItems: "center", justifyContent: "center", marginBottom: spacing.md },
  row2: { flexDirection: "row" },
  col: { flex: 1 },
  center: { alignItems: "center", marginTop: spacing.lg },
  errorBox: { borderWidth: 1, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
  itemsBox: { borderWidth: 1, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
});
