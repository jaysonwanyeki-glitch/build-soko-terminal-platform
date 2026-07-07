"use client";

import { useState } from "react";
import type { FinancialStatements, StatementRow } from "@/lib/financials";
import { num, classNames } from "@/lib/format";

type Tab = "income" | "balance" | "cashflow";

function StatementTable({ rows }: { rows: StatementRow[] }) {
  return (
    <table className="w-full text-left text-xs">
      <thead>
        <tr className="mono border-b border-line text-[10px] uppercase tracking-wider text-dim">
          <th className="px-4 py-2 font-semibold">KSh Millions</th>
          <th className="mono tnum px-3 py-2 text-right font-semibold">FY -2</th>
          <th className="mono tnum px-3 py-2 text-right font-semibold">FY -1</th>
          <th className="mono tnum px-4 py-2 text-right font-semibold">FY (Latest)</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const isBold = /Gross Profit|Operating Income|Net Income|Total Assets|Free Cash Flow|Shareholders/i.test(r.label);
          return (
            <tr key={r.label} className={classNames("border-b border-line-soft", isBold && "bg-term-850/40")}>
              <td className={classNames("px-4 py-1.5", isBold ? "font-bold text-fg" : "text-muted")}>{r.label}</td>
              {r.values.map((v, i) => (
                <td
                  key={i}
                  className={classNames(
                    "mono tnum px-3 py-1.5 text-right",
                    isBold ? "font-bold text-fg" : v < 0 ? "text-down" : "text-muted",
                    i === r.values.length - 1 && "px-4"
                  )}
                >
                  {v < 0 ? "(" + num(Math.abs(v)) + ")" : num(v)}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export function Financials({ data }: { data: FinancialStatements }) {
  const [tab, setTab] = useState<Tab>("income");
  const tabs: { id: Tab; label: string }[] = [
    { id: "income", label: "Income Statement" },
    { id: "balance", label: "Balance Sheet" },
    { id: "cashflow", label: "Cash Flow" },
  ];
  const rows = tab === "income" ? data.income : tab === "balance" ? data.balance : data.cashflow;

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 border-b border-line p-3">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={classNames(
              "mono rounded-md px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition",
              tab === t.id ? "bg-amber/15 text-amber" : "text-muted hover:bg-term-800 hover:text-fg"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto">
        <StatementTable rows={rows} />
      </div>
      {/* ratios */}
      <div className="border-t border-line p-3">
        <div className="mono mb-2 text-[10px] font-semibold uppercase tracking-wider text-dim">Key Ratios</div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {data.ratios.map((r) => (
            <div key={r.label} className="rounded-md border border-line-soft bg-term-850/60 px-3 py-2">
              <div className="text-[10px] text-dim">{r.label}</div>
              <div className="mono tnum text-sm font-bold text-fg">{r.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
