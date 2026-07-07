"use client";

import { useActionState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { resetPasswordAction } from "@/app/auth-actions";

function ResetForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [_state, formAction, pending] = useActionState(resetPasswordAction, { ok: false });

  if (!token) {
    return (
      <div className="relative flex min-h-screen items-center justify-center p-4">
        <div className="panel max-w-md p-7 text-center">
          <div className="text-3xl">⚠️</div>
          <p className="mt-3 text-sm font-semibold text-fg">Invalid reset link</p>
          <p className="mono mt-2 text-[11px] text-dim">No reset token was provided in the URL.</p>
          <Link href="/forgot-password" className="mono mt-4 inline-block text-xs font-bold text-brand hover:underline">
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" />
      <div className="pointer-events-none absolute -top-20 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-amber/15 blur-3xl" />
      <div className="panel relative w-full max-w-md p-7">
        <div className="mb-6 text-center">
          <div className="mono text-xl font-black">
            <span className="text-fg">SOKO</span> <span className="text-gradient">Terminal</span>
          </div>
          <p className="mono mt-1 text-[10px] uppercase tracking-[0.25em] text-dim">Set a new password</p>
        </div>
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="token" value={token} />
          <input name="password" type="password" required minLength={6} placeholder="New password (min 6 chars)"
            className="mono w-full rounded-xl border border-line bg-term-900 px-3 py-2.5 text-sm text-fg outline-none transition focus:border-brand" />
          {_state.error && (
            <div className="mono rounded-lg border border-down/40 bg-down/5 px-3 py-2 text-xs text-down">{_state.error}</div>
          )}
          <button type="submit" disabled={pending}
            className="btn-amber mono w-full rounded-xl py-2.5 text-xs font-bold uppercase tracking-wider text-term-950 transition hover:brightness-110 disabled:opacity-50">
            {pending ? "Resetting…" : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center text-xs text-dim">Loading…</div>}>
      <ResetForm />
    </Suspense>
  );
}
