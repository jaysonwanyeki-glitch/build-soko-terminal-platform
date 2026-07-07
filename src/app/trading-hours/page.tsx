import { Panel } from "@/components/ui";
import { LiquidityChart, TradingWindows } from "@/components/trading-hours";

export const dynamic = "force-dynamic";

export default function TradingHoursPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="mono text-lg font-black tracking-tight text-fg">
          OPTIMAL TRADING HOURS <span className="text-amber">·</span> EAT
        </h1>
        <p className="mono text-[11px] text-dim">
          Volume &amp; liquidity intensity by hour across the NSE and Kenyan FX market. All times in East Africa Time (UTC+3).
        </p>
      </div>

      <Panel
        title="Volume & Liquidity Intensity by Hour"
        subtitle="relative intensity, 00:00 – 23:00 EAT"
      >
        <LiquidityChart height={170} />
      </Panel>

      <div>
        <h2 className="mono mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber">
          Trading Windows
        </h2>
        <TradingWindows />
      </div>

      <Panel className="p-4">
        <div className="grid grid-cols-1 gap-4 text-xs text-muted sm:grid-cols-3">
          <div>
            <div className="mono mb-1 text-[10px] font-bold uppercase tracking-wider text-fg">Equities &amp; Bonds</div>
            The NSE main board trades <span className="text-fg">Monday–Friday, 09:00–15:00 EAT</span>. Order matching and price discovery are deepest mid-session.
          </div>
          <div>
            <div className="mono mb-1 text-[10px] font-bold uppercase tracking-wider text-fg">Foreign Exchange</div>
            KES spot is most liquid <span className="text-fg">08:00–17:00 EAT</span>, overlapping the London and Asian sessions for tighter spreads.
          </div>
          <div>
            <div className="mono mb-1 text-[10px] font-bold uppercase tracking-wider text-fg">Best Overlap</div>
            The <span className="text-fg">13:00–15:00 EAT</span> window captures the European open and US pre-market — peak cross-border flow.
          </div>
        </div>
      </Panel>
    </div>
  );
}
