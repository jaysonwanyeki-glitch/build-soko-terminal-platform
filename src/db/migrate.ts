/**
 * Production migration runner.
 * Usage: npx tsx src/db/migrate.ts
 * Reads the DATABASE_URL from env and applies all pending migrations
 * from the /drizzle folder using drizzle-orm/migrator.
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import * as fs from "fs";
import * as path from "path";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("❌ DATABASE_URL is required");
  process.exit(1);
}

const migrationsFolder = path.join(process.cwd(), "drizzle");
if (!fs.existsSync(migrationsFolder)) {
  console.error(`❌ Migrations folder not found: ${migrationsFolder}`);
  console.error("   Run 'npx drizzle-kit generate' first.");
  process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl, max: 1 });
const db = drizzle(pool);

async function main() {
  console.log("📦 Running migrations…");
  await migrate(db, { migrationsFolder });
  console.log("✅ Migrations applied successfully");
  await pool.end();
}

main().catch((e) => {
  console.error("❌ Migration failed:", e);
  process.exit(1);
});
