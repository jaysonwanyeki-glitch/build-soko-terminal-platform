import { db } from "@/db";
import {
  stocks,
  stockQuotes,
  indices,
  indexQuotes,
  treasuryBonds,
  bondQuotes,
  fxRates,
  newsItems,
  portfolios,
  holdings,
  transactions,
  watchlist,
  cryptos,
  cryptoQuotes,
  marketEvents,
  priceTargets,
  funds,
  fundQuotes,
  ipos,
  portfolioSnapshots,
  pendingOrders,
} from "@/db/schema";
import type { Stock, TreasuryBond, Crypto, Fund } from "@/db/schema";
import { eq, desc, asc, inArray, and, sql } from "drizzle-orm";

export type SortKey = "symbol" | "price" | "changePct" | "volume" | "marketCap" | "peRatio" | "dividendYield";

// ---------- equities ----------
export async function getAllStocks() {
  return db.select().from(stocks).orderBy(asc(stocks.symbol));
}

export async function getStockBySymbol(sym: string) {
  const [row] = await db
    .select()
    .from(stocks)
    .where(eq(stocks.symbol, sym.toUpperCase()))
    .limit(1);
  return row ?? null;
}

export async function getStockQuotes(stockId: number, limit = 130) {
  const rows = await db
    .select()
    .from(stockQuotes)
    .where(eq(stockQuotes.stockId, stockId))
    .orderBy(desc(stockQuotes.date))
    .limit(limit);
  return rows.reverse();
}

// ---------- indices ----------
export async function getIndices() {
  return db.select().from(indices).orderBy(asc(indices.symbol));
}

export async function getIndexQuotes(indexId: number, limit = 130) {
  const rows = await db
    .select()
    .from(indexQuotes)
    .where(eq(indexQuotes.indexId, indexId))
    .orderBy(desc(indexQuotes.date))
    .limit(limit);
  return rows.reverse();
}

// ---------- bonds ----------
export async function getBonds() {
  return db
    .select()
    .from(treasuryBonds)
    .orderBy(asc(treasuryBonds.maturityDate));
}

export async function getBondById(id: number) {
  const [row] = await db
    .select()
    .from(treasuryBonds)
    .where(eq(treasuryBonds.id, id))
    .limit(1);
  return row ?? null;
}

export async function getBondQuotes(bondId: number, limit = 90) {
  const rows = await db
    .select()
    .from(bondQuotes)
    .where(eq(bondQuotes.bondId, bondId))
    .orderBy(desc(bondQuotes.date))
    .limit(limit);
  return rows.reverse();
}

export async function getYieldCurve() {
  const all = await db
    .select({
      bondNumber: treasuryBonds.bondNumber,
      tenorYears: treasuryBonds.tenorYears,
      yield: treasuryBonds.yieldToMaturity,
      coupon: treasuryBonds.couponRate,
      isInfrastructure: treasuryBonds.isInfrastructure,
    })
    .from(treasuryBonds)
    .orderBy(asc(treasuryBonds.tenorYears));
  return all;
}

// ---------- crypto ----------
export async function getAllCryptos() {
  return db.select().from(cryptos).orderBy(asc(cryptos.rank), asc(cryptos.symbol));
}

export async function getCryptoBySymbol(sym: string) {
  const [row] = await db
    .select()
    .from(cryptos)
    .where(eq(cryptos.symbol, sym.toUpperCase()))
    .limit(1);
  return row ?? null;
}

export async function getCryptoQuotes(cryptoId: number, limit = 120) {
  const rows = await db
    .select()
    .from(cryptoQuotes)
    .where(eq(cryptoQuotes.cryptoId, cryptoId))
    .orderBy(desc(cryptoQuotes.date))
    .limit(limit);
  return rows.reverse();
}

// ---------- funds (ETF / REIT / MMF) ----------
export async function getAllFunds() {
  return db.select().from(funds).orderBy(asc(funds.type), asc(funds.symbol));
}

export async function getFundBySymbol(sym: string) {
  const [row] = await db
    .select()
    .from(funds)
    .where(eq(funds.symbol, sym.toUpperCase()))
    .limit(1);
  return row ?? null;
}

