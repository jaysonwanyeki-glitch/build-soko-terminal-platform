import Link from "next/link";
import { Panel, Tag } from "@/components/ui";
import { compact, money } from "@/lib/format";
import { getAllStocks, getBonds, getAllCryptos, computeStats } from "@/db/queries";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "About & Mission",
  description: "Soko Terminal democratises access to Kenya's financial markets — a world-class trading terminal powered by M-Pesa.",
};

const VALUES = [
  {
    icon: "🇰🇪",
    title: "Built for Kenya",
    body: "Every figure is denominated in Kenya Shillings and anchored to the Nairobi Securities Exchange, Central Bank of Kenya and CDSC rails.",
    accent: "text-amber",
  },
  {
    icon: "📱",
    title: "M-Pesa First",
    body: "We meet Kenyans where they already transact. Fund your wallet with Lipa Na M-Pesa and trade in seconds — no bank account gymnastics.",
    accent: "text-up",
  },
  {
    icon: "🔐",
    title: "Radical Transparency",
    body: "Real prices, clear fees, and honest P&L. No hidden spreads, no opaque pricing — what you see is exactly what the market shows.",
    accent: "text-cyan",
  },
  {
    icon: "⚡",
    title: "Speed & Access",
    body: "From market data to order execution, every interaction is engineered to be fast, even on modest data connections.",
    accent: "text-violet",
  },
];



