"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { mpesaPayments, portfolios } from "@/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { initiateStkPush, normalizePhone, mpesaMode } from "@/lib/mpesa";
import { ownsPortfolio, requireSession } from "@/lib/auth";
import { rateLimit, userKey } from "@/lib/rate-limit";

const SIM_DELAY_MS = 5000;

export type PayResult = {
  ok: boolean;
  error?: string;
  id?: number;
  checkoutRequestId?: string;
  mode?: "live" | "simulation";
  customerMessage?: string;
};

export async function startMpesaPayment(input: {
  portfolioId: number;
  phone: string;
  amount: number;
}): Promise<PayResult> {
  const phone = normalizePhone(input.phone);
  if (!phone)
    return { ok: false, error: "Enter a valid Safaricom number (e.g. 0712 345 678)." };
  const amount = Math.round(Number(input.amount));
  if (!(amount >= 1))
    return { ok: false, error: "Enter a valid amount in KSh (min 1)." };
  if (amount > 1_000_000)
    return { ok: false, error: "Amount exceeds the per-transaction limit." };

  // SECURITY: verify the caller owns this wallet
  if (!(await ownsPortfolio(input.portfolioId)))
    return { ok: false, error: "Access denied — this wallet does not belong to your account." };

  // RATE LIMIT: max 5 STK pushes / minute
  const session = await requireSession().catch(() => null);
  if (!session) return { ok: false, error: "Please sign in." };
  if (!rateLimit(userKey("mpesa-deposit", session.id), 5))
    return { ok: false, error: "Rate limit: too many payment attempts. Please wait a minute." };

  const callbackUrl =
    process.env.MPESA_CALLBACK_URL ||
    `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/mpesa/callback`;

  const accountReference = `SOKO${input.portfolioId}`;
  const res = await initiateStkPush({
    phone,
    amount,
    accountReference,
    callbackUrl,
  });

  if (!res.ok || !res.checkoutRequestId)
    return { ok: false, error: res.error || "Could not initiate M-Pesa prompt." };

  const [row] = await db
    .insert(mpesaPayments)
    .values({
      portfolioId: input.portfolioId,
      checkoutRequestId: res.checkoutRequestId,
      merchantRequestId: res.merchantRequestId,
      phone,
      amount,
      status: "pending",
      accountReference,
      mode: res.mode,
    })
    .returning();

    return {
      ok: true,
      id: row.id,
      checkoutRequestId: row.checkoutRequestId ?? undefined,
      mode: res.mode,
      customerMessage: res.customerMessage,
    };
}

export type PollResult = {
  status: "pending" | "completed" | "failed" | "missing";
  amount?: number;
  receipt?: string;
};

export async function checkMpesaPayment(
  checkoutRequestId: string
): Promise<PollResult> {
  const [row] = await db
    .select()
    .from(mpesaPayments)
    .where(eq(mpesaPayments.checkoutRequestId, checkoutRequestId))
    .limit(1);

  if (!row || !row.portfolioId) return { status: "missing" };
  // SECURITY: only the wallet owner may poll this payment
  if (!(await ownsPortfolio(row.portfolioId))) return { status: "missing" };
  if (row.status !== "pending")
    return {
      status: row.status as PollResult["status"],
      amount: row.amount,
      receipt: row.receipt ?? undefined,
    };

  // Simulation: auto-complete a short delay after initiation.
  if (row.mode === "simulation") {
    const ageMs = Date.now() - new Date(row.createdAt ?? Date.now()).getTime();
    if (ageMs >= SIM_DELAY_MS) {
      const receipt =
        "SOK" + Math.floor(Math.random() * 9_000_000_000 + 1_000_000_000).toString();
      await db
        .update(mpesaPayments)
        .set({ status: "completed", receipt, resultCode: 0, completedAt: new Date() })
        .where(eq(mpesaPayments.id, row.id));
      await db
        .update(portfolios)
        .set({ cashBalance: sql`${portfolios.cashBalance} + ${row.amount}` })
        .where(eq(portfolios.id, row.portfolioId));
      revalidatePath("/portfolio");
      return { status: "completed", amount: row.amount, receipt };
    }
  }
  return { status: "pending" };
}

export async function cancelMpesaPayment(checkoutRequestId: string) {
  const [row] = await db
    .select()
    .from(mpesaPayments)
    .where(eq(mpesaPayments.checkoutRequestId, checkoutRequestId))
    .limit(1);
  if (!row?.portfolioId || !(await ownsPortfolio(row.portfolioId)))
    return { ok: false };
  await db
    .update(mpesaPayments)
    .set({ status: "failed", resultCode: 1032 })
    .where(
      sql`${mpesaPayments.checkoutRequestId} = ${checkoutRequestId} AND ${mpesaPayments.status} = 'pending'`
    );
  revalidatePath("/portfolio");
  return { ok: true };
}

export async function getMpesaHistory(portfolioId: number) {
  // SECURITY: only the wallet owner may read payment history
  if (!(await ownsPortfolio(portfolioId))) return [];
  return db
    .select()
    .from(mpesaPayments)
    .where(eq(mpesaPayments.portfolioId, portfolioId))
    .orderBy(desc(mpesaPayments.createdAt))
    .limit(10);
}

export async function currentMpesaMode() {
  return mpesaMode();
}

// Withdraw wallet balance back to M-Pesa (B2C simulation). Debits the wallet
// instantly and records a withdrawal row with status 'completed'.
export async function withdrawToMpesa(input: {
  portfolioId: number;
  phone: string;
  amount: number;
}): Promise<PayResult> {
  const phone = normalizePhone(input.phone);
  if (!phone) return { ok: false, error: "Enter a valid Safaricom number." };
  const amount = Math.round(Number(input.amount));
  if (!(amount >= 1)) return { ok: false, error: "Enter a valid amount." };

  const wsession = await requireSession().catch(() => null);
  if (!wsession) return { ok: false, error: "Please sign in." };

  // SECURITY: verify the caller owns this wallet before any debit
  if (!(await ownsPortfolio(input.portfolioId)))
    return { ok: false, error: "Access denied — this wallet does not belong to your account." };

  // RATE LIMIT: max 3 withdrawals / minute
  if (!rateLimit(userKey("mpesa-withdraw", wsession.id), 3))
    return { ok: false, error: "Rate limit: too many withdrawals. Please wait a minute." };

  const [pf] = await db
    .select()
    .from(portfolios)
    .where(eq(portfolios.id, input.portfolioId))
    .limit(1);
  if (!pf) return { ok: false, error: "Wallet not found." };
  if ((pf.cashBalance ?? 0) < amount)
    return {
      ok: false,
      error: `Insufficient balance. You have KSh ${(pf.cashBalance ?? 0).toLocaleString(
        "en-KE",
        { maximumFractionDigits: 2 }
      )}.`,
    };

  await db
    .update(portfolios)
    .set({ cashBalance: sql`${portfolios.cashBalance} - ${amount}` })
    .where(eq(portfolios.id, input.portfolioId));

  const receipt =
    "WD" + Math.floor(Math.random() * 9_000_000_000 + 1_000_000_000).toString();
  await db.insert(mpesaPayments).values({
    portfolioId: input.portfolioId,
    phone,
    amount: -amount, // negative denotes a withdrawal
    status: "completed",
    receipt,
    accountReference: "WITHDRAW",
    mode: mpesaMode(),
    completedAt: new Date(),
  });

  revalidatePath("/portfolio");
  return {
    ok: true,
    mode: mpesaMode(),
    customerMessage: `KSh ${amount.toLocaleString("en-KE")} sent to ${phone}. Ref ${receipt}.`,
  };
}
