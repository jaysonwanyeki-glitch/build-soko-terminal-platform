"use client";

import type { MarketSummary } from "@/app/page";

interface Props {
  marketSummary: MarketSummary | null;
  formatMarketCap: (cap: number) => string;
}

export function TopBar({ marketSummary, formatMarketCap }: Props) {
  return (
    <div className="h-9 bg-surface-1 border-b border-border-subtle flex items-center px-4 text-[11px] gap-5">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded bg-gradient-to-br from-accent-green to-accent-cyan flex items-center justify-center text-[9px] font-black text-text-inverse">
          S
        </div>
        <span className="text-text-primary font-semibold tracking-tight text-xs">
          SOKO
        </span>
        <span className="text-text-tertiary text-[10px] font-normal hidden sm:inline">
          Terminal
        </span>
      </div>

      <span className="w-px h-4 bg-border-default" />

      {/* Live Indices */}
      {marketSummary?.indices.slice(0, 4).map((idx) => (
        <div key={idx.symbol} className="flex items-center gap-2">
          <span className="text-text-tertiary text-[10px] font-medium">
            {idx.symbol}
          </span>
          <span className="text-text-primary mono text-xs font-semibold">
            {idx.value.toFixed(2)}
          </span>
          <span
            className={`mono text-[10px] font-medium ${
              idx.change >= 0 ? "text-accent-green" : "text-accent-red"
            }`}
          >
            {idx.change >= 0 ? "+" : ""}
            {idx.changePercent.toFixed(2)}%
          </span>
        </div>
      ))}

      <span className="w-px h-4 bg-border-default" />

      {/* Market Stats */}
      {marketSummary && (
        <div className="flex items-center gap-4 text-[10px]">
          <span className="text-text-tertiary">
            MCap{" "}
            <span className="text-text-secondary font-medium">
              {formatMarketCap(marketSummary.totalMarketCap)}
            </span>
          </span>
          <span className="text-text-tertiary">
            Vol{" "}
            <span className="text-text-secondary font-medium">
              {(marketSummary.totalVolume / 1_000_000).toFixed(0)}M
            </span>
          </span>
        </div>
      )}

      {/* Right side — clock + status */}
      <div className="ml-auto flex items-center gap-3">
        <span className="text-text-tertiary text-[10px] hidden sm:inline">
          NSE · EAT
        </span>
        <span className="mono text-text-secondary text-[11px] font-medium">
          {new Date().toLocaleTimeString("en-KE", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            timeZone: "Africa/Nairobi",
          })}
        </span>
        <span className="w-1.5 h-1.5 rounded-full bg-accent-green live-dot" />
      </div>
    </div>
  );
}
