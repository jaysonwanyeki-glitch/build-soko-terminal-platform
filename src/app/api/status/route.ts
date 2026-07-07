import { db } from "@/db";
import { sql } from "drizzle-orm";
import { getSystemHealth } from "@/lib/observability";
import { fetchCbkRates } from "@/lib/providers/cbk";

export const dynamic = "force-dynamic";

export async function GET() {
  const health = await getSystemHealth(async () => {
    await db.execute(sql`select 1`);
    return true;
  });

  // Check CBK FX data availability
  const { isLive: cbkLive, data: cbkRates } = await fetchCbkRates();
  const usdRate = cbkRates.find((r) => r.code === "USD")?.rate;

  return Response.json({
    status: "operational",
    services: {
      database: health.database ? "connected" : "disconnected",
      redis: health.redis ? "connected" : "not-configured",
      email: health.email ? "configured (SendGrid)" : "console-mode",
      sentry: health.sentry ? "active" : "not-configured",
    },
    dataSources: {
      crypto: "CoinGecko (live)",
      forex: cbkLive ? "CBK (live)" : "seeded (fallback)",
      fxUsdKes: usdRate ?? "unavailable",
      nseStocks: process.env.ALPHAVANTAGE_API_KEY
        ? "Alpha Vantage (configured)"
        : "playwright (auto-detect) → seeded (fallback)",
      lastSync: new Date().toISOString(),
    },
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
}
