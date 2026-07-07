import Link from "next/link";
import { Panel, Tag, ChangePill } from "@/components/ui";
import { StockAvatar } from "@/components/stock-avatar";
import { num, compact, money, classNames } from "@/lib/format";
import { getAllStocks, screenStocks } from "@/db/queries";

export const dynamic = "force-dynamic";

export default async function ScreenerPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const f = {
    sector: sp.sector || "all",
    minPrice: sp.minPrice ? Number(sp.minPrice) : undefined,
    maxPrice: sp.maxPrice ? Number(sp.maxPrice) : undefined,
    minDividend: sp.minDividend ? Number(sp.minDividend) : undefined,
    minPE: sp.minPE ? Number(sp.minPE) : undefined,
    maxPE: sp.maxPE ? Number(sp.maxPE) : undefined,
    sortBy: sp.sortBy || "marketCap",
    sortDir: (sp.sortDir as "asc" | "desc") || "desc",
  };

  const all = await getAllStocks();
  const sectors = Array.from(new Set(all.map((s) => s.sector))).sort();
  const rows = await screenStocks(f);

  const presets = [
    { label: "High Dividend", q: "?minDividend=6&sortBy=dividendYield&sortDir=desc" },
    { label: "Undervalued (P/E<10)", q: "?maxPE=10&sortBy=peRatio&sortDir=asc" },
    { label: "Large Caps", q: "?sortBy=marketCap&sortDir=desc" },
    { label: "Top Movers", q: "?sortBy=changePct&sortDir=desc" },
    { label: "Penny Stocks", q: "?maxPrice=10&sortBy=price&sortDir=asc" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="mono text-lg font-black tracking-tight text-fg">SCREENER <span className="text-amber">·</span> FIND YOUR NEXT TRADE</h1>
        <p className="mono text-[11px] text-dim">Filter the entire NSE by fundamentals, valuation & price action.</p>
      </div>

      {/* Filter panel */}
      <Panel title="Filters" subtitle={`${rows.length} of ${all.length} stocks match`}>
        <form className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-4">
          <div>
            <label className="mono mb-1 block text-[10px] uppercase tracking-wider text-dim">Sector</label>
            <select name="sector" defaultValue={f.sector} className="mono w-full rounded-md border border-line bg-term-900 px-2.5 py-2 text-xs text-fg outline-none focus:border-amber/50">
              <option value="all">All Sectors</option>
              {sectors.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mono mb-1 block text-[10px] uppercase tracking-wider text-dim">Min Price (KSh)</label>
            <input name="minPrice" type="number" step="0.1" defaultValue={f.minPrice ?? ""} placeholder="0" className="mono tnum w-full rounded-md border border-line bg-term-900 px-2.5 py-2 text-xs text-fg outline-none focus:border-amber/50" />
          </div>
          <div>
            <label className="mono mb-1 block text-[10px] uppercase tracking-wider text-dim">Max Price (KSh)</label>
            <input name="maxPrice" type="number" step="0.1" defaultValue={f.maxPrice ?? ""} placeholder="∞" className="mono tnum w-full rounded-md border border-line bg-term-900 px-2.5 py-2 text-xs text-fg outline-none focus:border-amber/50" />
          </div>
          <div>
            <label className="mono mb-1 block text-[10px] uppercase tracking-wider text-dim">Min Div Yield %</label>
            <input name="minDividend" type="number" step="0.1" defaultValue={f.minDividend ?? ""} placeholder="0" className="mono tnum w-full rounded-md border border-line bg-term-900 px-2.5 py-2 text-xs text-fg outline-none focus:border-amber/50" />
          </div>
          <div>
            <label className="mono mb-1 block text-[10px] uppercase tracking-wider text-dim">Min P/E</label>
            <input name="minPE" type="number" step="0.1" defaultValue={f.minPE ?? ""} placeholder="0" className="mono tnum w-full rounded-md border border-line bg-term-900 px-2.5 py-2 text-xs text-fg outline-none focus:border-amber/50" />
          </div>
          <div>
            <label className="mono mb-1 block text-[10px] uppercase tracking-wider text-dim">Max P/E</label>
            <input name="maxPE" type="number" step="0.1" defaultValue={f.maxPE ?? ""} placeholder="∞" className="mono tnum w-full rounded-md border border-line bg-term-900 px-2.5 py-2 text-xs text-fg outline-none focus:border-amber/50" />
          </div>
          <div>
            <label className="mono mb-1 block text-[10px] uppercase tracking-wider text-dim">Sort By</label>
            <select name="sortBy" defaultValue={f.sortBy} className="mono w-full rounded-md border border-line bg-term-900 px-2.5 py-2 text-xs text-fg outline-none focus:border-amber/50">
              <option value="marketCap">Market Cap</option>
              <option value="price">Price</option>
              <option value="changePct">Daily Change</option>
              <option value="dividendYield">Dividend Yield</option>
              <option value="peRatio">P/E Ratio</option>
              <option value="volume">Volume</option>
            </select>
          </div>
          <div>
            <label className="mono mb-1 block text-[10px] uppercase tracking-wider text-dim">Direction</label>
            <select name="sortDir" defaultValue={f.sortDir} className="mono w-full rounded-md border border-line bg-term-900 px-2.5 py-2 text-xs text-fg outline-none focus:border-amber/50">
              <option value="desc">High → Low</option>
              <option value="asc">Low → High</option>
            </select>
          </div>
          <div className="col-span-2 flex gap-2 sm:col-span-3 lg:col-span-4">
            <button type="submit" className="mono flex-1 rounded-md bg-amber py-2 text-xs font-bold uppercase tracking-wider text-term-950 transition hover:brightness-110">
              Run Screen
            </button>
            <Link href="/screener" className="mono rounded-md border border-line px-4 py-2 text-xs font-semibold text-muted transition hover:border-amber/40 hover:text-amber">
              Reset
            </Link>
          </div>
        </form>
        <div className="flex flex-wrap gap-1.5 border-t border-line px-4 py-2.5">
          {presets.map((p) => (
            <Link key={p.label} href={`/screener${p.q}`} className="mono rounded-full border border-line px-2.5 py-1 text-[10px] text-muted transition hover:border-amber/40 hover:text-amber">
              {p.label}
            </Link>
          ))}
        </div>
      </Panel>

      {/* Results */}
      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="mono border-b border-line text-[10px] uppercase tracking-wider text-dim">
                <th className="px-4 py-2.5 font-semibold">Stock</th>
                <th className="px-3 py-2.5 text-right font-semibold">Price</th>
                <th className="px-3 py-2.5 text-right font-semibold">Chg %</th>
                <th className="px-3 py-2.5 text-right font-semibold">Mkt Cap</th>
                <th className="px-3 py-2.5 text-right font-semibold">P/E</th>
                <th className="px-3 py-2.5 text-right font-semibold">Div %</th>
                <th className="px-4 py-2.5 text-right font-semibold">52W Range</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => {
                const yLow = s.yearLow ?? 0;
                const yHigh = s.yearHigh ?? 1;
                const pos = Math.min(100, Math.max(0, (((s.price ?? 0) - yLow) / (yHigh - yLow || 1)) * 100));
                return (
                  <tr key={s.id} className="border-b border-line-soft transition hover:bg-term-800/40">
                    <td className="px-4 py-2.5">
                      <Link href={`/stocks/${s.symbol}`} className="group flex items-center gap-2.5">
                        <StockAvatar symbol={s.symbol} sector={s.sector} size={28} />
                        <div>
                          <div className="mono text-sm font-bold text-fg group-hover:text-amber">{s.symbol}</div>
                          <div className="max-w-[150px] truncate text-[10px] text-dim">{s.sector}</div>
                        </div>
                      </Link>
                    </td>
                    <td className="mono tnum px-3 py-2.5 text-right font-semibold">{num(s.price)}</td>
                    <td className="px-3 py-2.5 text-right"><ChangePill value={s.changePct} showArrow={false} /></td>
                    <td className="mono tnum px-3 py-2.5 text-right text-muted">{compact(s.marketCap)}</td>
                    <td className="mono tnum px-3 py-2.5 text-right text-muted">{(s.peRatio ?? 0) > 0 ? num(s.peRatio) : "—"}</td>
                    <td className="mono tnum px-3 py-2.5 text-right text-muted">{(s.dividendYield ?? 0) > 0 ? num(s.dividendYield) + "%" : "—"}</td>
                    <td className="px-4 py-2.5">
                      <div className="relative h-1.5 w-24 rounded-full bg-term-800">
                        <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-down/50 via-amber/50 to-up/50" style={{ width: "100%" }} />
                        <div className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border-2 border-term-950 bg-amber" style={{ left: `${pos}%` }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && (
          <div className="px-4 py-12 text-center text-xs text-dim">No stocks match your filters. Try loosening the criteria.</div>
        )}
      </Panel>
    </div>
  );
}
