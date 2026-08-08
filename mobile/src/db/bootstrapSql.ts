// Hand-written bootstrap DDL — the original Phase 1 table shapes, run once
// as idempotent CREATE-TABLE-IF-NOT-EXISTS statements so the app has zero
// build-time dependency on running `drizzle-kit generate` before first
// launch. Columns added after Phase 1 (e.g. sync bookkeeping, updated_at on
// tables that originally lacked it) live in db/migrations.ts instead, since
// ALTER TABLE is required to reach devices that already have a populated
// database — editing the CREATE TABLE bodies here would only affect brand
// new installs. schema.ts (the Drizzle definitions) always reflects the
// final shape after bootstrap + all migrations have run.
export const BOOTSTRAP_STATEMENTS: string[] = [
  `CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY NOT NULL,
    key TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
  );`,
  `CREATE TABLE IF NOT EXISTS locations (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    parent_location_id TEXT
  );`,
  `CREATE TABLE IF NOT EXISTS storage_boxes (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    location_id TEXT REFERENCES locations(id),
    description TEXT
  );`,
  `CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY NOT NULL,
    category_id TEXT NOT NULL REFERENCES categories(id),
    subcategory TEXT,
    name TEXT NOT NULL,
    description TEXT,
    brand TEXT,
    country TEXT,
    manufacturer TEXT,
    year INTEGER,
    series TEXT,
    set_name TEXT,
    model TEXT,
    catalog_number TEXT,
    card_number TEXT,
    denomination TEXT,
    currency TEXT,
    serial_number TEXT,
    condition TEXT NOT NULL DEFAULT 'unspecified',
    grade TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    purchase_date TEXT,
    purchase_price REAL,
    purchase_currency TEXT,
    current_value REAL,
    current_value_currency TEXT,
    selling_price REAL,
    location_id TEXT REFERENCES locations(id),
    storage_box_id TEXT REFERENCES storage_boxes(id),
    storage_position TEXT,
    barcode TEXT,
    qr_code TEXT,
    identification_source TEXT NOT NULL DEFAULT 'manual',
    ai_confidence REAL,
    sale_status TEXT NOT NULL DEFAULT 'not_for_sale',
    notes TEXT,
    is_demo INTEGER NOT NULL DEFAULT 0,
    is_deleted INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
  );`,
  `CREATE TABLE IF NOT EXISTS item_attributes (
    id TEXT PRIMARY KEY NOT NULL,
    item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS photos (
    id TEXT PRIMARY KEY NOT NULL,
    item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    type TEXT NOT NULL DEFAULT 'other',
    file_path TEXT NOT NULL,
    thumbnail_path TEXT,
    width INTEGER,
    height INTEGER,
    created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
  );`,
  `CREATE TABLE IF NOT EXISTS valuations (
    id TEXT PRIMARY KEY NOT NULL,
    item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    value REAL NOT NULL,
    currency TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'manual',
    notes TEXT
  );`,
  `CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY NOT NULL,
    item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    date TEXT NOT NULL,
    counterparty TEXT,
    price REAL,
    currency TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    fees REAL,
    shipping REAL,
    total_cost REAL,
    net_amount REAL,
    notes TEXT
  );`,
  `CREATE TABLE IF NOT EXISTS wishlists (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    category_id TEXT REFERENCES categories(id),
    desired_condition TEXT NOT NULL DEFAULT 'unspecified',
    target_price REAL,
    target_currency TEXT,
    priority TEXT NOT NULL DEFAULT 'medium',
    notes TEXT,
    linked_item_id TEXT REFERENCES items(id),
    created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
  );`,
  `CREATE TABLE IF NOT EXISTS ai_identifications (
    id TEXT PRIMARY KEY NOT NULL,
    item_id TEXT REFERENCES items(id) ON DELETE CASCADE,
    category_guess TEXT,
    raw_response_json TEXT NOT NULL,
    confidence REAL NOT NULL,
    possible_matches_json TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
  );`,
  `CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS exchange_rates (
    currency_code TEXT PRIMARY KEY NOT NULL,
    rate_to_base REAL NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
  );`,
  `CREATE INDEX IF NOT EXISTS idx_items_category ON items(category_id);`,
  `CREATE INDEX IF NOT EXISTS idx_items_name ON items(name);`,
  `CREATE INDEX IF NOT EXISTS idx_items_barcode ON items(barcode);`,
  `CREATE INDEX IF NOT EXISTS idx_item_attributes_item ON item_attributes(item_id);`,
  `CREATE INDEX IF NOT EXISTS idx_photos_item ON photos(item_id);`,
  `CREATE INDEX IF NOT EXISTS idx_valuations_item ON valuations(item_id);`,
  `CREATE INDEX IF NOT EXISTS idx_transactions_item ON transactions(item_id);`,
];
