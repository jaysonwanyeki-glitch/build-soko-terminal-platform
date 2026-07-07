import "server-only";

// ─── Redis client with graceful in-memory fallback ─────────────────────────
// When REDIS_URL is set, connects to Redis for distributed session storage
// and rate limiting. Without it, falls back to in-memory (single-instance).

let redisClient: import("ioredis").default | null = null;
let redisAvailable = false;

const memStore = new Map<string, string>();
const memTtl = new Map<string, number>();

function getRedis() {
  if (redisClient !== null) return redisClient;
  const url = process.env.REDIS_URL;
  if (!url) {
    redisClient = null;
    return null;
  }
  try {
    // Dynamic import so the build doesn't fail if ioredis has issues
    const Redis = require("ioredis").default as typeof import("ioredis").default;
    redisClient = new Redis(url, {
      maxRetriesPerRequest: 2,
      enableOfflineQueue: false,
      retryStrategy: (times) => Math.min(times * 200, 2000),
    });
    redisClient.on("error", (err) => {
      console.warn("[redis] connection error:", err.message);
      redisAvailable = false;
    });
    redisClient.on("ready", () => {
      redisAvailable = true;
    });
    redisAvailable = true;
    return redisClient;
  } catch (e) {
    console.warn("[redis] failed to initialize:", (e as Error).message);
    return null;
  }
}

export function redisConfigured(): boolean {
  return Boolean(process.env.REDIS_URL);
}

export function redisActive(): boolean {
  if (!redisConfigured()) return false;
  getRedis(); // ensure client exists
  return redisAvailable;
}

// ─── Key/value helpers (Redis or in-memory) ────────────────────────────────

export async function kvSet(key: string, value: string, ttlSeconds?: number): Promise<void> {
  const client = getRedis();
  if (client && redisAvailable) {
    if (ttlSeconds) await client.set(key, value, "EX", ttlSeconds);
    else await client.set(key, value);
  } else {
    memStore.set(key, value);
    if (ttlSeconds) memTtl.set(key, Date.now() + ttlSeconds * 1000);
  }
}

export async function kvGet(key: string): Promise<string | null> {
  const client = getRedis();
  if (client && redisAvailable) {
    return client.get(key);
  }
  // check ttl
  const expiry = memTtl.get(key);
  if (expiry && Date.now() > expiry) {
    memStore.delete(key);
    memTtl.delete(key);
    return null;
  }
  return memStore.get(key) ?? null;
}

export async function kvDel(key: string): Promise<void> {
  const client = getRedis();
  if (client && redisAvailable) {
    await client.del(key);
  } else {
    memStore.delete(key);
    memTtl.delete(key);
  }
}

// ─── Redis-backed rate limiter ─────────────────────────────────────────────

export async function redisRateLimit(key: string, max: number, windowMs = 60_000): Promise<boolean> {
  const client = getRedis();
  if (client && redisAvailable) {
    const count = await client.incr(`rl:${key}`);
    if (count === 1) await client.pexpire(`rl:${key}`, windowMs);
    return count <= max;
  }
  // in-memory fallback
  return memRateLimit(key, max, windowMs);
}

const memBuckets = new Map<string, { count: number; resetAt: number }>();
function memRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = memBuckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    memBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= max) return false;
  bucket.count++;
  return true;
}
