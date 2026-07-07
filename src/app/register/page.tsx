"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signupAction } from "@/app/auth-actions";

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(signupAction, { ok: false });

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" />
      <div className="pointer-events-none absolute -top-20 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-brand/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 h-64 w-96 rounded-full bg-cyan/10 blur-3xl" />

      <div className="panel relative w-full max-w-md p-7">
        <div className="mb-6 text-center">
          <div className="mono text-xl font-black">
            <span className="text-fg">SOKO</span> <span className="text-gradient">Terminal</span>
          </div>
          <p className="mono mt-1 text-[10px] uppercase tracking-[0.25em] text-dim">
            Open your free account
          </p>
        </div>

        <form action={formAction} className="space-y-3">
          <div>
            <label className="mono mb-1 block text-[10px] uppercase tracking-wider text-dim">Full Name</label>
            <input name="name" type="text" required placeholder="Wanjiku Mwangi" className="mono w-full rounded-xl border border-line bg-term-900 px-3 py-2.5 text-sm text-fg outline-none transition focus:border-brand" />
          </div>
          <div>
            <label className="mono mb-1 block text-[10px] uppercase tracking-wider text-dim">Email</label>
            <input name="email" type="email" required placeholder="you@example.com" className="mono w-full rounded-xl border border-line bg-term-900 px-3 py-2.5 text-sm text-fg outline-none transition focus:border-brand" />
          </div>
          <div>
            <label className="mono mb-1 block text-[10px] uppercase tracking-wider text-dim">Password</label>
            <input name="password" type="password" required minLength={6} placeholder="Min 6 characters" className="mono w-full rounded-xl border border-line bg-term-900 px-3 py-2.5 text-sm text-fg outline-none transition focus:border-brand" />
          </div>

          {state.error && (
            <div className="mono rounded-lg border border-down/40 bg-down/5 px-3 py-2 text-xs text-down">
              {state.error}
            </div>
          )}

          <button type="submit" disabled={pending} className="btn-brand mono w-full rounded-xl py-2.5 text-xs font-bold uppercase tracking-wider text-term-950 transition hover:brightness-110 disabled:opacity-50">
            {pending ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p className="mono mt-5 text-center text-[11px] text-dim">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-brand hover:underline">
            Sign in
          </Link>
        </p>
        <p className="mono mt-3 text-center text-[9px] text-dim">
          By signing up you get a KES wallet & M-Pesa-ready portfolio.
        </p>
      </div>
    </div>
  );
}
