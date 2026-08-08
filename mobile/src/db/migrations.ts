// Real, versioned schema migrations — unlike bootstrapSql.ts (which only
// handles brand-new installs via CREATE TABLE IF NOT EXISTS), these ALTER
// existing tables safely for users who already have a populated database on
// their device. Each migration runs at most once, tracked in
// schema_migrations. Add new migrations by appending to MIGRATIONS — never
// edit a migration that has already shipped.

export interface Migration {
  version: number;
  statements: string[];
}

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    statements: [
      `ALTER TABLE photos ADD COLUMN updated_at TEXT;`,
      `UPDATE photos SET updated_at = created_at WHERE updated_at IS NULL;`,

      `ALTER TABLE valuations ADD COLUMN updated_at TEXT;`,
      `UPDATE valuations SET updated_at = date WHERE updated_at IS NULL;`,

      `ALTER TABLE transactions ADD COLUMN updated_at TEXT;`,
      `UPDATE transactions SET updated_at = date WHERE updated_at IS NULL;`,

      `ALTER TABLE wishlists ADD COLUMN updated_at TEXT;`,
      `UPDATE wishlists SET updated_at = created_at WHERE updated_at IS NULL;`,

      `ALTER TABLE locations ADD COLUMN created_at TEXT;`,
      `ALTER TABLE locations ADD COLUMN updated_at TEXT;`,
      `UPDATE locations SET created_at = (SELECT datetime('now')) WHERE created_at IS NULL;`,
      `UPDATE locations SET updated_at = created_at WHERE updated_at IS NULL;`,

      `ALTER TABLE storage_boxes ADD COLUMN created_at TEXT;`,
      `ALTER TABLE storage_boxes ADD COLUMN updated_at TEXT;`,
      `UPDATE storage_boxes SET created_at = (SELECT datetime('now')) WHERE created_at IS NULL;`,
      `UPDATE storage_boxes SET updated_at = created_at WHERE updated_at IS NULL;`,
    ],
  },
  {
    version: 2,
    statements: [
      // Cloud sync: local row ids are the same ids used in Supabase (both
      // are client-generated nanoids), so no id-mapping column is needed.
      // Photos are the one exception — they need both the on-device file
      // path (works offline) and the uploaded Supabase Storage URL.
      `ALTER TABLE photos ADD COLUMN cloud_url TEXT;`,
    ],
  },
];