export async function getFundQuotes(fundId: number, limit = 120) {
  const rows = await db
    .select()
    .from(fundQuotes)
    .where(eq(fundQuotes.fundId, fundId))
    .orderBy(desc(fundQuotes.date))
    .limit(limit);
  return rows.reverse();
}

// ---------- IPOs / new listings ----------
export async function getIpos() {
  return db.select().from(ipos).orderBy(asc(ipos.closeDate));
}

// ---------- fx + news ----------
export async function getFx() {
  return db.select().from(fxRates).orderBy(asc(fxRates.pair));
}

export async function getNews(limit = 12) {
  return db.select().from(newsItems).orderBy(desc(newsItems.publishedAt)).limit(limit);
}

export async function getNewsBySymbol(sym: string | null, limit = 6) {
  if (!sym) return [];
  return db
    .select()
    .from(newsItems)
    .where(eq(newsItems.relatedSymbol, sym.toUpperCase()))
    .orderBy(desc(newsItems.publishedAt))
    .limit(limit);
}

// ---------- market analytics ----------
export type MarketStats = {
  advancers: number;
  decliners: number;
  unchanged: number;
  turnover: number;
  volume: number;
  marketCap: number;
  gainers: Stock[];
  losers: Stock[];
  active: Stock[];
};

export function computeStats(all: Stock[]): MarketStats {
  const gainers = [...all].sort((a, b) => (b.changePct ?? 0) - (a.changePct ?? 0));
  const losers = [...all].sort((a, b) => (a.changePct ?? 0) - (b.changePct ?? 0));
  const active = [...all].sort((a, b) => (b.turnover ?? 0) - (a.turnover ?? 0));
  return {
    advancers: all.filter((s) => (s.change ?? 0) > 0).length,
    decliners: all.filter((s) => (s.change ?? 0) < 0).length,
    unchanged: all.filter((s) => (s.change ?? 0) === 0).length,
    turnover: all.reduce((a, s) => a + (s.turnover ?? 0), 0),
    volume: all.reduce((a, s) => a + (s.volume ?? 0), 0),
    marketCap: all.reduce((a, s) => a + (s.marketCap ?? 0), 0),
    gainers,
    losers,
    active,
  };
}

export type SectorSummary = {
  sector: string;
  count: number;
  marketCap: number;
  avgChange: number;
  weightedChange: number;
};

export function sectorSummary(all: Stock[]): SectorSummary[] {
  const map = new Map<string, Stock[]>();
  for (const s of all) {
    const arr = map.get(s.sector) ?? [];
    arr.push(s);
    map.set(s.sector, arr);
  }
  const out: SectorSummary[] = [];
  for (const [sector, arr] of map) {
    const marketCap = arr.reduce((a, s) => a + (s.marketCap ?? 0), 0);
    const avgChange = arr.reduce((a, s) => a + (s.changePct ?? 0), 0) / arr.length;
    const weightedChange =
      arr.reduce((a, s) => a + (s.changePct ?? 0) * (s.marketCap ?? 0), 0) / Math.max(1, marketCap);
    out.push({ sector, count: arr.length, marketCap, avgChange, weightedChange });
  }
  return out.sort((a, b) => b.marketCap - a.marketCap);
}

// ---------- search / ticker ----------
export type SearchItem = {
  label: string;
  sub: string;
  type: "stock" | "bond" | "index" | "crypto" | "fund";
  href: string;
};

export async function getSearchIndex(): Promise<SearchItem[]> {
  const [stk, bnd, idx, cry, fnd] = await Promise.all([
    getAllStocks(),
    getBonds(),
    getIndices(),
    getAllCryptos(),
    getAllFunds(),
  ]);
  const items: SearchItem[] = [];
  for (const s of stk)
    items.push({ label: s.symbol, sub: s.name, type: "stock", href: `/stocks/${s.symbol}` });
  for (const c of cry)
    items.push({ label: c.symbol, sub: `${c.name} · crypto`, type: "crypto", href: `/crypto/${c.symbol}` });
  for (const f of fnd)
    items.push({ label: f.symbol, sub: `${f.name} · ${f.type}`, type: "fund", href: `/funds/${f.symbol}` });
  for (const b of bnd)
    items.push({ label: b.bondNumber, sub: `${b.tenorYears}Y · ${b.couponRate}%`, type: "bond", href: `/bonds/${b.id}` });
  for (const i of idx)
    items.push({ label: i.symbol, sub: i.name, type: "index", href: `/indices#${i.symbol}` });
  return items;
}

