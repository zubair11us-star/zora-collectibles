import React, { useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useThemeMode } from "@/theme/ThemeProvider";
import { radius, spacing, typography } from "@/theme/typography";
import { Button } from "@/components/Button";
import { RootStackParamList } from "@/navigation/types";
import { useScanSessionStore } from "@/state/useScanSessionStore";
import { CATEGORY_META } from "@/types/categoryFields";
import { identifyCollectible } from "@/services/aiIdentification";
import { imageToBase64ForAI } from "@/services/imageService";
import { recognizeTextOffline } from "@/services/offlineTextRecognitionService";
import { buildOfflineIdentification } from "@/services/collectibleTextParser";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type CameraRoute = RouteProp<RootStackParamList, "CameraScan">;

export function CameraScanScreen() {
  const { colors } = useThemeMode();
  const navigation = useNavigation<Nav>();
  const route = useRoute<CameraRoute>();
  const scanSession = useScanSessionStore();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const categoryHint = route.params?.categoryHint;
  const twoSided = categoryHint ? CATEGORY_META[categoryHint].twoSided : false;
  const haveFront = scanSession.captures.some((c) => c.side === "front");
  const haveBack = scanSession.captures.some((c) => c.side === "back");
  const currentSide: "front" | "back" = !haveFront ? "front" : "back";
  const needsMoreCaptures = !haveFront || (twoSided && !haveBack);

  if (!permission) {
    return <View style={styles.flex} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.flex, styles.center, { backgroundColor: colors.background }]}>
        <Text style={[typography.subtitle, { color: colors.textPrimary, textAlign: "center", marginBottom: spacing.md }]}>
          Zura needs camera access to scan your collectibles.
        </Text>
        <Button label="Grant Camera Access" onPress={requestPermission} />
      </SafeAreaView>
    );
  }

  const capture = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const photo = await cameraRef.current?.takePictureAsync({ quality: 0.8 });
    if (!photo) return;
    scanSession.addCapture({ side: currentSide, uri: photo.uri });
  };

  const runIdentification = async () => {
    setAnalyzing(true);
    try {
      // On-device OCR runs first and always — it's instant, free, and fully
      // offline. The front photo is the most likely to carry identifying
      // text (card numbers, denominations, serials).
      const front = scanSession.captures.find((c) => c.side === "front") ?? scanSession.captures[0];
      const offlineText = front ? await recognizeTextOffline(front.uri) : { ok: false, text: "", lines: [] };

      const images = await Promise.all(
        scanSession.captures.map(async (c) => ({
          side: c.side,
          base64Jpeg: await imageToBase64ForAI(c.uri),
        }))
      );
      const cloudResult = await identifyCollectible({ categoryHint: categoryHint ?? undefined, images });

      // Cloud AI (real visual identification) wins when it's available and
      // configured. Otherwise, fall back to whatever text the on-device OCR
      // could actually read off the item — better than a dead end, but
      // explicitly tagged "offline" so the confirm screen is honest about
      // where these fields came from.
      const result =
        cloudResult.ok || !offlineText.ok || offlineText.lines.length === 0
          ? cloudResult
          : buildOfflineIdentification(categoryHint ?? undefined, offlineText.text);

      scanSession.setIdentification(result);
      navigation.replace("IdentificationResult");
    } finally {
      setAnalyzing(false);
    }
  };

  if (analyzing) {
    return (
      <SafeAreaView style={[styles.flex, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[typography.subtitle, { color: colors.textPrimary, marginTop: spacing.md }]}>Analyzing…</Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.flex}>
      <CameraView ref={cameraRef} style={styles.flex} facing="back">
        <SafeAreaView style={styles.overlay} edges={["top", "bottom"]}>
          <View style={styles.topBar}>
            <Pressable onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Close" style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#fff" />
            </Pressable>
            <Text style={styles.topBarTitle}>
              {needsMoreCaptures ? `Scan ${currentSide === "front" ? "Front" : "Back"}` : "Ready to Analyze"}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.frameWrap}>
            <View style={styles.frame} />
            <Text style={styles.frameHint}>Place item inside frame</Text>
          </View>

          <View style={styles.bottomBar}>
            {scanSession.captures.length > 0 && (
              <View style={styles.thumbRow}>
                {scanSession.captures.map((c) => (
                  <Pressable key={c.side} onPress={() => scanSession.retake(c.side)} style={styles.thumbWrap}>
                    <Text style={styles.thumbLabel}>{c.side.toUpperCase()} • Retake</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {needsMoreCaptures ? (
              <Pressable
                onPress={capture}
                accessibilityRole="button"
                accessibilityLabel={`Capture ${currentSide} photo`}
                style={[styles.shutter, { borderColor: "#fff" }]}
              >
                <View style={[styles.shutterInner, { backgroundColor: colors.accent }]} />
              </Pressable>
            ) : (
              <Button label="Identify This Item" onPress={runIdentification} loading={analyzing} fullWidth />
            )}
          </View>
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
  frame: { width: "80%", aspectRatio: 1.4, borderWidth: 2, borderColor: "#fff", borderRadius: radius.lg },
  frameHint: { color: "#fff", marginTop: spacing.md, fontSize: 13 },
  bottomBar: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, alignItems: "center" },
  thumbRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  thumbWrap: { backgroundColor: "rgba(0,0,0,0.5)", paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill },
  thumbLabel: { color: "#fff", fontSize: 11 },
  shutter: { width: 76, height: 76, borderRadius: 38, borderWidth: 4, alignItems: "center", justifyContent: "center" },
  shutterInner: { width: 58, height: 58, borderRadius: 29 },
});
