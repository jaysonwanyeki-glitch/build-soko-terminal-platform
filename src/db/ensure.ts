import { pool } from "./index";
import { runSeed } from "./seed";

let checked = false;

/**
 * Ensures the database has seed data. Runs once per process and only if the
 * stocks table is empty, so user-created portfolios/watchlists are never wiped.
 * Skipped entirely during Vercel build phase when no DB is available.
 */
export async function ensureSeeded() {
  // Skip during build (no DATABASE_URL) or if already checked
  if (checked || !process.env.DATABASE_URL) return;
  checked = true;
  try {
    const r = await pool.query("SELECT count(*)::int AS c FROM stocks");
    if ((r.rows[0]?.c ?? 0) === 0) {
      console.log("🌱 database empty — auto-seeding Soko market data…");
      await runSeed();
    }
  } catch (e) {
    console.error("ensureSeeded failed:", e);
  }
}
