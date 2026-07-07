import Link from "next/link";
import { notFound } from "next/navigation";
import { Panel, Tag, Stat, KeyVal } from "@/components/ui";
import { AreaChart } from "@/components/charts";
import { TradeTicket } from "@/components/trade-ticket";
import { WatchButton } from "@/components/watch-button";
import { SignInToTrade } from "@/components/sign-in-to-trade";
import { num, kes, formatDate } from "@/lib/format";
import { getBondById, getBondQuotes, getWatchlist, ensurePortfolio, getPortfolioCash } from "@/db/queries";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

type Sch = { date: Date; amount: number };

function couponSchedule(valueDate: string | null, maturity: string, coupon: number, freq: number, face: number): Sch[] {
  const out: Sch[] = [];
  if (!valueDate) return out;
  const d = new Date(valueDate);
  const end = new Date(maturity);
  const step = 12 / freq;
  const pay = (face * coupon) / 100 / freq;
  let i = 0;
  while (d < end && i < 24) {
    out.push({ date: new Date(d), amount: pay });
    d.setMonth(d.getMonth() + step);
    i++;
  }
  return out;
}

export default async function BondDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isFinite(numId)) notFound();
  const bond = await getBondById(numId);
  if (!bond) notFound();

  const session = await getSession();
  const [quotes, watchlist, portfolioId] = await Promise.all([
    getBondQuotes(bond.id, 90).catch(() => []),
    getWatchlist().catch(() => []),
    ensurePortfolio(session?.id),
  ]);
  const cashBalance = await getPortfolioCash(portfolioId);
  const watching = watchlist.some((w) => w.securityType === "bond" && w.refId === bond.id);
  const series = quotes.map((q) => ({ date: q.date ?? "", value: q.price ?? 0 }));
  const schedule = couponSchedule(bond.valueDate, bond.maturityDate, bond.couponRate, bond.couponFrequency ?? 2, bond.faceValue ?? 50000);
  const yearsToMaturity = Math.max(
    0,
    (new Date(bond.maturityDate).getTime() - Date.now()) / (365.25 * 24 * 3600 * 1000)
  );

  return (
    <div className="space-y-4">
      <div className="mono flex items-center gap-2 text-[11px] text-dim">
        <Link href="/bonds" className="hover:text-cyan">Treasury Bonds</Link>
        <span>/</span>
        <span className="text-fg">{bond.bondNumber}</span>
      </div>

      <Panel className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="mono text-2xl font-black tracking-tight text-fg">{bond.bondNumber}</h1>
              {bond.isInfrastructure && <Tag tone="green">Tax-Free IFB</Tag>}
              {bond.isGreen && <Tag tone="violet">Green</Tag>}
              {bond.listedOnNse ? <Tag tone="amber">Listed · NSE</Tag> : <Tag>OTC · CBK</Tag>}
            </div>
            <p className="mt-1 text-sm text-muted">{bond.name}</p>
            <p className="mono mt-1 text-[11px] text-dim">
              {bond.tenorYears}-year · coupon {num(bond.couponRate)}% · {bond.couponFrequency ?? 2}x p.a. · matures {formatDate(bond.maturityDate)}
            </p>
          </div>
          <div className="text-right">
            <div className="mono text-[10px] uppercase tracking-wider text-dim">Yield to maturity</div>
            <div className="mono tnum text-3xl font-black text-up">{num(bond.yieldToMaturity)}%</div>
            <div className="mono mt-1 text-[11px] text-muted">clean {num(bond.cleanPrice)} · dirty {num(bond.dirtyPrice)}</div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <WatchButton securityType="bond" refId={bond.id} symbol={bond.bondNumber} name={bond.name ?? bond.bondNumber} watching={watching} />
          <a href="#trade" className="mono inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted transition hover:border-cyan/40 hover:text-cyan">
            Trade Bond ↓
          </a>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Panel title="Clean Price History" subtitle="secondary market · last 90 sessions">
            <div className="p-4">
              {series.length > 1 ? (
                <AreaChart data={series} height={260} color="#34d6e0" />
              ) : (
                <div className="grid h-[260px] place-items-center text-xs text-dim">No secondary trading data yet.</div>
              )}
            </div>
          </Panel>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Coupon Rate" value={num(bond.couponRate) + "%"} />
            <Stat label="Coupon Freq" value={`${bond.couponFrequency ?? 2}x / yr`} />
            <Stat label="Clean Price" value={num(bond.cleanPrice)} />
            <Stat label="Dirty Price" value={num(bond.dirtyPrice)} />
            <Stat label="Accrued Interest" value={num(bond.accruedInterest)} />
            <Stat label="Duration (yrs)" value={num(bond.duration)} />
            <Stat label="Years to Maturity" value={num(yearsToMaturity)} />
            <Stat label="Face Value / Lot" value={kes(bond.faceValue ?? 50000, 0)} />
          </div>

          <Panel title="Key Dates">
            <div className="px-4 py-2">
              <KeyVal k="Auction Date" v={formatDate(bond.auctionDate)} />
              <KeyVal k="Value Date" v={formatDate(bond.valueDate)} />
              <KeyVal k="Maturity Date" v={formatDate(bond.maturityDate)} />
              <KeyVal k="Currency" v={bond.currency || "KES"} />
              <KeyVal k="Coupon Frequency" v={`Semi-annual (${bond.couponFrequency ?? 2})`} />
            </div>
          </Panel>

          <Panel title="Coupon Schedule" subtitle="per KSh 50,000 face-value lot">
            <div className="max-h-[260px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-term-850">
                  <tr className="mono border-b border-line text-[10px] uppercase tracking-wider text-dim">
                    <th className="px-4 py-2 font-semibold">#</th>
                    <th className="px-3 py-2 font-semibold">Payment Date</th>
                    <th className="px-3 py-2 text-right font-semibold">Coupon / Lot</th>
                    <th className="px-3 py-2 text-right font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((c, i) => {
                    const past = c.date.getTime() < Date.now();
                    return (
                      <tr key={i} className="border-b border-line-soft">
                        <td className="mono px-4 py-1.5 text-dim">{i + 1}</td>
                        <td className="mono px-3 py-1.5 text-muted">{formatDate(c.date)}</td>
                        <td className="mono tnum px-3 py-1.5 text-right font-semibold text-up">{kes(c.amount)}</td>
                        <td className="mono px-3 py-1.5 text-right text-[10px] text-dim">{past ? "PAID" : "UPCOMING"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel title="About this issue">
            <p className="px-4 py-3 text-sm leading-relaxed text-muted">{bond.description}</p>
          </Panel>
        </div>

        <div className="space-y-4">
          <div id="trade">
            <Panel title="Trade Bond" subtitle={bond.bondNumber}>
              {portfolioId > 0 ? (
                <div className="p-4">
                  <TradeTicket
                    securityType="bond"
                    refId={bond.id}
                    symbol={bond.bondNumber}
                    name={bond.name ?? bond.bondNumber}
                    price={bond.cleanPrice ?? 100}
                    faceValue={bond.faceValue ?? 50000}
                    portfolioId={portfolioId}
                    cashBalance={cashBalance}
                  />
                </div>
              ) : (
                <SignInToTrade label="trade this bond" />
              )}
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}
