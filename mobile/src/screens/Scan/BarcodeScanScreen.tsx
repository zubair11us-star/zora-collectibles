import React, { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { CameraView, useCameraPermissions, BarcodeScanningResult } from "expo-camera";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useThemeMode } from "@/theme/ThemeProvider";
import { radius, spacing, typography } from "@/theme/typography";
import { Button } from "@/components/Button";
import { RootStackParamList } from "@/navigation/types";
import { useScanSessionStore } from "@/state/useScanSessionStore";
import { ExternalBarcodeMatch, lookupBarcode, lookupExternalBarcode } from "@/services/barcodeService";
import { ItemListRow } from "@/db/repositories/itemsRepo";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function BarcodeScanScreen() {
  const { colors } = useThemeMode();
  const navigation = useNavigation<Nav>();
  const scanSession = useScanSessionStore();
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [matches, setMatches] = useState<ItemListRow[] | null>(null);
  const [externalMatch, setExternalMatch] = useState<ExternalBarcodeMatch | null>(null);
  const [externalLookupLoading, setExternalLookupLoading] = useState(false);
  const [locked, setLocked] = useState(false);

  if (!permission) return <View style={styles.flex} />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.flex, styles.center, { backgroundColor: colors.background }]}>
        <Text style={[typography.subtitle, { color: colors.textPrimary, textAlign: "center", marginBottom: spacing.md }]}>
          Zora needs camera access to scan barcodes.
        </Text>
        <Button label="Grant Camera Access" onPress={requestPermission} />
      </SafeAreaView>
    );
  }

  const handleScanned = async (result: BarcodeScanningResult) => {
    if (locked) return;
    setLocked(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setScannedCode(result.data);
    const lookup = await lookupBarcode(result.data);
    setMatches(lookup.matches);

    if (lookup.matches.length === 0) {
      setExternalLookupLoading(true);
      const external = await lookupExternalBarcode(result.data);
      setExternalMatch(external);
      setExternalLookupLoading(false);
    }
  };

  const reset = () => {
    setScannedCode(null);
    setMatches(null);
    setExternalMatch(null);
    setExternalLookupLoading(false);
    setLocked(false);
  };

  const useExternalMatchName = () => {
    if (!scannedCode || !externalMatch) return;
    scanSession.setScannedBarcode(scannedCode);
    navigation.replace("ItemEdit", {
      categoryHint: scanSession.categoryHint ?? undefined,
      initialName: externalMatch.title,
    });
  };

  if (scannedCode) {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]}>
        <View style={styles.resultWrap}>
          <Text style={[typography.subtitle, { color: colors.textPrimary }]}>Scanned Code</Text>
          <Text style={[typography.bodyBold, { color: colors.accent, marginBottom: spacing.lg }]}>{scannedCode}</Text>

          {matches && matches.length > 0 ? (
            <>
              <Text style={[typography.body, { color: colors.textSecondary, marginBottom: spacing.sm }]}>
                Found {matches.length} matching item(s) already in your collection:
              </Text>
              <FlatList
                data={matches}
                keyExtractor={(m) => m.id}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => navigation.replace("ItemDetails", { itemId: item.id })}
                    style={[styles.matchRow, { borderColor: colors.border, backgroundColor: colors.surface }]}
                  >
                    <Text style={{ color: colors.textPrimary, fontWeight: "700" }}>{item.name}</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                      {item.category.name} • Qty {item.quantity}
                    </Text>
                  </Pressable>
                )}
              />
              <View style={{ marginTop: spacing.md }}>
                <Button label="Scan Another Code" variant="secondary" onPress={reset} fullWidth />
              </View>
            </>
          ) : (
            <>
              <Text style={[typography.body, { color: colors.textSecondary, marginBottom: spacing.md }]}>
                No matching item in your collection yet. Identify it with AI or enter it manually — the scanned code
                will be saved with the new item.
              </Text>

              {externalLookupLoading && (
                <View style={[styles.externalCard, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                  <ActivityIndicator color={colors.accent} />
                  <Text style={{ color: colors.textMuted, marginTop: spacing.sm, fontSize: 12 }}>
                    Checking a public product database…
                  </Text>
                </View>
              )}

              {externalMatch && (
                <View style={[styles.externalCard, { borderColor: colors.info, backgroundColor: colors.info + "14" }]}>
                  <Text style={[typography.label, { color: colors.info }]}>UNVERIFIED — FROM PUBLIC DATABASE</Text>
                  <Text style={[typography.bodyBold, { color: colors.textPrimary, marginTop: spacing.xs }]}>
                    {externalMatch.title}
                  </Text>
                  {externalMatch.brand && (
                    <Text style={{ color: colors.textMuted, fontSize: 12 }}>{externalMatch.brand}</Text>
                  )}
                  <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: spacing.xs }}>
                    Not verified by Zora — review before saving.
                  </Text>
                  <View style={{ marginTop: spacing.sm }}>
                    <Button label="Use This Info" variant="secondary" onPress={useExternalMatchName} fullWidth />
                  </View>
                </View>
              )}

              <Button
                label="Identify with AI Camera"
                onPress={() => {
                  scanSession.setScannedBarcode(scannedCode);
                  navigation.replace("CameraScan", { categoryHint: scanSession.categoryHint ?? undefined });
                }}
                fullWidth
              />
              <View style={{ height: spacing.md }} />
              <Button
                label="Manual Entry"
                variant="secondary"
                onPress={() => {
                  scanSession.setScannedBarcode(scannedCode);
                  navigation.replace("ItemEdit", { categoryHint: scanSession.categoryHint ?? undefined });
                }}
                fullWidth
              />
              <View style={{ height: spacing.md }} />
              <Button label="Scan Another Code" variant="ghost" onPress={reset} fullWidth />
            </>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.flex}>
      <CameraView
        style={styles.flex}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128", "qr"] }}
        onBarcodeScanned={handleScanned}
      >
        <SafeAreaView style={styles.overlay} edges={["top", "bottom"]}>
          <View style={styles.topBar}>
            <Pressable onPress={() => navigation.goBack()} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#fff" />
            </Pressable>
            <Text style={styles.topBarTitle}>Scan Barcode / QR</Text>
            <View style={{ width: 40 }} />
          </View>
          <View style={styles.frameWrap}>
            <View style={styles.frame} />
            <Text style={styles.frameHint}>Align the code inside the frame</Text>
          </View>
          <View style={{ height: 80 }} />
        </SafeAreaView>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignItems: "center", justifyContent: "center", padding: spacing.xl },
  overlay: { flex: 1, justifyContent: "space-between" },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.lg },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" },
  topBarTitle: { color: "#fff", fontWeight: "700", fontSize: 16 },
  frameWrap: { alignItems: "center", justifyContent: "center", flex: 1 },
  frame: { width: "70%", aspectRatio: 1.6, borderWidth: 2, borderColor: "#fff", borderRadius: radius.lg },
  frameHint: { color: "#fff", marginTop: spacing.md, fontSize: 13 },
  resultWrap: { flex: 1, padding: spacing.lg },
  matchRow: { borderWidth: 1, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  externalCard: { borderWidth: 1, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg },
});
