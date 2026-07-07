import "server-only";

// ─── NSE Equity Data Provider ──────────────────────────────────────────────
// The NSE doesn't offer a free public API. This module supports multiple
// strategies to get real data, with graceful fallback.
//
// STRATEGY 1: Alpha Vantage (if API key configured) — covers some NSE stocks
// STRATEGY 2: Web scraper (needs Playwright in production for JS-rendered pages)
// STRATEGY 3: Realistic simulation (current fallback)
//
// In production with Puppeteer/Playwright installed, this can scrape the
// actual NSE website for live prices. Without it, falls back to simulation.

import { getUsdKesRate } from "@/lib/providers/cbk";

export type NseQuote = {
  symbol: string;
  price: number;
  change: number;
  changePct: number;
  volume: number;
  isLive: boolean;
};

const AV_BASE = "https://www.alphavantage.co/query";

/**
 * Fetches real NSE stock quotes from Alpha Vantage (if configured).
 * Alpha Vantage covers some NSE stocks with the .NR suffix.
 */
export async function fetchAlphaVantageQuotes(symbols: string[]): Promise<Map<string, NseQuote>> {
  const apiKey = process.env.ALPHAVANTAGE_API_KEY;
  const out = new Map<string, NseQuote>();

  if (!apiKey) return out;

  for (const sym of symbols.slice(0, 5)) {
    // Alpha Vantage rate limit: 5 requests/min on free tier
    try {
      const res = await fetch(
        `${AV_BASE}?function=GLOBAL_QUOTE&symbol=${sym}.NR&apikey=${apiKey}`,
        { signal: AbortSignal.timeout(8000), next: { revalidate: 60 } }
      );
      if (!res.ok) continue;
      const data = await res.json();
      const q = data["Global Quote"];
      if (q && q["05. price"]) {
        const price = Number(q["05. price"]);
        const change = Number(q["09. change"] ?? 0);
        const changePct = Number(q["10. change percent"]?.replace("%", "") ?? 0);
        const volume = Number(q["06. volume"] ?? 0);
        out.set(sym, { symbol: sym, price, change, changePct, volume, isLive: true });
      }
    } catch {
      // skip on error
    }
  }

  return out;
}

/**
 * Web scrapes the NSE website for live prices.
 * NOTE: In this sandbox, the NSE page renders client-side so curl can't
 * extract prices. In production with Playwright/Puppeteer installed,
 * this function should be replaced with a headless browser scrape.
 *
 * Production setup:
 *   npm install playwright
 *   const browser = await chromium.launch();
 *   const page = await browser.newPage();
 *   await page.goto("https://www.nse.co.ke/market-information/equities/");
 *   const data = await page.evaluate(() => { ... extract table ... });
 */
export async function scrapeNsePrices(): Promise<Map<string, NseQuote>> {
  // Check if Playwright is available (optional dependency)
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
    const pw: any = require("playwright");
    if (!pw?.chromium) throw new Error("no chromium");
    console.log("[nse] Playwright detected — attempting live scrape…");

    const browser = await pw.chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");

    await page.goto("https://www.nse.co.ke/market-information/equities/", {
      waitUntil: "networkidle",
      timeout: 30000,
    });
    await page.waitForTimeout(3000);

    // Extract price data from the page
    const data = await page.evaluate(() => {
      const results: Record<string, { price: number; change: number; changePct: number; volume: number }> = {};
      const rows = document.querySelectorAll("table tr, .equity-row, [data-issuer]");
      rows.forEach((row) => {
        const text = row.textContent || "";
        const symbolMatch = text.match(/\b([A-Z]{3,5})\b/);
        const priceMatch = text.match(/(\d+\.\d{2})/);
        if (symbolMatch && priceMatch) {
          results[symbolMatch[1]] = {
            price: Number(priceMatch[1]),
            change: 0,
            changePct: 0,
            volume: 0,
          };
        }
      });
      return results;
    });

    await browser.close();

    const out = new Map<string, NseQuote>();
    for (const [symbol, d] of Object.entries(data) as [string, { price: number; change: number; changePct: number; volume: number }][]) {
      out.set(symbol, { symbol, price: d.price, change: d.change, changePct: d.changePct, volume: d.volume, isLive: true });
    }

    if (out.size > 0) {
      console.log(`[nse] scraped ${out.size} live prices`);
      return out;
    }
    throw new Error("No prices extracted");
  } catch {
    // Playwright not installed or scrape failed
    return new Map();
  }
}

export type NseSyncResult = {
  quotes: Map<string, NseQuote>;
  source: "alphavantage" | "scraper" | "simulation";
  count: number;
};

/**
 * Master function: tries Alpha Vantage → Playwright scraper → falls back to simulation.
 */
export async function syncNseQuotes(symbols: string[]): Promise<NseSyncResult> {
  // Strategy 1: Alpha Vantage
  const avQuotes = await fetchAlphaVantageQuotes(symbols);
  if (avQuotes.size >= 3) {
    return { quotes: avQuotes, source: "alphavantage", count: avQuotes.size };
  }

  // Strategy 2: Web scraper (Playwright)
  const scraped = await scrapeNsePrices();
  if (scraped.size >= 3) {
    return { quotes: scraped, source: "scraper", count: scraped.size };
  }

  // Strategy 3: Simulation (no external source available)
  return { quotes: new Map(), source: "simulation", count: 0 };
}

/**
 * Gets the live USD/KES rate from CBK for KES-denominated conversions.
 */
export async function getLiveKesRate(): Promise<number> {
  const { rate, isLive } = await getUsdKesRate();
  if (isLive) console.log(`[fx] CBK USD/KES rate: ${rate}`);
  return rate;
}
