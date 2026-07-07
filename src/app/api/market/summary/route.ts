import { NextResponse } from "next/server";
import { db } from "@/db";
import { stocks, bonds, indices } from "@/db/schema";
import { desc, asc, sql } from "drizzle-orm";

export async function GET() {
  try {
    const [allStocks, allBonds, allIndices] = await Promise.all([
      db.select().from(stocks).orderBy(desc(stocks.marketCap)),
      db.select().from(bonds).orderBy(asc(bonds.yearsToMaturity)),
      db.select().from(indices),
    ]);

    const gainers = [...allStocks]
      .filter((s) => s.changePercent > 0)
      .sort((a, b) => b.changePercent - a.changePercent)
      .slice(0, 5);

    const losers = [...allStocks]
      .filter((s) => s.changePercent < 0)
      .sort((a, b) => a.changePercent - b.changePercent)
      .slice(0, 5);

    const mostActive = [...allStocks]
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 5);

    const totalMarketCap = allStocks.reduce((sum, s) => sum + s.marketCap, 0);
    const totalVolume = allStocks.reduce((sum, s) => sum + s.volume, 0);
    const totalTurnover = allStocks.reduce((sum, s) => sum + s.turnover, 0);

    // Bond market summary
    const bondYieldAvg =
      allBonds.reduce((sum, b) => sum + b.yieldToMaturity, 0) /
      (allBonds.length || 1);
    const bondTotalOutstanding = allBonds.reduce(
      (sum, b) => sum + b.outstandingAmount,
      0
    );

    return NextResponse.json({
      data: {
        indices: allIndices,
        gainers,
        losers,
        mostActive,
        totalMarketCap,
        totalVolume,
        totalTurnover,
        stockCount: allStocks.length,
        bondCount: allBonds.length,
        bondYieldAvg: Math.round(bondYieldAvg * 100) / 100,
        bondTotalOutstanding,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch market summary" },
      { status: 500 }
    );
  }
}
