import Link from "next/link";
import { Panel, Tag } from "@/components/ui";
import { StockAvatar } from "@/components/stock-avatar";
import { getEvents } from "@/db/queries";
import { formatDate, classNames } from "@/lib/format";

export const dynamic = "force-dynamic";

const CAT_TONE: Record<string, "amber" | "green" | "red" | "cyan" | "violet"> = {
  "Bond Auction": "cyan",
  Dividend: "green",
  Earnings: "amber",
  Economic: "violet",
  Results: "amber",
  IPO: "green",
};

const IMPACT_DOT: Record<string, string> = {
  high: "bg-down",
  medium: "bg-amber",
  low: "bg-dim",
};

export default async function CalendarPage() {
  const events = await getEvents();
  const todayStr = new Date().toISOString().slice(0, 10);
  const upcoming = events.filter((e) => e.date >= todayStr);
  const past = events.filter((e) => e.date < todayStr).reverse();

  // group upcoming by date
  const grouped = new Map<string, typeof upcoming>();
  for (const e of upcoming) {
    const arr = grouped.get(e.date) ?? [];
    arr.push(e);
    grouped.set(e.date, arr);
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="mono text-lg font-black tracking-tight text-fg">ECONOMIC CALENDAR <span className="text-amber">·</span> MARKET EVENTS</h1>
        <p className="mono text-[11px] text-dim">Bond auctions, dividend dates, earnings & macro releases for the Kenyan market.</p>
      </div>

      {/* Upcoming */}
      <div className="space-y-4">
        {Array.from(grouped.entries()).map(([date, dayEvents]) => {
          const isToday = date === todayStr;
          return (
            <div key={date}>
              <div className="mono mb-2 flex items-center gap-2">
                <span className={classNames("text-sm font-bold", isToday ? "text-up" : "text-fg")}>{formatDate(date)}</span>
                {isToday && <Tag tone="green">TODAY</Tag>}
              </div>
              <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                {dayEvents.map((e) => (
                  <Panel key={e.id} className="flex items-start gap-3 p-3.5 transition hover:border-amber/30">
                    <div className="flex flex-col items-center pt-0.5">
                      <span className={classNames("h-2 w-2 rounded-full", IMPACT_DOT[e.impact ?? "medium"] ?? "bg-dim")} />
                      <span className="mono mt-1 text-[9px] text-dim">{e.time}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-xs font-bold leading-snug text-fg">{e.title}</h3>
                        <Tag tone={CAT_TONE[e.category] ?? "amber"}>{e.category}</Tag>
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-muted">{e.description}</p>
                      <div className="mono mt-2 flex items-center gap-3 text-[10px]">
                        {e.value && <span className="rounded bg-term-800 px-1.5 py-0.5 font-bold text-amber">{e.value}</span>}
                        {e.relatedSymbol && (
                          <Link href={`/stocks/${e.relatedSymbol}`} className="flex items-center gap-1 text-muted hover:text-amber">
                            <StockAvatar symbol={e.relatedSymbol} size={16} />
                            {e.relatedSymbol}
                          </Link>
                        )}
                        {e.region && e.region !== "Kenya" && <span className="text-cyan">{e.region}</span>}
                      </div>
                    </div>
                  </Panel>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Past events */}
      {past.length > 0 && (
        <>
          <div className="mono mt-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-dim">Recent / Past Events</div>
          <Panel>
            {past.map((e) => (
              <div key={e.id} className="flex items-center gap-3 border-b border-line-soft px-4 py-2.5 last:border-0 opacity-70">
                <span className={classNames("h-1.5 w-1.5 shrink-0 rounded-full", IMPACT_DOT[e.impact ?? "medium"] ?? "bg-dim")} />
                <div className="min-w-0 flex-1">
                  <span className="text-xs text-fg">{e.title}</span>
                </div>
                <Tag tone={CAT_TONE[e.category] ?? "amber"}>{e.category}</Tag>
                <span className="mono text-[10px] text-dim">{formatDate(e.date)}</span>
              </div>
            ))}
          </Panel>
        </>
      )}
    </div>
  );
}