export type TickerItem = { symbol: string; price: number; changePct: number; kind?: "crypto" };

export async function getTickerData(): Promise<TickerItem[]> {
  const [stk, idx, cry] = await Promise.all([getAllStocks(), getIndices(), getAllCryptos()]);
  const items: TickerItem[] = stk.map((s) => ({
    symbol: s.symbol,
    price: s.price ?? 0,
    changePct: s.changePct ?? 0,
  }));
  for (const c of cry.slice(0, 12))
    items.push({ symbol: c.symbol, price: c.price ?? 0, changePct: c.changePct ?? 0, kind: "crypto" });
  for (const i of idx) items.push({ symbol: i.symbol, price: i.value ?? 0, changePct: i.changePct ?? 0 });
  return items;
}

// ---------- watchlist ----------
export type WatchRow = typeof watchlist.$inferSelect & {
  currentPrice: number;
  changePct: number;
  prevClose: number;
  name: string;
};

export async function getWatchlist(): Promise<WatchRow[]> {
  const rows = await db.select().from(watchlist).orderBy(desc(watchlist.createdAt));
  if (!rows.length) return [];
  const stockRefs = rows.filter((r) => r.securityType === "stock" && r.refId).map((r) => r.refId!) as number[];
  const bondRefs = rows.filter((r) => r.securityType === "bond" && r.refId).map((r) => r.refId!) as number[];
  const cryptoRefs = rows.filter((r) => r.securityType === "crypto" && r.refId).map((r) => r.refId!) as number[];
  const fundRefs = rows.filter((r) => r.securityType === "fund" && r.refId).map((r) => r.refId!) as number[];
  const stockMap = new Map<number, Stock>();
  const bondMap = new Map<number, TreasuryBond>();
  const cryptoMap = new Map<number, Crypto>();
  const fundMap = new Map<number, Fund>();
  if (stockRefs.length) {
    (await db.select().from(stocks).where(inArray(stocks.id, stockRefs))).forEach((s) => stockMap.set(s.id, s));
  }
  if (bondRefs.length) {
    (await db.select().from(treasuryBonds).where(inArray(treasuryBonds.id, bondRefs))).forEach((b) =>
      bondMap.set(b.id, b)
    );
  }
  if (cryptoRefs.length) {
    (await db.select().from(cryptos).where(inArray(cryptos.id, cryptoRefs))).forEach((c) => cryptoMap.set(c.id, c));
  }
  if (fundRefs.length) {
    (await db.select().from(funds).where(inArray(funds.id, fundRefs))).forEach((f) => fundMap.set(f.id, f));
  }
  return rows.map((r) => {
    if (r.securityType === "stock") {
      const s = r.refId ? stockMap.get(r.refId) : undefined;
      return {
        ...r,
        name: s?.name ?? r.name ?? r.symbol,
        currentPrice: s?.price ?? 0,
        changePct: s?.changePct ?? 0,
        prevClose: s?.prevClose ?? 0,
      };
    }
    if (r.securityType === "fund") {
      const f = r.refId ? fundMap.get(r.refId) : undefined;
      return {
        ...r,
        name: f?.name ?? r.name ?? r.symbol,
        currentPrice: f?.price ?? 0,
        changePct: f?.changePct ?? 0,
        prevClose: f?.prevPrice ?? 0,
      };
    }
    if (r.securityType === "crypto") {
      const c = r.refId ? cryptoMap.get(r.refId) : undefined;
      return {
        ...r,
        name: c?.name ?? r.name ?? r.symbol,
        currentPrice: c?.price ?? 0,
        changePct: c?.changePct ?? 0,
        prevClose: c?.prevPrice ?? 0,
      };
    }
    const b = r.refId ? bondMap.get(r.refId) : undefined;
    return {
      ...r,
      name: b?.name ?? r.name ?? r.symbol,
      currentPrice: b?.cleanPrice ?? 0,
      changePct: 0,
      prevClose: b?.cleanPrice ?? 0,
    };
  });
}

