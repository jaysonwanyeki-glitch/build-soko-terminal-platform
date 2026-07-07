import Link from "next/link";
import { Panel, ChangePill, Tag } from "@/components/ui";
import { StockAvatar } from "@/components/stock-avatar";
import { num, compact, money, classNames } from "@/lib/format";
import { getAllStocks } from "@/db/queries";
import type { Stock } from "@/db/schema";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "NSE Equities — Screener & Live Prices",
  description: "Browse and screen all NSE-listed equities. Live prices, fundamentals, charts and real company logos.",
};

type SortKey = "symbol" | "price" | "changePct" | "volume" | "turnover" | "marketCap" | "peRatio" | "dividendYield";

const COLUMNS: { key: SortKey; label: string; align: "left" | "right" }[] = [
  { key: "symbol", label: "Symbol", align: "left" },
  { key: "price", label: "Last", align: "right" },
  { key: "changePct", label: "Chg %", align: "right" },
  { key: "volume", label: "Volume", align: "right" },
  { key: "turnover", label: "Turnover", align: "right" },
  { key: "marketCap", label: "Mkt Cap", align: "right" },
  { key: "peRatio", label: "P/E", align: "right" },
  { key: "dividendYield", label: "Div %", align: "right" },
];

function val(s: Stock, k: SortKey): number | string {
  switch (k) {
    case "symbol": return s.symbol;
    case "price": return s.price ?? 0;
    case "changePct": return s.changePct ?? 0;
    case "volume": return s.volume ?? 0;
    case "turnover": return s.turnover ?? 0;
    case "marketCap": return s.marketCap ?? 0;
    case "peRatio": return s.peRatio ?? 0;
    case "dividendYield": return s.dividendYield ?? 0;
  }
}

export default async function StocksPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; dir?: string; sector?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const sort = (sp.sort as SortKey) || "marketCap";
  const dir = sp.dir === "asc" ? "asc" : "desc";
  const sector = sp.sector || "all";
  const q = (sp.q || "").trim().toLowerCase();

  const all = await getAllStocks();
  const sectors = ["all", ...Array.from(new Set(all.map((s) => s.sector))).sort()];

  let rows = all.filter((s) => sector === "all" || s.sector === sector);
  if (q) rows = rows.filter((s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q));
  rows = rows.sort((a, b) => {
    const va = val(a, sort);
    const vb = val(b, sort);
    if (typeof va === "string" || typeof vb === "string") {
      return dir === "asc" ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    }
    return dir === "asc" ? va - vb : vb - va;
  });

  const qs = (next: Record<string, string>) => {
    const base: Record<string, string> = { sort, dir, sector, q: sp.q || "" };
    if (base.q === "") delete base.q;
    return new URLSearchParams({ ...base, ...next }).toString();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="mono text-lg font-black tracking-tight text-fg">EQUITIES <span className="text-amber">·</span> NSE LISTINGS</h1>
          <p className="mono text-[11px] text-dim">{rows.length} counters · Nairobi Securities Exchange · Main Investment Market</p>
        </div>
        <form className="flex items-center gap-2">
          <input
            name="q"
            defaultValue={sp.q || ""}
            placeholder="Filter by symbol or name…"
            className="mono w-56 rounded-md border border-line bg-term-900 px-3 py-2 text-xs text-fg outline-none focus:border-amber/50"
          />
          <button type="submit" className="mono rounded-md border border-line px-3 py-2 text-xs text-muted hover:border-amber/40 hover:text-amber">
            Go
          </button>
        </form>
      </div>

      {/* Sector filter */}
      <div className="flex flex-wrap gap-1.5">
        {sectors.map((sec) => (
          <Link
            key={sec}
            href={`/stocks?${qs({ sector: sec, sort, dir })}`}
            className={classNames(
              "mono rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-wide transition",
              sector === sec
                ? "border-amber/50 bg-amber/10 text-amber"
                : "border-line text-muted hover:border-amber/30 hover:text-fg"
            )}
          >
            {sec === "all" ? "All Sectors" : sec}
          </Link>
        ))}
      </div>

      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left">
            <thead>
              <tr className="mono border-b border-line text-[10px] uppercase tracking-wider text-dim">
                <th className="px-4 py-2.5 font-semibold">#</th>
                {COLUMNS.map((c) => {
                  const active = sort === c.key;
                  const nextDir = active && dir === "desc" ? "asc" : "desc";
                  return (
                    <th key={c.key} className={`px-3 py-2.5 ${c.align === "right" ? "text-right" : ""} font-semibold`}>
                      <Link
                        href={`/stocks?${qs({ sort: c.key, dir: nextDir })}`}
                        className={classNames("inline-flex items-center gap-1 hover:text-amber", active && "text-amber")}
                      >
                        {c.label}
                        {active && <span>{dir === "asc" ? "▲" : "▼"}</span>}
                      </Link>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map((s, i) => (
                <tr key={s.id} className="border-b border-line-soft transition hover:bg-term-800/40">
                  <td className="mono px-4 py-2.5 text-[10px] text-dim">{i + 1}</td>
                  <td className="px-3 py-2.5">
                    <Link href={`/stocks/${s.symbol}`} className="group flex items-center gap-2.5">
                      <StockAvatar symbol={s.symbol} sector={s.sector} size={30} />
                      <div>
                        <div className="mono text-sm font-bold text-fg group-hover:text-amber">{s.symbol}</div>
                        <div className="max-w-[180px] truncate text-[10px] text-dim">{s.name}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="mono tnum px-3 py-2.5 text-right font-semibold">{num(s.price)}</td>
                  <td className="px-3 py-2.5 text-right">
                    <ChangePill value={s.changePct} showArrow={false} />
                  </td>
                  <td className="mono tnum px-3 py-2.5 text-right text-muted">{compact(s.volume)}</td>
                  <td className="mono tnum px-3 py-2.5 text-right text-muted">{compact(s.turnover)}</td>
                  <td className="mono tnum px-3 py-2.5 text-right text-muted">{compact(s.marketCap)}</td>
                  <td className="mono tnum px-3 py-2.5 text-right text-muted">{(s.peRatio ?? 0) > 0 ? num(s.peRatio) : "—"}</td>
                  <td className="mono tnum px-3 py-2.5 text-right text-muted">
                    {(s.dividendYield ?? 0) > 0 ? num(s.dividendYield) + "%" : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mono flex items-center justify-between border-t border-line px-4 py-2 text-[10px] text-dim">
          <span>Screener · click any column to sort</span>
          <span>{rows.length} results</span>
        </div>
      </Panel>
    </div>
  );
}
