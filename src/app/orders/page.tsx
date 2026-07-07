import { OrdersManager } from "@/components/orders-manager";
import { getPendingOrders, getPortfolioDetail, ensurePortfolio, getAllStocks, getAllCryptos, getAllFunds } from "@/db/queries";
import { checkAndFillOrders } from "@/app/order-actions";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const session = await getSession();
  if (!session) {
    return <div className="grid place-items-center py-20 text-sm text-dim">Please sign in to view orders.</div>;
  }
  const portfolioId = await ensurePortfolio(session.id);
  // check & fill any triggered orders on page load
  await checkAndFillOrders();

  const [orders, allStocks, allCryptos, allFunds] = await Promise.all([
    getPendingOrders(portfolioId),
    getAllStocks(),
    getAllCryptos(),
    getAllFunds(),
  ]);

  const stocks = allStocks.map((s) => ({ id: s.id, symbol: s.symbol, name: s.name, price: s.price ?? 0 }));
  const cryptos = allCryptos.map((c) => ({ id: c.id, symbol: c.symbol, name: c.name, price: c.price ?? 0 }));
  const funds = allFunds.map((f) => ({ id: f.id, symbol: f.symbol, name: f.name, price: f.price ?? 0 }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="mono text-lg font-black tracking-tight text-fg">ORDERS <span className="text-gradient">·</span> LIMIT &amp; STOP-LOSS</h1>
        <p className="mono text-[11px] text-dim">Advanced order types — we auto-fill when the market hits your trigger price.</p>
      </div>
      <OrdersManager orders={orders} stocks={stocks} cryptos={cryptos} funds={funds} portfolioId={portfolioId} />
    </div>
  );
}
