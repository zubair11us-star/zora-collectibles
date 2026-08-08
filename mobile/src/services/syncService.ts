import { File } from "expo-file-system";

import { rawDb } from "@/db/client";
import { getSupabase, isCloudConfigured } from "./supabaseClient";
import { useAuthStore } from "@/state/useAuthStore";

export interface SyncResult {
  ok: boolean;
  pushed: number;
  pulled: number;
  error?: string;
}

// Local column whitelist per table (mirrors db/schema.ts, excluding the
// remote-only `user_id`). Used both to select exactly what to push and to
// build the local upsert statement when pulling.
const LOCAL_COLUMNS: Record<string, string[]> = {
  locations: ["id", "name", "parent_location_id", "created_at", "updated_at"],
  storage_boxes: ["id", "name", "location_id", "description", "created_at", "updated_at"],
  items: [
    "id", "category_id", "subcategory", "name", "description", "brand", "country", "manufacturer",
    "year", "series", "set_name", "model", "catalog_number", "card_number", "denomination", "currency",
    "serial_number", "condition", "grade", "quantity", "purchase_date", "purchase_price", "purchase_currency",
    "current_value", "current_value_currency", "selling_price", "location_id", "storage_box_id",
    "storage_position", "barcode", "qr_code", "identification_source", "ai_confidence", "sale_status",
    "notes", "is_demo", "is_deleted", "created_at", "updated_at",
  ],
  photos: ["id", "item_id", "type", "file_path", "thumbnail_path", "cloud_url", "width", "height", "created_at", "updated_at"],
  valuations: ["id", "item_id", "date", "value", "currency", "source", "notes", "updated_at"],
  transactions: [
    "id", "item_id", "type", "date", "counterparty", "price", "currency", "quantity", "fees", "shipping",
    "total_cost", "net_amount", "notes", "updated_at",
  ],
  wishlists: [
    "id", "name", "category_id", "desired_condition", "target_price", "target_currency", "priority",
    "notes", "linked_item_id", "created_at", "updated_at",
  ],
};

// Boolean columns need explicit conversion: local SQLite stores them as
// INTEGER 0/1 (raw SQL bypasses Drizzle's automatic boolean mapping),
// Postgres expects/returns real JSON booleans.
const BOOLEAN_COLUMNS: Record<string, string[]> = {
  items: ["is_demo", "is_deleted"],
};

function requireUserId(): string {
  const session = useAuthStore.getState().session;
  if (!session) throw new Error("Not signed in.");
  return session.user.id;
}

function isNewer(a: unknown, b: unknown): boolean {
  if (!a) return false;
  if (!b) return true;
  return new Date(String(a)).getTime() > new Date(String(b)).getTime();
}

function toRemoteRow(table: string, row: Record<string, any>, userId: string): Record<string, any> {
  const out: Record<string, any> = { ...row, user_id: userId };
  for (const col of BOOLEAN_COLUMNS[table] ?? []) out[col] = !!out[col];
  return out;
}

function toLocalValues(table: string, row: Record<string, any>, columns: string[]): any[] {
  const boolCols = new Set(BOOLEAN_COLUMNS[table] ?? []);
  return columns.map((col) => {
    const v = row[col];
    if (boolCols.has(col)) return v ? 1 : 0;
    return v ?? null;
  });
}

async function upsertLocalRows(table: string, rows: Record<string, any>[]): Promise<void> {
  if (rows.length === 0) return;
  const columns = LOCAL_COLUMNS[table];
  const placeholders = columns.map(() => "?").join(", ");
  const updateSet = columns
    .filter((c) => c !== "id")
    .map((c) => `${c} = excluded.${c}`)
    .join(", ");
  // ON CONFLICT DO UPDATE (not INSERT OR REPLACE) — REPLACE deletes the
  // existing row first, which would fire ON DELETE CASCADE on photos/
  // valuations/transactions/item_attributes referencing items.id and wipe
  // out that item's children before reinserting it.
  const sql = `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})
               ON CONFLICT(id) DO UPDATE SET ${updateSet};`;

  for (const row of rows) {
    await rawDb.runAsync(sql, toLocalValues(table, row, columns));
  }
}

