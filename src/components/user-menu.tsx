"use client";

import { useState, useTransition } from "react";
import { logoutAction } from "@/app/auth-actions";

export function UserMenu({ name, email }: { name: string; email: string }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-xl border border-line bg-gradient-to-br from-term-700/50 to-term-900/60 py-1 pl-1 pr-2 transition hover:border-brand/50"
      >
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-brand to-cyan text-[11px] font-black text-term-950">
          {initials}
        </span>
        <span className="mono hidden text-[11px] font-semibold text-fg sm:block">{name.split(" ")[0]}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="panel absolute right-0 top-full z-50 mt-2 w-60 p-1">
            <div className="border-b border-line px-3 py-2.5">
              <div className="text-sm font-bold text-fg">{name}</div>
              <div className="mono truncate text-[10px] text-dim">{email}</div>
            </div>
            <button
              disabled={pending}
              onClick={() => start(async () => { await logoutAction(); })}
              className="mono mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-muted transition hover:bg-term-700 hover:text-down disabled:opacity-50"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <path d="M16 17l5-5-5-5 M21 12H9" />
              </svg>
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
