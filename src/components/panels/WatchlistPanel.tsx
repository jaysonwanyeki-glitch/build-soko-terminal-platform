"use client";

import { useState, useEffect } from "react";
import type { Stock, Bond } from "@/app/page";

interface Props {
  stocks: Stock[];
  bonds: Bond[];
  onSelectStock: (stock: Stock) => void;
  onSelectBond: (bond: Bond) => void;
  formatKES: (val: number) => string;
  formatVolume: (vol: number) => string;
}

interface WatchlistItem {
  symbol: string;
  type: "STOCK" | "BOND";
  addedAt: string;
}

export function WatchlistPanel({
  stocks,
  bonds,
  onSelectStock,
  onSelectBond,
  formatKES,
  formatVolume,
}: Props) {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [newSymbol, setNewSymbol] = useState("");
  const [newType, setNewType] = useState<"STOCK" | "BOND">("STOCK");
  const [filter, setFilter] = useState<"ALL" | "STOCK" | "BOND">("ALL");

  useEffect(() => {
    const saved = localStorage.getItem("soko-watchlist");
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch {}
    }
  }, []);

  const saveItems = (newItems: WatchlistItem[]) => {
    setItems(newItems);
    localStorage.setItem("soko-watchlist", JSON.stringify(newItems));
  };

  const addItem = () => {
    const sym = newSymbol.trim().toUpperCase();
    if (!sym) return;
    if (items.find((i) => i.symbol === sym && i.type === newType)) return;
    saveItems([
      ...items,
      { symbol: sym, type: newType, addedAt: new Date().toISOString() },
    ]);
    setNewSymbol("");
  };

  const removeItem = (symbol: string, type: string) => {
    saveItems(items.filter((i) => !(i.symbol === symbol && i.type === type)));
  };

  const filtered = items.filter((i) => {
    if (filter === "ALL") return true;
    return i.type === filter;
  });

  // Enrich watchlist items with live data
  const enriched = filtered.map((item) => {
    if (item.type === "STOCK") {
      const stock = stocks.find((s) => s.symbol === item.symbol);
      return { ...item, data: stock };
    } else {
      const bond = bonds.find((b) => b.symbol === item.symbol);
      return { ...item, data: bond };
    }
  });

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 mb-2">
        <div className="text-xs text-amber-400 font-semibold tracking-wider">
          WATCHLIST
        </div>
        <div className="text-[10px] text-text-tertiary">{items.length} items</div>
        <div className="flex-1" />
        <div className="flex gap-1">
          {(["ALL", "STOCK", "BOND"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-[9px] px-2 py-0.5 rounded border ${
                filter === f
                  ? "border-accent-green text-accent-green bg-accent-green/20"
                  : "border-border-subtle text-text-tertiary"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Add form */}
      <div className="flex gap-2 mb-2">
        <div className="flex gap-1">
          <button
            onClick={() => setNewType("STOCK")}
            className={`text-[10px] px-2 py-1 rounded border ${
              newType === "STOCK"
                ? "border-accent-cyan text-accent-cyan bg-accent-cyan/20"
                : "border-border-subtle text-text-tertiary"
            }`}
          >
            Stock
          </button>
          <button
            onClick={() => setNewType("BOND")}
            className={`text-[10px] px-2 py-1 rounded border ${
              newType === "BOND"
                ? "border-accent-amber text-accent-amber bg-accent-amber/20"
                : "border-border-subtle text-text-tertiary"
            }`}
          >
            Bond
          </button>
        </div>
        <input
          type="text"
          value={newSymbol}
          onChange={(e) => setNewSymbol(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addItem()}
          placeholder={newType === "STOCK" ? "SCOM, EQTY..." : "FXD1/2016/010..."}
          className="flex-1 bg-surface-2 border border-border-subtle text-accent-green text-[11px] px-2 py-1 rounded focus:outline-none focus:border-accent-green"
        />
        <button
          onClick={addItem}
          className="text-[10px] bg-accent-green/40 text-accent-green border border-accent-green px-3 py-1 rounded hover:bg-accent-green/60"
        >
          Add
        </button>
      </div>

      {/* Quick-add suggestions */}
      <div className="flex flex-wrap gap-1 mb-2">
        {stocks.slice(0, 8).map((s) => (
          <button
            key={s.id}
            onClick={() => {
              setNewSymbol(s.symbol);
              setNewType("STOCK");
              setTimeout(() => {
                const sym = s.symbol;
                if (!items.find((i) => i.symbol === sym && i.type === "STOCK")) {
                  saveItems([
                    ...items,
                    { symbol: sym, type: "STOCK" as const, addedAt: new Date().toISOString() },
                  ]);
                }
              }, 1);
            }}
            className="text-[9px] text-accent-cyan bg-surface-1 border border-border-subtle px-2 py-0.5 rounded hover:border-cyan-700"
          >
            +{s.symbol}
          </button>
        ))}
      </div>

      {/* Watchlist Table */}
      <div className="flex-1 overflow-auto">
        {enriched.length === 0 ? (
          <div className="text-[10px] text-text-tertiary p-8 text-center border border-border-subtle rounded">
            Your watchlist is empty. Add stocks or bonds above to start tracking.
          </div>
        ) : (
          <table className="w-full text-[11px]">
            <thead className="sticky top-0 bg-surface-1">
              <tr className="text-text-tertiary border-b border-border-subtle">
                <th className="text-left py-1.5 px-2">Symbol</th>
                <th className="text-left py-1.5 px-2">Type</th>
                <th className="text-right py-1.5 px-2">Price/YTM</th>
                <th className="text-right py-1.5 px-2">Change</th>
                <th className="text-right py-1.5 px-2">Volume</th>
                <th className="text-center py-1.5 px-2">Remove</th>
              </tr>
            </thead>
            <tbody>
              {enriched.map((item) => {
                if (!item.data) {
                  return (
                    <tr key={`${item.type}-${item.symbol}`} className="border-b border-[#151515] text-text-tertiary">
                      <td className="py-1 px-2">{item.symbol}</td>
                      <td className="py-1 px-2">{item.type}</td>
                      <td className="py-1 px-2 text-right" colSpan={3}>
                        Not found
                      </td>
                      <td className="py-1 px-2 text-center">
                        <button
                          onClick={() => removeItem(item.symbol, item.type)}
                          className="text-accent-red hover:text-accent-red text-xs"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                }

                const data = item.data as any;
                const isStock = item.type === "STOCK";
                const priceOrYtm = isStock ? data.lastPrice : data.yieldToMaturity;
                const change = isStock ? data.changePercent : -data.yieldChange;
                const vol = isStock ? data.volume : data.volume;

                return (
                  <tr
                    key={`${item.type}-${item.symbol}`}
                    className="border-b border-[#151515] hover:bg-[#111811] cursor-pointer"
                    onClick={() => {
                      if (isStock) onSelectStock(data as Stock);
                      else onSelectBond(data as Bond);
                    }}
                  >
                    <td className="py-1 px-2">
                      <span className="text-accent-cyan font-semibold">
                        {item.symbol}
                      </span>
                    </td>
                    <td className="py-1 px-2">
                      <span
                        className={
                          isStock ? "text-accent-blue" : "text-accent-amber"
                        }
                      >
                        {item.type}
                      </span>
                    </td>
                    <td className="py-1 px-2 text-right text-text-primary font-mono">
                      {isStock
                        ? `KES ${priceOrYtm?.toFixed(2)}`
                        : `${priceOrYtm?.toFixed(2)}%`}
                    </td>
                    <td
                      className={`py-1 px-2 text-right font-mono ${
                        (change ?? 0) >= 0 ? "text-accent-green" : "text-accent-red"
                      }`}
                    >
                      {(change ?? 0) >= 0 ? "+" : ""}
                      {(change ?? 0).toFixed(2)}%
                    </td>
                    <td className="py-1 px-2 text-right text-text-tertiary">
                      {formatVolume(vol ?? 0)}
                    </td>
                    <td className="py-1 px-2 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeItem(item.symbol, item.type);
                        }}
                        className="text-accent-red hover:text-accent-red text-xs"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
