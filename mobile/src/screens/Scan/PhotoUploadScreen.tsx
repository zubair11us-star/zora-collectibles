import React, { useState } from "react";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import { useThemeMode } from "@/theme/ThemeProvider";
import { spacing, typography, radius } from "@/theme/typography";
import { Button } from "@/components/Button";
import { RootStackParamList } from "@/navigation/types";
import { useScanSessionStore } from "@/state/useScanSessionStore";
import { identifyCollectible } from "@/services/aiIdentification";
import { imageToBase64ForAI } from "@/services/imageService";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type UploadRoute = RouteProp<RootStackParamList, "PhotoUpload">;

export function PhotoUploadScreen() {
  const { colors } = useThemeMode();
  const navigation = useNavigation<Nav>();
  const route = useRoute<UploadRoute>();
  const scanSession = useScanSessionStore();
  const [pickedUri, setPickedUri] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });
    if (result.canceled || result.assets.length === 0) return;

    const uri = result.assets[0].uri;
    setPickedUri(uri);
    scanSession.addCapture({ side: "front", uri });
  };

  const runIdentification = async () => {
    if (!pickedUri) return;
    setAnalyzing(true);
    try {
      const base64Jpeg = await imageToBase64ForAI(pickedUri);
      const response = await identifyCollectible({
        categoryHint: route.params?.categoryHint,
        images: [{ side: "front", base64Jpeg }],
      });
      scanSession.setIdentification(response);
      navigation.replace("IdentificationResult");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[typography.body, { color: colors.textSecondary, marginBottom: spacing.lg }]}>
          Choose an existing photo of your collectible from your gallery. Zura will attempt to identify it just like
          a live camera scan.
        </Text>

        {pickedUri ? (
          <Image source={{ uri: pickedUri }} style={styles.preview} resizeMode="cover" />
        ) : (
          <View style={[styles.placeholder, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
            <Text style={{ color: colors.textMuted }}>No photo selected</Text>
          </View>
        )}

        <View style={{ marginTop: spacing.lg }}>
          <Button label={pickedUri ? "Choose a Different Photo" : "Choose Photo"} variant="secondary" onPress={pickImage} fullWidth />
        </View>

        {pickedUri && (
          <View style={{ marginTop: spacing.md }}>
            <Button
              label={analyzing ? "Analyzing…" : "Identify This Photo"}
              onPress={runIdentification}
              loading={analyzing}
              fullWidth
            />
          </View>
        )}

        {analyzing && <ActivityIndicator style={{ marginTop: spacing.lg }} color={colors.accent} />}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.lg },
  preview: { width: "100%", height: 280, borderRadius: radius.lg },
  placeholder: { width: "100%", height: 280, borderRadius: radius.lg, borderWidth: 1, alignItems: "center", justifyContent: "center" },
});
