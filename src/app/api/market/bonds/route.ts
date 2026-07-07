import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bonds } from "@/db/schema";
import { asc, desc, eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sort = searchParams.get("sort") ?? "yearsToMaturity";
    const order = searchParams.get("order") ?? "asc";
    const bondType = searchParams.get("bondType");
    const search = searchParams.get("search")?.toLowerCase();
    const limit = parseInt(searchParams.get("limit") ?? "100");
    const offset = parseInt(searchParams.get("offset") ?? "0");

    const orderFn = order === "desc" ? desc : asc;
    const sortCol = bonds[sort as keyof typeof bonds] ?? bonds.yearsToMaturity;

    let all;
    if (bondType) {
      all = await db
        .select()
        .from(bonds)
        .where(eq(bonds.bondType, bondType as any))
        .orderBy(orderFn(sortCol as any));
    } else {
      all = await db.select().from(bonds).orderBy(orderFn(sortCol as any));
    }

    let result = all;
    if (search) {
      result = all.filter(
        (b) =>
          b.symbol.toLowerCase().includes(search) ||
          b.name.toLowerCase().includes(search)
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
      { error: "Failed to fetch bonds" },
      { status: 500 }
    );
  }
}
