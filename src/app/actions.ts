"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { portfolios, holdings, transactions, watchlist, priceTargets } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import {
  safeNum,
  capStr,
  isAction,
  isSecType,
  isDirection,
  LIMITS,
} from "@/lib/validate";
import { ownsPortfolio, ownsHolding, requireSession } from "@/lib/auth";
import { rateLimit, userKey } from "@/lib/rate-limit";

export type ActionResult = { ok: boolean; error?: string };
export type TradeResult = ActionResult & { balance?: number; filled?: number };

// The Soko M-Pesa trading engine. Every order settles against the KES wallet:
//  - BUY  debits (qty × effective price + fees) from cashBalance
//  - SELL credits (qty × effective price − fees) to cashBalance
// Trades execute atomically inside a single DB transaction.
export async function executeTrade(input: {
  portfolioId: number;
  securityType: "stock" | "bond" | "crypto" | "fund";
  refId: number;
  symbol: string;
  name?: string;
  action: "buy" | "sell";
  quantity: number;
  price: number; // KES share price | bond clean % | KES per coin
  fees?: number;
}): Promise<TradeResult> {
  // ---- validate & sanitise all inputs ----
  const portfolioId = safeNum(input.portfolioId, { min: 1 });
  const refId = safeNum(input.refId, { min: 1 });
  const securityType = isSecType(input.securityType);
  const action = isAction(input.action);
  const qty = safeNum(input.quantity, { min: 1e-9, max: LIMITS.maxQty });
  const price = safeNum(input.price, { min: 1e-9, max: LIMITS.maxPrice });
  const fees = safeNum(input.fees ?? 0, { min: 0, max: LIMITS.maxAmount }) ?? 0;
  const symbol = capStr(input.symbol, LIMITS.symbolMax);
  const name = capStr(input.name, LIMITS.maxStr);

  if (!portfolioId || !refId || !securityType || !action || !qty || !price || !symbol)
    return { ok: false, error: "Invalid order: check quantity, price and security." };

  // effective unit cost in KES: bonds quote clean% (per KES of face value)
  const eff = securityType === "bond" ? price / 100 : price;
  const notional = qty * eff + fees;
  if (notional > LIMITS.maxAmount)
    return { ok: false, error: "Order value exceeds the maximum permitted notional." };

  // ---- SECURITY: verify the caller owns this portfolio ----
  const owns = await ownsPortfolio(portfolioId);
  if (!owns)
    return { ok: false, error: "Access denied — this portfolio does not belong to your account." };

  // ---- RATE LIMIT: max 30 trades/minute per user ----
  const session = await requireSession().catch(() => null);
  if (!session) return { ok: false, error: "Please sign in to trade." };
  if (!rateLimit(userKey("trade", session.id), 30))
    return { ok: false, error: "Rate limit: too many trades. Please wait a minute." };

  try {
    return await db.transaction(async (tx) => {
      const [pf] = await tx
        .select()
        .from(portfolios)
        .where(eq(portfolios.id, portfolioId))
        .limit(1);
      if (!pf) return { ok: false, error: "Portfolio not found." };

      const [existing] = await tx
        .select()
        .from(holdings)
        .where(
          and(
            eq(holdings.portfolioId, portfolioId),
            eq(holdings.securityType, securityType),
            eq(holdings.refId, refId)
          )
        )
        .limit(1);

      if (action === "buy") {
        const debit = qty * eff + fees;
        if ((pf.cashBalance ?? 0) < debit) {
          return {
            ok: false,
            error: `Insufficient M-Pesa balance. You need KSh ${debit.toLocaleString(
              "en-KE",
              { maximumFractionDigits: 2 }
            )} but have KSh ${(pf.cashBalance ?? 0).toLocaleString("en-KE", {
              maximumFractionDigits: 2,
            })}. Fund your wallet first.`,
          };
        }
        await tx
          .update(portfolios)
          .set({ cashBalance: sql`${portfolios.cashBalance} - ${debit}` })
          .where(eq(portfolios.id, portfolioId));

        if (existing) {
          const newQty = existing.quantity + qty;
          const newAvg = (existing.quantity * existing.avgCost + qty * eff + fees) / newQty;
          await tx
            .update(holdings)
            .set({ quantity: newQty, avgCost: newAvg, updatedAt: new Date() })
            .where(eq(holdings.id, existing.id));
        } else {
          await tx.insert(holdings).values({
            portfolioId,
            securityType,
            refId,
            symbol,
            quantity: qty,
            avgCost: (qty * eff + fees) / qty,
          });
        }
      } else {
        if (!existing)
          return { ok: false, error: "You have no holding in this security to sell." };
        if (existing.quantity + 1e-9 < qty)
          return {
            ok: false,
            error: `You only hold ${existing.quantity} ${symbol}.`,
          };
        const credit = Math.max(0, qty * eff - fees);
        await tx
          .update(portfolios)
          .set({ cashBalance: sql`${portfolios.cashBalance} + ${credit}` })
          .where(eq(portfolios.id, portfolioId));

        const newQty = existing.quantity - qty;
        if (newQty <= 1e-9) {
          await tx.delete(holdings).where(eq(holdings.id, existing.id));
        } else {
          await tx
            .update(holdings)
            .set({ quantity: newQty, updatedAt: new Date() })
            .where(eq(holdings.id, existing.id));
        }
      }

      await tx.insert(transactions).values({
        portfolioId,
        securityType,
        refId,
        symbol,
        action,
        quantity: qty,
        price,
        fees,
        date: new Date(),
        notes: name,
      });

      const [after] = await tx
        .select({ cash: portfolios.cashBalance })
        .from(portfolios)
        .where(eq(portfolios.id, portfolioId))
        .limit(1);

      revalidatePath("/portfolio");
      revalidatePath("/");
      return { ok: true, balance: after?.cash, filled: qty };
    });
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function createPortfolio(rawName: string): Promise<ActionResult> {
  const session = await requireSession().catch(() => null);
  if (!session) return { ok: false, error: "Please sign in first." };
  const name = capStr(rawName, 80);
  if (!name) return { ok: false, error: "Enter a portfolio name." };
  await db.insert(portfolios).values({ name, baseCurrency: "KES", userId: session.id });
  revalidatePath("/portfolio");
  return { ok: true };
}

export async function deleteHolding(id: number): Promise<ActionResult> {
  const hid = safeNum(id, { min: 1 });
  if (!hid) return { ok: false, error: "Invalid holding." };
  // SECURITY: verify the holding belongs to the caller's portfolio
  const owns = await ownsHolding(hid);
  if (!owns) return { ok: false, error: "Access denied — this holding is not yours." };
  await db.delete(holdings).where(eq(holdings.id, hid));
  revalidatePath("/portfolio");
  revalidatePath("/");
  return { ok: true };
}

export async function toggleWatchlist(input: {
  securityType: "stock" | "bond" | "crypto" | "fund";
  refId: number;
  symbol: string;
  name?: string;
}): Promise<{ ok: boolean; watching: boolean }> {
  const session = await requireSession().catch(() => null);
  if (!session) return { ok: false, watching: false };
  const refId = safeNum(input.refId, { min: 1 });
  const securityType = isSecType(input.securityType);
  const symbol = capStr(input.symbol, LIMITS.symbolMax);
  if (!refId || !securityType || !symbol) return { ok: false, watching: false };
  const name = capStr(input.name, LIMITS.maxStr);

  const [existing] = await db
    .select()
    .from(watchlist)
    .where(
      and(eq(watchlist.securityType, securityType), eq(watchlist.refId, refId))
    )
    .limit(1);
  if (existing) {
    await db.delete(watchlist).where(eq(watchlist.id, existing.id));
    revalidatePath("/watchlist");
    revalidatePath("/stocks");
    revalidatePath("/bonds");
    return { ok: true, watching: false };
  }
  await db.insert(watchlist).values({
    securityType,
    refId,
    symbol,
    name,
  });
  revalidatePath("/watchlist");
  return { ok: true, watching: true };
}

export async function removeFromWatchlist(id: number): Promise<ActionResult> {
  const session = await requireSession().catch(() => null);
  if (!session) return { ok: false, error: "Please sign in." };
  await db.delete(watchlist).where(eq(watchlist.id, id));
  revalidatePath("/watchlist");
  return { ok: true };
}

// ---------- PRICE TARGETS / ALERTS ----------
export async function addPriceTarget(input: {
  securityType: "stock" | "crypto" | "bond";
  refId: number;
  symbol: string;
  targetPrice: number;
  direction: "up" | "down";
  note?: string;
}): Promise<ActionResult & { id?: number }> {
  const session = await requireSession().catch(() => null);
  if (!session) return { ok: false, error: "Please sign in to set alerts." };
  const refId = safeNum(input.refId, { min: 1 });
  const securityType = isSecType(input.securityType);
  const symbol = capStr(input.symbol, LIMITS.symbolMax);
  const tp = safeNum(input.targetPrice, { min: 1e-9, max: LIMITS.maxPrice });
  const direction = isDirection(input.direction);
  if (!refId || !securityType || !symbol || !tp || !direction)
    return { ok: false, error: "Enter a valid target price and security." };
  const note = capStr(input.note, LIMITS.maxStr);
  const [row] = await db
    .insert(priceTargets)
    .values({
      securityType,
      refId,
      symbol,
      targetPrice: tp,
      direction,
      note,
    })
    .returning();
  revalidatePath("/alerts");
  revalidatePath("/");
  return { ok: true, id: row.id };
}

export async function removePriceTarget(id: number): Promise<ActionResult> {
  const session = await requireSession().catch(() => null);
  if (!session) return { ok: false, error: "Please sign in." };
  const tid = safeNum(id, { min: 1 });
  if (!tid) return { ok: false, error: "Invalid alert." };
  await db.delete(priceTargets).where(eq(priceTargets.id, tid));
  revalidatePath("/alerts");
  revalidatePath("/");
  return { ok: true };
}
