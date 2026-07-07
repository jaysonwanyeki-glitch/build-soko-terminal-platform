import Link from "next/link";
import { Panel, Tag } from "@/components/ui";
import { ScatterLine } from "@/components/charts";
import { num, formatDate, classNames } from "@/lib/format";
import { getBonds, getYieldCurve } from "@/db/queries";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Treasury Bonds — Yield Curve & Bond Screener",
  description: "Explore Kenyan treasury bonds, infrastructure bonds (IFB) and the sovereign yield curve. Tax-free coupons.",
};

export default async function BondsPage() {
  const [bonds, curve] = await Promise.all([getBonds(), getYieldCurve()]);
  const points = curve.map((c) => ({ x: c.tenorYears, y: c.yield ?? 0, color: c.isInfrastructure ? "#1fd585" : "#34d6e0" }));
  const tenors = Array.from(new Set(curve.map((c) => c.tenorYears))).sort((a, b) => a - b);
  const xLabels = tenors.map((t) => ({ x: t, label: `${t}Y` }));
  const avgYield = bonds.reduce((a, b) => a + (b.yieldToMaturity ?? 0), 0) / (bonds.length || 1);
  const infraCount = bonds.filter((b) => b.isInfrastructure).length;
  const listedCount = bonds.filter((b) => b.listedOnNse).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="mono text-lg font-black tracking-tight text-fg">TREASURY BONDS <span className="text-amber">·</span> GOVT OF KENYA</h1>
          <p className="mono text-[11px] text-dim">{bonds.length} issues · issued by Central Bank of Kenya · settled via DVP/CDSC</p>
        </div>
        <div className="flex gap-2">
          <div className="rounded-md border border-line bg-term-850 px-3 py-2">
            <div className="mono text-[10px] uppercase text-dim">Avg Yield</div>
            <div className="mono tnum text-base font-bold text-up">{num(avgYield)}%</div>
          </div>
          <div className="rounded-md border border-line bg-term-850 px-3 py-2">
            <div className="mono text-[10px] uppercase text-dim">Infrastructure</div>
            <div className="mono tnum text-base font-bold text-fg">{infraCount}</div>
          </div>
          <div className="rounded-md border border-line bg-term-850 px-3 py-2">
            <div className="mono text-[10px] uppercase text-dim">NSE-listed</div>
            <div className="mono tnum text-base font-bold text-fg">{listedCount}</div>
          </div>
        </div>
      </div>

      <Panel title="Sovereign Yield Curve" subtitle="yield to maturity by tenor · green = tax-free infrastructure bonds">
        <div className="p-4">
          <ScatterLine points={points} height={260} color="#34d6e0" xLabels={xLabels} />
        </div>
      </Panel>

      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="mono border-b border-line text-[10px] uppercase tracking-wider text-dim">
                <th className="px-4 py-2.5 font-semibold">Bond</th>
                <th className="px-3 py-2.5 text-right font-semibold">Tenor</th>
                <th className="px-3 py-2.5 text-right font-semibold">Coupon</th>
                <th className="px-3 py-2.5 text-right font-semibold">Maturity</th>
                <th className="px-3 py-2.5 text-right font-semibold">Clean</th>
                <th className="px-3 py-2.5 text-right font-semibold">YTM</th>
                <th className="px-3 py-2.5 text-right font-semibold">Duration</th>
                <th className="px-3 py-2.5 font-semibold">Type</th>
              </tr>
            </thead>
            <tbody>
              {bonds.map((b) => (
                <tr key={b.id} className="border-b border-line-soft transition hover:bg-term-800/40">
                  <td className="px-4 py-2.5">
                    <Link href={`/bonds/${b.id}`} className="group">
                      <div className="mono text-sm font-bold text-fg group-hover:text-cyan">{b.bondNumber}</div>
                      <div className="max-w-[200px] truncate text-[10px] text-dim">{b.name}</div>
                    </Link>
                  </td>
                  <td className="mono tnum px-3 py-2.5 text-right">{b.tenorYears}Y</td>
                  <td className="mono tnum px-3 py-2.5 text-right font-semibold">{num(b.couponRate)}%</td>
                  <td className="mono px-3 py-2.5 text-right text-muted">{formatDate(b.maturityDate)}</td>
                  <td className="mono tnum px-3 py-2.5 text-right">{num(b.cleanPrice)}</td>
                  <td className="mono tnum px-3 py-2.5 text-right font-semibold text-up">{num(b.yieldToMaturity)}%</td>
                  <td className="mono tnum px-3 py-2.5 text-right text-muted">{num(b.duration)}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {b.isInfrastructure && <Tag tone="green">IFB</Tag>}
                      {b.isGreen && <Tag tone="violet">GREEN</Tag>}
                      {b.listedOnNse ? <Tag tone="amber">NSE</Tag> : <Tag>OTC</Tag>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel className="p-4">
        <div className="mono text-[11px] text-dim">
          <span className="font-bold text-fg">Note:</span> Fixed coupon (FXD) bonds pay taxable semi-annual interest. Infrastructure bonds (IFB) are{" "}
          <span className="text-up">tax-exempt</span> on coupon income. Minimum investment KSh 50,000 face value per lot, in multiples of KSh 50,000.
        </div>
      </Panel>
    </div>
  );
}
