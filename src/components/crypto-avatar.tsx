"use client";

import { useState } from "react";

const COLORS: Record<string, string> = {
  BTC: "#f7931a",
  ETH: "#627eea",
  USDT: "#26a17b",
  USDC: "#2775ca",
  BNB: "#f3ba2f",
  SOL: "#14f195",
  XRP: "#23292f",
  ADA: "#0033ad",
  DOGE: "#c2a633",
  TON: "#0098ea",
  AVAX: "#e84142",
  LINK: "#2a5ada",
  DOT: "#e6007a",
  MATIC: "#8247e5",
  LTC: "#345d9d",
  SHIB: "#f00500",
  DAI: "#f5ac37",
  TRX: "#ff060a",
  NEAR: "#00ec97",
  APT: "#06e3ad",
};

export function CryptoAvatar({ symbol, size = 28 }: { symbol: string; size?: number }) {
  const [err, setErr] = useState(false);
  const color = COLORS[symbol] || "#ffb020";

  if (err) {
    return (
      <span
        className="mono inline-grid shrink-0 place-items-center rounded-full font-black text-term-950"
        style={{
          width: size,
          height: size,
          background: `linear-gradient(135deg, ${color}, ${color}cc)`,
          fontSize: size * 0.36,
        }}
      >
        {symbol.slice(0, 1)}
      </span>
    );
  }

  const url = `https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color/${symbol.toLowerCase()}.svg`;

  return (
    <span
      className="inline-grid shrink-0 place-items-center overflow-hidden rounded-full"
      style={{ width: size, height: size, background: "rgba(255,255,255,0.04)" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={`${symbol} icon`}
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
        onError={() => setErr(true)}
        referrerPolicy="no-referrer"
      />
    </span>
  );
}
