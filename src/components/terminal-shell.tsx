import Link from "next/link";
import { MarketTicker } from "@/components/market-ticker";
import { CommandPalette } from "@/components/command-palette";
import { Clock } from "@/components/clock";
import { Nav, MobileNav } from "@/components/nav";
import { UserMenu } from "@/components/user-menu";
import { getTickerData, getSearchIndex, getFx } from "@/db/queries";
import { ensureSeeded } from "@/db/ensure";
import { getSession } from "@/lib/auth";

function Logo() {
  return (
    <Link href="/" className="group flex items-center gap-2.5">
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-brand/40 transition group-hover:border-brand group-hover:shadow-[0_0_28px_-6px_rgba(34,211,154,0.65)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/logo.png" alt="Soko Terminal" className="h-full w-full object-cover" />
      </div>
      <div className="leading-none">
        <div className="flex items-baseline gap-1.5">
          <span className="mono text-[16px] font-black tracking-tight text-fg">SOKO</span>
          <span className="text-gradient mono text-[16px] font-black tracking-tight">Terminal</span>
        </div>
        <div className="mono mt-0.5 flex items-center gap-1 text-[8px] font-semibold uppercase tracking-[0.28em] text-dim">
          <span className="text-ke-green">●</span> Nairobi · Kenya
        </div>
      </div>
    </Link>
  );
}

export async function TerminalShell({ children }: { children: React.ReactNode }) {
  // Skip all DB operations during build phase
  const hasDb = Boolean(process.env.DATABASE_URL);
  if (hasDb) await ensureSeeded();
  const session = hasDb ? await getSession().catch(() => null) : null;
  let ticker: Awaited<ReturnType<typeof getTickerData>> = [];
  let search: Awaited<ReturnType<typeof getSearchIndex>> = [];
  let fx: Awaited<ReturnType<typeof getFx>> = [];
  try {
    [ticker, search, fx] = await Promise.all([
      getTickerData(),
      getSearchIndex(),
      getFx(),
    ]);
  } catch (e) {
    console.error("TerminalShell data load failed:", e);
  }
  const usd = fx.find((f) => f.pair === "USD/KES");
  const usdUp = (usd?.change ?? 0) >= 0;

  return (
    <div className="min-h-screen text-fg">
      <div className="pointer-events-none fixed inset-0 grid-bg opacity-50" />
      <div className="relative">
        {/* Header */}
        <header className="sticky top-0 z-40">
          <div className="relative flex h-14 items-center gap-4 border-b border-line bg-term-950/85 px-4 backdrop-blur-xl md:px-6">
            <Logo />
            <div className="hidden flex-1 justify-center md:flex">
              <CommandPalette items={search} />
            </div>
            <div className="flex flex-1 items-center justify-end gap-2 md:flex-none">
              {usd && (
                <div className="chip hidden items-center sm:flex">
                  <span className="mono text-[10px] font-semibold text-dim">USD/KES</span>
                  <span className="mono tnum text-xs font-bold text-fg">{usd.rate.toFixed(2)}</span>
                  <span className={`mono tnum text-[10px] ${usdUp ? "text-up" : "text-down"}`}>
                    {usdUp ? "▲" : "▼"} {Math.abs(usd.change ?? 0).toFixed(2)}
                  </span>
                </div>
              )}
              <Clock />
              {session ? (
                <UserMenu name={session.name} email={session.email} />
              ) : (
                <Link
                  href="/login"
                  className="btn-brand mono rounded-xl px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-term-950 transition hover:brightness-110"
                >
                  Sign In
                </Link>
              )}
            </div>
            {/* accent underline */}
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand/45 to-transparent" />
          </div>
          {/* Mobile search */}
          <div className="border-b border-line bg-term-950/90 px-4 py-2 md:hidden">
            <CommandPalette items={search} />
          </div>
          <MarketTicker items={ticker} />
        </header>

        {/* Body */}
        <div className="mx-auto flex w-full max-w-[1640px]">
          <Nav />
          <main className="min-w-0 flex-1 px-4 py-5 pb-24 md:px-7 lg:pb-5">{children}</main>
        </div>

        <MobileNav />

        {/* Footer */}
        <footer className="border-t border-line bg-term-900/70 px-4 py-3 md:px-7">
          <div className="mx-auto flex max-w-[1640px] flex-wrap items-center justify-between gap-2 text-[10px] text-dim">
            <div className="mono flex items-center gap-2">
              <span className="font-bold text-fg">SOKO TERMINAL</span>
              <span>·</span>
              <span>Kenyan markets data — for information only, not investment advice</span>
            </div>
            <div className="mono flex items-center gap-3">
              <Link href="/about" className="transition hover:text-amber">About</Link>
              <span>·</span>
              <span>NSE · CBK · CDSC</span>
              <span>·</span>
              <span>© {new Date().getFullYear()} Soko</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
