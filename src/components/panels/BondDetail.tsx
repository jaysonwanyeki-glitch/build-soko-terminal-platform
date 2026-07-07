"use client";

import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { Bond } from "@/app/page";

interface Props {
  bond: Bond;
  onClose: () => void;
  formatKES: (val: number) => string;
  formatVolume: (vol: number) => string;
}

export function BondDetail({ bond, onClose, formatKES, formatVolume }: Props) {
  const [activeTab, setActiveTab] = useState<"overview" | "analytics" | "cashflow">("overview");

  const yieldData = Array.from({ length: 15 }, (_, i) => ({
    year: (i + 1).toString(),
    yield: bond.yieldToMaturity - 2 + i * 0.45 + Math.random() * 0.2,
  }));

  const years = Math.ceil(bond.yearsToMaturity);
  const cashFlows = Array.from({ length: years }, (_, i) => {
    const isLast = i === years - 1;
    const couponPayment = (bond.faceValue * bond.couponRate) / 100;
    return { year: `Y${i + 1}`, coupon: couponPayment, principal: isLast ? bond.faceValue : 0, total: couponPayment + (isLast ? bond.faceValue : 0) };
  });

  const now = new Date();
  const daysToMaturity = Math.ceil((new Date(bond.maturityDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="h-full flex flex-col p-3.5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-accent-cyan font-bold text-xs">{bond.symbol}</div>
          <div className="text-[9px] text-text-tertiary truncate max-w-[260px]">{bond.name}</div>
        </div>
        <button onClick={onClose} className="text-text-tertiary hover:text-accent-red text-xs px-2 py-1 rounded border border-border-subtle hover:border-accent-red transition-colors">✕</button>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <MetricBox label="YTM" value={`${bond.yieldToMaturity.toFixed(2)}%`} color="text-accent-green" />
        <MetricBox label="Coupon" value={`${bond.couponRate.toFixed(2)}%`} color="text-accent-amber" />
        <MetricBox label="Price" value={bond.lastPrice.toFixed(2)} color="text-text-primary" />
        <MetricBox label="Duration" value={bond.modifiedDuration.toFixed(1)} color="text-accent-blue" />
      </div>

      <div className="flex border-b border-border-subtle mb-3">
        {(["overview","analytics","cashflow"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`text-[10px] px-3 py-1.5 uppercase tracking-wider font-medium transition-colors ${
              activeTab === tab ? "text-accent-green border-b-2 border-accent-green" : "text-text-tertiary hover:text-text-secondary"}`}>{tab}</button>
        ))}
      </div>

      <div className="flex-1 overflow-auto">
        {activeTab === "overview" && (
          <div className="space-y-1.5 text-[11px]">
            <Row label="Issuer" value={bond.issuer} />
            <Row label="Type" value={bond.bondType} />
            <Row label="Maturity Date" value={new Date(bond.maturityDate).toLocaleDateString("en-KE")} />
            <Row label="Days to Maturity" value={daysToMaturity.toString()} />
            <Row label="Years to Maturity" value={bond.yearsToMaturity.toFixed(2)} />
            <Row label="Face Value" value={`KES ${bond.faceValue.toFixed(2)}`} />
            <Row label="Clean Price" value={bond.lastPrice.toFixed(4)} />
            <Row label="Accrued Interest" value={bond.accruedInterest.toFixed(4)} />
            <Row label="Dirty Price" value={bond.dirtyPrice.toFixed(4)} />
            <Row label="Modified Duration" value={bond.modifiedDuration.toFixed(2)} />
            <Row label="Volume" value={formatVolume(bond.volume)} />
            <Row label="Outstanding" value={`KES ${formatKES(bond.outstandingAmount)}`} />
            <Row label="Coupon Months" value={bond.couponPaymentMonths} />
          </div>
        )}
        {activeTab === "analytics" && (
          <div>
            <div className="text-[10px] text-text-tertiary font-medium mb-1">YTM: {bond.yieldToMaturity.toFixed(2)}%</div>
            <div className="text-[10px] text-text-tertiary mb-2">Prev: {bond.prevYield.toFixed(2)}% | Δ: {bond.yieldChange >= 0 ? "+" : ""}{bond.yieldChange.toFixed(2)}%</div>
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={yieldData}>
                <defs>
                  <linearGradient id="yieldGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="year" tick={{ fontSize: 8, fill: "#6b7280" }} axisLine={{ stroke: "#262d3a" }} tickLine={false} />
                <YAxis tick={{ fontSize: 8, fill: "#6b7280" }} axisLine={{ stroke: "#262d3a" }} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "#13161c", border: "1px solid #262d3a", fontSize: 10, color: "#e8eaed", borderRadius: "8px" }} />
                <Area type="monotone" dataKey="yield" stroke="#3b82f6" fill="url(#yieldGrad)" strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
            <div className="mt-3 space-y-1 text-[11px]">
              <Row label="DV01 (per 100)" value={(bond.modifiedDuration * bond.lastPrice * 0.0001).toFixed(4)} />
              <Row label="Convexity (est)" value={(bond.modifiedDuration * bond.modifiedDuration / 100).toFixed(2)} />
            </div>
          </div>
        )}
        {activeTab === "cashflow" && (
          <div>
            <div className="text-[10px] text-text-tertiary font-medium mb-2">Cash Flow (per KES {bond.faceValue.toFixed(0)})</div>
            <table className="w-full text-[10px]">
              <thead>
                <tr className="text-text-tertiary border-b border-border-subtle">
                  <th className="text-left py-1">Year</th><th className="text-right py-1">Coupon</th><th className="text-right py-1">Principal</th><th className="text-right py-1">Total</th>
                </tr>
              </thead>
              <tbody>
                {cashFlows.map((cf, i) => (
                  <tr key={i} className="border-b border-border-subtle">
                    <td className="py-1 text-text-secondary">{cf.year}</td>
                    <td className="text-right text-accent-amber mono">{cf.coupon.toFixed(2)}</td>
                    <td className="text-right text-accent-blue mono">{cf.principal > 0 ? cf.principal.toFixed(2) : "-"}</td>
                    <td className="text-right text-text-primary mono font-semibold">{cf.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-2 text-[10px] text-text-tertiary">
              Total: KES {cashFlows.reduce((s, c) => s + c.total, 0).toFixed(2)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1">
      <span className="text-text-tertiary">{label}</span>
      <span className="text-text-secondary mono">{value}</span>
    </div>
  );
}

function MetricBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-surface-2 border border-border-subtle rounded-lg p-2 text-center">
      <div className="text-[9px] text-text-tertiary font-medium">{label}</div>
      <div className={`text-sm font-bold mt-0.5 mono ${color}`}>{value}</div>
    </div>
  );
}
