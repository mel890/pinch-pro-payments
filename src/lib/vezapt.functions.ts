import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const DEMO_CLUB_ID = "00000000-0000-0000-0000-000000000001";

const SEED_PACKS = [
  {
    name: "6 Week Transformation",
    sessions_total: 18,
    sessions_completed: 0,
    total_amount: 89700,
    member_id: "00000000-0000-0000-0000-000000000004",
    trainer_id: "00000000-0000-0000-0000-000000000002",
    club_id: DEMO_CLUB_ID,
    status: "active",
  },
  {
    name: "10 Session Starter",
    sessions_total: 10,
    sessions_completed: 0,
    total_amount: 49700,
    member_id: "00000000-0000-0000-0000-000000000005",
    trainer_id: "00000000-0000-0000-0000-000000000003",
    club_id: DEMO_CLUB_ID,
    status: "active",
  },
  {
    name: "12 Week Elite",
    sessions_total: 36,
    sessions_completed: 0,
    total_amount: 149700,
    member_id: "00000000-0000-0000-0000-000000000006",
    trainer_id: "00000000-0000-0000-0000-000000000002",
    club_id: DEMO_CLUB_ID,
    status: "active",
  },
];


/** Seed the three demo PT packs. Idempotent: skips packs whose name already exists. */
export const seedDemoPacks = createServerFn({ method: "POST" }).handler(async () => {
  const { getSupabaseAdmin } = await import("./supabase.server");
  const sb = getSupabaseAdmin();

  const { data: existing } = await sb.from("pt_packs").select("name");
  const existingNames = new Set(
    (existing ?? []).map((r: any) => String(r.name ?? "").toLowerCase()),
  );

  const results: Array<{ name: string; status: string; detail?: string }> = [];
  for (const p of SEED_PACKS) {
    if (existingNames.has(p.name.toLowerCase())) {
      results.push({ name: p.name, status: "skipped (exists)" });
      continue;
    }
    const { error } = await sb.from("pt_packs").insert(p);
    results.push({
      name: p.name,
      status: error ? "failed" : "inserted",
      detail: error?.message,
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
  ] as const;

  const PAYMENTS_LOG_COLS =
    "id, pack_id, session_id, pinch_payment_id, amount_cents, pt_amount_cents, club_amount_cents, pt_split_pct, status, pinch_event_type, created_at";

  const out: Record<string, { rows: any[]; error: string | null }> = {};
  await Promise.all([
    ...tables.map(async (t) => {
      const { data, error } = await sb
        .from(t)
        .select("*")
        .order("id", { ascending: true })
        .limit(50);
      out[t] = { rows: data ?? [], error: error?.message ?? null };
    }),
    (async () => {
      const { data, error } = await sb
        .from("payments_log")
        .select(PAYMENTS_LOG_COLS)
        .order("created_at", { ascending: false })
        .limit(50);
      out["payments_log"] = { rows: data ?? [], error: error?.message ?? null };
    })(),
  ]);
  return out;
});

/** Returns the Supabase URL + publishable (anon) key for the browser to call edge functions. */
export const getSupabaseConfig = createServerFn({ method: "GET" }).handler(async () => {
  return {
    url: process.env.VEZAPT_SUPABASE_URL ?? "",
    anonKey: process.env.VEZAPT_SUPABASE_PUBLISHABLE_KEY ?? "",
  };
});

/** Reports presence flags for Pinch env vars (never values). */
export const pinchEnvCheck = createServerFn({ method: "GET" }).handler(async () => {
  return {
    runtime: "TanStack Start server function (Cloudflare Worker)",
    environment: process.env.NODE_ENV ?? "unknown",
    PINCH_CLIENT_ID_present: !!process.env.PINCH_CLIENT_ID,
    PINCH_CLIENT_SECRET_present: !!process.env.PINCH_CLIENT_SECRET,
    PINCH_API_BASE_URL_present: !!process.env.PINCH_API_BASE_URL,
    PINCH_API_BASE_present: !!process.env.PINCH_API_BASE,
    PINCH_MERCHANT_ID_present: !!process.env.PINCH_MERCHANT_ID,
    PINCH_SECRET_KEY_present: !!process.env.PINCH_SECRET_KEY,
    PINCH_API_KEY_present: !!process.env.PINCH_API_KEY,
    resolvedClientIdPresent: !!(
      process.env.PINCH_CLIENT_ID ?? process.env.PINCH_MERCHANT_ID
    ),
    resolvedClientSecretPresent: !!(
      process.env.PINCH_CLIENT_SECRET ??
      process.env.PINCH_SECRET_KEY ??
      process.env.PINCH_API_KEY
    ),
  };
});



const CheckoutSchema = z.object({
  memberId: z.union([z.string(), z.number()]),
  packId: z.union([z.string(), z.number()]),
});

/** Create a Pinch hosted Payment Link and insert a payments_log row (pending). */
export const createCheckout = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => CheckoutSchema.parse(d))
  .handler(async ({ data }) => {
    const { getSupabaseAdmin } = await import("./supabase.server");
    const {
      createPaymentLink,
      createPayer,
      extractPayerId,
      extractHostedUrl,
      extractLinkId,
      sanitizedAuthInfo,
    } = await import("./pinch.server");
    const { getRequest } = await import("@tanstack/react-start/server");
    const sb = getSupabaseAdmin();

    const hasClientId = !!(process.env.PINCH_CLIENT_ID ?? process.env.PINCH_MERCHANT_ID);
    const hasClientSecret = !!(
      process.env.PINCH_CLIENT_SECRET ??
      process.env.PINCH_SECRET_KEY ??
      process.env.PINCH_API_KEY
    );
    if (!hasClientId || !hasClientSecret) {
      throw new Error(
        `Pinch credentials missing on server (PINCH_CLIENT_ID present: ${hasClientId}, PINCH_CLIENT_SECRET present: ${hasClientSecret}). Add them in Lovable Cloud project secrets and republish.`,
      );
    }

    const [{ data: member, error: memErr }, { data: pack, error: packErr }] =
      await Promise.all([
        sb.from("members").select("*").eq("id", data.memberId).maybeSingle(),
        sb.from("pt_packs").select("*").eq("id", data.packId).maybeSingle(),
      ]);
    if (memErr) throw new Error(`members: ${memErr.message}`);
    if (packErr) throw new Error(`pt_packs: ${packErr.message}`);
    if (!member) throw new Error("Member not found");
    if (!pack) throw new Error("Pack not found");

    let club: any = null;
    if (pack.club_id) {
      const { data: c } = await sb
        .from("clubs")
        .select("*")
        .eq("id", pack.club_id)
        .maybeSingle();
      club = c;
    }

    // Amount resolution — walk every plausible column, coerce to integer cents.
    const amountCandidates = {
      total_amount: pack.total_amount,
      price_cents: pack.price_cents,
      amount_cents: pack.amount_cents,
      price: pack.price,
      total_amount_cents: pack.total_amount_cents,
    };
    let amountCents = 0;
    for (const v of Object.values(amountCandidates)) {
      const n = Number(v);
      if (Number.isFinite(n) && n > 0) {
        amountCents = Math.round(n);
        break;
      }
    }
    if (amountCents < 100) {
      throw new Error(
        `Pack ${pack.id} has no valid price (need >= 100 cents). Columns seen: ${JSON.stringify(amountCandidates)}`,
      );
    }

    const packName: string = pack.name ?? pack.title ?? `Pack ${pack.id}`;

    // Build absolute returnUrl from the current request origin.
    let origin = "";
    try {
      const req = getRequest();
      origin = new URL(req.url).origin;
    } catch {
      /* getRequest unavailable outside a request */
    }
    const returnUrl = origin ? `${origin}/?pinch_return=1` : undefined;

    // --- 1) Create (or reuse) a Pinch payer for this member --------------
    const memberEmail: string =
      member.email ??
      member.email_address ??
      `demo+${member.id}@vezapt.test`;
    const memberFullName: string =
      member.name ?? member.full_name ?? `Member ${member.id}`;
    const [firstName, ...rest] = memberFullName.trim().split(/\s+/);
    const lastName = rest.join(" ") || "Demo";

    // Fixed sandbox payer supplied by the demo owner. Used unless the member
    // row already has its own cached pinch_payer_id.
    const DEMO_PAYER_ID = "pyr_cD59b4ld61yQfH";

    let payerId: string | null = member.pinch_payer_id ?? DEMO_PAYER_ID;
    let payerError: string | null = null;
    let payerStatus: number | null = null;
    let payerBodyPreview: string | null = null;
    let payerSource: "member_row" | "demo_default" | "created" =
      member.pinch_payer_id ? "member_row" : "demo_default";

    // Only create a new payer if we somehow don't have one (defensive; won't
    // happen while DEMO_PAYER_ID is set).
    if (!payerId) {
      const payerRes = await createPayer({
        firstName: firstName || "Demo",
        lastName,
        emailAddress: memberEmail,
      });
      payerStatus = payerRes.status;
      payerBodyPreview = payerRes.raw.slice(0, 400);
      if (payerRes.ok) {
        payerId = extractPayerId(payerRes.data);
        payerSource = "created";
        if (payerId) {
          await sb
            .from("members")
            .update({ pinch_payer_id: payerId })
            .eq("id", member.id);
        }
      } else {
        payerError = `Pinch payer create → ${payerRes.status}: ${payerRes.raw.slice(0, 300)}`;
      }
    }

    // Diagnostics (safe — never includes tokens or PII payment data).
    const authInfo = sanitizedAuthInfo();
    const diagnostics: Record<string, any> = {
      pinchApiBase: authInfo.apiBase,
      authBase: authInfo.authBase,
      hasClientId: authInfo.hasClientId,
      hasClientSecret: authInfo.hasClientSecret,
      clientIdPrefix: authInfo.clientIdPrefix,
      payerIdSupplied: !!payerId,
      payerId: payerId ?? null,
      payerStatus,
      payerBodyPreview,
      payerError,
      packId: pack.id,
      packRow: { id: pack.id, name: packName, amountCandidates },
      clubId: club?.id ?? null,
      amountCents,
      returnUrl: returnUrl ?? null,
      method: "POST",
      path: "payment-links",
    };
    diagnostics.payerSource = payerSource;
    console.log("[pinch checkout] pre-request diagnostics:", diagnostics);

    let pinch: { id: string | null; url: string | null; status: string } = {
      id: null,
      url: null,
      status: "pending",
    };
    let pinchError: string | null = payerError;
    let responseStatus: number | null = null;
    let responseBodyPreview: string | null = null;

    if (payerId) {
      try {
        const res = await createPaymentLink({
          amountCents,
          description: `VezaPT Pay — ${packName}`,
          reference: `pack-${pack.id}-${Date.now()}`,
          returnUrl,
          payerId,
          metadata: {
            pack_id: String(pack.id),
            member_id: String(member.id),
            club_id: club?.id ? String(club.id) : "",
          },
        });
        responseStatus = res.status;
        responseBodyPreview = res.raw.slice(0, 600);
        diagnostics.sentBody = res.sentBody?.slice(0, 800) ?? null;
        diagnostics.sentContentType = res.sentContentType ?? null;
        console.log("[pinch checkout] response:", {
          url: res.url,
          method: res.method,
          status: res.status,
          ok: res.ok,
          bodyPreview: responseBodyPreview,
        });
        if (!res.ok) {
          const apiMsg =
            res.data?.message ??
            res.data?.error ??
            res.data?.errors?.[0]?.message ??
            res.raw?.slice(0, 400) ??
            `HTTP ${res.status}`;
          pinchError = `Pinch ${res.method} ${res.url} → ${res.status}: ${apiMsg}`;
        } else {
          pinch = {
            id: extractLinkId(res.data),
            url: extractHostedUrl(res.data),
            status: res.data?.status ?? "pending",
          };
        }
      } catch (e) {
        pinchError = e instanceof Error ? e.message : String(e);
        console.error("[pinch checkout] threw:", pinchError);
      }
    }

    diagnostics.responseStatus = responseStatus;
    diagnostics.responseBodyPreview = responseBodyPreview;
    diagnostics.pinchLinkId = pinch.id;
    diagnostics.hostedUrl = pinch.url;

    // Insert payments_log row (pending). Table has no member_id column.
    const baseRow: Record<string, any> = {
      pack_id: pack.id,
      amount_cents: amountCents,
      status: "pending",
      pinch_payment_id: pinch.id ?? `local_${Date.now()}`,
      pinch_hosted_url: pinch.url ?? null,
    };

    let inserted: any = null;
    let insertError: string | null = null;
    const attempts: Array<Record<string, any>> = [
      baseRow,
      { pack_id: baseRow.pack_id, amount_cents: baseRow.amount_cents, status: "pending", pinch_payment_id: baseRow.pinch_payment_id },
      { pack_id: baseRow.pack_id, amount_cents: baseRow.amount_cents, status: "pending" },
      { pack_id: baseRow.pack_id, amount_cents: baseRow.amount_cents },
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
      diagnostics,
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

const ConfirmSchema = z.object({
  sessionId: z.union([z.string(), z.number()]),
});

/** Member confirms a logged session: set member_confirmed=true, status='verified'. */
export const confirmSession = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => ConfirmSchema.parse(d))
  .handler(async ({ data }) => {
    const { getSupabaseAdmin } = await import("./supabase.server");
    const sb = getSupabaseAdmin();
    const { data: row, error } = await sb
      .from("sessions")
      .update({ member_confirmed: true, status: "verified" })
      .eq("id", data.sessionId)
      .select()
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { session: row };
  });

const DisputeSchema = z.object({
  sessionId: z.union([z.string(), z.number()]),
});

export const disputeSession = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => DisputeSchema.parse(d))
  .handler(async ({ data }) => {
    const { getSupabaseAdmin } = await import("./supabase.server");
    const sb = getSupabaseAdmin();
    const { data: row, error } = await sb
      .from("sessions")
      .update({ member_confirmed: false, status: "disputed" })
      .eq("id", data.sessionId)
      .select()
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { session: row };
  });

const LogPtSchema = z.object({
  packId: z.union([z.string(), z.number()]),
  sessionDate: z.string().optional(),
});

/** Call the log_pt_session Supabase RPC. */
export const logPtSession = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => LogPtSchema.parse(d))
  .handler(async ({ data }) => {
    const { getSupabaseAdmin } = await import("./supabase.server");
    const sb = getSupabaseAdmin();
    const { data: rows, error } = await sb.rpc("log_pt_session", {
      p_pack_id: data.packId,
      p_session_date: data.sessionDate ?? new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
    const row = Array.isArray(rows) ? rows[0] : rows;
    return { row };
  });

const ConfirmPtSchema = z.object({
  confirmationToken: z.string(),
});

/** Call the confirm_pt_session Supabase RPC. */
export const confirmPtSession = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => ConfirmPtSchema.parse(d))
  .handler(async ({ data }) => {
    const { getSupabaseAdmin } = await import("./supabase.server");
    const sb = getSupabaseAdmin();
    const { data: rows, error } = await sb.rpc("confirm_pt_session", {
      p_confirmation_token: data.confirmationToken,
    });
    if (error) throw new Error(error.message);
    const row = Array.isArray(rows) ? rows[0] : rows;
    return { row };
  });

