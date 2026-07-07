"use client";

import { useState } from "react";
import { brandFor, sectorImage } from "@/lib/sector-brand";
import { stockDomain } from "@/lib/company-logos";

type LogoStage = 0 | 1 | 2; // 0 clearbit → 1 favicon → 2 monogram

export function StockAvatar({
  symbol,
  sector,
  size = 32,
}: {
  symbol: string;
  sector?: string | null;
  size?: number;
}) {
  const domain = stockDomain(symbol);
  const [stage, setStage] = useState<LogoStage>(0);
  const brand = brandFor(sector);
  const radius = size <= 36 ? 8 : 12;

  // monogram fallback (no domain, or both logos failed)
  if (stage >= 2 || !domain) {
    return (
      <span
        className="mono inline-grid shrink-0 place-items-center font-black text-term-950"
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          background: `linear-gradient(135deg, ${brand.color}, ${brand.color2})`,
          fontSize: size * 0.38,
          boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.25)",
        }}
      >
        {symbol.slice(0, 1)}
      </span>
    );
  }

  const url =
    stage === 0
      ? `https://logo.clearbit.com/${domain}?size=128`
      : `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

  return (
    <span
      className="inline-grid shrink-0 place-items-center overflow-hidden border border-line"
      style={{ width: size, height: size, borderRadius: radius, background: "#fff" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={`${symbol} logo`}
        className="object-contain"
        style={{ width: "78%", height: "78%" }}
        onError={() => setStage((s) => (s + 1) as LogoStage)}
        referrerPolicy="no-referrer"
      />
    </span>
  );
}

// Wider cinematic banner used on detail-page headers (uses sector photography).
export function SectorBanner({ sector, height = 120 }: { sector: string | null; height?: number }) {
  const brand = brandFor(sector);
  const img = sectorImage(sector);
  if (!img)
    return (
      <div
        className="w-full rounded-xl"
        style={{
          height,
          background: `linear-gradient(120deg, ${brand.color}26, ${brand.color2}12)`,
        }}
      />
    );
  return (
    <div className="relative w-full overflow-hidden rounded-xl" style={{ height }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={img} alt={sector || ""} className="h-full w-full object-cover" style={{ filter: "brightness(0.55)" }} />
      <div
        className="absolute inset-0"
        style={{ background: `linear-gradient(90deg, rgba(5,7,10,0.92) 5%, rgba(5,7,10,0.4) 55%, transparent)` }}
      />
      <div className="absolute bottom-2.5 left-3">
        <span
          className="mono inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
          style={{ background: brand.color + "22", color: brand.color }}
        >
          {sector}
        </span>
      </div>
    </div>
  );
}
