import { Panel, ChangePill, Delta, Stat } from "@/components/ui";
import { AreaChart } from "@/components/charts";
import { num, formatDate, money } from "@/lib/format";
import { getIndices, getIndexQuotes } from "@/db/queries";

export const dynamic = "force-dynamic";

export default async function IndicesPage() {
  const indices = (await getIndices().catch(() => [])) ?? [];
  const quotes = await Promise.all(indices.map((i) => getIndexQuotes(i.id, 120).catch(() => [])));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="mono text-lg font-black tracking-tight text-fg">MARKET INDICES <span className="text-amber">·</span> NSE</h1>
        <p className="mono text-[11px] text-dim">Capitalisation-weighted benchmarks tracking the Nairobi Securities Exchange.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {indices.map((ix, i) => {
          const series = quotes[i].map((q) => ({ date: q.date, value: q.close }));
          const up = (ix.change ?? 0) >= 0;
          return (
            <Panel
              key={ix.id}
              id={ix.symbol}
              title={ix.symbol}
              subtitle={ix.name}
              right={<ChangePill value={ix.changePct} />}
            >
              <div className="flex flex-wrap items-end justify-between gap-3 p-4">
                <div>
                  <div className="mono tnum text-3xl font-black text-fg">{num(ix.value)}</div>
                  <div className="mt-1">
                    <Delta value={ix.change} />
                  </div>
                </div>
                <div className="text-right text-[11px] text-dim">
                  <div>52W High <span className="mono tnum text-up">{num(ix.yearHigh)}</span></div>
                  <div>52W Low <span className="mono tnum text-down">{num(ix.yearLow)}</span></div>
                </div>
              </div>
              <div className="px-2 pb-3">
                <AreaChart data={series} height={200} color={up ? "#1fd585" : "#ff5364"} />
              </div>
              <p className="border-t border-line-soft px-4 py-2 text-[11px] text-muted">{ix.description}</p>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
