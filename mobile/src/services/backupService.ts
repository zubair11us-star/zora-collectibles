import { Directory, File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";

import { rawDb } from "@/db/client";

const BACKUP_VERSION = 1;

// Table order matters for restore: children reference parents by id, so
// parents must be (re)inserted first. `wishlists` is deleted before `items`
// on restore because linked_item_id has no ON DELETE CASCADE (unlike
// photos/valuations/transactions/item_attributes, which cascade away
// automatically when their parent item is deleted).
const BACKUP_TABLES = [
  "locations",
  "storage_boxes",
  "items",
  "item_attributes",
  "photos",
  "valuations",
  "transactions",
  "wishlists",
] as const;

export interface BackupData {
  version: number;
  exportedAt: string;
  tables: Partial<Record<(typeof BACKUP_TABLES)[number], Record<string, unknown>[]>>;
}

/**
 * Exports the full local inventory (not including photo image files
 * themselves — those are backed up via cloud sync when signed in, since
 * bundling binary images here would make the file unwieldy) as a single
 * JSON file, then opens the share sheet to save/send it.
 */
export async function exportBackup(): Promise<string> {
  const tables: BackupData["tables"] = {};
  for (const table of BACKUP_TABLES) {
    tables[table] = await rawDb.getAllAsync<Record<string, unknown>>(`SELECT * FROM ${table};`);
  }

  const backup: BackupData = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    tables,
  };

  const fileName = `zora-backup-${new Date().toISOString().slice(0, 10)}.json`;
  const file = new File(Paths.cache, fileName);
  if (file.exists) file.delete();
  file.create();
  file.write(JSON.stringify(backup, null, 2));

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType: "application/json", dialogTitle: "Save Zura backup" });
  }

  return file.uri;
}

export interface RestoreResult {
  ok: boolean;
  restoredCounts: Partial<Record<(typeof BACKUP_TABLES)[number], number>>;
  error?: string;
}

/** Opens a file picker for a previously-exported backup JSON and restores it, replacing all current local data. */
export async function pickAndRestoreBackup(): Promise<RestoreResult> {
  const picked = await DocumentPicker.getDocumentAsync({ type: "application/json", copyToCacheDirectory: true });
  if (picked.canceled || picked.assets.length === 0) {
    return { ok: false, restoredCounts: {}, error: "No file selected." };
  }

  try {
    const file = new File(picked.assets[0].uri);
    const text = await file.text();
    const backup = JSON.parse(text) as BackupData;
    if (!backup?.tables) throw new Error("This doesn't look like a Zura backup file.");

    return await restoreBackup(backup);
  } catch (err) {
    return { ok: false, restoredCounts: {}, error: err instanceof Error ? err.message : "Couldn't read backup file" };
  }
}

async function restoreBackup(backup: BackupData): Promise<RestoreResult> {
  const restoredCounts: RestoreResult["restoredCounts"] = {};

  await rawDb.execAsync("PRAGMA foreign_keys = OFF;");
  try {
    // Wipe in child-first order (see BACKUP_TABLES comment).
    await rawDb.execAsync(`DELETE FROM wishlists;`);
    await rawDb.execAsync(`DELETE FROM item_attributes;`);
    await rawDb.execAsync(`DELETE FROM photos;`);
    await rawDb.execAsync(`DELETE FROM valuations;`);
    await rawDb.execAsync(`DELETE FROM transactions;`);
    await rawDb.execAsync(`DELETE FROM items;`);
    await rawDb.execAsync(`DELETE FROM storage_boxes;`);
    await rawDb.execAsync(`DELETE FROM locations;`);

    for (const table of BACKUP_TABLES) {
      const rows = backup.tables[table] ?? [];
      restoredCounts[table] = rows.length;
      if (rows.length === 0) continue;

      const columns = Object.keys(rows[0]);
      const placeholders = columns.map(() => "?").join(", ");
      const sql = `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders});`;
      for (const row of rows) {
        const values = columns.map((c) => (row[c] ?? null) as string | number | null);
        await rawDb.runAsync(sql, values);
      }
    }
  } finally {
    await rawDb.execAsync("PRAGMA foreign_keys = ON;");
  }

  return { ok: true, restoredCounts };
}
