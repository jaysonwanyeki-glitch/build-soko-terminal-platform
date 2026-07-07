import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { mpesaTransactions, portfolios, transactions } from "@/db/schema";
import { eq } from "drizzle-orm";

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
  const timestamp = generateTimestamp();
  return Buffer.from(`${shortCode}${passKey}${timestamp}`).toString("base64");
}

function generateTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear().toString();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  const hour = now.getHours().toString().padStart(2, "0");
  const min = now.getMinutes().toString().padStart(2, "0");
  const sec = now.getSeconds().toString().padStart(2, "0");
  return `${year}${month}${day}${hour}${min}${sec}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { portfolioId, phoneNumber, amount } = body;

    if (!portfolioId || !phoneNumber || !amount) {
      return NextResponse.json(
        { error: "Missing required fields: portfolioId, phoneNumber, amount" },
        { status: 400 }
      );
    }

    // Validate phone number (Kenyan format)
    const cleaned = phoneNumber.replace(/\D/g, "");
    let formattedPhone: string;
    if (cleaned.startsWith("254")) {
      formattedPhone = cleaned;
    } else if (cleaned.startsWith("0")) {
      formattedPhone = `254${cleaned.slice(1)}`;
    } else if (cleaned.length === 9) {
      formattedPhone = `254${cleaned}`;
    } else {
      return NextResponse.json(
        { error: "Invalid phone number. Use 07XX XXX XXX or 2547XX XXX XXX" },
        { status: 400 }
      );
    }

    // Check portfolio exists
    const [portfolio] = await db
      .select()
      .from(portfolios)
      .where(eq(portfolios.id, portfolioId))
      .limit(1);

    if (!portfolio) {
      return NextResponse.json(
        { error: "Portfolio not found" },
        { status: 404 }
      );
    }

    const parsedAmount = Math.round(parseFloat(amount.toString()));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount" },
        { status: 400 }
      );
    }

    // Save pending M-Pesa transaction
    const [mpesaTxn] = await db
      .insert(mpesaTransactions)
      .values({
        portfolioId,
        phoneNumber: formattedPhone,
        amount: parsedAmount,
        type: "DEPOSIT",
        status: "PENDING",
      })
      .returning();

    // If M-Pesa credentials are not configured, simulate success for demo
    if (!MPESA_CONSUMER_KEY || !MPESA_CONSUMER_SECRET || !MPESA_PASSKEY || !MPESA_SHORTCODE) {
      // Simulate M-Pesa STK push
      const simulatedCheckoutRequestId = `ws_CO_DM_${Date.now()}_SIM`;
      const simulatedMerchantRequestId = `SIM_${Date.now()}`;

      await db
        .update(mpesaTransactions)
        .set({
          merchantRequestId: simulatedMerchantRequestId,
          checkoutRequestId: simulatedCheckoutRequestId,
        })
        .where(eq(mpesaTransactions.id, mpesaTxn.id));

      // Auto-complete after 3 seconds (simulate PIN entry)
      setTimeout(async () => {
        try {
          await db
            .update(mpesaTransactions)
            .set({
              status: "COMPLETED",
              resultCode: 0,
              resultDesc: "Success. SIMULATED",
              mpesaReceiptNumber: `SIM${Date.now()}`,
              updatedAt: new Date(),
            })
            .where(eq(mpesaTransactions.id, mpesaTxn.id));

          // Credit portfolio
          await db
            .update(portfolios)
            .set({
              cashBalance: portfolio.cashBalance + parsedAmount,
              totalCurrentValue: portfolio.totalCurrentValue + parsedAmount,
            })
            .where(eq(portfolios.id, portfolioId));

          // Record transaction
          await db.insert(transactions).values({
            portfolioId,
            type: "DEPOSIT",
            totalAmount: parsedAmount,
            fees: 0,
            notes: `M-Pesa deposit: ${formattedPhone} (Ref: ${simulatedCheckoutRequestId})`,
            executedAt: new Date(),
          });
        } catch {}
      }, 3000);

      return NextResponse.json({
        data: {
          merchantRequestId: simulatedMerchantRequestId,
          checkoutRequestId: simulatedCheckoutRequestId,
          responseCode: "0",
          responseDescription: "Success. Request accepted for processing (SIMULATED - Add M-Pesa credentials for live)",
          customerMessage: "SIMULATED: Check your phone for STK push",
          mpesaTxnId: mpesaTxn.id,
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
          TransactionType: "CustomerPayBillOnline",
          Amount: parsedAmount,
          PartyA: formattedPhone,
          PartyB: MPESA_SHORTCODE,
          PhoneNumber: formattedPhone,
          CallBackURL: callbackUrl,
          AccountReference: `SOKO-${portfolioId}`,
          TransactionDesc: "Soko Terminal Deposit",
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
        {
          error: stkData.ResponseDescription ?? "STK Push failed",
          data: stkData,
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("M-Pesa STK Push error:", error);
    return NextResponse.json(
      { error: error.message ?? "Failed to initiate M-Pesa payment" },
      { status: 500 }
    );
  }
}
