"use client";

import type { TickerItem } from "@/db/queries";

function Row({ items }: { items: TickerItem[] }) {
  return (
    <div className="flex shrink-0 items-center">
      {items.map((it) => {
        const up = it.changePct >= 0;
        return (
          <span
            key={it.symbol}
            className="mono flex items-center gap-1.5 border-r border-line-soft px-3 py-1.5 text-[11px]"
          >
            <span className="font-semibold text-fg">{it.symbol}</span>
            <span className="tnum text-muted">{it.price.toFixed(2)}</span>
            <span className={up ? "tnum text-up" : "tnum text-down"}>
              {up ? "▲" : "▼"} {Math.abs(it.changePct).toFixed(2)}%
            </span>
          </span>
        );
      })}
    </div>
  );
}

export function MarketTicker({ items }: { items: TickerItem[] }) {
  if (!items.length) return null;
  return (
    <div className="ticker-wrap relative h-8 overflow-hidden border-b border-line bg-term-900">
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-8 bg-gradient-to-r from-term-900 to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-8 bg-gradient-to-l from-term-900 to-transparent" />
      <div className="flex h-8 w-max animate-ticker items-center">
        <Row items={items} />
        <Row items={items} />
      </div>
    </div>
  );
}
