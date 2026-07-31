import { createFileRoute } from "@tanstack/react-router";

/** TEMPORARY one-off: creates a Pinch plan. Delete after use. */
export const Route = createFileRoute("/api/public/tmp-create-plan")({
  server: {
    handlers: {
      POST: async () => {
        const { pinchFetch } = await import("@/lib/pinch.server");
        const body = {
          name: "Twice-Weekly Coaching",
          recurringPayment: {
            amountInCents: 18000,
            amountPercentage: null,
            description: "VezaPT ongoing coaching — 2 sessions/week",
            startDateOffset: 7,
            startDateInterval: "days",
            frequencyOffset: 7,
            frequencyInterval: "days",
            endType: "never",
            cancelPlanOnFailure: false,
          },
        };
        try {
          const result = await pinchFetch("plans", {
            method: "POST",
            body: JSON.stringify(body),
          });
          return Response.json(result, { status: 200 });
        } catch (e: any) {
          return Response.json({ error: String(e?.message ?? e) }, { status: 200 });
        }
      },
    },
  },
});
