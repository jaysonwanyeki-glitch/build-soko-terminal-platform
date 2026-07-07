"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { pendingOrders, portfolios, holdings, transactions } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { ownsPortfolio, requireSession } from "@/lib/auth";
import { rateLimit, userKey } from "@/lib/rate-limit";
import {
  safeNum,
  capStr,
  isAction,
  isSecType,
  LIMITS,
} from "@/lib/validate";
import { getAllStocks, getAllCryptos, getAllFunds } from "@/db/queries";

export type OrderResult = { ok: boolean; error?: string; id?: number };

export async function placeOrder(input: {
  portfolioId: number;
  securityType: "stock" | "bond" | "crypto" | "fund";
  refId: number;
  symbol: string;
  name?: string;
  action: "buy" | "sell";
  orderType: "limit" | "stop";
  quantity: number;
  triggerPrice: number;
}): Promise<OrderResult> {
  const portfolioId = safeNum(input.portfolioId, { min: 1 });
  const refId = safeNum(input.refId, { min: 1 });
  const securityType = isSecType(input.securityType);
  const action = isAction(input.action);
  const qty = safeNum(input.quantity, { min: 1e-9, max: LIMITS.maxQty });
  const tp = safeNum(input.triggerPrice, { min: 1e-9, max: LIMITS.maxPrice });
  const symbol = capStr(input.symbol, LIMITS.symbolMax);
  const orderType = input.orderType === "stop" ? "stop" : "limit";

  if (!portfolioId || !refId || !securityType || !action || !qty || !tp || !symbol)
    return { ok: false, error: "Invalid order parameters." };

  const session = await requireSession().catch(() => null);
  if (!session) return { ok: false, error: "Please sign in." };
  if (!(await ownsPortfolio(portfolioId)))
    return { ok: false, error: "Access denied." };
  if (!rateLimit(userKey("order", session.id), 20))
    return { ok: false, error: "Rate limit: too many orders." };

  // For sell orders, verify the user actually holds enough
  if (action === "sell") {
    const [holding] = await db
      .select()
      .from(holdings)
      .where(
        sql`${holdings.portfolioId} = ${portfolioId} AND ${holdings.securityType} = ${securityType} AND ${holdings.refId} = ${refId}`
      )
      .limit(1);
    if (!holding || holding.quantity + 1e-9 < qty)
      return { ok: false, error: `You only hold ${holding?.quantity ?? 0} ${symbol}.` };
  }

  // For buy limit/stop, check they *will* have funds (soft check)
  if (action === "buy") {
    const [pf] = await db.select().from(portfolios).where(eq(portfolios.id, portfolioId)).limit(1);
    const eff = securityType === "bond" ? tp / 100 : tp;
    if ((pf?.cashBalance ?? 0) < qty * eff)
      return { ok: false, error: "Insufficient wallet balance for this order." };
  }

  const [row] = await db
    .insert(pendingOrders)
    .values({
      portfolioId,
      securityType,
      refId,
      symbol,
      name: capStr(input.name, LIMITS.maxStr),
      action,
      orderType,
      quantity: qty,
      triggerPrice: tp,
      status: "open",
    })
    .returning();

  revalidatePath("/portfolio");
  revalidatePath("/orders");
  return { ok: true, id: row.id };
}

export async function cancelOrder(id: number): Promise<OrderResult> {
  const session = await requireSession().catch(() => null);
  if (!session) return { ok: false, error: "Please sign in." };

  const oid = safeNum(id, { min: 1 });
  if (!oid) return { ok: false, error: "Invalid order." };

  // verify ownership via portfolio
  const [order] = await db.select().from(pendingOrders).where(eq(pendingOrders.id, oid)).limit(1);
  if (!order || !(await ownsPortfolio(order.portfolioId)))
    return { ok: false, error: "Access denied." };

  await db
    .update(pendingOrders)
    .set({ status: "cancelled" })
    .where(eq(pendingOrders.id, oid));

  revalidatePath("/portfolio");
  revalidatePath("/orders");
  return { ok: true };
}

/**
 * Checks all open orders against current market prices and fills any that
 * have triggered. Called on portfolio/order page load.
 */
