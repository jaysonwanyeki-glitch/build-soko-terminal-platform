import Link from "next/link";
import { Panel, ChangePill, Tag } from "@/components/ui";
import { CryptoAvatar } from "@/components/crypto-avatar";
import { LivePriceTicker } from "@/components/live-ticker";
import { num, compact, money, classNames } from "@/lib/format";
import { getAllCryptos } from "@/db/queries";
import { getLiveCryptoData } from "@/lib/live-prices";
import type { Crypto } from "@/db/schema";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Crypto — Live KES Prices, Trade with M-Pesa",
  description: "Trade Bitcoin, Ethereum, USDT and 17 more cryptocurrencies with live CoinGecko prices, 24/7, via M-Pesa.",
};

type SortKey = "rank" | "price" | "changePct" | "marketCap" | "volume24h";

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "price", label: "Price (KES)" },
  { key: "changePct", label: "24h %" },
  { key: "marketCap", label: "Market Cap" },
  { key: "volume24h", label: "Volume 24h" },
];

function val(c: Crypto, k: SortKey): number {
  switch (k) {
    case "rank": return c.rank ?? 999;
    case "price": return c.price ?? 0;
    case "changePct": return c.changePct ?? 0;
    case "marketCap": return c.marketCap ?? 0;
    case "volume24h": return c.volume24h ?? 0;
  }
}