// ---------- portfolio ----------
export async function getPortfolios(userId?: number) {
  if (userId) return db.select().from(portfolios).where(eq(portfolios.userId, userId)).orderBy(desc(portfolios.createdAt));
  return db.select().from(portfolios).orderBy(desc(portfolios.createdAt));
}

export async function ensurePortfolio(userId?: number): Promise<number> {
  // No session → don't create orphan portfolios. Return 0 as a sentinel;
  // the trade ticket will prompt the user to sign in instead of executing.
  if (!userId) return 0;
  const all = await getPortfolios(userId);
  if (all.length) return all[0].id;
  const [p] = await db
    .insert(portfolios)
    .values({ name: "Main Portfolio", baseCurrency: "KES", userId })
    .returning();
  return p.id;
}

export async function getPortfolioCash(portfolioId: number): Promise<number> {
  const [pf] = await db
    .select({ cash: portfolios.cashBalance })
    .from(portfolios)
    .where(eq(portfolios.id, portfolioId))
    .limit(1);
  return pf?.cash ?? 0;
}

// ---------- equity curve ----------
export async function getEquityCurve(portfolioId: number, days = 90) {
  const rows = await db
    .select()
    .from(portfolioSnapshots)
    .where(eq(portfolioSnapshots.portfolioId, portfolioId))
    .orderBy(desc(portfolioSnapshots.date))
    .limit(days);
  return rows.reverse();
}

/** Records today's portfolio value snapshot (idempotent per day via unique index). */
export async function recordSnapshot(portfolioId: number, totalValue: number, cashBalance: number) {
  const today = new Date().toISOString().slice(0, 10);
  try {
    await db.insert(portfolioSnapshots).values({
      portfolioId,
      date: today,
      totalValue,
      cashBalance,
    });
  } catch {
    // already recorded today → update the existing row
    await db
      .update(portfolioSnapshots)
      .set({ totalValue, cashBalance })
      .where(
        and(eq(portfolioSnapshots.portfolioId, portfolioId), eq(portfolioSnapshots.date, today))
      );
  }
}

export type HoldingView = {
  id: number;
  securityType: string;
  refId: number | null;
  symbol: string;
  name: string;
  sector: string;
  quantity: number;
  avgCost: number;
  currentPrice: number;
  marketValue: number;
  cost: number;
  pnl: number;
  pnlPct: number;
  dayChange: number;
  faceValue?: number;
  dividendYield?: number;
  isTaxFree?: boolean;
};

export type PortfolioDetail = {
  items: HoldingView[];
  totalValue: number;
  totalCost: number;
  pnl: number;
  pnlPct: number;
  dayChange: number;
  cashBalance: number;
  // Kenya tax & income analytics
  capitalGainsTax: number; // 15% of taxable gains
  netPnlAfterTax: number;
  netPnlPctAfterTax: number;
  projectedDividendIncome: number; // annual
  dividendWithholdingTax: number; // 15%
  netDividendIncome: number;
};

