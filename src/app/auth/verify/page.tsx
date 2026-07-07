import { verifyEmailToken } from "@/lib/auth";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="relative flex min-h-screen items-center justify-center p-4">
        <div className="panel max-w-md p-7 text-center">
          <div className="text-3xl">⚠️</div>
          <p className="mt-3 text-sm font-semibold text-fg">Invalid verification link</p>
          <Link href="/" className="mono mt-4 inline-block text-xs font-bold text-brand hover:underline">
            Go home →
          </Link>
        </div>
      </div>
    );
  }

  const result = await verifyEmailToken(token);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" />
      <div className="pointer-events-none absolute -top-20 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-brand/15 blur-3xl" />
      <div className="panel relative w-full max-w-md p-7 text-center">
        {result.ok ? (
          <>
            <div className="text-4xl">✅</div>
            <h1 className="mono mt-3 text-lg font-black text-fg">Email Verified!</h1>
            <p className="mono mt-2 text-[11px] leading-relaxed text-dim">
              Your email is confirmed. You can now trade with full confidence.
            </p>
            <Link href="/" className="btn-brand mono mt-4 inline-block rounded-xl px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-term-950 transition hover:brightness-110">
              Enter Terminal →
            </Link>
          </>
        ) : (
          <>
            <div className="text-4xl">❌</div>
            <h1 className="mono mt-3 text-lg font-black text-fg">Verification Failed</h1>
            <p className="mono mt-2 text-[11px] text-down">{result.error}</p>
            <Link href="/" className="mono mt-4 inline-block text-xs font-bold text-brand hover:underline">
              Go home →
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
