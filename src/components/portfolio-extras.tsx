"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Panel, Tag } from "@/components/ui";
import { kes, num, pct, signed, classNames } from "@/lib/format";
import { withdrawToMpesa } from "@/app/mpesa-actions";
import type { PortfolioDetail } from "@/db/queries";
import type { Transaction } from "@/db/schema";

function csvEscape(v: unknown): string {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function download(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function PortfolioExtras({
  detail,
  transactions,
  portfolioId,
}: {
  detail: PortfolioDetail;
  transactions: Transaction[];
  portfolioId: number;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [phone, setPhone] = useState("");
  const [amt, setAmt] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const exportHoldings = () => {
    const head = ["Symbol", "Type", "Name", "Quantity", "Avg Cost", "Last Price", "Market Value", "Cost", "P&L", "P&L %"];
    const rows = detail.items.map((h) => [
      h.symbol, h.securityType, h.name, h.quantity, h.avgCost.toFixed(4),
      h.currentPrice.toFixed(4), h.marketValue.toFixed(2), h.cost.toFixed(2),
      h.pnl.toFixed(2), h.pnlPct.toFixed(2) + "%",
    ]);
    const csv = [head, ...rows].map((r) => r.map(csvEscape).join(",")).join("\n");
    download("soko-holdings.csv", csv);
  };

  const exportTransactions = () => {
    const head = ["Date", "Action", "Symbol", "Type", "Quantity", "Price", "Fees", "Notional"];
    const rows = transactions.map((t) => [
      (t.date ? new Date(t.date).toLocaleString("en-KE") : "—"), t.action, t.symbol, t.securityType,
      t.quantity, t.price.toFixed(4), (t.fees ?? 0).toFixed(2), (t.quantity * t.price).toFixed(2),
    ]);
    const csv = [head, ...rows].map((r) => r.map(csvEscape).join(",")).join("\n");
    download("soko-transactions.csv", csv);
  };

  const withdraw = (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    start(async () => {
      const res = await withdrawToMpesa({
        portfolioId,
        phone,
        amount: Number(amt),
      });
      if (res.ok) {
        setMsg({ ok: true, text: res.customerMessage || "Withdrawal sent." });
        setAmt("");
        router.refresh();
      } else setMsg({ ok: false, text: res.error || "Withdrawal failed." });
    });
  };

  const taxShield = detail.capitalGainsTax > 0;
  const hasIFB = detail.items.some((i) => i.isTaxFree);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Tax-aware returns */}
      <Panel className="lg:col-span-2" title="Tax & Returns" subtitle="Kenya · 15% capital gains + 15% dividend withholding">
        <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3">
          <div className="rounded-md border border-line-soft bg-term-850/60 px-3 py-2.5">
            <div className="mono text-[10px] uppercase tracking-wider text-dim">Gross P&L</div>
            <div className={classNames("mono tnum text-lg font-bold", detail.pnl >= 0 ? "text-up" : "text-down")}>{signed(detail.pnl)}</div>
          </div>
          <div className="rounded-md border border-down/20 bg-down/5 px-3 py-2.5">
            <div className="mono text-[10px] uppercase tracking-wider text-dim">Capital Gains Tax</div>
            <div className="mono tnum text-lg font-bold text-down">{kes(detail.capitalGainsTax)}</div>
            <div className="mono text-[9px] text-dim">15% on gains</div>
          </div>
          <div className="rounded-md border border-up/20 bg-up/5 px-3 py-2.5">
            <div className="mono text-[10px] uppercase tracking-wider text-up">Net P&L (after tax)</div>
            <div className={classNames("mono tnum text-lg font-bold", detail.netPnlAfterTax >= 0 ? "text-up" : "text-down")}>{signed(detail.netPnlAfterTax)}</div>
            <div className="mono text-[9px] text-dim">{pct(detail.netPnlPctAfterTax)}</div>
          </div>
        </div>

        {/* Dividend income */}
        <div className="border-t border-line p-4">
          <div className="mono mb-2 text-[10px] font-semibold uppercase tracking-wider text-dim">Projected Annual Dividend Income</div>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <div className="mono tnum text-2xl font-black text-up">{kes(detail.projectedDividendIncome)}</div>
              <div className="mono text-[10px] text-dim">gross dividends</div>
            </div>
            <div>
              <div className="mono tnum text-lg font-bold text-down">{kes(detail.dividendWithholdingTax)}</div>
              <div className="mono text-[10px] text-dim">− 15% withholding</div>
            </div>
            <div>
              <div className="mono tnum text-xl font-bold text-fg">{kes(detail.netDividendIncome)}</div>
              <div className="mono text-[10px] text-dim">net income (cash)</div>
            </div>
          </div>
          {detail.items.filter((i) => (i.dividendYield ?? 0) > 0).length > 0 && (
            <div className="mt-3 space-y-1">
              {detail.items
                .filter((i) => (i.dividendYield ?? 0) > 0)
                .sort((a, b) => (b.dividendYield ?? 0) - (a.dividendYield ?? 0))
                .slice(0, 5)
                .map((i) => (
                  <div key={i.id} className="mono flex items-center justify-between text-[11px]">
                    <span className="text-muted">{i.symbol} <span className="text-dim">@ {(i.dividendYield ?? 0).toFixed(2)}%</span></span>
                    <span className="tnum text-up">{kes(i.marketValue * ((i.dividendYield ?? 0) / 100))}</span>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-line px-4 py-3">
          {taxShield && <Tag tone="amber">🛡 15% CGT applied</Tag>}
          {hasIFB && <Tag tone="green">IFB coupon tax-free</Tag>}
          {detail.items.some((i) => i.securityType === "crypto") && <Tag tone="violet">Crypto: CGT on disposal</Tag>}
        </div>
      </Panel>

      {/* Export + Withdraw */}
      <div className="space-y-4">
        <Panel title="Export" subtitle="download your data">
          <div className="space-y-2 p-4">
            <button onClick={exportHoldings} className="mono flex w-full items-center justify-between rounded-md border border-line px-3 py-2.5 text-xs font-semibold text-muted transition hover:border-amber/40 hover:text-amber">
              <span> Holdings (CSV)</span>
              <span className="text-dim">↓</span>
            </button>
            <button onClick={exportTransactions} className="mono flex w-full items-center justify-between rounded-md border border-line px-3 py-2.5 text-xs font-semibold text-muted transition hover:border-amber/40 hover:text-amber">
              <span> Transactions (CSV)</span>
              <span className="text-dim">↓</span>
            </button>
          </div>
        </Panel>

        <Panel title="Withdraw to M-Pesa" subtitle="send balance to your phone">
          <form onSubmit={withdraw} className="space-y-3 p-4">
            <div className="flex items-center justify-between rounded-md border border-up/30 bg-up/5 px-3 py-2">
              <span className="mono text-[10px] uppercase tracking-wider text-dim">Available</span>
              <span className="mono tnum text-sm font-bold text-up">{kes(detail.cashBalance)}</span>
            </div>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              placeholder="0712 345 678"
              className="mono w-full rounded-md border border-line bg-term-900 px-3 py-2 text-sm text-fg outline-none focus:border-up"
            />
            <input
              value={amt}
              onChange={(e) => setAmt(e.target.value)}
              type="number"
              min="1"
              placeholder="Amount (KSh)"
              className="mono tnum w-full rounded-md border border-line bg-term-900 px-3 py-2 text-sm text-fg outline-none focus:border-up"
            />
            {msg && (
              <div className={classNames("mono rounded-md border px-3 py-2 text-xs", msg.ok ? "border-up/40 bg-up/5 text-up" : "border-down/40 bg-down/5 text-down")}>
                {msg.text}
              </div>
            )}
            <button type="submit" disabled={pending} className="mono w-full rounded-md bg-ke-green py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:brightness-110 disabled:opacity-50">
              {pending ? "Sending…" : "Withdraw →"}
            </button>
          </form>
        </Panel>
      </div>
    </div>
  );
}
