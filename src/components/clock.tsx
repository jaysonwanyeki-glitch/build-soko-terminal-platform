"use client";

import { useEffect, useState } from "react";

type Parts = { hh: string; mm: string; ss: string; day: number; open: boolean; label: string };

function getParts(d: Date): Parts {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Nairobi",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    weekday: "short",
    hour12: false,
  });
  const map = new Map<string, string>();
  for (const p of fmt.formatToParts(d)) map.set(p.type, p.value);
  const hh = parseInt(map.get("hour") ?? "0", 10);
  const wd = map.get("weekday") ?? "";
  const isWeekday = !["Sat", "Sun"].includes(wd);
  const open = isWeekday && hh >= 9 && hh < 15;
  return {
    hh: map.get("hour") ?? "00",
    mm: map.get("minute") ?? "00",
    ss: map.get("second") ?? "00",
    day: 0,
    open,
    label: open ? "MARKET OPEN" : "MARKET CLOSED",
  };
}

export function Clock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const p = now ? getParts(now) : null;

  return (
    <div className="flex items-center gap-3">
      <div className="hidden items-center gap-1.5 sm:flex">
        <span
          className={`inline-block h-2 w-2 rounded-full ${
            p?.open ? "bg-up animate-pulse-dot" : "bg-down"
          }`}
        />
        <span className="mono text-[10px] font-semibold uppercase tracking-wider text-muted">
          {p?.label ?? "NSE"}
        </span>
      </div>
      <div className="mono tnum rounded-md border border-line bg-term-850 px-2.5 py-1 text-xs font-semibold text-fg">
        {p ? `${p.hh}:${p.mm}:${p.ss}` : "--:--:--"}
        <span className="ml-1.5 text-[9px] text-amber">EAT</span>
      </div>
    </div>
  );
}
