"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleWatchlist } from "@/app/actions";

export function WatchButton({
  securityType,
  refId,
  symbol,
  name,
  watching,
}: {
  securityType: "stock" | "bond" | "crypto" | "fund";
  refId: number;
  symbol: string;
  name: string;
  watching: boolean;
}) {
  const [on, setOn] = useState(watching);
  const [pending, start] = useTransition();
  const [needsAuth, setNeedsAuth] = useState(false);
  const router = useRouter();
  const click = () =>
    start(async () => {
      const r = await toggleWatchlist({ securityType, refId, symbol, name });
      if (r.ok) {
        setOn(r.watching);
        setNeedsAuth(false);
        router.refresh();
      } else {
        // Not logged in — show sign-in prompt
        setNeedsAuth(true);
      }
    });
  return (
    <>
      <button
        onClick={click}
        disabled={pending}
        className={`mono inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition disabled:opacity-50 ${
          on
            ? "border-brand/50 bg-brand/10 text-brand"
            : "border-line text-muted hover:border-brand/40 hover:text-brand"
        }`}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
          <path d="M12 21l-1.5-1.4C5 15 2 12.4 2 8.8 2 6 4.2 4 7 4c1.7 0 3.3.8 4.3 2 .9-1.2 2.5-2 4.2-2 2.8 0 5 2 5 4.8 0 3.6-3 6.2-8.5 10.8z" />
        </svg>
        {pending ? "…" : on ? "Watching" : "Watch"}
      </button>
      {needsAuth && (
        <div className="mono fixed bottom-20 right-4 z-50 rounded-xl border border-brand/40 bg-term-900 px-4 py-3 text-xs shadow-xl lg:bottom-4">
          <p className="text-fg">Sign in to track securities</p>
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => router.push("/login")}
              className="btn-brand rounded-lg px-3 py-1 text-[10px] font-bold uppercase text-term-950"
            >
              Sign In
            </button>
            <button
              onClick={() => router.push("/register")}
              className="rounded-lg border border-line px-3 py-1 text-[10px] font-bold uppercase text-muted"
            >
              Register
            </button>
          </div>
        </div>
      )}
    </>
  );
}
