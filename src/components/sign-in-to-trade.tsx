import Link from "next/link";

/** Shown on detail pages when the user is browsing but not signed in. */
export function SignInToTrade({ label = "Trade" }: { label?: string }) {
  return (
    <div className="p-5 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand/20 to-cyan/10 text-2xl">
        🔐
      </div>
      <p className="mt-3 text-sm font-semibold text-fg">Sign in to {label}</p>
      <p className="mono mt-1 text-[11px] leading-relaxed text-dim">
        Fund your M-Pesa wallet and start trading in under a minute.
      </p>
      <div className="mt-4 flex flex-col gap-2">
        <Link
          href="/login"
          className="btn-brand mono rounded-xl py-2.5 text-xs font-bold uppercase tracking-wider text-term-950 transition hover:brightness-110"
        >
          Sign In
        </Link>
        <Link
          href="/register"
          className="mono rounded-xl border border-line py-2.5 text-xs font-bold uppercase tracking-wider text-muted transition hover:border-brand/40 hover:text-brand"
        >
          Create Free Account
        </Link>
      </div>
    </div>
  );
}
