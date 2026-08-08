import * as SQLite from "expo-sqlite";
import { drizzle } from "drizzle-orm/expo-sqlite";

import * as schema from "./schema";
import { BOOTSTRAP_STATEMENTS } from "./bootstrapSql";
import { MIGRATIONS } from "./migrations";
import { CATEGORY_META, CATEGORY_ORDER } from "@/types/categoryFields";

const sqliteDb = SQLite.openDatabaseSync("zora.db");

export const db = drizzle(sqliteDb, { schema });
/** Raw handle for subsystems (sync engine, backup export) that need generic SQL rather than typed Drizzle queries. */
export const rawDb = sqliteDb;

let initialized = false;

export async function initDatabase(): Promise<void> {
  if (initialized) return;

  await sqliteDb.execAsync("PRAGMA foreign_keys = ON;");
  for (const statement of BOOTSTRAP_STATEMENTS) {
    await sqliteDb.execAsync(statement);
  }

  await runMigrations();
  await seedCategoriesIfNeeded();
  await seedDefaultSettingsIfNeeded();

  initialized = true;
}

async function runMigrations(): Promise<void> {
  await sqliteDb.execAsync(`CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY);`);

  const applied = await sqliteDb.getAllAsync<{ version: number }>(`SELECT version FROM schema_migrations;`);
  const appliedVersions = new Set(applied.map((r) => r.version));

  for (const migration of MIGRATIONS) {
    if (appliedVersions.has(migration.version)) continue;
    for (const statement of migration.statements) {
      try {
        await sqliteDb.execAsync(statement);
      } catch (err) {
        // ADD COLUMN fails with "duplicate column name" if a previous run
        // partially applied this migration (e.g. app was killed mid-run) —
        // safe to ignore and continue so the migration can complete.
        if (!(err instanceof Error) || !/duplicate column name/i.test(err.message)) {
          throw err;
        }
      }
    }
    await sqliteDb.execAsync(`INSERT INTO schema_migrations (version) VALUES (${migration.version});`);
  }
}

async function seedCategoriesIfNeeded(): Promise<void> {
  const existing = await db.select().from(schema.categories).limit(1);
  if (existing.length > 0) return;

  for (const key of CATEGORY_ORDER) {
    const meta = CATEGORY_META[key];
    await db.insert(schema.categories).values({
      id: key,
      key,
      name: meta.name,
      icon: meta.icon,
      sortOrder: CATEGORY_ORDER.indexOf(key),
    });
  }
}

async function seedDefaultSettingsIfNeeded(): Promise<void> {
  const defaults: Record<string, string> = {
    name: "Collector",
    baseCurrency: "AED",
    theme: "system",
    aiServerUrl: process.env.EXPO_PUBLIC_AI_SERVER_URL ?? "http://localhost:4000",
  };

  for (const [key, value] of Object.entries(defaults)) {
    const row = await db.query.settings.findFirst({
      where: (s, { eq }) => eq(s.key, key),
    });
    if (!row) {
      await db.insert(schema.settings).values({ key, value });
    }
  }
}
