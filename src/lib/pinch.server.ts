/**
 * Pinch Payments (Australia) sandbox client — Payment Links API.
 * Docs:
 *   - https://docs.getpinch.com.au/docs/payment-links
 *   - https://docs.getpinch.com.au/reference/create-payment-link
 *   - https://docs.getpinch.com.au/docs/application-authentication
 *
 * Auth model (current):
 *   1. POST https://auth.getpinch.com.au/connect/token
 *      grant_type=client_credentials
 *      client_id     = PINCH_CLIENT_ID   (Application Id OR Merchant Id)
 *      client_secret = PINCH_CLIENT_SECRET (Application Secret OR legacy Merchant Secret Key)
 *   2. Authorization: Bearer <access_token> for every API call.
 *      pinch-version: 2020.1 header on every API call.
 *
 * Backwards-compat env fallbacks so an existing PINCH_API_KEY still works:
 *   - PINCH_CLIENT_ID     ← PINCH_MERCHANT_ID
 *   - PINCH_CLIENT_SECRET ← PINCH_SECRET_KEY / PINCH_API_KEY
 */

const API_BASE = process.env.PINCH_API_BASE ?? "https://api.getpinch.com.au/test/";
const AUTH_BASE = process.env.PINCH_AUTH_BASE ?? "https://auth.getpinch.com.au/";

function creds(): { clientId: string; clientSecret: string } {
  const clientId = process.env.PINCH_CLIENT_ID ?? process.env.PINCH_MERCHANT_ID ?? "";
  const clientSecret =
    process.env.PINCH_CLIENT_SECRET ??
    process.env.PINCH_SECRET_KEY ??
    process.env.PINCH_API_KEY ??
    "";
  return { clientId, clientSecret };
}

/** Redact secret material for safe diagnostic logging. */
export function sanitizedAuthInfo() {
  const { clientId, clientSecret } = creds();
  return {
    apiBase: API_BASE,
    authBase: AUTH_BASE,
    hasClientId: !!clientId,
    hasClientSecret: !!clientSecret,
    clientIdPrefix: clientId ? clientId.slice(0, 8) + "…" : null,
  };
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt - 30_000 > now) return cachedToken.token;

  const { clientId, clientSecret } = creds();
  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing Pinch credentials. Set PINCH_CLIENT_ID and PINCH_CLIENT_SECRET " +
        "(Application Id/Secret from https://web.getpinch.com.au/api-keys). " +
        "Legacy PINCH_MERCHANT_ID + PINCH_API_KEY also work.",
    );
  }

  const tokenUrl = new URL("connect/token", AUTH_BASE).toString();
  const form = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });
  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  const raw = await res.text();
  if (!res.ok) {
    throw new Error(
      `Pinch OAuth token request failed (${res.status}) at ${tokenUrl}: ${raw.slice(0, 300)}`,
    );
  }
  let json: any;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error(`Pinch OAuth returned non-JSON: ${raw.slice(0, 200)}`);
  }
  const token = json?.access_token;
  const expiresIn = Number(json?.expires_in ?? 3600);
  if (!token) throw new Error("Pinch OAuth response missing access_token");
  cachedToken = { token, expiresAt: now + expiresIn * 1000 };
  return token;
}

export type PinchFetchResult = {
  ok: boolean;
  status: number;
  data: any;
  raw: string;
  url: string;
  method: string;
  sentBody?: string;
  sentContentType?: string | null;
};

export async function pinchFetch(
  path: string,
  init: RequestInit = {},
): Promise<PinchFetchResult> {
  const url = new URL(path.replace(/^\//, ""), API_BASE).toString();
  const method = (init.method ?? "GET").toUpperCase();
  const token = await getAccessToken();
  const headers = new Headers(init.headers);
  headers.set("pinch-version", "2020.1");
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const bodyStr = typeof init.body === "string" ? init.body : undefined;
  const res = await fetch(url, { ...init, headers, method });
  const raw = await res.text();
  let data: any = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = raw;
  }
  return {
    ok: res.ok,
    status: res.status,
    data,
    raw,
    url,
    method,
    sentBody: bodyStr,
    sentContentType: headers.get("Content-Type"),
  };
}

export type PinchPaymentLink = {
  id: string; // plk_XXXX
  url?: string;
  paymentUrl?: string;
  hostedUrl?: string;
  [k: string]: any;
};

/** Best-effort extraction of the hosted checkout URL across API response shapes. */
export function extractHostedUrl(link: any): string | null {
  if (!link || typeof link !== "object") return null;
  return (
    link.url ??
    link.paymentUrl ??
    link.hostedUrl ??
    link.hosted_payment_url ??
    link.data?.url ??
    link.data?.paymentUrl ??
    link.data?.hostedUrl ??
    null
  );
}

/** Best-effort extraction of the Payment Link id (plk_XXXX). */
export function extractLinkId(link: any): string | null {
  if (!link || typeof link !== "object") return null;
  return link.id ?? link.paymentLinkId ?? link.data?.id ?? null;
}

/**
 * Create a hosted Pinch Payment Link.
 * See: https://docs.getpinch.com.au/reference/create-payment-link
 */
export async function createPaymentLink(input: {
  amountCents: number;
  description: string;
  reference?: string;
  returnUrl?: string;
  payerId?: string;
  currency?: string;
  allowedPaymentMethods?: Array<"credit-card" | "bank-account">;
  metadata?: Record<string, string | number | null | undefined>;
}): Promise<PinchFetchResult> {
  // Pinch API (pinch-version: 2020.1) — camelCase fields.
  // NOTE: `metadata` MUST be a string. Sending an object silently fails .NET
  // model binding and nulls every field (Amount=0, PayerId=null, etc.).
  const body: Record<string, any> = {
    amount: input.amountCents,
    description: input.description,
    currency: input.currency ?? "AUD",
    allowedPaymentMethods:
      input.allowedPaymentMethods ?? ["credit-card", "bank-account"],
  };
  if (input.reference) body.reference = input.reference;
  if (input.returnUrl) body.returnUrl = input.returnUrl;
  if (input.payerId) body.payerId = input.payerId;
  if (input.metadata) {
    body.metadata =
      typeof input.metadata === "string"
        ? input.metadata
        : JSON.stringify(input.metadata);
  }

  return pinchFetch("payment-links", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/**
 * Create a Pinch payer.
 * See: https://docs.getpinch.com.au/reference/create-payer
 * Sandbox accepts minimal payload; returns { id: "pyr_..." }.
 */
export async function createPayer(input: {
  firstName: string;
  lastName: string;
  emailAddress: string;
  mobileNumber?: string;
}): Promise<PinchFetchResult> {
  return pinchFetch("payers", {
    method: "POST",
    body: JSON.stringify({
      firstName: input.firstName,
      lastName: input.lastName,
      emailAddress: input.emailAddress,
      ...(input.mobileNumber ? { mobileNumber: input.mobileNumber } : {}),
    }),
  });
}

export function extractPayerId(payer: any): string | null {
  if (!payer || typeof payer !== "object") return null;
  return payer.id ?? payer.payerId ?? payer.data?.id ?? null;
}
