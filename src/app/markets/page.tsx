import { Panel, ChangePill, Tag } from "@/components/ui";
import { StockAvatar } from "@/components/stock-avatar";
import { SentimentGauge } from "@/components/sentiment-gauge";
import { num, compact, money, classNames } from "@/lib/format";
import { getAllStocks, computeStats, sectorSummary } from "@/db/queries";
import { buildSentiment } from "@/lib/sentiment";

export const dynamic = "force-dynamic";

function heatColor(pct: number) {
  const a = Math.min(0.75, Math.abs(pct) / 4 + 0.12);
  return pct >= 0 ? `rgba(31,213,133,${a})` : `rgba(255,83,100,${a})`;
}

export default async function MarketsPage() {
  const all = (await getAllStocks().catch(() => [])) ?? [];
  const stats = computeStats(all);
  const sectors = sectorSummary(all);
  const breadth = stats.advancers + stats.decliners || 1;
  const mktAvgChange = all.reduce((a, s) => a + (s.changePct ?? 0), 0) / (all.length || 1);
  const sentiment = buildSentiment({
    advancers: stats.advancers,
    decliners: stats.decliners,
    nasiChange: mktAvgChange,
    topMoverPct: stats.gainers[0]?.changePct ?? 0,
    volumeSpike: 65,
  });

  const MoverTable = ({ title, rows, tone }: { title: string; rows: typeof all; tone: "green" | "red" }) => (
    <Panel title={title} right={<Tag tone={tone}>{tone === "green" ? "▲" : "▼"}</Tag>}>
      <table className="w-full text-left text-xs">
        <tbody>
          {rows.slice(0, 12).map((s) => (
            <tr key={s.id} className="border-b border-line-soft last:border-0">
              <td className="px-4 py-2">
                <div className="flex items-center gap-2">
                  <StockAvatar symbol={s.symbol} sector={s.sector} size={26} />
                  <div>
                    <div className="mono text-xs font-bold text-fg">{s.symbol}</div>
                    <div className="max-w-[140px] truncate text-[10px] text-dim">{s.sector}</div>
                  </div>
                </div>
              </td>
              <td className="mono tnum px-3 py-2 text-right font-semibold">{num(s.price)}</td>
              <td className="px-4 py-2 text-right">
                <ChangePill value={s.changePct} showArrow={false} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="mono text-lg font-black tracking-tight text-fg">MARKETS <span className="text-amber">·</span> OVERVIEW</h1>
        <p className="mono text-[11px] text-dim">Sector heat map, breadth and full market movers across the NSE.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Panel className="p-3">
          <div className="mono text-[10px] uppercase text-dim">Total Cap</div>
          <div className="mono tnum mt-1 text-lg font-bold text-fg">{money(stats.marketCap)}</div>
        </Panel>
        <Panel className="p-3">
          <div className="mono text-[10px] uppercase text-dim">Turnover</div>
          <div className="mono tnum mt-1 text-lg font-bold text-fg">{money(stats.turnover)}</div>
        </Panel>
        <Panel className="p-3">
          <div className="mono text-[10px] uppercase text-dim">Volume</div>
          <div className="mono tnum mt-1 text-lg font-bold text-fg">{compact(stats.volume)}</div>
        </Panel>
        <Panel className="p-3">
          <div className="mono text-[10px] uppercase text-up">Advancers</div>
          <div className="mono tnum mt-1 text-lg font-bold text-up">{stats.advancers}</div>
        </Panel>
        <Panel className="p-3">
          <div className="mono text-[10px] uppercase text-down">Decliners</div>
          <div className="mono tnum mt-1 text-lg font-bold text-down">{stats.decliners}</div>
        </Panel>
      </div>

      {/* Sentiment */}
      <Panel title="Market Sentiment" subtitle="fear & greed index">
        <SentimentGauge data={sentiment} />
      </Panel>

      {/* Heatmap */}
      <Panel title="Sector Heat Map" subtitle="tile size ∝ market cap · colour ∼ weighted daily move">
        <div className="flex flex-wrap gap-1.5 p-4">
          {sectors.map((sec) => (
            <div
              key={sec.sector}
              className="rounded-md border border-line-soft p-3"
              style={{
                background: heatColor(sec.weightedChange),
                flexGrow: Math.max(1, Math.round(Math.log10(Math.max(10, sec.marketCap)))),
                flexBasis: 130,
                minWidth: 130,
              }}
            >
              <div className="mono text-[11px] font-bold uppercase tracking-wide text-white/90">{sec.sector}</div>
              <div className="mono tnum text-lg font-black text-white">
                {sec.weightedChange >= 0 ? "+" : ""}
                {sec.weightedChange.toFixed(2)}%
              </div>
              <div className="mono text-[10px] text-white/70">{sec.count} · {money(sec.marketCap)}</div>
            </div>
          ))}
        </div>
      </Panel>

      {/* Movers */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <MoverTable title="Top Gainers" rows={stats.gainers} tone="green" />
        <MoverTable title="Top Decliners" rows={stats.losers} tone="red" />
      </div>

      {/* Sector table */}
      <Panel title="Sector Performance">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="mono border-b border-line text-[10px] uppercase tracking-wider text-dim">
                <th className="px-4 py-2.5 font-semibold">Sector</th>
                <th className="px-3 py-2.5 text-right font-semibold">Stocks</th>
                <th className="px-3 py-2.5 text-right font-semibold">Market Cap</th>
                <th className="px-3 py-2.5 text-right font-semibold">Avg Move</th>
                <th className="px-4 py-2.5 text-right font-semibold">Weighted Move</th>
              </tr>
            </thead>
            <tbody>
              {sectors.map((s) => (
                <tr key={s.sector} className="border-b border-line-soft">
                  <td className="px-4 py-2.5 font-semibold text-fg">{s.sector}</td>
                  <td className="mono tnum px-3 py-2.5 text-right text-muted">{s.count}</td>
                  <td className="mono tnum px-3 py-2.5 text-right text-muted">{money(s.marketCap)}</td>
                  <td className="px-3 py-2.5 text-right">
                    <ChangePill value={s.avgChange} showArrow={false} />
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span
                      className={classNames(
                        "mono tnum font-bold",
                        s.weightedChange >= 0 ? "text-up" : "text-down"
                      )}
                    >
                      {s.weightedChange >= 0 ? "+" : ""}
                      {s.weightedChange.toFixed(2)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
