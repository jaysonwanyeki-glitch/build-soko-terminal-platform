"use client";

import { useId } from "react";
import { kes } from "@/lib/format";

type Pt = { date: string; totalValue: number; cashBalance: number };

export function EquityCurve({ data, height = 240 }: { data: Pt[]; height?: number }) {
  const gid = useId();
  const W = 800;
  const H = height;
  const padL = 8;
  const padR = 56;
  const padT = 12;
  const padB = 18;

  if (!data || data.length < 2) {
    return (
      <div className="grid place-items-center text-xs text-dim" style={{ height: H }}>
        Equity curve builds as you hold positions over time. Trade to begin tracking.
      </div>
    );
  }

  const vals = data.map((d) => d.totalValue);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const xFor = (i: number) => padL + (i / (data.length - 1)) * (W - padL - padR);
  const yFor = (v: number) => padT + (1 - (v - min) / range) * (H - padT - padB);
  const pts = data.map((d, i) => [xFor(i), yFor(d.totalValue)] as const);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L ${xFor(data.length - 1).toFixed(1)} ${H - padB} L ${padL} ${H - padB} Z`;
  const up = vals[vals.length - 1] >= vals[0];
  const color = up ? "#00e676" : "#ff5d75";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" className="block">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.32" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((g) => {
        const y = padT + g * (H - padT - padB);
        return (
          <g key={g}>
            <line x1={padL} x2={W - padR} y1={y} y2={y} stroke="#1a2540" />
            <text x={W - padR + 4} y={y + 3} fill="#5d6d8a" fontSize="9" className="mono">
              {kes(max - g * range)}
            </text>
          </g>
        );
      })}
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="4" fill={color} />
    </svg>
  );
}