export async function getPortfolioDetail(portfolioId: number): Promise<PortfolioDetail> {
  const [pf] = await db
    .select({ cash: portfolios.cashBalance })
    .from(portfolios)
    .where(eq(portfolios.id, portfolioId))
    .limit(1);
  const cashBalance = pf?.cash ?? 0;

  const rows = await db
    .select()
    .from(holdings)
    .where(eq(holdings.portfolioId, portfolioId))
    .orderBy(desc(holdings.securityType), asc(holdings.symbol));
  if (!rows.length)
    return {
      items: [],
      totalValue: 0,
      totalCost: 0,
      pnl: 0,
      pnlPct: 0,
      dayChange: 0,
      cashBalance,
      capitalGainsTax: 0,
      netPnlAfterTax: 0,
      netPnlPctAfterTax: 0,
      projectedDividendIncome: 0,
      dividendWithholdingTax: 0,
      netDividendIncome: 0,
    };

  const stockRefs = rows.filter((r) => r.securityType === "stock" && r.refId).map((r) => r.refId!) as number[];
  const bondRefs = rows.filter((r) => r.securityType === "bond" && r.refId).map((r) => r.refId!) as number[];
  const cryptoRefs = rows.filter((r) => r.securityType === "crypto" && r.refId).map((r) => r.refId!) as number[];
  const fundRefs = rows.filter((r) => r.securityType === "fund" && r.refId).map((r) => r.refId!) as number[];
  const stockMap = new Map<number, Stock>();
  const bondMap = new Map<number, TreasuryBond>();
  const cryptoMap = new Map<number, Crypto>();
  const fundMap = new Map<number, Fund>();
  if (stockRefs.length)
    (await db.select().from(stocks).where(inArray(stocks.id, stockRefs))).forEach((s) => stockMap.set(s.id, s));
  if (bondRefs.length)
    (await db.select().from(treasuryBonds).where(inArray(treasuryBonds.id, bondRefs))).forEach((b) =>
      bondMap.set(b.id, b)
    );
  if (cryptoRefs.length)
    (await db.select().from(cryptos).where(inArray(cryptos.id, cryptoRefs))).forEach((c) => cryptoMap.set(c.id, c));
  if (fundRefs.length)
    (await db.select().from(funds).where(inArray(funds.id, fundRefs))).forEach((f) => fundMap.set(f.id, f));

  const items: HoldingView[] = rows.map((r) => {
    if (r.securityType === "stock") {
      const st = r.refId ? stockMap.get(r.refId) : undefined;
      const cur = st?.price ?? 0;
      const mv = r.quantity * cur;
      const cost = r.quantity * r.avgCost;
      return {
        id: r.id,
        securityType: r.securityType,
        refId: r.refId,
        symbol: r.symbol,
        name: st?.name ?? r.symbol,
        sector: st?.sector ?? "Equities",
        quantity: r.quantity,
        avgCost: r.avgCost,
        currentPrice: cur,
        marketValue: mv,
        cost,
        pnl: mv - cost,
        pnlPct: cost ? ((mv - cost) / cost) * 100 : 0,
        dayChange: (st?.change ?? 0) * r.quantity,
        dividendYield: st?.dividendYield ?? 0,
      };
    }
    if (r.securityType === "crypto") {
      const cr = r.refId ? cryptoMap.get(r.refId) : undefined;
      const cur = cr?.price ?? 0;
      const mv = r.quantity * cur;
      const cost = r.quantity * r.avgCost;
      return {
        id: r.id,
        securityType: r.securityType,
        refId: r.refId,
        symbol: r.symbol,
        name: cr?.name ?? r.symbol,
        sector: "Crypto",
        quantity: r.quantity,
        avgCost: r.avgCost,
        currentPrice: cur,
        marketValue: mv,
        cost,
        pnl: mv - cost,
        pnlPct: cost ? ((mv - cost) / cost) * 100 : 0,
        dayChange: (cr?.change ?? 0) * r.quantity,
      };
    }
    if (r.securityType === "fund") {
      const fn = r.refId ? fundMap.get(r.refId) : undefined;
      const cur = fn?.price ?? 0;
      const mv = r.quantity * cur;
      const cost = r.quantity * r.avgCost;
      return {
        id: r.id,
        securityType: r.securityType,
        refId: r.refId,
        symbol: r.symbol,
        name: fn?.name ?? r.symbol,
        sector: fn?.type ?? "Funds",
        quantity: r.quantity,
        avgCost: r.avgCost,
        currentPrice: cur,
        marketValue: mv,
        cost,
        pnl: mv - cost,
        pnlPct: cost ? ((mv - cost) / cost) * 100 : 0,
        dayChange: (fn?.change ?? 0) * r.quantity,
      };
    }
    const bd = r.refId ? bondMap.get(r.refId) : undefined;
    const face = bd?.faceValue ?? 50000;
    const cur = (bd?.cleanPrice ?? 0) / 100;
    const mv = r.quantity * cur;
    const cost = r.quantity * r.avgCost;
    return {
      id: r.id,
      securityType: r.securityType,
      refId: r.refId,
      symbol: r.symbol,
      name: bd?.name ?? r.symbol,
      sector: "Treasury Bonds",
      quantity: r.quantity,
      avgCost: r.avgCost,
      currentPrice: cur,
      marketValue: mv,
      cost,
      pnl: mv - cost,
      pnlPct: cost ? ((mv - cost) / cost) * 100 : 0,
      dayChange: 0,
      faceValue: face,
      isTaxFree: bd?.isInfrastructure ?? false,
    };
  });

  const totalValue = items.reduce((a, b) => a + b.marketValue, 0);
  const totalCost = items.reduce((a, b) => a + b.cost, 0);
  const dayChange = items.reduce((a, b) => a + b.dayChange, 0);

  // Kenya capital gains tax: 15% on gains, but tax-free IFB coupon income aside,
  // CGT applies to disposal gains on all securities (simplified model).
  const grossPnl = totalValue - totalCost;
  const capitalGainsTax = Math.max(0, grossPnl) * 0.15;
  const netPnlAfterTax = grossPnl - capitalGainsTax;
  const netPnlPctAfterTax = totalCost ? (netPnlAfterTax / totalCost) * 100 : 0;

  // Projected annual dividend income from equity holdings (qty × price × yield).
  const projectedDividendIncome = items.reduce(
    (a, b) => a + b.marketValue * ((b.dividendYield ?? 0) / 100),
    0
  );
  const dividendWithholdingTax = projectedDividendIncome * 0.15; // 15% WHT
  const netDividendIncome = projectedDividendIncome - dividendWithholdingTax;

  return {
    items,
    totalValue,
    totalCost,
    pnl: grossPnl,
    pnlPct: totalCost ? (grossPnl / totalCost) * 100 : 0,
    dayChange,
    cashBalance,
    capitalGainsTax,
    netPnlAfterTax,
    netPnlPctAfterTax,
    projectedDividendIncome,
    dividendWithholdingTax,
    netDividendIncome,
  };
}

