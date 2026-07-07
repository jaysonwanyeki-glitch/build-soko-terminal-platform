import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { capStr } from "@/lib/validate";
import { revalidatePath } from "next/cache";
import { createHmac } from "crypto";

export const dynamic = "force-dynamic";

const SESSION_COOKIE = "soko_session";
const SECRET = process.env.SOKO_SESSION_SECRET || "soko-dev-secret-change-in-production";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const name = capStr(body.name, 80);
  if (!name || name.length < 2)
    return NextResponse.json({ ok: false, error: "Enter a valid name." });

  await db.update(users).set({ name }).where(eq(users.id, session.id));

  // Re-sign the session cookie with the updated name so the header
  // immediately reflects the change without requiring a re-login.
  const payload = { id: session.id, email: session.email, name };
  const tokenBody = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", SECRET).update(tokenBody).digest("base64url");
  const token = `${tokenBody}.${sig}`;
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  revalidatePath("/settings");
  revalidatePath("/");

  return NextResponse.json({ ok: true });
}
