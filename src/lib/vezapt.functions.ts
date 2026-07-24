import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const DEMO_CLUB_ID = "00000000-0000-0000-0000-000000000001";

const SEED_PACKS = [
  {
    name: "6 Week Transformation",
    sessions: 18,
    price_cents: 89700,
    memberName: "Test Member Alex",
    trainerName: "Test PT Sarah",
  },
  {
    name: "10 Session Starter",
    sessions: 10,
    price_cents: 49700,
    memberName: "Test Member Jordan",
    trainerName: "Test PT James",
  },
  {
    name: "12 Week Elite",
    sessions: 36,
    price_cents: 149700,
    memberName: "Test Member Casey",
    trainerName: "Test PT Sarah",
  },
];

/** Seed the three demo PT packs. Idempotent-ish: skips packs whose name already exists. */
export const seedDemoPacks = createServerFn({ method: "POST" }).handler(async () => {
  const { getSupabaseAdmin } = await import("./supabase.server");
  const sb = getSupabaseAdmin();

  const [{ data: members }, { data: trainers }, { data: existing }] = await Promise.all([
    sb.from("members").select("*"),
    sb.from("trainers").select("*"),
    sb.from("pt_packs").select("*"),
  ]);
  const findByName = (rows: any[] | null, name: string) =>
    (rows ?? []).find((r) =>
      [r.name, r.full_name, r.display_name]
        .filter(Boolean)
        .some((n: string) => n.toLowerCase() === name.toLowerCase()),
    );
  const existingNames = new Set(
    (existing ?? []).map((r: any) => String(r.name ?? r.title ?? "").toLowerCase()),
  );

  const results: Array<{ name: string; status: string; detail?: string }> = [];

  for (const p of SEED_PACKS) {
    if (existingNames.has(p.name.toLowerCase())) {
      results.push({ name: p.name, status: "skipped (exists)" });
      continue;
    }
    const member = findByName(members, p.memberName);
    const trainer = findByName(trainers, p.trainerName);

    // Try progressively simpler column shapes until one is accepted.
    const attempts: Array<Record<string, any>> = [
      {
        club_id: DEMO_CLUB_ID,
        trainer_id: trainer?.id ?? null,
        member_id: member?.id ?? null,
        name: p.name,
        sessions: p.sessions,
        sessions_included: p.sessions,
        price_cents: p.price_cents,
      },
      {
        club_id: DEMO_CLUB_ID,
        trainer_id: trainer?.id ?? null,
        member_id: member?.id ?? null,
        name: p.name,
        sessions: p.sessions,
        price_cents: p.price_cents,
      },
      {
        club_id: DEMO_CLUB_ID,
        trainer_id: trainer?.id ?? null,
        name: p.name,
        sessions: p.sessions,
        price_cents: p.price_cents,
      },
      {
        club_id: DEMO_CLUB_ID,
        name: p.name,
        sessions: p.sessions,
        price_cents: p.price_cents,
      },
      {
        club_id: DEMO_CLUB_ID,
        name: p.name,
        session_count: p.sessions,
        price_cents: p.price_cents,
      },
      {
        club_id: DEMO_CLUB_ID,
        name: p.name,
        num_sessions: p.sessions,
        amount_cents: p.price_cents,
      },
    ];

    let inserted = false;
    let lastErr = "";
    for (const row of attempts) {
      const { error } = await sb.from("pt_packs").insert(row);
      if (!error) {
        inserted = true;
        break;
      }
      lastErr = error.message;
    }
    results.push({
      name: p.name,
      status: inserted ? "inserted" : "failed",
      detail: inserted ? undefined : lastErr,
    });
  }

  return { results };
});

/** Load everything the demo page needs in one call. */
export const getDemo = createServerFn({ method: "GET" }).handler(async () => {
  const { getSupabaseAdmin } = await import("./supabase.server");
  const sb = getSupabaseAdmin();

  const tables = [
    "clubs",
    "trainers",
    "members",
    "split_tiers",
    "pt_packs",
    "sessions",
    "payments_log",
  ] as const;

  const out: Record<string, { rows: any[]; error: string | null }> = {};
  await Promise.all(
    tables.map(async (t) => {
      const { data, error } = await sb
        .from(t)
        .select("*")
        .order("id", { ascending: true })
        .limit(50);
      out[t] = { rows: data ?? [], error: error?.message ?? null };
    }),
  );
  return out;
});

