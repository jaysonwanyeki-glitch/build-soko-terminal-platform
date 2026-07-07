"use client";

import { useActionState } from "react";
import Link from "next/link";
import { forgotPasswordAction } from "@/app/auth-actions";

export default function ForgotPasswordPage() {
  const [_state, formAction, pending] = useActionState(forgotPasswordAction, { ok: false });
  const sent = _state.ok;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" />
      <div className="pointer-events-none absolute -top-20 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-brand/15 blur-3xl" />
      <div className="panel relative w-full max-w-md p-7">
        <div className="mb-6 text-center">
          <div className="mono text-xl font-black">
            <span className="text-fg">SOKO</span> <span className="text-gradient">Terminal</span>
          </div>
          <p className="mono mt-1 text-[10px] uppercase tracking-[0.25em] text-dim">Reset your password</p>
        </div>
        {sent ? (
          <div className="text-center">
            <div className="text-3xl">✉️</div>
            <p className="mt-3 text-sm font-semibold text-fg">Check your inbox</p>
            <p className="mono mt-2 text-[11px] leading-relaxed text-dim">
              If an account exists with that email, we&apos;ve sent a reset link. It expires in 1 hour.
            </p>
            <Link href="/login" className="mono mt-4 inline-block text-xs font-bold text-brand hover:underline">
              ← Back to sign in
            </Link>
          </div>
        ) : (
          <form action={formAction} className="space-y-3">
            <input name="email" type="email" required placeholder="you@example.com"
              className="mono w-full rounded-xl border border-line bg-term-900 px-3 py-2.5 text-sm text-fg outline-none transition focus:border-brand" />
            <button type="submit" disabled={pending}
              className="btn-brand mono w-full rounded-xl py-2.5 text-xs font-bold uppercase tracking-wider text-term-950 transition hover:brightness-110 disabled:opacity-50">
              {pending ? "Sending…" : "Send Reset Link"}
            </button>
            <Link href="/login" className="mono block text-center text-[11px] text-dim hover:text-brand">
              ← Back to sign in
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
