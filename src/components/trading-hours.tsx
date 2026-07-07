"use client";

import { useEffect, useState } from "react";
import { hourInfo, TIER_META, TRADING_WINDOWS, eatHour, eatClock, sessionStatus } from "@/lib/trading-hours";
import { Panel, Tag } from "@/components/ui";
import { classNames } from "@/lib/format";

export function LiquidityChart({ height = 160 }: { height?: number }) {
  const [hour, setHour] = useState<number | null>(null);
  const [clock, setClock] = useState<{ hh: string; mm: string } | null>(null);
  useEffect(() => {
    const tick = () => {
      setHour(eatHour());
      setClock(eatClock());
    };
    tick();
    const t = setInterval(tick, 15000);
    return () => clearInterval(t);
  }, []);

  const hours = hourInfo();
  const sess = hour != null ? sessionStatus() : null;

  return (
    <div>
      {/* status line */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-3">
        <div className="flex items-center gap-2">
          <span
            className={classNames(
              "inline-block h-2 w-2 rounded-full",
              sess?.open ? "bg-up animate-pulse-dot" : "bg-down"
            )}
          />
          <span className="mono text-[11px] font-bold uppercase tracking-wider text-fg">
            {sess?.label ?? "NSE"}
          </span>
          {sess?.window && <span className="mono text-[10px] text-dim">· {sess.window}</span>}
        </div>
        <div className="mono tnum text-xs text-amber">
          {clock ? `${clock.hh}:${clock.mm}` : "--:--"} <span className="text-[9px] text-dim">EAT</span>
        </div>
      </div>

      {/* bars */}
      <div className="px-4 pt-4">
        <div className="flex items-end gap-[3px]" style={{ height }}>
          {hours.map((h) => {
            const isNow = hour === h.hour;
            const barH = Math.max(3, (h.intensity / 100) * (height - 28));
            const color = TIER_META[h.tier].color;
            return (
              <div key={h.hour} className="group relative flex flex-1 flex-col items-center justify-end">
                {/* tooltip */}
                <div className="pointer-events-none absolute -top-1 z-10 hidden -translate-y-full flex-col items-center group-hover:flex">
                  <div className="mono whitespace-nowrap rounded border border-line bg-term-850 px-2 py-1 text-[9px] text-fg shadow-lg">
                    {h.label} · {h.intensity}%
                  </div>
                </div>
                <div
                  className={classNames(
                    "w-full rounded-t-sm transition-all",
                    isNow && "ring-2 ring-amber ring-offset-1 ring-offset-term-950"
                  )}
                  style={{ height: barH, background: color, opacity: isNow ? 1 : 0.82 }}
                />
                {(h.hour % 2 === 0) && (
                  <span
                    className={classNames(
                      "mono mt-1 text-[8px]",
                      isNow ? "font-bold text-amber" : "text-dim"
                    )}
                  >
                    {String(h.hour).padStart(2, "0")}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
        {(Object.keys(TIER_META) as Array<keyof typeof TIER_META>).map((k) => (
          <span key={k} className="flex items-center gap-1.5 text-[10px] text-muted">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: TIER_META[k].color }} />
            {TIER_META[k].label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function TradingWindows() {
  const winTone: Record<string, "amber" | "green" | "cyan"> = {
    NSE: "amber",
    FX: "cyan",
    GLOBAL: "green",
  };
  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
      {TRADING_WINDOWS.map((w) => (
        <Panel key={w.name} className="p-4">
          <div className="flex items-center justify-between">
            <Tag tone={winTone[w.tag] ?? "amber"}>{w.tag}</Tag>
            <span
              className="mono tnum text-[10px] font-semibold"
              style={{ color: TIER_META[w.tier].color }}
            >
              {w.tier.toUpperCase()}
            </span>
          </div>
          <h3 className="mt-2 text-sm font-bold text-fg">{w.name}</h3>
          <div className="mono tnum mt-1 text-lg font-black text-amber">{w.time}</div>
          <p className="mt-1.5 text-[11px] leading-relaxed text-muted">{w.detail}</p>
        </Panel>
      ))}
    </div>
  );
}
