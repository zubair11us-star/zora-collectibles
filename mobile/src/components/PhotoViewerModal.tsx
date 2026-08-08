import React, { useState } from "react";
import { Dimensions, FlatList, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { ZoomableImage } from "./ZoomableImage";

interface PhotoRef {
  filePath: string;
  cloudUrl?: string | null;
}

interface PhotoViewerModalProps {
  visible: boolean;
  photos: PhotoRef[];
  initialIndex: number;
  onClose: () => void;
}

export function PhotoViewerModal({ visible, photos, initialIndex, onClose }: PhotoViewerModalProps) {
  const [index, setIndex] = useState(initialIndex);
  const screenWidth = Dimensions.get("window").width;

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.flex}>
        <FlatList
          data={photos}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, i) => ({ length: screenWidth, offset: screenWidth * i, index: i })}
          keyExtractor={(_, i) => String(i)}
          onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / screenWidth))}
          renderItem={({ item }) => (
            <View style={{ width: screenWidth }}>
              <ZoomableImage filePath={item.filePath} cloudUrl={item.cloudUrl} style={styles.image} />
            </View>
          )}
        />

        <SafeAreaView style={styles.overlay} pointerEvents="box-none">
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="#fff" />
          </Pressable>
          {photos.length > 1 && (
            <View style={styles.dotsRow}>
              {photos.map((_, i) => (
                <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
              ))}
            </View>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#000" },
  image: { width: "100%", height: "100%" },
  overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  closeBtn: {
    position: "absolute",
    top: 12,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  dotsRow: {
    position: "absolute",
    bottom: 24,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.4)" },
  dotActive: { backgroundColor: "#fff", width: 8, height: 8, borderRadius: 4 },
});
