import React, { useEffect } from "react";
import { StyleSheet, View, ViewStyle, StyleProp } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, Easing } from "react-native-reanimated";

import { useThemeMode } from "@/theme/ThemeProvider";
import { radius } from "@/theme/typography";

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export function Skeleton({ width = "100%", height = 16, borderRadius: r = radius.sm, style }: SkeletonProps) {
  const { colors } = useThemeMode();
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[{ width, height, borderRadius: r, backgroundColor: colors.surfaceAlt }, animatedStyle, style]}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <View style={styles.wrap}>
      <Skeleton width="70%" height={26} style={{ marginBottom: 8 }} />
      <Skeleton width="40%" height={14} style={{ marginBottom: 24 }} />
      <View style={styles.grid}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} width="47%" height={84} borderRadius={radius.lg} style={{ marginBottom: 12 }} />
        ))}
      </View>
      <Skeleton width="35%" height={20} style={{ marginTop: 12, marginBottom: 12 }} />
      <View style={styles.row}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} width={140} height={110} borderRadius={radius.lg} style={{ marginRight: 12 }} />
        ))}
      </View>
    </View>
  );
}

export function ItemDetailsSkeleton() {
  return (
    <View>
      <Skeleton width="100%" height={260} borderRadius={0} />
      <View style={styles.wrap}>
        <Skeleton width="60%" height={22} style={{ marginBottom: 8 }} />
        <Skeleton width="35%" height={14} style={{ marginBottom: 20 }} />
        <Skeleton width="100%" height={120} borderRadius={radius.lg} style={{ marginBottom: 12 }} />
        <Skeleton width="100%" height={90} borderRadius={radius.lg} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 20 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  row: { flexDirection: "row" },
});
