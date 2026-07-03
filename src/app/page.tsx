"use client";

import { useState, useEffect, useCallback } from "react";
import { TickerTape } from "@/components/TickerTape";
import { TopBar } from "@/components/TopBar";
import { Sidebar } from "@/components/Sidebar";
import { MarketWatch } from "@/components/panels/MarketWatch";
import { StockDetail } from "@/components/panels/StockDetail";
import { BondDesk } from "@/components/panels/BondDesk";
import { BondDetail } from "@/components/panels/BondDetail";
import { PortfolioManager } from "@/components/panels/PortfolioManager";
import { MarketOverview } from "@/components/panels/MarketOverview";
import { IndicesPanel } from "@/components/panels/IndicesPanel";
import { WatchlistPanel } from "@/components/panels/WatchlistPanel";
import { TradingHours } from "@/components/panels/TradingHours";
import { CryptoDesk } from "@/components/panels/CryptoDesk";
import { MpesaTradeModal } from "@/components/MpesaTradeModal";
import { AboutPanel } from "@/components/panels/AboutPanel";
import { MissionPanel } from "@/components/panels/MissionPanel";

export type Panel =
  | "overview"
  | "stocks"
  | "bonds"
  | "crypto"
  | "portfolio"
  | "indices"
  | "watchlist"
  | "tradinghours"
  | "about"
  | "mission";

export type Stock = {
  id: number;
  symbol: string;
  name: string;
  sector: string;
  exchange: string;
  sharesOutstanding: number;
  yearLow: number;
  yearHigh: number;
  dividendYield: number;
  eps: number;
  peRatio: number;
  dayLow: number;
  dayHigh: number;
  lastPrice: number;
  prevClose: number;
  change: number;
  changePercent: number;
  volume: number;
  turnover: number;
  marketCap: number;
  updatedAt: string;
};

export type Bond = {
  id: number;
  symbol: string;
  name: string;
  bondType: string;
  issuer: string;
  issueDate: string;
  maturityDate: string;
  couponRate: number;
  faceValue: number;
  lastPrice: number;
  yieldToMaturity: number;
  accruedInterest: number;
  dirtyPrice: number;
  modifiedDuration: number;
  yearsToMaturity: number;
  volume: number;
  turnover: number;
  outstandingAmount: number;
  prevYield: number;
  yieldChange: number;
  couponPaymentMonths: string;
  updatedAt: string;
};

export type IndexData = {
  id: number;
  symbol: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
  dayHigh: number;
  dayLow: number;
  updatedAt: string;
};

export type Portfolio = {
  id: number;
  name: string;
  description: string;
  cashBalance: number;
  totalInvested: number;
  totalCurrentValue: number;
  totalReturn: number;
  totalReturnPercent: number;
  createdAt: string;
  updatedAt: string;
  holdings?: Holding[];
  transactions?: Transaction[];
};

export type Holding = {
  id: number;
  portfolioId: number;
  assetType: string;
  assetSymbol: string;
  quantity: number;
  avgCost: number;
  totalCost: number;
  currentPrice: number;
  currentValue: number;
  unrealizedPL: number;
  unrealizedPLPercent: number;
  dayChange: number;
  updatedAt: string;
};

export type Transaction = {
  id: number;
  portfolioId: number;
  type: string;
  assetType: string | null;
  assetSymbol: string | null;
  quantity: number;
  price: number;
  totalAmount: number;
  fees: number;
  notes: string | null;
  executedAt: string;
  createdAt: string;
};

export type MarketSummary = {
  indices: IndexData[];
  gainers: Stock[];
  losers: Stock[];
  mostActive: Stock[];
  totalMarketCap: number;
  totalVolume: number;
  totalTurnover: number;
  stockCount: number;
  bondCount: number;
  bondYieldAvg: number;
  bondTotalOutstanding: number;
};

