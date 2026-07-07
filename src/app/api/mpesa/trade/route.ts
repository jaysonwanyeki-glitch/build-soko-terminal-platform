import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  mpesaTransactions,
  portfolios,
  holdings,
  transactions,
  stocks,
  bonds,
  cryptoAssets,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";

const MPESA_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
const MPESA_CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;
const MPESA_PASSKEY = process.env.MPESA_PASSKEY;
const MPESA_SHORTCODE = process.env.MPESA_SHORTCODE;
const MPESA_ENV = process.env.MPESA_ENVIRONMENT ?? "sandbox";

const BASE_URL =
  MPESA_ENV === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";

async function getAccessToken(): Promise<string> {
  const auth = Buffer.from(
    `${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`
  ).toString("base64");
  const res = await fetch(
    `${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    {
      method: "GET",
      headers: { Authorization: `Basic ${auth}` },
    }
  );
  if (!res.ok) throw new Error("Failed to get M-Pesa access token");
  const data = await res.json();
  return data.access_token;
}

function generatePassword(shortCode: string, passKey: string): string {
  const now = new Date();
  const ts = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}${now.getHours().toString().padStart(2, "0")}${now.getMinutes().toString().padStart(2, "0")}${now.getSeconds().toString().padStart(2, "0")}`;
  return Buffer.from(`${shortCode}${passKey}${ts}`).toString("base64");
}

function generateTimestamp(): string {
  const now = new Date();
  return `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}${now.getHours().toString().padStart(2, "0")}${now.getMinutes().toString().padStart(2, "0")}${now.getSeconds().toString().padStart(2, "0")}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      portfolioId,
      phoneNumber,
      assetType,     // STOCK | BOND | CRYPTO
      assetSymbol,
      quantity,
      totalKes,      // Amount to spend in KES
    } = body;

    if (!portfolioId || !phoneNumber || !assetType || !assetSymbol) {
      return NextResponse.json(
        { error: "Missing required fields: portfolioId, phoneNumber, assetType, assetSymbol" },
        { status: 400 }
      );
    }

    // Validate phone number
    const cleaned = phoneNumber.replace(/\D/g, "");
    let formattedPhone: string;
    if (cleaned.startsWith("254")) formattedPhone = cleaned;
    else if (cleaned.startsWith("0")) formattedPhone = `254${cleaned.slice(1)}`;
    else if (cleaned.length === 9) formattedPhone = `254${cleaned}`;
    else {
      return NextResponse.json(
        { error: "Invalid phone number. Use 07XX XXX XXX" },
        { status: 400 }
      );
    }

    // Get portfolio
    const [portfolio] = await db
      .select()
      .from(portfolios)
      .where(eq(portfolios.id, portfolioId))
      .limit(1);
    if (!portfolio) {
      return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
    }

    // Determine price and total
    let priceKes = 0;
    let assetName = "";

    if (assetType === "STOCK") {
      const [asset] = await db
        .select()
        .from(stocks)
        .where(eq(stocks.symbol, assetSymbol.toUpperCase()))
        .limit(1);
      if (!asset) return NextResponse.json({ error: "Stock not found" }, { status: 404 });
      priceKes = asset.lastPrice;
      assetName = asset.name;
    } else if (assetType === "BOND") {
      const [asset] = await db
        .select()
        .from(bonds)
        .where(eq(bonds.symbol, assetSymbol))
        .limit(1);
      if (!asset) return NextResponse.json({ error: "Bond not found" }, { status: 404 });
      priceKes = asset.dirtyPrice;
      assetName = asset.name;
    } else if (assetType === "CRYPTO") {
      const [asset] = await db
        .select()
        .from(cryptoAssets)
        .where(eq(cryptoAssets.symbol, assetSymbol.toUpperCase()))
        .limit(1);
      if (!asset) return NextResponse.json({ error: "Crypto asset not found" }, { status: 404 });
      priceKes = asset.lastPriceKes;
      assetName = asset.name;
    } else {
      return NextResponse.json({ error: "Invalid asset type. Use STOCK, BOND, or CRYPTO" }, { status: 400 });
    }

    // Calculate quantity if totalKes provided, or total if quantity provided
    let finalQuantity: number;
    let finalTotalKes: number;

    if (totalKes && totalKes > 0) {
      finalTotalKes = Math.round(totalKes);
      finalQuantity = finalTotalKes / priceKes;
    } else if (quantity && quantity > 0) {
      finalQuantity = quantity;
      finalTotalKes = Math.round(finalQuantity * priceKes);
    } else {
      return NextResponse.json(
        { error: "Provide either quantity or totalKes" },
        { status: 400 }
      );
    }

    if (finalTotalKes < 10) {
      return NextResponse.json(
        { error: "Minimum trade: KES 10" },
        { status: 400 }
      );
    }

    // Round quantity appropriately
    if (assetType === "CRYPTO") {
      finalQuantity = Math.round(finalQuantity * 1000000) / 1000000;
    } else if (assetType === "BOND") {
      finalQuantity = Math.round(finalQuantity * 100) / 100;
    } else {
      finalQuantity = Math.floor(finalQuantity); // Stocks must be whole
    }

    if (finalQuantity <= 0) {
      return NextResponse.json(
        { error: `Amount too small to buy even 1 unit of ${assetSymbol} at KES ${priceKes.toFixed(2)}` },
        { status: 400 }
      );
    }

    // Save pending M-Pesa transaction
    const [mpesaTxn] = await db
      .insert(mpesaTransactions)
      .values({
        portfolioId,
        phoneNumber: formattedPhone,
        amount: finalTotalKes,
        type: `BUY_${assetType}` as any,
        assetType,
        assetSymbol,
        quantity: finalQuantity,
        price: priceKes,
        status: "PENDING",
      })
      .returning();

    // If no M-Pesa credentials, simulate
    if (!MPESA_CONSUMER_KEY || !MPESA_CONSUMER_SECRET || !MPESA_PASSKEY || !MPESA_SHORTCODE) {
      const simulatedCheckoutRequestId = `ws_CO_DM_${Date.now()}_TRADE`;
      const simulatedMerchantRequestId = `TRADE_${Date.now()}`;

      await db
        .update(mpesaTransactions)
        .set({
          merchantRequestId: simulatedMerchantRequestId,
          checkoutRequestId: simulatedCheckoutRequestId,
        })
        .where(eq(mpesaTransactions.id, mpesaTxn.id));

      // Auto-complete after 3 seconds
      setTimeout(async () => {
        try {
          await executeTrade(mpesaTxn.id, simulatedCheckoutRequestId, "SIM" + Date.now());
        } catch (e) {
          console.error("Simulated trade completion error:", e);
        }
      }, 3000);

      return NextResponse.json({
        data: {
          merchantRequestId: simulatedMerchantRequestId,
          checkoutRequestId: simulatedCheckoutRequestId,
          responseCode: "0",
          responseDescription: "SIMULATED: STK Push sent. Enter PIN to buy " + assetSymbol,
          customerMessage: `SIMULATED: Check your phone. You're buying ${finalQuantity.toFixed(assetType === "CRYPTO" ? 6 : assetType === "BOND" ? 2 : 0)} ${assetSymbol} for KES ${finalTotalKes.toLocaleString()}`,
          mpesaTxnId: mpesaTxn.id,
          trade: {
            assetType,
            assetSymbol,
            assetName,
            quantity: finalQuantity,
            pricePerUnit: priceKes,
            totalKes: finalTotalKes,
          },
        },
      });
    }

    // Real M-Pesa STK Push
    const accessToken = await getAccessToken();
    const timestamp = generateTimestamp();
    const password = generatePassword(MPESA_SHORTCODE, MPESA_PASSKEY);
    const callbackUrl = `${req.nextUrl.origin}/api/mpesa/callback`;

    const stkResponse = await fetch(
      `${BASE_URL}/mpesa/stkpush/v1/processrequest`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          BusinessShortCode: MPESA_SHORTCODE,
          Password: password,
          Timestamp: timestamp,
          TransactionType: "CustomerBuyGoodsOnline",
          Amount: finalTotalKes,
          PartyA: formattedPhone,
          PartyB: MPESA_SHORTCODE,
          PhoneNumber: formattedPhone,
          CallBackURL: callbackUrl,
          AccountReference: `SOKO-${assetSymbol}`,
          TransactionDesc: `Buy ${assetSymbol} via Soko Terminal`,
        }),
      }
    );

    const stkData = await stkResponse.json();

    if (stkData.ResponseCode === "0") {
      await db
        .update(mpesaTransactions)
        .set({
          merchantRequestId: stkData.MerchantRequestID,
          checkoutRequestId: stkData.CheckoutRequestID,
        })
        .where(eq(mpesaTransactions.id, mpesaTxn.id));

      return NextResponse.json({
        data: {
          ...stkData,
          mpesaTxnId: mpesaTxn.id,
          trade: {
            assetType,
            assetSymbol,
            assetName,
            quantity: finalQuantity,
            pricePerUnit: priceKes,
            totalKes: finalTotalKes,
          },
        },
      });
    } else {
      await db
        .update(mpesaTransactions)
        .set({
          status: "FAILED",
          resultDesc: stkData.ResponseDescription ?? "STK Push failed",
        })
        .where(eq(mpesaTransactions.id, mpesaTxn.id));

      return NextResponse.json(
        { error: stkData.ResponseDescription ?? "STK Push failed" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("M-Pesa trade error:", error);
    return NextResponse.json(
      { error: error.message ?? "Failed to process M-Pesa trade" },
      { status: 500 }
    );
  }
}

// Execute the actual trade (called from callback or simulation)
export async function executeTrade(mpesaTxnId: number, checkoutRequestId: string, receiptNumber: string) {
  const [mpesaTxn] = await db
    .select()
    .from(mpesaTransactions)
    .where(eq(mpesaTransactions.id, mpesaTxnId))
    .limit(1);

  if (!mpesaTxn || mpesaTxn.status === "COMPLETED") return;

  const { portfolioId, assetType, assetSymbol, quantity, price, amount } = mpesaTxn;
  if (!assetType || !assetSymbol || !quantity || !price) return;

  // Mark M-Pesa as completed
  await db
    .update(mpesaTransactions)
    .set({
      status: "COMPLETED",
      resultCode: 0,
      resultDesc: "Success. SIMULATED",
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
