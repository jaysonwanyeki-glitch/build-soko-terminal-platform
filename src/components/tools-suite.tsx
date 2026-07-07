"use client";

import { useState } from "react";
import { Panel } from "@/components/ui";
import { kes, num, classNames } from "@/lib/format";

type Tab = "position" | "compound" | "profit" | "fx" | "bond";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "position", label: "Position Sizing", icon: "🎯" },
  { id: "compound", label: "Compound Growth", icon: "📈" },
  { id: "profit", label: "Profit / Loss", icon: "💰" },
  { id: "fx", label: "Currency Convert", icon: "💱" },
  { id: "bond", label: "Bond Calculator", icon: "🏦" },
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mono mb-1 block text-[10px] uppercase tracking-wider text-dim">{label}</label>
      {children}
    </div>
  );
}
const inputCls = "mono tnum w-full rounded-md border border-line bg-term-900 px-3 py-2 text-sm text-fg outline-none focus:border-amber/50";
const resultCls = "mono tnum rounded-md border border-line-soft bg-term-850 px-4 py-3";

export function ToolsSuite() {
  const [tab, setTab] = useState<Tab>("position");

  // position sizing
  const [capital, setCapital] = useState("100000");
  const [riskPct, setRiskPct] = useState("2");
  const [entry, setEntry] = useState("50");
  const [stop, setStop] = useState("45");

  // compound
  const [principal, setPrincipal] = useState("50000");
  const [rate, setRate] = useState("12");
  const [years, setYears] = useState("10");
  const [monthly, setMonthly] = useState("5000");

  // profit
  const [buyPrice, setBuyPrice] = useState("40");
  const [sellPrice, setSellPrice] = useState("52");
  const [shares, setShares] = useState("1000");

  // fx
  const [kesAmt, setKesAmt] = useState("10000");
  const [fxRate, setFxRate] = useState("129.42");
  const [fxDir, setFxDir] = useState<"kes2usd" | "usd2kes">("kes2usd");

  // bond
  const [face, setFace] = useState("100000");
  const [couponRate, setCouponRate] = useState("16.5");
  const [cleanPct, setCleanPct] = useState("98.5");

  return (
    <div className="space-y-4">
      {/* tabs */}
      <div className="flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={classNames(
              "mono flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition",
              tab === t.id ? "border-amber/50 bg-amber/10 text-amber" : "border-line text-muted hover:border-amber/30 hover:text-fg"
            )}
          >
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* POSITION SIZING */}
      {tab === "position" && (() => {
        const cap = Number(capital) || 0;
        const risk = (Number(riskPct) || 0) / 100;
        const riskAmt = cap * risk;
        const en = Number(entry) || 0;
        const st = Number(stop) || 0;
        const perShareRisk = Math.abs(en - st);
        const maxShares = perShareRisk > 0 ? riskAmt / perShareRisk : 0;
        const positionValue = maxShares * en;
        return (
          <Panel title="Position Sizing Calculator" subtitle="how many shares based on your risk tolerance">
            <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
              <Field label="Account Capital (KSh)"><input className={inputCls} type="number" value={capital} onChange={(e) => setCapital(e.target.value)} /></Field>
              <Field label="Risk per Trade (%)"><input className={inputCls} type="number" step="0.1" value={riskPct} onChange={(e) => setRiskPct(e.target.value)} /></Field>
              <Field label="Entry Price (KSh)"><input className={inputCls} type="number" step="0.01" value={entry} onChange={(e) => setEntry(e.target.value)} /></Field>
              <Field label="Stop Loss Price (KSh)"><input className={inputCls} type="number" step="0.01" value={stop} onChange={(e) => setStop(e.target.value)} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3 px-4 pb-4 sm:grid-cols-3">
              <div className={resultCls}><div className="text-[10px] text-dim">Risk Amount</div><div className="text-lg font-bold text-down">{kes(riskAmt)}</div></div>
              <div className={resultCls}><div className="text-[10px] text-dim">Max Shares</div><div className="text-lg font-bold text-amber">{maxShares.toLocaleString("en-KE", { maximumFractionDigits: 0 })}</div></div>
              <div className={resultCls}><div className="text-[10px] text-dim">Position Value</div><div className="text-lg font-bold text-fg">{kes(positionValue)}</div></div>
            </div>
          </Panel>
        );
      })()}

      {/* COMPOUND */}
      {tab === "compound" && (() => {
        const p = Number(principal) || 0;
        const r = (Number(rate) || 0) / 100;
        const n = Number(years) || 0;
        const m = Number(monthly) || 0;
        const fvLump = p * Math.pow(1 + r, n);
        // future value of monthly contributions (monthly compounding)
        const monthlyRate = r / 12;
        const months = n * 12;
        const fvContrib = monthlyRate > 0 ? m * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) : m * months;
        const total = fvLump + fvContrib;
        const totalIn = p + m * months;
        const interest = total - totalIn;
        return (
          <Panel title="Compound Growth Calculator" subtitle="see how your investments grow over time">
            <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
              <Field label="Initial Investment (KSh)"><input className={inputCls} type="number" value={principal} onChange={(e) => setPrincipal(e.target.value)} /></Field>
              <Field label="Annual Return (%)"><input className={inputCls} type="number" step="0.1" value={rate} onChange={(e) => setRate(e.target.value)} /></Field>
              <Field label="Years"><input className={inputCls} type="number" value={years} onChange={(e) => setYears(e.target.value)} /></Field>
              <Field label="Monthly Contribution (KSh)"><input className={inputCls} type="number" value={monthly} onChange={(e) => setMonthly(e.target.value)} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3 px-4 pb-4 sm:grid-cols-3">
              <div className={resultCls}><div className="text-[10px] text-dim">Total Contributed</div><div className="text-lg font-bold text-fg">{kes(totalIn)}</div></div>
              <div className={resultCls}><div className="text-[10px] text-dim">Interest Earned</div><div className="text-lg font-bold text-up">{kes(interest)}</div></div>
              <div className={resultCls + " border-amber/30"}><div className="text-[10px] text-dim">Final Value</div><div className="text-lg font-bold text-amber">{kes(total)}</div></div>
            </div>
          </Panel>
        );
      })()}

      {/* PROFIT / LOSS */}
      {tab === "profit" && (() => {
        const bp = Number(buyPrice) || 0;
        const sp = Number(sellPrice) || 0;
        const sh = Number(shares) || 0;
        const cost = bp * sh;
        const proceeds = sp * sh;
        const pnl = proceeds - cost;
        const pct = cost > 0 ? (pnl / cost) * 100 : 0;
        return (
          <Panel title="Profit / Loss Calculator" subtitle="work out your trade returns">
            <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-3">
              <Field label="Buy Price (KSh)"><input className={inputCls} type="number" step="0.01" value={buyPrice} onChange={(e) => setBuyPrice(e.target.value)} /></Field>
              <Field label="Sell Price (KSh)"><input className={inputCls} type="number" step="0.01" value={sellPrice} onChange={(e) => setSellPrice(e.target.value)} /></Field>
              <Field label="Quantity"><input className={inputCls} type="number" value={shares} onChange={(e) => setShares(e.target.value)} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3 px-4 pb-4 sm:grid-cols-3">
              <div className={resultCls}><div className="text-[10px] text-dim">Total Cost</div><div className="text-lg font-bold text-fg">{kes(cost)}</div></div>
              <div className={resultCls}><div className="text-[10px] text-dim">Net P/L</div><div className={classNames("text-lg font-bold", pnl >= 0 ? "text-up" : "text-down")}>{kes(pnl)}</div></div>
              <div className={resultCls}><div className="text-[10px] text-dim">Return %</div><div className={classNames("text-lg font-bold", pct >= 0 ? "text-up" : "text-down")}>{pct >= 0 ? "+" : ""}{num(pct)}%</div></div>
            </div>
          </Panel>
        );
      })()}

      {/* FX */}
      {tab === "fx" && (() => {
        const amt = Number(kesAmt) || 0;
        const rt = Number(fxRate) || 1;
        const result = fxDir === "kes2usd" ? amt / rt : amt * rt;
        return (
          <Panel title="Currency Converter" subtitle="KES ↔ USD at live rates">
            <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-3">
              <Field label="Amount"><input className={inputCls} type="number" value={kesAmt} onChange={(e) => setKesAmt(e.target.value)} /></Field>
              <Field label="Rate (KES per USD)"><input className={inputCls} type="number" step="0.01" value={fxRate} onChange={(e) => setFxRate(e.target.value)} /></Field>
              <Field label="Direction">
                <select className={inputCls} value={fxDir} onChange={(e) => setFxDir(e.target.value as "kes2usd" | "usd2kes")}>
                  <option value="kes2usd">KES → USD</option>
                  <option value="usd2kes">USD → KES</option>
                </select>
              </Field>
            </div>
            <div className="px-4 pb-4">
              <div className={resultCls + " border-amber/30 text-center"}>
                <div className="text-[10px] text-dim">Converted Amount</div>
                <div className="text-2xl font-bold text-amber">
                  {fxDir === "kes2usd" ? "$" : "KSh "}{num(result, fxDir === "kes2usd" ? 2 : 2)}
                </div>
                <div className="mt-1 text-[10px] text-dim">{num(amt, 2)} {fxDir === "kes2usd" ? "KES" : "USD"} @ {num(rt)}</div>
              </div>
            </div>
          </Panel>
        );
      })()}

      {/* BOND */}
      {tab === "bond" && (() => {
        const fv = Number(face) || 0;
        const cr = Number(couponRate) || 0;
        const cp = Number(cleanPct) || 0;
        const cleanPrice = (cp / 100) * fv;
        const couponPerYear = (cr / 100) * fv;
        const couponPer6mo = couponPerYear / 2;
        const discount = fv - cleanPrice;
        return (
          <Panel title="Bond Price & Coupon Calculator" subtitle="treasury bond cash flows">
            <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-3">
              <Field label="Face Value (KSh)"><input className={inputCls} type="number" step="50000" value={face} onChange={(e) => setFace(e.target.value)} /></Field>
              <Field label="Coupon Rate (%)"><input className={inputCls} type="number" step="0.01" value={couponRate} onChange={(e) => setCouponRate(e.target.value)} /></Field>
              <Field label="Clean Price (%)"><input className={inputCls} type="number" step="0.01" value={cleanPct} onChange={(e) => setCleanPct(e.target.value)} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3 px-4 pb-4 sm:grid-cols-3">
              <div className={resultCls}><div className="text-[10px] text-dim">Clean Price</div><div className="text-lg font-bold text-fg">{kes(cleanPrice)}</div></div>
              <div className={resultCls}><div className="text-[10px] text-dim">Coupon / 6mo</div><div className="text-lg font-bold text-up">{kes(couponPer6mo)}</div></div>
              <div className={resultCls}><div className="text-[10px] text-dim">Annual Income</div><div className="text-lg font-bold text-up">{kes(couponPerYear)}</div></div>
              <div className={resultCls}><div className="text-[10px] text-dim">Discount / Premium</div><div className={classNames("text-lg font-bold", discount >= 0 ? "text-up" : "text-down")}>{kes(discount)}</div></div>
              <div className={resultCls}><div className="text-[10px] text-dim">Current Yield</div><div className="text-lg font-bold text-amber">{num(cp > 0 ? (cr / cp) * 100 : 0)}%</div></div>
            </div>
          </Panel>
        );
      })()}
    </div>
  );
}
