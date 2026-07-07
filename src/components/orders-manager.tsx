"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Panel, Tag, ChangePill } from "@/components/ui";
import { num, kes, classNames, formatDate } from "@/lib/format";
import { placeOrder, cancelOrder } from "@/app/order-actions";
import type { PendingOrder } from "@/db/schema";

type SecOpt = { id: number; symbol: string; name: string; price: number };

export function OrdersManager({
  orders,
  stocks,
  cryptos,
  funds,
  portfolioId,
}: {
  orders: PendingOrder[];
  stocks: SecOpt[];
  cryptos: SecOpt[];
  funds: SecOpt[];
  portfolioId: number;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [type, setType] = useState<"stock" | "crypto" | "fund">("stock");
  const [sel, setSel] = useState("");
  const [action, setAction] = useState<"buy" | "sell">("buy");
  const [orderType, setOrderType] = useState<"limit" | "stop">("limit");
  const [qty, setQty] = useState("");
  const [tp, setTp] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const list = type === "stock" ? stocks : type === "crypto" ? cryptos : funds;
  const openOrders = orders.filter((o) => o.status === "open");

  const onPick = (id: string) => {
    setSel(id);
    const found = list.find((s) => String(s.id) === id);
    if (found) {
      const p = found.price;
      setTp(String((action === "buy" ? p * 0.98 : p * 1.02).toFixed(2)));
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
    start(async () => {
      const res = await placeOrder({
        portfolioId,
        securityType: type,
        refId: Number(sel),
        symbol: picked.symbol,
        name: picked.name,
        action,
        orderType,
        quantity: Number(qty),
        triggerPrice: Number(tp),
      });
      if (res.ok) {
        setMsg({ ok: true, text: `${orderType === "limit" ? "Limit" : "Stop"} order placed. We'll auto-fill when the price hits.` });
        setQty("");
        setSel("");
        router.refresh();
      } else setMsg({ ok: false, text: res.error || "Failed." });
    });
  };

  const STATUS_TONE: Record<string, "amber" | "green" | "red"> = {
    open: "amber",
    filled: "green",
    cancelled: "red",
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Open + historical orders */}
      <Panel className="lg:col-span-2" title="Orders" subtitle={`${openOrders.length} open · ${orders.length} total`}>
        {orders.length === 0 ? (
          <div className="px-4 py-12 text-center text-xs text-dim">
            <div className="text-2xl">📋</div>
            <p className="mt-2">No orders yet. Place a limit or stop order →</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="mono border-b border-line text-[10px] uppercase tracking-wider text-dim">
                  <th className="px-4 py-2 font-semibold">Symbol</th>
                  <th className="px-3 py-2 font-semibold">Type</th>
                  <th className="px-3 py-2 text-right font-semibold">Qty</th>
                  <th className="px-3 py-2 text-right font-semibold">Trigger</th>
                  <th className="px-3 py-2 text-right font-semibold">Filled @</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-line-soft">
                    <td className="px-4 py-2.5">
                      <Link
                        href={o.securityType === "crypto" ? `/crypto/${o.symbol}` : o.securityType === "fund" ? `/funds/${o.symbol}` : `/stocks/${o.symbol}`}
                        className="mono text-sm font-bold text-fg hover:text-brand"
                      >
                        {o.symbol}
                      </Link>
                      <div className="text-[10px] text-dim">{o.action} · {o.orderType}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      <Tag tone={o.action === "buy" ? "green" : "red"}>{o.action}</Tag>{" "}
                      <span className="mono text-[9px] text-dim">{o.orderType}</span>
                    </td>
                    <td className="mono tnum px-3 py-2.5 text-right">{num(o.quantity, 4)}</td>
                    <td className="mono tnum px-3 py-2.5 text-right text-muted">{num(o.triggerPrice)}</td>
                    <td className="mono tnum px-3 py-2.5 text-right">{o.filledPrice ? num(o.filledPrice) : "—"}</td>
                    <td className="px-3 py-2.5">
                      <Tag tone={STATUS_TONE[o.status] ?? "amber"}>{o.status}</Tag>
                    </td>
                    <td className="px-2 py-2.5">
                      {o.status === "open" && (
                        <button
                          disabled={pending}
                          onClick={() => start(async () => { await cancelOrder(o.id); router.refresh(); })}
                          className="mono rounded border border-line px-1.5 py-0.5 text-[9px] text-dim transition hover:border-down/50 hover:text-down"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* Place order form */}
      <Panel title="Place Order" subtitle="limit · stop-loss">
        <form onSubmit={submit} className="space-y-3 p-4">
          <div className="grid grid-cols-3 gap-1 rounded-md border border-line bg-term-900 p-1">
            {(["stock", "crypto", "fund"] as const).map((t) => (
              <button key={t} type="button" onClick={() => { setType(t); setSel(""); setTp(""); }}
                className={classNames("mono rounded py-1.5 text-[11px] font-bold uppercase tracking-wider transition", type === t ? "bg-brand/15 text-brand" : "text-muted hover:text-fg")}>
                {t === "stock" ? "Equity" : t === "crypto" ? "Crypto" : "Fund"}
              </button>
            ))}
          </div>
          <select value={sel} onChange={(e) => onPick(e.target.value)} className="mono w-full rounded-md border border-line bg-term-900 px-3 py-2 text-sm text-fg outline-none focus:border-brand">
            <option value="">Select {type}…</option>
            {list.map((s) => (
              <option key={s.id} value={s.id}>{s.symbol} — {s.name}</option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-1 rounded-md border border-line bg-term-900 p-1">
            {(["buy", "sell"] as const).map((a) => (
              <button key={a} type="button" onClick={() => setAction(a)}
                className={classNames("mono rounded py-1.5 text-[11px] font-bold uppercase tracking-wider transition", action === a ? (a === "buy" ? "bg-up/15 text-up" : "bg-down/15 text-down") : "text-muted hover:text-fg")}>
                {a}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-1 rounded-md border border-line bg-term-900 p-1">
            {(["limit", "stop"] as const).map((ot) => (
              <button key={ot} type="button" onClick={() => setOrderType(ot)}
                className={classNames("mono rounded py-1.5 text-[11px] font-bold uppercase tracking-wider transition", orderType === ot ? "bg-amber/15 text-amber" : "text-muted hover:text-fg")}>
                {ot === "limit" ? "Limit" : "Stop-Loss"}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mono mb-1 block text-[10px] uppercase tracking-wider text-dim">Quantity</label>
              <input value={qty} onChange={(e) => setQty(e.target.value)} type="number" step="any" className="mono tnum w-full rounded-md border border-line bg-term-900 px-2.5 py-2 text-sm text-fg outline-none focus:border-brand" />
            </div>
            <div>
              <label className="mono mb-1 block text-[10px] uppercase tracking-wider text-dim">Trigger Price</label>
              <input value={tp} onChange={(e) => setTp(e.target.value)} type="number" step="0.01" className="mono tnum w-full rounded-md border border-line bg-term-900 px-2.5 py-2 text-sm text-fg outline-none focus:border-brand" />
            </div>
          </div>
          <div className="mono rounded-md border border-line-soft bg-term-850 px-3 py-2 text-[10px] text-dim">
            {orderType === "limit" && action === "buy" && "Fills when price drops to or below your trigger."}
            {orderType === "limit" && action === "sell" && "Fills when price rises to or above your trigger."}
            {orderType === "stop" && action === "buy" && "Fills when price rises to your trigger (breakout)."}
            {orderType === "stop" && action === "sell" && "Fills when price drops to your trigger (stop-loss)."}
          </div>
          {msg && (
            <div className={classNames("mono rounded-md border px-3 py-2 text-xs", msg.ok ? "border-up/40 bg-up/5 text-up" : "border-down/40 bg-down/5 text-down")}>
              {msg.text}
            </div>
          )}
          <button type="submit" disabled={pending} className="btn-brand mono w-full rounded-md py-2.5 text-xs font-bold uppercase tracking-wider text-term-950 transition hover:brightness-110 disabled:opacity-50">
            {pending ? "Placing…" : "Place Order"}
          </button>
        </form>
      </Panel>
    </div>
  );
}
