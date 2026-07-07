import {
  pgTable,
  text,
  timestamp,
  real,
  integer,
  serial,
  boolean,
  doublePrecision,
  pgEnum,
} from "drizzle-orm/pg-core";

// ============ ENUMS ============
export const marketSectorEnum = pgEnum("market_sector", [
  "Banking",
  "Telecom",
  "Energy",
  "Manufacturing",
  "Insurance",
  "Investment",
  "Construction",
  "Agriculture",
  "Commercial",
  "Technology",
  "Media",
  "Real Estate",
  "Automobile",
  "Retail",
  "Beverages",
  "Food",
  "Transport",
  "Tourism",
]);

export const bondTypeEnum = pgEnum("bond_type", [
  "FXD",       // Fixed Rate Treasury Bond
  "IFB",       // Infrastructure Bond
  "SGB",       // Savings & Government Bond (e.g. M-Akiba)
  "CORP",      // Corporate Bond
]);

export const transactionTypeEnum = pgEnum("transaction_type", [
  "BUY",
  "SELL",
  "DIVIDEND",
  "COUPON",
  "DEPOSIT",
  "WITHDRAW",
]);

export const exchangeEnum = pgEnum("exchange", [
  "NSE",       // Nairobi Securities Exchange (Main)
  "GEMS",      // Growth Enterprise Market Segment
  "NSE-BOND",  // NSE Bond Market
]);

