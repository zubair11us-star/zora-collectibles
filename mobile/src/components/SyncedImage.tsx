import React, { useState } from "react";
import { Image, ImageProps, ImageStyle, StyleProp } from "react-native";

interface SyncedImageProps extends Omit<ImageProps, "source" | "style"> {
  filePath: string;
  cloudUrl?: string | null;
  style?: StyleProp<ImageStyle>;
}

/**
 * Tries the on-device file first (instant, works offline — correct for the
 * device that actually captured the photo). If that fails to load — most
 * commonly because this photo record was pulled from another device via
 * sync and the file was never on this device — falls back to cloud_url.
 */
export function SyncedImage({ filePath, cloudUrl, style, ...rest }: SyncedImageProps) {
  const [useCloud, setUseCloud] = useState(false);
  const uri = useCloud && cloudUrl ? cloudUrl : filePath;

  return (
    <Image
      source={{ uri }}
      style={style}
      onError={() => {
        if (!useCloud && cloudUrl) setUseCloud(true);
      }}
      {...rest}
    />
  );
}