export default function HomePage() {
  const [activePanel, setActivePanel] = useState<Panel>("overview");
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [selectedBond, setSelectedBond] = useState<Bond | null>(null);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<number | null>(null);
  const [marketSummary, setMarketSummary] = useState<MarketSummary | null>(null);
  const [allStocks, setAllStocks] = useState<Stock[]>([]);
  const [allBonds, setAllBonds] = useState<Bond[]>([]);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);

  // M-Pesa quick trade state
  const [showMpesaTrade, setShowMpesaTrade] = useState(false);
  const [mpesaTradeData, setMpesaTradeData] = useState<{
    assetType: string;
    symbol: string;
    name: string;
    price: number;
  } | null>(null);

  const fetchMarketSummary = useCallback(async () => {
    try {
      const res = await fetch("/api/market/summary");
      const json = await res.json();
      setMarketSummary(json.data);
    } catch {}
  }, []);

  const fetchStocks = useCallback(async () => {
    try {
      const res = await fetch("/api/market/stocks?limit=200");
      const json = await res.json();
      setAllStocks(json.data);
    } catch {}
  }, []);

  const fetchBonds = useCallback(async () => {
    try {
      const res = await fetch("/api/market/bonds?limit=200");
      const json = await res.json();
      setAllBonds(json.data);
    } catch {}
  }, []);

  const fetchPortfolios = useCallback(async () => {
    try {
      const res = await fetch("/api/portfolio");
      const json = await res.json();
      setPortfolios(json.data);
      if (json.data.length > 0 && !selectedPortfolioId) {
        setSelectedPortfolioId(json.data[0].id);
      }
    } catch {}
  }, [selectedPortfolioId]);

  useEffect(() => {
    fetchMarketSummary();
    fetchStocks();
    fetchBonds();
    fetchPortfolios();
    const interval = setInterval(() => {
      fetchMarketSummary();
      fetchStocks();
      fetchBonds();
    }, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [fetchMarketSummary, fetchStocks, fetchBonds]);

  // Refresh portfolios when switching to portfolio panel
  useEffect(() => {
    if (activePanel === "portfolio") {
      fetchPortfolios();
    }
  }, [activePanel, fetchPortfolios]);

  const handleSelectStock = (stock: Stock) => {
    setSelectedStock(stock);
    setSelectedBond(null);
  };

  const handleSelectBond = (bond: Bond) => {
    setSelectedBond(bond);
    setSelectedStock(null);
  };

  const handleTradeComplete = () => {
    fetchPortfolios();
    fetchMarketSummary();
    fetchStocks();
    fetchBonds();
  };

  const formatMarketCap = (cap: number): string => {
    if (cap >= 1_000_000_000_000) return `KES ${(cap / 1_000_000_000_000).toFixed(2)}T`;
    if (cap >= 1_000_000_000) return `KES ${(cap / 1_000_000_000).toFixed(2)}B`;
    if (cap >= 1_000_000) return `KES ${(cap / 1_000_000).toFixed(2)}M`;
    return `KES ${cap.toLocaleString()}`;
  };

  const formatVolume = (vol: number): string => {
    if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(2)}M`;
    if (vol >= 1_000) return `${(vol / 1_000).toFixed(0)}K`;
    return vol.toString();
  };

  const formatKES = (val: number): string => {
    if (Math.abs(val) >= 1_000_000_000)
      return `${(val / 1_000_000_000).toFixed(2)}B`;
    if (Math.abs(val) >= 1_000_000)
      return `${(val / 1_000_000).toFixed(2)}M`;
    if (Math.abs(val) >= 1_000) return `${(val / 1_000).toFixed(0)}K`;
    return val.toFixed(2);
  };

  return (
    <div className="h-screen flex flex-col bg-surface-0 text-text-primary overflow-hidden">
      {/* Top Status Bar — elegant, slim */}
      <TopBar
        marketSummary={marketSummary}
        formatMarketCap={formatMarketCap}
      />

      {/* Ticker Tape — live scrolling strip */}
      <TickerTape
        stocks={allStocks}
        bonds={allBonds}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar
          activePanel={activePanel}
          onPanelChange={(panel) => {
            setActivePanel(panel);
            setSelectedStock(null);
            setSelectedBond(null);
          }}
          portfolios={portfolios}
          selectedPortfolioId={selectedPortfolioId}
          onSelectPortfolio={(id) => {
            setSelectedPortfolioId(id);
            setActivePanel("portfolio");
          }}
        />

        {/* Content — main panel + optional detail panel */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Panel */}
          <div className="flex-1 overflow-auto p-3">
            {activePanel === "overview" && (
              <MarketOverview
                summary={marketSummary}
                onSelectStock={handleSelectStock}
                onSelectBond={handleSelectBond}
                formatMarketCap={formatMarketCap}
                formatVolume={formatVolume}
                formatKES={formatKES}
              />
            )}
            {activePanel === "stocks" && (
              <MarketWatch
                stocks={allStocks}
                onSelectStock={handleSelectStock}
                formatMarketCap={formatMarketCap}
                formatVolume={formatVolume}
                formatKES={formatKES}
              />
            )}
            {activePanel === "bonds" && (
              <BondDesk
                bonds={allBonds}
                onSelectBond={handleSelectBond}
                formatKES={formatKES}
                formatVolume={formatVolume}
              />
            )}
            {activePanel === "portfolio" && (
              <PortfolioManager
                portfolioId={selectedPortfolioId}
                portfolios={portfolios}
                stocks={allStocks}
                bonds={allBonds}
                onTradeComplete={handleTradeComplete}
                onSelectStock={handleSelectStock}
                onSelectBond={handleSelectBond}
                formatKES={formatKES}
                formatVolume={formatVolume}
              />
            )}
            {activePanel === "indices" && (
              <IndicesPanel
                indices={marketSummary?.indices ?? []}
                stocks={allStocks}
                formatMarketCap={formatMarketCap}
                formatKES={formatKES}
              />
            )}
            {activePanel === "watchlist" && (
              <WatchlistPanel
                stocks={allStocks}
                bonds={allBonds}
                onSelectStock={handleSelectStock}
                onSelectBond={handleSelectBond}
                formatKES={formatKES}
                formatVolume={formatVolume}
              />
            )}
            {activePanel === "tradinghours" && <TradingHours />}
            {activePanel === "crypto" && (
              <CryptoDesk
                onMpesaBuy={(assetType, symbol, price, name) => {
                  setMpesaTradeData({ assetType, symbol, name, price });
                  setShowMpesaTrade(true);
                }}
                formatKES={formatKES}
              />
            )}
            {activePanel === "about" && <AboutPanel />}
            {activePanel === "mission" && <MissionPanel />}
          </div>

          {/* Detail Side Panel — slides in when stock/bond selected */}
          {(selectedStock || selectedBond) && (
            <div className="w-[340px] border-l border-border-subtle overflow-auto bg-surface-1/60 glass">
              {selectedStock && (
                <StockDetail
                  stock={selectedStock}
                  onClose={() => setSelectedStock(null)}
                  formatMarketCap={formatMarketCap}
                  formatVolume={formatVolume}
                  formatKES={formatKES}
                />
              )}
              {selectedBond && (
                <BondDetail
                  bond={selectedBond}
                  onClose={() => setSelectedBond(null)}
                  formatKES={formatKES}
                  formatVolume={formatVolume}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* M-Pesa Quick Trade Modal */}
      {showMpesaTrade && mpesaTradeData && selectedPortfolioId && (
        <MpesaTradeModal
          portfolioId={selectedPortfolioId}
          portfolioName={portfolios.find((p) => p.id === selectedPortfolioId)?.name ?? "Portfolio"}
          assetType={mpesaTradeData.assetType}
          assetSymbol={mpesaTradeData.symbol}
          assetName={mpesaTradeData.name}
          pricePerUnit={mpesaTradeData.price}
          onClose={() => {
            setShowMpesaTrade(false);
            setMpesaTradeData(null);
          }}
          onSuccess={() => {
            setShowMpesaTrade(false);
            setMpesaTradeData(null);
          }}
        />
      )}

      {/* Bottom Status Bar */}
      <div className="h-7 bg-surface-1 border-t border-border-subtle flex items-center px-4 text-[10px] text-text-tertiary gap-5">
        <span className="text-accent-amber font-semibold tracking-wider text-[10px]">
          SOKO TERMINAL v2.0
        </span>
        <span className="w-px h-3 bg-border-default" />
        <span>Nairobi Securities Exchange</span>
        <span className="w-px h-3 bg-border-default" />
        <span>
          {allStocks.length} Stocks · {allBonds.length} Bonds · 25 Crypto
        </span>
        <span className="w-px h-3 bg-border-default" />
        <span>
          {new Date().toLocaleDateString("en-KE", {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
        <span className="ml-auto flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-green live-dot" />
          <span className="text-accent-green text-[10px] font-medium cursor-blink">
            LIVE
          </span>
        </span>
      </div>
    </div>
  );
}
