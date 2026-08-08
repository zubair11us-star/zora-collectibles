import { asc, eq } from "drizzle-orm";

import { db } from "../client";
import { locations, storageBoxes } from "../schema";
import { generateId } from "@/utils/id";
import { Location, StorageBox } from "@/types/models";

export async function listLocations(): Promise<Location[]> {
  return (await db.select().from(locations).orderBy(asc(locations.name))) as Location[];
}

export async function createLocation(name: string, parentLocationId?: string): Promise<string> {
  const id = generateId();
  const timestamp = new Date().toISOString();
  await db.insert(locations).values({
    id,
    name,
    parentLocationId: parentLocationId ?? null,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
  return id;
}

export async function deleteLocation(id: string): Promise<void> {
  await db.delete(locations).where(eq(locations.id, id));
}

export async function listStorageBoxes(locationId?: string): Promise<StorageBox[]> {
  const rows = await db.select().from(storageBoxes).orderBy(asc(storageBoxes.name));
  const all = rows as StorageBox[];
  return locationId ? all.filter((b) => b.locationId === locationId) : all;
}

export async function createStorageBox(
  name: string,
  locationId?: string,
  description?: string
): Promise<string> {
  const id = generateId();
  const timestamp = new Date().toISOString();
  await db.insert(storageBoxes).values({
    id,
    name,
    locationId: locationId ?? null,
    description: description ?? null,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
  return id;
}

export async function deleteStorageBox(id: string): Promise<void> {
  await db.delete(storageBoxes).where(eq(storageBoxes.id, id));
}
