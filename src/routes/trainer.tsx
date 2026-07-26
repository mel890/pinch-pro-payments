import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  getSnapshot,
  ackSession,
  completeSession,
  assignNextSession,
  DEMO_TRAINER_SARAH,
  tierFor,
} from "@/lib/vezapt-live.functions";
import { formatAUD } from "@/lib/money";
import {
  TrendingUp,
  Trophy,
  Clock,
  CheckCircle2,
  Play,
  Plus,
  Heart,
  Users,
  QrCode,
  CalendarPlus,
  Quote,
  RefreshCw,
  ScanLine,
  ArrowRight,
  Inbox,
  Sparkles,
  Send,
  FastForward,
  BellRing,
} from "lucide-react";
import { CoachMeJourney } from "@/components/coach-me-journey";
import {
  useJourney,
  journey,
  activeSession,
  confirmedCount,
  releasedPayoutCents,
  SESSION_STATUS_LABEL,
  MEMBER,
  TRAINER,
  KICKSTART,
  ONGOING,
  BEFORE,
  AFTER,
} from "@/lib/journey-store";

export const Route = createFileRoute("/trainer")({
  head: () => ({
    meta: [
      { title: "Sarah — Trainer dashboard · VezaPT Pay" },
      {
        name: "description",
        content:
          "Sarah's coaching-led dashboard: earnings, verified sessions, client impact and the next coaching focus for the week.",
      },
      { property: "og:title", content: "Sarah — Trainer dashboard · VezaPT Pay" },
      {
        property: "og:description",
        content:
          "Coaching, income and impact — Sarah's trainer view for the VezaPT Pay hackathon demo.",
      },
    ],
  }),
  loader: async ({ context }) =>
    context.queryClient.ensureQueryData({
      queryKey: ["snapshot"],
      queryFn: () => getSnapshot(),
      staleTime: 0,
    }),
  component: TrainerScreen,
});

// Human context for known demo members. Illustrative only.
const CLIENT_CONTEXT: Record<
  string,
  { goal: string; plan: string; focus: string; nextSession: string }
> = {
  Alex: {
    goal: "Build confidence using free weights",
    plan: "2× weekly",
    focus: "Lower-body strength",
    nextSession: "Not booked",
  },
  Casey: {
    goal: "Improve strength and energy",
    plan: "12 Week Elite",
    focus: "Completed a new movement confidently",
    nextSession: "Booked · Friday 6:30am",
  },
  Jordan: {
    goal: "Return to consistent training",
    plan: "10 Session Starter",
    focus: "Rebuild aerobic base",
    nextSession: "Not booked",
  },
};

function shortName(name?: string) {
  if (!name) return "Client";
  return name.replace("Test Member ", "").replace("Test PT ", "");
}

