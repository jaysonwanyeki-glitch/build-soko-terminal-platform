"use client";

import { useState } from "react";

interface Props {
  portfolioId: number;
  portfolioName: string;
  currentBalance: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function MpesaModal({
  portfolioId,
  portfolioName,
  currentBalance,
  onClose,
  onSuccess,
}: Props) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stage, setStage] = useState<"input" | "pending" | "success">("input");
  const [txnId, setTxnId] = useState<number | null>(null);

  const handleSubmit = async () => {
    setError("");

    const cleanedPhone = phoneNumber.replace(/\s/g, "");
    if (!cleanedPhone.match(/^(0?7\d{8}|2547\d{8}|\+2547\d{8})$/)) {
      setError("Enter a valid Kenyan phone number: 07XX XXX XXX");
      return;
    }

    const parsedAmount = parseInt(amount);
    if (isNaN(parsedAmount) || parsedAmount < 10) {
      setError("Minimum deposit: KES 10");
      return;
    }
    if (parsedAmount > 150000) {
      setError("Maximum per transaction: KES 150,000");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/mpesa/stkpush", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portfolioId,
          phoneNumber: cleanedPhone,
          amount: parsedAmount,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "STK Push failed. Try again.");
        setLoading(false);
        return;
      }

      setTxnId(json.data.mpesaTxnId);
      setStage("pending");

      // Poll for status
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await fetch(
            `/api/mpesa/status?txnId=${json.data.mpesaTxnId}`
          );
          const statusJson = await statusRes.json();
          if (statusJson.data?.status === "COMPLETED") {
            clearInterval(pollInterval);
            setStage("success");
            onSuccess();
          } else if (statusJson.data?.status === "FAILED") {
            clearInterval(pollInterval);
            setError("Payment failed: " + (statusJson.data.resultDesc ?? "Unknown error"));
            setStage("input");
          }
        } catch {}
      }, 2000);

      // Stop polling after 3 minutes
      setTimeout(() => clearInterval(pollInterval), 180000);
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("254")) {
      return `0${cleaned.slice(3)}`;
    }
    return phone;
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-surface-1 border border-border-subtle rounded-lg p-5 w-[420px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">📱</span>
            <div>
              <div className="text-sm font-bold text-accent-green">
                M-PESA DEPOSIT
              </div>
              <div className="text-[10px] text-text-tertiary">{portfolioName}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-text-tertiary hover:text-accent-red text-sm"
          >
            ✕
          </button>
        </div>

        {stage === "input" && (
          <div className="space-y-4">
            {/* Balance Display */}
            <div className="bg-surface-0 border border-border-subtle rounded p-3 flex justify-between">
              <span className="text-[10px] text-text-tertiary">Current Balance</span>
              <span className="text-sm font-bold text-accent-blue">
                KES {currentBalance.toLocaleString()}
              </span>
            </div>

            {/* Phone Number */}
            <div>
              <label className="text-[10px] text-text-tertiary block mb-1">
                M-Pesa Phone Number
              </label>
              <div className="flex items-center bg-surface-0 border border-border-subtle rounded overflow-hidden focus-within:border-accent-green">
                <span className="text-text-tertiary text-xs px-2">🇰🇪</span>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="0712 345 678"
                  className="flex-1 bg-transparent text-accent-green text-sm px-2 py-2 focus:outline-none"
                />
              </div>
              {phoneNumber && (
                <div className="text-[9px] text-text-tertiary mt-0.5">
                  Will send to: {formatPhone(phoneNumber)}
                </div>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="text-[10px] text-text-tertiary block mb-1">
                Amount (KES)
              </label>
              <div className="flex items-center bg-surface-0 border border-border-subtle rounded overflow-hidden focus-within:border-accent-green">
                <span className="text-text-tertiary text-xs px-2">KES</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="1,000"
                  min="10"
                  max="150000"
                  className="flex-1 bg-transparent text-accent-green text-sm px-2 py-2 focus:outline-none"
                />
              </div>
              <div className="flex gap-1 mt-1">
                {[500, 1000, 5000, 10000].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setAmount(preset.toString())}
                    className="text-[9px] bg-surface-0 border border-border-subtle text-text-secondary px-2 py-0.5 rounded hover:border-accent-green hover:text-accent-green"
                  >
                    KES {preset.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary */}
            {amount && parseInt(amount) > 0 && (
              <div className="bg-surface-0 border border-border-subtle rounded p-3 text-[10px] space-y-1">
                <div className="flex justify-between text-text-tertiary">
                  <span>Deposit Amount</span>
                  <span className="text-text-secondary">
                    KES {parseInt(amount).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-text-tertiary">
                  <span>M-Pesa Fee</span>
                  <span className="text-accent-green">FREE</span>
                </div>
                <div className="flex justify-between text-text-tertiary border-t border-border-subtle pt-1">
                  <span>New Balance</span>
                  <span className="text-accent-blue font-bold">
                    KES {(currentBalance + parseInt(amount)).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {error && (
              <div className="text-[10px] text-accent-red bg-accent-red/20 border border-accent-red rounded p-2">
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading || !phoneNumber || !amount}
              className="w-full bg-accent-green text-white font-bold text-sm py-2.5 rounded hover:bg-accent-green/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span> SENDING STK PUSH...
                </span>
              ) : (
                "💳 DEPOSIT VIA M-PESA"
              )}
            </button>

            <div className="text-[9px] text-text-tertiary text-center">
              You will receive an STK push on your phone. Enter your M-Pesa PIN to
              complete.
            </div>
          </div>
        )}

        {stage === "pending" && (
          <div className="text-center py-6 space-y-4">
            <div className="text-4xl animate-bounce">📱</div>
            <div className="text-accent-green font-bold">STK Push Sent!</div>
            <div className="text-xs text-text-secondary">
              Check your phone and enter your M-Pesa PIN to complete the deposit of{" "}
              <span className="text-accent-green font-semibold">
                KES {parseInt(amount).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-center gap-1 text-text-tertiary">
              <span className="animate-spin">⏳</span>
              <span className="text-[10px]">Waiting for confirmation...</span>
            </div>
            <button
              onClick={onClose}
              className="text-[10px] text-text-tertiary hover:text-text-secondary underline"
            >
              Close (we'll credit automatically)
            </button>
          </div>
        )}

        {stage === "success" && (
          <div className="text-center py-6 space-y-4">
            <div className="text-4xl">✅</div>
            <div className="text-accent-green font-bold text-lg">Deposit Successful!</div>
            <div className="text-xs text-text-secondary">
              KES {parseInt(amount).toLocaleString()} has been credited to your portfolio.
            </div>
            <div className="bg-surface-0 border border-green-900 rounded p-3 text-[10px]">
              <div className="flex justify-between">
                <span className="text-text-tertiary">New Balance</span>
                <span className="text-accent-blue font-bold">
                  KES {(currentBalance + parseInt(amount)).toLocaleString()}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="bg-accent-green text-white font-bold text-sm px-6 py-2 rounded hover:bg-accent-green/90"
            >
              DONE
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
