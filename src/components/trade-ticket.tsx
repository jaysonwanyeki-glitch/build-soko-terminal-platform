"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { executeTrade } from "@/app/actions";
import { kes, classNames } from "@/lib/format";

type SecType = "stock" | "bond" | "crypto" | "fund";

export function TradeTicket({
  securityType,
  refId,
  symbol,
  name,
  price,
  faceValue,
  portfolioId,
  cashBalance,
}: {
  securityType: SecType;
  refId: number;
  symbol: string;
  name: string;
  price: number;
  faceValue?: number;
  portfolioId: number;
  cashBalance: number;
}) {
  const [action, setAction] = useState<"buy" | "sell">("buy");
  const [qty, setQty] = useState("");
  const [px, setPx] = useState(price ? price.toFixed(price < 1 ? 6 : 2) : "");
  const [fees, setFees] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  const isBond = securityType === "bond";
  const isCrypto = securityType === "crypto";
  const unitLabel = isBond ? "Face value (KSh)" : isCrypto ? "Amount (coins)" : "Quantity (shares)";
  const qtyStep = isBond ? 50000 : isCrypto ? "any" : 1;
  const priceLabel = isBond ? "Clean price %" : "Price (KSh)";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    start(async () => {
      const res = await executeTrade({
        portfolioId,
        securityType,
        refId,
        symbol,
        name,
        action,
        quantity: Number(qty),
        price: Number(px),
        fees: Number(fees || 0),
      });
      if (res.ok) {
        const verb = action === "buy" ? "Filled" : "Sold";
        setMsg({
          ok: true,
          text: `${verb} ${Number(qty)} ${symbol} · wallet now ${kes(res.balance ?? 0)}.`,
        });
        setQty("");
        router.refresh();
      } else {
        setMsg({ ok: false, text: res.error || "Order failed." });
      }
    });
  };

  const qtyNum = Number(qty) || 0;
  const pxNum = Number(px) || 0;
  const eff = isBond ? pxNum / 100 : pxNum;
  const notional = qtyNum * eff + Number(fees || 0);
  const affordable = action === "buy" && pxNum > 0 ? Math.floor((cashBalance / eff) * (isCrypto ? 1e6 : 1)) / (isCrypto ? 1e6 : 1) : 0;

  return (
    <form onSubmit={submit} className="space-y-3">
      {/* wallet balance */}
      <div className="flex items-center justify-between rounded-md border border-up/30 bg-up/5 px-3 py-2">
        <span className="mono text-[10px] uppercase tracking-wider text-dim">M-Pesa wallet</span>
        <span className="mono tnum text-sm font-bold text-up">{kes(cashBalance)}</span>
      </div>

      <div className="grid grid-cols-2 gap-1.5 rounded-md border border-line bg-term-900 p-1">
        {(["buy", "sell"] as const).map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => setAction(a)}
            className={classNames(
              "mono rounded py-1.5 text-xs font-bold uppercase tracking-wider transition",
              action === a
                ? a === "buy"
                  ? "bg-up/15 text-up"
                  : "bg-down/15 text-down"
                : "text-muted hover:text-fg"
            )}
          >
            {a}
          </button>
        ))}
      </div>

      <div>
        <label className="mono mb-1 block text-[10px] uppercase tracking-wider text-dim">{unitLabel}</label>
        <input
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          type="number"
          min="0"
          step={qtyStep}
          placeholder={isBond ? "e.g. 500000" : isCrypto ? "e.g. 0.001" : "e.g. 1000"}
          className="mono tnum w-full rounded-md border border-line bg-term-900 px-3 py-2 text-sm text-fg outline-none focus:border-amber/50"
        />
        {action === "buy" && affordable > 0 && (
          <button
            type="button"
            onClick={() => setQty(String(affordable))}
            className="mono mt-1 text-[10px] text-dim underline-offset-2 hover:text-amber hover:underline"
          >
            Max ≈ {isCrypto ? affordable.toFixed(6) : affordable.toLocaleString("en-KE")}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mono mb-1 block text-[10px] uppercase tracking-wider text-dim">{priceLabel}</label>
          <input
            value={px}
            onChange={(e) => setPx(e.target.value)}
            type="number"
            min="0"
            step="0.01"
            className="mono tnum w-full rounded-md border border-line bg-term-900 px-3 py-2 text-sm text-fg outline-none focus:border-amber/50"
          />
        </div>
        <div>
          <label className="mono mb-1 block text-[10px] uppercase tracking-wider text-dim">Fees (KSh)</label>
          <input
            value={fees}
            onChange={(e) => setFees(e.target.value)}
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            className="mono tnum w-full rounded-md border border-line bg-term-900 px-3 py-2 text-sm text-fg outline-none focus:border-amber/50"
          />
        </div>
      </div>

      {notional > 0 && (
        <div className="mono flex items-center justify-between rounded-md border border-line-soft bg-term-850 px-3 py-2 text-xs">
          <span className="text-dim">
            {action === "buy" ? "Total cost" : "Net proceeds"}
          </span>
          <span className="tnum font-semibold text-fg">{kes(notional)}</span>
        </div>
      )}

      {msg && (
        <div
          className={classNames(
            "mono rounded-md border px-3 py-2 text-xs",
            msg.ok ? "border-up/40 bg-up/5 text-up" : "border-down/40 bg-down/5 text-down"
          )}
        >
          {msg.text}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className={classNames(
          "mono w-full rounded-md py-2.5 text-xs font-bold uppercase tracking-wider transition disabled:opacity-50",
          action === "buy"
            ? "bg-up/90 text-term-950 hover:bg-up"
            : "bg-down/90 text-term-950 hover:bg-down"
        )}
      >
        {pending ? "Executing…" : `${action === "buy" ? "Buy" : "Sell"} ${symbol} via M-Pesa`}
      </button>
      <p className="text-[10px] leading-relaxed text-dim">
        {isBond && faceValue
          ? `Minimum lot KSh ${faceValue.toLocaleString("en-KE")} face value. Semi-annual coupons via CBK DVP.`
          : isCrypto
          ? `Settles instantly from your M-Pesa wallet. 24/7 trading — crypto never sleeps.`
          : `Settles from your M-Pesa wallet. NSE T+3 settlement cycle applies.`}
      </p>
    </form>
  );
}
