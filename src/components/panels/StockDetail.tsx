"use client";

import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { Stock } from "@/app/page";

interface Props {
  stock: Stock;
  onClose: () => void;
  formatMarketCap: (cap: number) => string;
  formatVolume: (vol: number) => string;
  formatKES: (val: number) => string;
}

export function StockDetail({ stock, onClose, formatMarketCap, formatVolume, formatKES }: Props) {
  const [activeTab, setActiveTab] = useState<"overview" | "chart" | "fundamentals">("overview");

  const chartData = Array.from({ length: 20 }, (_, i) => {
    const baseHour = 9 + Math.floor(i / 4);
    const baseMin = (i % 4) * 15;
    const timeStr = `${baseHour.toString().padStart(2, "0")}:${baseMin.toString().padStart(2, "0")}`;
    const volatility = stock.changePercent / 100;
    const randomWalk = stock.prevClose * (1 + volatility * Math.sin(i * 0.8) + (Math.random() - 0.5) * volatility * 2);
    return { time: timeStr, price: +randomWalk.toFixed(2), volume: Math.floor(stock.volume / 20 * (0.5 + Math.random())) };
  });
  if (chartData.length > 0) chartData[chartData.length - 1].price = stock.lastPrice;

  return (
    <div className="h-full flex flex-col p-3.5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-accent-cyan font-bold text-sm">{stock.symbol}</div>
          <div className="text-[10px] text-text-tertiary truncate max-w-[260px]">{stock.name}</div>
        </div>
        <button onClick={onClose} className="text-text-tertiary hover:text-accent-red text-xs px-2 py-1 rounded border border-border-subtle hover:border-accent-red transition-colors">✕</button>
      </div>

      <div className="mb-3">
        <div className="text-2xl font-bold text-text-primary mono">KES {stock.lastPrice.toFixed(2)}</div>
        <div className={`text-sm font-semibold mono ${stock.change >= 0 ? "text-accent-green" : "text-accent-red"}`}>
          {stock.change >= 0 ? "+" : ""}{stock.change.toFixed(2)} ({stock.changePercent >= 0 ? "+" : ""}{stock.changePercent.toFixed(2)}%)
        </div>
      </div>

      <div className="flex border-b border-border-subtle mb-3">
        {(["overview","chart","fundamentals"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`text-[10px] px-3 py-1.5 uppercase tracking-wider font-medium transition-colors ${
              activeTab === tab ? "text-accent-green border-b-2 border-accent-green" : "text-text-tertiary hover:text-text-secondary"}`}>{tab}</button>
        ))}
      </div>

      <div className="flex-1 overflow-auto">
        {activeTab === "overview" && (
          <div className="space-y-1.5 text-[11px]">
            <Row label="Open" value={stock.prevClose.toFixed(2)} />
            <Row label="Day High" value={stock.dayHigh.toFixed(2)} />
            <Row label="Day Low" value={stock.dayLow.toFixed(2)} />
            <Row label="52W High" value={stock.yearHigh.toFixed(2)} />
            <Row label="52W Low" value={stock.yearLow.toFixed(2)} />
            <Row label="Volume" value={formatVolume(stock.volume)} />
            <Row label="Turnover" value={`KES ${formatKES(stock.turnover)}`} />
            <Row label="Market Cap" value={formatMarketCap(stock.marketCap)} />
            <Row label="Exchange" value={stock.exchange} />
            <Row label="Sector" value={stock.sector} />
          </div>
        )}
        {activeTab === "chart" && (
          <div>
            <div className="text-[10px] text-text-tertiary font-medium mb-1">Intraday Price</div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" tick={{ fontSize: 8, fill: "#6b7280" }} axisLine={{ stroke: "#262d3a" }} tickLine={false} />
                <YAxis domain={["auto","auto"]} tick={{ fontSize: 8, fill: "#6b7280" }} axisLine={{ stroke: "#262d3a" }} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "#13161c", border: "1px solid #262d3a", fontSize: 10, color: "#e8eaed", borderRadius: "8px" }} />
                <Area type="monotone" dataKey="price" stroke="#10b981" fill="url(#colorPrice)" strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
        {activeTab === "fundamentals" && (
          <div className="space-y-1.5 text-[11px]">
            <Row label="P/E Ratio" value={stock.peRatio.toFixed(1)} />
            <Row label="EPS" value={`KES ${stock.eps.toFixed(2)}`} />
            <Row label="Dividend Yield" value={stock.dividendYield > 0 ? `${stock.dividendYield.toFixed(1)}%` : "N/A"} />
            <Row label="Shares Outstanding" value={formatKES(stock.sharesOutstanding)} />
            <div className="border-t border-border-subtle pt-2 mt-2">
              <div className="text-[10px] text-text-tertiary font-medium mb-1">Valuation</div>
              <Row label="Market Cap" value={formatMarketCap(stock.marketCap)} />
              <Row label="Price/Book" value={(stock.lastPrice / (stock.eps * 2 || 1)).toFixed(1)} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1">
      <span className="text-text-tertiary">{label}</span>
      <span className="text-text-secondary mono">{value}</span>
    </div>
  );
}
