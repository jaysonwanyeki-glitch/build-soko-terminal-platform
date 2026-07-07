import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { mpesaTransactions, portfolios, transactions, holdings, stocks, bonds, cryptoAssets } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("M-Pesa Callback received:", JSON.stringify(body));

    const { Body } = body;
    if (!Body?.stkCallback) {
      return NextResponse.json({ error: "Invalid callback" }, { status: 400 });
    }

    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata,
    } = Body.stkCallback;

    // Find the pending M-Pesa transaction
    const [mpesaTxn] = await db
      .select()
      .from(mpesaTransactions)
      .where(eq(mpesaTransactions.checkoutRequestId, CheckoutRequestID))
      .limit(1);

    if (!mpesaTxn) {
      console.log("No matching M-Pesa transaction found for:", CheckoutRequestID);
      return NextResponse.json({ message: "No matching transaction" });
    }

    if (ResultCode === 0) {
      let mpesaReceiptNumber = "";
      let amount = mpesaTxn.amount;

      if (CallbackMetadata?.Item) {
        for (const item of CallbackMetadata.Item) {
          if (item.Name === "MpesaReceiptNumber") {
            mpesaReceiptNumber = item.Value?.toString() ?? "";
          }
          if (item.Name === "Amount") {
            amount = parseFloat(item.Value?.toString() ?? "0");
          }
        }
      }

      const isTrade = mpesaTxn.type?.startsWith("BUY_");

      if (isTrade && mpesaTxn.assetType && mpesaTxn.assetSymbol && mpesaTxn.quantity && mpesaTxn.price) {
        // Execute the trade
        await executeTradeInternal(
          mpesaTxn.id,
          mpesaTxn.portfolioId,
          mpesaTxn.assetType,
          mpesaTxn.assetSymbol,
          mpesaTxn.quantity,
          mpesaTxn.price,
          mpesaTxn.amount,
          mpesaTxn.phoneNumber,
          mpesaReceiptNumber
        );
      } else {
        // Standard deposit flow
        await db
          .update(mpesaTransactions)
          .set({
            status: "COMPLETED",
            resultCode: 0,
            resultDesc: ResultDesc ?? "Success",
            mpesaReceiptNumber,
            updatedAt: new Date(),
          })
          .where(eq(mpesaTransactions.id, mpesaTxn.id));

        const [portfolio] = await db
          .select()
          .from(portfolios)
          .where(eq(portfolios.id, mpesaTxn.portfolioId))
          .limit(1);

        if (portfolio) {
          await db
            .update(portfolios)
            .set({
              cashBalance: portfolio.cashBalance + amount,
              totalCurrentValue: portfolio.totalCurrentValue + amount,
            })
            .where(eq(portfolios.id, portfolio.id));

          await db.insert(transactions).values({
            portfolioId: portfolio.id,
            type: "DEPOSIT",
            totalAmount: amount,
            fees: 0,
            notes: `M-Pesa deposit: ${mpesaTxn.phoneNumber} (Receipt: ${mpesaReceiptNumber})`,
            executedAt: new Date(),
          });
        }
      }
    } else {
      await db
        .update(mpesaTransactions)
        .set({
          status: "FAILED",
          resultCode: ResultCode,
          resultDesc: ResultDesc ?? "Transaction failed",
          updatedAt: new Date(),
        })
        .where(eq(mpesaTransactions.id, mpesaTxn.id));
    }

    return NextResponse.json({ ResultCode: 0, ResultDesc: "Callback processed" });
  } catch (error) {
    console.error("M-Pesa callback error:", error);
    return NextResponse.json(
      { ResultCode: 1, ResultDesc: "Internal error" },
      { status: 500 }
    );
  }
}

async function executeTradeInternal(
  mpesaTxnId: number,
  portfolioId: number,
  assetType: string,
  assetSymbol: string,
  quantity: number,
  price: number,
  amount: number,
  phoneNumber: string,
  receiptNumber: string
) {
  // Mark M-Pesa as completed
  await db
    .update(mpesaTransactions)
    .set({
      status: "COMPLETED",
      resultCode: 0,
      resultDesc: "Success",
      mpesaReceiptNumber: receiptNumber,
      updatedAt: new Date(),
    })
    .where(eq(mpesaTransactions.id, mpesaTxnId));

  // Record trade transaction
  await db.insert(transactions).values({
    portfolioId,
    type: "BUY",
    assetType,
    assetSymbol,
    quantity,
    price,
    totalAmount: amount,
    fees: amount * 0.0021,
    notes: `M-Pesa buy: ${quantity} ${assetSymbol} @ KES ${price} (Receipt: ${receiptNumber})`,
    executedAt: new Date(),
  });

  // Update holdings
  const [existing] = await db
    .select()
    .from(holdings)
    .where(
      and(
        eq(holdings.portfolioId, portfolioId),
        eq(holdings.assetType, assetType),
        eq(holdings.assetSymbol, assetSymbol)
      )
    )
    .limit(1);

  const totalCost = quantity * price;

  if (existing) {
    const newQty = existing.quantity + quantity;
    const newTotalCost = existing.totalCost + totalCost;
    const newAvgCost = newTotalCost / newQty;
    await db
      .update(holdings)
      .set({
        quantity: newQty,
        avgCost: newAvgCost,
        totalCost: newTotalCost,
        currentPrice: price,
        currentValue: newQty * price,
        unrealizedPL: newQty * price - newTotalCost,
        unrealizedPLPercent: ((newQty * price - newTotalCost) / newTotalCost) * 100,
      })
      .where(eq(holdings.id, existing.id));
  } else {
    await db.insert(holdings).values({
      portfolioId,
      assetType,
      assetSymbol,
      quantity,
      avgCost: price,
      totalCost,
      currentPrice: price,
      currentValue: totalCost,
      unrealizedPL: 0,
      unrealizedPLPercent: 0,
      dayChange: 0,
    });
  }

  // Update portfolio totals
  const allHoldings = await db
    .select()
    .from(holdings)
    .where(eq(holdings.portfolioId, portfolioId));

  const [portfolio] = await db
    .select()
    .from(portfolios)
    .where(eq(portfolios.id, portfolioId))
    .limit(1);

  if (portfolio) {
    const totalInvested = allHoldings.reduce((s, h) => s + h.totalCost, 0);
    const totalCurrentValue = portfolio.cashBalance + allHoldings.reduce((s, h) => s + h.currentValue, 0);

    await db
      .update(portfolios)
      .set({
        totalInvested,
        totalCurrentValue,
        totalReturn: totalCurrentValue - totalInvested,
        totalReturnPercent: totalInvested > 0 ? ((totalCurrentValue - totalInvested) / totalInvested) * 100 : 0,
      })
      .where(eq(portfolios.id, portfolioId));
  }
}
