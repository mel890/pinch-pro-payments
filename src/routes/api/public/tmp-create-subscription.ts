import { createFileRoute } from "@tanstack/react-router";

/** TEMPORARY one-off: creates a Pinch subscription. Delete after use. */
export const Route = createFileRoute("/api/public/tmp-create-subscription")({
  server: {
    handlers: {
      POST: async () => {
        const { pinchFetch } = await import("@/lib/pinch.server");
        const body = {
          planId: "pln_6qdLMW91FqQbBL",
          payerId: "pyr_cD59b4ld61yQfH",
        };
        try {
          const result = await pinchFetch("subscriptions", {
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