async function syncSimpleTable(table: string, timestampCol: string): Promise<{ pushed: number; pulled: number }> {
  const userId = requireUserId();
  const supabase = getSupabase();
  const columns = LOCAL_COLUMNS[table];

  const localRows = await rawDb.getAllAsync<Record<string, any>>(
    `SELECT ${columns.join(", ")} FROM ${table};`
  );
  const { data: remoteRows, error } = await supabase.from(table).select("*").eq("user_id", userId);
  if (error) throw new Error(`[${table}] ${error.message}`);

  const remoteById = new Map((remoteRows ?? []).map((r) => [r.id, r]));
  const localById = new Map(localRows.map((r) => [r.id, r]));

  const toPush = localRows.filter((local) => {
    const remote = remoteById.get(local.id);
    return !remote || isNewer(local[timestampCol], remote[timestampCol]);
  });
  if (toPush.length > 0) {
    const { error: pushErr } = await supabase
      .from(table)
      .upsert(toPush.map((r) => toRemoteRow(table, r, userId)));
    if (pushErr) throw new Error(`[${table}] ${pushErr.message}`);
  }

  const toPull = (remoteRows ?? []).filter((remote) => {
    const local = localById.get(remote.id);
    return !local || isNewer(remote[timestampCol], local[timestampCol]);
  });
  await upsertLocalRows(table, toPull);

  return { pushed: toPush.length, pulled: toPull.length };
}

/**
 * Items and their category-specific attributes sync as one unit: whichever
 * side "wins" an item (via updated_at) also has its full attribute set
 * pushed/pulled and replaced wholesale. This sidesteps the fact that
 * item_attributes rows get fresh ids every time an item is saved (delete +
 * recreate), which would otherwise leave stale orphaned attribute rows
 * behind under plain per-row id-based sync.
 */
async function syncItemsAndAttributes(): Promise<{ pushed: number; pulled: number }> {
  const userId = requireUserId();
  const supabase = getSupabase();
  const itemColumns = LOCAL_COLUMNS.items;

  const localItems = await rawDb.getAllAsync<Record<string, any>>(`SELECT ${itemColumns.join(", ")} FROM items;`);
  const { data: remoteItems, error } = await supabase.from("items").select("*").eq("user_id", userId);
  if (error) throw new Error(`[items] ${error.message}`);

  const remoteById = new Map((remoteItems ?? []).map((r) => [r.id, r]));
  const localById = new Map(localItems.map((r) => [r.id, r]));

  const itemsToPush = localItems.filter((local) => {
    const remote = remoteById.get(local.id);
    return !remote || isNewer(local.updated_at, remote.updated_at);
  });
  const itemsToPull = (remoteItems ?? []).filter((remote) => {
    const local = localById.get(remote.id);
    return !local || isNewer(remote.updated_at, local.updated_at);
  });

  if (itemsToPush.length > 0) {
    const { error: pushErr } = await supabase
      .from("items")
      .upsert(itemsToPush.map((r) => toRemoteRow("items", r, userId)));
    if (pushErr) throw new Error(`[items] ${pushErr.message}`);

    for (const item of itemsToPush) {
      const attrs = await rawDb.getAllAsync<Record<string, any>>(
        `SELECT id, item_id, key, value FROM item_attributes WHERE item_id = ?;`,
        [item.id]
      );
      await supabase.from("item_attributes").delete().eq("item_id", item.id).eq("user_id", userId);
      if (attrs.length > 0) {
        const { error: attrErr } = await supabase
          .from("item_attributes")
          .upsert(attrs.map((a) => ({ ...a, user_id: userId })));
        if (attrErr) throw new Error(`[item_attributes] ${attrErr.message}`);
      }
    }
  }

  await upsertLocalRows("items", itemsToPull);

  for (const item of itemsToPull) {
    const { data: remoteAttrs, error: attrErr } = await supabase
      .from("item_attributes")
      .select("id, item_id, key, value")
      .eq("item_id", item.id)
      .eq("user_id", userId);
    if (attrErr) throw new Error(`[item_attributes] ${attrErr.message}`);

    await rawDb.runAsync(`DELETE FROM item_attributes WHERE item_id = ?;`, [item.id]);
    for (const attr of remoteAttrs ?? []) {
      await rawDb.runAsync(
        `INSERT INTO item_attributes (id, item_id, key, value) VALUES (?, ?, ?, ?);`,
        [attr.id, attr.item_id, attr.key, attr.value]
      );
    }
  }

  return { pushed: itemsToPush.length, pulled: itemsToPull.length };
}

