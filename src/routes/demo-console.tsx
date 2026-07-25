import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useSuspenseQuery, useQuery, queryOptions } from "@tanstack/react-query";
import { useState, useMemo, useEffect, useRef } from "react";
import {
  getDemo,
  markPaid,
  seedDemoPacks,
  logPtSession,
  confirmPtSession,
  pinchEnvCheck,
  getSupabaseConfig,
  createCheckout,
} from "@/lib/vezapt.functions";

type DebugEntry = {
  ts: number;
  phase: string;
  level: "info" | "success" | "error";
  title: string;
  detail?: any;
};

function redact(v: string | null | undefined): string {
  if (!v) return "";
  const s = String(v);
  if (s.length <= 8) return "•".repeat(s.length);
  return `${s.slice(0, 4)}…${s.slice(-4)} (len=${s.length})`;
}

function redactHeaders(h: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(h)) {
    const key = k.toLowerCase();
    if (key === "authorization" || key === "apikey" || key === "x-api-key") {
      out[k] = redact(v.replace(/^Bearer\s+/i, ""));
    } else {
      out[k] = v;
    }
  }
  return out;
}

const demoQuery = queryOptions({
  queryKey: ["vezapt-demo"],
  queryFn: () => getDemo(),
});

export const Route = createFileRoute("/demo-console")({
  head: () => ({
    meta: [
      { title: "VezaPT Pay — hackathon demo" },
      {
        name: "description",
        content:
          "End-to-end PT payments demo: member buys a pack, trainer logs a session, split payout calculated instantly.",
      },
      { property: "og:title", content: "VezaPT Pay" },
      {
        property: "og:description",
        content: "Personal training payments powered by Pinch.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(demoQuery),
  component: DemoPage,
});

function fmt(cents: number | null | undefined): string {
  if (cents == null) return "—";
  return `$${(cents / 100).toFixed(2)}`;
}

function DemoPage() {
  const { data } = useSuspenseQuery(demoQuery);
  const router = useRouter();

  const members = data.members?.rows ?? [];
  const trainers = data.trainers?.rows ?? [];
  const packs = data.pt_packs?.rows ?? [];
  const payments = data.payments_log?.rows ?? [];
  const sessions = data.sessions?.rows ?? [];

  const [memberId, setMemberId] = useState<string>(String(members[0]?.id ?? ""));
  const [packId, setPackId] = useState<string>(String(packs[0]?.id ?? ""));
  const [trainerId, setTrainerId] = useState<string>(String(trainers[0]?.id ?? ""));
  const [lastPayment, setLastPayment] = useState<any>(null);
  const [pinchInfo, setPinchInfo] = useState<any>(null);
  const [logResult, setLogResult] = useState<any>(null);
  const [confirmResult, setConfirmResult] = useState<any>(null);
  const [confirmationToken, setConfirmationToken] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const cfgFn = useServerFn(getSupabaseConfig);
  const paidFn = useServerFn(markPaid);
  const logPtFn = useServerFn(logPtSession);
  const confirmPtFn = useServerFn(confirmPtSession);
  const seedFn = useServerFn(seedDemoPacks);
  const envFn = useServerFn(pinchEnvCheck);

  const envQuery = useQuery({
    queryKey: ["pinch-env"],
    queryFn: () => envFn(),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  const envReady =
    !!envQuery.data?.resolvedClientIdPresent &&
    !!envQuery.data?.resolvedClientSecretPresent;
  const [seedResult, setSeedResult] = useState<any>(null);
  const seed = useMutation({
    mutationFn: () => seedFn(),
    onSuccess: (res: any) => {
      setSeedResult(res.results);
      refresh();
    },
    onError: (e) => {
      autoSeededRef.current = false;
      setErrorMsg(e instanceof Error ? e.message : String(e));
    },
  });

  const refresh = () => router.invalidate();

  // Debug log — captures each phase of the Pinch flow.
  const [debugLog, setDebugLog] = useState<DebugEntry[]>([]);
  const pushDebug = (e: Omit<DebugEntry, "ts">) =>
    setDebugLog((prev) => [...prev, { ...e, ts: Date.now() }]);
  const clearDebug = () => setDebugLog([]);

  // Auto-seed on load if the pt_packs table is empty; retries on refresh.
  const autoSeededRef = useRef(false);
  useEffect(() => {
    if (!autoSeededRef.current && packs.length === 0 && !seed.isPending) {
      autoSeededRef.current = true;
      seed.mutate();
    }
  }, [packs.length]);


  const checkout = useMutation({
    mutationFn: async (v: { memberId: string; packId: string }) => {
      pushDebug({ phase: "1. cfg", level: "info", title: "Fetching Supabase config", detail: v });
      const cfg = await cfgFn();
      if (!cfg.url || !cfg.anonKey) {
        pushDebug({ phase: "1. cfg", level: "error", title: "Missing URL or anon key", detail: { hasUrl: !!cfg.url, hasAnonKey: !!cfg.anonKey } });
        throw new Error("Supabase config unavailable (missing URL or publishable key).");
      }
      const endpoint = `${cfg.url.replace(/\/$/, "")}/functions/v1/pinch-buy-pack`;
      const headers = {
        "Content-Type": "application/json",
        apikey: cfg.anonKey,
        Authorization: `Bearer ${cfg.anonKey}`,
      };
      pushDebug({
        phase: "2. edge fn request",
        level: "info",
        title: `POST ${endpoint}`,
        detail: { headers: redactHeaders(headers), body: v },
      });
      let res: Response;
      try {
        res = await fetch(endpoint, { method: "POST", headers, body: JSON.stringify(v) });
      } catch (err) {
        pushDebug({ phase: "2. edge fn request", level: "error", title: "Network/CORS error", detail: err instanceof Error ? err.message : String(err) });
        throw err;
      }
      const raw = await res.text();
      let json: any = null;
      try { json = raw ? JSON.parse(raw) : null; } catch { json = { raw }; }
      pushDebug({
        phase: "3. edge fn response",
        level: res.ok ? "success" : "error",
        title: `${res.status} ${res.statusText}`,
        detail: { status: res.status, ok: res.ok, body: json ?? raw.slice(0, 600) },
      });
      if (!res.ok) {
        const msg = json?.error ?? json?.message ?? raw?.slice(0, 300) ?? `HTTP ${res.status}`;
        throw new Error(`pinch-buy-pack ${res.status}: ${msg}`);
      }
      return json ?? {};
    },
    onSuccess: (res: any) => {
      const url = res?.paymentUrl ?? res?.payment_url ?? res?.url ?? null;
      setPinchInfo({ pinch: { url, id: res?.paymentId ?? res?.id ?? null }, response: res });
      pushDebug({ phase: "4. hosted url", level: url ? "success" : "error", title: url ? "Received hosted checkout URL" : "No paymentUrl in response", detail: { url, id: res?.paymentId ?? res?.id ?? null } });
      setErrorMsg(null);
      if (url) window.open(url, "_blank", "noopener,noreferrer");
      refresh();
    },
    onError: (e) => {
      pushDebug({ phase: "!! failure", level: "error", title: "Checkout mutation rejected", detail: e instanceof Error ? e.message : String(e) });
      setErrorMsg(e instanceof Error ? e.message : String(e));
    },
  });

  // Alternate path: bypass edge function and call Pinch directly via our TanStack server fn.
  // This route has full server-side instrumentation and returns redacted diagnostics.
  const serverCheckoutFn = useServerFn(createCheckout);
  const serverCheckout = useMutation({
    mutationFn: async (v: { memberId: string; packId: string }) => {
      pushDebug({ phase: "S1. server fn", level: "info", title: "Calling createCheckout (TanStack server fn → Pinch)", detail: v });
      const res = await serverCheckoutFn({ data: v });
      return res;
    },
    onSuccess: (res: any) => {
      pushDebug({
        phase: "S2. pinch diagnostics",
        level: res?.pinchError ? "error" : "success",
        title: res?.pinchError ? "Pinch call failed" : "Pinch call ok",
        detail: res?.diagnostics,
      });
      if (res?.pinchError) {
        pushDebug({ phase: "S3. pinch error", level: "error", title: "Verbatim Pinch error", detail: res.pinchError });
      }
      if (res?.insertError) {
        pushDebug({ phase: "S4. payments_log", level: "error", title: "Insert into payments_log failed", detail: res.insertError });
      } else if (res?.payment) {
        pushDebug({ phase: "S4. payments_log", level: "success", title: "Inserted payments_log row", detail: { id: res.payment.id, status: res.payment.status } });
      }
      if (res?.pinch?.url) {
        setPinchInfo({ pinch: res.pinch, response: res });
        window.open(res.pinch.url, "_blank", "noopener,noreferrer");
      }
      refresh();
    },
    onError: (e) => {
      pushDebug({ phase: "!! server fn threw", level: "error", title: "createCheckout rejected", detail: e instanceof Error ? e.message : String(e) });
      setErrorMsg(e instanceof Error ? e.message : String(e));
    },
  });

  const pay = useMutation({
    mutationFn: (v: { paymentLogId: string | number }) => paidFn({ data: v }),
    onSuccess: (res: any) => {
      setLastPayment(res.payment);
      refresh();
    },
    onError: (e) => setErrorMsg(e instanceof Error ? e.message : String(e)),
  });

  const logPt = useMutation({
    mutationFn: (v: { packId: string }) => logPtFn({ data: v }),
    onSuccess: (res: any) => {
      setErrorMsg(null);
      setLogResult(res.row);
      setConfirmResult(null);
      if (res.row?.confirmation_token) {
        setConfirmationToken(String(res.row.confirmation_token));
      }
      refresh();
    },
    onError: (e) => setErrorMsg(e instanceof Error ? e.message : String(e)),
  });

  const confirmPt = useMutation({
    mutationFn: (v: { confirmationToken: string }) => confirmPtFn({ data: v }),
    onSuccess: (res: any) => {
      setErrorMsg(null);
      setConfirmResult(res.row);
      refresh();
    },
    onError: (e) => setErrorMsg(e instanceof Error ? e.message : String(e)),
  });


  const selectedPack = useMemo(
    () => packs.find((p: any) => String(p.id) === packId),
    [packs, packId],
  );
  const packPrice =
    selectedPack?.total_amount ?? selectedPack?.price_cents ?? selectedPack?.amount_cents ?? selectedPack?.price;

  const memberName = (id: any) => {
    const m = members.find((x: any) => String(x.id) === String(id));
    return m?.name ?? m?.full_name ?? m?.email ?? `#${id}`;
  };
  const trainerName = (id: any) => {
    const t = trainers.find((x: any) => String(x.id) === String(id));
    return t?.name ?? t?.full_name ?? t?.email ?? `#${id}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
              V
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">VezaPT Pay</h1>
              <p className="text-xs text-muted-foreground">
                Hackathon demo · Pinch sandbox
              </p>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            End-to-end PT payments · splits · payouts
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10 space-y-10">
        {errorMsg && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {errorMsg}
          </div>
        )}

        {packs.length === 0 && (
          <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm flex items-center justify-between gap-4">
            <div>
              <div className="font-medium">No PT packs yet.</div>
              <div className="text-xs text-muted-foreground">
                Seed the three demo packs (6-Week Transformation, 10-Session
                Starter, 12-Week Elite) to enable the checkout flow.
              </div>
            </div>
            <button
              className="inline-flex shrink-0 items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              disabled={seed.isPending}
              onClick={() => seed.mutate()}
            >
              {seed.isPending ? "Seeding…" : "Seed demo packs"}
            </button>
          </div>
        )}
        {seedResult && (
          <div className="rounded-md border border-border bg-muted/40 p-3 text-xs font-mono">
            {seedResult.map((r: any, i: number) => (
              <div key={i}>
                {r.name}: <b>{r.status}</b>
                {r.detail && <span className="text-destructive"> — {r.detail}</span>}
              </div>
            ))}
          </div>
        )}

        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Step 1: Checkout */}
          <StepCard step={1} title="Member buys a pack">
            <Label>Member</Label>
            <Select value={memberId} onChange={setMemberId}>
              {members.map((m: any) => (
                <option key={m.id} value={String(m.id)}>
                  {m.name ?? m.full_name ?? m.email ?? `#${m.id}`}
                </option>
              ))}
            </Select>
            <Label>Pack</Label>
            <Select value={packId} onChange={setPackId}>
              {packs.map((p: any) => (
                <option key={p.id} value={String(p.id)}>
                  {(p.name ?? `Pack #${p.id}`) +
                    " — " +
                    fmt(p.total_amount ?? p.price_cents ?? p.amount_cents ?? p.price)}
                </option>
              ))}
            </Select>
            <div className="mt-2 text-xs text-muted-foreground">
              Total: <span className="font-medium text-foreground">{fmt(packPrice)}</span>
            </div>
            <button
              className="mt-3 inline-flex w-full items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              disabled={!memberId || !packId || checkout.isPending}
              onClick={() => checkout.mutate({ memberId, packId })}
            >
              {checkout.isPending ? "Creating…" : "Create Pinch checkout"}
            </button>
            <button
              className="mt-2 inline-flex w-full items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-xs font-medium hover:bg-accent disabled:opacity-50"
              disabled={!memberId || !packId || serverCheckout.isPending}
              onClick={() => serverCheckout.mutate({ memberId, packId })}
              title="Bypass the edge function — call Pinch directly from our TanStack server fn (fully instrumented)."
            >
              {serverCheckout.isPending ? "Debugging…" : "Debug via server (bypass edge fn)"}
            </button>
            {lastPayment && (
              <div className="mt-3 rounded-md border border-border bg-muted/30 p-2 text-xs space-y-1">
                <div>payment #{String(lastPayment.id)}</div>
                <div>status: <span className="font-mono">{lastPayment.status}</span></div>
                {pinchInfo?.pinch?.url && (
                  <a
                    className="text-primary underline break-all"
                    href={pinchInfo.pinch.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open Pinch hosted checkout ↗
                  </a>
                )}
                {pinchInfo?.pinchError && (
                  <div className="mt-1 rounded border border-destructive/40 bg-destructive/10 p-2 text-destructive whitespace-pre-wrap break-words">
                    {pinchInfo.pinchError}
                  </div>
                )}
              </div>
            )}
            {pinchInfo?.diagnostics && (
              <details className="mt-2 rounded-md border border-border bg-muted/20 p-2 text-[10px]">
                <summary className="cursor-pointer font-medium">Pinch diagnostics</summary>
                <pre className="mt-1 overflow-x-auto">
{JSON.stringify(pinchInfo.diagnostics, null, 2)}
                </pre>
              </details>
            )}
          </StepCard>

          {/* Step 2: Simulate webhook / mark paid */}
          <StepCard step={2} title="Pinch confirms payment">
            <p className="text-xs text-muted-foreground">
              In production the Pinch webhook flips this to <code>paid</code>.
              For the demo, click to simulate.
            </p>
            <button
              className="mt-3 inline-flex w-full items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              disabled={!lastPayment?.id || pay.isPending}
              onClick={() => pay.mutate({ paymentLogId: lastPayment.id })}
            >
              {pay.isPending ? "Marking…" : "Simulate webhook → paid"}
            </button>
            {lastPayment?.status === "paid" && (
              <div className="mt-3 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-2 text-xs text-emerald-700 dark:text-emerald-400">
                Paid ✓ — pack unlocked for member.
              </div>
            )}
          </StepCard>

          {/* Step 3: Log session via RPC */}
          <StepCard step={3} title="Trainer logs session">
            <Label>Trainer</Label>
            <Select value={trainerId} onChange={setTrainerId}>
              {trainers.map((t: any) => (
                <option key={t.id} value={String(t.id)}>
                  {t.name ?? t.full_name ?? t.email ?? `#${t.id}`}
                </option>
              ))}
            </Select>
            <button
              className="mt-3 inline-flex w-full items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
              disabled={!packId || logPt.isPending}
              onClick={() => logPt.mutate({ packId })}
            >
              {logPt.isPending ? "Logging…" : "Log session"}
            </button>
            {logPt.isError && (
              <div className="mt-2 rounded-md border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">
                {logPt.error instanceof Error ? logPt.error.message : String(logPt.error)}
              </div>
            )}
            {logResult && (
              <div className="mt-3 rounded-md border border-border bg-muted/30 p-2 text-xs space-y-1">
                <div className="font-semibold text-foreground">Session logged</div>
                <div>Status: <span className="font-mono">Awaiting member confirmation</span></div>
                <div>
                  Session #<b>{logResult.session_number_in_pack ?? "—"}</b> in pack
                </div>
                <div>
                  Session value:{" "}
                  <b>{fmt(logResult.session_value_cents)} AUD</b>
                </div>
                <div className="pt-1 text-[10px] text-muted-foreground break-all">
                  session_id: {String(logResult.session_id ?? "—")}
                </div>
              </div>
            )}
          </StepCard>

          {/* Step 4: Confirm via RPC */}
          <StepCard step={4} title="Member confirms session">
            <Label>Confirmation token</Label>
            <input
              className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs font-mono"
              value={confirmationToken}
              onChange={(e) => setConfirmationToken(e.target.value)}
              placeholder="log a session in Step 3"
            />
            <button
              className="mt-3 inline-flex w-full items-center justify-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              disabled={!confirmationToken || confirmPt.isPending || !!confirmResult}
              onClick={() => confirmPt.mutate({ confirmationToken })}
            >
              {confirmPt.isPending ? "Confirming…" : "Confirm session"}
            </button>
            {confirmPt.isError && (
              <div className="mt-2 rounded-md border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">
                {confirmPt.error instanceof Error ? confirmPt.error.message : String(confirmPt.error)}
              </div>
            )}
            {confirmResult && (
              <div className="mt-3 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-2 text-xs space-y-1 text-emerald-800 dark:text-emerald-300">
                <div className="font-semibold">Session confirmed</div>
                <div>Status: <span className="font-mono">{String(confirmResult.status ?? "—")}</span></div>
                <div>Session # in cycle: <b>{confirmResult.session_number_in_cycle ?? "—"}</b></div>
                <div>PT split: <b>{confirmResult.pt_split_pct ?? "—"}%</b> · Club split: <b>{confirmResult.club_split_pct ?? "—"}%</b></div>
                <div>PT payout: <b>{fmt(confirmResult.pt_amount_cents)} AUD</b></div>
                <div>Club payout: <b>{fmt(confirmResult.club_amount_cents)} AUD</b></div>
              </div>
            )}
          </StepCard>
        </section>



        <section className="grid gap-6 md:grid-cols-2">
          <TablePanel title="payments_log (recent)" rows={payments.slice(-10).reverse()} />
          <TablePanel title="sessions (recent)" rows={sessions.slice(-10).reverse()} />
        </section>

        <section>
          <details className="rounded-md border border-border bg-card">
            <summary className="cursor-pointer px-4 py-3 text-sm font-medium">
              Demo rules
            </summary>
            <div className="grid gap-4 p-4 text-xs md:grid-cols-2">
              <div>
                <div className="mb-1 font-semibold text-foreground">Payment cycle</div>
                <p className="text-muted-foreground">
                  Member pays up-front for the full pack via Pinch hosted checkout.
                  Funds settle to the club account; trainer payouts are calculated
                  per verified session and released on the fortnightly payout run.
                </p>
              </div>
              <div>
                <div className="mb-1 font-semibold text-foreground">Current thresholds</div>
                <p className="text-muted-foreground">
                  Split tiers are keyed on sessions delivered this calendar month.
                  Default tiers: 0–20 sessions = base tier, 21–40 = mid tier,
                  41+ = top tier. Live values come from the{" "}
                  <code className="font-mono">split_tiers</code> table per club.
                </p>
              </div>
              <div>
                <div className="mb-1 font-semibold text-foreground">Confirmation requirement</div>
                <p className="text-muted-foreground">
                  Every logged session must be confirmed by the member before it
                  counts toward payout. Confirmed sessions flip to{" "}
                  <code className="font-mono">status = "verified"</code> with{" "}
                  <code className="font-mono">member_confirmed = true</code>.
                  Disputed sessions are held for club review and excluded from
                  the split until resolved.
                </p>
              </div>
              <div>
                <div className="mb-1 font-semibold text-foreground">Split behaviour</div>
                <p className="text-muted-foreground">
                  Trainer share = matched tier %, applied to each verified
                  session's pro-rata value (pack price ÷ sessions_total).
                  Remainder goes to the club. Tier is re-evaluated on every
                  confirmation, so crossing a threshold mid-month lifts payout
                  for subsequent sessions only.
                </p>
              </div>
            </div>
          </details>
        </section>

        <DebugPanel entries={debugLog} onClear={clearDebug} />

        <PinchEnvPanel />


        <section>
          <details className="rounded-md border border-border bg-card">
            <summary className="cursor-pointer px-4 py-3 text-sm font-medium">
              Diagnostics · raw table dumps
            </summary>
            <div className="p-4 space-y-4 text-xs">
              {Object.entries(data).map(([name, t]) => (
                <div key={name}>
                  <div className="font-mono font-semibold">
                    {name} · {t.rows.length} rows
                    {t.error && (
                      <span className="ml-2 text-destructive">error: {t.error}</span>
                    )}
                  </div>
                  <pre className="mt-1 overflow-x-auto rounded bg-muted/40 p-2">
                    {JSON.stringify(t.rows.slice(0, 3), null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </details>
        </section>
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        VezaPT Pay · powered by Pinch Payments (sandbox)
      </footer>
    </div>
  );
}

function DebugPanel({ entries, onClear }: { entries: DebugEntry[]; onClear: () => void }) {
  const t0 = entries[0]?.ts;
  return (
    <section>
      <details className="rounded-md border border-border bg-card" open={entries.length > 0}>
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium flex items-center justify-between">
          <span>Pinch flow debug ({entries.length} events)</span>
          {entries.length > 0 && (
            <button
              className="text-xs text-muted-foreground hover:text-foreground underline"
              onClick={(e) => { e.preventDefault(); onClear(); }}
            >
              clear
            </button>
          )}
        </summary>
        <div className="p-4 space-y-2 text-xs">
          {entries.length === 0 ? (
            <p className="text-muted-foreground">
              No events yet. Click <b>Create Pinch checkout</b> or <b>Debug via server</b> in Step 1
              to capture each request / response (secrets redacted).
            </p>
          ) : (
            entries.map((e, i) => {
              const colour =
                e.level === "error"
                  ? "border-destructive/40 bg-destructive/5"
                  : e.level === "success"
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : "border-border bg-muted/30";
              const dot =
                e.level === "error" ? "bg-destructive" : e.level === "success" ? "bg-emerald-500" : "bg-muted-foreground";
              return (
                <div key={i} className={`rounded-md border ${colour} p-2`}>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className={`inline-block h-2 w-2 rounded-full ${dot}`} />
                    <span className="text-muted-foreground">+{t0 ? e.ts - t0 : 0}ms</span>
                    <span className="font-semibold">{e.phase}</span>
                    <span className="text-foreground">{e.title}</span>
                  </div>
                  {e.detail !== undefined && (
                    <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-words rounded bg-background/60 p-2 text-[10px]">
{typeof e.detail === "string" ? e.detail : JSON.stringify(e.detail, null, 2)}
                    </pre>
                  )}
                </div>
              );
            })
          )}
        </div>
      </details>
    </section>
  );
}

function PinchEnvPanel() {
  const check = useServerFn(pinchEnvCheck);
  const [info, setInfo] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  return (
    <details className="rounded-md border border-border bg-card">
      <summary className="cursor-pointer px-4 py-3 text-sm font-medium">
        Pinch env check (server runtime)
      </summary>
      <div className="space-y-3 p-4 text-xs">
        <button
          className="rounded bg-primary px-3 py-1 text-primary-foreground"
          onClick={async () => {
            setErr(null);
            try {
              setInfo(await check());
            } catch (e) {
              setErr(e instanceof Error ? e.message : String(e));
            }
          }}
        >
          Check env vars
        </button>
        {err && <div className="text-destructive">{err}</div>}
        {info && (
          <pre className="overflow-x-auto rounded bg-muted/40 p-2">
{JSON.stringify(info, null, 2)}
          </pre>
        )}
        <p className="text-muted-foreground">
          Server runtime: TanStack Start server functions running in the
          Cloudflare Worker deployment. Env vars come from Lovable Cloud
          project secrets (Project Settings → Secrets), not Supabase Edge
          Function secrets. After adding or updating a secret, republish the
          app for it to appear in the production Worker.
        </p>
      </div>
    </details>
  );
}


function StepCard({
  step,
  title,
  children,
}: {
  step: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
          {step}
        </span>
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mt-2 block text-xs font-medium text-muted-foreground">
      {children}
    </label>
  );
}

function Select({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {children}
    </select>
  );
}

function TablePanel({ title, rows }: { title: string; rows: any[] }) {
  const cols = rows[0] ? Object.keys(rows[0]) : [];
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-4 py-2 text-sm font-semibold">
        {title}
      </div>
      <div className="max-h-72 overflow-auto">
        {rows.length === 0 ? (
          <div className="p-4 text-xs text-muted-foreground">No rows yet.</div>
        ) : (
          <table className="w-full text-xs">
            <thead className="bg-muted/40">
              <tr>
                {cols.map((c) => (
                  <th key={c} className="px-2 py-1.5 text-left font-medium">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-t border-border">
                  {cols.map((c) => (
                    <td key={c} className="px-2 py-1 font-mono">
                      {formatCell(r[c])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function formatCell(v: any): string {
  if (v == null) return "—";
  if (typeof v === "object") return JSON.stringify(v);
  const s = String(v);
  return s.length > 40 ? s.slice(0, 40) + "…" : s;
}
