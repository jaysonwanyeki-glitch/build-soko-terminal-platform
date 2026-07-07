"use client";

import { useState, useMemo } from "react";
import type { Stock } from "@/app/page";

interface Props {
  stocks: Stock[];
  onSelectStock: (stock: Stock) => void;
  formatMarketCap: (cap: number) => string;
  formatVolume: (vol: number) => string;
  formatKES: (val: number) => string;
}

type SortKey = keyof Stock;

export function MarketWatch({
  stocks,
  onSelectStock,
  formatMarketCap,
  formatVolume,
  formatKES,
}: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("marketCap");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [search, setSearch] = useState("");
  const [sectorFilter, setSectorFilter] = useState("ALL");

  const sectors = useMemo(() => {
    const set = new Set(stocks.map((s) => s.sector));
    return ["ALL", ...Array.from(set).sort()];
  }, [stocks]);

  const filtered = useMemo(() => {
    let result = [...stocks];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
      );
    }
    if (sectorFilter !== "ALL") result = result.filter((s) => s.sector === sectorFilter);
    result.sort((a, b) => {
      const aVal = a[sortKey] ?? 0;
      const bVal = b[sortKey] ?? 0;
      if (typeof aVal === "string" && typeof bVal === "string")
        return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      return sortDir === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
    return result;
  }, [stocks, search, sectorFilter, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <span className="text-text-tertiary/40 ml-0.5">↕</span>;
    return <span className="text-accent-green ml-0.5">{sortDir === "asc" ? "↑" : "↓"}</span>;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan" />
          <h2 className="text-sm font-semibold text-text-primary tracking-tight">
            NSE Equities
          </h2>
        </div>
        <span className="text-[10px] text-text-tertiary">
          {filtered.length} stocks
        </span>
        <div className="flex-1" />
        <input
          type="text"
          placeholder="Search symbol or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-surface-2 border border-border-default text-text-primary text-[11px] px-2.5 py-1.5 rounded-lg w-52 focus:outline-none focus:border-accent-green placeholder:text-text-tertiary transition-colors"
        />
        <select
          value={sectorFilter}
          onChange={(e) => setSectorFilter(e.target.value)}
          className="bg-surface-2 border border-border-default text-text-secondary text-[10px] px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-accent-green"
        >
          {sectors.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="flex-1 overflow-auto rounded-lg border border-border-subtle">
        <table className="w-full text-[11px] border-collapse">
          <thead className="sticky top-0 bg-surface-2 z-10">
            <tr className="text-text-tertiary text-[10px] font-medium">
              {(["symbol","name","lastPrice","changePercent","volume","marketCap","peRatio","dividendYield"] as SortKey[]).map((col) => {
                const labels: Record<string, string> = { symbol: "SYM", name: "Name", lastPrice: "Price", changePercent: "Chg%", volume: "Vol", marketCap: "Mkt Cap", peRatio: "P/E", dividendYield: "Div%" };
                return (
                  <th
                    key={col}
                    className={`${col === "name" ? "text-left" : col === "symbol" ? "text-left" : "text-right"} px-3 py-2 cursor-pointer hover:text-text-secondary transition-colors`}
                    onClick={() => handleSort(col)}
                  >
                    {labels[col]} <SortIcon col={col} />
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr
                key={s.id}
                className="border-b border-border-subtle row-hover hover:bg-surface-2/60 cursor-pointer"
                onClick={() => onSelectStock(s)}
              >
                <td className="px-3 py-2 text-accent-cyan font-semibold">{s.symbol}</td>
                <td className="px-3 py-2 text-text-secondary truncate max-w-[180px]">{s.name}</td>
                <td className="px-3 py-2 text-right text-text-primary mono font-medium">{s.lastPrice.toFixed(2)}</td>
                <td className={`px-3 py-2 text-right mono font-semibold ${s.changePercent >= 0 ? "text-accent-green" : "text-accent-red"}`}>
                  {s.changePercent >= 0 ? "+" : ""}{s.changePercent.toFixed(2)}%
                </td>
                <td className="px-3 py-2 text-right text-text-tertiary mono">{formatVolume(s.volume)}</td>
                <td className="px-3 py-2 text-right text-text-secondary mono">{formatMarketCap(s.marketCap)}</td>
                <td className="px-3 py-2 text-right text-text-tertiary mono">{s.peRatio.toFixed(1)}</td>
                <td className="px-3 py-2 text-right text-accent-amber mono font-medium">{s.dividendYield > 0 ? `${s.dividendYield.toFixed(1)}%` : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
