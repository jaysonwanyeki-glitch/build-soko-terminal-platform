import { PortfolioManager } from "@/components/portfolio-manager";
import { PortfolioExtras } from "@/components/portfolio-extras";
import { MpesaPanel } from "@/components/mpesa-panel";
import { EquityCurve } from "@/components/equity-curve";
import { Panel } from "@/components/ui";
import {
  getPortfolios,
  ensurePortfolio,
  getPortfolioDetail,
  getTransactions,
  getAllStocks,
  getBonds,
  getAllCryptos,
  getAllFunds,
  getEquityCurve,
  recordSnapshot,
} from "@/db/queries";
import { getMpesaHistory, currentMpesaMode } from "@/app/mpesa-actions";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function PortfolioPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string }>;
}) {
  const sp = await searchParams;
  const session = await getSession();
  let portfolios = await getPortfolios(session?.id);
  if (!portfolios.length) {
    await ensurePortfolio(session?.id);
    portfolios = await getPortfolios(session?.id);
  }
  const requested = sp.p ? Number(sp.p) : NaN;
  const activeId = portfolios.some((p) => p.id === requested) ? requested : portfolios[0].id;

  const [detail, transactions, allStocks, allBonds, allCryptos, allFunds, history, mode, curve] = await Promise.all([
    getPortfolioDetail(activeId),
    getTransactions(activeId),
    getAllStocks(),
    getBonds(),
    getAllCryptos(),
    getAllFunds(),
    getMpesaHistory(activeId),
    currentMpesaMode(),
    getEquityCurve(activeId),
  ]);

  // record today's equity snapshot
  if (detail.totalValue > 0 || detail.cashBalance > 0) {
    recordSnapshot(activeId, detail.totalValue + detail.cashBalance, detail.cashBalance).catch(() => {});
  }

  const stocks = allStocks.map((s) => ({ id: s.id, symbol: s.symbol, name: s.name, price: s.price ?? 0 }));
  const bonds = allBonds.map((b) => ({ id: b.id, bondNumber: b.bondNumber, name: b.name ?? "", cleanPrice: b.cleanPrice ?? 100 }));
  const cryptos = allCryptos.map((c) => ({ id: c.id, symbol: c.symbol, name: c.name, price: c.price ?? 0 }));
  const funds = allFunds.map((f) => ({ id: f.id, symbol: f.symbol, name: f.name, price: f.price ?? 0 }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="mono text-lg font-black tracking-tight text-fg">PORTFOLIO <span className="text-gradient">·</span> INVESTOR DESK</h1>
        <p className="mono text-[11px] text-dim">Track NSE equities, treasury bonds, crypto &amp; funds · live mark-to-market P&amp;L · allocation analytics.</p>
      </div>

      {/* Equity curve */}
      <Panel
        title="Equity Curve"
        subtitle="total portfolio value over time"
        right={<span className="mono tnum text-sm font-black text-brand">KSh {detail.totalValue.toLocaleString("en-KE", { maximumFractionDigits: 0 })}</span>}
      >
        <div className="p-3">
          <EquityCurve data={curve.map((s) => ({ date: s.date, totalValue: s.totalValue, cashBalance: s.cashBalance }))} />
        </div>
      </Panel>
      <PortfolioManager
        portfolios={portfolios.map((p) => ({ id: p.id, name: p.name }))}
        activeId={activeId}
        detail={detail}
        transactions={transactions}
        stocks={stocks}
        bonds={bonds}
        cryptos={cryptos}
        funds={funds}
      />

      <PortfolioExtras detail={detail} transactions={transactions} portfolioId={activeId} />

      <MpesaPanel
        portfolioId={activeId}
        cashBalance={detail.cashBalance}
        mode={mode}
        history={history}
      />
      <Panel className="p-4">
        <p className="mono text-[11px] leading-relaxed text-dim">
          <span className="font-bold text-fg">Disclaimer:</span> Soko Terminal portfolio tracking is for personal record-keeping and informational
          purposes only. Figures are derived from simulated market data and do not constitute investment advice or executed brokerage orders.
        </p>
      </Panel>
    </div>
  );
}
