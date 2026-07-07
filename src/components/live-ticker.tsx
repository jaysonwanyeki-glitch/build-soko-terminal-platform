"use client";

import { useEffect, useRef, useState } from "react";
import { num, classNames } from "@/lib/format";

type Tick = { s: string; p: number; c: number };

export function LivePriceTicker({ symbols }: { symbols: string[] }) {
  const [prices, setPrices] = useState<Map<string, Tick>>(new Map());
  const [connected, setConnected] = useState(false);
  const prevPrices = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    let es: EventSource | null = null;
    try {
      es = new EventSource("/api/prices/stream");
      es.onopen = () => setConnected(true);
      es.onerror = () => setConnected(false);
      es.onmessage = (ev) => {
        try {
          const ticks: Tick[] = JSON.parse(ev.data);
          setPrices((prev) => {
            const next = new Map(prev);
            for (const t of ticks) {
              next.set(t.s, t);
              prevPrices.current.set(t.s, t.p);
            }
            return next;
          });
        } catch {
          // ignore parse errors
        }
      };
    } catch {
      // SSE not supported
    }
    return () => es?.close();
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {(symbols ?? []).slice(0, 8).map((sym) => {
        const tick = prices.get(sym);
        const prev = prevPrices.current.get(sym);
        const flash = tick && prev != null && tick.p !== prev;
        const dir = tick && prev != null ? (tick.p > prev ? "up" : tick.p < prev ? "down" : "flat") : "flat";
        return (
          <div
            key={sym}
            className={classNames(
              "mono chip transition-colors duration-300",
              flash && dir === "up" && "border-up/50 bg-up/10",
              flash && dir === "down" && "border-down/50 bg-down/10"
            )}
          >
            <span className="text-[10px] font-bold text-fg">{sym}</span>
            <span className={classNames("tnum text-[10px]", (tick?.c ?? 0) >= 0 ? "text-up" : "text-down")}>
              {tick ? num(tick.p, tick.p < 1 ? 6 : 2) : "—"}
            </span>
          </div>
        );
      })}
      <span className={classNames("mono ml-1 flex items-center gap-1 text-[9px]", connected ? "text-up" : "text-dim")}>
        <span className={classNames("inline-block h-1.5 w-1.5 rounded-full", connected ? "bg-up animate-pulse-dot" : "bg-dim")} />
        {connected ? "LIVE" : "connecting…"}
      </span>
    </div>
  );
}
