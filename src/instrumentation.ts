// Next.js instrumentation hook — runs on server startup.
// Safely initializes Sentry if configured. Wrapped in try/catch so
// the server never crashes if Sentry fails to load.

export async function register() {
  if (!process.env.SENTRY_DSN) return; // skip entirely if not configured
  try {
    const { initSentry } = await import("@/lib/observability");
    initSentry();
  } catch (e) {
    console.warn("[instrumentation] Sentry init skipped:", (e as Error).message);
  }
}
