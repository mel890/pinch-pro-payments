import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Check, CalendarClock, RefreshCw } from "lucide-react";
import { formatAUD } from "@/lib/money";
import {
  useJourney,
  journey,
  ONGOING,
  KICKSTART,
  MEMBER,
  TRAINER,
} from "@/lib/journey-store";

export const Route = createFileRoute("/ongoing")({
  head: () => ({
    meta: [
      { title: "Start ongoing coaching — VezaPT Pay" },
      {
        name: "description",
        content:
          "Alex reviews Sarah's twice-weekly coaching recommendation at $180 per week and starts recurring billing through Pinch.",
      },
      { property: "og:title", content: "Start ongoing coaching — VezaPT Pay" },
      {
        property: "og:description",
        content:
          "Recurring weekly coaching with transparent pricing, pause and cancellation terms.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OngoingBilling,
});

function OngoingBilling() {
  const s = useJourney();
  const [starting, setStarting] = useState(false);

  return (
    <div className="min-h-screen bg-background pb-20 text-foreground">
      <div className="mx-auto max-w-3xl px-5 pt-10 sm:px-8">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {MEMBER.name} · recommendation from {TRAINER.name}
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
          Keep going, twice a week
        </h1>

        {!s.recommended ? (
          <Card className="mt-6 border-border p-5">
            <p className="text-sm text-muted-foreground">
              {TRAINER.first} hasn't sent a recommendation yet.
            </p>
            <Button asChild size="sm" className="mt-3">
              <Link to="/review">Open the progress review</Link>
            </Button>
          </Card>
        ) : s.ongoingActive ? (
          <Card className="mt-6 border-primary/40 bg-primary/5 p-6">
            <div className="flex items-center gap-2 text-primary">
              <Check className="size-5" />
              <p className="text-lg font-semibold">
                Your ongoing coaching is active.
              </p>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Your next two sessions are ready to schedule with {TRAINER.first}.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Box label="Weekly plan" value={formatAUD(ONGOING.weeklyCents)} />
              <Box label="Starts" value={ONGOING.startDate} />
              <Box label="Next review" value={ONGOING.nextReview} />
            </div>
            <Button asChild className="mt-5">
              <Link to="/dashboard">
                See the manager impact view <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
          </Card>
        ) : (
          <>
            <Card className="mt-6 border-primary/30 bg-[image:var(--gradient-hero)] p-6">
              <Badge className="border border-primary/40 bg-primary/10 text-primary">
                From {TRAINER.first}
              </Badge>
              <p className="mt-3 text-base leading-relaxed">
                You've made a strong start. Training twice each week will give
                you the support and repetition to build strength, become
                confident using the gym independently and keep progressing.
              </p>
            </Card>

            <Card className="mt-4 border-border p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">{ONGOING.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    2 sessions weekly with {TRAINER.first}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-3xl font-semibold tabular-nums">
                    {formatAUD(ONGOING.weeklyCents)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    per week, recurring
                  </p>
                </div>
              </div>

              <ul className="mt-4 space-y-2">
                {ONGOING.includes.map((i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    {i}
                  </li>
                ))}
              </ul>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <Box label="Start date" value={ONGOING.startDate} />
                <Box label="Billing" value="Weekly, recurring" />
                <Box label="Next progress review" value={ONGOING.nextReview} />
              </div>

              <div className="mt-4 rounded-xl border border-border bg-card/60 p-4 text-sm text-muted-foreground">
                <p className="flex items-center gap-1.5 font-medium text-foreground">
                  <CalendarClock className="size-4" /> Pause and cancellation
                </p>
                <p className="mt-1">
                  Pause for up to 4 weeks a year with 7 days' notice. Cancel any
                  time with 7 days' notice — you keep any sessions already paid
                  for.
                </p>
              </div>

              <Button
                size="lg"
                className="mt-5 w-full shadow-[var(--shadow-soft)]"
                disabled={starting}
                onClick={() => {
                  setStarting(true);
                  setTimeout(() => {
                    journey.startOngoing();
                    setStarting(false);
                  }, 900);
                }}
              >
                <RefreshCw className="mr-2 size-4" />
                {starting ? "Setting up recurring billing…" : "Start ongoing coaching with Pinch"}
              </Button>
            </Card>
          </>
        )}

        <Card className="mt-6 border-border p-5">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            How the two payments differ
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-semibold">
                Kickstart · gym-promoted product
              </p>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li>One-off {formatAUD(KICKSTART.priceCents)} payment</li>
                <li>{formatAUD(KICKSTART.trainerPayoutCents)} trainer payout</li>
                <li>{formatAUD(KICKSTART.clubFeeCents)} club campaign fee</li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold">
                Ongoing coaching · trainer-owned plan
              </p>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li>{formatAUD(ONGOING.weeklyCents)} weekly, recurring</li>
                <li>No ongoing club campaign fee</li>
                <li>Gym continues receiving trainer rent</li>
                <li>Processing and VezaPT fees shown on every invoice</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Box({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card/60 p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}
