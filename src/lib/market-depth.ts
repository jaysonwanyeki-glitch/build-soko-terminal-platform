// Generates a realistic NSE order book (bid/ask ladder with depth) from the
// current mid price. Deterministic per symbol so renders are stable.

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Order = { price: number; size: number; total: number };

export type OrderBook = {
  bids: Order[];
  asks: Order[];
  spread: number;
  spreadPct: number;
  mid: number;
  lastPrice: number;
};

export function buildOrderBook(symbol: string, price: number): OrderBook {
  const rnd = mulberry32(hash(symbol + "-ob"));
  const spreadBps = 8 + rnd() * 22; // 8–30 bps typical NSE spread
  const halfSpread = (price * spreadBps) / 10000;
  const mid = price;
  const tick = Math.max(0.01, price * 0.0015);

  const bids: Order[] = [];
  const asks: Order[] = [];
  let bidCum = 0;
  let askCum = 0;
  const levels = 10;

  for (let i = 0; i < levels; i++) {
    const bPrice = mid - halfSpread - tick * i;
    const aPrice = mid + halfSpread + tick * i;
    // size grows with depth (larger orders further from mid)
    const bSize = Math.round(100 * (1 + i * 0.6) * (0.5 + rnd() * 1.4));
    const aSize = Math.round(100 * (1 + i * 0.55) * (0.5 + rnd() * 1.4));
    bidCum += bSize;
    askCum += aSize;
    bids.push({ price: bPrice, size: bSize, total: bidCum });
    asks.push({ price: aPrice, size: aSize, total: askCum });
  }

  return {
    bids,
    asks,
    spread: halfSpread * 2,
    spreadPct: spreadBps / 100,
    mid,
    lastPrice: price,
  };
}
