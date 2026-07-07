import { Panel } from "@/components/ui";
import { ToolsSuite } from "@/components/tools-suite";

export const dynamic = "force-dynamic";

export default function ToolsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="mono text-lg font-black tracking-tight text-fg">TOOLS &amp; CALCULATORS <span className="text-amber">·</span> TRADE SMARTER</h1>
        <p className="mono text-[11px] text-dim">Position sizing, compound growth, profit analysis, FX conversion & bond math — all in KES.</p>
      </div>
      <ToolsSuite />
      <Panel className="p-4">
        <p className="mono text-[11px] leading-relaxed text-dim">
          <span className="font-bold text-fg">Pro tip:</span> Never risk more than 1–2% of your capital on a single trade. Use the Position Sizing
          calculator to size entries with a defined stop loss — this is how professional traders survive bad streaks and compound winners over time.
        </p>
      </Panel>
    </div>
  );
}
