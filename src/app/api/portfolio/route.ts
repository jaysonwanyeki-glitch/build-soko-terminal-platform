import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { portfolios } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const data = await db
      .select()
      .from(portfolios)
      .orderBy(desc(portfolios.updatedAt));
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch portfolios" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const [portfolio] = await db
      .insert(portfolios)
      .values({
        name: body.name ?? "New Portfolio",
        description: body.description ?? "",
        cashBalance: body.cashBalance ?? 0,
        totalInvested: 0,
        totalCurrentValue: body.cashBalance ?? 0,
        totalReturn: 0,
        totalReturnPercent: 0,
      })
      .returning();

    return NextResponse.json({ data: portfolio }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create portfolio" },
      { status: 500 }
    );
  }
}
