"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { classNames } from "@/lib/format";

type Item = { href: string; label: string; code: string; icon: React.ReactNode };

const I = {
  terminal: <path d="M4 5h16v11H4z M8 20h8 M12 16v4" />,
  equities: <path d="M4 19V5 M4 19h16 M8 16l3-4 3 2 4-6" />,
  bonds: <path d="M6 3v18 M6 4c4 0 8 1 12 0v16c-4 1-8 0-12 0" />,
  crypto: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 8h4.5a2 2 0 010 4H9zM9 12h5a2 2 0 010 4H9zM10 6v12M13 6v12" />
    </>
  ),
  indices: <path d="M4 20h16 M7 20v-6 M12 20V8 M17 20v-9" />,
  markets: <rect x="3" y="3" width="18" height="18" />,
  hours: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  portfolio: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </>
  ),
  watchlist: <path d="M12 21l-1.5-1.4C5 15 2 12.4 2 8.8 2 6 4.2 4 7 4c1.7 0 3.3.8 4.3 2 .9-1.2 2.5-2 4.2-2 2.8 0 5 2 5 4.8 0 3.6-3 6.2-8.5 10.8z" />,
  news: <path d="M4 5h16v12H4z M8 9h8 M8 13h5" />,
  screener: <path d="M4 6h16 M7 12h13 M10 18h10" />,
  tools: <path d="M14 7l3 3-9 9-3 .5.5-3zM13 8l3 3" />,
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 9h18 M8 3v4 M16 3v4" />
    </>
  ),
  alerts: (
    <>
      <path d="M6 8a6 6 0 0112 0c0 7 3 8 3 8H3s3-1 3-8" />
      <path d="M10 21h4" />
    </>
  ),
  compare: (
    <>
      <path d="M9 4v16 M15 8v8" />
      <rect x="3" y="8" width="6" height="10" rx="1" />
      <rect x="15" y="4" width="6" height="12" rx="1" />
    </>
  ),
  funds: (
    <>
      <path d="M4 7h16 M4 12h16 M4 17h16" />
      <circle cx="8" cy="7" r="1.3" fill="currentColor" stroke="none" />
    </>
  ),
  ipo: (
    <>
      <path d="M12 3l2.5 5 5.5.8-4 3.9.9 5.5L12 16l-4.9 2.6.9-5.5-4-3.9 5.5-.8z" />
    </>
  ),
  learn: (
    <>
      <path d="M4 19V5l8-2 8 2v14" />
      <path d="M4 19h16 M12 3v16" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5 M12 8h.01" />
    </>
  ),
};

const MARKETS: Item[] = [
  { href: "/", label: "Terminal", code: "DASH", icon: I.terminal },
  { href: "/stocks", label: "Equities", code: "EQTY", icon: I.equities },
  { href: "/bonds", label: "Treasury Bonds", code: "BOND", icon: I.bonds },
  { href: "/crypto", label: "Crypto", code: "CRYP", icon: I.crypto },
  { href: "/funds", label: "Funds (ETF/REIT)", code: "FUND", icon: I.funds },
  { href: "/indices", label: "Indices", code: "INDX", icon: I.indices },
  { href: "/markets", label: "Markets", code: "MRKT", icon: I.markets },
  { href: "/trading-hours", label: "Trading Hours", code: "HOURS", icon: I.hours },
];

const RESEARCH: Item[] = [
  { href: "/screener", label: "Screener", code: "SCRN", icon: I.screener },
  { href: "/compare", label: "Compare Stocks", code: "CMPR", icon: I.compare },
  { href: "/calendar", label: "Economic Calendar", code: "CAL", icon: I.calendar },
  { href: "/ipos", label: "IPOs & Listings", code: "IPO", icon: I.ipo },
  { href: "/alerts", label: "Price Alerts", code: "ALRT", icon: I.alerts },
  { href: "/tools", label: "Calculators", code: "TOOL", icon: I.tools },
];

