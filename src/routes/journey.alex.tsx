import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, CalendarCheck, ArrowRight } from "lucide-react";
import { formatAUD } from "@/lib/money";
import { CoachMeJourney } from "@/components/coach-me-journey";
import {
  useJourney,
  journey,
  confirmedCount,
  releasedPayoutCents,
  KICKSTART,
  INTAKE,
  MEMBER,
  TRAINER,
} from "@/lib/journey-store";

export const Route = createFileRoute("/journey/alex")({
  head: () => ({
    meta: [
      { title: "Alex's Kickstart journey — VezaPT Pay" },
      {
        name: "description",
        content:
          "Three coached sessions — Understand, Personalise, Review and recommend — tracked from booking to member confirmation and payout release.",
      },
      { property: "og:title", content: "Alex's Kickstart journey — VezaPT Pay" },
      {
        property: "og:description",
        content:
          "Session-by-session delivery, member confirmation and payout release for one Kickstart client.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ClientJourney,
});

function ClientJourney() {
  const s = useJourney();
  const done = confirmedCount(s);

  return (
    <div className="min-h-screen bg-background pb-20 text-foreground">
      <div className="mx-auto max-w-4xl px-5 pt-10 sm:px-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Kickstart client
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
              {MEMBER.name}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              {INTAKE.goal}. Beginner · prefers {INTAKE.days}, {INTAKE.times} ·{" "}
              {INTAKE.style.toLowerCase()} coaching.
            </p>
          </div>
          <Badge className="border border-primary/40 bg-primary/10 text-primary">
            With {TRAINER.name}
          </Badge>
        </header>

        {!s.accepted && (
          <Card className="mt-6 border-border p-5">
            <p className="text-sm text-muted-foreground">
              This journey starts once the opportunity is accepted.
            </p>
            <Button asChild className="mt-3" size="sm">
              <Link to="/opportunity">Open the opportunity</Link>
            </Button>
          </Card>
        )}

        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <Metric label="Sessions confirmed" value={`${done} of 3`} />
          <Metric
            label="Payout released"
            value={formatAUD(releasedPayoutCents(s))}
            accent
          />
          <Metric
            label="Contracted payout"
            value={formatAUD(KICKSTART.trainerPayoutCents)}
          />
        </section>

        <Progress value={(done / 3) * 100} className="mt-4 h-1.5" />

        <section className="mt-6 space-y-4">
          {s.sessions.map((sess) => {
            const locked =
              !s.accepted ||
              (sess.n > 1 && !s.sessions[sess.n - 2].confirmed);
            return (
              <Card
                key={sess.n}
                className={`p-5 ${
                  sess.confirmed
                    ? "border-primary/40 bg-primary/5"
                    : locked
                      ? "border-border bg-card/40 opacity-70"
                      : "border-border"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {sess.confirmed ? (
                      <CheckCircle2 className="mt-0.5 size-5 text-primary" />
                    ) : (
                      <Circle className="mt-0.5 size-5 text-muted-foreground/60" />
                    )}
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Session {sess.n}
                      </p>
                      <p className="text-lg font-semibold">{sess.title}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Pill on={sess.booked}>Booked</Pill>
                    <Pill on={sess.completed}>Completed</Pill>
                    <Pill on={sess.confirmed}>Member confirmed</Pill>
                  </div>
                </div>

                <p className="mt-4 text-[10px] uppercase tracking-wider text-muted-foreground">
                  Purpose
                </p>
                <ul className="mt-1.5 grid gap-1.5 sm:grid-cols-2">
                  {sess.purpose.map((a) => (
                    <li
                      key={a}
                      className="flex gap-2 text-sm text-muted-foreground"
                    >
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary/60" />
                      {a}
                    </li>
                  ))}
                </ul>

                {!locked && !sess.confirmed && (
                  <div className="mt-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
                    <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-primary">
                      <Sparkles className="size-3.5" /> AI preparation prompts
                    </p>
                    <ul className="mt-1.5 space-y-1">
                      {sess.prep.map((p) => (
                        <li key={p} className="text-sm">
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}


                {sess.win && (
                  <p className="mt-3 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
                    <span className="text-[10px] uppercase tracking-wider text-primary">
                      Biggest win ·{" "}
                    </span>
                    {sess.win}
                  </p>
                )}

                {!locked && !sess.confirmed && (
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {!sess.booked && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => journey.update(sess.n, { booked: true })}
                      >
                        <CalendarCheck className="mr-1.5 size-4" /> Book session
                      </Button>
                    )}
                    {sess.booked && !sess.completed && (
                      <Button
                        size="sm"
                        onClick={() => journey.update(sess.n, { completed: true })}
                      >
                        Record session delivered
                      </Button>
                    )}
                    {sess.completed && (
                      <Button asChild size="sm" variant="secondary">
                        <Link to="/confirm-session/demo">
                          Send to {MEMBER.first} to confirm{" "}
                          <ArrowRight className="ml-1 size-3.5" />
                        </Link>
                      </Button>
                    )}
                    <span className="text-xs text-muted-foreground">
                      Releases {formatAUD(sess.payoutCents)} on confirmation
                    </span>
                  </div>
                )}
              </Card>
            );
          })}
        </section>

        {done === 3 && (
          <Card className="mt-6 border-primary/40 bg-primary/5 p-5">
            <p className="text-lg font-semibold">Pack delivered — 3 of 3 confirmed</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Complete Alex's progress review and recommend one ongoing option.
            </p>
            <Button asChild className="mt-4">
              <Link to="/review">
                Open progress review <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
          </Card>
        )}

        <div className="mt-6">
          <CoachMeJourney />
        </div>
      </div>
    </div>
  );
}

function Pill({ on, children }: { on: boolean; children: React.ReactNode }) {
  return (
    <span
      className={`rounded-full border px-2.5 py-0.5 text-[11px] ${
        on
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-border text-muted-foreground"
      }`}
    >
      {children}
    </span>
  );
}

function Metric({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <Card className={`p-4 ${accent ? "border-primary/40 bg-primary/5" : "border-border"}`}>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-1 font-mono text-2xl font-semibold tabular-nums ${
          accent ? "text-primary" : ""
        }`}
      >
        {value}
      </p>
    </Card>
  );
}
