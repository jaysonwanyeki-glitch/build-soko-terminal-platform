import "server-only";

// Simple in-memory rate limiter (sliding window). Suitable for single-instance
// deploys. For multi-instance, swap for Redis.

type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();

const WINDOW_MS = 60_000; // 1 minute

/**
 * Returns true if the action is allowed, false if rate-limited.
 * @param key  identifier (e.g. "trade:user-42")
 * @param max  max requests per window
 */
export function rateLimit(key: string, max: number): boolean {
  const now = Date.now();
  const bucket = store.get(key);

  if (!bucket || now > bucket.resetAt) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (bucket.count >= max) return false;
  bucket.count++;
  return true;
}

/** Convenience: builds a user-scoped rate-limit key. */
export function userKey(action: string, userId: string | number): string {
  return `${action}:user-${userId}`;
}
