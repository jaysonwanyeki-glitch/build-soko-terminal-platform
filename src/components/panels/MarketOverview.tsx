"use client";

import type { Stock, Bond, MarketSummary } from "@/app/page";

interface Props {
  summary: MarketSummary | null;
  onSelectStock: (stock: Stock) => void;
  onSelectBond: (bond: Bond) => void;
  formatMarketCap: (cap: number) => string;
  formatVolume: (vol: number) => string;
  formatKES: (val: number) => string;
}

export function MarketOverview({
  summary,
  onSelectStock,
  formatMarketCap,
  formatVolume,
  formatKES,
}: Props) {
  if (!summary) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-text-tertiary text-sm animate-pulse">
          Loading market data...
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-accent-green live-dot" />
        <h2 className="text-sm font-semibold text-text-primary tracking-tight">
          Market Overview
        </h2>
        <span className="text-[10px] text-text-tertiary ml-2">
          Nairobi Securities Exchange
        </span>
      </div>

      {/* Indices Row */}
      <div className="grid grid-cols-4 gap-3">
        {summary.indices.map((idx) => (
          <div
            key={idx.id}
            className="bg-surface-1 border border-border-subtle rounded-lg p-3.5 card-lift"
          >
            <div className="text-[10px] text-text-tertiary font-medium">
              {idx.name}
            </div>
            <div className="text-xl font-bold text-text-primary mt-1 mono tracking-tight">
              {idx.value.toFixed(2)}
            </div>
            <div
              className={`text-[11px] font-semibold mt-1 mono ${
                idx.change >= 0 ? "text-accent-green" : "text-accent-red"
              }`}
            >
              {idx.change >= 0 ? "+" : ""}
              {idx.change.toFixed(2)} ({idx.changePercent >= 0 ? "+" : ""}
              {idx.changePercent.toFixed(2)}%)
            </div>
          </div>
        ))}
      </div>

      {/* Market Metrics */}
      <div className="grid grid-cols-5 gap-3">
        <StatBox label="Total Mkt Cap" value={formatMarketCap(summary.totalMarketCap)} />
        <StatBox label="Listed Stocks" value={summary.stockCount.toString()} />
        <StatBox label="Bonds Listed" value={summary.bondCount.toString()} />
        <StatBox label="Bond Avg YTM" value={`${summary.bondYieldAvg.toFixed(2)}%`} accent />
        <StatBox label="Day Volume" value={`${(summary.totalVolume / 1_000_000).toFixed(1)}M`} />
      </div>

      {/* 3-column layout */}
      <div className="grid grid-cols-3 gap-3">
        {/* Top Gainers */}
        <div className="bg-surface-1 border border-border-subtle rounded-lg p-3">
          <div className="text-[10px] text-accent-green font-semibold mb-2.5 tracking-wide uppercase flex items-center gap-1.5">
            <span>▲</span> Top Gainers
          </div>
          {summary.gainers.map((s) => (
            <div
              key={s.id}
              className="flex justify-between items-center py-1.5 border-b border-border-subtle last:border-0 cursor-pointer row-hover hover:bg-surface-2/50 rounded px-1 text-[11px]"
              onClick={() => onSelectStock(s)}
            >
              <span className="text-accent-cyan font-semibold w-14">{s.symbol}</span>
              <span className="text-text-secondary mono">{s.lastPrice.toFixed(2)}</span>
              <span className="text-accent-green mono font-semibold">+{s.changePercent.toFixed(2)}%</span>
            </div>
          ))}
        </div>

        {/* Top Losers */}
        <div className="bg-surface-1 border border-border-subtle rounded-lg p-3">
          <div className="text-[10px] text-accent-red font-semibold mb-2.5 tracking-wide uppercase flex items-center gap-1.5">
            <span>▼</span> Top Losers
          </div>
          {summary.losers.map((s) => (
            <div
              key={s.id}
              className="flex justify-between items-center py-1.5 border-b border-border-subtle last:border-0 cursor-pointer row-hover hover:bg-surface-2/50 rounded px-1 text-[11px]"
              onClick={() => onSelectStock(s)}
            >
              <span className="text-accent-cyan font-semibold w-14">{s.symbol}</span>
              <span className="text-text-secondary mono">{s.lastPrice.toFixed(2)}</span>
              <span className="text-accent-red mono font-semibold">{s.changePercent.toFixed(2)}%</span>
            </div>
          ))}
        </div>

        {/* Most Active */}
        <div className="bg-surface-1 border border-border-subtle rounded-lg p-3">
          <div className="text-[10px] text-accent-blue font-semibold mb-2.5 tracking-wide uppercase flex items-center gap-1.5">
            <span>●</span> Most Active
          </div>
          {summary.mostActive.map((s) => (
            <div
              key={s.id}
              className="flex justify-between items-center py-1.5 border-b border-border-subtle last:border-0 cursor-pointer row-hover hover:bg-surface-2/50 rounded px-1 text-[11px]"
              onClick={() => onSelectStock(s)}
            >
              <span className="text-accent-cyan font-semibold w-14">{s.symbol}</span>
              <span className="text-text-secondary mono">{s.lastPrice.toFixed(2)}</span>
              <span className="text-text-tertiary mono">{formatVolume(s.volume)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bond Market Summary */}
      <div className="bg-surface-1 border border-border-subtle rounded-lg p-3.5">
        <div className="text-[10px] text-accent-amber font-semibold mb-2 tracking-wide uppercase">
          Bond Market Snapshot
        </div>
        <div className="grid grid-cols-3 gap-6 text-[11px]">
          <div>
            <span className="text-text-tertiary">Outstanding </span>
            <span className="text-text-primary font-semibold mono">
              KES {formatKES(summary.bondTotalOutstanding)}
            </span>
          </div>
          <div>
            <span className="text-text-tertiary">Avg Yield </span>
            <span className="text-accent-green font-semibold mono">
              {summary.bondYieldAvg.toFixed(2)}%
            </span>
          </div>
          <div>
            <span className="text-text-tertiary">Bonds Listed </span>
            <span className="text-text-primary font-semibold mono">
              {summary.bondCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-surface-1 border border-border-subtle rounded-lg p-3 text-center">
      <div className="text-[9px] text-text-tertiary font-medium">{label}</div>
      <div className={`text-sm font-bold mt-1 mono ${accent ? "text-accent-green" : "text-text-primary"}`}>
        {value}
      </div>
    </div>
  );
}
