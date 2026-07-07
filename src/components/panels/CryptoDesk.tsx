"use client";

import { useState, useMemo, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface CryptoAsset {
  id: number;
  symbol: string;
  name: string;
  category: string;
  lastPriceKes: number;
  lastPriceUsd: number;
  changePercent24h: number;
  volume24hKes: number;
  marketCapKes: number;
  high24h: number;
  low24h: number;
  circulatingSupply: number;
  maxSupply: number;
  rank: number;
  mpesaBuyEnabled: boolean;
  mpesaSellEnabled: boolean;
  updatedAt: string;
}

interface Props {
  onMpesaBuy: (assetType: string, symbol: string, price: number, name: string) => void;
  formatKES: (val: number) => string;
}

type SortKey = keyof CryptoAsset;

export function CryptoDesk({ onMpesaBuy, formatKES }: Props) {
  const [crypto, setCrypto] = useState<CryptoAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  useEffect(() => {
    fetch("/api/market/crypto?limit=50")
      .then((r) => r.json())
      .then((json) => {
        setCrypto(json.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const set = new Set(crypto.map((c) => c.category));
    return ["ALL", ...Array.from(set).sort()];
  }, [crypto]);

  const filtered = useMemo(() => {
    let result = [...crypto];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.symbol.toLowerCase().includes(q) ||
          c.name.toLowerCase().includes(q)
      );
    }
    if (categoryFilter !== "ALL") {
      result = result.filter((c) => c.category === categoryFilter);
    }
    result.sort((a, b) => {
      const aVal = a[sortKey] ?? 0;
      const bVal = b[sortKey] ?? 0;
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDir === "asc"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });
    return result;
  }, [crypto, search, categoryFilter, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  // Sparkline data (simulated mini chart per row)
  const Sparkline = ({ price, change }: { price: number; change: number }) => {
    const data = Array.from({ length: 12 }, (_, i) => ({
      v: price * (1 - change / 100 * 0.5 + (Math.sin(i * 0.8) * change / 100 * 0.8)),
    }));
    return (
      <ResponsiveContainer width={70} height={24}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`spark-${price}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={change >= 0 ? "#22c55e" : "#ef4444"} stopOpacity={0.3} />
              <stop offset="95%" stopColor={change >= 0 ? "#22c55e" : "#ef4444"} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={change >= 0 ? "#22c55e" : "#ef4444"}
            fill={`url(#spark-${price})`}
            strokeWidth={1}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  const categoryColors: Record<string, string> = {
    Layer1: "text-accent-blue",
    Stablecoin: "text-accent-amber",
    DeFi: "text-accent-purple",
    Meme: "text-pink-400",
    Exchange: "text-accent-cyan",
    Infrastructure: "text-accent-green",
    Layer2: "text-orange-400",
    Metaverse: "text-indigo-400",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-text-tertiary">
        Loading crypto markets...
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 mb-2">
        <div className="text-xs text-amber-400 font-semibold tracking-wider">
          🪙 CRYPTO DESK — Kenya's First M-Pesa Crypto Terminal
        </div>
        <div className="text-[10px] text-text-tertiary">
          {filtered.length} assets • All prices in KES
        </div>
        <div className="flex-1" />
        <input
          type="text"
          placeholder="Search coin..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-surface-2 border border-border-subtle text-accent-green text-[11px] px-2 py-1 rounded w-40 focus:outline-none focus:border-accent-green"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-surface-2 border border-border-subtle text-text-secondary text-[10px] px-2 py-1 rounded"
        >
          {categories.map((c) => (
            <option key={c} value={c}>{c === "ALL" ? "All Categories" : c}</option>
          ))}
        </select>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-[11px] border-collapse">
          <thead className="sticky top-0 bg-surface-1 z-10">
            <tr className="border-b border-border-subtle text-text-tertiary">
              <th className="text-center px-1 py-1.5 w-8">#</th>
              <th className="text-left px-2 py-1.5 cursor-pointer hover:text-text-secondary" onClick={() => handleSort("symbol")}>
                Coin
              </th>
              <th className="text-right px-2 py-1.5 cursor-pointer hover:text-text-secondary" onClick={() => handleSort("lastPriceKes")}>
                Price (KES)
              </th>
              <th className="text-right px-2 py-1.5 cursor-pointer hover:text-text-secondary" onClick={() => handleSort("changePercent24h")}>
                24h Chg%
              </th>
              <th className="text-center px-1 py-1.5" style={{ width: 70 }}>
                7D
              </th>
              <th className="text-right px-2 py-1.5 cursor-pointer hover:text-text-secondary" onClick={() => handleSort("marketCapKes")}>
                Mkt Cap
              </th>
              <th className="text-right px-2 py-1.5 cursor-pointer hover:text-text-secondary" onClick={() => handleSort("volume24hKes")}>
                Vol 24h
              </th>
              <th className="text-center px-2 py-1.5">
                M-Pesa
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr
                key={c.id}
                className="border-b border-[#151515] hover:bg-[#111811] transition-colors"
              >
                <td className="px-1 py-1.5 text-center text-text-tertiary text-[10px]">
                  {c.rank}
                </td>
                <td className="px-2 py-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-accent-cyan font-semibold">{c.symbol}</span>
                    <span className="text-text-tertiary text-[10px]">{c.name}</span>
                    <span className={`text-[9px] ${categoryColors[c.category] ?? "text-text-tertiary"}`}>
                      {c.category}
                    </span>
                  </div>
                </td>
                <td className="px-2 py-1.5 text-right text-text-primary font-mono">
                  KES {c.lastPriceKes.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td
                  className={`px-2 py-1.5 text-right font-mono font-semibold ${
                    c.changePercent24h >= 0 ? "text-accent-green" : "text-accent-red"
                  }`}
                >
                  {c.changePercent24h >= 0 ? "+" : ""}
                  {c.changePercent24h.toFixed(2)}%
                </td>
                <td className="px-1 py-1.5">
                  <Sparkline price={c.lastPriceKes} change={c.changePercent24h} />
                </td>
                <td className="px-2 py-1.5 text-right text-text-secondary">
                  KES {formatKES(c.marketCapKes)}
                </td>
                <td className="px-2 py-1.5 text-right text-text-tertiary">
                  KES {formatKES(c.volume24hKes)}
                </td>
                <td className="px-2 py-1.5 text-center">
                  {c.mpesaBuyEnabled ? (
                    <button
                      onClick={() => onMpesaBuy("CRYPTO", c.symbol, c.lastPriceKes, c.name)}
                      className="text-[9px] bg-accent-green/50 text-accent-green border border-accent-green px-2 py-0.5 rounded hover:bg-green-800/50 transition-colors"
                    >
                      Buy
                    </button>
                  ) : (
                    <span className="text-[9px] text-text-tertiary">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