export default async function CryptoPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; dir?: string; cat?: string }>;
}) {
  const sp = await searchParams;
  const sort = (sp.sort as SortKey) || "rank";
  const dir = sp.dir === "asc" ? "asc" : "desc";
  const cat = sp.cat || "all";

  const all = (await getAllCryptos()) ?? [];
  // Fetch live prices from CoinGecko and merge with DB data (defensive)
  let liveData: Awaited<ReturnType<typeof getLiveCryptoData>>["data"] = [];
  let isLive = false;
  try {
    const result = await getLiveCryptoData(
      all.map((c) => ({ symbol: c.symbol, price: c.price, priceUsd: c.priceUsd, changePct: c.changePct ?? 0 }))
    );
    liveData = result.data ?? [];
    isLive = result.isLive;
  } catch (e) {
    console.error("live crypto fetch failed:", e);
  }
  const liveMap = new Map((liveData ?? []).map((d) => [d.symbol, d]));
  const cats = ["all", ...Array.from(new Set(all.map((c) => c.category))).sort()];

  let rows = all.filter((c) => cat === "all" || c.category === cat);
  rows = rows.sort((a, b) => {
    const va = val(a, sort);
    const vb = val(b, sort);
    if (sort === "rank") return dir === "asc" ? va - vb : vb - va;
    return dir === "asc" ? va - vb : vb - va;
  });

  const qs = (next: Record<string, string>) => {
    const base: Record<string, string> = { sort, dir };
    return new URLSearchParams({ ...base, ...next }).toString();
  };

  const totalCap = all.reduce((a, c) => a + (c.marketCap ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="mono text-lg font-black tracking-tight text-fg">
            CRYPTO <span className="text-amber">·</span> TRADE 24/7 WITH M-PESA
          </h1>
          <p className="mono text-[11px] text-dim">
            {all.length} assets · KES-denominated · instant settlement from your M-Pesa wallet
          </p>
        </div>
        <div className="flex gap-2">
          <div className="rounded-md border border-line bg-term-850 px-3 py-2">
            <div className="mono text-[10px] uppercase text-dim">Total Cap</div>
            <div className="mono tnum text-base font-bold text-fg">{money(totalCap)}</div>
          </div>
          <div className="rounded-xl border border-line bg-gradient-to-br from-term-700/40 to-term-900/60 px-3 py-2">
            <div className="mono text-[10px] uppercase text-dim">Prices</div>
            <div className="mono flex items-center gap-1.5 text-xs font-bold">
              <span className={isLive ? "text-up" : "text-amber"}>
                {isLive ? "● LIVE" : "● CACHED"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* live ticker */}
      <div className="flex items-center gap-3 rounded-xl border border-line bg-term-900/60 px-4 py-2.5">
        <span className="mono text-[10px] font-bold uppercase tracking-wider text-dim">Live</span>
        <LivePriceTicker symbols={all.slice(0, 8).map((c) => c.symbol)} />
      </div>

      {/* category filter */}
      <div className="flex flex-wrap gap-1.5">
        {cats.map((c) => (
          <Link
            key={c}
            href={`/crypto?${qs({ cat: c })}`}
            className={classNames(
              "mono rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-wide transition",
              cat === c
                ? "border-gold/50 bg-gold/10 text-gold"
                : "border-line text-muted hover:border-gold/30 hover:text-fg"
            )}
          >
            {c === "all" ? "All" : c}
          </Link>
        ))}
      </div>

      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="mono border-b border-line text-[10px] uppercase tracking-wider text-dim">
                <th className="px-4 py-2.5 font-semibold">#</th>
                <th className="px-3 py-2.5 font-semibold">Asset</th>
                {COLUMNS.map((col) => {
                  const active = sort === col.key;
                  const nextDir = active && dir === "desc" ? "asc" : "desc";
                  return (
                    <th key={col.key} className="px-3 py-2.5 text-right font-semibold">
                      <Link
                        href={`/crypto?${qs({ sort: col.key, dir: nextDir })}`}
                        className={classNames("inline-flex items-center gap-1 hover:text-gold", active && "text-gold")}
                      >
                        {col.label}
                        {active && <span>{dir === "asc" ? "▲" : "▼"}</span>}
                      </Link>
                    </th>
                  );
                })}
                <th className="px-3 py-2.5 text-right font-semibold">Price (USD)</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c, i) => (
                <tr key={c.id} className="border-b border-line-soft transition hover:bg-term-800/40">
                  <td className="mono px-4 py-2.5 text-[10px] text-dim">{c.rank ?? i + 1}</td>
                  <td className="px-3 py-2.5">
                    <Link href={`/crypto/${c.symbol}`} className="group flex items-center gap-2.5">
                      <CryptoAvatar symbol={c.symbol} size={26} />
                      <div>
                        <div className="mono text-sm font-bold text-fg group-hover:text-gold">{c.symbol}</div>
                        <div className="max-w-[160px] truncate text-[10px] text-dim">{c.name}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="mono tnum px-3 py-2.5 text-right font-semibold">
                    {(() => { const lp = liveMap.get(c.symbol); const p = lp?.priceKes ?? c.price; return p < 1 ? num(p, 6) : num(p); })()}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <ChangePill value={c.changePct} showArrow={false} />
                  </td>
                  <td className="mono tnum px-3 py-2.5 text-right text-muted">{compact(c.marketCap)}</td>
                  <td className="mono tnum px-3 py-2.5 text-right text-muted">{compact(c.volume24h)}</td>
                  <td className="mono tnum px-3 py-2.5 text-right text-dim">
                    ${num(liveMap.get(c.symbol)?.priceUsd ?? c.priceUsd, (liveMap.get(c.symbol)?.priceUsd ?? c.priceUsd) < 1 ? 6 : 2)}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Link
                      href={`/crypto/${c.symbol}`}
                      className="mono rounded border border-line px-2 py-1 text-[10px] text-muted transition hover:border-gold/50 hover:text-gold"
                    >
                      Trade
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mono flex items-center justify-between border-t border-line px-4 py-2 text-[10px] text-dim">
          <span>Crypto · click any column to sort</span>
          <span>{rows.length} assets</span>
        </div>
      </Panel>

      <Panel className="p-4">
        <div className="mono text-[11px] leading-relaxed text-dim">
          <span className="font-bold text-gold">Trade crypto with M-Pesa.</span> Fund your KES wallet via
          Lipa Na M-Pesa, then buy and sell Bitcoin, Ethereum, USDT and more — settled instantly, 24 hours a day,
          7 days a week. Crypto markets never close, unlike the NSE (09:00–15:00 EAT, Mon–Fri).
        </div>
      </Panel>
    </div>
  );
}