// ============ STOCKS / EQUITIES ============
export const stocks = pgTable("stocks", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull().unique(),          // e.g. SCOM, EQTY, KCB
  name: text("name").notNull(),                        // e.g. Safaricom PLC
  sector: marketSectorEnum("sector").notNull(),
  exchange: exchangeEnum("exchange").notNull().default("NSE"),
  sharesOutstanding: doublePrecision("shares_outstanding").notNull().default(0),
  yearLow: real("year_low").notNull().default(0),
  yearHigh: real("year_high").notNull().default(0),
  dividendYield: real("dividend_yield").notNull().default(0),
  eps: real("eps").notNull().default(0),               // Earnings Per Share
  peRatio: real("pe_ratio").notNull().default(0),
  dayLow: real("day_low").notNull().default(0),
  dayHigh: real("day_high").notNull().default(0),
  lastPrice: real("last_price").notNull().default(0),
  prevClose: real("prev_close").notNull().default(0),
  change: real("change").notNull().default(0),
  changePercent: real("change_percent").notNull().default(0),
  volume: doublePrecision("volume").notNull().default(0),
  turnover: doublePrecision("turnover").notNull().default(0),
  marketCap: doublePrecision("market_cap").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============ TREASURY & CORPORATE BONDS ============
export const bonds = pgTable("bonds", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull().unique(),          // e.g. FXD1/2016/010
  name: text("name").notNull(),
  bondType: bondTypeEnum("bond_type").notNull().default("FXD"),
  issuer: text("issuer").notNull().default("Government of Kenya"),
  issueDate: timestamp("issue_date").notNull(),
  maturityDate: timestamp("maturity_date").notNull(),
  couponRate: real("coupon_rate").notNull().default(0),
  faceValue: doublePrecision("face_value").notNull().default(100),  // Usually KES 100
  lastPrice: real("last_price").notNull().default(0),   // Clean price
  yieldToMaturity: real("yield_to_maturity").notNull().default(0),
  accruedInterest: real("accrued_interest").notNull().default(0),
  dirtyPrice: real("dirty_price").notNull().default(0),
  modifiedDuration: real("modified_duration").notNull().default(0),
  yearsToMaturity: real("years_to_maturity").notNull().default(0),
  volume: doublePrecision("volume").notNull().default(0),
  turnover: doublePrecision("turnover").notNull().default(0),
  outstandingAmount: doublePrecision("outstanding_amount").notNull().default(0),
  prevYield: real("prev_yield").notNull().default(0),
  yieldChange: real("yield_change").notNull().default(0),
  couponPaymentMonths: text("coupon_payment_months").notNull().default(""),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============ MARKET INDICES ============
export const indices = pgTable("indices", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull().unique(),          // e.g. NSE20, NSE25, NASI
  name: text("name").notNull(),
  value: real("value").notNull().default(0),
  change: real("change").notNull().default(0),
  changePercent: real("change_percent").notNull().default(0),
  dayHigh: real("day_high").notNull().default(0),
  dayLow: real("day_low").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============ PORTFOLIOS ============
export const portfolios = pgTable("portfolios", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  cashBalance: doublePrecision("cash_balance").notNull().default(0),
  totalInvested: doublePrecision("total_invested").notNull().default(0),
  totalCurrentValue: doublePrecision("total_current_value").notNull().default(0),
  totalReturn: doublePrecision("total_return").notNull().default(0),
  totalReturnPercent: real("total_return_percent").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============ PORTFOLIO HOLDINGS ============
export const holdings = pgTable("holdings", {
  id: serial("id").primaryKey(),
  portfolioId: integer("portfolio_id").notNull().references(() => portfolios.id, { onDelete: "cascade" }),
  assetType: text("asset_type").notNull(),            // "STOCK" | "BOND"
  assetSymbol: text("asset_symbol").notNull(),
  quantity: doublePrecision("quantity").notNull().default(0),
  avgCost: real("avg_cost").notNull().default(0),
  totalCost: doublePrecision("total_cost").notNull().default(0),
  currentPrice: real("current_price").notNull().default(0),
  currentValue: doublePrecision("current_value").notNull().default(0),
  unrealizedPL: doublePrecision("unrealized_pl").notNull().default(0),
  unrealizedPLPercent: real("unrealized_pl_percent").notNull().default(0),
  dayChange: doublePrecision("day_change").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============ TRANSACTIONS ============
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  portfolioId: integer("portfolio_id").notNull().references(() => portfolios.id, { onDelete: "cascade" }),
  type: transactionTypeEnum("type").notNull(),
  assetType: text("asset_type"),                     // "STOCK" | "BOND" | null for deposits
  assetSymbol: text("asset_symbol"),
  quantity: doublePrecision("quantity").default(0),
  price: real("price").default(0),
  totalAmount: doublePrecision("total_amount").notNull().default(0),
  fees: doublePrecision("fees").notNull().default(0),
  notes: text("notes").default(""),
  executedAt: timestamp("executed_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============ WATCHLISTS ============
export const watchlists = pgTable("watchlists", {
  id: serial("id").primaryKey(),
  portfolioId: integer("portfolio_id").references(() => portfolios.id, { onDelete: "cascade" }),
  name: text("name").notNull().default("Default Watchlist"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const watchlistItems = pgTable("watchlist_items", {
  id: serial("id").primaryKey(),
  watchlistId: integer("watchlist_id").notNull().references(() => watchlists.id, { onDelete: "cascade" }),
  assetType: text("asset_type").notNull(),            // "STOCK" | "BOND"
  assetSymbol: text("asset_symbol").notNull(),
  addedAt: timestamp("added_at").notNull().defaultNow(),
});

// ============ PRICE HISTORY ============
export const priceHistory = pgTable("price_history", {
  id: serial("id").primaryKey(),
  assetType: text("asset_type").notNull(),
  assetSymbol: text("asset_symbol").notNull(),
  price: real("price").notNull().default(0),
  volume: doublePrecision("volume").notNull().default(0),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// ============ M-PESA DEPOSIT/WITHDRAW ============
export const mpesaTransactions = pgTable("mpesa_transactions", {
  id: serial("id").primaryKey(),
  portfolioId: integer("portfolio_id").notNull().references(() => portfolios.id, { onDelete: "cascade" }),
  phoneNumber: text("phone_number").notNull(),
  amount: doublePrecision("amount").notNull().default(0),
  type: text("type").notNull(), // DEPOSIT | WITHDRAW | BUY_STOCK | BUY_BOND | BUY_CRYPTO | SELL_STOCK | SELL_BOND | SELL_CRYPTO
  status: text("status").notNull().default("PENDING"), // PENDING | COMPLETED | FAILED | CANCELLED
  assetType: text("asset_type"),        // STOCK | BOND | CRYPTO
  assetSymbol: text("asset_symbol"),    // e.g., SCOM, BTC, FXD1/2016/010
  quantity: doublePrecision("quantity"), // units bought/sold
  price: real("price"),                  // execution price
  merchantRequestId: text("merchant_request_id"),
  checkoutRequestId: text("checkout_request_id"),
  resultCode: integer("result_code"),
  resultDesc: text("result_desc"),
  mpesaReceiptNumber: text("mpesa_receipt_number"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============ CRYPTO ASSETS ============
export const cryptoAssets = pgTable("crypto_assets", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull().unique(),         // e.g., BTC, ETH, USDT
  name: text("name").notNull(),                       // Bitcoin, Ethereum
  category: text("category").notNull().default("Layer1"), // Layer1, Stablecoin, DeFi, Meme, Exchange, Infrastructure
  lastPriceKes: real("last_price_kes").notNull().default(0),
  lastPriceUsd: real("last_price_usd").notNull().default(0),
  changePercent24h: real("change_percent_24h").notNull().default(0),
  volume24hKes: doublePrecision("volume_24h_kes").notNull().default(0),
  marketCapKes: doublePrecision("market_cap_kes").notNull().default(0),
  high24h: real("high_24h").notNull().default(0),
  low24h: real("low_24h").notNull().default(0),
  circulatingSupply: doublePrecision("circulating_supply").notNull().default(0),
  maxSupply: doublePrecision("max_supply").notNull().default(0),
  rank: integer("rank").notNull().default(0),
  mpesaBuyEnabled: boolean("mpesa_buy_enabled").notNull().default(true),
  mpesaSellEnabled: boolean("mpesa_sell_enabled").notNull().default(true),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