/**
 * Uploads any local photo whose file has never been pushed to Supabase
 * Storage (cloud_url IS NULL), then records the resulting public URL
 * locally so the normal photos-table sync (which runs right after this)
 * pushes that URL up too. Runs best-effort per photo — one failed upload
 * doesn't block the rest of sync.
 */
async function uploadPendingPhotos(): Promise<number> {
  const userId = requireUserId();
  const supabase = getSupabase();

  const pending = await rawDb.getAllAsync<{ id: string; file_path: string }>(
    `SELECT id, file_path FROM photos WHERE cloud_url IS NULL;`
  );

  let uploaded = 0;
  for (const photo of pending) {
    try {
      const file = new File(photo.file_path);
      if (!file.exists) continue;
      const bytes = await file.bytes();
      const path = `${userId}/${photo.id}.jpg`;

      const { error: uploadErr } = await supabase.storage
        .from("photos")
        .upload(path, bytes, { contentType: "image/jpeg", upsert: true });
      if (uploadErr) continue;

      const { data } = supabase.storage.from("photos").getPublicUrl(path);
      await rawDb.runAsync(`UPDATE photos SET cloud_url = ? WHERE id = ?;`, [data.publicUrl, photo.id]);
      uploaded++;
    } catch {
      // best-effort — this specific photo stays cloud_url IS NULL and retries next sync
    }
  }
  return uploaded;
}

const SIMPLE_TABLES: { table: string; timestampCol: string }[] = [
  { table: "locations", timestampCol: "updated_at" },
  { table: "storage_boxes", timestampCol: "updated_at" },
  { table: "photos", timestampCol: "updated_at" },
  { table: "valuations", timestampCol: "updated_at" },
  { table: "transactions", timestampCol: "updated_at" },
  { table: "wishlists", timestampCol: "updated_at" },
];

/**
 * Pushes all local changes and pulls all remote changes, reconciled per row
 * by whichever side has the newer `updated_at` (last-write-wins). Designed
 * for one person's own devices, not true concurrent multi-writer editing.
 *
 * Known limitation: hard deletes (locations, storage boxes, wishlist
 * entries, photos) aren't tracked with tombstones, so a row deleted on one
 * device can reappear after syncing with another device that still has it.
 * Items use soft-delete (is_deleted) so they're unaffected by this.
 */
export async function syncNow(): Promise<SyncResult> {
  if (!isCloudConfigured) {
    return { ok: false, pushed: 0, pulled: 0, error: "Cloud sync isn't configured." };
  }
  try {
    requireUserId();

    // Locations and storage boxes first (items reference them by id).
    let pushed = 0;
    let pulled = 0;

    for (const { table, timestampCol } of [SIMPLE_TABLES[0], SIMPLE_TABLES[1]]) {
      const r = await syncSimpleTable(table, timestampCol);
      pushed += r.pushed;
      pulled += r.pulled;
    }

    const itemsResult = await syncItemsAndAttributes();
    pushed += itemsResult.pushed;
    pulled += itemsResult.pulled;

    await uploadPendingPhotos();

    for (const { table, timestampCol } of SIMPLE_TABLES.slice(2)) {
      const r = await syncSimpleTable(table, timestampCol);
      pushed += r.pushed;
      pulled += r.pulled;
    }

    return { ok: true, pushed, pulled };
  } catch (err) {
    return { ok: false, pushed: 0, pulled: 0, error: err instanceof Error ? err.message : "Unknown sync error" };
  }
}
