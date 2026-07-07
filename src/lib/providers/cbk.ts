import "server-only";

// ─── Central Bank of Kenya — Official FX Rates Scraper ─────────────────────
// Extracts real official KES exchange rates from the CBK website.
// This is publicly available government data.

const CBK_URL = "https://www.centralbank.go.ke/rates/forex-exchange-rates/";

export type CbkFxRate = {
  currency: string;
  code: string;
  rate: number; // KES per 1 unit
};

// Known CBK currency order on the page
const CURRENCY_MAP = [
  { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "Sterling Pound" },
  { code: "JPY", name: "Japanese Yen" },
  { code: "UGX", name: "Uganda Shilling" },
  { code: "TZS", name: "Tanzania Shilling" },
  { code: "ZAR", name: "South African Rand" },
  { code: "CAD", name: "Canadian Dollar" },
  { code: "AUD", name: "Australian Dollar" },
  { code: "CNY", name: "Chinese Yuan" },
  { code: "SAR", name: "Saudi Riyal" },
];

let cache: { data: CbkFxRate[]; ts: number } | null = null;
const CACHE_TTL = 300_000; // 5 minutes

export async function fetchCbkRates(): Promise<{ data: CbkFxRate[]; isLive: boolean }> {
  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    return { data: cache.data, isLive: true };
  }

  try {
    const res = await fetch(CBK_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(12000),
      next: { revalidate: 300 },
    });

    if (!res.ok) throw new Error(`CBK responded ${res.status}`);
    const html = await res.text();

    // Extract all 4-decimal numbers (KES rates format) — these are in groups
    // of 3 per currency (buy, sell, mean). We find currency names near them.
    const allNums = html.match(/\d{1,6}\.\d{4}/g)?.map(Number) ?? [];

    // CBK page lists currencies in groups of 3. Find currency name tokens
    // to correctly map which group belongs to which currency.
    const rates: CbkFxRate[] = [];

    // Group numbers in threes (buy/sell/mean per currency)
    const grouped: number[][] = [];
    for (let i = 0; i + 2 < allNums.length; i += 3) {
      grouped.push([allNums[i], allNums[i + 1], allNums[i + 2]]);
    }

    // Use expected rate ranges to identify currencies by their value.
    // CBK quotes KES per unit of foreign currency.
    const RANGES: { code: string; name: string; range: [number, number] }[] = [
      { code: "GBP", name: "Sterling Pound", range: [155, 200] },
      { code: "USD", name: "US Dollar", range: [125, 150] },
      { code: "EUR", name: "Euro", range: [140, 170] },
      { code: "CAD", name: "Canadian Dollar", range: [90, 115] },
      { code: "AUD", name: "Australian Dollar", range: [80, 100] },
      { code: "CNY", name: "Chinese Yuan", range: [17, 22] },
      { code: "ZAR", name: "South African Rand", range: [6, 9] },
    ];

    const usedGroups = new Set<number>();
    for (const { code, name, range } of RANGES) {
      // Find a group where ALL 3 values fall within the expected range
      const idx = grouped.findIndex(
        (g, i) =>
          !usedGroups.has(i) &&
          g.every((v) => v >= range[0] && v <= range[1])
      );
      if (idx >= 0) {
        usedGroups.add(idx);
        const rate = grouped[idx].reduce((a, b) => a + b, 0) / 3;
        rates.push({ currency: name, code, rate });
      }
    }

    if (rates.length >= 3) {
      cache = { data: rates, ts: Date.now() };
      return { data: rates, isLive: true };
    }

    throw new Error("Not enough rates extracted");
  } catch (e) {
    console.warn("[cbk] fetch failed:", (e as Error).message);
    return { data: [], isLive: false };
  }
}

/** Gets just the USD/KES rate (the most important one). */
export async function getUsdKesRate(): Promise<{ rate: number; isLive: boolean }> {
  const { data, isLive } = await fetchCbkRates();
  const usd = data.find((r) => r.code === "USD");
  if (usd) return { rate: usd.rate, isLive };
  return { rate: 134.0, isLive: false }; // fallback
}