export async function checkAndFillOrders(): Promise<{ filled: number }> {
  const openOrders = await db
    .select()
    .from(pendingOrders)
    .where(eq(pendingOrders.status, "open"));

  if (!openOrders.length) return { filled: 0 };

  // Build current price maps
  const [stocks, cryptos, funds] = await Promise.all([getAllStocks(), getAllCryptos(), getAllFunds()]);
  const priceMap = new Map<string, { price: number; type: string }>();
  stocks.forEach((s) => priceMap.set(`stock:${s.id}`, { price: s.price ?? 0, type: "stock" }));
  cryptos.forEach((c) => priceMap.set(`crypto:${c.id}`, { price: c.price ?? 0, type: "crypto" }));
  funds.forEach((f) => priceMap.set(`fund:${f.id}`, { price: f.price ?? 0, type: "fund" }));

  let filled = 0;

  for (const order of openOrders) {
    const key = `${order.securityType}:${order.refId}`;
    const market = priceMap.get(key);
    if (!market) continue;

    const currentPrice = market.price;
    let shouldFill = false;

    if (order.action === "buy") {
      if (order.orderType === "limit" && currentPrice <= order.triggerPrice) shouldFill = true;
      if (order.orderType === "stop" && currentPrice >= order.triggerPrice) shouldFill = true;
    } else {
      // sell
      if (order.orderType === "limit" && currentPrice >= order.triggerPrice) shouldFill = true;
      if (order.orderType === "stop" && currentPrice <= order.triggerPrice) shouldFill = true;
    }

    if (shouldFill) {
      try {
        await db.transaction(async (tx) => {
          const eff = order.securityType === "bond" ? currentPrice / 100 : currentPrice;

          if (order.action === "buy") {
            const debit = order.quantity * eff;
            await tx
              .update(portfolios)
              .set({ cashBalance: sql`${portfolios.cashBalance} - ${debit}` })
              .where(eq(portfolios.id, order.portfolioId));

            const [existing] = await tx
              .select()
              .from(holdings)
              .where(
                sql`${holdings.portfolioId} = ${order.portfolioId} AND ${holdings.securityType} = ${order.securityType} AND ${holdings.refId} = ${order.refId}`
              )
              .limit(1);

            if (existing) {
              const newQty = existing.quantity + order.quantity;
              const newAvg = (existing.quantity * existing.avgCost + order.quantity * eff) / newQty;
              await tx
                .update(holdings)
                .set({ quantity: newQty, avgCost: newAvg, updatedAt: new Date() })
                .where(eq(holdings.id, existing.id));
            } else {
              await tx.insert(holdings).values({
                portfolioId: order.portfolioId,
                securityType: order.securityType,
                refId: order.refId,
                symbol: order.symbol,
                quantity: order.quantity,
                avgCost: eff,
              });
            }
          } else {
            const credit = order.quantity * eff;
            await tx
              .update(portfolios)
              .set({ cashBalance: sql`${portfolios.cashBalance} + ${credit}` })
              .where(eq(portfolios.id, order.portfolioId));

            const [existing] = await tx
              .select()
              .from(holdings)
              .where(
                sql`${holdings.portfolioId} = ${order.portfolioId} AND ${holdings.securityType} = ${order.securityType} AND ${holdings.refId} = ${order.refId}`
              )
              .limit(1);

            if (existing) {
              const newQty = existing.quantity - order.quantity;
              if (newQty <= 1e-9) {
                await tx.delete(holdings).where(eq(holdings.id, existing.id));
              } else {
                await tx
                  .update(holdings)
                  .set({ quantity: newQty, updatedAt: new Date() })
                  .where(eq(holdings.id, existing.id));
              }
            }
          }

          await tx.insert(transactions).values({
            portfolioId: order.portfolioId,
            securityType: order.securityType,
            refId: order.refId,
            symbol: order.symbol,
            action: order.action,
            quantity: order.quantity,
            price: currentPrice,
            fees: 0,
            date: new Date(),
            notes: `${order.orderType} order #${order.id}`,
          });

          await tx
            .update(pendingOrders)
            .set({ status: "filled", filledAt: new Date(), filledPrice: currentPrice })
            .where(eq(pendingOrders.id, order.id));
        });
        filled++;
      } catch (e) {
        console.error(`Failed to fill order ${order.id}:`, e);
      }
    }
  }

  if (filled > 0) {
    revalidatePath("/portfolio");
    revalidatePath("/orders");
  }
  return { filled };
}