function TrainerScreen() {
  const { data: snap } = useSuspenseQuery({
    queryKey: ["snapshot"],
    queryFn: () => getSnapshot(),
    staleTime: 0,
    refetchInterval: 4000,
  });
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["snapshot"] });

  const trainerId =
    snap.trainers.find((t: any) => t.name?.toLowerCase().includes("sarah"))
      ?.id ?? DEMO_TRAINER_SARAH;
  const trainer = snap.trainers.find((t: any) => t.id === trainerId);
  const trainerFirst = shortName(trainer?.name) || "Sarah";

  const mySessions = snap.sessions.filter((s: any) => s.trainer_id === trainerId);
  const verified = mySessions.filter((s: any) => s.status === "confirmed");
  const queue = mySessions.filter((s: any) =>
    ["pending", "acknowledged"].includes(s.status),
  );
  const held = mySessions.filter((s: any) => s.status === "completed");

  const earnedCents = verified.reduce(
    (sum: number, s: any) => sum + Number(s.pt_amount_cents ?? 0),
    0,
  );
  const verifiedCount = verified.length;
  const clientsSupported = new Set(
    mySessions.map((s: any) => s.member_id),
  ).size;

  const currentTier = tierFor(Math.max(verifiedCount, 1), snap.tiers as any);
  const nextTier = (snap.tiers as any[])
    .slice()
    .sort((a, b) => a.sessions_min - b.sessions_min)
    .find((t) => t.sessions_min > verifiedCount);
  const toNext = nextTier ? nextTier.sessions_min - verifiedCount : 0;
  const progress = Math.min(100, (verifiedCount / 30) * 100);

  const ack = useMutation({
    mutationFn: (id: string) => ackSession({ data: { sessionId: id } }),
    onSuccess: invalidate,
  });
  const complete = useMutation({
    mutationFn: (id: string) => completeSession({ data: { sessionId: id } }),
    onSuccess: invalidate,
  });
  const nextInPack = useMutation({
    mutationFn: (packId: string) => assignNextSession({ data: { packId } }),
    onSuccess: invalidate,
  });

  return (
    <div className="min-h-screen bg-background text-foreground pb-16">
      <div className="mx-auto max-w-3xl px-5 pt-8 sm:px-8">
        {/* 1. Greeting */}
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Trainer · VezaPT Pay
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
              Good morning, {trainerFirst}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Here's what your coaching is helping people achieve.
            </p>
          </div>
          <Badge className="border border-warm/40 bg-warm/10 text-[color:var(--warm)]">
            Sandbox
          </Badge>
        </header>

        {/* 2. Earnings & production */}
        <Card className="mt-6 overflow-hidden border-border bg-[image:var(--gradient-hero)] p-6 sm:p-8">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Your work this cycle
          </p>
          <p className="mt-1 font-mono text-5xl font-semibold tracking-tight tabular-nums sm:text-6xl">
            {formatAUD(earnedCents)}
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MiniStat label="Confirmed sessions" value={String(verifiedCount)} />
            <MiniStat
              label="Current PT share"
              value={`${currentTier?.pt_split_pct ?? 40}%`}
            />
            <MiniStat label="Clients supported" value={String(clientsSupported)} />
            <MiniStat
              label="Held (awaiting confirm)"
              value={formatAUD(estimateHeld(held, currentTier?.pt_split_pct ?? 40))}
            />
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Grow your production while keeping clients engaged, supported and
            progressing.
          </p>
        </Card>

        {/* 2a. Client opportunities + obvious QR steps */}
        <OpportunityBoard onRefresh={invalidate} />
        {/* 2b. End of pack — recommend ongoing coaching to Alex */}
        <PackWrapUp />

        {/* 2. Recent client wins */}
        <section className="mt-10">
          <h2 className="text-base font-semibold">Recent client wins</h2>
          <div className="mt-3 space-y-2">
            {verified.slice(0, 5).map((s: any) => {
              const member = snap.members.find((m: any) => m.id === s.member_id);
              const first = shortName(member?.name).split(" ")[0];
              return (
                <Card key={s.id} className="flex items-center justify-between border-border p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-primary" />
                    <div>
                      <p className="text-sm">
                        {first} confirmed a session
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {s.pt_split_pct_at_time}% share applied
                      </p>
                    </div>
                  </div>
                  <p className="font-mono text-sm tabular-nums text-primary">
                    + {formatAUD(s.pt_amount_cents)}
                  </p>
                </Card>
              );
            })}
            {verified.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Once a client confirms, their win lands here.
              </p>
            )}
          </div>
        </section>

        {/* 3. Tier progress */}
        <Card className="mt-8 border-border p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-4 text-primary" />
              <h2 className="text-base font-semibold">Tier progress</h2>
            </div>
            {toNext > 0 ? (
              <Badge variant="secondary">
                {toNext} more confirmed sessions to reach your next earnings tier
              </Badge>
            ) : (
              <Badge className="border border-primary/40 bg-primary/10 text-primary">
                <Trophy className="mr-1 size-3" /> Peak tier
              </Badge>
            )}
          </div>
          <div className="mt-4">
            <Progress value={progress} className="h-2.5" />
            <div className="mt-2 flex justify-between font-mono text-[10px] text-muted-foreground">
              <span>0</span>
              <span>10</span>
              <span>20</span>
              <span>30+</span>
            </div>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {(snap.tiers as any[]).map((t) => (
              <TierChip
                key={t.id}
                min={t.sessions_min}
                max={t.sessions_max}
                pct={t.pt_split_pct}
                active={verifiedCount >= t.sessions_min && (t.sessions_max == null || verifiedCount <= t.sessions_max)}
              />
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Your higher rate applies only to sessions delivered after each
            threshold.
          </p>
        </Card>

        {/* 4. Session queue */}
        <section className="mt-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-primary" />
              <h2 className="text-base font-semibold">Session queue</h2>
            </div>
            <Button asChild size="sm" variant="ghost">
              <Link to="/">← Start</Link>
            </Button>
          </div>

          <div className="mt-3 space-y-3">
            {queue.length === 0 && held.length === 0 && (
              <Card className="border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No sessions yet. Send a client to <span className="text-foreground">/pay</span> to buy a pack.
              </Card>
            )}

            {queue.map((s: any) => {
              const member = snap.members.find((m: any) => m.id === s.member_id);
              const pack = snap.packs.find((p: any) => p.id === s.pack_id);
              const first = shortName(member?.name).split(" ")[0];
              const ctx = CLIENT_CONTEXT[first];
              return (
                <Card key={s.id} className="border-border p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold">
                        {shortName(member?.name)}
                      </p>
                      {ctx && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Goal: {ctx.goal} · {ctx.plan}
                        </p>
                      )}
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {pack?.name} · session {s.session_number_in_pack ?? "?"} /{" "}
                        {pack?.sessions_total}
                      </p>
                      {ctx && (
                        <p className="mt-1 text-xs text-foreground/80">
                          Today's focus: {ctx.focus}
                        </p>
                      )}
                    </div>
                    <p className="font-mono text-xs tabular-nums text-muted-foreground">
                      {formatAUD(s.session_value_cents)}
                    </p>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <StatusPill status={s.status} />
                    {s.status === "pending" && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => ack.mutate(s.id)}
                        disabled={ack.isPending}
                      >
                        Acknowledge
                      </Button>
                    )}
                    {s.status === "acknowledged" && (
                      <Button
                        size="sm"
                        onClick={() => complete.mutate(s.id)}
                        disabled={complete.isPending}
                      >
                        <Play className="mr-1 size-3.5" /> Complete session
                      </Button>
                    )}
                    <Button asChild size="sm" variant="ghost">
                      <Link to="/complete-session">
                        <QrCode className="mr-1 size-3.5" /> Confirmation QR
                      </Link>
                    </Button>
                  </div>
                </Card>
              );
            })}

            {held.map((s: any) => {
              const member = snap.members.find((m: any) => m.id === s.member_id);
              const first = shortName(member?.name).split(" ")[0];
              return (
                <Card
                  key={s.id}
                  className="border-warm/30 bg-warm/5 p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{shortName(member?.name)}</p>
                      <p className="text-xs text-[color:var(--warm)]">
                        Awaiting {first}'s confirmation
                      </p>
                    </div>
                    <p className="font-mono text-xs tabular-nums text-muted-foreground">
                      + {formatAUD(Math.round(Number(s.session_value_cents) * (currentTier?.pt_split_pct ?? 40) / 100))}
                    </p>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="size-3" /> Awaiting client confirmation
                    <Button asChild size="sm" variant="ghost" className="ml-auto">
                      <Link to="/complete-session">
                        <QrCode className="mr-1 size-3.5" /> Confirmation QR
                      </Link>
                    </Button>
                    <Button size="sm" variant="ghost" disabled>
                      <CalendarPlus className="mr-1 size-3.5" /> Book next session
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>

          {snap.packs
            .filter((p: any) => p.trainer_id === trainerId)
            .map((p: any) => {
              const packSessions = snap.sessions.filter(
                (s: any) => s.pack_id === p.id,
              );
              const canAdd =
                packSessions.length < p.sessions_total &&
                !packSessions.some((s: any) =>
                  ["pending", "acknowledged", "completed"].includes(s.status),
                );
              if (!canAdd) return null;
              return (
                <div key={p.id} className="mt-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={() => nextInPack.mutate(p.id)}
                    disabled={nextInPack.isPending}
                  >
                    <Plus className="mr-1 size-3.5" />
                    Assign next session for {p.name}
                  </Button>
                </div>
              );
            })}
        </section>

        {/* 5. Impact */}
        <section className="mt-8">
          <div className="flex items-center gap-2">
            <Heart className="size-4 text-primary" />
            <h2 className="text-base font-semibold">Your impact this cycle</h2>
            <Badge variant="secondary" className="ml-1 text-[10px] uppercase tracking-wider">
              Client impact demo data
            </Badge>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Card className="border-primary/25 bg-primary/5 p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Clients reported
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                <ImpactRow label="Clients supported" value="8" />
                <ImpactRow label="Training consistently" value="5" />
                <ImpactRow label="Greater confidence" value="4" />
                <ImpactRow label="More energy" value="3" />
                <ImpactRow label="Returned after losing momentum" value="2" />
                <ImpactRow
                  label="Average client support rating"
                  value="4.7 / 5"
                />
              </ul>
            </Card>

            <Card className="border-border bg-card p-5">
              <div className="flex items-center gap-2">
                <div className="grid size-9 place-items-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                  A
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    Alex's win
                  </p>
                  <p className="text-sm font-semibold">Alex Morgan</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2 text-sm italic text-foreground/90">
                <Quote className="mt-0.5 size-4 shrink-0 text-primary" />
                <p>
                  "I used the weights area by myself for the first time this
                  week."
                </p>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                This is the difference your coaching is making beyond the
                session.
              </p>
            </Card>
          </div>
        </section>

        {/* 6. Coach Me */}
        <CoachMeJourney />
      </div>
    </div>
  );
}

function estimateHeld(
  held: any[],
  ptPct: number,
): number {
  return held.reduce(
    (sum, s) =>
      sum + Math.round(Number(s.session_value_cents ?? 0) * ptPct / 100),
    0,
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/40 bg-card/60 p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 font-mono text-xl font-semibold tabular-nums">
        {value}
      </p>
    </div>
  );
}

function ImpactRow({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-center justify-between border-b border-border/30 pb-1.5 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono font-semibold tabular-nums text-foreground">
        {value}
      </span>
    </li>
  );
}

function TierChip({
  min,
  max,
  pct,
  active,
}: {
  min: number;
  max: number | null;
  pct: number;
  active: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs ${
        active
          ? "border-primary/50 bg-primary/10 text-foreground"
          : "border-border bg-secondary/40 text-muted-foreground"
      }`}
    >
      <span>
        Sessions {min}
        {max ? `–${max}` : "+"}
      </span>
      <span className="font-mono font-semibold">{pct}%</span>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const label: Record<string, string> = {
    pending: "Assigned",
    acknowledged: "Acknowledged",
    completed: "Awaiting confirmation",
    confirmed: "Confirmed",
    disputed: "Disputed",
  };
  const map: Record<string, string> = {
    pending: "border-muted-foreground/40 bg-secondary text-muted-foreground",
    acknowledged: "border-warm/40 bg-warm/10 text-[color:var(--warm)]",
    completed: "border-warm/40 bg-warm/10 text-[color:var(--warm)]",
    confirmed: "border-primary/40 bg-primary/10 text-primary",
    disputed: "border-destructive/40 bg-destructive/10 text-destructive",
  };
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${map[status] ?? map.pending}`}
    >
      {label[status] ?? status}
    </span>
  );
}

/** Live client opportunities + the obvious end-of-session QR steps for Sarah. */
function OpportunityBoard({ onRefresh }: { onRefresh: () => void }) {
  const s = useJourney();
  const session = activeSession(s);
  const waitingAcceptance = s.paid && !s.accepted && !s.declineReason;

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Inbox className="size-4 text-primary" />
          <h2 className="text-base font-semibold">Client opportunities</h2>
        </div>
        <Button size="sm" variant="outline" onClick={onRefresh}>
          <RefreshCw className="mr-1.5 size-3.5" /> Refresh
        </Button>
      </div>

      <div className="mt-3 space-y-3">
        {waitingAcceptance && (
          <Card className="border-primary/40 bg-primary/5 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Badge className="border border-primary/40 bg-primary/10 text-primary">
                  New prepaid opportunity
                </Badge>
                <p className="mt-2 font-semibold">
                  {MEMBER.name} purchased a {KICKSTART.name}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {s.intake.goal} · prefers {s.intake.days.join(", ")},{" "}
                  {s.intake.times}
                </p>
              </div>
              <p className="font-mono text-sm font-semibold tabular-nums text-primary">
                {formatAUD(KICKSTART.trainerPayoutCents)}
              </p>
            </div>
            <Button asChild size="sm" className="mt-4">
              <Link to="/opportunity">
                Review and accept <ArrowRight className="ml-1 size-3.5" />
              </Link>
            </Button>
          </Card>
        )}

        {s.accepted && session && (
          <Card className="border-border p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">
                  {MEMBER.name} · session {session.n} of 3
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {session.title} · {session.scheduledLabel}
                </p>
              </div>
              <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-primary">
                {SESSION_STATUS_LABEL[session.status]}
              </span>
            </div>
          </Card>
        )}

        {!waitingAcceptance && !s.accepted && (
          <Card className="border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No opportunities waiting. New prepaid clients appear here the moment
            they purchase.
          </Card>
        )}
      </div>

      {/* Obvious end-of-session steps */}
      <Card className="mt-4 border-primary/30 bg-primary/5 p-5">
        <div className="flex items-center gap-2">
          <ScanLine className="size-4 text-primary" />
          <h3 className="text-sm font-semibold uppercase tracking-wider">
            At the end of every session — scan {MEMBER.first}'s QR code
          </h3>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {MEMBER.first}'s code is unique and single-use. Scanning it is what
          releases your payout for that session.
        </p>

        <ol className="mt-4 space-y-3">
          <Step
            n={1}
            title={`Ask ${MEMBER.first} to open their check-in screen`}
            body="Their VezaPT app shows a one-time QR code and a 6-digit backup code."
            to="/checkin"
            cta="Open member QR screen"
          />
          <Step
            n={2}
            title={`Scan ${MEMBER.first}'s unique QR code`}
            body="Use your scanner. If the camera fails, key in the backup code instead."
            to="/scan"
            cta="Open scanner"
            primary
          />
          <Step
            n={3}
            title="Log the session"
            body="Confirm it was fully delivered, book the next session and note one win."
            to="/complete-session"
            cta="Log session"
          />
          <Step
            n={4}
            title={`${MEMBER.first} confirms`}
            body="Feedback (or a 12-hour no-dispute timeout) verifies the session and releases payment."
            to="/confirm-session/demo"
            cta="Member confirmation"
          />
        </ol>
      </Card>
    </section>
  );
}

function Step({
  n,
  title,
  body,
  to,
  cta,
  primary,
}: {
  n: number;
  title: string;
  body: string;
  to: string;
  cta: string;
  primary?: boolean;
}) {
  return (
    <li className="flex flex-wrap items-start gap-3 rounded-xl border border-border bg-card/70 p-4">
      <span
        className={`grid size-7 shrink-0 place-items-center rounded-full font-mono text-xs font-semibold ${
          primary
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-foreground"
        }`}
      >
        {n}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{body}</p>
      </div>
      <Button asChild size="sm" variant={primary ? "default" : "outline"}>
        <Link to={to}>
          {cta} <ArrowRight className="ml-1 size-3.5" />
        </Link>
      </Button>
    </li>
  );
}
