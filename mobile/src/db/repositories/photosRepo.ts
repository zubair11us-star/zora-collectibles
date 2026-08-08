import { asc, eq } from "drizzle-orm";

import { db } from "../client";
import { photos } from "../schema";
import { generateId } from "@/utils/id";
import { Photo, PhotoType } from "@/types/models";

export interface AddPhotoInput {
  itemId: string;
  type: PhotoType;
  filePath: string;
  thumbnailPath?: string;
  width?: number;
  height?: number;
}

export async function addPhoto(input: AddPhotoInput): Promise<string> {
  const id = generateId();
  const timestamp = new Date().toISOString();
  await db.insert(photos).values({
    id,
    itemId: input.itemId,
    type: input.type,
    filePath: input.filePath,
    thumbnailPath: input.thumbnailPath ?? null,
    width: input.width ?? null,
    height: input.height ?? null,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
  return id;
}

export async function setPhotoCloudUrl(id: string, cloudUrl: string): Promise<void> {
  await db.update(photos).set({ cloudUrl }).where(eq(photos.id, id));
}

export async function listAllPhotos(): Promise<Photo[]> {
  return (await db.select().from(photos)) as Photo[];
}

export async function listPhotosByItem(itemId: string): Promise<Photo[]> {
  return (await db
    .select()
    .from(photos)
    .where(eq(photos.itemId, itemId))
    .orderBy(asc(photos.createdAt))) as Photo[];
}

export async function deletePhoto(id: string): Promise<void> {
  await db.delete(photos).where(eq(photos.id, id));
}
