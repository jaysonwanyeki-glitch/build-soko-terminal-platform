export function LoadingSpinner({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 p-8">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      <span className="mono text-xs text-dim">{label}…</span>
    </div>
  );
}

export function PanelSkeleton() {
  return (
    <div className="panel animate-pulse">
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <div className="h-3 w-24 rounded bg-term-700" />
        <div className="h-3 w-12 rounded bg-term-700" />
      </div>
      <div className="space-y-2 p-4">
        <div className="h-3 w-full rounded bg-term-700/50" />
        <div className="h-3 w-4/5 rounded bg-term-700/50" />
        <div className="h-3 w-3/5 rounded bg-term-700/50" />
      </div>
    </div>
  );
}