const CheckoutSchema = z.object({
  memberId: z.union([z.string(), z.number()]),
  packId: z.union([z.string(), z.number()]),
});

/** Create a Pinch payment request and insert a payments_log row (pending). */
export const createCheckout = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => CheckoutSchema.parse(d))
  .handler(async ({ data }) => {
    const { getSupabaseAdmin } = await import("./supabase.server");
    const { createPaymentRequest } = await import("./pinch.server");
    const sb = getSupabaseAdmin();

    const [{ data: member, error: memErr }, { data: pack, error: packErr }] =
      await Promise.all([
        sb.from("members").select("*").eq("id", data.memberId).maybeSingle(),
        sb.from("pt_packs").select("*").eq("id", data.packId).maybeSingle(),
      ]);
    if (memErr) throw new Error(`members: ${memErr.message}`);
    if (packErr) throw new Error(`pt_packs: ${packErr.message}`);
    if (!member) throw new Error("Member not found");
    if (!pack) throw new Error("Pack not found");

    const amountCents: number =
      pack.price_cents ?? pack.amount_cents ?? pack.price ?? 0;
    if (!amountCents)
      throw new Error("Pack has no price_cents/amount_cents/price column");

    const packName: string = pack.name ?? pack.title ?? `Pack ${pack.id}`;
    const memberName: string =
      member.name ?? member.full_name ?? member.email ?? `Member ${member.id}`;
    const memberEmail: string | undefined = member.email;

    // Attempt real Pinch call; fall back to a stub if the sandbox rejects the shape.
    let pinch: any;
    let pinchError: string | null = null;
    try {
      pinch = await createPaymentRequest({
        amountCents,
        description: `VezaPT Pay — ${packName}`,
        reference: `pack-${pack.id}-member-${member.id}-${Date.now()}`,
        payerEmail: memberEmail,
        payerName: memberName,
      });
    } catch (e) {
      pinchError = e instanceof Error ? e.message : String(e);
      pinch = {
        id: `sandbox_${Date.now()}`,
        hosted_payment_url: null,
        status: "pending",
      };
    }

    // Try inserting payments_log with flexible columns.
    const baseRow: Record<string, any> = {
      member_id: member.id,
      pack_id: pack.id,
      amount_cents: amountCents,
      status: "pending",
      pinch_payment_id: pinch.id,
      pinch_hosted_url: pinch.hosted_payment_url ?? null,
    };

    let inserted: any = null;
    let insertError: string | null = null;
    // Try with all fields, then progressively drop unknown columns.
    const attempts: Array<Record<string, any>> = [
      baseRow,
      { member_id: baseRow.member_id, pack_id: baseRow.pack_id, amount_cents: baseRow.amount_cents, status: "pending", pinch_payment_id: baseRow.pinch_payment_id },
      { member_id: baseRow.member_id, pack_id: baseRow.pack_id, amount_cents: baseRow.amount_cents, status: "pending" },
      { member_id: baseRow.member_id, pack_id: baseRow.pack_id, amount_cents: baseRow.amount_cents },
    ];
    for (const row of attempts) {
      const { data: ins, error } = await sb
        .from("payments_log")
        .insert(row)
        .select()
        .maybeSingle();
      if (!error) {
        inserted = ins;
        insertError = null;
        break;
      }
      insertError = error.message;
    }

    return {
      payment: inserted,
      pinch,
      pinchError,
      insertError,
    };
  });

const PaidSchema = z.object({
  paymentLogId: z.union([z.string(), z.number()]),
});

