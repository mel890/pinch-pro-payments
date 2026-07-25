/**
 * VezaPT Pay — live cross-screen demo server functions.
 *
 * All four role views (/pay, /trainer, /me, /dashboard) read and write the
 * same hackathon Supabase project via these server functions. The split math
 * is derived from the split_tiers table — never re-implemented in the
 * browser.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const DEMO_CLUB_ID = "00000000-0000-0000-0000-000000000001";
export const DEMO_TRAINER_SARAH = "00000000-0000-0000-0000-000000000002";
export const DEMO_MEMBER_ALEX = "00000000-0000-0000-0000-000000000004";
export const DEFAULT_DEMO_PACK_NAME = "6 Week Transformation";

export type SessionRow = {
  id: string;
  pack_id: string;
  trainer_id: string;
  member_id: string;
  club_id: string;
  status: string;
  pt_confirmed: boolean;
  member_confirmed: boolean;
  session_value_cents: number;
  pt_amount_cents: number | null;
  club_amount_cents: number | null;
  pt_split_pct_at_time: number | null;
  club_split_pct_at_time: number | null;
  session_number_in_pack: number | null;
  confirmation_token: string | null;
  created_at: string;
  session_date: string | null;
};

async function admin() {
  const { getSupabaseAdmin } = await import("./supabase.server");
  return getSupabaseAdmin();
}

/** Full snapshot for any role view. Single round-trip. */
export const getSnapshot = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await admin();
  const [
    clubs,
    trainers,
    members,
    packs,
    tiers,
    sessions,
    payments,
  ] = await Promise.all([
    sb.from("clubs").select("*"),
    sb.from("trainers").select("*").order("name"),
    sb.from("members").select("*").order("name"),
    sb.from("pt_packs").select("*").order("created_at", { ascending: false }),
    sb.from("split_tiers").select("*").order("sessions_min"),
    sb
      .from("sessions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200),
    sb
      .from("payments_log")
      .select(
        "id, pack_id, session_id, pinch_payment_id, amount_cents, pt_amount_cents, club_amount_cents, pt_split_pct, status, pinch_event_type, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  return {
    clubs: clubs.data ?? [],
    trainers: trainers.data ?? [],
    members: members.data ?? [],
    packs: packs.data ?? [],
    tiers: tiers.data ?? [],
    sessions: (sessions.data ?? []) as SessionRow[],
    payments: payments.data ?? [],
  };
});

/** Convenience: pick a tier row for a given trainer verified-session count. */
export function tierFor(
  count: number,
  tiers: Array<{
    sessions_min: number;
    sessions_max: number | null;
    pt_split_pct: number;
    club_split_pct: number;
  }>,
) {
  const sorted = [...tiers].sort((a, b) => a.sessions_min - b.sessions_min);
  let match = sorted[0];
  for (const t of sorted) {
    if (count >= t.sessions_min) match = t;
  }
  return match;
}

/* -------- Payment / purchase (sandbox simulation) -------------------- */

const PurchaseSchema = z.object({
  packId: z.string(),
  trainerId: z.string(),
  memberId: z.string().optional(),
  method: z.enum(["QR", "card", "bank"]).default("QR"),
  pinchPaymentId: z.string().optional(),
});

/**
 * Record a sandbox purchase: insert a paid payments_log row and assign the
 * first session (status='pending', not yet acknowledged). Uses the pack's
 * total_amount / sessions_total to derive per-session value.
 */
export const purchasePack = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => PurchaseSchema.parse(d))
  .handler(async ({ data }) => {
    const sb = await admin();
    const { data: pack, error: packErr } = await sb
      .from("pt_packs")
      .select("*")
      .eq("id", data.packId)
      .maybeSingle();
    if (packErr) throw new Error(packErr.message);
    if (!pack) throw new Error("Pack not found");

    const total = Number(pack.total_amount ?? 0);
    const count = Number(pack.sessions_total ?? 0) || 1;
    const perSession = Math.round(total / count);
    const pinchId =
      data.pinchPaymentId ?? `pmt_sandbox_${Date.now().toString(36)}`;

    // payments_log row — status=paid to reflect the sandbox tokenized capture
    const { data: pay } = await sb
      .from("payments_log")
      .insert({
        pack_id: pack.id,
        amount_cents: total,
        status: "paid",
        pinch_payment_id: pinchId,
        pinch_event_type: "payment.succeeded",
      })
      .select()
      .maybeSingle();

    // Create the first session for this pack, assigned to the trainer
    const { data: session } = await sb
      .from("sessions")
      .insert({
        pack_id: pack.id,
        trainer_id: data.trainerId,
        member_id: data.memberId ?? pack.member_id,
        club_id: pack.club_id,
        status: "pending",
        pt_confirmed: false,
        member_confirmed: false,
        session_value_cents: perSession,
        session_number_in_pack: 1,
        session_date: new Date().toISOString(),
      })
      .select()
      .maybeSingle();

    return { payment: pay, session, perSession, pinchId };
  });

/* -------- Trainer flow: ack → complete -------------------------------- */

const IdSchema = z.object({ sessionId: z.string() });

