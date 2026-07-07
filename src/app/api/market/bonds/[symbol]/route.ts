import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bonds } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    // URL-decode the symbol (e.g., FXD1%2F2016%2F010 -> FXD1/2016/010)
    const decoded = decodeURIComponent(symbol);
    const data = await db
      .select()
      .from(bonds)
      .where(eq(bonds.symbol, decoded))
      .limit(1);

    if (data.length === 0) {
      return NextResponse.json({ error: "Bond not found" }, { status: 404 });
    }

    return NextResponse.json({ data: data[0] });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch bond" },
      { status: 500 }
    );
  }
}