export default async function AboutPage() {
  const [stocks, bonds, cryptos] = await Promise.all([getAllStocks(), getBonds(), getAllCryptos()]);
  const stats = computeStats(stocks);
  const totalMarketCap = stats.marketCap + cryptos.reduce((a, c) => a + (c.marketCap ?? 0), 0);

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      {/* Hero */}
      <Panel className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-50" />
        <div className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full bg-amber/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-10 top-10 h-56 w-56 rounded-full bg-cyan/10 blur-3xl" />
        <div className="relative p-6 md:p-8">
          <div className="mono flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-amber">
            <span className="inline-block h-2 w-2 rounded-full bg-up animate-pulse-dot" />
            About Soko Terminal
          </div>
          <h1 className="mono mt-2 text-2xl font-black leading-tight tracking-tight text-fg md:text-4xl">
            Kenya&apos;s first <span className="text-gradient-amber">M-Pesa trading terminal</span>
            <br className="hidden sm:block" /> for stocks &amp; crypto.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted md:text-base">
            Soko Terminal brings the power of a professional trading desk — think Bloomberg, but
            Kenyan — to every phone in the country. Track the Nairobi Securities Exchange, buy
            treasury bonds, trade crypto around the clock, and fund it all with M-Pesa. No broker
            minimums, no paperwork, no barriers.
          </p>

          {/* live stats */}
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-lg border border-line-soft bg-term-850/70 px-3 py-2.5">
              <div className="mono tnum text-lg font-black text-fg">{stocks.length}</div>
              <div className="mono text-[9px] uppercase tracking-wider text-dim">NSE Equities</div>
            </div>
            <div className="rounded-lg border border-line-soft bg-term-850/70 px-3 py-2.5">
              <div className="mono tnum text-lg font-black text-fg">{bonds.length}</div>
              <div className="mono text-[9px] uppercase tracking-wider text-dim">Treasury Bonds</div>
            </div>
            <div className="rounded-lg border border-line-soft bg-term-850/70 px-3 py-2.5">
              <div className="mono tnum text-lg font-black text-fg">{cryptos.length}</div>
              <div className="mono text-[9px] uppercase tracking-wider text-dim">Crypto Assets</div>
            </div>
            <div className="rounded-lg border border-line-soft bg-term-850/70 px-3 py-2.5">
              <div className="mono tnum text-lg font-black text-fg">{compact(totalMarketCap)}</div>
              <div className="mono text-[9px] uppercase tracking-wider text-dim">Tracked Cap</div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/portfolio"
              className="mono rounded-md bg-amber px-4 py-2 text-xs font-bold uppercase tracking-wider text-term-950 transition hover:brightness-110"
            >
              Start Trading →
            </Link>
            <Link
              href="/markets"
              className="mono rounded-md border border-line px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted transition hover:border-amber/40 hover:text-amber"
            >
              Explore Markets
            </Link>
          </div>
        </div>
      </Panel>

      {/* About section */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel title="About Us" subtitle="The story behind the terminal">
            <div className="space-y-4 p-5 text-sm leading-relaxed text-muted">
              <p>
                For decades, participating in Kenya&apos;s capital markets meant navigating
                paperwork, minimum balances, and a fragmented experience across brokers, banks and
                the exchange. Professional-grade market data was locked behind expensive Bloomberg
                and Reuters terminals that most Kenyans could never access.
              </p>
              <p>
                <span className="font-semibold text-fg">Soko Terminal</span> changes that. We built a
                single, unified workspace where the entire NSE — equities, treasury bonds and
                indices — sits alongside the global crypto market, all priced in Kenya Shillings and
                all tradable from one M-Pesa-funded wallet.
              </p>
              <p>
                We obsess over the details that matter to a Kenyan investor: real-time NSE prices,
                the CBK bond yield curve, optimal trading hours tuned to East Africa Time, and a
                portfolio engine that shows your true mark-to-market profit and loss. It&apos;s the
                kind of terminal a fund manager would use — reimagined for the phone in your pocket.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Tag tone="amber">Founded in Nairobi</Tag>
                <Tag tone="green">KES-native</Tag>
                <Tag tone="cyan">M-Pesa integrated</Tag>
                <Tag tone="violet">24/7 crypto</Tag>
              </div>
            </div>
          </Panel>
        </div>

        {/* mission card */}
        <div className="lg:col-span-1">
          <Panel title="Our Mission" subtitle="why we exist">
            <div className="p-5">
              <div className="rounded-lg border border-amber/30 bg-gradient-to-br from-amber/10 to-transparent p-5">
                <div className="text-3xl">🎯</div>
                <p className="mt-3 text-sm font-semibold leading-relaxed text-fg">
                  To democratise access to Kenya&apos;s financial markets — putting a world-class
                  trading terminal and the power of M-Pesa into every investor&apos;s hands,
                  regardless of bank balance or background.
                </p>
              </div>
              <p className="mt-4 text-xs leading-relaxed text-muted">
                We believe every Kenyan deserves the same tools as the professionals on Rhapta Road.
                Whether you&apos;re buying your first KSh 1,000 of Safaricom stock or hedging with
                treasury bonds, Soko Terminal levels the playing field.
              </p>
            </div>
          </Panel>

          <Panel className="mt-4" title="Vision">
            <div className="p-5 text-sm leading-relaxed text-muted">
              A future where{" "}
              <span className="font-semibold text-fg">millions of Kenyans</span> actively invest in
              their own markets — funding the companies, infrastructure and innovation that build the
              nation&apos;s wealth — all from a single M-Pesa-powered terminal.
            </div>
          </Panel>
        </div>
      </section>

      {/* Core values */}
      <section>
        <h2 className="mono mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber">
          Core Values
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((v) => (
            <Panel key={v.title} className="p-5 transition hover:border-amber/40">
              <div className="text-2xl">{v.icon}</div>
              <h3 className={`mono mt-2 text-sm font-bold ${v.accent}`}>{v.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">{v.body}</p>
            </Panel>
          ))}
        </div>
      </section>

      {/* CTA */}
      <Panel className="relative overflow-hidden p-6 md:p-8">
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-up/10 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="mono text-lg font-black text-fg">
              Ready to trade Nairobi&apos;s markets?
            </h2>
            <p className="mono mt-1 text-[11px] text-dim">
              Fund your wallet with M-Pesa and place your first order in under a minute.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/portfolio" className="mono rounded-md bg-up px-4 py-2 text-xs font-bold uppercase tracking-wider text-term-950 transition hover:brightness-110">
              Open Portfolio
            </Link>
            <Link href="/crypto" className="mono rounded-md bg-gold px-4 py-2 text-xs font-bold uppercase tracking-wider text-term-950 transition hover:brightness-110">
              Trade Crypto
            </Link>
          </div>
        </div>
      </Panel>
    </div>
  );
}
