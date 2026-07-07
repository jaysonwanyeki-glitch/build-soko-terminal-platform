import "server-only";

// ─── Observability / Error Tracking (Sentry with graceful fallback) ────────
// Sentry is loaded dynamically ONLY when SENTRY_DSN is configured.
// All capture methods are no-ops otherwise, so the app runs fine without it.

let initialized = false;
let Sentry: typeof import("@sentry/node") | null = null;

export function sentryConfigured(): boolean {
  return Boolean(process.env.SENTRY_DSN);
}

export async function initSentry() {
  if (initialized) return;
  if (!sentryConfigured()) return;
  try {
    Sentry = await import("@sentry/node");
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || "development",
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || "0.1"),
    });
    initialized = true;
    console.log("[sentry] initialized");
  } catch (e) {
    console.warn("[sentry] failed to initialize:", (e as Error).message);
  }
}

/** Capture an exception to Sentry (or console if not configured). */
export function captureException(error: unknown, context?: Record<string, unknown>) {
  if (!Sentry || !sentryConfigured()) {
    console.error("[observability] exception:", error, context ?? "");
    return;
  }
  Sentry.captureException(error, { extra: context });
}

/** Capture a custom info message. */
export function captureMessage(message: string, level: "info" | "warning" | "error" = "info") {
  if (!Sentry || !sentryConfigured()) {
    const fn = level === "error" ? console.error : level === "warning" ? console.warn : console.info;
    fn(`[observability] ${message}`);
    return;
  }
  Sentry.captureMessage(message, level);
}

export type SystemHealth = {
  database: boolean;
  redis: boolean;
  email: boolean;
  sentry: boolean;
};

// Inline imports to avoid circular dependency at module load
export async function getSystemHealth(dbCheck: () => Promise<boolean>): Promise<SystemHealth> {
  const { redisActive } = await import("@/lib/redis");
  const { emailConfigured } = await import("@/lib/email");
  return {
    database: await dbCheck().catch(() => false),
    redis: redisActive(),
    email: emailConfigured(),
    sentry: sentryConfigured(),
  };
}
