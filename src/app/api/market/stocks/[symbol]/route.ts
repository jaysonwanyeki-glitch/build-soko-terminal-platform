import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { stocks } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    const data = await db
      .select()
      .from(stocks)
      .where(eq(stocks.symbol, symbol.toUpperCase()))
      .limit(1);

    if (data.length === 0) {
      return NextResponse.json({ error: "Stock not found" }, { status: 404 });
    }

    return NextResponse.json({ data: data[0] });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch stock" },
      { status: 500 }
    );
  }
}