export async function getTransactions(portfolioId: number, limit = 50) {
  return db
    .select()
    .from(transactions)
    .where(eq(transactions.portfolioId, portfolioId))
    .orderBy(desc(transactions.date))
    .limit(limit);
}

// ---------- pending orders ----------
export async function getPendingOrders(portfolioId: number) {
  return db
    .select()
    .from(pendingOrders)
    .where(eq(pendingOrders.portfolioId, portfolioId))
    .orderBy(desc(pendingOrders.createdAt));
}

export async function getOpenOrders() {
  return db
    .select()
    .from(pendingOrders)
    .where(eq(pendingOrders.status, "open"))
    .orderBy(asc(pendingOrders.createdAt));
}

export async function getHoldingNames(portfolioId: number) {
  const rows = await getPortfolioDetail(portfolioId);
  return rows.items.map((i) => ({ id: i.id, symbol: i.symbol, name: i.name, securityType: i.securityType, refId: i.refId }));
}

// ---------- market events / calendar ----------
export async function getEvents() {
  return db.select().from(marketEvents).orderBy(asc(marketEvents.date));
}

export async function getUpcomingEvents(limit = 6) {
  const today = new Date().toISOString().slice(0, 10);
  return db
    .select()
    .from(marketEvents)
    .where(sql`${marketEvents.date} >= ${today}`)
    .orderBy(asc(marketEvents.date))
    .limit(limit);
}

// ---------- screener ----------
export type ScreenFilters = {
  sector?: string;
  minPrice?: number;
  maxPrice?: number;
  minDividend?: number;
  minPE?: number;
  maxPE?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
};

export async function screenStocks(f: ScreenFilters): Promise<Stock[]> {
  const all = await getAllStocks();
  let rows = all;
  if (f.sector && f.sector !== "all") rows = rows.filter((s) => s.sector === f.sector);
  if (f.minPrice != null) rows = rows.filter((s) => (s.price ?? 0) >= f.minPrice!);
  if (f.maxPrice != null) rows = rows.filter((s) => (s.price ?? 0) <= f.maxPrice!);
  if (f.minDividend != null) rows = rows.filter((s) => (s.dividendYield ?? 0) >= f.minDividend!);
  if (f.minPE != null) rows = rows.filter((s) => (s.peRatio ?? 0) >= f.minPE! && (s.peRatio ?? 0) > 0);
  if (f.maxPE != null) rows = rows.filter((s) => (s.peRatio ?? 0) <= f.maxPE! && (s.peRatio ?? 0) > 0);
  const by = (f.sortBy || "marketCap") as keyof Stock;
  const dir = f.sortDir === "asc" ? 1 : -1;
  rows = rows.sort((a, b) => {
    const va = (a[by] as number) ?? 0;
    const vb = (b[by] as number) ?? 0;
    return (va - vb) * dir;
  });
  return rows;
}
