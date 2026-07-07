import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { mpesaTransactions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const portfolioId = searchParams.get("portfolioId");
    const txnId = searchParams.get("txnId");

    if (txnId) {
      const [txn] = await db
        .select()
        .from(mpesaTransactions)
        .where(eq(mpesaTransactions.id, parseInt(txnId)))
        .limit(1);

      if (!txn) {
        return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
      }

      return NextResponse.json({ data: txn });
    }

    if (portfolioId) {
      const txns = await db
        .select()
        .from(mpesaTransactions)
        .where(eq(mpesaTransactions.portfolioId, parseInt(portfolioId)))
        .orderBy(desc(mpesaTransactions.createdAt))
        .limit(20);

      return NextResponse.json({ data: txns });
    }

    const all = await db
      .select()
      .from(mpesaTransactions)
      .orderBy(desc(mpesaTransactions.createdAt))
      .limit(20);

    return NextResponse.json({ data: all });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch M-Pesa transactions" },
      { status: 500 }
    );
  }
}
