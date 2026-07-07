import Link from "next/link";
import { Panel, Tag } from "@/components/ui";
import { StockAvatar } from "@/components/stock-avatar";
import { getIpos } from "@/db/queries";
import { formatDate, compact, classNames } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, "amber" | "green" | "red" | "cyan" | "violet"> = {
  upcoming: "amber",
  open: "green",
  closed: "cyan",
  listed: "violet",
};

const TYPE_TONE: Record<string, "amber" | "green" | "cyan" | "violet"> = {
  IPO: "green",
  "Rights Issue": "amber",
  "Bonus Issue": "violet",
  "Offer for Sale": "cyan",
  "Cross-Listing": "amber",
};

export default async function IposPage() {
  const ipos = await getIpos();
  const open = ipos.filter((i) => i.status === "open");
  const upcoming = ipos.filter((i) => i.status === "upcoming");
  const past = ipos.filter((i) => i.status === "closed" || i.status === "listed");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="mono text-lg font-black tracking-tight text-fg">
          IPOs &amp; NEW LISTINGS <span className="text-amber">·</span> NSE
        </h1>
        <p className="mono text-[11px] text-dim">
          Upcoming initial public offerings, rights issues and bonus issues on the Nairobi Securities Exchange.
        </p>
      </div>

      {/* Open now */}
      {open.length > 0 && (
        <div>
          <h2 className="mono mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-up">
            <span className="inline-block h-2 w-2 animate-pulse-dot rounded-full bg-up" />
            Open Now — Accepting Applications
          </h2>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {open.map((ipo) => <IpoCard key={ipo.id} ipo={ipo} highlight />)}
          </div>
        </div>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div>
          <h2 className="mono mb-2 text-[11px] font-bold uppercase tracking-wider text-amber">Upcoming Offerings</h2>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {upcoming.map((ipo) => <IpoCard key={ipo.id} ipo={ipo} />)}
          </div>
        </div>
      )}

      {/* Recent */}
      {past.length > 0 && (
        <div>
          <h2 className="mono mb-2 text-[11px] font-bold uppercase tracking-wider text-dim">Recently Listed &amp; Closed</h2>
          <Panel>
            {past.map((ipo) => (
              <div key={ipo.id} className="flex items-center gap-3 border-b border-line-soft px-4 py-3 last:border-0">
                <StockAvatar symbol={ipo.symbol} size={32} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="mono text-sm font-bold text-fg">{ipo.symbol}</span>
                    <Tag tone={TYPE_TONE[ipo.type] ?? "amber"}>{ipo.type}</Tag>
                    <Tag tone={STATUS_TONE[ipo.status] ?? "amber"}>{ipo.status}</Tag>
                  </div>
                  <div className="truncate text-[11px] text-muted">{ipo.name}</div>
                </div>
                <div className="text-right">
                  {(ipo.priceLow ?? 0) > 0 && (
                    <div className="mono tnum text-xs text-fg">
                      KSh {ipo.priceLow?.toFixed(2)}{ipo.priceHigh !== ipo.priceLow ? `–${ipo.priceHigh?.toFixed(2)}` : ""}
                    </div>
                  )}
                  {ipo.listingDate && <div className="mono text-[9px] text-dim">listed {formatDate(ipo.listingDate)}</div>}
                </div>
              </div>
            ))}
          </Panel>
        </div>
      )}
    </div>
  );
}

function IpoCard({
  ipo,
  highlight = false,
}: {
  ipo: Awaited<ReturnType<typeof getIpos>>[number];
  highlight?: boolean;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const daysToClose = ipo.closeDate ? Math.ceil((new Date(ipo.closeDate).getTime() - new Date(today).getTime()) / 86400000) : null;
  return (
    <Panel className={classNames("p-4 transition hover:border-amber/30", highlight && "border-up/30")}>
      <div className="flex items-start gap-3">
        <StockAvatar symbol={ipo.symbol} size={44} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="mono text-sm font-black text-fg">{ipo.symbol}</h3>
            <Tag tone={TYPE_TONE[ipo.type] ?? "amber"}>{ipo.type}</Tag>
            <Tag tone={STATUS_TONE[ipo.status] ?? "amber"}>{ipo.status}</Tag>
            <span className="mono rounded bg-term-800 px-1.5 py-0.5 text-[9px] text-dim">{ipo.exchange} · {ipo.sector}</span>
          </div>
          <p className="mt-1 text-sm font-semibold text-fg">{ipo.name}</p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted">{ipo.description}</p>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(ipo.priceLow ?? 0) > 0 && (
              <div className="rounded-md border border-line-soft bg-term-850/60 px-2.5 py-1.5">
                <div className="mono text-[9px] text-dim">Price Band</div>
                <div className="mono tnum text-xs font-bold text-fg">
                  {ipo.priceLow?.toFixed(2)}{ipo.priceHigh !== ipo.priceLow ? `–${ipo.priceHigh?.toFixed(2)}` : ""}
                </div>
              </div>
            )}
            <div className="rounded-md border border-line-soft bg-term-850/60 px-2.5 py-1.5">
              <div className="mono text-[9px] text-dim">Shares</div>
              <div className="mono tnum text-xs font-bold text-fg">{compact(ipo.sharesOffered)}</div>
            </div>
            <div className="rounded-md border border-line-soft bg-term-850/60 px-2.5 py-1.5">
              <div className="mono text-[9px] text-dim">Target Raise</div>
              <div className="mono tnum text-xs font-bold text-fg">KSh {compact(ipo.amountRaised ?? 0)}</div>
            </div>
            {(ipo.subscriptionPct ?? 0) > 0 && (
              <div className="rounded-md border border-line-soft bg-term-850/60 px-2.5 py-1.5">
                <div className="mono text-[9px] text-dim">Subscription</div>
                <div className="mono tnum text-xs font-bold text-up">{ipo.subscriptionPct}%</div>
              </div>
            )}
          </div>

          <div className="mono mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-dim">
            {ipo.openDate && <span>Opens: {formatDate(ipo.openDate)}</span>}
            {ipo.closeDate && <span>Closes: {formatDate(ipo.closeDate)}</span>}
            {daysToClose != null && daysToClose >= 0 && (
              <span className={classNames("font-bold", daysToClose <= 3 ? "text-down" : "text-amber")}>
                {daysToClose} day{daysToClose === 1 ? "" : "s"} to close
              </span>
            )}
          </div>

          {highlight && (
            <Link
              href="/portfolio"
              className="mono mt-3 inline-block rounded-md bg-up px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-term-950 transition hover:brightness-110"
            >
              Apply via M-Pesa →
            </Link>
          )}
        </div>
      </div>
    </Panel>
  );
}
