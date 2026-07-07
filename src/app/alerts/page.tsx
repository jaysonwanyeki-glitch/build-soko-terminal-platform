import { AlertsManager } from "@/components/alerts-manager";
import { getAllStocks, getAllCryptos, getEvents } from "@/db/queries";
import { db } from "@/db";
import { priceTargets } from "@/db/schema";
import { stocks, cryptos } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function AlertsPage() {
  const [allStocks, allCryptos] = await Promise.all([getAllStocks(), getAllCryptos()]);

  // load targets + resolve current prices
  const targets = await db.select().from(priceTargets).orderBy(asc(priceTargets.createdAt));
  const stockMap = new Map(allStocks.map((s) => [s.id, s]));
  const cryptoMap = new Map(allCryptos.map((c) => [c.id, c]));

  const enriched = targets.map((t) => {
    let currentPrice = 0;
    if (t.securityType === "stock" && t.refId) currentPrice = stockMap.get(t.refId)?.price ?? 0;
    if (t.securityType === "crypto" && t.refId) currentPrice = cryptoMap.get(t.refId)?.price ?? 0;
    return { ...t, currentPrice };
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="mono text-lg font-black tracking-tight text-fg">PRICE ALERTS <span className="text-amber">·</span> NEVER MISS A MOVE</h1>
        <p className="mono text-[11px] text-dim">Set price targets on stocks & crypto. We track them and flag when they hit.</p>
      </div>
      <AlertsManager targets={enriched} stocks={allStocks} cryptos={allCryptos} />
    </div>
  );
}
