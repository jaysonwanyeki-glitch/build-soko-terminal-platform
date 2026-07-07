// Centralised input validation to keep server actions & API routes safe.

/** Ensure a finite positive number, optionally within bounds. */
export function safeNum(
  v: unknown,
  opts: { min?: number; max?: number; default?: number } = {}
): number | null {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return opts.default ?? null;
  if (opts.min != null && n < opts.min) return null;
  if (opts.max != null && n > opts.max) return null;
  return n;
}

export function isPositive(v: unknown): v is number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) && n > 0;
}

/** Clamp / cap a string to a max length, trimming whitespace. */
export function capStr(v: unknown, max: number): string {
  if (typeof v !== "string") return "";
  return v.trim().slice(0, max);
}

/** Allowlist matcher for short enum-like strings. */
export function oneOf<T extends string>(v: unknown, allowed: readonly T[]): T | null {
  return typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : null;
}

const ACTION = ["buy", "sell"] as const;
export const isAction = (v: unknown) => oneOf(v, ACTION);

const SEC_TYPES = ["stock", "bond", "crypto", "fund"] as const;
export const isSecType = (v: unknown) => oneOf(v, SEC_TYPES);

const DIR = ["up", "down"] as const;
export const isDirection = (v: unknown) => oneOf(v, DIR);

// Reasonable bounds to prevent absurd orders
export const LIMITS = {
  maxQty: 1_000_000_000, // shares / face value / coins
  maxPrice: 1_000_000_000, // KES per unit
  maxAmount: 1_000_000_000, // KES notional
  maxStr: 160,
  symbolMax: 32,
} as const;

/** Safe constant-time-ish string equality for token comparison. */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
