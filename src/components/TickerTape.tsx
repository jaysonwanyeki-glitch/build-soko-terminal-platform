"use client";

import type { Stock, Bond } from "@/app/page";

interface Props {
  stocks: Stock[];
  bonds: Bond[];
}

export function TickerTape({ stocks, bonds }: Props) {
  const topMovers = [...stocks]
    .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
    .slice(0, 15);

  const topBonds = [...bonds]
    .sort((a, b) => Math.abs(b.yieldChange) - Math.abs(a.yieldChange))
    .slice(0, 5);

  const tickerItems = [
    ...topMovers.map((s) => ({
      label: s.symbol,
      value: s.lastPrice.toFixed(2),
      change: s.changePercent,
      prefix: "KES",
      isStock: true,
    })),
    ...topBonds.map((b) => ({
      label: b.symbol.replace("FXD1/", "").replace("FXD2/", ""),
      value: b.yieldToMaturity.toFixed(2) + "%",
      change: -b.yieldChange,
      prefix: "YTM",
      isStock: false,
    })),
  ];

  const doubled = [...tickerItems, ...tickerItems];

  return (
    <div className="h-7 bg-surface-0 border-b border-border-subtle overflow-hidden flex items-center">
      <div className="ticker-track flex items-center whitespace-nowrap">
        {doubled.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1.5 px-3 text-[10px]"
          >
            <span className="text-accent-cyan font-semibold tracking-wide">
              {item.label}
            </span>
            <span className="text-text-tertiary text-[9px]">
              {item.prefix}
            </span>
            <span className="text-text-secondary mono font-medium">
              {item.value}
            </span>
            <span
              className={`mono text-[10px] font-semibold ${
                item.change >= 0 ? "text-accent-green" : "text-accent-red"
              }`}
            >
              {item.change >= 0 ? "▲" : "▼"}{" "}
              {Math.abs(item.change).toFixed(2)}%
            </span>
            <span className="text-border-default mx-1">|</span>
          </span>
        ))}
      </div>
    </div>
  );
}
