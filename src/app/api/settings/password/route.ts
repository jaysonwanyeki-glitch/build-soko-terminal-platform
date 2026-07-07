import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession, verifyPassword, hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const curPw = String(body.currentPassword || "");
  const newPw = String(body.newPassword || "");

  if (newPw.length < 6)
    return NextResponse.json({ ok: false, error: "New password must be at least 6 characters." });

  const [user] = await db.select().from(users).where(eq(users.id, session.id)).limit(1);
  if (!user) return NextResponse.json({ ok: false, error: "User not found." });

  const valid = await verifyPassword(curPw, user.passwordHash);
  if (!valid) return NextResponse.json({ ok: false, error: "Current password is incorrect." });

  const newHash = await hashPassword(newPw);
  await db.update(users).set({ passwordHash: newHash }).where(eq(users.id, session.id));

  return NextResponse.json({ ok: true });
}
