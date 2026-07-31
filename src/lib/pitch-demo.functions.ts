import { createServerFn } from "@tanstack/react-start";

/**
 * The single real network call in the pitch demo: create the Pinch
 * subscription for "Twice-Weekly Coaching" ($180/week).
 */
export const createPitchSubscription = createServerFn({ method: "POST" }).handler(
  async () => {
    try {
      const { pinchFetch } = await import("@/lib/pinch.server");
      const result = await pinchFetch("subscriptions", {
        method: "POST",
        body: JSON.stringify({
          planId: "pln_6qdLMW91FqQbBL",
          payerId: "pyr_cD59b4ld61yQfH",
        }),
      });
      const data: any = result.data;
      return {
        ok: result.ok,
        status: result.status,
        subscriptionId: (data?.id ?? null) as string | null,
        subscriptionStatus: (data?.status ?? (result.ok ? "active" : null)) as
          | string
          | null,
        raw: result.raw?.slice(0, 2000) ?? "",
        error: result.ok ? null : `Pinch ${result.status}: ${result.raw?.slice(0, 300)}`,
      };
    } catch (e: any) {
      return {
        ok: false,
        status: 0,
        subscriptionId: null,
        subscriptionStatus: null,
        raw: "",
        error: String(e?.message ?? e),
      };
    }
  },
);
