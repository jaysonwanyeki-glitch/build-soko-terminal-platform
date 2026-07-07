import Link from "next/link";

export default function NotFound() {
  return (
    <div className="relative flex min-h-[70vh] items-center justify-center overflow-hidden p-4">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-30" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-64 w-96 -translate-x-1/2 rounded-full bg-brand/10 blur-3xl" />
      <div className="panel relative w-full max-w-md p-8 text-center">
        <div className="mono text-6xl font-black text-gradient">404</div>
        <h1 className="mono mt-3 text-sm font-bold uppercase tracking-wider text-fg">
          Page Not Found
        </h1>
        <p className="mono mt-2 text-[11px] leading-relaxed text-dim">
          This URL doesn&apos;t exist on Soko Terminal. The security you requested
          may require authentication, or the symbol may be invalid.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Link
            href="/"
            className="btn-brand mono rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider text-term-950 transition hover:brightness-110"
          >
            ← Terminal Home
          </Link>
          <Link
            href="/stocks"
            className="mono rounded-xl border border-line px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted transition hover:border-brand/40 hover:text-brand"
          >
            Browse Stocks
          </Link>
        </div>
      </div>
    </div>
  );
}
