"use client";

import { useState, useMemo } from "react";
import type { Bond } from "@/app/page";

interface Props {
  bonds: Bond[];
  onSelectBond: (bond: Bond) => void;
  formatKES: (val: number) => string;
  formatVolume: (vol: number) => string;
}

type SortKey = keyof Bond;

export function BondDesk({ bonds, onSelectBond, formatKES, formatVolume }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("yearsToMaturity");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const types = useMemo(() => {
    const set = new Set(bonds.map((b) => b.bondType));
    return ["ALL", ...Array.from(set).sort()];
  }, [bonds]);

  const filtered = useMemo(() => {
    let result = [...bonds];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((b) => b.symbol.toLowerCase().includes(q) || b.name.toLowerCase().includes(q));
    }
    if (typeFilter !== "ALL") result = result.filter((b) => b.bondType === typeFilter);
    result.sort((a, b) => {
      const aVal = a[sortKey] ?? 0;
      const bVal = b[sortKey] ?? 0;
      if (typeof aVal === "string" && typeof bVal === "string")
        return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      return sortDir === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
    return result;
  }, [bonds, search, typeFilter, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir(key === "yearsToMaturity" ? "asc" : "desc"); }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <span className="text-text-tertiary/40 ml-0.5">↕</span>;
    return <span className="text-accent-green ml-0.5">{sortDir === "asc" ? "↑" : "↓"}</span>;
  };

  const typeColors: Record<string, string> = { FXD: "text-accent-blue", IFB: "text-accent-purple", SGB: "text-accent-amber", CORP: "text-accent-cyan" };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-amber" />
          <h2 className="text-sm font-semibold text-text-primary tracking-tight">Treasury & Bond Desk</h2>
        </div>
        <span className="text-[10px] text-text-tertiary">{filtered.length} bonds</span>
        <div className="flex-1" />
        <input type="text" placeholder="Search bond..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="bg-surface-2 border border-border-default text-text-primary text-[11px] px-2.5 py-1.5 rounded-lg w-48 focus:outline-none focus:border-accent-green placeholder:text-text-tertiary transition-colors" />
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-surface-2 border border-border-default text-text-secondary text-[10px] px-2.5 py-1.5 rounded-lg">
          {types.map((t) => (<option key={t} value={t}>{t === "ALL" ? "All Types" : t}</option>))}
        </select>
      </div>

      {/* Yield Curve mini viz */}
      <div className="mb-3 p-3 bg-surface-1 border border-border-subtle rounded-lg">
        <div className="text-[10px] text-text-tertiary font-medium mb-2">Yield Curve (KES Govt Bonds)</div>
        <div className="flex items-end gap-0.5 h-14">
          {filtered.filter((b) => b.bondType === "FXD").sort((a, b) => a.yearsToMaturity - b.yearsToMaturity).slice(0,18).map((b) => {
            const maxY = Math.max(...filtered.filter((x) => x.bondType === "FXD").map((x) => x.yieldToMaturity));
            const h = (b.yieldToMaturity / maxY) * 100;
            return (
              <div key={b.id} className="flex-1 bg-accent-green/20 hover:bg-accent-green/40 transition-colors cursor-pointer rounded-t-sm relative group"
                style={{ height: `${h}%` }} onClick={() => onSelectBond(b)}>
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] text-text-tertiary opacity-0 group-hover:opacity-100 whitespace-nowrap">{b.yieldToMaturity.toFixed(1)}%</div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-[8px] text-text-tertiary mt-1">
          <span>Short-term</span><span>Medium</span><span>Long-term</span>
        </div>
      </div>

      <div className="flex-1 overflow-auto rounded-lg border border-border-subtle">
        <table className="w-full text-[11px] border-collapse">
          <thead className="sticky top-0 bg-surface-2 z-10">
            <tr className="text-text-tertiary text-[10px] font-medium">
              {(["symbol","bondType","couponRate","yieldToMaturity","lastPrice","yearsToMaturity","modifiedDuration","outstandingAmount"] as SortKey[]).map((col) => {
                const labels: Record<string,string> = { symbol:"Bond", bondType:"Type", couponRate:"Coupon", yieldToMaturity:"YTM%", lastPrice:"Price", yearsToMaturity:"Yrs", modifiedDuration:"Dur", outstandingAmount:"Outstanding" };
                return (
                  <th key={col} className={`${col === "symbol" ? "text-left" : "text-right"} px-2.5 py-2 cursor-pointer hover:text-text-secondary transition-colors`}
                    onClick={() => handleSort(col)}>
                    {labels[col]} <SortIcon col={col} />
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {filtered.map((b) => (
              <tr key={b.id} className="border-b border-border-subtle row-hover hover:bg-surface-2/60 cursor-pointer"
                onClick={() => onSelectBond(b)}>
                <td className="px-2.5 py-2 text-accent-cyan font-semibold text-[10px]">{b.symbol}</td>
                <td className={`px-2.5 py-2 font-semibold text-[10px] ${typeColors[b.bondType] ?? "text-text-secondary"}`}>{b.bondType}</td>
                <td className="px-2.5 py-2 text-right text-accent-amber mono font-medium">{b.couponRate.toFixed(2)}%</td>
                <td className="px-2.5 py-2 text-right text-accent-green mono font-semibold">{b.yieldToMaturity.toFixed(2)}%</td>
                <td className="px-2.5 py-2 text-right text-text-primary mono">{b.lastPrice.toFixed(2)}</td>
                <td className="px-2.5 py-2 text-right text-text-secondary mono">{b.yearsToMaturity.toFixed(1)}</td>
                <td className="px-2.5 py-2 text-right text-text-tertiary mono">{b.modifiedDuration.toFixed(1)}</td>
                <td className="px-2.5 py-2 text-right text-text-secondary mono">{formatKES(b.outstandingAmount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
