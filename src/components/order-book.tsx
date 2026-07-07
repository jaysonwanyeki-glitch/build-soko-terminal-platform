"use client";

import { useEffect, useState } from "react";
import { buildOrderBook, type OrderBook } from "@/lib/market-depth";
import { num, compact, classNames } from "@/lib/format";

export function OrderBook({ symbol, price }: { symbol: string; price: number }) {
  const [book, setBook] = useState<OrderBook | null>(null);

  useEffect(() => {
    const gen = () => setBook(buildOrderBook(symbol, price));
    gen();
    const t = setInterval(gen, 3500); // refresh like a live feed
    return () => clearInterval(t);
  }, [symbol, price]);

  if (!book) return <div className="p-4 text-xs text-dim">Loading depth…</div>;

  const maxSize = Math.max(
    ...book.bids.map((b) => b.size),
    ...book.asks.map((a) => a.size)
  );

  const Row = ({ o, side }: { o: (typeof book.asks)[number]; side: "bid" | "ask" }) => {
    const isBid = side === "bid";
    const pct = (o.size / maxSize) * 100;
    return (
      <div className="relative flex items-center justify-between px-3 py-1 text-[11px]">
        <div
          className={classNames(
            "absolute inset-y-0 right-0 rounded-sm",
            isBid ? "bg-up/10" : "bg-down/10"
          )}
          style={{ width: `${pct}%` }}
        />
        <span className={classNames("mono tnum relative z-10 font-semibold", isBid ? "text-up" : "text-down")}>
          {num(o.price)}
        </span>
        <span className="mono tnum relative z-10 text-muted">{compact(o.size)}</span>
        <span className="mono tnum relative z-10 text-dim">{compact(o.total)}</span>
      </div>
    );
  };

  return (
    <div>
      <div className="mono flex items-center justify-between px-3 pb-1 pt-1 text-[9px] uppercase tracking-wider text-dim">
        <span>Price</span>
        <span>Size</span>
        <span>Total</span>
      </div>
      {/* asks (reversed so best ask is at bottom near spread) */}
      <div className="flex flex-col-reverse">
        {book.asks.map((o, i) => (
          <Row key={"a" + i} o={o} side="ask" />
        ))}
      </div>
      {/* spread */}
      <div className="my-1 flex items-center justify-between border-y border-line-soft bg-term-850/60 px-3 py-1.5">
        <span className="mono tnum text-sm font-bold text-fg">{num(book.lastPrice)}</span>
        <span className="mono text-[10px] text-dim">
          spread {num(book.spread)} ({book.spreadPct.toFixed(2)}%)
        </span>
      </div>
      {/* bids */}
      <div className="flex flex-col">
        {book.bids.map((o, i) => (
          <Row key={"b" + i} o={o} side="bid" />
        ))}
      </div>
    </div>
  );
}
