import "server-only";
import { db } from "@/db";
import { stocks, fxRates, indices } from "@/db/schema";
import { eq } from "drizzle-orm";
import { fetchCbkRates } from "@/lib/providers/cbk";
import { syncNseQuotes, getLiveKesRate } from "@/lib/providers/nse-data";

export type SyncReport = {
  fx: { synced: number; source: string; rates: { pair: string; rate: number }[] };
  stocks: { synced: number; source: string };
  kesRate: number;
  timestamp: string;
  errors: string[];
};

/**
 * Master sync: updates FX rates from CBK and stock prices from NSE sources.
 */
export async function runDataSync(): Promise<SyncReport> {
  const errors: string[] = [];
  const report: SyncReport = {
    fx: { synced: 0, source: "none", rates: [] },
    stocks: { synced: 0, source: "none" },
    kesRate: 0,
    timestamp: new Date().toISOString(),
    errors,
  };

  // ── 1. Sync FX rates from CBK ──────────────────────────────────────────
  try {
    const { data: cbkRates, isLive } = await fetchCbkRates();
    if (isLive && cbkRates.length > 0) {
      for (const rate of cbkRates) {
        const pair = `${rate.code}/KES`;
        const existing = await db.select().from(fxRates).where(eq(fxRates.pair, pair)).limit(1);
        const change = existing[0] ? rate.rate - existing[0].rate : 0;
        const changePct = existing[0]?.rate ? (change / existing[0].rate) * 100 : 0;

        if (existing.length) {
          await db.update(fxRates).set({ rate: rate.rate, change, changePct }).where(eq(fxRates.id, existing[0].id));
        } else {
          await db.insert(fxRates).values({ pair, rate: rate.rate, change, changePct });
        }
        report.fx.rates.push({ pair, rate: rate.rate });
        report.fx.synced++;
      }
      report.fx.source = "CBK (live)";
      console.log(`[sync] FX: synced ${cbkRates.length} rates from CBK`);
    } else {
      report.fx.source = "seeded (fallback)";
      errors.push("CBK rates unavailable — using seeded values");
    }
  } catch (e) {
    report.fx.source = "seeded (error)";
    errors.push(`FX sync failed: ${(e as Error).message}`);
  }

  // ── 2. Get live KES rate ───────────────────────────────────────────────
  try {
    report.kesRate = await getLiveKesRate();
  } catch {
    report.kesRate = 134.0;
  }

  // ── 3. Sync NSE stock prices ──────────────────────────────────────────
  try {
    const allStocks = await db.select().from(stocks).orderBy(stocks.symbol);
    const symbols = allStocks.map((s) => s.symbol);
    const result = await syncNseQuotes(symbols);

    report.stocks.source = result.source;

    if (result.quotes.size > 0 && result.source !== "simulation") {
      for (const stock of allStocks) {
        const quote = result.quotes.get(stock.symbol);
        if (quote) {
          const change = quote.change || (quote.price - (stock.prevClose ?? stock.price ?? 0));
          const changePct = quote.changePct || (stock.price ? (change / stock.price) * 100 : 0);
          await db
            .update(stocks)
            .set({
              price: quote.price,
              change,
              changePct,
              volume: quote.volume || stock.volume,
            })
            .where(eq(stocks.id, stock.id));
          report.stocks.synced++;
        }
      }
      console.log(`[sync] Stocks: synced ${report.stocks.synced} prices from ${result.source}`);
    } else {
      report.stocks.source = "seeded (fallback)";
      errors.push("NSE live data unavailable — configure Alpha Vantage or Playwright for live prices");
    }
  } catch (e) {
    report.stocks.source = "seeded (error)";
    errors.push(`Stock sync failed: ${(e as Error).message}`);
  }

  console.log(`[sync] complete: ${report.fx.synced} FX, ${report.stocks.synced} stocks`);
  return report;
}
