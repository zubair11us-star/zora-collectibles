import { Directory, File, Paths } from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";

// expo-file-system v19+ API: Paths/File/Directory replace the old
// documentDirectory string + *Async free functions.
const photosDir = new Directory(Paths.document, "zora-photos");

function ensurePhotosDir(): void {
  if (!photosDir.exists) {
    photosDir.create({ intermediates: true });
  }
}

export interface StoredImage {
  filePath: string;
  thumbnailPath: string;
  width: number;
  height: number;
}

/**
 * Compresses a captured/picked photo, saves a full-size and a thumbnail copy
 * under the app's document directory, and returns both paths.
 */
export async function persistCollectibleImage(sourceUri: string, itemId: string): Promise<StoredImage> {
  ensurePhotosDir();

  const full = await ImageManipulator.manipulateAsync(
    sourceUri,
    [{ resize: { width: 1600 } }],
    { compress: 0.82, format: ImageManipulator.SaveFormat.JPEG }
  );
  const thumb = await ImageManipulator.manipulateAsync(
    sourceUri,
    [{ resize: { width: 320 } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
  );

  const stamp = Date.now();
  const fullFile = new File(photosDir, `${itemId}-${stamp}.jpg`);
  const thumbFile = new File(photosDir, `${itemId}-${stamp}-thumb.jpg`);

  new File(full.uri).copy(fullFile);
  new File(thumb.uri).copy(thumbFile);

  return {
    filePath: fullFile.uri,
    thumbnailPath: thumbFile.uri,
    width: full.width,
    height: full.height,
  };
}

/** Downscales + base64-encodes an image for sending to the AI identification endpoint. */
export async function imageToBase64ForAI(sourceUri: string): Promise<string> {
  const resized = await ImageManipulator.manipulateAsync(
    sourceUri,
    [{ resize: { width: 1024 } }],
    { compress: 0.75, format: ImageManipulator.SaveFormat.JPEG, base64: true }
  );
  if (!resized.base64) throw new Error("Failed to encode image for AI identification");
  return resized.base64;
}

export function deleteImageFile(filePath: string): void {
  try {
    new File(filePath).delete();
  } catch {
    // best-effort cleanup
  }
}
