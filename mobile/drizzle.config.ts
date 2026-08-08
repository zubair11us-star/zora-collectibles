import type { Config } from "drizzle-kit";

// Used only when the schema evolves and real migrations are introduced
// (Phase 2+). Phase 1 boots the schema via src/db/bootstrapSql.ts instead.
export default {
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "sqlite",
  driver: "expo",
} satisfies Config;