const DESK: Item[] = [
  { href: "/portfolio", label: "Portfolio", code: "PORT", icon: I.portfolio },
  { href: "/orders", label: "Orders", code: "ORDR", icon: I.screener },
  { href: "/watchlist", label: "Watchlist", code: "WCHL", icon: I.watchlist },
  { href: "/settings", label: "Settings", code: "SET", icon: I.info },
  { href: "/news", label: "News Wire", code: "NEWS", icon: I.news },
  { href: "/learn", label: "Learn Hub", code: "LRN", icon: I.learn },
  { href: "/about", label: "About & Mission", code: "INFO", icon: I.info },
];

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

function NavLink({ item, pathname }: { item: Item; pathname: string }) {
  const isActive =
    item.href === "/"
      ? pathname === "/"
      : pathname === item.href || pathname.startsWith(item.href + "/");
  return (
    <Link
      href={item.href}
      className={classNames(
        "group relative flex items-center gap-3 rounded-lg px-2.5 py-2 transition",
        isActive ? "bg-brand/10 text-brand" : "text-muted hover:bg-term-700 hover:text-fg"
      )}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-gradient-to-b from-brand to-cyan" />
      )}
      <Icon>{item.icon}</Icon>
      <span className="flex-1 text-sm font-medium">{item.label}</span>
      <span className={classNames("mono text-[8px] font-bold tracking-wider", isActive ? "text-brand/60" : "text-dim/50")}>
        {item.code}
      </span>
    </Link>
  );
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mono mb-1.5 px-2.5 text-[9px] font-bold uppercase tracking-[0.24em] text-dim/80">
      {children}
    </div>
  );
}

const MOBILE: Item[] = [
  { href: "/", label: "Home", code: "DASH", icon: I.terminal },
  { href: "/stocks", label: "Stocks", code: "EQTY", icon: I.equities },
  { href: "/crypto", label: "Crypto", code: "CRYP", icon: I.crypto },
  { href: "/markets", label: "Markets", code: "MRKT", icon: I.markets },
  { href: "/portfolio", label: "Portfolio", code: "PORT", icon: I.portfolio },
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-line bg-term-950/95 backdrop-blur-xl lg:hidden">
      <ul className="mx-auto flex max-w-md items-stretch justify-around px-1 py-1">
        {MOBILE.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <li key={item.href} className="flex-1">
            <Link
              href={item.href}
              className={classNames(
                "flex flex-col items-center gap-0.5 rounded-lg py-1.5 transition",
                isActive ? "text-brand" : "text-muted"
              )}
            >
              <span className="relative">
                <Icon>{item.icon}</Icon>
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-brand" />
                )}
              </span>
                <span className="mono text-[8px] font-bold uppercase tracking-wide">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function Nav() {
  const pathname = usePathname();
  return (
    <nav className="sticky top-[88px] hidden h-[calc(100vh-88px)] w-[224px] shrink-0 flex-col border-r border-line bg-term-900/60 backdrop-blur-sm lg:flex">
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <GroupLabel>Markets</GroupLabel>
        <ul className="space-y-0.5">
          {MARKETS.map((item) => (
            <li key={item.href}>
              <NavLink item={item} pathname={pathname} />
            </li>
          ))}
        </ul>

        <div className="my-3 mx-2 h-px bg-line" />

        <GroupLabel>Research & Tools</GroupLabel>
        <ul className="space-y-0.5">
          {RESEARCH.map((item) => (
            <li key={item.href}>
              <NavLink item={item} pathname={pathname} />
            </li>
          ))}
        </ul>

        <div className="my-3 mx-2 h-px bg-line" />

        <GroupLabel>My Desk</GroupLabel>
        <ul className="space-y-0.5">
          {DESK.map((item) => (
            <li key={item.href}>
              <NavLink item={item} pathname={pathname} />
            </li>
          ))}
        </ul>
      </div>

      {/* status card */}
      <div className="border-t border-line p-3">
        <div className="panel-flat overflow-hidden p-3">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-ke-green/15 text-sm">🇰🇪</span>
            <div className="leading-tight">
              <div className="mono text-[10px] font-bold text-fg">NSE · LIVE</div>
              <div className="text-[9px] text-dim">Nairobi Securities Exchange</div>
            </div>
          </div>
          <div className="mt-2.5 h-px bg-line" />
          <div className="mono mt-2 flex items-center justify-between text-[9px] text-dim">
            <span>SOKO TERM v2.0</span>
            <span className="flex items-center gap-1 text-up">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-up animate-pulse-dot" />
              connected
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}
