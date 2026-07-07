"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChangePill } from "@/components/ui";
import { num } from "@/lib/format";
import { removeFromWatchlist } from "@/app/actions";
import type { WatchRow } from "@/db/queries";

export function WatchlistTable({ items }: { items: WatchRow[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <div className="divide-y divide-line-soft">
      {items.map((w) => (
        <div key={w.id} className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className={
                w.securityType === "stock"
                  ? "mono rounded bg-amber/10 px-1.5 py-0.5 text-[9px] font-bold text-amber"
                  : "mono rounded bg-cyan/10 px-1.5 py-0.5 text-[9px] font-bold text-cyan"
              }
            >
              {w.securityType === "stock" ? "EQTY" : "BOND"}
            </span>
            <div className="min-w-0">
              <Link
                href={w.securityType === "stock" ? `/stocks/${w.symbol}` : `/bonds/${w.refId}`}
                className="mono text-sm font-bold text-fg hover:text-amber"
              >
                {w.symbol}
              </Link>
              <div className="max-w-[180px] truncate text-[10px] text-dim">{w.name}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="mono tnum text-sm font-semibold text-fg">{num(w.currentPrice)}</div>
              <ChangePill value={w.changePct} showArrow={false} />
            </div>
            <button
              disabled={pending}
              onClick={() =>
                start(async () => {
                  await removeFromWatchlist(w.id);
                  router.refresh();
                })
              }
              className="mono rounded border border-line px-2 py-1 text-[10px] text-dim transition hover:border-down/50 hover:text-down disabled:opacity-50"
            >
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
