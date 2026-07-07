// Timeframe engine: synthesises intraday candles (1m–4h) from the latest daily
// bar and aggregates daily data into weekly/monthly — giving a full
// "minutes to months" spread like TradingView. Deterministic per symbol so
// server/client renders never diverge.

export type Candle = {
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
  label: string;
};

export type QuoteRow = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type TF = "1m" | "5m" | "15m" | "1h" | "4h" | "1D" | "1W" | "1M";

export const TIMEFRAMES: { id: TF; label: string }[] = [
  { id: "1m", label: "1m" },
  { id: "5m", label: "5m" },
  { id: "15m", label: "15m" },
  { id: "1h", label: "1H" },
  { id: "4h", label: "4H" },
  { id: "1D", label: "1D" },
  { id: "1W", label: "1W" },
  { id: "1M", label: "1M" },
];

const COUNT: Record<TF, number> = {
  "1m": 240,
  "5m": 150,
  "15m": 120,
  "1h": 96,
  "4h": 78,
  "1D": 150,
  "1W": 60,
  "1M": 36,
};

const INTRADAY: TF[] = ["1m", "5m", "15m", "1h", "4h"];

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function aggregate(daily: Candle[], size: number): Candle[] {
  const out: Candle[] = [];
  for (let i = 0; i < daily.length; i += size) {
    const chunk = daily.slice(i, i + size);
    if (!chunk.length) break;
    let h = -Infinity,
      l = Infinity,
      v = 0;
    for (const c of chunk) {
      h = Math.max(h, c.h);
      l = Math.min(l, c.l);
      v += c.v;
    }
    out.push({
      o: chunk[0].o,
      h,
      l,
      c: chunk[chunk.length - 1].c,
      v,
      label: chunk[0].label,
    });
  }
  return out;
}

function intraday(base: Candle, tf: TF, seed: number): Candle[] {
  const count = COUNT[tf];
  const rnd = mulberry32(seed);
  const range = base.h - base.l || Math.max(base.c * 0.01, 0.01);
  const stepMin = tf === "1m" ? 1 : tf === "5m" ? 5 : tf === "15m" ? 15 : tf === "1h" ? 60 : 240;
  let curMin = 9 * 60; // 09:00 EAT open
  const out: Candle[] = [];
  let prevClose = base.o;

  for (let i = 0; i < count; i++) {
    const prog = count > 1 ? i / (count - 1) : 1;
    const target = base.o + (base.c - base.o) * prog;
    const noise = (rnd() - 0.5) * range * 0.55;
    let c = target + noise;
    c = Math.max(base.l, Math.min(base.h, c));
    const o = i === 0 ? base.o : prevClose;
    const hi = Math.min(base.h, Math.max(o, c) + rnd() * range * 0.28);
    const lo = Math.max(base.l, Math.min(o, c) - rnd() * range * 0.28);
    const v = (base.v / count) * (0.4 + rnd() * 1.2);
    const hh = Math.floor(curMin / 60) % 24;
    const mm = curMin % 60;
    const label = `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
    out.push({ o, h: hi, l: lo, c, v, label });
    prevClose = c;
    curMin += stepMin;
  }
  // anchor final candle to the real daily close
  out[out.length - 1].c = base.c;
  return out;
}

export function buildSeries(daily: QuoteRow[], tf: TF, symbol: string): Candle[] {
  if (!daily.length) return [];
  const seed = hash(symbol + tf);
  const mapped: Candle[] = daily.map((q) => ({
    o: q.open,
    h: q.high,
    l: q.low,
    c: q.close,
    v: q.volume,
    label: (q.date || "").slice(5), // MM-DD compact
  }));

  if (INTRADAY.includes(tf)) {
    const base = mapped[mapped.length - 1];
    return intraday(base, tf, seed);
  }
  if (tf === "1D") return mapped.slice(-COUNT["1D"]);
  if (tf === "1W") return aggregate(mapped.slice(-300), 5);
  return aggregate(mapped, 21); // 1M ≈ 21 trading days
}

// Moving average helper (returns null where not enough data)
export function movingAvg(candles: Candle[], len: number): (number | null)[] {
  const out: (number | null)[] = [];
  for (let i = 0; i < candles.length; i++) {
    if (i < len - 1) {
      out.push(null);
      continue;
    }
    let s = 0;
    for (let j = i - len + 1; j <= i; j++) s += candles[j].c;
    out.push(s / len);
  }
  return out;
}

// Bollinger Bands (SMA20 ± 2σ)
export function bollinger(candles: Candle[]): { upper: (number | null)[]; mid: (number | null)[]; lower: (number | null)[] } {
  const len = 20;
  const mid = movingAvg(candles, len);
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];
  for (let i = 0; i < candles.length; i++) {
    if (mid[i] == null) {
      upper.push(null);
      lower.push(null);
      continue;
    }
    let s = 0;
    for (let j = i - len + 1; j <= i; j++) s += Math.pow(candles[j].c - (mid[i] as number), 2);
    const sd = Math.sqrt(s / len);
    upper.push((mid[i] as number) + 2 * sd);
    lower.push((mid[i] as number) - 2 * sd);
  }
  return { upper, mid, lower };
}

// Relative Strength Index (period 14)
export function rsi(candles: Candle[], period = 14): (number | null)[] {
  const out: (number | null)[] = [];
  let gain = 0;
  let loss = 0;
  for (let i = 0; i < candles.length; i++) {
    if (i === 0) {
      out.push(null);
      continue;
    }
    const ch = candles[i].c - candles[i - 1].c;
    const g = Math.max(0, ch);
    const l = Math.max(0, -ch);
    if (i <= period) {
      gain += g;
      loss += l;
      if (i === period) {
        gain /= period;
        loss /= period;
        out.push(100 - 100 / (1 + gain / (loss || 1e-9)));
      } else {
        out.push(null);
      }
    } else {
      gain = (gain * (period - 1) + g) / period;
      loss = (loss * (period - 1) + l) / period;
      out.push(100 - 100 / (1 + gain / (loss || 1e-9)));
    }
  }
  return out;
}

// MACD (12,26,9) → returns macd line, signal line, and histogram
export function macd(candles: Candle[]): { macd: (number | null)[]; signal: (number | null)[]; hist: (number | null)[] } {
  const ema = (len: number) => {
    const k = 2 / (len + 1);
    const out: (number | null)[] = [];
    let prev: number | null = null;
    for (let i = 0; i < candles.length; i++) {
      if (i < len - 1) {
        out.push(null);
        continue;
      }
      if (prev == null) {
        let s = 0;
        for (let j = i - len + 1; j <= i; j++) s += candles[j].c;
        prev = s / len;
        out.push(prev);
      } else {
        prev = candles[i].c * k + prev * (1 - k);
        out.push(prev);
      }
    }
    return out;
  };
  const e12 = ema(12);
  const e26 = ema(26);
  const macdLine = candles.map((_, i) =>
    e12[i] != null && e26[i] != null ? (e12[i] as number) - (e26[i] as number) : null
  );
  // signal = EMA9 of macd line (simple approximation using SMA seed)
  const k = 2 / 10;
  const signal: (number | null)[] = [];
  let prev: number | null = null;
  for (let i = 0; i < macdLine.length; i++) {
    if (macdLine[i] == null) {
      signal.push(null);
      continue;
    }
    prev = prev == null ? macdLine[i] : (macdLine[i] as number) * k + prev * (1 - k);
    signal.push(prev);
  }
  const hist = macdLine.map((m, i) => (m != null && signal[i] != null ? m - (signal[i] as number) : null));
  return { macd: macdLine, signal, hist };
}
