"use client";

import { useActionState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { loginAction } from "@/app/auth-actions";

function LoginForm() {
  const searchParams = useSearchParams();
  const justReset = searchParams.get("reset") === "1";
  const [state, formAction, pending] = useActionState(loginAction, { ok: false });

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" />
      <div className="pointer-events-none absolute -top-20 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-brand/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 h-64 w-96 rounded-full bg-violet/10 blur-3xl" />

      <div className="panel relative w-full max-w-md p-7">
        <div className="mb-6 text-center">
          <div className="mono text-xl font-black">
            <span className="text-fg">SOKO</span>{" "}
            <span className="text-gradient">Terminal</span>
          </div>
          <p className="mono mt-1 text-[10px] uppercase tracking-[0.25em] text-dim">
            Welcome back · Nairobi
          </p>
        </div>

        <form action={formAction} className="space-y-3">
          {justReset && (
            <div className="mono rounded-lg border border-up/40 bg-up/5 px-3 py-2 text-xs text-up">
              ✓ Password changed successfully. Sign in with your new password.
            </div>
          )}
          <div>
            <label className="mono mb-1 block text-[10px] uppercase tracking-wider text-dim">Email</label>
            <input
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="mono w-full rounded-xl border border-line bg-term-900 px-3 py-2.5 text-sm text-fg outline-none transition focus:border-brand"
            />
          </div>
          <div>
            <label className="mono mb-1 block text-[10px] uppercase tracking-wider text-dim">Password</label>
            <input
              name="password"
              type="password"
              required
              placeholder="••••••••"
              className="mono w-full rounded-xl border border-line bg-term-900 px-3 py-2.5 text-sm text-fg outline-none transition focus:border-brand"
            />
          </div>

          {state.error && (
            <div className="mono rounded-lg border border-down/40 bg-down/5 px-3 py-2 text-xs text-down">
              {state.error}
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            className="btn-brand mono w-full rounded-xl py-2.5 text-xs font-bold uppercase tracking-wider text-term-950 transition hover:brightness-110 disabled:opacity-50"
          >
            {pending ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="mono mt-5 text-center text-[11px] text-dim">
          New here?{" "}
          <Link href="/register" className="font-bold text-brand hover:underline">
            Create an account
          </Link>
        </p>
        <Link href="/forgot-password" className="mono mt-2 block text-center text-[10px] text-dim hover:text-brand">
          Forgot password?
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center text-xs text-dim">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
