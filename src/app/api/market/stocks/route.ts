import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { stocks } from "@/db/schema";
import { asc, desc, eq, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sort = searchParams.get("sort") ?? "symbol";
    const order = searchParams.get("order") ?? "asc";
    const sector = searchParams.get("sector");
    const search = searchParams.get("search")?.toLowerCase();
    const limit = parseInt(searchParams.get("limit") ?? "100");
    const offset = parseInt(searchParams.get("offset") ?? "0");

    const orderFn = order === "desc" ? desc : asc;
    const sortCol = stocks[sort as keyof typeof stocks] ?? stocks.symbol;

    let all;
    if (sector) {
      all = await db
        .select()
        .from(stocks)
        .where(eq(stocks.sector, sector as any))
        .orderBy(orderFn(sortCol as any));
    } else {
      all = await db.select().from(stocks).orderBy(orderFn(sortCol as any));
    }

    let result = all;
    if (search) {
      result = all.filter(
        (s) =>
          s.symbol.toLowerCase().includes(search) ||
          s.name.toLowerCase().includes(search)
      );
    }

    const paginated = result.slice(offset, offset + limit);

    return NextResponse.json({
      data: paginated,
      total: result.length,
      limit,
      offset,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch stocks" },
      { status: 500 }
    );
  }
}
