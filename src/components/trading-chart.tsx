"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  buildSeries,
  TIMEFRAMES,
  movingAvg,
  bollinger,
  rsi,
  macd,
  type TF,
  type QuoteRow,
} from "@/lib/intraday";
import { num, classNames } from "@/lib/format";

const UP = "#00ff9d";
const DOWN = "#ff5d75";

function axisLabel(v: number): string {
  const a = Math.abs(v);
  if (a >= 1e9) return (v / 1e9).toFixed(2) + "B";
  if (a >= 1e6) return (v / 1e6).toFixed(2) + "M";
  if (a >= 1e3) return (v / 1e3).toFixed(1) + "K";
  return num(v, a < 1 ? 6 : 2);
}

type Hover = { i: number; px: number; py: number };

type Ind = "bb" | "rsi" | "macd";

export function TradingChart({
  daily,
  symbol,
  height = 440,
}: {
  daily: QuoteRow[];
  symbol: string;
  height?: number;
}) {
  const [tf, setTf] = useState<TF>("1D");
  const [mounted, setMounted] = useState(false);
  const [w, setW] = useState(900);
  const [hover, setHover] = useState<Hover | null>(null);
  const [ind, setInd] = useState<Record<Ind, boolean>>({ bb: false, rsi: false, macd: false });
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setW(Math.max(320, e.contentRect.width));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const candles = useMemo(() => buildSeries(daily, tf, symbol), [daily, tf, symbol]);

  const padL = 8;
  const padR = 60;
  const padT = 10;
  const axisH = 18;
  const volH = 50;
  const gap = 8;
  const subH = 64; // height of each sub-panel (rsi / macd)
  const subGap = 6;

  const subCount = (ind.rsi ? 1 : 0) + (ind.macd ? 1 : 0);
  const subTotal = subCount * (subH + subGap);
  const priceH = Math.max(80, height - volH - axisH - padT - gap - subTotal);
  const W = w;

  if (!candles.length) {
    return <div className="grid h-40 place-items-center text-xs text-dim">No chart data.</div>;
  }

  let min = Infinity,
    max = -Infinity;
  for (const c of candles) {
    min = Math.min(min, c.l);
    max = Math.max(max, c.h);
  }
  const pad = (max - min) * 0.08 || 1;
  min -= pad;
  max += pad;
  const range = max - min || 1;

  const plotW = W - padL - padR;
  const n = candles.length;
  const step = plotW / n;
  const cw = Math.max(1, Math.min(14, step * 0.62));
  const x = (i: number) => padL + i * step + step / 2;
  const y = (p: number) => padT + (1 - (p - min) / range) * priceH;

  const ma9 = movingAvg(candles, 9);
  const ma21 = movingAvg(candles, 21);
  const bb = ind.bb ? bollinger(candles) : null;
  const rsiData = ind.rsi ? rsi(candles, 14) : null;
  const macdData = ind.macd ? macd(candles) : null;

  const pathFrom = (arr: (number | null)[], yFn: (p: number) => number) => {
    const pts: number[][] = [];
    arr.forEach((v, i) => {
      if (v != null) pts.push([x(i), yFn(v)]);
    });
    return pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  };

  const last = candles[n - 1];
  const active = hover ? candles[hover.i] : last;
  const chg = active.c - active.o;
  const chgPct = active.o ? (chg / active.o) * 100 : 0;
  const candleUp = chg >= 0;

  const maxVol = Math.max(...candles.map((c) => c.v)) || 1;
  const volBase = padT + priceH + gap + volH;

  const onMove = (e: React.MouseEvent<SVGRectElement>) => {
    const rect = (e.target as SVGRectElement).getBoundingClientRect();
    const mx = e.clientX - rect.left + padL;
    const my = e.clientY - rect.top + padT;
    let i = Math.round((mx - padL - step / 2) / step);
    i = Math.max(0, Math.min(n - 1, i));
    setHover({ i, px: x(i), py: my });
  };

  // sub-panel y positions
  let cursor = volBase + subGap;
  const rsiTop = ind.rsi ? cursor : 0;
  if (ind.rsi) cursor += subH + subGap;
  const macdTop = ind.macd ? cursor : 0;
  const captureH = priceH + gap + volH + subTotal;

  const IND_BTNS: { id: Ind; label: string; color: string }[] = [
    { id: "bb", label: "BB", color: "#4ee8b0" },
    { id: "rsi", label: "RSI", color: "#7dffba" },
    { id: "macd", label: "MACD", color: "#34e0a0" },
  ];

  return (
    <div ref={wrapRef} className="w-full select-none">
      {/* Header legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 pb-2">
        <div className="mono flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px]">
          <span className="font-bold text-fg">{symbol}</span>
          <span className="text-dim">{tf}</span>
          <span className="text-dim">·</span>
          <span style={{ color: candleUp ? UP : DOWN }} className="font-bold tnum">
            O {num(active.o)} H {num(active.h)} L {num(active.l)} C {num(active.c)}
          </span>
          <span style={{ color: candleUp ? UP : DOWN }} className="tnum">
            {chgPct >= 0 ? "+" : ""}
            {chgPct.toFixed(2)}%
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {IND_BTNS.map((b) => (
            <button
              key={b.id}
              onClick={() => setInd((s) => ({ ...s, [b.id]: !s[b.id] }))}
              className={classNames(
                "mono rounded px-1.5 py-0.5 text-[10px] font-bold transition",
                ind[b.id] ? "text-term-950" : "text-dim hover:bg-term-800 hover:text-fg"
              )}
              style={ind[b.id] ? { background: b.color } : undefined}
            >
              {b.label}
            </button>
          ))}
          <div className="mx-1 h-3 w-px bg-line" />
          {TIMEFRAMES.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTf(t.id);
                setHover(null);
              }}
              className={classNames(
                "mono rounded px-1.5 py-0.5 text-[10px] font-bold transition",
                tf === t.id ? "bg-amber/20 text-amber" : "text-dim hover:bg-term-800 hover:text-fg"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {mounted ? (
        <svg width={W} height={height} className="block overflow-visible">
          {/* grid + price axis */}
          {[0, 0.25, 0.5, 0.75, 1].map((g) => {
            const py = padT + g * priceH;
            const pv = max - g * range;
            return (
              <g key={g}>
                <line x1={padL} x2={W - padR} y1={py} y2={py} stroke="#141c27" />
                <text x={W - padR + 4} y={py + 3} fill="#5a6678" fontSize="9" className="mono">
                  {axisLabel(pv)}
                </text>
              </g>
            );
          })}

          {/* Bollinger Bands */}
          {bb && (
            <>
              <path d={pathFrom(bb.upper, y)} fill="none" stroke="#4ee8b0" strokeWidth="1" opacity="0.6" strokeDasharray="2 2" />
              <path d={pathFrom(bb.lower, y)} fill="none" stroke="#4ee8b0" strokeWidth="1" opacity="0.6" strokeDasharray="2 2" />
            </>
          )}

          {/* volume bars */}
          {candles.map((c, i) => {
            const cup = c.c >= c.o;
            const bh = (c.v / maxVol) * (volH - 4);
            return (
              <rect
                key={"v" + i}
                x={x(i) - cw / 2}
                width={cw}
                y={volBase - bh}
                height={Math.max(0.5, bh)}
                fill={cup ? UP : DOWN}
                opacity={0.22}
              />
            );
          })}

          {/* candles */}
          {candles.map((c, i) => {
            const cup = c.c >= c.o;
            const col = cup ? UP : DOWN;
            const yo = y(c.o);
            const yc = y(c.c);
            const top = Math.min(yo, yc);
            const bh = Math.max(1, Math.abs(yc - yo));
            return (
              <g key={"c" + i}>
                <line x1={x(i)} x2={x(i)} y1={y(c.h)} y2={y(c.l)} stroke={col} strokeWidth="1" />
                <rect x={x(i) - cw / 2} y={top} width={cw} height={bh} fill={col} opacity={cup ? 0.9 : 1} />
              </g>
            );
          })}

          {/* moving averages */}
          <path d={pathFrom(ma9, y)} fill="none" stroke="#4ee8b0" strokeWidth="1.4" opacity="0.9" />
          <path d={pathFrom(ma21, y)} fill="none" stroke="#7dffba" strokeWidth="1.4" opacity="0.9" />

          {/* RSI sub-panel */}
          {rsiData && (() => {
            const yR = (v: number) => rsiTop + (1 - v / 100) * subH;
            return (
              <g>
                <rect x={padL} y={rsiTop} width={plotW} height={subH} fill="#0b0f15" opacity="0.5" />
                {[30, 70].map((lvl) => (
                  <line key={lvl} x1={padL} x2={W - padR} y1={yR(lvl)} y2={yR(lvl)} stroke="#1c2735" strokeDasharray="2 2" />
                ))}
                <path d={pathFrom(rsiData, yR)} fill="none" stroke="#7dffba" strokeWidth="1.3" />
                <text x={padL + 2} y={rsiTop + 9} fill="#7dffba" fontSize="9" className="mono">RSI(14)</text>
                <text x={W - padR + 4} y={rsiTop + 9} fill="#5a6678" fontSize="9" className="mono">
                  {rsiData[n - 1] != null ? (rsiData[n - 1] as number).toFixed(1) : "—"}
                </text>
              </g>
            );
          })()}

          {/* MACD sub-panel */}
          {macdData && (() => {
            const vals = [...macdData.macd, ...macdData.signal].filter((v): v is number => v != null);
            const mn = Math.min(...vals, 0);
            const mx = Math.max(...vals, 0);
            const rng = mx - mn || 1;
            const yM = (v: number) => macdTop + (1 - (v - mn) / rng) * subH;
            const zeroY = yM(0);
            return (
              <g>
                <rect x={padL} y={macdTop} width={plotW} height={subH} fill="#0b0f15" opacity="0.5" />
                <line x1={padL} x2={W - padR} y1={zeroY} y2={zeroY} stroke="#1c2735" strokeDasharray="2 2" />
                {/* histogram */}
                {macdData.hist.map((h, i) =>
                  h != null ? (
                    <rect
                      key={"h" + i}
                      x={x(i) - cw / 2}
                      width={cw}
                      y={Math.min(zeroY, yM(h))}
                      height={Math.max(0.5, Math.abs(yM(h) - zeroY))}
                      fill={h >= 0 ? UP : DOWN}
                      opacity={0.4}
                    />
                  ) : null
                )}
                <path d={pathFrom(macdData.macd, yM)} fill="none" stroke="#34e0a0" strokeWidth="1.2" />
                <path d={pathFrom(macdData.signal, yM)} fill="none" stroke="#4ee8b0" strokeWidth="1.2" />
                <text x={padL + 2} y={macdTop + 9} fill="#34e0a0" fontSize="9" className="mono">MACD(12,26,9)</text>
              </g>
            );
          })()}

          {/* crosshair */}
          {hover && (
            <>
              <line x1={hover.px} x2={hover.px} y1={padT} y2={volBase + subTotal} stroke="#8a98ac" strokeDasharray="3 3" opacity="0.4" />
              <line x1={padL} x2={W - padR} y1={hover.py} y2={hover.py} stroke="#8a98ac" strokeDasharray="3 3" opacity="0.4" />
              <g>
                <rect x={W - padR} y={hover.py - 7} width={padR} height={14} fill="#161d28" />
                <text x={W - padR + 4} y={hover.py + 3} fill="#e7edf5" fontSize="9" className="mono">
                  {axisLabel(max - ((hover.py - padT) / priceH) * range)}
                </text>
              </g>
            </>
          )}

          {/* time axis labels */}
          {[0, 1, 2, 3, 4, 5].map((k) => {
            const i = Math.floor((k / 5) * (n - 1));
            return (
              <text key={k} x={x(i)} y={height - 4} textAnchor="middle" fill="#5a6678" fontSize="9" className="mono">
                {candles[i]?.label}
              </text>
            );
          })}

          {/* MA legend */}
          <text x={padL + 2} y={padT + 10} fill="#4ee8b0" fontSize="9" className="mono">MA9</text>
          <text x={padL + 34} y={padT + 10} fill="#7dffba" fontSize="9" className="mono">MA21</text>

          {/* mouse capture */}
          <rect
            x={padL}
            y={padT}
            width={plotW}
            height={captureH}
            fill="transparent"
            onMouseMove={onMove}
            onMouseLeave={() => setHover(null)}
          />
        </svg>
      ) : (
        <div style={{ height }} className="grid place-items-center text-xs text-dim">
          Loading chart…
        </div>
      )}
    </div>
  );
}