export const ackSession = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => IdSchema.parse(d))
  .handler(async ({ data }) => {
    const sb = await admin();
    const { data: row, error } = await sb
      .from("sessions")
      .update({ status: "acknowledged" })
      .eq("id", data.sessionId)
      .select()
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { session: row };
  });

export const completeSession = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => IdSchema.parse(d))
  .handler(async ({ data }) => {
    const sb = await admin();
    const { data: row, error } = await sb
      .from("sessions")
      .update({
        status: "completed",
        pt_confirmed: true,
        trainer_logged_at: new Date().toISOString(),
      })
      .eq("id", data.sessionId)
      .select()
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { session: row };
  });

/* -------- Client verify: applies split at current tier --------------- */

export const verifySession = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => IdSchema.parse(d))
  .handler(async ({ data }) => {
    const sb = await admin();

    const { data: session, error: sErr } = await sb
      .from("sessions")
      .select("*")
      .eq("id", data.sessionId)
      .maybeSingle();
    if (sErr) throw new Error(sErr.message);
    if (!session) throw new Error("Session not found");

    // Count already-confirmed sessions for the trainer — includes this one.
    const { count: confirmedBefore } = await sb
      .from("sessions")
      .select("*", { count: "exact", head: true })
      .eq("trainer_id", session.trainer_id)
      .eq("status", "confirmed");

    const newVerifiedCount = (confirmedBefore ?? 0) + 1;

    const { data: tiers } = await sb
      .from("split_tiers")
      .select("*")
      .order("sessions_min");

    const tier = tierFor(newVerifiedCount, tiers ?? []);
    const ptPct = Number(tier?.pt_split_pct ?? 40);
    const clubPct = Number(tier?.club_split_pct ?? 100 - ptPct);
    const value = Number(session.session_value_cents ?? 0);
    const ptCents = Math.round((value * ptPct) / 100);
    const clubCents = value - ptCents;

    // Check for tier crossing: was previous count in a lower tier?
    const prevTier = tierFor(confirmedBefore ?? 0, tiers ?? []);
    const tierUpgraded =
      !!prevTier &&
      !!tier &&
      Number(prevTier.pt_split_pct) < Number(tier.pt_split_pct);

    const { data: updated, error: uErr } = await sb
      .from("sessions")
      .update({
        member_confirmed: true,
        status: "confirmed",
        pt_split_pct_at_time: ptPct,
        club_split_pct_at_time: clubPct,
        pt_amount_cents: ptCents,
        club_amount_cents: clubCents,
        member_confirmed_at: new Date().toISOString(),
      })
      .eq("id", data.sessionId)
      .select()
      .maybeSingle();
    if (uErr) throw new Error(uErr.message);

    // Bump pack sessions_completed
    await sb
      .from("pt_packs")
      .update({
        sessions_completed: (
          await sb
            .from("sessions")
            .select("*", { count: "exact", head: true })
            .eq("pack_id", session.pack_id)
            .eq("status", "confirmed")
        ).count ?? 0,
        current_pt_split_pct: ptPct,
        current_club_split_pct: clubPct,
      })
      .eq("id", session.pack_id);

    // payments_log allocation record
    await sb.from("payments_log").insert({
      pack_id: session.pack_id,
      session_id: session.id,
      amount_cents: value,
      pt_amount_cents: ptCents,
      club_amount_cents: clubCents,
      pt_split_pct: ptPct,
      status: "allocated",
      pinch_event_type: "session_verified",
    });

    // Get trainer name for the toast
    const { data: trainer } = await sb
      .from("trainers")
      .select("name")
      .eq("id", session.trainer_id)
      .maybeSingle();

    return {
      session: updated,
      ptPct,
      clubPct,
      ptCents,
      clubCents,
      value,
      tierUpgraded,
      tierName:
        ptPct >= 60 ? "Peak" : ptPct >= 50 ? "Established" : "Starter",
      trainerName: trainer?.name ?? "your trainer",
      verifiedCount: newVerifiedCount,
    };
  });

/* -------- Extra: schedule the next session in a pack ----------------- */

const NextSchema = z.object({
  packId: z.string(),
});

export const assignNextSession = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => NextSchema.parse(d))
  .handler(async ({ data }) => {
    const sb = await admin();
    const { data: pack } = await sb
      .from("pt_packs")
      .select("*")
      .eq("id", data.packId)
      .maybeSingle();
    if (!pack) throw new Error("Pack not found");

    const { count } = await sb
      .from("sessions")
      .select("*", { count: "exact", head: true })
      .eq("pack_id", pack.id);

    const perSession = Math.round(
      Number(pack.total_amount ?? 0) / (Number(pack.sessions_total ?? 1) || 1),
    );

    const { data: session, error } = await sb
      .from("sessions")
      .insert({
        pack_id: pack.id,
        trainer_id: pack.trainer_id,
        member_id: pack.member_id,
        club_id: pack.club_id,
        status: "pending",
        pt_confirmed: false,
        member_confirmed: false,
        session_value_cents: perSession,
        session_number_in_pack: (count ?? 0) + 1,
        session_date: new Date().toISOString(),
      })
      .select()
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { session };
  });
