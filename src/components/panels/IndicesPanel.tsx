"use client";

import type { Stock, IndexData } from "@/app/page";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Props {
  indices: IndexData[];
  stocks: Stock[];
  formatMarketCap: (cap: number) => string;
  formatKES: (val: number) => string;
}

export function IndicesPanel({
  indices,
  stocks,
  formatMarketCap,
  formatKES,
}: Props) {
  // Simulated historical data for indices
  const historyData = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return {
      date: date.toLocaleDateString("en-KE", { day: "numeric", month: "short" }),
      nse20: 2200 + Math.sin(i * 0.3) * 30 + i * 1.2,
      nasi: 125 + Math.sin(i * 0.4) * 2 + i * 0.1,
    };
  });

  // Sector breakdown
  const sectorMap = new Map<string, { count: number; mcap: number }>();
  stocks.forEach((s) => {
    const existing = sectorMap.get(s.sector) ?? { count: 0, mcap: 0 };
    existing.count++;
    existing.mcap += s.marketCap;
    sectorMap.set(s.sector, existing);
  });
  const sectorData = Array.from(sectorMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.mcap - a.mcap);

  const totalMcap = stocks.reduce((s, st) => s + st.marketCap, 0);

  const gainersCount = stocks.filter((s) => s.changePercent > 0).length;
  const losersCount = stocks.filter((s) => s.changePercent < 0).length;
  const unchanged = stocks.length - gainersCount - losersCount;

  return (
    <div className="h-full overflow-auto space-y-3">
      <div className="text-xs text-amber-400 font-semibold tracking-wider">
        INDICES & MARKET ANALYTICS
      </div>

      {/* Index Cards */}
      <div className="grid grid-cols-4 gap-2">
        {indices.map((idx) => (
          <div
            key={idx.id}
            className="bg-surface-1 border border-border-subtle rounded p-3"
          >
            <div className="text-[9px] text-text-tertiary">{idx.symbol}</div>
            <div className="text-xs text-text-tertiary">{idx.name}</div>
            <div className="text-lg font-bold text-text-primary mt-1">
              {idx.value.toFixed(2)}
            </div>
            <div
              className={`text-[11px] ${
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

      {/* Index Charts */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface-1 border border-border-subtle rounded p-3">
          <div className="text-[10px] text-text-tertiary mb-1">NSE 20 INDEX (30D)</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={historyData}>
              <defs>
                <linearGradient id="nse20Grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#eab308" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 8, fill: "#6b7280" }}
                axisLine={{ stroke: "#1f2937" }}
                tickLine={false}
                interval={5}
              />
              <YAxis
                tick={{ fontSize: 8, fill: "#6b7280" }}
                axisLine={{ stroke: "#1f2937" }}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#111111",
                  border: "1px solid #1f2937",
                  fontSize: 10,
                  color: "#d1d5db",
                }}
              />
              <Area
                type="monotone"
                dataKey="nse20"
                stroke="#eab308"
                fill="url(#nse20Grad)"
                strokeWidth={1.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-surface-1 border border-border-subtle rounded p-3">
          <div className="text-[10px] text-text-tertiary mb-1">NASI ALL SHARE (30D)</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={historyData}>
              <defs>
                <linearGradient id="nasiGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 8, fill: "#6b7280" }}
                axisLine={{ stroke: "#1f2937" }}
                tickLine={false}
                interval={5}
              />
              <YAxis
                tick={{ fontSize: 8, fill: "#6b7280" }}
                axisLine={{ stroke: "#1f2937" }}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#111111",
                  border: "1px solid #1f2937",
                  fontSize: 10,
                  color: "#d1d5db",
                }}
              />
              <Area
                type="monotone"
                dataKey="nasi"
                stroke="#3b82f6"
                fill="url(#nasiGrad)"
                strokeWidth={1.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Market Breadth */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-surface-1 border border-border-subtle rounded p-3 text-center">
          <div className="text-[10px] text-text-tertiary">Advancers</div>
          <div className="text-xl font-bold text-accent-green">{gainersCount}</div>
        </div>
        <div className="bg-surface-1 border border-border-subtle rounded p-3 text-center">
          <div className="text-[10px] text-text-tertiary">Decliners</div>
          <div className="text-xl font-bold text-accent-red">{losersCount}</div>
        </div>
        <div className="bg-surface-1 border border-border-subtle rounded p-3 text-center">
          <div className="text-[10px] text-text-tertiary">Unchanged</div>
          <div className="text-xl font-bold text-text-secondary">{unchanged}</div>
        </div>
      </div>

      {/* Sector Breakdown */}
      <div className="bg-surface-1 border border-border-subtle rounded p-3">
        <div className="text-[10px] text-text-tertiary mb-2">SECTOR BREAKDOWN BY MARKET CAP</div>
        {sectorData.map((sec) => (
          <div key={sec.name} className="mb-1.5">
            <div className="flex justify-between text-[10px] mb-0.5">
              <span className="text-text-secondary">{sec.name}</span>
              <span className="text-text-tertiary">
                {sec.count} stocks | {formatMarketCap(sec.mcap)} ({(sec.mcap / totalMcap * 100).toFixed(1)}%)
              </span>
            </div>
            <div className="w-full h-1.5 bg-surface-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent-green rounded-full"
                style={{ width: `${(sec.mcap / totalMcap) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
