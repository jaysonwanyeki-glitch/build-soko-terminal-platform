import "server-only";
import { getUsdKesRate } from "@/lib/providers/cbk";

// Live crypto prices via CoinGecko's free API, with graceful fallback to
// the seeded DB values when the API is unreachable or rate-limited.
// Uses the REAL CBK USD/KES rate for KES conversion.

const CG_BASE = "https://api.coingecko.com/api/v3";

// Map our symbols → CoinGecko coin IDs
const CG_IDS: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  USDT: "tether",
  USDC: "usd-coin",
  BNB: "binancecoin",
  SOL: "solana",
  XRP: "ripple",
  ADA: "cardano",
  DOGE: "dogecoin",
  TON: "the-open-network",
  AVAX: "avalanche-2",
  LINK: "chainlink",
  DOT: "polkadot",
  MATIC: "matic-network",
  LTC: "litecoin",
  SHIB: "shiba-inu",
  DAI: "dai",
  TRX: "tron",
  NEAR: "near",
  APT: "aptos",
};

const KES_USD_FALLBACK = 134.0;
let cachedKesRate = KES_USD_FALLBACK;

// simple in-memory cache (60s)
type CacheEntry = { data: Record<string, number>; ts: number };
let priceCache: CacheEntry | null = null;
const CACHE_TTL = 60_000;

async function fetchKesRate(): Promise<number> {
  // Strategy 1: Real CBK official rate
  try {
    const { rate, isLive } = await getUsdKesRate();
    if (isLive && rate > 0) {
      cachedKesRate = rate;
      return rate;
    }
  } catch {
    // fall through
  }
  // Strategy 2: CoinGecko-derived rate
  try {
    const res = await fetch(`${CG_BASE}/simple/price?ids=usd&vs_currencies=kes`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return cachedKesRate;
    const data = await res.json();
    const rate = data?.usd?.kes;
    if (rate && typeof rate === "number") {
      cachedKesRate = rate;
      return rate;
    }
  } catch {
    // keep cached fallback
  }
  return cachedKesRate;
}

/**
 * Fetches live USD prices for all tracked cryptos from CoinGecko,
 * converts to KES, and returns a map of symbol → KES price.
 * Falls back to cached/seeded values on any error.
 */
export async function fetchLiveCryptoPrices(): Promise<Record<string, number>> {
  const now = Date.now();

  if (priceCache && now - priceCache.ts < CACHE_TTL) {
    return priceCache.data;
  }

  try {
    const ids = Object.values(CG_IDS).join(",");
    const kesRate = await fetchKesRate();

    const res = await fetch(
      `${CG_BASE}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
      {
        headers: { Accept: "application/json" },
        next: { revalidate: 60 },
        signal: AbortSignal.timeout(8000),
      }
    );

    if (!res.ok) throw new Error(`CoinGecko responded ${res.status}`);

    const raw = (await res.json()) as Record<string, { usd: number; usd_24h_change: number }>;
    const out: Record<string, number> = {};

    for (const [symbol, cgId] of Object.entries(CG_IDS)) {
      const entry = raw[cgId];
      if (entry?.usd) {
        out[symbol] = entry.usd * kesRate;
      }
    }

    if (Object.keys(out).length > 0) {
      priceCache = { data: out, ts: now };
      return out;
    }
    throw new Error("No prices returned");
  } catch {
    // Return whatever cache we have, or empty (caller falls back to DB)
    return priceCache?.data ?? {};
  }
}

export type LiveCryptoData = {
  symbol: string;
  priceKes: number;
  priceUsd: number;
  changePct: number;
  isLive: boolean;
};

/**
 * Merges live CoinGecko prices with DB fallback data.
 * Pass the DB crypto rows and get back enriched live data.
 */
export async function getLiveCryptoData(
  dbCryptos: { symbol: string; price: number; priceUsd: number; changePct: number }[]
): Promise<{ data: LiveCryptoData[]; isLive: boolean }> {
  let livePrices: Record<string, number> = {};
  try {
    livePrices = await fetchLiveCryptoPrices();
  } catch {
    livePrices = {};
  }
  const isLive = Object.keys(livePrices).length > 5;

  const data: LiveCryptoData[] = dbCryptos.map((c) => {
    const liveKes = livePrices[c.symbol];
    if (liveKes != null) {
      return {
        symbol: c.symbol,
        priceKes: liveKes,
        priceUsd: liveKes / cachedKesRate,
        changePct: c.changePct, // keep seeded change until we wire 24h
        isLive: true,
      };
    }
    return {
      symbol: c.symbol,
      priceKes: c.price,
      priceUsd: c.priceUsd,
      changePct: c.changePct,
      isLive: false,
    };
  });

  return { data, isLive };
}
