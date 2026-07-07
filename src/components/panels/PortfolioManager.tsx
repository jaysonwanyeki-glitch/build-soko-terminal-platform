"use client";

import { useState, useEffect } from "react";
import type { Stock, Bond, Portfolio, Holding, Transaction } from "@/app/page";
import { MpesaModal } from "@/components/MpesaModal";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
} from "recharts";

interface Props {
  portfolioId: number | null;
  portfolios: Portfolio[];
  stocks: Stock[];
  bonds: Bond[];
  onTradeComplete: () => void;
  onSelectStock: (stock: Stock) => void;
  onSelectBond: (bond: Bond) => void;
  formatKES: (val: number) => string;
  formatVolume: (vol: number) => string;
}

const COLORS = ["#22c55e", "#3b82f6", "#eab308", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#ec4899"];

export function PortfolioManager({
  portfolioId,
  portfolios,
  stocks,
  bonds,
  onTradeComplete,
  onSelectStock,
  onSelectBond,
  formatKES,
  formatVolume,
}: Props) {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(false);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [showMpesaModal, setShowMpesaModal] = useState(false);
  const [tradeType, setTradeType] = useState<"BUY" | "SELL">("BUY");
  const [tradeAssetType, setTradeAssetType] = useState<"STOCK" | "BOND" | "CRYPTO">("STOCK");
  const [tradeSymbol, setTradeSymbol] = useState("");
  const [tradeQuantity, setTradeQuantity] = useState("");
  const [tradePrice, setTradePrice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!portfolioId) return;
    fetchPortfolio();
  }, [portfolioId]);

  const fetchPortfolio = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/portfolio/${portfolioId}`);
      const json = await res.json();
      setPortfolio(json.data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleTrade = async () => {
    setError("");
    if (!tradeSymbol || !tradeQuantity || !tradePrice) {
      setError("Fill all fields");
      return;
    }
    const qty = parseFloat(tradeQuantity);
    const price = parseFloat(tradePrice);
    if (isNaN(qty) || qty <= 0) {
      setError("Invalid quantity");
      return;
    }
    if (isNaN(price) || price <= 0) {
      setError("Invalid price");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/portfolio/${portfolioId}/trade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: tradeType,
          assetType: tradeAssetType,
          assetSymbol: tradeSymbol,
          quantity: qty,
          price,
          fees: qty * price * 0.0021, // 0.21% NSE trading fee
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Trade failed");
      } else {
        setShowTradeModal(false);
        setTradeSymbol("");
        setTradeQuantity("");
        setTradePrice("");
        await fetchPortfolio();
        onTradeComplete();
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const openTrade = (type: "BUY" | "SELL", assetType: "STOCK" | "BOND" | "CRYPTO", symbol?: string) => {
    setTradeType(type);
    setTradeAssetType(assetType);
    setTradeSymbol(symbol ?? "");
    setTradeQuantity("");
    setTradePrice("");
    setError("");
    setShowTradeModal(true);
  };

  if (!portfolioId) {
    return (
      <div className="flex items-center justify-center h-full text-text-tertiary">
        No portfolio selected. Create one to get started.
      </div>
    );
  }

  if (loading && !portfolio) {
    return (
      <div className="flex items-center justify-center h-full text-text-tertiary">
        Loading portfolio...
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="flex items-center justify-center h-full text-text-tertiary">
        Portfolio not found
      </div>
    );
  }

  const holdings = (portfolio.holdings ?? []) as Holding[];
  const txns = (portfolio.transactions ?? []) as Transaction[];

  // Pie chart data
  const pieData = holdings.map((h) => ({
    name: h.assetSymbol,
    value: h.currentValue,
    type: h.assetType,
  }));

  // Performance data (simulated from transactions)
  const perfData = txns
    .filter((t) => t.type === "BUY" || t.type === "SELL")
    .slice(0, 20)
    .reverse()
    .map((t, i) => ({
      idx: i,
      value: t.totalAmount * (t.type === "BUY" ? -1 : 1),
    }));

  // Cumulative P&L
  let cumSum = portfolio.cashBalance;
  const cumPerf = perfData.map((p) => {
    cumSum += p.value;
    return { ...p, cumValue: cumSum };
  });

  const totalPL = portfolio.totalReturn;
  const totalPLPercent = portfolio.totalReturnPercent;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 mb-2">
        <div className="text-xs text-amber-400 font-semibold tracking-wider">
          PORTFOLIO: {portfolio.name}
        </div>
        <div className="flex-1" />
        <button
          onClick={() => openTrade("BUY", "STOCK")}
          className="text-[10px] bg-accent-green/40 text-accent-green border border-accent-green px-2 py-1 rounded hover:bg-accent-green/60"
        >
          + BUY
        </button>
        <button
          onClick={() => openTrade("SELL", "STOCK")}
          className="text-[10px] bg-accent-red/40 text-accent-red border border-accent-red px-2 py-1 rounded hover:bg-accent-red/60"
        >
          - SELL
        </button>
        <button
          onClick={() => setShowMpesaModal(true)}
          className="text-[10px] bg-accent-blue/40 text-accent-blue border border-accent-blue px-2 py-1 rounded hover:bg-accent-blue/60 flex items-center gap-1"
        >
          📱 M-PESA
        </button>
      </div>

      {/* Portfolio Summary Cards */}
      <div className="grid grid-cols-4 gap-2 mb-2">
        <SummaryCard
          label="Cash Balance"
          value={`KES ${formatKES(portfolio.cashBalance)}`}
          color="text-accent-blue"
        />
        <SummaryCard
          label="Total Invested"
          value={`KES ${formatKES(portfolio.totalInvested)}`}
          color="text-text-secondary"
        />
        <SummaryCard
          label="Current Value"
          value={`KES ${formatKES(portfolio.totalCurrentValue)}`}
          color="text-accent-green"
        />
        <SummaryCard
          label="Total P&L"
          value={`KES ${formatKES(totalPL)}`}
          sub={`${totalPLPercent >= 0 ? "+" : ""}${totalPLPercent.toFixed(2)}%`}
          color={totalPL >= 0 ? "text-accent-green" : "text-accent-red"}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 flex-1 overflow-hidden">
        {/* Holdings */}
        <div className="overflow-auto">
          <div className="text-[10px] text-text-tertiary mb-1 tracking-wider">
            HOLDINGS ({holdings.length})
          </div>
          {holdings.length === 0 ? (
            <div className="text-[10px] text-text-tertiary p-4 border border-border-subtle rounded text-center">
              No holdings. Click BUY to add assets.
            </div>
          ) : (
            <table className="w-full text-[10px]">
              <thead className="sticky top-0 bg-surface-1">
                <tr className="text-text-tertiary border-b border-border-subtle">
                  <th className="text-left py-1">Asset</th>
                  <th className="text-right py-1">Qty</th>
                  <th className="text-right py-1">Avg Cost</th>
                  <th className="text-right py-1">Price</th>
                  <th className="text-right py-1">Value</th>
                  <th className="text-right py-1">P&L</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((h) => (
                  <tr
                    key={h.id}
                    className="border-b border-[#151515] hover:bg-[#111118] cursor-pointer"
                    onClick={() => {
                      if (h.assetType === "STOCK") {
                        const stock = stocks.find((s) => s.symbol === h.assetSymbol);
                        if (stock) onSelectStock(stock);
                      } else if (h.assetType === "BOND") {
                        const bond = bonds.find((b) => b.symbol === h.assetSymbol);
                        if (bond) onSelectBond(bond);
                      }
                      // CRYPTO: no detail panel yet, handled by M-Pesa trade
                    }}
                  >
                    <td className="py-1">
                      <span className="text-accent-cyan font-semibold">
                        {h.assetSymbol}
                      </span>
                      <span className="text-text-tertiary ml-1">{h.assetType}</span>
                    </td>
                    <td className="text-right text-text-secondary">
                      {h.quantity.toLocaleString()}
                    </td>
                    <td className="text-right text-text-tertiary">
                      {h.avgCost.toFixed(2)}
                    </td>
                    <td className="text-right text-text-primary">
                      {h.currentPrice.toFixed(2)}
                    </td>
                    <td className="text-right text-text-primary">
                      {formatKES(h.currentValue)}
                    </td>
                    <td
                      className={`text-right ${
                        h.unrealizedPL >= 0 ? "text-accent-green" : "text-accent-red"
                      }`}
                    >
                      {h.unrealizedPL >= 0 ? "+" : ""}
                      {formatKES(h.unrealizedPL)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Charts */}
        <div className="overflow-auto space-y-2">
          {/* Asset Allocation */}
          {pieData.length > 0 && (
            <div>
              <div className="text-[10px] text-text-tertiary mb-1">ASSET ALLOCATION</div>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={50}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={COLORS[i % COLORS.length]}
                        stroke="#0a0a0a"
                        strokeWidth={1}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#111111",
                      border: "1px solid #1f2937",
                      fontSize: 10,
                      color: "#d1d5db",
                    }}
                    formatter={(value: unknown) =>
                      `KES ${formatKES(typeof value === "number" ? value : 0)}`
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Performance Chart */}
          {cumPerf.length > 1 && (
            <div>
              <div className="text-[10px] text-text-tertiary mb-1">CUMULATIVE VALUE</div>
              <ResponsiveContainer width="100%" height={120}>
                <AreaChart data={cumPerf}>
                  <defs>
                    <linearGradient id="portGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="idx" hide />
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
                    dataKey="cumValue"
                    stroke="#22c55e"
                    fill="url(#portGrad)"
                    strokeWidth={1.5}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Recent Transactions */}
          <div>
            <div className="text-[10px] text-text-tertiary mb-1">RECENT TRANSACTIONS</div>
            <div className="space-y-0.5">
              {txns.slice(0, 10).map((t) => (
                <div
                  key={t.id}
                  className="flex justify-between text-[10px] py-0.5 border-b border-[#151515]"
                >
                  <span
                    className={
                      t.type === "BUY"
                        ? "text-accent-green"
                        : t.type === "SELL"
                        ? "text-accent-red"
                        : "text-accent-amber"
                    }
                  >
                    {t.type}
                  </span>
                  <span className="text-text-secondary">
                    {t.assetSymbol ?? "-"} {t.quantity ? `×${t.quantity}` : ""}
                  </span>
                  <span className="text-text-secondary">
                    KES {formatKES(t.totalAmount)}
                  </span>
                  <span className="text-text-tertiary">
                    {new Date(t.executedAt).toLocaleDateString("en-KE")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Trade Modal */}
      {showTradeModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-surface-1 border border-border-subtle rounded-lg p-4 w-96">
            <div className="flex justify-between items-center mb-3">
              <div
                className={`text-sm font-bold ${
                  tradeType === "BUY" ? "text-accent-green" : "text-accent-red"
                }`}
              >
                {tradeType} {tradeAssetType}
              </div>
              <button
                onClick={() => setShowTradeModal(false)}
                className="text-text-tertiary hover:text-accent-red text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setTradeAssetType("STOCK")}
                  className={`flex-1 text-[10px] py-1 rounded border ${
                    tradeAssetType === "STOCK"
                      ? "border-accent-green text-accent-green bg-accent-green/20"
                      : "border-border-subtle text-text-tertiary"
                  }`}
                >
                  Stock
                </button>
                <button
                  onClick={() => setTradeAssetType("BOND")}
                  className={`flex-1 text-[10px] py-1 rounded border ${
                    tradeAssetType === "BOND"
                      ? "border-accent-green text-accent-green bg-accent-green/20"
                      : "border-border-subtle text-text-tertiary"
                  }`}
                >
                  Bond
                </button>
                <button
                  onClick={() => setTradeAssetType("CRYPTO")}
                  className={`flex-1 text-[10px] py-1 rounded border ${
                    tradeAssetType === "CRYPTO"
                      ? "border-accent-green text-accent-green bg-accent-green/20"
                      : "border-border-subtle text-text-tertiary"
                  }`}
                >
                  Crypto
                </button>
              </div>

              <div>
                <label className="text-[10px] text-text-tertiary">Symbol</label>
                <input
                  type="text"
                  value={tradeSymbol}
                  onChange={(e) => setTradeSymbol(e.target.value.toUpperCase())}
                  placeholder={tradeAssetType === "STOCK" ? "SCOM" : "FXD1/2016/010"}
                  className="w-full bg-surface-0 border border-border-subtle text-accent-green text-[12px] px-2 py-1.5 rounded mt-0.5 focus:outline-none focus:border-accent-green"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-text-tertiary">Quantity</label>
                  <input
                    type="number"
                    value={tradeQuantity}
                    onChange={(e) => setTradeQuantity(e.target.value)}
                    className="w-full bg-surface-0 border border-border-subtle text-accent-green text-[12px] px-2 py-1.5 rounded mt-0.5 focus:outline-none focus:border-accent-green"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-text-tertiary">Price (KES)</label>
                  <input
                    type="number"
                    value={tradePrice}
                    onChange={(e) => setTradePrice(e.target.value)}
                    className="w-full bg-surface-0 border border-border-subtle text-accent-green text-[12px] px-2 py-1.5 rounded mt-0.5 focus:outline-none focus:border-accent-green"
                  />
                </div>
              </div>

              {tradeQuantity && tradePrice && (
                <div className="text-[10px] text-text-secondary bg-surface-0 p-2 rounded">
                  <div>Total: KES {(parseFloat(tradeQuantity) * parseFloat(tradePrice)).toLocaleString()}</div>
                  <div>Fees (0.21%): KES {(parseFloat(tradeQuantity) * parseFloat(tradePrice) * 0.0021).toFixed(2)}</div>
                  <div className="text-text-primary mt-1">
                    {tradeType === "BUY" ? "Debit" : "Credit"}: KES{" "}
                    {(parseFloat(tradeQuantity) * parseFloat(tradePrice) * (tradeType === "BUY" ? 1.0021 : 0.9979)).toFixed(2)}
                  </div>
                </div>
              )}

              {error && (
                <div className="text-[10px] text-accent-red bg-accent-red/20 p-2 rounded border border-accent-red">
                  {error}
                </div>
              )}

              <button
                onClick={handleTrade}
                disabled={loading}
                className={`w-full text-[11px] py-2 rounded font-bold ${
                  tradeType === "BUY"
                    ? "bg-accent-green text-white hover:bg-accent-green/90"
                    : "bg-accent-red text-white hover:bg-accent-red/90"
                } disabled:opacity-50`}
              >
                {loading ? "PROCESSING..." : `CONFIRM ${tradeType}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* M-Pesa Deposit Modal */}
      {showMpesaModal && portfolio && (
        <MpesaModal
          portfolioId={portfolio.id}
          portfolioName={portfolio.name}
          currentBalance={portfolio.cashBalance}
          onClose={() => setShowMpesaModal(false)}
          onSuccess={() => {
            setShowMpesaModal(false);
            fetchPortfolio();
            onTradeComplete();
          }}
        />
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-surface-1 border border-border-subtle rounded p-2">
      <div className="text-[9px] text-text-tertiary">{label}</div>
      <div className={`text-sm font-bold ${color}`}>{value}</div>
      {sub && <div className={`text-[10px] ${color}`}>{sub}</div>}
    </div>
  );
}
