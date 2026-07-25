import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSnapshot, tierFor } from "@/lib/vezapt-live.functions";
import { formatAUD } from "@/lib/money";
import { Progress } from "@/components/ui/progress";
import { Users, Wallet, CheckCircle2, ArrowRight, Megaphone, ShoppingBag, Repeat, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "PT Team Dashboard — Northside Club · VezaPT Pay" },
      {
        name: "description",
        content:
          "Manager view: team size, active clients, PT revenue, earned vs held vs club margin — all live from the hackathon Supabase tables.",
      },
      { property: "og:title", content: "PT Team Dashboard — Northside Club" },
      {
        property: "og:description",
        content:
          "Live revenue-split reveal for VezaPT Pay: earned, held, club margin.",
      },
    ],
  }),
  loader: async ({ context }) =>
    context.queryClient.ensureQueryData({
      queryKey: ["snapshot"],
      queryFn: () => getSnapshot(),
      staleTime: 0,
    }),
  component: Dashboard,
});

function pinchFee(cents: number) {
  return Math.round(cents * 0.0168) + 30;
}

function Dashboard() {
  const { data: snap } = useSuspenseQuery({
    queryKey: ["snapshot"],
    queryFn: () => getSnapshot(),
    staleTime: 0,
    refetchInterval: 4000,
  });

  const teamSize = snap.trainers.length;
  const activeClients = snap.members.length;

  const paidPayments = snap.payments.filter(
    (p: any) => p.status === "paid" || p.status === "succeeded",
  );
  const gross = paidPayments.reduce(
    (sum: number, p: any) => sum + Number(p.amount_cents ?? 0),
    0,
  );
  const totalPinchFee = paidPayments.reduce(
    (sum: number, p: any) => sum + pinchFee(Number(p.amount_cents ?? 0)),
    0,
  );

  // Trainer aggregates
  const trainerAgg = snap.trainers.map((t: any) => {
    const mine = snap.sessions.filter((s: any) => s.trainer_id === t.id);
    const verified = mine.filter((s: any) => s.status === "confirmed");
    const held = mine.filter((s: any) =>
      ["acknowledged", "completed"].includes(s.status),
    );
    const earnedCents = verified.reduce(
      (sum: number, s: any) => sum + Number(s.pt_amount_cents ?? 0),
      0,
    );
    const tier = tierFor(verified.length, snap.tiers as any);
    const heldCents = held.reduce(
      (sum: number, s: any) =>
        sum + Math.round(Number(s.session_value_cents ?? 0) * Number(tier?.pt_split_pct ?? 40) / 100),
      0,
    );
    const nextTier = (snap.tiers as any[])
      .slice()
      .sort((a, b) => a.sessions_min - b.sessions_min)
      .find((x) => x.sessions_min > verified.length);
    return {
      trainer: t,
      verifiedCount: verified.length,
      heldCount: held.length,
      earnedCents,
      heldCents,
      tier,
      nextTier,
    };
  });

  const totalEarned = trainerAgg.reduce((sum, r) => sum + r.earnedCents, 0);
  const totalHeld = trainerAgg.reduce((sum, r) => sum + r.heldCents, 0);
  const totalHeldCount = trainerAgg.reduce((sum, r) => sum + r.heldCount, 0);
  const totalVerified = trainerAgg.reduce((sum, r) => sum + r.verifiedCount, 0);
  const clubMargin = gross - totalEarned - totalHeld - totalPinchFee;
  const marginPct = gross > 0 ? Math.round((clubMargin / gross) * 100) : 0;

  return (
    <div className="min-h-screen bg-background text-foreground pb-16">
      <div className="mx-auto max-w-6xl px-5 pt-8 sm:px-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Manager · Northside Club
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
              PT Team Dashboard
            </h1>
          </div>
          <Badge className="border border-warm/40 bg-warm/10 text-[color:var(--warm)]">
            VezaPT Pay · Sandbox
          </Badge>
        </header>

        {/* KPI row — campaign momentum */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi icon={<Megaphone className="size-4" />} label="Campaigns live" value="2" />
          <Kpi icon={<ShoppingBag className="size-4" />} label="Products sold this month" value="18" />
          <Kpi icon={<Users className="size-4" />} label="Clients activated" value="15" />
          <Kpi icon={<Repeat className="size-4" />} label="Converted to ongoing" value="7" />
        </div>

        {/* Campaign performance */}
        <section className="mt-6 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Campaign performance
            </h2>
            <Badge className="border border-warm/40 bg-warm/10 text-[color:var(--warm)]">
              This month
            </Badge>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <SplitCard
              tone="primary"
              label="Sales generated"
              value="$9,482"
              sub="Total member purchases this month"
              why="Gross member spend across live campaigns."
            />
            <SplitCard
              tone="warm"
              label="Trainer payouts"
              value="$7,632"
              sub="Paid or reserved for accepted delivery"
              why="Committed to trainers once opportunities are accepted."
            />
            <SplitCard
              tone="default"
              label="Club campaign revenue"
              value="$1,850"
              sub="Fees earned for campaigns, payments and matching"
              why="What the club keeps for running the offer and platform."
            />
          </div>
        </section>

        {/* Campaign funnel */}
        <CampaignFunnel />


        {/* Team health — demo signals */}
        <section className="mt-6">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Team health
            </h2>
            <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
              Client impact demo data
            </Badge>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <Card className="border-border p-5">
              <ul className="space-y-2 text-sm">
                <HealthRow label="Clients building momentum" value="5" tone="good" />
                <HealthRow label="Clients with no future booking" value="2" tone="warn" />
                <HealthRow label="Trainers with rising cancellations" value="1" tone="warn" />
                <HealthRow label="Average client support" value="4.6 / 5" tone="good" />
                <HealthRow label="Client confidence wins this week" value="3" tone="good" />
              </ul>
            </Card>
            <Card className="border-primary/25 bg-primary/5 p-5">
              <p className="text-xs uppercase tracking-wider text-primary">
                Coaching priority this week
              </p>
              <p className="mt-2 text-lg font-semibold">Client Connection</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Return attendance has softened across two trainers. Review
                follow-up, personalisation and next-session booking behaviours.
              </p>
              <div className="mt-4 space-y-1.5 text-sm">
                <DimensionRow name="Client Connection" state="Needs attention" tone="warn" />
                <DimensionRow name="Movement Mastery" state="Stable" tone="ok" />
                <DimensionRow name="Brand Power" state="Stable" tone="ok" />
                <DimensionRow name="Flow in Function" state="Watch" tone="warn" />
                <DimensionRow name="Financial IQ" state="Strong" tone="good" />
              </div>
            </Card>
          </div>
        </section>

        {/* Trainer roster */}
        <section className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Trainer roster
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Participation, capacity and coaching signals — richer than volume-based tiers.
          </p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {trainerAgg.map(({ trainer, earnedCents }, i) => {
              const profile = TRAINER_PROFILES[i % TRAINER_PROFILES.length];
              const displayName = i === 0 ? "Sarah Nguyen" : trainer.name;
              return (
                <Card key={trainer.id} className="border-border p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold">{displayName}</p>
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                        Personal trainer
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Earned this month
                      </p>
                      <p className="font-mono text-lg font-semibold tabular-nums text-primary">
                        {formatAUD(earnedCents || profile.earningsCents.earned)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <RosterBlock label="Accepting">
                      <ul className="space-y-1 text-sm">
                        {profile.accepting.map((a) => (
                          <li key={a} className="text-foreground/80">· {a}</li>
                        ))}
                      </ul>
                    </RosterBlock>
                    <RosterBlock label="Capacity this month">
                      <ul className="space-y-1 text-sm">
                        {profile.capacity.map((c) => (
                          <li key={c.label} className="flex items-center justify-between">
                            <span className="text-foreground/80">{c.label}</span>
                            <span className="font-mono tabular-nums text-muted-foreground">
                              {c.filled} of {c.total} filled
                            </span>
                          </li>
                        ))}
                      </ul>
                    </RosterBlock>
                    <RosterBlock label="Current coaching clients">
                      <ul className="space-y-1 text-sm text-foreground/80">
                        <li>{profile.clients.active} active</li>
                        <li>{profile.clients.completing} completing a pack this week</li>
                        <li>{profile.clients.continuation} ready for a continuation conversation</li>
                      </ul>
                    </RosterBlock>
                    <RosterBlock label="Earnings">
                      <ul className="space-y-1 text-sm">
                        <EarningsRow label="Earned this month" value={formatAUD(profile.earningsCents.earned)} tone="primary" />
                        <EarningsRow label="Pending delivery" value={formatAUD(profile.earningsCents.pending)} tone="warm" />
                        <EarningsRow label="Potential from accepted" value={formatAUD(profile.earningsCents.potential)} tone="muted" />
                      </ul>
                    </RosterBlock>
                  </div>

                  <div className="mt-4 rounded-xl border border-border bg-secondary/30 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Signals
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                      <SignalRow label="Acceptance reliability" value={profile.signals.acceptance} />
                      <SignalRow label="Pack completion" value={profile.signals.packCompletion} />
                      <SignalRow label="Ongoing conversion" value={profile.signals.ongoing} />
                      <SignalRow label="Client support" value={profile.signals.support} />
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <Link
                      to="/trainer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/15"
                    >
                      View {displayName.split(" ")[0]}’s client journeys
                      <ArrowRight className="size-3" />
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>


        {/* Payments log */}
        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              payments_log
            </h2>
            <div className="mt-3 overflow-hidden rounded-xl border border-border">
              <table className="w-full text-xs">
                <thead className="bg-secondary/60 text-left text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">Pinch id</th>
                    <th className="px-3 py-2 font-medium">Amount</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {snap.payments.slice(0, 10).map((p: any) => (
                    <tr key={p.id} className="border-t border-border">
                      <td className="px-3 py-2 font-mono">
                        {p.pinch_payment_id?.slice(0, 22) ?? "—"}
                      </td>
                      <td className="px-3 py-2 font-mono tabular-nums">
                        {formatAUD(p.amount_cents)}
                      </td>
                      <td className="px-3 py-2">
                        <StatusPill status={p.status} />
                      </td>
                    </tr>
                  ))}
                  {snap.payments.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-3 py-4 text-center text-muted-foreground">
                        No payments logged yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Session pipeline
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {["pending", "acknowledged", "completed", "confirmed"].map((st) => {
                const count = snap.sessions.filter((s: any) => s.status === st).length;
                return (
                  <Card key={st} className="border-border p-3 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {st}
                    </p>
                    <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">
                      {count}
                    </p>
                  </Card>
                );
              })}
            </div>

            <div className="mt-4 rounded-xl border border-dashed border-border p-3 text-[11px] text-muted-foreground">
              <p className="font-semibold text-foreground/70">Illustrative only</p>
              <p>
                8-week retention · PTIR · funnel rates — not tracked by the
                hackathon schema.
              </p>
            </div>
          </div>
        </section>

        <div className="mt-10 flex justify-center gap-4 text-xs text-muted-foreground">
          <Link to="/" className="underline underline-offset-4 hover:text-foreground">Start</Link>
          <Link to="/trainer" className="underline underline-offset-4 hover:text-foreground">Trainer</Link>
          <Link to="/me" className="underline underline-offset-4 hover:text-foreground">Client</Link>
          <Link to="/demo-console" className="underline underline-offset-4 hover:text-foreground">
            Integration console <ArrowRight className="inline size-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  mono,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <Card className="border-border p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        {icon} {label}
      </div>
      <p
        className={`mt-2 text-2xl font-semibold tabular-nums ${mono ? "font-mono" : ""}`}
      >
        {value}
      </p>
    </Card>
  );
}


const TRAINER_SIGNALS = [
  { retention: "Watch", retentionTone: "border-warm/40 bg-warm/10 text-[color:var(--warm)]", support: "4.7 / 5", focus: "Client Connection" },
  { retention: "Stable", retentionTone: "border-primary/30 bg-primary/5 text-primary", support: "4.5 / 5", focus: "Flow in Function" },
  { retention: "Needs attention", retentionTone: "border-destructive/40 bg-destructive/10 text-destructive", support: "4.3 / 5", focus: "Movement Mastery" },
];

type TrainerProfile = {
  accepting: string[];
  capacity: { label: string; filled: number; total: number }[];
  clients: { active: number; completing: number; continuation: number };
  earningsCents: { earned: number; pending: number; potential: number };
  signals: { acceptance: string; packCompletion: string; ongoing: string; support: string };
};

const TRAINER_PROFILES: TrainerProfile[] = [
  {
    accepting: ["Kickstart Packs", "6-Week Momentum", "Online coaching"],
    capacity: [
      { label: "Kickstart", filled: 2, total: 4 },
      { label: "Challenge", filled: 3, total: 5 },
    ],
    clients: { active: 7, completing: 2, continuation: 1 },
    earningsCents: { earned: 248600, pending: 79800, potential: 328400 },
    signals: {
      acceptance: "Strong",
      packCompletion: "92%",
      ongoing: "46%",
      support: "4.5 / 5",
    },
  },
  {
    accepting: ["6-Week Momentum", "12-Week Transformation"],
    capacity: [
      { label: "Momentum", filled: 3, total: 4 },
      { label: "Transformation", filled: 1, total: 3 },
    ],
    clients: { active: 9, completing: 1, continuation: 2 },
    earningsCents: { earned: 312400, pending: 64200, potential: 289500 },
    signals: {
      acceptance: "Reliable",
      packCompletion: "88%",
      ongoing: "51%",
      support: "4.7 / 5",
    },
  },
  {
    accepting: ["Kickstart Packs", "Online coaching"],
    capacity: [
      { label: "Kickstart", filled: 1, total: 4 },
      { label: "Online", filled: 4, total: 6 },
    ],
    clients: { active: 5, completing: 0, continuation: 1 },
    earningsCents: { earned: 178300, pending: 42500, potential: 196400 },
    signals: {
      acceptance: "Watch",
      packCompletion: "81%",
      ongoing: "38%",
      support: "4.3 / 5",
    },
  },
];

function RosterBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function EarningsRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "primary" | "warm" | "muted";
}) {
  const cls =
    tone === "primary"
      ? "text-primary"
      : tone === "warm"
        ? "text-[color:var(--warm)]"
        : "text-foreground/80";
  return (
    <li className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-mono font-semibold tabular-nums ${cls}`}>{value}</span>
    </li>
  );
}

function SignalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/30 pb-1 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground/90">{value}</span>
    </div>
  );
}


function HealthRow({ label, value, tone }: { label: string; value: string; tone: "good" | "warn" }) {
  const cls = tone === "good" ? "text-primary" : "text-[color:var(--warm)]";
  return (
    <li className="flex items-center justify-between border-b border-border/30 pb-1.5 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-mono font-semibold tabular-nums ${cls}`}>{value}</span>
    </li>
  );
}

function DimensionRow({ name, state, tone }: { name: string; state: string; tone: "good" | "warn" | "ok" }) {
  const cls =
    tone === "good"
      ? "text-primary"
      : tone === "warn"
        ? "text-[color:var(--warm)]"
        : "text-muted-foreground";
  return (
    <div className="flex items-center justify-between">
      <span className="text-foreground/80">{name}</span>
      <span className={`text-xs font-medium ${cls}`}>{state}</span>
    </div>
  );
}

function SplitCard({
  tone,
  label,
  value,
  sub,
  why,
}: {
  tone: "primary" | "warm" | "default";
  label: string;
  value: string;
  sub: string;
  why: string;
}) {
  const cls =
    tone === "primary"
      ? "border-primary/40 bg-primary/5"
      : tone === "warm"
        ? "border-warm/30 bg-warm/5"
        : "border-border bg-card";
  const accent =
    tone === "primary"
      ? "text-primary"
      : tone === "warm"
        ? "text-[color:var(--warm)]"
        : "text-foreground";
  return (
    <Card className={`p-5 ${cls}`}>
      <p className={`text-xs uppercase tracking-wider ${accent}`}>{label}</p>
      <p className="mt-2 font-mono text-3xl font-semibold tabular-nums">
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
      <p className="mt-3 border-t border-border/60 pt-3 text-[11px] text-muted-foreground">
        Why this matters: {why}
      </p>
    </Card>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    paid: "border-primary/40 bg-primary/10 text-primary",
    succeeded: "border-primary/40 bg-primary/10 text-primary",
    pending: "border-warm/40 bg-warm/10 text-[color:var(--warm)]",
    allocated: "border-primary/40 bg-primary/10 text-primary",
  };
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${
        map[status] ?? "border-border bg-secondary text-muted-foreground"
      }`}
    >
      {status}
    </span>
  );
}
