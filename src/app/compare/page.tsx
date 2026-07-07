import type { ReactNode } from "react";
import Link from "next/link";
import { Panel, ChangePill, Tag } from "@/components/ui";
import { StockAvatar } from "@/components/stock-avatar";
import { Sparkline } from "@/components/charts";
import { num, compact, money, classNames } from "@/lib/format";
import { getAllStocks, getStockQuotes } from "@/db/queries";

export const dynamic = "force-dynamic";

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ syms?: string }>;
}) {
  const sp = await searchParams;
  const syms = (sp.syms || "").split(",").map((s) => s.trim().toUpperCase()).filter(Boolean).slice(0, 4);

  const all = await getAllStocks();
  const selected = syms.map((s) => all.find((x) => x.symbol === s)).filter(Boolean);

  const quotesMap = new Map<string, number[]>();
  for (const s of selected) {
    if (s) {
      const q = await getStockQuotes(s.id, 30);
      quotesMap.set(s.symbol, q.map((r) => r.close));
    }
  }

  const rows: { label: string; get: (s: NonNullable<typeof selected[number]>) => ReactNode }[] = [
    { label: "Price", get: (s) => num(s.price) },
    { label: "Change %", get: (s) => <ChangePill value={s.changePct} showArrow={false} /> },
    { label: "Market Cap", get: (s) => money(s.marketCap) },
    { label: "P/E Ratio", get: (s) => (s.peRatio ?? 0) > 0 ? num(s.peRatio) : "—" },
    { label: "P/B Ratio", get: (s) => num(s.pbRatio) },
    { label: "EPS", get: (s) => num(s.eps) },
    { label: "Dividend Yield", get: (s) => (s.dividendYield ?? 0) > 0 ? num(s.dividendYield) + "%" : "—" },
    { label: "Volume", get: (s) => compact(s.volume) },
    { label: "52W High", get: (s) => num(s.yearHigh) },
    { label: "52W Low", get: (s) => num(s.yearLow) },
    { label: "Sector", get: (s) => <Tag>{s.sector}</Tag> },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="mono text-lg font-black tracking-tight text-fg">COMPARE <span className="text-amber">·</span> SIDE BY SIDE</h1>
        <p className="mono text-[11px] text-dim">Pick up to 4 NSE stocks and compare fundamentals at a glance.</p>
      </div>

      {/* Picker */}
      <Panel title="Select Stocks" subtitle="click to add — max 4">
        <div className="flex flex-wrap gap-1.5 p-3">
          {all.slice(0, 20).map((s) => {
            const active = syms.includes(s.symbol);
            return (
              <Link
                key={s.symbol}
                href={`/compare?syms=${active ? syms.filter((x) => x !== s.symbol).join(",") : [...syms, s.symbol].join(",")}`}
                className={classNames(
                  "mono rounded-full border px-2.5 py-1 text-[10px] font-semibold transition",
                  active ? "border-amber/50 bg-amber/10 text-amber" : "border-line text-muted hover:border-amber/30 hover:text-fg"
                )}
              >
                {active ? "✓ " : ""}{s.symbol}
              </Link>
            );
          })}
        </div>
      </Panel>

      {selected.length === 0 ? (
        <Panel>
          <div className="px-4 py-12 text-center text-xs text-dim">
            Select at least one stock above to start comparing.
          </div>
        </Panel>
      ) : (
        <Panel title="Head to Head" subtitle={`${selected.length} stocks`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-line">
                  <th className="px-4 py-3 w-32"></th>
                  {selected.map((s) => s && (
                    <th key={s.symbol} className="px-3 py-3">
                      <Link href={`/stocks/${s.symbol}`} className="group flex flex-col items-center gap-2">
                        <StockAvatar symbol={s.symbol} sector={s.sector} size={40} />
                        <span className="mono text-sm font-bold text-fg group-hover:text-amber">{s.symbol}</span>
                        <span className="max-w-[120px] truncate text-[10px] text-dim">{s.name}</span>
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* mini chart row */}
                <tr className="border-b border-line-soft">
                  <td className="mono px-4 py-3 text-[10px] uppercase tracking-wider text-dim">30D Trend</td>
                  {selected.map((s) => s && (
                    <td key={s.symbol} className="px-3 py-3">
                      <div className="flex justify-center">
                        <Sparkline data={quotesMap.get(s.symbol) ?? []} width={120} height={36} color={(s.change ?? 0) >= 0 ? "#1fd585" : "#ff5364"} />
                      </div>
                    </td>
                  ))}
                </tr>
                {rows.map((r, i) => (
                  <tr key={r.label} className={classNames("border-b border-line-soft", i % 2 === 1 && "bg-term-850/30")}>
                    <td className="mono px-4 py-2.5 text-[11px] uppercase tracking-wider text-dim">{r.label}</td>
                    {selected.map((s) => s && (
                      <td key={s.symbol} className="mono tnum px-3 py-2.5 text-center text-sm font-semibold text-fg">
                        {r.get(s)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </div>
  );
}
