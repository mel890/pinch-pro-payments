import { createFileRoute } from "@tanstack/react-router";

/**
 * Pinch webhook receiver.
 * In production, verify the signature header before trusting the payload.
 * For the hackathon demo, we accept the event and flip the matching
 * payments_log row to "paid".
 */
export const Route = createFileRoute("/api/public/pinch-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.text();
        let event: any = null;
        try {
          event = body ? JSON.parse(body) : null;
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        // Common Pinch fields: event.type, event.data.id, event.data.status
        const paymentId =
          event?.data?.id ?? event?.data?.payment_request_id ?? event?.id;
        const status = event?.data?.status ?? event?.type ?? "paid";

        if (!paymentId) {
          return Response.json({ ok: false, reason: "no payment id" }, { status: 200 });
        }

        const { getSupabaseAdmin } = await import("@/lib/supabase.server");
        const sb = getSupabaseAdmin();
        const nextStatus = String(status).toLowerCase().includes("succe")
          ? "paid"
          : String(status).toLowerCase();

        const { error } = await sb
          .from("payments_log")
          .update({ status: nextStatus })
          .eq("pinch_payment_id", paymentId);

        if (error) {
          console.error("pinch-webhook update failed:", error.message);
          return Response.json({ ok: false, error: error.message }, { status: 200 });
        }

        return Response.json({ ok: true });
      },
    },
  },
});
