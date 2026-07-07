import Link from "next/link";
import { Panel, ChangePill, Tag } from "@/components/ui";
import { FundAvatar } from "@/components/fund-avatar";
import { num, compact, money, classNames } from "@/lib/format";
import { getAllFunds } from "@/db/queries";

export const dynamic = "force-dynamic";

const TYPE_TONE: Record<string, "cyan" | "violet" | "green" | "amber"> = {
  ETF: "cyan",
  REIT: "violet",
  "D-REIT": "violet",
  MMF: "green",
  Fund: "amber",
};

export default async function FundsPage() {
  const funds = await getAllFunds();
  const types = Array.from(new Set(funds.map((f) => f.type)));
  const totalAum = funds.reduce((a, f) => a + (f.aum ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="mono text-lg font-black tracking-tight text-fg">
            FUNDS <span className="text-amber">·</span> ETF · REIT · MONEY MARKET
          </h1>
          <p className="mono text-[11px] text-dim">
            {funds.length} funds · collective investment vehicles, tradeable with M-Pesa.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="rounded-md border border-line bg-term-850 px-3 py-2">
            <div className="mono text-[10px] uppercase text-dim">Total AUM</div>
            <div className="mono tnum text-base font-bold text-fg">{money(totalAum)}</div>
          </div>
          <div className="rounded-md border border-line bg-term-850 px-3 py-2">
            <div className="mono text-[10px] uppercase text-dim">Types</div>
            <div className="mono text-base font-bold text-fg">{types.length}</div>
          </div>
        </div>
      </div>

      {/* type legend */}
      <div className="flex flex-wrap gap-1.5">
        {types.map((t) => (
          <span key={t} className="mono rounded-full border border-line px-2.5 py-1 text-[10px] text-muted">
            {t}
          </span>
        ))}
      </div>

      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left">
            <thead>
              <tr className="mono border-b border-line text-[10px] uppercase tracking-wider text-dim">
                <th className="px-4 py-2.5 font-semibold">Fund</th>
                <th className="px-3 py-2.5 font-semibold">Type</th>
                <th className="px-3 py-2.5 text-right font-semibold">NAV (KSh)</th>
                <th className="px-3 py-2.5 text-right font-semibold">Chg %</th>
                <th className="px-3 py-2.5 text-right font-semibold">AUM</th>
                <th className="px-3 py-2.5 text-right font-semibold">Expense</th>
                <th className="px-3 py-2.5 text-right font-semibold">YTD</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {funds.map((f) => (
                <tr key={f.id} className="border-b border-line-soft transition hover:bg-term-800/40">
                  <td className="px-4 py-2.5">
                    <Link href={`/funds/${f.symbol}`} className="group flex items-center gap-2.5">
                      <FundAvatar type={f.type} size={30} />
                      <div>
                        <div className="mono text-sm font-bold text-fg group-hover:text-amber">{f.symbol}</div>
                        <div className="max-w-[200px] truncate text-[10px] text-dim">{f.name}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-3 py-2.5"><Tag tone={TYPE_TONE[f.type] ?? "amber"}>{f.type}</Tag></td>
                  <td className="mono tnum px-3 py-2.5 text-right font-semibold">{num(f.price)}</td>
                  <td className="px-3 py-2.5 text-right"><ChangePill value={f.changePct} showArrow={false} /></td>
                  <td className="mono tnum px-3 py-2.5 text-right text-muted">{compact(f.aum)}</td>
                  <td className="mono tnum px-3 py-2.5 text-right text-muted">{(f.expenseRatio ?? 0) > 0 ? num(f.expenseRatio) + "%" : "—"}</td>
                  <td className={classNames("mono tnum px-3 py-2.5 text-right font-semibold", (f.ytdReturn ?? 0) >= 0 ? "text-up" : "text-down")}>
                    {(f.ytdReturn ?? 0) >= 0 ? "+" : ""}{num(f.ytdReturn)}%
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Link href={`/funds/${f.symbol}`} className="mono rounded border border-line px-2 py-1 text-[10px] text-muted transition hover:border-amber/50 hover:text-amber">
                      Trade
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel className="p-4">
        <div className="mono text-[11px] leading-relaxed text-dim">
          <span className="font-bold text-cyan">ETFs</span> track an index in a single trade.{" "}
          <span className="font-bold text-violet">REITs</span> give you income from real estate without buying property.{" "}
          <span className="font-bold text-up">Money Market Funds</span> are low-risk, high-liquidity savings vehicles paying daily interest.
          All are tradeable here with M-Pesa.
        </div>
      </Panel>
    </div>
  );
}
