import { NextResponse } from "next/server";
import { db } from "@/db";
import { indices } from "@/db/schema";

export async function GET() {
  try {
    const data = await db.select().from(indices);
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch indices" },
      { status: 500 }
    );
  }
}
