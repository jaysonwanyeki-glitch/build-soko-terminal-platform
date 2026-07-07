"use client";

import { useId } from "react";

type Pt = { date?: string; value: number };
type Candle = { date?: string; open: number; high: number; low: number; close: number };

export function Sparkline({
  data,
  width = 120,
  height = 34,
  color = "#1fd585",
  strokeWidth = 1.5,
  fill = true,
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
  fill?: boolean;
}) {
  const gid = useId();
  if (!data || data.length < 2) return <div style={{ width, height }} />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = strokeWidth;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - pad - ((v - min) / range) * (height - pad * 2);
    return [x, y] as const;
  });
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L ${width} ${height} L 0 ${height} Z`;
  return (
    <svg width={width} height={height} className="block overflow-visible">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={area} fill={`url(#${gid})`} />}
      <path d={line} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function AreaChart({
  data,
  height = 220,
  color = "#ffb020",
  showGrid = true,
}: {
  data: Pt[];
  height?: number;
  color?: string;
  showGrid?: boolean;
}) {
  const gid = useId();
  const W = 800;
  const H = height;
  const padL = 6;
  const padR = 6;
  const padT = 10;
  const padB = 10;
  if (!data || data.length < 2)
    return <div className="grid place-items-center text-xs text-dim" style={{ height }}>No data</div>;
  const vals = data.map((d) => d.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const xFor = (i: number) => padL + (i / (data.length - 1)) * (W - padL - padR);
  const yFor = (v: number) => padT + (1 - (v - min) / range) * (H - padT - padB);
  const pts = data.map((d, i) => [xFor(i), yFor(d.value)] as const);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L ${xFor(data.length - 1).toFixed(1)} ${H - padB} L ${padL} ${H - padB} Z`;
  const gridLines = [0, 0.25, 0.5, 0.75, 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" className="block">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {showGrid &&
        gridLines.map((g) => (
          <line
            key={g}
            x1={padL}
            x2={W - padR}
            y1={padT + g * (H - padT - padB)}
            y2={padT + g * (H - padT - padB)}
            stroke="#1c2735"
            strokeWidth="1"
          />
        ))}
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3" fill={color} />
    </svg>
  );
}

export function CandleChart({ data, height = 320 }: { data: Candle[]; height?: number }) {
  if (!data || data.length < 2)
    return <div className="grid place-items-center text-xs text-dim" style={{ height }}>No data</div>;
  const cw = 9;
  const gap = 2;
  const W = data.length * (cw + gap);
  const H = height;
  const padT = 8;
  const padB = 8;
  const highs = data.map((d) => d.high);
  const lows = data.map((d) => d.low);
  const min = Math.min(...lows);
  const max = Math.max(...highs);
  const range = max - min || 1;
  const yFor = (v: number) => padT + (1 - (v - min) / range) * (H - padT - padB);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" className="block">
      {data.map((d, i) => {
        const x = i * (cw + gap) + cw / 2;
        const up = d.close >= d.open;
        const color = up ? "#1fd585" : "#ff5364";
        const yOpen = yFor(d.open);
        const yClose = yFor(d.close);
        const bodyTop = Math.min(yOpen, yClose);
        const bodyH = Math.max(1, Math.abs(yClose - yOpen));
        return (
          <g key={i}>
            <line x1={x} x2={x} y1={yFor(d.high)} y2={yFor(d.low)} stroke={color} strokeWidth="1" />
            <rect x={x - cw / 2} y={bodyTop} width={cw} height={bodyH} fill={color} opacity={up ? 0.9 : 0.95} />
          </g>
        );
      })}
    </svg>
  );
}

export function DonutChart({
  segments,
  size = 160,
  thickness = 22,
}: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
}) {
  const total = segments.reduce((a, b) => a + b.value, 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  if (total === 0)
    return (
      <div className="grid place-items-center rounded-full border-[3px] border-line text-[10px] text-dim" style={{ width: size, height: size }}>
        Empty
      </div>
    );
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block">
      <g transform={`translate(${size / 2},${size / 2}) rotate(-90)`}>
        <circle r={r} fill="none" stroke="#161d28" strokeWidth={thickness} />
        {segments.map((s, i) => {
          const len = (s.value / total) * c;
          const el = (
            <circle
              key={i}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={thickness}
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
            />
          );
          offset += len;
          return el;
        })}
      </g>
    </svg>
  );
}

export function BarsChart({
  bars,
  height = 200,
  formatVal,
}: {
  bars: { label: string; value: number; color?: string }[];
  height?: number;
  formatVal?: (v: number) => string;
}) {
  if (!bars.length) return null;
  const max = Math.max(...bars.map((b) => b.value)) || 1;
  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {bars.map((b, i) => {
        const h = Math.max(2, (b.value / max) * (height - 24));
        return (
          <div key={i} className="group flex flex-1 flex-col items-center justify-end gap-1">
            <span className="mono tnum text-[10px] font-semibold text-fg opacity-0 transition group-hover:opacity-100">
              {formatVal ? formatVal(b.value) : b.value.toFixed(2)}
            </span>
            <div
              className="w-full rounded-t"
              style={{ height: h, background: b.color ?? "#ffb020", opacity: 0.85 }}
            />
            <span className="mono text-[10px] text-dim">{b.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export function ScatterLine({
  points,
  height = 240,
  color = "#34d6e0",
  xLabels,
}: {
  points: { x: number; y: number; color?: string }[];
  height?: number;
  color?: string;
  xLabels?: { x: number; label: string }[];
}) {
  if (!points.length) return null;
  const W = 800;
  const H = height;
  const padL = 40;
  const padR = 16;
  const padT = 12;
  const padB = 24;
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const rx = maxX - minX || 1;
  const ry = maxY - minY || 1;
  const xFor = (x: number) => padL + ((x - minX) / rx) * (W - padL - padR);
  const yFor = (y: number) => padT + (1 - (y - minY) / ry) * (H - padT - padB);
  const sorted = [...points].sort((a, b) => a.x - b.x);
  const line = sorted.map((p, i) => `${i ? "L" : "M"}${xFor(p.x).toFixed(1)} ${yFor(p.y).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" className="block">
      {[0, 0.5, 1].map((g) => (
        <line key={g} x1={padL} x2={W - padR} y1={padT + g * (H - padT - padB)} y2={padT + g * (H - padT - padB)} stroke="#1c2735" />
      ))}
      <path d={line} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
      {points.map((p, i) => (
        <circle key={i} cx={xFor(p.x)} cy={yFor(p.y)} r="4.5" fill={p.color ?? color} stroke="#05070a" strokeWidth="1.5" />
      ))}
      {ys.map((y) => null)}
      {xLabels &&
        xLabels.map((xl, i) => (
          <text key={i} x={xFor(xl.x)} y={H - 6} fill="#5a6678" fontSize="11" textAnchor="middle" className="mono">
            {xl.label}
          </text>
        ))}
    </svg>
  );
}
