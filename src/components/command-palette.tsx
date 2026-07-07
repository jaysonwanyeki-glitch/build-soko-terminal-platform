"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { SearchItem } from "@/db/queries";

const TYPE_LABEL: Record<SearchItem["type"], string> = {
  stock: "EQUITY",
  bond: "BOND",
  index: "INDEX",
  crypto: "CRYPTO",
  fund: "FUND",
};
const TYPE_TONE: Record<SearchItem["type"], string> = {
  stock: "text-amber",
  bond: "text-cyan",
  index: "text-violet",
  crypto: "text-gold",
  fund: "text-up",
};

export function CommandPalette({ items }: { items: SearchItem[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items.slice(0, 8);
    return items
      .filter(
        (i) => i.label.toLowerCase().includes(q) || i.sub.toLowerCase().includes(q)
      )
      .slice(0, 12);
  }, [query, items]);

  useEffect(() => setActive(0), [query]);

  const choose = (item: SearchItem) => {
    setOpen(false);
    router.push(item.href);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group flex w-full max-w-md items-center gap-2 rounded-md border border-line bg-term-850 px-3 py-1.5 text-left transition hover:border-amber/40"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-dim">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="M21 21l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span className="flex-1 truncate text-xs text-dim group-hover:text-muted">
          Search equities, bonds, indices…
        </span>
        <kbd className="mono hidden rounded border border-line bg-term-900 px-1.5 py-0.5 text-[9px] font-semibold text-muted sm:block">
          ⌘K
        </kbd>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-4 pt-[12vh] backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="panel w-full max-w-xl overflow-hidden rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-line px-4 py-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-amber">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                <path d="M21 21l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setActive((a) => Math.min(a + 1, results.length - 1));
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setActive((a) => Math.max(a - 1, 0));
                  } else if (e.key === "Enter" && results[active]) {
                    choose(results[active]);
                  }
                }}
                placeholder="Type a symbol or name…"
                className="flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-dim"
              />
              <kbd className="mono rounded border border-line bg-term-900 px-1.5 py-0.5 text-[9px] text-dim">
                ESC
              </kbd>
            </div>
            <div className="max-h-[52vh] overflow-y-auto p-1.5">
              {results.length === 0 && (
                <div className="px-3 py-8 text-center text-xs text-dim">No matches found.</div>
              )}
              {results.map((item, i) => (
                <button
                  key={item.href + i}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(item)}
                  className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition ${
                    i === active ? "bg-amber/10" : "hover:bg-term-800"
                  }`}
                >
                  <span className={`mono text-[9px] font-bold ${TYPE_TONE[item.type]}`}>
                    {TYPE_LABEL[item.type]}
                  </span>
                  <span className="mono text-sm font-semibold text-fg">{item.label}</span>
                  <span className="truncate text-xs text-muted">{item.sub}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-line px-4 py-2 text-[10px] text-dim">
              <span className="mono">SOKO · {items.length} securities indexed</span>
              <span className="mono">↑↓ navigate · ↵ open</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
