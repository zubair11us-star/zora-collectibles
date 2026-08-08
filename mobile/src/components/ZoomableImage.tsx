import React, { useState } from "react";
import { ImageStyle, StyleProp } from "react-native";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

interface ZoomableImageProps {
  filePath: string;
  cloudUrl?: string | null;
  style?: StyleProp<ImageStyle>;
}

const MAX_SCALE = 4;

/** Pinch-to-zoom (and double-tap to reset) for a single photo — deliberately pinch-only,
 * no post-zoom panning, so it never has to fight the enclosing horizontal photo pager
 * for single-finger swipe gestures. */
export function ZoomableImage({ filePath, cloudUrl, style }: ZoomableImageProps) {
  const [useCloud, setUseCloud] = useState(false);
  const uri = useCloud && cloudUrl ? cloudUrl : filePath;

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      const next = savedScale.value * e.scale;
      scale.value = Math.min(Math.max(next, 1), MAX_SCALE);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      scale.value = withTiming(1);
      savedScale.value = 1;
    });

  const composedGesture = Gesture.Simultaneous(pinchGesture, doubleTapGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.Image
        source={{ uri }}
        style={[style, animatedStyle]}
        resizeMode="contain"
        onError={() => {
          if (!useCloud && cloudUrl) setUseCloud(true);
        }}
      />
    </GestureDetector>
  );
}
