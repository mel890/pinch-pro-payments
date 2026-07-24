/**
 * Minimal Pinch Payments (Australia) sandbox client.
 * Docs: https://docs.getpinch.com.au/
 * All requests use the pinch-version: 2020.1 header.
 */
const BASE = process.env.PINCH_API_BASE ?? "https://api.getpinch.com.au/test/";

function authHeader(): string {
  const key = process.env.PINCH_API_KEY;
  if (!key) throw new Error("Missing PINCH_API_KEY env var");
  // Pinch uses HTTP Basic auth with the API key as username, empty password.
  const token = Buffer.from(`${key}:`).toString("base64");
  return `Basic ${token}`;
}

export async function pinchFetch(
  path: string,
  init: RequestInit = {},
): Promise<{ ok: boolean; status: number; data: any; raw: string }> {
  const url = new URL(path.replace(/^\//, ""), BASE).toString();
  const headers = new Headers(init.headers);
  headers.set("pinch-version", "2020.1");
  headers.set("Authorization", authHeader());
  headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(url, { ...init, headers });
  const raw = await res.text();
  let data: any = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = raw;
  }
  return { ok: res.ok, status: res.status, data, raw };
}

export type PinchPaymentRequest = {
  id: string;
  hosted_payment_url?: string;
  status?: string;
  amount?: number;
  [k: string]: any;
};

/** Create a hosted Pinch payment request (sandbox). */
export async function createPaymentRequest(input: {
  amountCents: number;
  description: string;
  reference?: string;
  payerEmail?: string;
  payerName?: string;
}): Promise<PinchPaymentRequest> {
  const body = {
    amount: input.amountCents,
    description: input.description,
    reference: input.reference,
    payer: input.payerEmail
      ? { email: input.payerEmail, name: input.payerName }
      : undefined,
  };
  const res = await pinchFetch("payment-requests", {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(
      `Pinch payment-request failed (${res.status}): ${res.raw.slice(0, 400)}`,
    );
  }
  return res.data as PinchPaymentRequest;
}
