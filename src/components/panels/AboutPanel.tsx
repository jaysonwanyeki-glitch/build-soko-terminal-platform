"use client";

export function AboutPanel() {
  return (
    <div className="h-full overflow-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-accent-purple live-dot" />
        <h2 className="text-sm font-semibold text-text-primary tracking-tight">
          About Soko Terminal
        </h2>
      </div>

      {/* Hero Card */}
      <div className="bg-surface-1 border border-border-subtle rounded-xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent-green/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-green to-accent-cyan flex items-center justify-center text-lg font-black text-text-inverse shadow-lg shadow-accent-green/20">
              S
            </div>
            <div>
              <h1 className="text-xl font-bold text-text-primary tracking-tight">
                Soko Terminal
              </h1>
              <p className="text-[11px] text-text-tertiary">
                Kenya&apos;s Most Advanced Trading Platform
              </p>
            </div>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed max-w-2xl">
            Soko Terminal is Kenya&apos;s first unified financial terminal, bringing
            together the Nairobi Securities Exchange equities, treasury bonds, and
            cryptocurrency markets — all tradeable directly via M-Pesa. Built in
            Nairobi, for Africa.
          </p>
        </div>
      </div>

      {/* What We Offer */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-text-primary tracking-wide uppercase">
          What We Offer
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <FeatureCard
            icon="📈"
            title="NSE Equities"
            description="Real-time prices for all 40+ stocks listed on the Nairobi Securities Exchange. Sorted by market cap, sector, P/E ratio, and dividend yield."
          />
          <FeatureCard
            icon="💵"
            title="Treasury Bonds"
            description="Complete bond desk with yield curves, duration analytics, cash flow projections. Trade FXD, IFB, and corporate bonds."
          />
          <FeatureCard
            icon="🪙"
            title="Crypto Markets"
            description="25 cryptocurrencies priced in Kenyan Shillings (KES). Buy Bitcoin, Ethereum, USDT and more directly with M-Pesa."
          />
          <FeatureCard
            icon="💼"
            title="Portfolio Management"
            description="Track your investments across stocks, bonds, and crypto in one place. Real-time P&L, asset allocation, and performance charts."
          />
          <FeatureCard
            icon="📱"
            title="M-Pesa Trading"
            description="First platform in Kenya where you can buy stocks, bonds, and crypto directly with M-Pesa STK Push. No bank account needed."
          />
          <FeatureCard
            icon="🕐"
            title="Trading Hours Analytics"
            description="Optimal trading windows with hourly liquidity heatmaps. NSE sessions, forex prime time, and global overlap visualization."
          />
        </div>
      </div>

      {/* Contact */}
      <div className="bg-surface-1 border border-border-subtle rounded-xl p-5">
        <h3 className="text-xs font-semibold text-text-primary tracking-wide uppercase mb-3">
          Contact & Regulatory
        </h3>
        <div className="grid grid-cols-2 gap-4 text-[11px]">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-text-tertiary w-20">Location</span>
              <span className="text-text-secondary">Nairobi, Kenya</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-text-tertiary w-20">Exchange</span>
              <span className="text-text-secondary">NSE (XNAI)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-text-tertiary w-20">Timezone</span>
              <span className="text-text-secondary mono">EAT (UTC+3)</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-text-tertiary w-24">CMA Regulated</span>
              <span className="text-accent-green font-medium">VASP Act 2025</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-text-tertiary w-24">CBK Compliant</span>
              <span className="text-accent-green font-medium">AML/KYC Ready</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-text-tertiary w-24">Data</span>
              <span className="text-text-secondary">End-to-end encrypted</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-surface-1 border border-border-subtle rounded-xl p-4 card-lift">
      <div className="text-2xl mb-2">{icon}</div>
      <h4 className="text-xs font-semibold text-text-primary mb-1">{title}</h4>
      <p className="text-[10px] text-text-tertiary leading-relaxed">
        {description}
      </p>
    </div>
  );
}


