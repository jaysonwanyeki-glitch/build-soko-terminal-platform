"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DonutChart } from "@/components/charts";
import { Panel, Tag, ChangePill, Delta } from "@/components/ui";
import { StockAvatar } from "@/components/stock-avatar";
import { CryptoAvatar } from "@/components/crypto-avatar";
import { FundAvatar } from "@/components/fund-avatar";
import { kes, compact, signed, formatDate, classNames } from "@/lib/format";
import { executeTrade, createPortfolio, deleteHolding } from "@/app/actions";
import type { PortfolioDetail } from "@/db/queries";
import type { Transaction } from "@/db/schema";

const PALETTE = ["#00e676", "#4ee8b0", "#7dffba", "#34e0a0", "#5fdaa0", "#00c853", "#00b865", "#225540"];

type SecOpt = { id: number; symbol: string; name: string; price: number };
type BondOpt = { id: number; bondNumber: string; name: string; cleanPrice: number };
type CryptoOpt = { id: number; symbol: string; name: string; price: number };
type FundOpt = { id: number; symbol: string; name: string; price: number };

export function PortfolioManager({
  portfolios,
  activeId,
  detail,
  transactions,
  stocks,
  bonds,
  cryptos,
  funds,
}: {
  portfolios: { id: number; name: string }[];
  activeId: number;
  detail: PortfolioDetail;
  transactions: Transaction[];
  stocks: SecOpt[];
  bonds: BondOpt[];
  cryptos: CryptoOpt[];
  funds: FundOpt[];
}) {
  const router = useRouter();
  const [type, setType] = useState<"stock" | "bond" | "crypto" | "fund">("stock");
  const [sel, setSel] = useState<string>("");
  const [action, setAction] = useState<"buy" | "sell">("buy");
  const [qty, setQty] = useState("");
  const [px, setPx] = useState("");
  const [fees, setFees] = useState("");
  const [date, setDate] = useState("");
  const [formMsg, setFormMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [newName, setNewName] = useState("");
  const [pending, start] = useTransition();

  const secList = type === "stock" ? stocks : type === "bond" ? bonds : type === "crypto" ? cryptos : funds;

  const onPick = (id: string) => {
    setSel(id);
    const found = secList.find((s) => String(s.id) === id);
    if (!found) return;
    const p =
      type === "stock"
        ? (found as SecOpt).price
        : type === "bond"
        ? (found as BondOpt).cleanPrice
        : type === "crypto"
        ? (found as CryptoOpt).price
        : (found as FundOpt).price;
    setPx(String(p.toFixed(2)));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg(null);
    if (!sel) {
      setFormMsg({ ok: false, text: "Select a security first." });
      return;
    }
    start(async () => {
      const picked = secList.find((s) => String(s.id) === sel);
      if (!picked) return;
      const symbol =
        type === "stock"
          ? (picked as SecOpt).symbol
          : type === "bond"
          ? (picked as BondOpt).bondNumber
          : type === "crypto"
          ? (picked as CryptoOpt).symbol
          : (picked as FundOpt).symbol;
      const res = await executeTrade({
        portfolioId: activeId,
        securityType: type,
        refId: Number(sel),
        symbol,
        name: picked.name,
        action,
        quantity: Number(qty),
        price: Number(px),
        fees: Number(fees || 0),
      });
      if (res.ok) {
        setFormMsg({ ok: true, text: `Filled via M-Pesa · wallet now ${kes(res.balance ?? 0)}.` });
        setQty("");
        router.refresh();
      } else setFormMsg({ ok: false, text: res.error || "Failed." });
    });
  };

  const createNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    start(async () => {
      await createPortfolio(newName.trim());
      setNewName("");
      router.refresh();
    });
  };

  // allocation data
  const byHolding = [...detail.items]
    .sort((a, b) => b.marketValue - a.marketValue)
    .slice(0, 6)
    .map((h, i) => ({ label: h.symbol, value: h.marketValue, color: PALETTE[i % PALETTE.length] }));
  const otherVal = detail.items.slice(6).reduce((a, b) => a + b.marketValue, 0);
  if (otherVal > 0) byHolding.push({ label: "Other", value: otherVal, color: "#5a6678" });

  const sectorMap = new Map<string, number>();
  for (const h of detail.items) sectorMap.set(h.sector, (sectorMap.get(h.sector) ?? 0) + h.marketValue);
  const bySector = [...sectorMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, value], i) => ({ label, value, color: PALETTE[i % PALETTE.length] }));

  const pnlUp = detail.pnl >= 0;

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <Panel className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <select
              value={activeId}
              onChange={(e) => router.push(`/portfolio?p=${e.target.value}`)}
              className="mono rounded-md border border-line bg-term-900 px-3 py-2 text-sm font-semibold text-fg outline-none focus:border-amber/50"
            >
              {portfolios.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <Tag tone="amber">{detail.items.length} positions</Tag>
          </div>
          <form onSubmit={createNew} className="flex items-center gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New portfolio…"
              className="mono w-40 rounded-md border border-line bg-term-900 px-3 py-2 text-xs text-fg outline-none focus:border-amber/50"
            />
            <button
              type="submit"
              disabled={pending}
              className="mono rounded-md border border-line px-3 py-2 text-xs font-semibold text-muted transition hover:border-amber/40 hover:text-amber disabled:opacity-50"
            >
              + New
            </button>
          </form>
        </div>
      </Panel>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Panel className="p-4">
          <div className="mono text-[10px] uppercase tracking-wider text-dim">Total market value</div>
          <div className="mono tnum mt-1.5 text-2xl font-bold text-fg">{kes(detail.totalValue)}</div>
        </Panel>
        <Panel className="p-4">
          <div className="mono text-[10px] uppercase tracking-wider text-up">M-Pesa cash</div>
          <div className="mono tnum mt-1.5 text-2xl font-bold text-up">{kes(detail.cashBalance)}</div>
          <div className="mt-0.5 text-[11px] text-dim">available to trade</div>
        </Panel>
        <Panel className="p-4">
          <div className="mono text-[10px] uppercase tracking-wider text-dim">Cost basis</div>
          <div className="mono tnum mt-1.5 text-2xl font-bold text-fg">{kes(detail.totalCost)}</div>
        </Panel>
        <Panel className="p-4">
          <div className="mono text-[10px] uppercase tracking-wider text-dim">Unrealised P&amp;L</div>
          <div className={classNames("mono tnum mt-1.5 text-2xl font-bold", pnlUp ? "text-up" : "text-down")}>
            {signed(detail.pnl)}
          </div>
          <div className="mt-0.5">
            <ChangePill value={detail.pnlPct} />
          </div>
        </Panel>
        <Panel className="p-4">
          <div className="mono text-[10px] uppercase tracking-wider text-dim">Today&apos;s move</div>
          <div className={classNames("mono tnum mt-1.5 text-2xl font-bold", detail.dayChange >= 0 ? "text-up" : "text-down")}>
            {signed(detail.dayChange)}
          </div>
          <div className="mt-0.5 text-[11px] text-dim">mark-to-market</div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Holdings */}
        <Panel className="lg:col-span-2" title="Holdings">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="mono border-b border-line text-[10px] uppercase tracking-wider text-dim">
                  <th className="px-4 py-2 font-semibold">Security</th>
                  <th className="px-3 py-2 text-right font-semibold">Qty</th>
                  <th className="px-3 py-2 text-right font-semibold">Avg</th>
                  <th className="px-3 py-2 text-right font-semibold">Last</th>
                  <th className="px-3 py-2 text-right font-semibold">Value</th>
                  <th className="px-3 py-2 text-right font-semibold">P&amp;L</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {detail.items.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-dim">
                      No positions yet. Record your first trade using the ticket on the right.
                    </td>
                  </tr>
                )}
                {detail.items.map((h) => {
                  const isBond = h.securityType === "bond";
                  const isCrypto = h.securityType === "crypto";
                  const isFund = h.securityType === "fund";
                  const decimals = isCrypto && (h.currentPrice < 1 || h.avgCost < 1) ? 6 : 2;
                  const dispLast = isBond ? h.currentPrice * 100 : h.currentPrice;
                  const dispAvg = isBond ? h.avgCost * 100 : h.avgCost;
                  return (
                    <tr key={h.id} className="border-b border-line-soft transition hover:bg-term-800/50">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={classNames(
                              "mono inline-block rounded px-1.5 py-0.5 text-[9px] font-bold",
                              isBond
                                ? "bg-cyan/10 text-cyan"
                                : isCrypto
                                ? "bg-gold/10 text-gold"
                                : isFund
                                ? "bg-up/10 text-up"
                                : "bg-amber/10 text-amber"
                            )}
                          >
                            {isBond ? "BOND" : isCrypto ? "CRYP" : isFund ? "FUND" : "EQTY"}
                          </span>
                          {isCrypto ? (
                            <CryptoAvatar symbol={h.symbol} size={26} />
                          ) : isFund ? (
                            <FundAvatar type={h.sector} size={26} />
                          ) : (
                            <StockAvatar symbol={h.symbol} size={26} />
                          )}
                          <div>
                            <Link
                              href={isBond ? `/bonds/${h.refId}` : isCrypto ? `/crypto/${h.symbol}` : isFund ? `/funds/${h.symbol}` : `/stocks/${h.symbol}`}
                              className="mono text-sm font-bold text-fg hover:text-amber"
                            >
                              {h.symbol}
                            </Link>
                            <div className="max-w-[180px] truncate text-[10px] text-dim">{h.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="mono tnum px-3 py-2.5 text-right">
                        {isBond
                          ? compact(h.quantity)
                          : isCrypto
                          ? h.quantity.toLocaleString("en-KE", { maximumFractionDigits: 6 })
                          : h.quantity.toLocaleString("en-KE")}
                      </td>
                      <td className="mono tnum px-3 py-2.5 text-right text-muted">
                        {dispAvg.toFixed(decimals)}
                        {isBond ? "%" : ""}
                      </td>
                      <td className="mono tnum px-3 py-2.5 text-right">
                        {dispLast.toFixed(decimals)}
                        {isBond ? "%" : ""}
                      </td>
                      <td className="mono tnum px-3 py-2.5 text-right font-semibold">{kes(h.marketValue)}</td>
                      <td className="px-3 py-2.5 text-right">
                        <Delta value={h.pnl} className="block text-[11px]" />
                        <ChangePill value={h.pnlPct} showArrow={false} className="mt-0.5" />
                      </td>
                      <td className="px-2 py-2.5">
                        <button
                          onClick={() =>
                            start(async () => {
                              await deleteHolding(h.id);
                              router.refresh();
                            })
                          }
                          disabled={pending}
                          className="text-dim transition hover:text-down"
                          title="Remove holding"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* Trade ticket */}
        <Panel title="Trade Ticket" subtitle="Settled via M-Pesa wallet">
          <form onSubmit={submit} className="space-y-3 p-4">
            <div className="flex items-center justify-between rounded-md border border-up/30 bg-up/5 px-3 py-2">
              <span className="mono text-[10px] uppercase tracking-wider text-dim">Wallet</span>
              <span className="mono tnum text-sm font-bold text-up">{kes(detail.cashBalance)}</span>
            </div>
            <div className="grid grid-cols-4 gap-1 rounded-md border border-line bg-term-900 p-1">
              {(["stock", "bond", "crypto", "fund"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setType(t);
                    setSel("");
                    setPx("");
                  }}
                  className={classNames(
                    "mono rounded py-1.5 text-[11px] font-bold uppercase tracking-wider transition",
                    type === t ? "bg-amber/15 text-amber" : "text-muted hover:text-fg"
                  )}
                >
                  {t === "stock" ? "Equity" : t === "bond" ? "Bond" : t === "crypto" ? "Crypto" : "Fund"}
                </button>
              ))}
            </div>

            <select
              value={sel}
              onChange={(e) => onPick(e.target.value)}
              className="mono w-full rounded-md border border-line bg-term-900 px-3 py-2 text-sm text-fg outline-none focus:border-amber/50"
            >
              <option value="">Select {type === "stock" ? "equity" : type === "bond" ? "bond" : type === "crypto" ? "crypto" : "fund"}…</option>
              {secList.map((s) => (
                <option key={s.id} value={s.id}>
                  {type === "stock"
                    ? `${(s as SecOpt).symbol} — ${(s as SecOpt).name}`
                    : type === "bond"
                    ? `${(s as BondOpt).bondNumber} — ${(s as BondOpt).name}`
                    : type === "crypto"
                    ? `${(s as CryptoOpt).symbol} — ${(s as CryptoOpt).name}`
                    : `${(s as FundOpt).symbol} — ${(s as FundOpt).name}`}
                </option>
              ))}
            </select>

            <div className="grid grid-cols-2 gap-1.5 rounded-md border border-line bg-term-900 p-1">
              {(["buy", "sell"] as const).map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAction(a)}
                  className={classNames(
                    "mono rounded py-1.5 text-[11px] font-bold uppercase tracking-wider transition",
                    action === a
                      ? a === "buy"
                        ? "bg-up/15 text-up"
                        : "bg-down/15 text-down"
                      : "text-muted hover:text-fg"
                  )}
                >
                  {a}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mono mb-1 block text-[10px] uppercase tracking-wider text-dim">
                  {type === "bond" ? "Face (KSh)" : type === "crypto" ? "Amount" : type === "fund" ? "Units" : "Shares"}
                </label>
                <input
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  type="number"
                  min="0"
                  className="mono tnum w-full rounded-md border border-line bg-term-900 px-2.5 py-2 text-sm text-fg outline-none focus:border-amber/50"
                />
              </div>
              <div>
                <label className="mono mb-1 block text-[10px] uppercase tracking-wider text-dim">
                  {type === "bond" ? "Clean %" : "Price"}
                </label>
                <input
                  value={px}
                  onChange={(e) => setPx(e.target.value)}
                  type="number"
                  min="0"
                  step="0.01"
                  className="mono tnum w-full rounded-md border border-line bg-term-900 px-2.5 py-2 text-sm text-fg outline-none focus:border-amber/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mono mb-1 block text-[10px] uppercase tracking-wider text-dim">Fees</label>
                <input
                  value={fees}
                  onChange={(e) => setFees(e.target.value)}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  className="mono tnum w-full rounded-md border border-line bg-term-900 px-2.5 py-2 text-sm text-fg outline-none focus:border-amber/50"
                />
              </div>
              <div>
                <label className="mono mb-1 block text-[10px] uppercase tracking-wider text-dim">Date</label>
                <input
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  type="date"
                  className="mono w-full rounded-md border border-line bg-term-900 px-2.5 py-2 text-sm text-fg outline-none focus:border-amber/50"
                />
              </div>
            </div>

            {formMsg && (
              <div
                className={classNames(
                  "mono rounded-md border px-3 py-2 text-xs",
                  formMsg.ok ? "border-up/40 bg-up/5 text-up" : "border-down/40 bg-down/5 text-down"
                )}
              >
                {formMsg.text}
              </div>
            )}

            <button
              type="submit"
              disabled={pending}
              className={classNames(
                "mono w-full rounded-md py-2.5 text-xs font-bold uppercase tracking-wider transition disabled:opacity-50",
                action === "buy" ? "bg-up/90 text-term-950 hover:bg-up" : "bg-down/90 text-term-950 hover:bg-down"
              )}
            >
              {pending ? "Booking…" : `Record ${action}`}
            </button>
          </form>
        </Panel>
      </div>

      {/* Allocation + Transactions */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="Allocation by holding">
          <div className="flex items-center gap-4 p-4">
            <DonutChart segments={byHolding} size={150} />
            <div className="min-w-0 flex-1 space-y-1.5">
              {byHolding.map((s) => (
                <div key={s.label} className="flex items-center gap-2 text-xs">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: s.color }} />
                  <span className="mono truncate text-muted">{s.label}</span>
                  <span className="mono tnum ml-auto text-fg">
                    {detail.totalValue ? ((s.value / detail.totalValue) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              ))}
              {byHolding.length === 0 && <div className="text-xs text-dim">No holdings to allocate.</div>}
            </div>
          </div>
        </Panel>

        <Panel title="Sector exposure">
          <div className="flex items-center gap-4 p-4">
            <DonutChart segments={bySector} size={150} />
            <div className="min-w-0 flex-1 space-y-1.5">
              {bySector.map((s) => (
                <div key={s.label} className="flex items-center gap-2 text-xs">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: s.color }} />
                  <span className="truncate text-muted">{s.label}</span>
                  <span className="mono tnum ml-auto text-fg">
                    {detail.totalValue ? ((s.value / detail.totalValue) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              ))}
              {bySector.length === 0 && <div className="text-xs text-dim">No exposure yet.</div>}
            </div>
          </div>
        </Panel>

        <Panel title="Transaction history" subtitle={`${transactions.length} trades`}>
          <div className="max-h-[280px] overflow-y-auto">
            {transactions.length === 0 && (
              <div className="px-4 py-10 text-center text-xs text-dim">No trades recorded.</div>
            )}
            {transactions.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between border-b border-line-soft px-4 py-2.5 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={classNames(
                      "mono rounded px-1.5 py-0.5 text-[9px] font-bold uppercase",
                      t.action === "buy" ? "bg-up/10 text-up" : "bg-down/10 text-down"
                    )}
                  >
                    {t.action}
                  </span>
                  <div>
                    <div className="mono text-xs font-bold text-fg">{t.symbol}</div>
                    <div className="text-[10px] text-dim">{formatDate(t.date)}</div>
                  </div>
                </div>
                <div className="mono tnum text-right text-xs">
                  <div className="text-fg">{t.quantity.toLocaleString("en-KE")} @ {t.price.toFixed(2)}</div>
                  <div className="text-dim">{compact(t.quantity * t.price)} KES</div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
