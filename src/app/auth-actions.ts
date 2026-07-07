"use server";

import { redirect } from "next/navigation";
import { randomBytes } from "crypto";
import {
  registerUser,
  loginUser,
  clearSession,
  requestPasswordReset,
  resetPassword,
  getSession,
} from "@/lib/auth";

export type FormResult = { ok: boolean; error?: string };

export async function signupAction(_prev: FormResult, formData: FormData): Promise<FormResult> {
  const name = String(formData.get("name") || "");
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const res = await registerUser(name, email, password);
  if (!res.ok) return res;
  redirect("/");
}

export async function loginAction(_prev: FormResult, formData: FormData): Promise<FormResult> {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const res = await loginUser(email, password);
  if (!res.ok) return res;
  redirect("/");
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}

// ─── Password reset flow ───────────────────────────────────────────────────
export async function forgotPasswordAction(_prev: FormResult, formData: FormData): Promise<FormResult> {
  const email = String(formData.get("email") || "");
  const res = await requestPasswordReset(email);
  // Always returns ok=true to avoid email enumeration
  return { ok: true };
}

export async function resetPasswordAction(_prev: FormResult, formData: FormData): Promise<FormResult> {
  const token = String(formData.get("token") || "");
  const password = String(formData.get("password") || "");
  const res = await resetPassword(token, password);
  if (!res.ok) return res;
  redirect("/login?reset=1");
}

// ─── Email verification ────────────────────────────────────────────────────
export async function resendVerificationAction(): Promise<FormResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Please sign in." };
  const { db } = await import("@/db");
  const { authTokens, users } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");
  const { sendVerificationEmail } = await import("@/lib/email");

  const [user] = await db.select().from(users).where(eq(users.id, session.id)).limit(1);
  if (!user) return { ok: false, error: "User not found." };
  if (user.emailVerified) return { ok: false, error: "Email already verified." };

  const token = randomBytes(32).toString("hex");
  await db.insert(authTokens).values({
    userId: user.id,
    token,
    type: "verify",
    expiresAt: new Date(Date.now() + 24 * 3600_000),
  });
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  await sendVerificationEmail(user.email, user.name, `${baseUrl}/auth/verify?token=${token}`);
  return { ok: true };
}
