import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { portfolios, holdings, transactions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [portfolio] = await db
      .select()
      .from(portfolios)
      .where(eq(portfolios.id, parseInt(id)))
      .limit(1);

    if (!portfolio) {
      return NextResponse.json(
        { error: "Portfolio not found" },
        { status: 404 }
      );
    }

    const portfolioHoldings = await db
      .select()
      .from(holdings)
      .where(eq(holdings.portfolioId, parseInt(id)));

    const portfolioTransactions = await db
      .select()
      .from(transactions)
      .where(eq(transactions.portfolioId, parseInt(id)))
      .orderBy(desc(transactions.executedAt))
      .limit(50);

    return NextResponse.json({
      data: {
        ...portfolio,
        holdings: portfolioHoldings,
        transactions: portfolioTransactions,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch portfolio" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.delete(portfolios).where(eq(portfolios.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete portfolio" },
      { status: 500 }
    );
  }
}
