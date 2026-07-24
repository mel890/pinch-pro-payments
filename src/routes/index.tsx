import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useState, useMemo, useEffect, useRef } from "react";
import {
  getDemo,
  createCheckout,
  markPaid,
  logSession,
  computeSplit,
  seedDemoPacks,
  confirmSession,
  disputeSession,
} from "@/lib/vezapt.functions";

const demoQuery = queryOptions({
  queryKey: ["vezapt-demo"],
  queryFn: () => getDemo(),
});

export const Route = createFileRoute("/")({
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
  const [split, setSplit] = useState<any>(null);
  const [lastSession, setLastSession] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const checkoutFn = useServerFn(createCheckout);
  const paidFn = useServerFn(markPaid);
  const logFn = useServerFn(logSession);
  const splitFn = useServerFn(computeSplit);
  const seedFn = useServerFn(seedDemoPacks);
  const confirmFn = useServerFn(confirmSession);
  const disputeFn = useServerFn(disputeSession);
  const [seedResult, setSeedResult] = useState<any>(null);
  const seed = useMutation({
    mutationFn: () => seedFn(),
    onSuccess: (res) => {
      setSeedResult(res.results);
      refresh();
    },
    onError: (e) => setErrorMsg(e instanceof Error ? e.message : String(e)),
  });

  const refresh = () => router.invalidate();

  // Auto-seed on load if the pt_packs table is empty.
  const autoSeededRef = useRef(false);
  useEffect(() => {
    if (!autoSeededRef.current && packs.length === 0 && !seed.isPending) {
      autoSeededRef.current = true;
      seed.mutate();
    }
  }, [packs.length]);

  const checkout = useMutation({
    mutationFn: (v: { memberId: string; packId: string }) =>
      checkoutFn({ data: v }),
    onSuccess: (res) => {
      setLastPayment(res.payment);
      setPinchInfo({ pinch: res.pinch, pinchError: res.pinchError, insertError: res.insertError });
      setErrorMsg(res.insertError ?? null);
      refresh();
    },
    onError: (e) => setErrorMsg(e instanceof Error ? e.message : String(e)),
  });

  const pay = useMutation({
    mutationFn: (v: { paymentLogId: string | number }) => paidFn({ data: v }),
    onSuccess: (res) => {
      setLastPayment(res.payment);
      refresh();
    },
    onError: (e) => setErrorMsg(e instanceof Error ? e.message : String(e)),
  });

  const log = useMutation({
    mutationFn: (v: { trainerId: string; memberId: string; packId?: string }) =>
      logFn({ data: v }),
    onSuccess: (res) => {
      setLastSession(res.session);
      refresh();
    },
    onError: (e) => setErrorMsg(e instanceof Error ? e.message : String(e)),
  });

  const showSplit = useMutation({
    mutationFn: (v: { trainerId: string }) => splitFn({ data: v }),
    onSuccess: (res) => setSplit(res),
    onError: (e) => setErrorMsg(e instanceof Error ? e.message : String(e)),
  });

  const confirmM = useMutation({
    mutationFn: (v: { sessionId: string | number }) => confirmFn({ data: v }),
    onSuccess: (res) => {
      setLastSession(res.session);
      if (trainerId) showSplit.mutate({ trainerId });
      refresh();
    },
    onError: (e) => setErrorMsg(e instanceof Error ? e.message : String(e)),
  });

  const disputeM = useMutation({
    mutationFn: (v: { sessionId: string | number }) => disputeFn({ data: v }),
    onSuccess: (res) => {
      setLastSession(res.session);
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
            {lastPayment && (
              <div className="mt-3 rounded-md border border-border bg-muted/30 p-2 text-xs">
                <div>payment #{String(lastPayment.id)}</div>
                <div>status: <span className="font-mono">{lastPayment.status}</span></div>
                {pinchInfo?.pinch?.hosted_payment_url && (
                  <a
                    className="text-primary underline"
                    href={pinchInfo.pinch.hosted_payment_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open Pinch hosted checkout ↗
                  </a>
                )}
                {pinchInfo?.pinchError && (
                  <div className="mt-1 text-destructive">
                    Pinch: {pinchInfo.pinchError}
                  </div>
                )}
              </div>
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

          {/* Step 3: Log session + split */}
          <StepCard step={3} title="Trainer logs session · split">
            <Label>Trainer</Label>
            <Select value={trainerId} onChange={setTrainerId}>
              {trainers.map((t: any) => (
                <option key={t.id} value={String(t.id)}>
                  {t.name ?? t.full_name ?? t.email ?? `#${t.id}`}
                </option>
              ))}
            </Select>
            <div className="mt-3 flex gap-2">
              <button
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-xs font-medium hover:bg-accent disabled:opacity-50"
                disabled={!trainerId || !memberId || log.isPending}
                onClick={() =>
                  log.mutate({ trainerId, memberId, packId })
                }
              >
                {log.isPending ? "…" : "Log session"}
              </button>
              <button
                className="flex-1 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                disabled={!trainerId || showSplit.isPending}
                onClick={() => showSplit.mutate({ trainerId })}
              >
                {showSplit.isPending ? "…" : "Compute split"}
              </button>
            </div>
            {split && (
              <div className="mt-3 rounded-md border border-border bg-muted/30 p-2 text-xs space-y-1">
                <div>Sessions this month: <b>{split.sessionsCount}</b></div>
                <div>
                  Tier:{" "}
                  <span className="font-mono">
                    {split.matchedTier
                      ? split.matchedTier.tier_name ??
                        split.matchedTier.name ??
                        `#${split.matchedTier.id}`
                      : "no match"}
                  </span>
                </div>
                <div>
                  Trainer share:{" "}
                  <b className="text-primary">
                    {split.trainerPct != null ? `${split.trainerPct}%` : "—"}
                  </b>
                </div>
                {lastPayment?.amount_cents && split.trainerPct != null && (
                  <div className="pt-1 border-t border-border">
                    On last payment {fmt(lastPayment.amount_cents)}:{" "}
                    trainer{" "}
                    <b>
                      {fmt(
                        Math.round(
                          (lastPayment.amount_cents * split.trainerPct) / 100,
                        ),
                      )}
                    </b>
                    , club{" "}
                    <b>
                      {fmt(
                        lastPayment.amount_cents -
                          Math.round(
                            (lastPayment.amount_cents * split.trainerPct) / 100,
                          ),
                      )}
                    </b>
                  </div>
                )}
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
