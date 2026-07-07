import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { cryptoAssets } from "@/db/schema";
import { asc, desc, eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sort = searchParams.get("sort") ?? "rank";
    const order = searchParams.get("order") ?? "asc";
    const category = searchParams.get("category");
    const search = searchParams.get("search")?.toLowerCase();
    const limit = parseInt(searchParams.get("limit") ?? "50");
    const offset = parseInt(searchParams.get("offset") ?? "0");

    const orderFn = order === "desc" ? desc : asc;
    const sortCol = cryptoAssets[sort as keyof typeof cryptoAssets] ?? cryptoAssets.rank;

    let all;
    if (category) {
      all = await db
        .select()
        .from(cryptoAssets)
        .where(eq(cryptoAssets.category, category as any))
        .orderBy(orderFn(sortCol as any));
    } else {
      all = await db.select().from(cryptoAssets).orderBy(orderFn(sortCol as any));
    }

    let result = all;
    if (search) {
      result = all.filter(
        (c) =>
          c.symbol.toLowerCase().includes(search) ||
          c.name.toLowerCase().includes(search)
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
      { error: "Failed to fetch crypto assets" },
      { status: 500 }
    );
  }
}
