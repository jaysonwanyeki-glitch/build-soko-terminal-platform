import Link from "next/link";
import { notFound } from "next/navigation";
import { Panel, ChangePill, Delta, Tag, KeyVal, Stat } from "@/components/ui";
import { AreaChart } from "@/components/charts";
import { FundAvatar } from "@/components/fund-avatar";
import { TradingChart } from "@/components/trading-chart";
import { TradeTicket } from "@/components/trade-ticket";
import { WatchButton } from "@/components/watch-button";
import { SignInToTrade } from "@/components/sign-in-to-trade";
import { num, kes, compact, money, formatDate } from "@/lib/format";
import { getFundBySymbol, getFundQuotes, getWatchlist, ensurePortfolio, getPortfolioCash } from "@/db/queries";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function FundDetail({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const fund = await getFundBySymbol(symbol);
  if (!fund) notFound();

  const session = await getSession();
  const [quotes, watchlist, portfolioId] = await Promise.all([
    getFundQuotes(fund.id, 120).catch(() => []),
    getWatchlist().catch(() => []),
    ensurePortfolio(session?.id),
  ]);
  const cashBalance = await getPortfolioCash(portfolioId);
  const watching = watchlist.some((w) => w.securityType === "fund" && w.refId === fund.id);
  const daily = quotes.map((q) => ({ date: q.date, open: q.close, high: q.close, low: q.close, close: q.close, volume: 1000 }));
  const up = (fund.change ?? 0) >= 0;

  return (
    <div className="space-y-4">
      <div className="mono flex items-center gap-2 text-[11px] text-dim">
        <Link href="/funds" className="hover:text-amber">Funds</Link>
        <span>/</span>
        <span className="text-fg">{fund.symbol}</span>
      </div>

      <Panel className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <FundAvatar type={fund.type} size={44} />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="mono text-2xl font-black tracking-tight text-fg">{fund.symbol}</h1>
                <Tag tone="green">{fund.type}</Tag>
                <span className="mono rounded border border-line px-1.5 py-0.5 text-[9px] text-dim">{fund.category}</span>
              </div>
              <p className="mt-1 text-sm text-muted">{fund.name}</p>
              <p className="mono text-[11px] text-dim">Managed by {fund.manager}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="mono tnum text-3xl font-black text-fg">KSh {num(fund.price)}</div>
            <div className="mt-1 text-[11px] text-dim">NAV per unit</div>
            <div className="mt-1 flex items-center justify-end gap-2">
              <Delta value={fund.change} />
              <ChangePill value={fund.changePct} />
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <WatchButton securityType="fund" refId={fund.id} symbol={fund.symbol} name={fund.name} watching={watching} />
          <a href="#trade" className="mono inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted transition hover:border-up/40 hover:text-up">
            Invest via M-Pesa ↓
          </a>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Panel title="NAV Chart" subtitle={`${fund.symbol} · 1m → 1M`}>
            <div className="p-3">
              <TradingChart daily={daily} symbol={fund.symbol} height={380} />
            </div>
          </Panel>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Fund Type" value={fund.type} />
            <Stat label="Category" value={fund.category} />
            <Stat label="AUM" value={money(fund.aum)} />
            <Stat label="YTD Return" value={num(fund.ytdReturn) + "%"} />
            <Stat label="Expense Ratio" value={(fund.expenseRatio ?? 0) > 0 ? num(fund.expenseRatio) + "%" : "None"} />
            <Stat label="52W High" value={num(fund.high52)} />
            <Stat label="52W Low" value={num(fund.low52)} />
            <Stat label="Units Out" value={compact(fund.unitsOutstanding)} />
          </div>

          <Panel title="About this Fund">
            <p className="px-4 py-3 text-sm leading-relaxed text-muted">{fund.description}</p>
          </Panel>

          <Panel title="NAV History" subtitle="recent unit prices">
            <div className="max-h-[240px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-term-850">
                  <tr className="mono border-b border-line text-[10px] uppercase tracking-wider text-dim">
                    <th className="px-4 py-2 font-semibold">Date</th>
                    <th className="px-4 py-2 text-right font-semibold">NAV (KSh)</th>
                    <th className="px-4 py-2 text-right font-semibold">Chg</th>
                  </tr>
                </thead>
                <tbody>
                  {[...quotes].reverse().slice(0, 15).map((q, i, arr) => {
                    const prev = arr[i + 1];
                    const ch = prev ? q.close - prev.close : 0;
                    return (
                      <tr key={q.id} className="border-b border-line-soft">
                        <td className="mono px-4 py-1.5 text-muted">{formatDate(q.date)}</td>
                        <td className="mono tnum px-4 py-1.5 text-right font-semibold">{num(q.close)}</td>
                        <td className={`mono tnum px-4 py-1.5 text-right ${ch >= 0 ? "text-up" : "text-down"}`}>
                          {ch >= 0 ? "+" : ""}{num(ch)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        <div className="space-y-4">
          <div id="trade">
            <Panel title="Invest via M-Pesa" subtitle={fund.symbol}>
              {portfolioId > 0 ? (
                <div className="p-4">
                  <TradeTicket
                    securityType="fund"
                    refId={fund.id}
                    symbol={fund.symbol}
                    name={fund.name}
                    price={fund.price ?? 0}
                    portfolioId={portfolioId}
                    cashBalance={cashBalance}
                  />
                </div>
              ) : (
                <SignInToTrade label="invest in this fund" />
              )}
            </Panel>
          </div>

          <Panel title="Fund Snapshot">
            <div className="px-4 py-2">
              <KeyVal k="Symbol" v={fund.symbol} />
              <KeyVal k="Type" v={fund.type} />
              <KeyVal k="Category" v={fund.category} />
              <KeyVal k="Manager" v={fund.manager || "—"} />
              <KeyVal k="NAV" v={kes(fund.nav ?? fund.price)} />
              <KeyVal k="AUM" v={money(fund.aum)} />
              <KeyVal k="Expense Ratio" v={(fund.expenseRatio ?? 0) > 0 ? num(fund.expenseRatio) + "%" : "—"} />
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
