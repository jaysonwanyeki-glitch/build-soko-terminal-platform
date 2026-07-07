"use client";

export function MissionPanel() {
  return (
    <div className="h-full overflow-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-accent-amber live-dot" />
        <h2 className="text-sm font-semibold text-text-primary tracking-tight">
          Our Mission
        </h2>
      </div>

      {/* Mission Statement */}
      <div className="bg-surface-1 border border-border-subtle rounded-xl p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-accent-amber/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-accent-green/5 rounded-full translate-x-1/4 translate-y-1/4 blur-3xl" />
        <div className="relative text-center max-w-xl mx-auto py-4">
          <div className="text-4xl mb-4">🇰🇪</div>
          <h1 className="text-lg font-bold text-text-primary mb-3 tracking-tight">
            Democratizing African Capital Markets
          </h1>
          <p className="text-sm text-text-secondary leading-relaxed">
            Our mission is to make financial markets accessible to every Kenyan.
            We believe that investing in stocks, bonds, and digital assets
            shouldn&apos;t require a foreign bank account, a minimum balance of
            hundreds of thousands of shillings, or complex paperwork. With M-Pesa
            in every pocket and Soko Terminal on every screen, we&apos;re building
            the infrastructure for Africa&apos;s financial future.
          </p>
        </div>
      </div>

      {/* Core Pillars */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-text-primary tracking-wide uppercase">
          Our Core Pillars
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <PillarCard
            number="01"
            title="Financial Inclusion"
            description="Over 60% of Kenyans have M-Pesa but less than 2% invest in the stock market. Soko Terminal bridges this gap by making every asset purchasable with the payment method Kenyans already trust."
            color="accent-green"
          />
          <PillarCard
            number="02"
            title="Kenyan-First Design"
            description="Every feature is built for the Kenyan investor. Prices in KES, trading hours in EAT, M-Pesa as the primary payment rail, and local market data that matters — not Wall Street noise."
            color="accent-blue"
          />
          <PillarCard
            number="03"
            title="Regulatory Excellence"
            description="We operate under Kenya's VASP Act 2025 framework, maintaining full compliance with CMA and CBK regulations. Our platform is designed for the regulated future of African digital finance."
            color="accent-purple"
          />
          <PillarCard
            number="04"
            title="Technology Sovereignty"
            description="Built with open-source technology, hosted on African infrastructure. We believe Africa should own its financial technology stack — not rent it from Silicon Valley."
            color="accent-amber"
          />
        </div>
      </div>

      {/* Vision Timeline */}
      <div className="bg-surface-1 border border-border-subtle rounded-xl p-5">
        <h3 className="text-xs font-semibold text-text-primary tracking-wide uppercase mb-4">
          Our Vision
        </h3>
        <div className="space-y-0">
          <TimelineItem
            phase="Phase 1"
            title="Kenya Launch"
            description="NSE stocks, treasury bonds, and crypto trading via M-Pesa. Complete portfolio management for Kenyan retail investors."
            status="completed"
          />
          <TimelineItem
            phase="Phase 2"
            title="East African Expansion"
            description="Integrate Uganda Securities Exchange (USE), Dar es Salaam Stock Exchange (DSE), and Rwanda Stock Exchange (RSE). Cross-border M-Pesa trading across the EAC."
            status="active"
          />
          <TimelineItem
            phase="Phase 3"
            title="Institutional Grade"
            description="Advanced order types, algorithmic trading, API access for fintechs, and integration with Kenyan SACCOs and pension funds."
            status="upcoming"
          />
          <TimelineItem
            phase="Phase 4"
            title="Pan-African Platform"
            description="Connect all major African exchanges — Johannesburg, Lagos, Casablanca, Nairobi — into a single terminal. Africa's Bloomberg."
            status="upcoming"
          />
        </div>
      </div>

      {/* Impact Metrics */}
      <div className="grid grid-cols-4 gap-3">
        <ImpactCard value="60M+" label="Kenyans with M-Pesa" />
        <ImpactCard value="40+" label="NSE Stocks Listed" />
        <ImpactCard value="25+" label="Crypto Assets" />
        <ImpactCard value="0.21%" label="Trading Fee (NSE Rate)" />
      </div>

      {/* Founder Note */}
      <div className="bg-surface-1 border border-border-subtle rounded-xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-accent-amber/20 flex items-center justify-center text-accent-amber text-sm flex-shrink-0">
            ✦
          </div>
          <div>
            <h4 className="text-xs font-semibold text-text-primary mb-1">
              A Note from the Founder
            </h4>
            <p className="text-[11px] text-text-secondary leading-relaxed">
              &ldquo;When I started building Soko Terminal, I had one question: why
              can a Kenyan buy airtime with M-Pesa in 3 seconds, but buying a
              Safaricom share takes 3 weeks and a broker? The answer wasn&apos;t
              technology — it was imagination. We had the rails. We just needed
              the will to build on them. Soko Terminal is that will.&rdquo;
            </p>
            <div className="mt-2 text-[10px] text-text-tertiary">
              — Nairobi, Kenya · 2026
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PillarCard({
  number,
  title,
  description,
  color,
}: {
  number: string;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <div className="bg-surface-1 border border-border-subtle rounded-xl p-4 card-lift">
      <div className={`text-2xl font-black text-${color} mb-2`}>{number}</div>
      <h4 className="text-xs font-semibold text-text-primary mb-1.5">{title}</h4>
      <p className="text-[10px] text-text-tertiary leading-relaxed">
        {description}
      </p>
    </div>
  );
}

function TimelineItem({
  phase,
  title,
  description,
  status,
}: {
  phase: string;
  title: string;
  description: string;
  status: "completed" | "active" | "upcoming";
}) {
  const statusStyles = {
    completed: "bg-accent-green border-accent-green",
    active: "bg-accent-blue border-accent-blue animate-pulse",
    upcoming: "bg-border-default border-border-default",
  };

  return (
    <div className="flex gap-3 pb-4 relative">
      {/* Timeline line */}
      <div className="flex flex-col items-center">
        <div
          className={`w-2.5 h-2.5 rounded-full border-2 ${statusStyles[status]} flex-shrink-0 mt-1`}
        />
        <div className="w-px flex-1 bg-border-subtle mt-1" />
      </div>
      <div className="flex-1 pb-2">
        <div className="text-[9px] text-text-tertiary font-medium mb-0.5">
          {phase}
        </div>
        <h4 className="text-xs font-semibold text-text-primary mb-0.5">
          {title}
        </h4>
        <p className="text-[10px] text-text-tertiary leading-relaxed">
          {description}
        </p>
        <div className="mt-1">
          <span
            className={`text-[8px] px-1.5 py-0.5 rounded-full font-medium ${
              status === "completed"
                ? "bg-accent-green/10 text-accent-green"
                : status === "active"
                ? "bg-accent-blue/10 text-accent-blue"
                : "bg-surface-2 text-text-tertiary"
            }`}
          >
            {status === "completed" ? "✓ Complete" : status === "active" ? "● In Progress" : "○ Upcoming"}
          </span>
        </div>
      </div>
    </div>
  );
}

function ImpactCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-surface-1 border border-border-subtle rounded-xl p-3.5 text-center card-lift">
      <div className="text-xl font-bold text-text-primary mono">{value}</div>
      <div className="text-[10px] text-text-tertiary mt-1">{label}</div>
    </div>
  );
}
