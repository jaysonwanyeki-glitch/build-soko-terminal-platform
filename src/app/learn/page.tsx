import Link from "next/link";
import { Panel, Tag } from "@/components/ui";
import { classNames } from "@/lib/format";

export const dynamic = "force-dynamic";

const GLOSSARY = [
  { term: "Share / Stock", cat: "Equities", def: "A unit of ownership in a company. Owning Safaricom shares means you own a tiny piece of Safaricom." },
  { term: "Dividend", cat: "Equities", def: "A share of company profits paid to shareholders, usually twice a year. E.g. KSh 0.62 per Safaricom share." },
  { term: "P/E Ratio", cat: "Valuation", def: "Price-to-Earnings. How much you pay per KSh 1 of annual profit. A P/E of 15 means you pay KSh 15 for KSh 1 of earnings." },
  { term: "P/B Ratio", cat: "Valuation", def: "Price-to-Book. Compares the share price to the company's net asset value per share. Below 1 = cheaper than its assets." },
  { term: "EPS", cat: "Equities", def: "Earnings Per Share. The company's total profit divided by the number of shares — profit attributable to each share." },
  { term: "Market Capitalisation", cat: "Equities", def: "Share price × total shares. The total market value of a company. Safaricom is the largest on the NSE by market cap." },
  { term: "Bull Market", cat: "Concepts", def: "A market that is rising, with optimism and buying pressure. The opposite is a Bear Market (falling)." },
  { term: "Treasury Bond", cat: "Bonds", def: "A loan you give to the Government of Kenya for a fixed period (2–25 years). In return you earn regular interest (the coupon)." },
  { term: "Coupon Rate", cat: "Bonds", def: "The annual interest rate paid on a bond. A 16.5% coupon on KSh 100,000 pays KSh 16,500 per year." },
  { term: "Yield to Maturity (YTM)", cat: "Bonds", def: "Your total annual return if you hold a bond until it matures, factoring in the price you paid and the coupon." },
  { term: "Infrastructure Bond (IFB)", cat: "Bonds", def: "A government bond whose coupon income is TAX-FREE. Popular with Kenyan investors for this reason." },
  { term: "Clean vs Dirty Price", cat: "Bonds", def: "Clean price excludes accrued interest; dirty price includes it. You pay the dirty price when buying." },
  { term: "Cryptocurrency", cat: "Crypto", def: "Digital money secured by cryptography and a blockchain, with no central bank. E.g. Bitcoin, Ethereum." },
  { term: "Stablecoin", cat: "Crypto", def: "A crypto pegged to a stable asset like the US Dollar. USDT and USDC aim to always be worth $1." },
  { term: "M-Pesa Wallet", cat: "Trading", def: "Your funded balance on Soko Terminal, topped up via Lipa Na M-Pesa. Used to buy stocks, bonds and crypto instantly." },
  { term: "Mark-to-Market", cat: "Trading", def: "Valuing your portfolio at current live prices to show your real-time profit or loss (P&L)." },
  { term: "Spread", cat: "Trading", def: "The gap between the highest bid (buy offer) and lowest ask (sell offer). Tighter spread = more liquid market." },
  { term: "Portfolio", cat: "Trading", def: "Your total collection of investments. Diversifying across stocks, bonds and crypto reduces risk." },
];

const GUIDES = [
  { icon: "🥇", title: "How to Buy Your First NSE Share", time: "5 min read", desc: "From funding your M-Pesa wallet to placing your first order on Safaricom or Equity Bank.", tone: "amber" as const },
  { icon: "🏦", title: "Understanding Treasury Bonds", time: "7 min read", desc: "Why bonds are the backbone of Kenyan investing — coupons, yields, and the tax-free IFB magic.", tone: "cyan" as const },
  { icon: "₿", title: "Crypto for Beginners", time: "6 min read", desc: "What Bitcoin and Ethereum actually are, and how to trade them with M-Pesa — safely.", tone: "amber" as const },
  { icon: "📊", title: "Reading Financial Statements", time: "8 min read", desc: "Income statements, balance sheets and cash flow — explained in plain Kenyan English.", tone: "green" as const },
  { icon: "🎯", title: "Position Sizing & Risk Management", time: "5 min read", desc: "Never blow up your account — the 2% rule and how to size every trade with a stop loss.", tone: "violet" as const },
  { icon: "📱", title: "Funding with M-Pesa Step-by-Step", time: "3 min read", desc: "A walkthrough of Lipa Na M-Pesa STK Push and how your wallet credits instantly.", tone: "green" as const },
];

const CATS = ["All", "Equities", "Bonds", "Crypto", "Valuation", "Concepts", "Trading"];

export default function LearnPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="mono text-lg font-black tracking-tight text-fg">LEARN <span className="text-amber">·</span> FINANCIAL LITERACY HUB</h1>
        <p className="mono text-[11px] text-dim">Master Kenyan markets — from your first share to advanced bond yields. Knowledge is the best investment.</p>
      </div>

      {/* Guides */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {GUIDES.map((g) => (
          <Panel key={g.title} className="group cursor-pointer p-5 transition hover:border-amber/40">
            <div className="flex items-start justify-between">
              <span className="text-3xl">{g.icon}</span>
              <Tag tone={g.tone}>{g.time}</Tag>
            </div>
            <h3 className="mt-3 text-sm font-bold text-fg group-hover:text-amber">{g.title}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">{g.desc}</p>
          </Panel>
        ))}
      </div>

      {/* Glossary */}
      <Panel title="Glossary" subtitle={`${GLOSSARY.length} terms explained simply`}>
        <div className="flex flex-wrap gap-1.5 border-b border-line p-3">
          {CATS.map((c) => (
            <span key={c} className="mono rounded-full border border-line px-2.5 py-1 text-[10px] text-muted">{c}</span>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-px bg-line sm:grid-cols-2">
          {GLOSSARY.map((g) => (
            <div key={g.term} className="bg-term-850/50 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="mono text-xs font-bold text-amber">{g.term}</span>
                <span className="mono rounded bg-term-800 px-1.5 py-0.5 text-[8px] text-dim">{g.cat}</span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-muted">{g.def}</p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel className="relative overflow-hidden p-6">
        <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-amber/10 blur-3xl" />
        <div className="relative">
          <h2 className="mono text-lg font-black text-fg">Ready to put it into practice?</h2>
          <p className="mono mt-1 text-[11px] text-dim">Fund your wallet with M-Pesa and start with as little as KSh 100.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/portfolio" className="mono rounded-md bg-amber px-4 py-2 text-xs font-bold uppercase tracking-wider text-term-950 transition hover:brightness-110">Open Portfolio</Link>
            <Link href="/screener" className="mono rounded-md border border-line px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted transition hover:border-amber/40 hover:text-amber">Find Stocks</Link>
          </div>
        </div>
      </Panel>
    </div>
  );
}
