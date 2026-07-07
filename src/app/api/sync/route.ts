import { NextRequest, NextResponse } from "next/server";
import { runDataSync } from "@/lib/providers/data-sync";
import { captureException } from "@/lib/observability";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

// Admin data sync endpoint. Triggers a full sync of FX rates (CBK) and
// stock prices (Alpha Vantage / NSE scraper).
// Protect with a secret header in production.
export async function POST(req: NextRequest) {
  // Optional secret protection
  const syncSecret = process.env.SYNC_SECRET;
  if (syncSecret) {
    const provided = req.headers.get("x-sync-secret") || "";
    if (provided !== syncSecret) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    console.log("[sync] manual sync triggered");
    const report = await runDataSync();
    return NextResponse.json({ ok: true, report });
  } catch (e) {
    captureException(e, { context: "data-sync" });
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "Data sync endpoint. POST to trigger a sync.",
    sources: {
      fx: "CBK (Central Bank of Kenya)",
      stocks: "Alpha Vantage (if configured) → NSE scraper (if Playwright installed) → seeded fallback",
    },
  });
}
