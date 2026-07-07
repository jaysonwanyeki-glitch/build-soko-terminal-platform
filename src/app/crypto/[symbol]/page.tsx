import Link from "next/link";
import { notFound } from "next/navigation";
import { Panel, ChangePill, Delta, Tag, KeyVal, Stat } from "@/components/ui";
import { TradingChart } from "@/components/trading-chart";
import { CryptoAvatar } from "@/components/crypto-avatar";
import { TradeTicket } from "@/components/trade-ticket";
import { WatchButton } from "@/components/watch-button";
import { SignInToTrade } from "@/components/sign-in-to-trade";
import { num, kes, compact, money, signed, formatDate } from "@/lib/format";
import { getCryptoBySymbol, getCryptoQuotes, getWatchlist, ensurePortfolio, getPortfolioCash } from "@/db/queries";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function CryptoDetail({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const crypto = await getCryptoBySymbol(symbol);
  if (!crypto) notFound();

  const session = await getSession();
  const [quotes, watchlist, portfolioId] = await Promise.all([
    getCryptoQuotes(crypto.id, 120).catch(() => []),
    getWatchlist().catch(() => []),
    ensurePortfolio(session?.id),
  ]);
  const cashBalance = await getPortfolioCash(portfolioId);
  const watching = watchlist.some((w) => w.securityType === "crypto" && w.refId === crypto.id);
  const up = (crypto.change ?? 0) >= 0;
  const yLow = crypto.yearLow ?? 0;
  const yHigh = crypto.yearHigh ?? 1;
  const rangePct = ((crypto.price ?? 0) - yLow) / (yHigh - yLow || 1);

  return (
    <div className="space-y-4">
      <div className="mono flex items-center gap-2 text-[11px] text-dim">
        <Link href="/crypto" className="hover:text-gold">Crypto</Link>
        <span>/</span>
        <span className="text-fg">{crypto.symbol}</span>
      </div>

      <Panel className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <CryptoAvatar symbol={crypto.symbol} size={44} />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="mono text-2xl font-black tracking-tight text-fg">{crypto.symbol}</h1>
                <Tag tone="amber">{crypto.category}</Tag>
                <span className="mono rounded border border-line px-1.5 py-0.5 text-[9px] text-dim">24/7</span>
              </div>
              <p className="mt-1 text-sm text-muted">{crypto.name}</p>
              <p className="mono text-[11px] text-dim">{crypto.network}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="mono tnum text-3xl font-black text-fg">
              KSh {num(crypto.price, crypto.price < 1 ? 6 : 2)}
            </div>
            <div className="mt-1 text-[11px] text-dim">≈ ${num(crypto.priceUsd, crypto.priceUsd < 1 ? 6 : 2)}</div>
            <div className="mt-1 flex items-center justify-end gap-2">
              <Delta value={crypto.change} />
              <ChangePill value={crypto.changePct} />
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <WatchButton securityType="crypto" refId={crypto.id} symbol={crypto.symbol} name={crypto.name} watching={watching} />
          <a href="#trade" className="mono inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted transition hover:border-gold/40 hover:text-gold">
            Buy with M-Pesa ↓
          </a>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Panel
            title="Live Chart"
            subtitle={`${crypto.symbol}/KES · 1m → 1M · candles · volume · MA9/MA21`}
            right={
              <div className="mono flex items-center gap-3 text-[10px]">
                <span className="text-up">▲ {num(crypto.high24h, crypto.price < 1 ? 6 : 2)}</span>
                <span className="text-down">▼ {num(crypto.low24h, crypto.price < 1 ? 6 : 2)}</span>
              </div>
            }
          >
            <div className="p-3">
              <TradingChart daily={quotes} symbol={crypto.symbol} height={420} />
            </div>
          </Panel>

          <Panel className="p-4" title="All-Time Range (seeded window)">
            <div className="mt-1">
              <div className="mb-1 flex justify-between text-[11px]">
                <span className="mono tnum text-down">{num(yLow, crypto.price < 1 ? 6 : 2)}</span>
                <span className="mono tnum text-up">{num(yHigh, crypto.price < 1 ? 6 : 2)}</span>
              </div>
              <div className="relative h-2 rounded-full bg-term-800">
                <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-down/60 via-amber/60 to-up/60" style={{ width: "100%" }} />
                <div
                  className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 border-term-950 bg-gold"
                  style={{ left: `${Math.min(98, Math.max(2, rangePct * 100))}%` }}
                />
              </div>
            </div>
          </Panel>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Market Cap" value={money(crypto.marketCap)} />
            <Stat label="Volume 24h" value={money(crypto.volume24h)} />
            <Stat label="Circ. Supply" value={compact(crypto.circulatingSupply)} />
            <Stat label="Rank" value={`#${crypto.rank}`} />
            <Stat label="24h High" value={num(crypto.high24h, crypto.price < 1 ? 6 : 2)} />
            <Stat label="24h Low" value={num(crypto.low24h, crypto.price < 1 ? 6 : 2)} />
            <Stat label="USD Price" value={`$${num(crypto.priceUsd, crypto.priceUsd < 1 ? 6 : 2)}`} />
            <Stat label="Category" value={crypto.category} />
          </div>

          <Panel title="About">
            <p className="px-4 py-3 text-sm leading-relaxed text-muted">{crypto.description}</p>
          </Panel>
        </div>

        <div className="space-y-4">
          <div id="trade">
            <Panel title="Buy with M-Pesa" subtitle={crypto.symbol}>
              {portfolioId > 0 ? (
                <div className="p-4">
                  <TradeTicket
                    securityType="crypto"
                    refId={crypto.id}
                    symbol={crypto.symbol}
                    name={crypto.name}
                    price={crypto.price ?? 0}
                    portfolioId={portfolioId}
                    cashBalance={cashBalance}
                  />
                </div>
              ) : (
                <SignInToTrade label="buy crypto" />
              )}
            </Panel>
          </div>

          <Panel title="Snapshot">
            <div className="px-4 py-2">
              <KeyVal k="Symbol" v={crypto.symbol} />
              <KeyVal k="Network" v={crypto.network || "—"} />
              <KeyVal k="Category" v={crypto.category} />
              <KeyVal k="Market Cap" v={money(crypto.marketCap)} />
              <KeyVal k="Circ. Supply" v={compact(crypto.circulatingSupply)} />
              <KeyVal k="Updated" v={formatDate(crypto.updatedAt)} />
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
