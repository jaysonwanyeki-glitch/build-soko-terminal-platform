import { NextRequest } from "next/server";
import { fetchLiveCryptoPrices } from "@/lib/live-prices";
import { getAllCryptos } from "@/db/queries";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Server-Sent Events endpoint for live price streaming
export async function GET(_req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendTick = async () => {
        try {
          const cryptos = await getAllCryptos();
          const live = await fetchLiveCryptoPrices();
          const ticks = cryptos.slice(0, 12).map((c) => ({
            s: c.symbol,
            p: live[c.symbol] ?? c.price,
            c: c.changePct ?? 0,
          }));
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(ticks)}\n\n`)
          );
        } catch {
          // ignore errors, keep stream alive
        }
      };

      await sendTick();
      const interval = setInterval(sendTick, 5000);

      // cleanup on abort
      _req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
