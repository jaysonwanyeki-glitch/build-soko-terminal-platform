import "server-only";
import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users, portfolios, holdings, authTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createHmac } from "crypto";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  emailConfigured,
} from "@/lib/email";
import { captureException } from "@/lib/observability";

const SESSION_COOKIE = "soko_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const SECRET = process.env.SOKO_SESSION_SECRET || "soko-dev-secret-change-in-production";

export type SessionUser = { id: number; email: string; name: string };

// signed token: base64(payload).hmac — tamper-evident, no DB session needed
function sign(payload: SessionUser): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", SECRET).update(body).digest("base64url");
  return `${body}.${sig}`;
}

function verify(token: string): SessionUser | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", SECRET).update(body).digest("base64url");
  if (sig !== expected) return null;
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString()) as SessionUser;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verify(token);
}

async function setSession(user: SessionUser) {
  const store = await cookies();
  store.set(SESSION_COOKIE, sign(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, 10);
}

export async function verifyPassword(pw: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pw, hash);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function registerUser(name: string, email: string, password: string) {
  const n = name.trim().slice(0, 80);
  const e = email.trim().toLowerCase().slice(0, 160);
  if (n.length < 2) return { ok: false, error: "Enter your name." };
  if (!EMAIL_RE.test(e)) return { ok: false, error: "Enter a valid email." };
  if (password.length < 6) return { ok: false, error: "Password must be at least 6 characters." };

  const [existing] = await db.select().from(users).where(eq(users.email, e)).limit(1);
  if (existing) return { ok: false, error: "An account with this email already exists." };

  const hash = await hashPassword(password);
  const [user] = await db
    .insert(users)
    .values({ name: n, email: e, passwordHash: hash })
    .returning();
  // auto-create the user's first portfolio
  await db.insert(portfolios).values({
    userId: user.id,
    name: "Main Portfolio",
    baseCurrency: "KES",
  });
  await setSession({ id: user.id, email: user.email, name: user.name });

  // Send verification email (console mode if SendGrid not configured)
  try {
    const token = generateToken();
    await db.insert(authTokens).values({
      userId: user.id,
      token,
      type: "verify",
      expiresAt: new Date(Date.now() + 24 * 3600_000), // 24h
    });
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    await sendVerificationEmail(e, n, `${baseUrl}/auth/verify?token=${token}`);
  } catch (err) {
    captureException(err, { context: "send-verification" });
    // non-blocking — user can still log in
  }

  return { ok: true };
}

export async function loginUser(email: string, password: string) {
  const e = email.trim().toLowerCase();
  const [user] = await db.select().from(users).where(eq(users.email, e)).limit(1);
  if (!user) return { ok: false, error: "No account found with that email." };
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return { ok: false, error: "Incorrect password." };
  await setSession({ id: user.id, email: user.email, name: user.name });
  return { ok: true };
}

// ============================================================
//  EMAIL VERIFICATION & PASSWORD RESET
// ============================================================

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

/** Verifies an email from a token link. */
export async function verifyEmailToken(token: string): Promise<{ ok: boolean; error?: string }> {
  const [row] = await db
    .select()
    .from(authTokens)
    .where(eq(authTokens.token, token))
    .limit(1);
  if (!row || row.type !== "verify") return { ok: false, error: "Invalid or expired link." };
  if (row.usedAt) return { ok: false, error: "This link has already been used." };
  if (new Date(row.expiresAt) < new Date()) return { ok: false, error: "This link has expired." };

  await db.update(users).set({ emailVerified: true }).where(eq(users.id, row.userId));
  await db.update(authTokens).set({ usedAt: new Date() }).where(eq(authTokens.id, row.id));
  return { ok: true };
}

/** Sends a password reset email. */
export async function requestPasswordReset(email: string): Promise<{ ok: boolean; error?: string }> {
  const e = email.trim().toLowerCase();
  const [user] = await db.select().from(users).where(eq(users.email, e)).limit(1);
  if (!user) {
    // Don't reveal whether the email exists (security best practice)
    return { ok: true };
  }
  const token = generateToken();
  await db.insert(authTokens).values({
    userId: user.id,
    token,
    type: "reset",
    expiresAt: new Date(Date.now() + 3600_000), // 1 hour
  });
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  try {
    await sendPasswordResetEmail(e, user.name, `${baseUrl}/auth/reset?token=${token}`);
  } catch (err) {
    captureException(err, { context: "send-reset" });
  }
  return { ok: true };
}

/** Resets a password using a valid reset token. */
export async function resetPassword(token: string, newPassword: string): Promise<{ ok: boolean; error?: string }> {
  if (newPassword.length < 6) return { ok: false, error: "Password must be at least 6 characters." };
  const [row] = await db
    .select()
    .from(authTokens)
    .where(eq(authTokens.token, token))
    .limit(1);
  if (!row || row.type !== "reset") return { ok: false, error: "Invalid or expired link." };
  if (row.usedAt) return { ok: false, error: "This reset link has already been used." };
  if (new Date(row.expiresAt) < new Date()) return { ok: false, error: "This reset link has expired." };

  const hash = await hashPassword(newPassword);
  await db.update(users).set({ passwordHash: hash }).where(eq(users.id, row.userId));
  await db.update(authTokens).set({ usedAt: new Date() }).where(eq(authTokens.id, row.id));
  return { ok: true };
}

// ============================================================
//  AUTHORIZATION — every mutating action must pass these checks
// ============================================================

/** Throws if there is no signed-in user. Returns the verified session user. */
export async function requireSession(): Promise<SessionUser> {
  const s = await getSession();
  if (!s) throw new Error("Authentication required. Please sign in.");
  return s;
}

/** Returns true only if the signed-in user owns the given portfolio. */
export async function ownsPortfolio(portfolioId: number): Promise<boolean> {
  const s = await getSession();
  if (!s) return false;
  const [pf] = await db
    .select({ userId: portfolios.userId })
    .from(portfolios)
    .where(eq(portfolios.id, portfolioId))
    .limit(1);
  return pf?.userId === s.id;
}

/** Returns true only if the signed-in user owns the holding (via its portfolio). */
export async function ownsHolding(holdingId: number): Promise<boolean> {
  const s = await getSession();
  if (!s) return false;
  const [row] = await db
    .select({ userId: portfolios.userId })
    .from(holdings)
    .innerJoin(portfolios, eq(holdings.portfolioId, portfolios.id))
    .where(eq(holdings.id, holdingId))
    .limit(1);
  return row?.userId === s.id;
}
