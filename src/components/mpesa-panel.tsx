"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Panel, Tag } from "@/components/ui";
import { kes, timeAgo, classNames } from "@/lib/format";
import { formatPhoneK } from "@/lib/mpesa";
import { startMpesaPayment, checkMpesaPayment } from "@/app/mpesa-actions";
import type { MpesaPayment } from "@/db/schema";

const QUICK = [500, 1000, 5000, 10000, 25000, 50000];

type Phase = "idle" | "prompting" | "success" | "failed";

export function MpesaPanel({
  portfolioId,
  cashBalance,
  mode,
  history,
}: {
  portfolioId: number;
  cashBalance: number;
  mode: "live" | "simulation";
  history: MpesaPayment[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [msg, setMsg] = useState<string>("");
  const [receipt, setReceipt] = useState<string | null>(null);
  const [checkoutId, setCheckoutId] = useState<string | null>(null);

  const reset = () => {
    setPhase("idle");
    setMsg("");
    setReceipt(null);
    setCheckoutId(null);
  };

  const pay = (e: React.FormEvent) => {
    e.preventDefault();
    reset();
    start(async () => {
      const res = await startMpesaPayment({
        portfolioId,
        phone,
        amount: Number(amount),
      });
      if (!res.ok || !res.checkoutRequestId) {
        setPhase("failed");
        setMsg(res.error || "Could not start payment.");
        return;
      }
      setCheckoutId(res.checkoutRequestId);
      setPhase("prompting");
      setMsg(res.customerMessage || "Check your phone and enter your M-Pesa PIN.");
      poll(res.checkoutRequestId);
    });
  };

  const poll = (id: string) => {
    let attempts = 0;
    const t = setInterval(async () => {
      attempts++;
      const r = await checkMpesaPayment(id);
      if (r.status === "completed") {
        clearInterval(t);
        setPhase("success");
        setReceipt(r.receipt ?? null);
        setMsg(`Credited ${kes(r.amount ?? 0)} to your wallet.`);
        setAmount("");
        router.refresh();
      } else if (r.status === "failed" || r.status === "missing" || attempts > 24) {
        clearInterval(t);
        if (phase !== "success") {
          setPhase("failed");
          setMsg("Payment was not completed or timed out.");
        }
      }
    }, 2000);
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Fund form */}
      <Panel className="lg:col-span-2" title="Fund with M-Pesa" subtitle="Lipa Na M-Pesa Online · STK Push">
        <div className="p-4">
          {/* balance + mode */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-md border border-line-soft bg-term-850 px-4 py-3">
            <div>
              <div className="mono text-[10px] uppercase tracking-wider text-dim">Wallet balance</div>
              <div className="mono tnum text-xl font-black text-up">{kes(cashBalance)}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl">📱</span>
              <div className="leading-tight">
                <div className="mono text-[10px] font-bold text-fg">M-PESA</div>
                {mode === "live" ? (
                  <Tag tone="green">LIVE · DARAJA</Tag>
                ) : (
                  <Tag tone="amber">SIMULATION</Tag>
                )}
              </div>
            </div>
          </div>

          <form onSubmit={pay} className="space-y-3">
            <div>
              <label className="mono mb-1 block text-[10px] uppercase tracking-wider text-dim">
                M-Pesa Phone Number
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="tel"
                placeholder="0712 345 678"
                className="mono w-full rounded-md border border-line bg-term-900 px-3 py-2.5 text-sm text-fg outline-none focus:border-green"
              />
            </div>

            <div>
              <label className="mono mb-1 block text-[10px] uppercase tracking-wider text-dim">
                Amount (KSh)
              </label>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                type="number"
                min="1"
                placeholder="e.g. 5000"
                className="mono tnum w-full rounded-md border border-line bg-term-900 px-3 py-2.5 text-sm text-fg outline-none focus:border-green"
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {QUICK.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setAmount(String(q))}
                    className="mono rounded-full border border-line px-2.5 py-1 text-[10px] text-muted transition hover:border-green/50 hover:text-green"
                  >
                    +{q.toLocaleString("en-KE")}
                  </button>
                ))}
              </div>
            </div>

            {/* status */}
            {phase !== "idle" && (
              <div
                className={classNames(
                  "flex items-start gap-2 rounded-md border px-3 py-2.5 text-xs",
                  phase === "success"
                    ? "border-up/40 bg-up/5 text-up"
                    : phase === "failed"
                    ? "border-down/40 bg-down/5 text-down"
                    : "border-amber/40 bg-amber/5 text-amber"
                )}
              >
                {phase === "prompting" && (
                  <span className="mt-0.5 inline-block h-3 w-3 animate-spin-slow rounded-full border-2 border-amber border-t-transparent" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">
                    {phase === "prompting" && "Awaiting confirmation…"}
                    {phase === "success" && "Payment received ✓"}
                    {phase === "failed" && "Payment failed"}
                  </div>
                  <div className="mt-0.5 opacity-90">{msg}</div>
                  {receipt && (
                    <div className="mono mt-1 text-[10px]">
                      Receipt: <span className="font-bold">{receipt}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={pending || phase === "prompting"}
              className="mono flex w-full items-center justify-center gap-2 rounded-md bg-ke-green py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:brightness-110 disabled:opacity-50"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="5" y="2" width="14" height="20" rx="2" />
                <path d="M12 18h.01" />
              </svg>
              {pending ? "Initiating…" : "Pay with M-Pesa"}
            </button>
            {mode === "simulation" && (
              <p className="text-[10px] leading-relaxed text-dim">
                Running in <span className="font-semibold text-amber">simulation mode</span> — set
                <span className="mono"> MPESA_CONSUMER_KEY</span>,
                <span className="mono"> MPESA_CONSUMER_SECRET</span>,
                <span className="mono"> MPESA_SHORTCODE</span> and
                <span className="mono"> MPESA_PASSKEY</span> to go live with Safaricom Daraja. The simulated prompt auto-confirms after a few seconds.
              </p>
            )}
          </form>
        </div>
      </Panel>

      {/* History */}
      <Panel title="M-Pesa Deposits" subtitle="recent top-ups">
        <div className="max-h-[360px] overflow-y-auto">
          {history.length === 0 && (
            <div className="px-4 py-10 text-center text-xs text-dim">
              No deposits yet. Fund your wallet to start trading.
            </div>
          )}
          {history.map((p) => {
            const tone =
              p.status === "completed" ? "text-up" : p.status === "failed" ? "text-down" : "text-amber";
            return (
              <div
                key={p.id}
                className="flex items-center justify-between border-b border-line-soft px-4 py-2.5 last:border-0"
              >
                <div className="min-w-0">
                  <div className="mono tnum text-sm font-bold text-fg">{kes(p.amount)}</div>
                  <div className="truncate text-[10px] text-dim">{formatPhoneK(p.phone)}</div>
                </div>
                <div className="text-right">
                  <div className={classNames("mono text-[10px] font-bold uppercase", tone)}>
                    {p.status}
                  </div>
                  {p.receipt && <div className="mono text-[9px] text-dim">{p.receipt}</div>}
                  <div className="mono text-[9px] text-dim">{timeAgo(p.createdAt)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
