import Link from "next/link";
import { Panel } from "@/components/ui";
import { WatchlistTable } from "@/components/watchlist-table";
import { getWatchlist } from "@/db/queries";

export const dynamic = "force-dynamic";

export default async function WatchlistPage() {
  const items = await getWatchlist();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="mono text-lg font-black tracking-tight text-fg">WATCHLIST <span className="text-amber">·</span> LIVE TRACKING</h1>
        <p className="mono text-[11px] text-dim">{items.length} securities tracked across equities and bonds.</p>
      </div>

      <Panel title="My Watchlist">
        {items.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <div className="text-3xl">★</div>
            <p className="mt-3 text-sm text-muted">Your watchlist is empty.</p>
            <p className="mono text-[11px] text-dim">Tap the Watch button on any security to add it here.</p>
            <div className="mt-5 flex justify-center gap-2">
              <Link href="/stocks" className="mono rounded-md border border-amber/40 px-3 py-1.5 text-[11px] text-amber hover:bg-amber/10">
                Browse Equities
              </Link>
              <Link href="/bonds" className="mono rounded-md border border-cyan/40 px-3 py-1.5 text-[11px] text-cyan hover:bg-cyan/10">
                Browse Bonds
              </Link>
            </div>
          </div>
        ) : (
          <WatchlistTable items={items} />
        )}
      </Panel>
    </div>
  );
}
