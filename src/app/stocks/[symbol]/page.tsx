import Link from "next/link";
import { notFound } from "next/navigation";
import { Panel, ChangePill, Delta, Tag, KeyVal, SentimentDot, Stat } from "@/components/ui";
import { TradingChart } from "@/components/trading-chart";
import { TradeTicket } from "@/components/trade-ticket";
import { WatchButton } from "@/components/watch-button";
import { StockAvatar, SectorBanner } from "@/components/stock-avatar";
import { OrderBook } from "@/components/order-book";
import { Financials } from "@/components/financials";
import { SignInToTrade } from "@/components/sign-in-to-trade";
import { buildFinancials } from "@/lib/financials";
import { num, kes, compact, money, signed, timeAgo, formatDate, classNames } from "@/lib/format";
import {
  getStockBySymbol,
  getStockQuotes,
  getNewsBySymbol,
  getWatchlist,
  ensurePortfolio,
  getPortfolioCash,
} from "@/db/queries";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function StockDetail({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const stock = await getStockBySymbol(symbol);
  if (!stock) notFound();

  const session = await getSession();
  const [quotes, news, watchlist, portfolioId] = await Promise.all([
    getStockQuotes(stock.id, 120).catch(() => []),
    getNewsBySymbol(stock.symbol, 5).catch(() => []),
    getWatchlist().catch(() => []),
    ensurePortfolio(session?.id),
  ]);
  const cashBalance = await getPortfolioCash(portfolioId);

  const watching = watchlist.some((w) => w.securityType === "stock" && w.refId === stock.id);
  const candles = quotes.slice(-90).map((q) => ({ date: q.date, open: q.open, high: q.high, low: q.low, close: q.close }));
  const financials = buildFinancials({
    symbol: stock.symbol,
    marketCap: stock.marketCap ?? 0,
    eps: stock.eps ?? 0,
    peRatio: stock.peRatio ?? 0,
    dividendYield: stock.dividendYield ?? 0,
    price: stock.price ?? 0,
    sharesOutstanding: stock.sharesOutstanding ?? 1,
  });
  const up = (stock.change ?? 0) >= 0;
  const yLow = stock.yearLow ?? 0;
  const yHigh = stock.yearHigh ?? 1;
  const rangePct = ((stock.price ?? 0) - yLow) / (yHigh - yLow || 1);

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="mono flex items-center gap-2 text-[11px] text-dim">
        <Link href="/stocks" className="hover:text-amber">Equities</Link>
        <span>/</span>
        <span className="text-fg">{stock.symbol}</span>
      </div>

      {/* Sector banner */}
      <SectorBanner sector={stock.sector} height={92} />

      {/* Header */}
      <Panel className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <StockAvatar symbol={stock.symbol} sector={stock.sector} size={44} />
              <div>
                <h1 className="mono text-2xl font-black tracking-tight text-fg">{stock.symbol}</h1>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <Tag tone="amber">NSE</Tag>
                  <Tag>{stock.sector}</Tag>
                </div>
              </div>
            </div>
            <p className="mt-1 text-sm text-muted">{stock.name}</p>
            <p className="mono text-[11px] text-dim">{stock.industry} · {stock.exchange} · {stock.currency}</p>
          </div>
          <div className="text-right">
            <div className="mono tnum text-3xl font-black text-fg">{num(stock.price)}</div>
            <div className="mt-1 flex items-center justify-end gap-2">
              <Delta value={stock.change} />
              <ChangePill value={stock.changePct} />
            </div>
            <div className="mono mt-1 text-[10px] text-dim">prev close {num(stock.prevClose)}</div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <WatchButton securityType="stock" refId={stock.id} symbol={stock.symbol} name={stock.name} watching={watching} />
          <a href="#trade" className="mono inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted transition hover:border-amber/40 hover:text-amber">
            Trade Ticket ↓
          </a>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left: chart + stats + quotes */}
        <div className="space-y-4 lg:col-span-2">
          <Panel
            title="Live Chart"
            subtitle="1m → 1M · candlesticks · volume · MA9/MA21 · hover for crosshair"
            right={
              <div className="mono flex items-center gap-3 text-[10px]">
                <span className="text-up">▲ {num(stock.high)}</span>
                <span className="text-down">▼ {num(stock.low)}</span>
              </div>
            }
          >
            <div className="p-3">
              <TradingChart daily={quotes} symbol={stock.symbol} height={420} />
            </div>
          </Panel>

          {/* 52w range */}
          <Panel className="p-4" title="52-Week Range">
            <div className="mt-1">
              <div className="mb-1 flex justify-between text-[11px]">
                <span className="mono tnum text-down">{num(yLow)}</span>
                <span className="mono tnum text-up">{num(yHigh)}</span>
              </div>
              <div className="relative h-2 rounded-full bg-term-800">
                <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-down/60 via-amber/60 to-up/60" style={{ width: "100%" }} />
                <div
                  className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 border-term-950 bg-amber"
                  style={{ left: `${Math.min(98, Math.max(2, rangePct * 100))}%` }}
                />
              </div>
            </div>
          </Panel>

          {/* Key stats */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:col-span-2">
            <Stat label="Open" value={num(stock.open)} />
            <Stat label="Day High" value={num(stock.high)} />
            <Stat label="Day Low" value={num(stock.low)} />
            <Stat label="Volume" value={compact(stock.volume)} />
            <Stat label="Turnover" value={money(stock.turnover)} />
            <Stat label="Market Cap" value={money(stock.marketCap)} />
            <Stat label="Shares Out" value={compact(stock.sharesOutstanding)} />
            <Stat label="EPS" value={num(stock.eps)} />
            <Stat label="P/E Ratio" value={(stock.peRatio ?? 0) > 0 ? num(stock.peRatio) : "—"} />
            <Stat label="P/B Ratio" value={num(stock.pbRatio)} />
            <Stat label="Dividend Yield" value={(stock.dividendYield ?? 0) > 0 ? num(stock.dividendYield) + "%" : "—"} />
            <Stat label="Currency" value="KES" />
          </div>

          {/* About */}
          <Panel title="Company Profile">
            <p className="px-4 py-3 text-sm leading-relaxed text-muted">{stock.description}</p>
          </Panel>

          {/* Financials */}
          <Panel title="Financial Statements" subtitle="3-year history · KSh millions">
            <Financials data={financials} />
          </Panel>

          {/* Quote history */}
          <Panel title="Quote History" subtitle="recent sessions">
            <div className="max-h-[320px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-term-850">
                  <tr className="mono border-b border-line text-[10px] uppercase tracking-wider text-dim">
                    <th className="px-4 py-2 font-semibold">Date</th>
                    <th className="px-3 py-2 text-right font-semibold">Open</th>
                    <th className="px-3 py-2 text-right font-semibold">High</th>
                    <th className="px-3 py-2 text-right font-semibold">Low</th>
                    <th className="px-3 py-2 text-right font-semibold">Close</th>
                    <th className="px-3 py-2 text-right font-semibold">Chg</th>
                    <th className="px-3 py-2 text-right font-semibold">Volume</th>
                  </tr>
                </thead>
                <tbody>
                  {[...quotes].reverse().slice(0, 20).map((q, i, arr) => {
                    const prev = arr[i + 1];
                    const ch = prev ? q.close - prev.close : 0;
                    return (
                      <tr key={q.id} className="border-b border-line-soft">
                        <td className="mono px-4 py-1.5 text-muted">{formatDate(q.date)}</td>
                        <td className="mono tnum px-3 py-1.5 text-right text-muted">{num(q.open)}</td>
                        <td className="mono tnum px-3 py-1.5 text-right text-up/80">{num(q.high)}</td>
                        <td className="mono tnum px-3 py-1.5 text-right text-down/80">{num(q.low)}</td>
                        <td className="mono tnum px-3 py-1.5 text-right font-semibold">{num(q.close)}</td>
                        <td className={classNames("mono tnum px-3 py-1.5 text-right", ch >= 0 ? "text-up" : "text-down")}>{signed(ch)}</td>
                        <td className="mono tnum px-3 py-1.5 text-right text-dim">{compact(q.volume)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        {/* Right: order book + trade + news */}
        <div className="space-y-4">
          <Panel title="Order Book" subtitle="live bid / ask depth · auto-refresh">
            <OrderBook symbol={stock.symbol} price={stock.price ?? 0} />
          </Panel>

          <div id="trade">
            <Panel title="Trade Ticket" subtitle={stock.symbol}>
              {portfolioId > 0 ? (
              <div className="p-4">
                <TradeTicket
                  securityType="stock"
                  refId={stock.id}
                  symbol={stock.symbol}
                  name={stock.name}
                  price={stock.price ?? 0}
                  portfolioId={portfolioId}
                  cashBalance={cashBalance}
                />
              </div>
              ) : (
                <SignInToTrade label="trade this stock" />
              )}
            </Panel>
          </div>

          <Panel title="Related News">
            {news.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-dim">No news tagged {stock.symbol}.</div>
            ) : (
              <div className="divide-y divide-line-soft">
                {news.map((n) => (
                  <div key={n.id} className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <SentimentDot sentiment={n.sentiment} />
                      <span className="mono text-[9px] text-dim">{timeAgo(n.publishedAt)}</span>
                    </div>
                    <div className="mt-1 text-xs font-semibold leading-snug text-fg">{n.title}</div>
                    <div className="mono mt-1 text-[9px] text-dim">{n.source}</div>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Snapshot">
            <div className="px-4 py-2">
              <KeyVal k="ISIN" v={stock.isin || "—"} />
              <KeyVal k="Sector" v={stock.sector} />
              <KeyVal k="Industry" v={stock.industry || "—"} />
              <KeyVal k="Exchange" v={stock.exchange} />
              <KeyVal k="Country" v={stock.country} />
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
