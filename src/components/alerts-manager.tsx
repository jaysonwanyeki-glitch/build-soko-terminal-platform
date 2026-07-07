"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Panel, Tag } from "@/components/ui";
import { StockAvatar } from "@/components/stock-avatar";
import { CryptoAvatar } from "@/components/crypto-avatar";
import { num, classNames } from "@/lib/format";
import { addPriceTarget, removePriceTarget } from "@/app/actions";
import type { PriceTarget, Stock, Crypto } from "@/db/schema";

export function AlertsManager({
  targets,
  stocks,
  cryptos,
}: {
  targets: (PriceTarget & { currentPrice: number })[];
  stocks: Stock[];
  cryptos: Crypto[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [type, setType] = useState<"stock" | "crypto">("stock");
  const [sel, setSel] = useState("");
  const [tp, setTp] = useState("");
  const [direction, setDirection] = useState<"up" | "down">("up");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const list = type === "stock" ? stocks : cryptos;

  const onPick = (id: string) => {
    setSel(id);
    const found = list.find((s) => String(s.id) === id);
    if (found) {
      const p = type === "stock" ? (found as Stock).price ?? 0 : (found as Crypto).price ?? 0;
      setTp(String((p * 1.1).toFixed(2)));
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (!sel) {
      setMsg({ ok: false, text: "Select a security first." });
      return;
    }
    const picked = list.find((s) => String(s.id) === sel);
    if (!picked) return;
    const symbol = type === "stock" ? (picked as Stock).symbol : (picked as Crypto).symbol;
    start(async () => {
      const res = await addPriceTarget({
        securityType: type,
        refId: Number(sel),
        symbol,
        targetPrice: Number(tp),
        direction,
      });
      if (res.ok) {
        setMsg({ ok: true, text: `Alert set: ${symbol} ${direction === "up" ? "↑" : "↓"} ${num(Number(tp))}` });
        setTp("");
        setSel("");
        router.refresh();
      } else setMsg({ ok: false, text: res.error || "Failed." });
    });
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Active alerts */}
      <Panel className="lg:col-span-2" title="Active Price Alerts" subtitle={`${targets.length} alerts`}>
        {targets.length === 0 ? (
          <div className="px-4 py-12 text-center text-xs text-dim">
            <div className="text-2xl">🔔</div>
            <p className="mt-2">No alerts yet. Set a price target on the right.</p>
          </div>
        ) : (
          <div className="divide-y divide-line-soft">
            {targets.map((t) => {
              const hit = t.direction === "up" ? t.currentPrice >= t.targetPrice : t.currentPrice <= t.targetPrice;
              const dist = t.currentPrice > 0 ? (Math.abs(t.targetPrice - t.currentPrice) / t.currentPrice) * 100 : 0;
              return (
                <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                  {t.securityType === "crypto" ? (
                    <CryptoAvatar symbol={t.symbol} size={32} />
                  ) : (
                    <StockAvatar symbol={t.symbol} size={32} />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link href={t.securityType === "crypto" ? `/crypto/${t.symbol}` : `/stocks/${t.symbol}`} className="mono text-sm font-bold text-fg hover:text-amber">
                        {t.symbol}
                      </Link>
                      {hit && <Tag tone="green">🎯 HIT!</Tag>}
                    </div>
                    <div className="mono text-[10px] text-dim">
                      Alert when {t.direction === "up" ? "rises above ↑" : "drops below ↓"} <span className="text-amber">{num(t.targetPrice)}</span>
                    </div>
                    <div className="mt-1.5 h-1 w-full rounded-full bg-term-800">
                      <div
                        className={classNames("h-1 rounded-full", hit ? "bg-up" : "bg-amber")}
                        style={{ width: `${Math.min(100, Math.max(8, 100 - dist * 4))}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="mono tnum text-sm font-bold text-fg">{num(t.currentPrice)}</div>
                    <div className="mono text-[10px] text-dim">{dist.toFixed(1)}% away</div>
                  </div>
                  <button
                    disabled={pending}
                    onClick={() => start(async () => { await removePriceTarget(t.id); router.refresh(); })}
                    className="text-dim transition hover:text-down"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      {/* Create alert */}
      <Panel title="Set Price Alert" subtitle="get notified at your target">
        <form onSubmit={submit} className="space-y-3 p-4">
          <div className="grid grid-cols-2 gap-1.5 rounded-md border border-line bg-term-900 p-1">
            {(["stock", "crypto"] as const).map((t) => (
              <button key={t} type="button" onClick={() => { setType(t); setSel(""); setTp(""); }} className={classNames("mono rounded py-1.5 text-[11px] font-bold uppercase tracking-wider transition", type === t ? "bg-amber/15 text-amber" : "text-muted hover:text-fg")}>
                {t === "stock" ? "Equity" : "Crypto"}
              </button>
            ))}
          </div>
          <select value={sel} onChange={(e) => onPick(e.target.value)} className="mono w-full rounded-md border border-line bg-term-900 px-3 py-2 text-sm text-fg outline-none focus:border-amber/50">
            <option value="">Select {type}…</option>
            {list.map((s) => (
              <option key={s.id} value={s.id}>
                {type === "stock" ? `${(s as Stock).symbol} — ${(s as Stock).name}` : `${(s as Crypto).symbol} — ${(s as Crypto).name}`}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-1.5 rounded-md border border-line bg-term-900 p-1">
            {(["up", "down"] as const).map((d) => (
              <button key={d} type="button" onClick={() => setDirection(d)} className={classNames("mono rounded py-1.5 text-[11px] font-bold uppercase tracking-wider transition", direction === d ? (d === "up" ? "bg-up/15 text-up" : "bg-down/15 text-down") : "text-muted hover:text-fg")}>
                {d === "up" ? "↑ Above" : "↓ Below"}
              </button>
            ))}
          </div>
          <div>
            <label className="mono mb-1 block text-[10px] uppercase tracking-wider text-dim">Target Price (KSh)</label>
            <input value={tp} onChange={(e) => setTp(e.target.value)} type="number" step="0.01" className="mono tnum w-full rounded-md border border-line bg-term-900 px-3 py-2 text-sm text-fg outline-none focus:border-amber/50" />
          </div>
          {msg && (
            <div className={classNames("mono rounded-md border px-3 py-2 text-xs", msg.ok ? "border-up/40 bg-up/5 text-up" : "border-down/40 bg-down/5 text-down")}>
              {msg.text}
            </div>
          )}
          <button type="submit" disabled={pending} className="mono w-full rounded-md bg-amber py-2.5 text-xs font-bold uppercase tracking-wider text-term-950 transition hover:brightness-110 disabled:opacity-50">
            {pending ? "Setting…" : "Set Alert 🔔"}
          </button>
        </form>
      </Panel>
    </div>
  );
}
