// M-Pesa Daraja API client (Lipa Na M-Pesa Online / STK Push).
// Reads credentials from env. Falls back to a realistic simulation when
// credentials are absent, so the feature stays demonstrable in any sandbox.

const env = (process.env.MPESA_ENV || "sandbox").toLowerCase();
const BASE_URL =
  env === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";

export function mpesaConfigured(): boolean {
  return Boolean(
    process.env.MPESA_CONSUMER_KEY &&
      process.env.MPESA_CONSUMER_SECRET &&
      process.env.MPESA_SHORTCODE
  );
}

export function mpesaMode(): "live" | "simulation" {
  return mpesaConfigured() ? "live" : "simulation";
}

/** Normalise a Kenyan mobile number to 2547XXXXXXXX / 2541XXXXXXXX. */
export function normalizePhone(input: string): string | null {
  let p = (input || "").replace(/[^\d]/g, "");
  if (p.startsWith("00254")) p = "254" + p.slice(5);
  if (p.startsWith("254")) {
    // keep as-is if length ok
  } else if (p.startsWith("0")) {
    p = "254" + p.slice(1);
  } else if (p.startsWith("7") || p.startsWith("1")) {
    p = "254" + p;
  }
  if (/^254[17]\d{8}$/.test(p)) return p;
  return null;
}

export function formatPhoneK(p: string | null): string {
  if (!p) return "—";
  const tail = p.slice(-9);
  return `+254 ${tail.slice(0, 3)} ${tail.slice(3, 6)} ${tail.slice(6)}`;
}

export function mpesaTimestamp(d = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(
    d.getHours()
  )}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

export function mpesaPassword(shortcode: string, passkey: string, timestamp: string): string {
  return Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");
}

async function getAccessToken(): Promise<string> {
  const auth = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString("base64");
  const res = await fetch(
    `${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${auth}` } }
  );
  if (!res.ok) throw new Error(`Daraja OAuth failed (${res.status})`);
  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) throw new Error("Daraja returned no access token");
  return data.access_token;
}

export type StkResult = {
  ok: boolean;
  mode: "live" | "simulation";
  checkoutRequestId?: string;
  merchantRequestId?: string;
  customerMessage?: string;
  error?: string;
};

export async function initiateStkPush(params: {
  phone: string;
  amount: number;
  accountReference: string;
  callbackUrl: string;
}): Promise<StkResult> {
  const amount = Math.max(1, Math.round(params.amount));

  // ---- Simulation mode (no credentials) ----
  if (!mpesaConfigured()) {
    const id = "ws_CO_SIM_" + Date.now() + Math.floor(Math.random() * 1000);
    return {
      ok: true,
      mode: "simulation",
      checkoutRequestId: id,
      merchantRequestId: "SIM-" + Date.now(),
      customerMessage:
        "Success. Request accepted for processing (SIMULATION — approve on the simulated prompt).",
    };
  }

  // ---- Live Daraja STK Push ----
  try {
    const shortcode = process.env.MPESA_SHORTCODE!;
    const passkey = process.env.MPESA_PASSKEY || "";
    const timestamp = mpesaTimestamp();
    const password = mpesaPassword(shortcode, passkey, timestamp);
    const token = await getAccessToken();

    const body = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: process.env.MPESA_TRANSACTION_TYPE || "CustomerPayBillOnline",
      Amount: amount,
      PartyA: params.phone,
      PartyB: shortcode,
      PhoneNumber: params.phone,
      CallBackURL: params.callbackUrl,
      AccountReference: params.accountReference.slice(0, 12),
      TransactionDesc: "Soko Terminal funding",
    };

    const res = await fetch(`${BASE_URL}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as Record<string, unknown>;

    if (data.ResponseCode === "0" || data.responseCode === "0") {
      return {
        ok: true,
        mode: "live",
        checkoutRequestId: data.CheckoutRequestID as string,
        merchantRequestId: data.MerchantRequestID as string,
        customerMessage: data.CustomerMessage as string,
      };
    }
    return {
      ok: false,
      mode: "live",
      error:
        (data.errorMessage as string) ||
        (data.ResponseDescription as string) ||
        "STK push rejected by Daraja.",
    };
  } catch (e) {
    return { ok: false, mode: "live", error: (e as Error).message };
  }
}