/** Simulate the Pinch webhook succeeding. */
export const markPaid = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => PaidSchema.parse(d))
  .handler(async ({ data }) => {
    const { getSupabaseAdmin } = await import("./supabase.server");
    const sb = getSupabaseAdmin();
    const { data: row, error } = await sb
      .from("payments_log")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", data.paymentLogId)
      .select()
      .maybeSingle();
    if (error) {
      // Retry without paid_at if column doesn't exist.
      const { data: row2, error: err2 } = await sb
        .from("payments_log")
        .update({ status: "paid" })
        .eq("id", data.paymentLogId)
        .select()
        .maybeSingle();
      if (err2) throw new Error(err2.message);
      return { payment: row2 };
    }
    return { payment: row };
  });

const LogSessionSchema = z.object({
  trainerId: z.union([z.string(), z.number()]),
  memberId: z.union([z.string(), z.number()]),
  packId: z.union([z.string(), z.number()]).optional(),
});

/** Insert a session row. */
export const logSession = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => LogSessionSchema.parse(d))
  .handler(async ({ data }) => {
    const { getSupabaseAdmin } = await import("./supabase.server");
    const sb = getSupabaseAdmin();

    const now = new Date().toISOString();
    const attempts: Array<Record<string, any>> = [
      { trainer_id: data.trainerId, member_id: data.memberId, pack_id: data.packId ?? null, occurred_at: now },
      { trainer_id: data.trainerId, member_id: data.memberId, occurred_at: now },
      { trainer_id: data.trainerId, member_id: data.memberId, session_date: now },
      { trainer_id: data.trainerId, member_id: data.memberId },
    ];
    let inserted: any = null;
    let lastError: string | null = null;
    for (const row of attempts) {
      const { data: ins, error } = await sb
        .from("sessions")
        .insert(row)
        .select()
        .maybeSingle();
      if (!error) {
        inserted = ins;
        lastError = null;
        break;
      }
      lastError = error.message;
    }
    if (!inserted) throw new Error(lastError ?? "Failed to insert session");
    return { session: inserted };
  });

const SplitSchema = z.object({
  trainerId: z.union([z.string(), z.number()]),
});

/**
 * Compute the trainer's current split.
 * Rule: count trainer's sessions this month, find the matching split_tier
 * where sessions >= min_sessions (and <= max_sessions if set), return trainer %.
 */
export const computeSplit = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => SplitSchema.parse(d))
  .handler(async ({ data }) => {
    const { getSupabaseAdmin } = await import("./supabase.server");
    const sb = getSupabaseAdmin();

    const startOfMonth = new Date();
    startOfMonth.setUTCDate(1);
    startOfMonth.setUTCHours(0, 0, 0, 0);

    // Try occurred_at, fall back to created_at.
    let sessionsCount = 0;
    {
      const { count, error } = await sb
        .from("sessions")
        .select("*", { count: "exact", head: true })
        .eq("trainer_id", data.trainerId)
        .gte("occurred_at", startOfMonth.toISOString());
      if (error) {
        const { count: c2 } = await sb
          .from("sessions")
          .select("*", { count: "exact", head: true })
          .eq("trainer_id", data.trainerId);
        sessionsCount = c2 ?? 0;
      } else {
        sessionsCount = count ?? 0;
      }
    }

    // Find trainer's club to filter tiers.
    const { data: trainer } = await sb
      .from("trainers")
      .select("*")
      .eq("id", data.trainerId)
      .maybeSingle();

    let tiersQuery = sb.from("split_tiers").select("*");
    if (trainer?.club_id) tiersQuery = tiersQuery.eq("club_id", trainer.club_id);
    const { data: tiers } = await tiersQuery;

    const sorted = (tiers ?? []).slice().sort((a, b) => {
      const am = a.min_sessions ?? a.threshold ?? 0;
      const bm = b.min_sessions ?? b.threshold ?? 0;
      return am - bm;
    });

    const matched = sorted
      .filter((t) => {
        const min = t.min_sessions ?? t.threshold ?? 0;
        const max = t.max_sessions ?? null;
        if (sessionsCount < min) return false;
        if (max != null && sessionsCount > max) return false;
        return true;
      })
      .pop();

    const trainerPct =
      matched?.trainer_pct ??
      matched?.trainer_percentage ??
      matched?.split_pct ??
      null;

    return {
      trainer,
      sessionsCount,
      matchedTier: matched ?? null,
      trainerPct,
      allTiers: sorted,
    };
  });
