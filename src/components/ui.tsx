import { classNames } from "@/lib/format";

export function Panel({
  children,
  className,
  title,
  subtitle,
  right,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className={`panel scroll-mt-24 rounded-lg ${className ?? ""}`}>
      {title !== undefined && (
        <header className="panel-header flex items-center justify-between gap-3 border-b border-line rounded-t-[16px] px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="h-4 w-1 rounded-full bg-gradient-to-b from-brand to-cyan" />
            <div className="min-w-0">
              <h3 className="mono text-[11px] font-bold uppercase tracking-[0.18em] text-fg">{title}</h3>
              {subtitle && <p className="truncate text-xs text-dim">{subtitle}</p>}
            </div>
          </div>
          {right}
        </header>
      )}
      {children}
    </section>
  );
}

export function SectionTitle({
  children,
  hint,
}: {
  children: React.ReactNode;
  hint?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-end justify-between">
      <h2 className="mono text-[11px] font-semibold uppercase tracking-[0.22em] text-amber">{children}</h2>
      {hint && <span className="text-[11px] text-dim">{hint}</span>}
    </div>
  );
}

export function Arrow({ dir }: { dir: 1 | -1 | 0 }) {
  if (dir === 0) return <span className="inline-block">•</span>;
  return (
    <svg width="9" height="9" viewBox="0 0 10 10" className="inline-block" aria-hidden>
      {dir > 0 ? (
        <path d="M5 1 L9 8 L1 8 Z" fill="currentColor" />
      ) : (
        <path d="M5 9 L1 2 L9 2 Z" fill="currentColor" />
      )}
    </svg>
  );
}

export function ChangePill({
  value,
  className,
  showArrow = true,
}: {
  value: number | null | undefined;
  className?: string;
  showArrow?: boolean;
}) {
  const v = value ?? 0;
  const up = v > 0;
  const flat = v === 0;
  return (
    <span
      className={classNames(
        "mono tnum inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
        flat ? "bg-term-700/60 text-muted" : up ? "bg-up/10 text-up" : "bg-down/10 text-down",
        className
      )}
    >
      {showArrow && !flat && <Arrow dir={up ? 1 : -1} />}
      {(v > 0 ? "+" : "") + v.toFixed(2) + "%"}
    </span>
  );
}

export function Delta({
  value,
  className,
  suffix = "",
}: {
  value: number | null | undefined;
  className?: string;
  suffix?: string;
}) {
  const v = value ?? 0;
  const up = v > 0;
  const flat = v === 0;
  return (
    <span
      className={classNames(
        "mono tnum font-semibold",
        flat ? "text-muted" : up ? "text-up" : "text-down",
        className
      )}
    >
      {flat ? "" : up ? "+" : ""}
      {v.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      {suffix}
    </span>
  );
}

export function Stat({
  label,
  value,
  sub,
  className,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  sub?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-line-soft bg-gradient-to-br from-term-700/40 to-term-900/60 px-3 py-2.5 ${className ?? ""}`}>
      <div className="mono text-[10px] uppercase tracking-[0.16em] text-dim">{label}</div>
      <div className="mono tnum mt-1 text-sm font-semibold text-fg">{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-muted">{sub}</div>}
    </div>
  );
}

export function Tag({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "amber" | "green" | "red" | "cyan" | "violet" | "blue" | "gold";
  className?: string;
}) {
  const tones: Record<string, string> = {
    neutral: "border-line text-muted",
    amber: "border-amber/40 text-amber bg-amber/5",
    green: "border-up/40 text-up bg-up/5",
    red: "border-down/40 text-down bg-down/5",
    cyan: "border-cyan/40 text-cyan bg-cyan/5",
    violet: "border-violet/40 text-violet bg-violet/5",
    blue: "border-blue/40 text-blue bg-blue/5",
    gold: "border-gold/40 text-gold bg-gold/5",
  };
  return (
    <span
      className={classNames(
        "mono inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function SentimentDot({ sentiment }: { sentiment: string | null | undefined }) {
  const map: Record<string, string> = {
    positive: "bg-up",
    negative: "bg-down",
    neutral: "bg-muted",
  };
  return <span className={classNames("inline-block h-1.5 w-1.5 rounded-full", map[sentiment ?? "neutral"])} />;
}

export function KeyVal({ k, v }: { k: React.ReactNode; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-line-soft py-1.5 last:border-0">
      <span className="text-xs text-muted">{k}</span>
      <span className="mono tnum text-xs font-semibold text-fg">{v}</span>
    </div>
  );
}
