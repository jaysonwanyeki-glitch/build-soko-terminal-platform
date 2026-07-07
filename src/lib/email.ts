import "server-only";
// ─── Email service (SendGrid REST API with console fallback) ───────────────
// Uses SendGrid if SENDGRID_API_KEY is set, otherwise logs to console.
// In production with credentials, real emails are delivered.

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || "noreply@sokoterminal.ke";
const FROM_NAME = process.env.SENDGRID_FROM_NAME || "Soko Terminal";

export function emailConfigured(): boolean {
  return Boolean(process.env.SENDGRID_API_KEY);
}

export async function sendEmail(msg: EmailMessage): Promise<{ ok: boolean; mode: "live" | "console"; error?: string }> {
  if (!emailConfigured()) {
    // Dev mode: log to console so flows are still testable
    console.log("\n📧 ─── EMAIL (console mode) ───");
    console.log(`   To: ${msg.to}`);
    console.log(`   Subject: ${msg.subject}`);
    console.log(`   Preview: ${msg.text?.slice(0, 120) ?? msg.html.replace(/<[^>]+>/g, "").slice(0, 120)}`);
    console.log("   ─────────────────────────────\n");
    return { ok: true, mode: "console" };
  }

  try {
    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: msg.to }] }],
        from: { email: FROM_EMAIL, name: FROM_NAME },
        subject: msg.subject,
        content: [
          { type: "text/plain", value: msg.text ?? msg.html.replace(/<[^>]+>/g, "") },
          { type: "text/html", value: msg.html },
        ],
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      return { ok: false, mode: "live", error: `SendGrid ${res.status}: ${errBody.slice(0, 200)}` };
    }
    return { ok: true, mode: "live" };
  } catch (e) {
    return { ok: false, mode: "live", error: (e as Error).message };
  }
}

// ─── Templated emails ──────────────────────────────────────────────────────

const WRAPPER = (inner: string) => `
<div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:0 auto;background:#0d1220;border-radius:16px;overflow:hidden;border:1px solid #243150;">
  <div style="padding:24px 28px;background:linear-gradient(135deg,#22d39a22,#2dd4e611);">
    <span style="font-family:monospace;font-size:18px;font-weight:900;color:#eef2f9;">SOKO <span style="color:#22d39a;">Terminal</span></span>
    <div style="font-family:monospace;font-size:9px;letter-spacing:2px;color:#5d6d8a;text-transform:uppercase;margin-top:2px;">Nairobi · Kenya</div>
  </div>
  <div style="padding:28px;color:#93a3bd;font-size:14px;line-height:1.6;">${inner}</div>
  <div style="padding:16px 28px;border-top:1px solid #243150;font-family:monospace;font-size:11px;color:#5d6d8a;">
    Soko Terminal · Kenyan Markets · Not investment advice
  </div>
</div>`;

export async function sendVerificationEmail(to: string, name: string, verifyUrl: string) {
  return sendEmail({
    to,
    subject: "Verify your Soko Terminal account",
    html: WRAPPER(`
      <h2 style="color:#eef2f9;margin:0 0 8px;">Welcome, ${name}! 🇰🇪</h2>
      <p>Please verify your email to unlock trading and your M-Pesa wallet.</p>
      <a href="${verifyUrl}" style="display:inline-block;background:#22d39a;color:#0d1220;font-weight:700;font-family:monospace;padding:12px 24px;border-radius:12px;text-decoration:none;margin:12px 0;font-size:13px;">VERIFY EMAIL →</a>
      <p style="font-size:12px;color:#5d6d8a;">Or paste this link: ${verifyUrl}</p>
    `),
    text: `Welcome ${name}! Verify your email: ${verifyUrl}`,
  });
}

export async function sendPasswordResetEmail(to: string, name: string, resetUrl: string) {
  return sendEmail({
    to,
    subject: "Reset your Soko Terminal password",
    html: WRAPPER(`
      <h2 style="color:#eef2f9;margin:0 0 8px;">Password Reset</h2>
      <p>We received a request to reset your password, ${name}.</p>
      <a href="${resetUrl}" style="display:inline-block;background:#ffb020;color:#0d1220;font-weight:700;font-family:monospace;padding:12px 24px;border-radius:12px;text-decoration:none;margin:12px 0;font-size:13px;">RESET PASSWORD →</a>
      <p style="font-size:12px;color:#5d6d8a;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
    `),
    text: `Reset your password: ${resetUrl}`,
  });
}

export async function sendAlertNotification(to: string, symbol: string, targetPrice: number, direction: string, currentPrice: number) {
  return sendEmail({
    to,
    subject: `🔔 ${symbol} alert triggered — ${direction === "up" ? "↑" : "↓"} ${targetPrice}`,
    html: WRAPPER(`
      <h2 style="color:#22d39a;margin:0 0 8px;">Price Alert Hit! 🎯</h2>
      <p style="font-size:18px;color:#eef2f9;"><strong>${symbol}</strong> has ${direction === "up" ? "risen above" : "dropped below"} your target.</p>
      <p>Target: <strong>KSh ${targetPrice}</strong> · Current: <strong style="color:#22d39a;">KSh ${currentPrice}</strong></p>
      <a href="https://sokoterminal.ke/${symbol.startsWith('FXD') ? 'bonds' : 'stocks'}/${symbol}" style="color:#22d39a;">View on Soko Terminal →</a>
    `),
    text: `${symbol} alert: target KSh ${targetPrice}, now KSh ${currentPrice}`,
  });
}
