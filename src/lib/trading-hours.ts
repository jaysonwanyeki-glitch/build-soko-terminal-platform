// Liquidity intensity model for NSE + Kenya FX trading hours (EAT).
// Values 0-100 represent relative volume/liquidity intensity per hour.

export type Tier = "peak" | "good" | "low";

export const LIQUIDITY: number[] = [
  6, 4, 3, 3, 5, 8, 12, 22, 48, 76, 88, 94, 72, 100, 92, 64, 38, 24, 18, 22, 20, 15, 11, 8,
];

export type HourInfo = { hour: number; intensity: number; tier: Tier; label: string };

export function tierForHour(h: number): Tier {
  if (h >= 9 && h <= 14) return "peak"; // 09:00-15:00
  if (h === 8 || h === 15) return "good"; // shoulders of the 08:00-16:00 band
  return "low";
}

export const TIER_META: Record<Tier, { label: string; color: string; emoji: string }> = {
  peak: { label: "Peak liquidity (09:00–15:00)", color: "#1fd585", emoji: "🟩" },
  good: { label: "Good liquidity (08:00–16:00)", color: "#ffd166", emoji: "🟨" },
  low: { label: "Low volume pre/post hours", color: "#5a6678", emoji: "⬜" },
};

function lbl(h: number) {
  return String(h).padStart(2, "0");
}

export function hourInfo(): HourInfo[] {
  return LIQUIDITY.map((intensity, hour) => ({
    hour,
    intensity,
    tier: tierForHour(hour),
    label: `${lbl(hour)}:00`,
  }));
}

export type TradingWindow = {
  name: string;
  time: string;
  detail: string;
  tag: string;
  tier: Tier;
};

export const TRADING_WINDOWS: TradingWindow[] = [
  {
    name: "NSE Regular Trading",
    time: "09:00 – 15:00 EAT",
    detail: "Best for: Stocks & treasury bonds",
    tag: "NSE",
    tier: "peak",
  },
  {
    name: "Forex Prime Time",
    time: "08:00 – 17:00 EAT",
    detail: "Overlaps with London & Asian sessions",
    tag: "FX",
    tier: "good",
  },
  {
    name: "Global Session Overlap",
    time: "13:00 – 15:00 EAT",
    detail: "EU open + US pre-market window",
    tag: "GLOBAL",
    tier: "peak",
  },
];

export function eatHour(d = new Date()): number {
  try {
    const fmt = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Africa/Nairobi",
      hour: "2-digit",
      hour12: false,
    });
    return parseInt(fmt.format(d), 10) % 24;
  } catch {
    return d.getHours();
  }
}

export function eatClock(d = new Date()): { hh: string; mm: string } {
  try {
    const fmt = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Africa/Nairobi",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const map = new Map<string, string>();
    for (const p of fmt.formatToParts(d)) map.set(p.type, p.value);
    return { hh: map.get("hour") ?? "00", mm: map.get("minute") ?? "00" };
  } catch {
    return { hh: String(d.getHours()).padStart(2, "0"), mm: String(d.getMinutes()).padStart(2, "0") };
  }
}

export type SessionStatus = {
  open: boolean;
  label: string;
  window: string | null;
};

export function sessionStatus(d = new Date()): SessionStatus {
  const wdFmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Nairobi", weekday: "short" });
  const wd = wdFmt.format(d);
  const h = eatHour(d);
  const isWeekday = !["Sat", "Sun"].includes(wd);
  if (isWeekday && h >= 9 && h < 15) return { open: true, label: "NSE OPEN", window: "NSE Regular Trading" };
  if (h >= 8 && h < 17) return { open: false, label: "PRE/POST MARKET", window: "Forex Prime Time" };
  return { open: false, label: "MARKET CLOSED", window: null };
}
