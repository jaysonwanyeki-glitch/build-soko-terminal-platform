"use client";

import { useEffect, useState } from "react";

interface HourData {
  hour: number;
  intensity: number; // 0-100
  label: string;
  nseActive: boolean;
  forexActive: boolean;
  overlapActive: boolean;
}

export function TradingHours() {
  const [currentHour, setCurrentHour] = useState<number>(0);
  const [currentMinute, setCurrentMinute] = useState<number>(0);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      // Convert to EAT (UTC+3)
      const eatHour = (now.getUTCHours() + 3) % 24;
      setCurrentHour(eatHour);
      setCurrentMinute(now.getUTCMinutes());
    };
    tick();
    const interval = setInterval(tick, 10000);
    return () => clearInterval(interval);
  }, []);

  // Generate hourly liquidity data based on known NSE patterns
  const hours: HourData[] = Array.from({ length: 24 }, (_, h) => {
    // NSE: 09:00-15:00 active
    const nseActive = h >= 9 && h < 15;
    // Forex prime: 08:00-17:00
    const forexActive = h >= 8 && h < 17;
    // Global overlap: 13:00-15:00 (EU + US pre-open)
    const overlapActive = h >= 13 && h < 15;

    let intensity = 0;
    if (h < 8) intensity = h * 2; // Very low before 8am
    else if (h === 8) intensity = 35; // Pre-open pickup
    else if (h === 9) intensity = 75; // Market open surge
    else if (h === 10) intensity = 85; // Peak morning
    else if (h === 11) intensity = 90; // Peak morning
    else if (h === 12) intensity = 65; // Lunch dip
    else if (h === 13) intensity = 80; // Afternoon pickup + global overlap starts
    else if (h === 14) intensity = 95; // Peak overlap
    else if (h === 15) intensity = 50; // NSE close, residual forex
    else if (h === 16) intensity = 30; // Forex tail
    else if (h === 17) intensity = 15; // Wind down
    else intensity = Math.max(0, (20 - h) * 1.5); // After hours fading

    return {
      hour: h,
      intensity: Math.min(100, intensity),
      label: `${h.toString().padStart(2, "0")}:00`,
      nseActive,
      forexActive,
      overlapActive,
    };
  });

  const getIntensityColor = (intensity: number, isActive: boolean, isOverlap: boolean) => {
    if (isOverlap) return "bg-purple-600";
    if (isActive) {
      if (intensity >= 80) return "bg-green-500";
      if (intensity >= 50) return "bg-green-600/80";
      return "bg-accent-green/60";
    }
    if (intensity > 20) return "bg-yellow-700/50";
    return "bg-gray-800";
  };

  const getBarColor = (intensity: number) => {
    if (intensity >= 80) return "bg-green-500";
    if (intensity >= 50) return "bg-green-600/80";
    if (intensity >= 30) return "bg-yellow-600/70";
    if (intensity >= 10) return "bg-yellow-800/50";
    return "bg-gray-800";
  };

  // Current session status
  const isNseOpen = currentHour >= 9 && currentHour < 15;
  const isForexPrime = currentHour >= 8 && currentHour < 17;
  const isOverlap = currentHour >= 13 && currentHour < 15;

  const timeToNextSession = (): string => {
    if (isNseOpen) {
      const minsLeft = (15 - currentHour) * 60 - currentMinute;
      if (minsLeft <= 0) return "Closing...";
      const h = Math.floor(minsLeft / 60);
      const m = minsLeft % 60;
      return `${h}h ${m}m until close`;
    }
    if (currentHour < 9) {
      const minsLeft = (9 - currentHour) * 60 - currentMinute;
      const h = Math.floor(minsLeft / 60);
      const m = minsLeft % 60;
      return `Opens in ${h}h ${m}m`;
    }
    // After close
    const hoursUntilOpen = (9 + 24 - currentHour) % 24;
    return `Opens in ~${hoursUntilOpen}h`;
  };

  return (
    <div className="h-full overflow-auto space-y-3">
      <div className="text-xs text-amber-400 font-semibold tracking-wider">
        OPTIMAL TRADING HOURS — East Africa Time (EAT, UTC+3)
      </div>

      {/* Current Status Card */}
      <div className="bg-surface-1 border border-border-subtle rounded p-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full animate-pulse ${
              isNseOpen ? "bg-green-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]" : "bg-gray-600"
            }`}
          />
          <div>
            <div className="text-sm font-bold text-text-primary">
              {isNseOpen ? "NSE MARKET OPEN" : "NSE MARKET CLOSED"}
            </div>
            <div className="text-[10px] text-text-tertiary">
              {new Date().toLocaleTimeString("en-KE", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                timeZone: "Africa/Nairobi",
              })}{" "}
              EAT • {timeToNextSession()}
            </div>
          </div>
          <div className="ml-auto flex gap-2">
            {isOverlap && (
              <span className="text-[9px] bg-accent-purple/50 text-accent-purple border border-accent-purple px-2 py-0.5 rounded">
                EU+US OVERLAP ACTIVE
              </span>
            )}
            {isForexPrime && (
              <span className="text-[9px] bg-accent-blue/50 text-accent-blue border border-accent-blue px-2 py-0.5 rounded">
                FOREX PRIME
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Trading Windows Cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-surface-1 border border-border-subtle rounded p-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <div className="text-[10px] text-text-tertiary font-semibold tracking-wider">
              NSE REGULAR TRADING
            </div>
          </div>
          <div className="text-xl font-bold text-accent-green">09:00 - 15:00</div>
          <div className="text-[10px] text-text-tertiary mt-1">
            Pre-open 09:00-09:30 • Continuous 09:30-15:00
          </div>
          <div className="text-[9px] text-green-700 mt-1">
            Best for: Stocks, Bonds
          </div>
        </div>

        <div className="bg-surface-1 border border-border-subtle rounded p-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <div className="text-[10px] text-text-tertiary font-semibold tracking-wider">
              FOREX PRIME TIME
            </div>
          </div>
          <div className="text-xl font-bold text-accent-blue">08:00 - 17:00</div>
          <div className="text-[10px] text-text-tertiary mt-1">
            Overlaps with London, Asia sessions
          </div>
          <div className="text-[9px] text-blue-700 mt-1">
            Best for: KES pairs, FX crosses
          </div>
        </div>

        <div className="bg-surface-1 border border-border-subtle rounded p-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-purple-500" />
            <div className="text-[10px] text-text-tertiary font-semibold tracking-wider">
              GLOBAL SESSION OVERLAP
            </div>
          </div>
          <div className="text-xl font-bold text-accent-purple">13:00 - 15:00</div>
          <div className="text-[10px] text-text-tertiary mt-1">
            EU afternoon + US pre-open • Max liquidity
          </div>
          <div className="text-[9px] text-purple-700 mt-1">
            Best for: Cross-border flows, large orders
          </div>
        </div>
      </div>

      {/* Hourly Liquidity Heatmap */}
      <div className="bg-surface-1 border border-border-subtle rounded p-3">
        <div className="text-[10px] text-text-tertiary mb-3 tracking-wider">
          VOLUME & LIQUIDITY INTENSITY BY HOUR (EAT)
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 mb-3 text-[9px]">
          <span className="flex items-center gap-1">
            <span className="w-3 h-2 bg-green-500 rounded-sm inline-block" />
            Peak (09-15)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-2 bg-yellow-600/70 rounded-sm inline-block" />
            Good (08, 16)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-2 bg-gray-800 rounded-sm inline-block" />
            Low volume
          </span>
          <span className="flex items-center gap-1 ml-2">
            <span className="w-2 h-2 bg-purple-600 rounded-sm inline-block" />
            Global overlap (13-15)
          </span>
        </div>

        {/* Bar Chart */}
        <div className="flex items-end gap-0.5 h-28 mb-1">
          {hours.map((h) => (
            <div key={h.hour} className="flex-1 flex flex-col items-center gap-0.5">
              <div className="text-[7px] text-text-tertiary">
                {h.intensity > 50 ? `${h.intensity}%` : ""}
              </div>
              <div
                className={`w-full rounded-t-sm transition-all relative ${
                  h.overlapActive ? "bg-purple-600" : getBarColor(h.intensity)
                } ${
                  h.hour === currentHour
                    ? "ring-1 ring-white/50 shadow-[0_0_8px_rgba(255,255,255,0.3)]"
                    : ""
                }`}
                style={{ height: `${Math.max(4, h.intensity)}%` }}
                title={`${h.label} EAT — ${h.intensity}% intensity${
                  h.nseActive ? " (NSE Open)" : ""
                }${h.overlapActive ? " (Global Overlap)" : ""}`}
              >
                {h.hour === currentHour && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[8px] text-amber-400 whitespace-nowrap">
                    NOW
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Hour Labels */}
        <div className="flex gap-0.5">
          {hours.map((h) => (
            <div
              key={h.hour}
              className={`flex-1 text-center text-[7px] ${
                h.hour === currentHour
                  ? "text-amber-400 font-bold"
                  : h.nseActive
                  ? "text-accent-green"
                  : "text-text-tertiary"
              }`}
            >
              {h.hour.toString().padStart(2, "0")}
            </div>
          ))}
        </div>
      </div>

      {/* Session Timeline */}
      <div className="bg-surface-1 border border-border-subtle rounded p-3">
        <div className="text-[10px] text-text-tertiary mb-3 tracking-wider">
          SESSION TIMELINE
        </div>

        <div className="relative h-10 mb-2">
          {/* Timeline bar */}
          <div className="absolute top-1/2 -translate-y-1/2 w-full h-3 bg-surface-2 rounded-full overflow-hidden">
            {/* NSE segment: 09-15 = hours 9-15 = 37.5% to 62.5% */}
            <div
              className="absolute h-full bg-accent-green/60"
              style={{ left: `${(9 / 24) * 100}%`, width: `${(6 / 24) * 100}%` }}
            />
            {/* Forex segment: 08-17 */}
            <div
              className="absolute h-full bg-blue-700/40"
              style={{ left: `${(8 / 24) * 100}%`, width: `${(9 / 24) * 100}%` }}
            />
            {/* Overlap segment: 13-15 */}
            <div
              className="absolute h-full bg-purple-600/50"
              style={{ left: `${(13 / 24) * 100}%`, width: `${(2 / 24) * 100}%` }}
            />
            {/* Current time marker */}
            <div
              className="absolute top-0 h-full w-0.5 bg-amber-400 shadow-[0_0_4px_rgba(234,179,8,0.6)]"
              style={{ left: `${((currentHour + currentMinute / 60) / 24) * 100}%` }}
            />
          </div>
        </div>

        {/* Labels */}
        <div className="flex justify-between text-[8px] text-text-tertiary mt-1">
          <span>00:00</span>
          <span className="text-accent-blue">08:00 FX</span>
          <span className="text-accent-green">09:00 NSE</span>
          <span className="text-accent-purple">13:00 OVERLAP</span>
          <span className="text-accent-green">15:00 CLOSE</span>
          <span className="text-accent-blue">17:00 FX END</span>
          <span>24:00</span>
        </div>
      </div>

      {/* Key Takeaways */}
      <div className="bg-surface-1 border border-border-subtle rounded p-3">
        <div className="text-[10px] text-text-tertiary mb-2 tracking-wider">
          TRADING TIPS — NAIROBI SECURITIES EXCHANGE
        </div>
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="space-y-1">
            <div className="text-accent-green font-semibold">🕘 Morning (09:00-11:30)</div>
            <div className="text-text-secondary leading-relaxed">
              Highest volatility. Opening auction at 09:30. Corporate news digested.
              Best for momentum trades.
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-accent-amber font-semibold">🕛 Midday (11:30-13:00)</div>
            <div className="text-text-secondary leading-relaxed">
              Lunch lull. Lower volume. Spreads may widen. Good for limit orders and
              patient accumulation.
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-accent-purple font-semibold">🕑 Overlap (13:00-15:00)</div>
            <div className="text-text-secondary leading-relaxed">
              Peak global liquidity. EU afternoon + US pre-market. Cross-border flows
              drive large-cap bank stocks.
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-accent-blue font-semibold">🕓 Post-Close (15:00+)</div>
            <div className="text-text-secondary leading-relaxed">
              NSE closed. Forex still active until 17:00. Good for FX hedging.
              Plan next-day trades.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
