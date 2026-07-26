import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Check, TrendingUp } from "lucide-react";
import { formatAUD } from "@/lib/money";
import { CoachMeJourney } from "@/components/coach-me-journey";
import {
  useJourney,
  journey,
  confirmedCount,
  BEFORE,
  AFTER,
  ONGOING,
  MEMBER,
  TRAINER,
} from "@/lib/journey-store";

export const Route = createFileRoute("/review")({
  head: () => ({
    meta: [
      { title: "Alex's progress review — VezaPT Pay" },
      {
        name: "description",
        content:
          "Confidence 5 → 8, weekly visits 1.4 → 2.6, programme clarity 4 → 8. One clear ongoing coaching recommendation follows the Kickstart pack.",
      },
      { property: "og:title", content: "Alex's progress review — VezaPT Pay" },
      {
        property: "og:description",
        content:
          "Measured before-and-after progress that turns the next step into a coaching conversation.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProgressReview,
});

function ProgressReview() {
  const s = useJourney();
  const done = confirmedCount(s);

  return (
    <div className="min-h-screen bg-background pb-20 text-foreground">
      <div className="mx-auto max-w-4xl px-5 pt-10 sm:px-8">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Session 3 · Review and recommend
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
          {MEMBER.first}'s progress review
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Measured change across the Kickstart pack, prepared by {TRAINER.name}.
        </p>

        {done < 3 && (
          <Card className="mt-6 border-border p-5">
            <p className="text-sm text-muted-foreground">
              {done} of 3 sessions confirmed. The review unlocks the full
              recommendation once the pack is delivered — the numbers below are
              already tracking.
            </p>
            <Button asChild size="sm" className="mt-3">
              <Link to="/journey/alex">Continue delivering sessions</Link>
            </Button>
          </Card>
        )}

        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <Delta label="Confidence" before={`${BEFORE.confidence}/10`} after={`${AFTER.confidence}/10`} />
          <Delta label="Weekly visits" before={`${BEFORE.visits}`} after={`${AFTER.visits}`} />
          <Delta label="Programme clarity" before={`${BEFORE.clarity}/10`} after={`${AFTER.clarity}/10`} />
        </section>

        <section className="mt-4 grid gap-3 sm:grid-cols-2">
          <Card className="border-border p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Sessions completed
            </p>
            <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">
              {done} of 3
            </p>
          </Card>
          <Card className="border-border p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Wants ongoing support
            </p>
            <p className="mt-1 text-2xl font-semibold text-primary">Yes</p>
          </Card>
        </section>

        {s.sessions.some((x) => x.win) && (
          <Card className="mt-4 border-border p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Wins {MEMBER.first} recorded
            </p>
            <ul className="mt-2 space-y-1.5">
              {s.sessions
                .filter((x) => x.win)
                .map((x) => (
                  <li key={x.n} className="text-sm">
                    <span className="text-muted-foreground">
                      Session {x.n} ·{" "}
                    </span>
                    {x.win}
                  </li>
                ))}
            </ul>
          </Card>
        )}

        <Card className="mt-4 border-primary/30 bg-primary/5 p-5">
          <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-primary">
            <Sparkles className="size-3.5" /> AI-assisted summary
          </p>
          <p className="mt-2 text-sm leading-relaxed">{AI_SUMMARY}</p>
          <p className="mt-3 text-sm">
            <span className="text-muted-foreground">Suggested next step: </span>
            <span className="font-semibold text-primary">{ONGOING.name}</span>
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {TRAINER.first} makes the final recommendation.
          </p>
        </Card>

        <section className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <Card className="border-primary/30 bg-[image:var(--gradient-hero)] p-6">
            <Badge className="border border-primary/40 bg-primary/10 text-primary">
              Recommended next step
            </Badge>

            <h2 className="mt-2 text-2xl font-semibold">{ONGOING.name}</h2>
            <ul className="mt-4 space-y-2">
              {ONGOING.includes.map((i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                  {i}
                </li>
              ))}
            </ul>
            <p className="mt-4 font-mono text-3xl font-semibold tabular-nums">
              {formatAUD(ONGOING.weeklyCents)}
              <span className="ml-1 font-sans text-sm font-normal text-muted-foreground">
                per week
              </span>
            </p>

            {s.recommended ? (
              <p className="mt-4 flex items-center gap-2 text-sm text-primary">
                <Check className="size-4" /> Recommendation sent to{" "}
                {MEMBER.first}
              </p>
            ) : (
              <Button
                size="lg"
                className="mt-5 shadow-[var(--shadow-soft)]"
                disabled={done < 3}
                onClick={() => journey.recommend()}
              >
                <TrendingUp className="mr-2 size-4" /> Recommend to{" "}
                {MEMBER.first}
              </Button>
            )}

            {s.recommended && (
              <Button asChild variant="secondary" className="mt-4">
                <Link to="/ongoing">
                  Open Alex's plan screen <ArrowRight className="ml-1 size-4" />
                </Link>
              </Button>
            )}
          </Card>

          <CoachMeJourney />
        </section>
      </div>
    </div>
  );
}

function Delta({
  label,
  before,
  after,
}: {
  label: string;
  before: string;
  after: string;
}) {
  return (
    <Card className="border-border p-4">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="font-mono text-lg tabular-nums text-muted-foreground line-through decoration-1">
          {before}
        </span>
        <ArrowRight className="size-3.5 text-muted-foreground" />
        <span className="font-mono text-2xl font-semibold tabular-nums text-primary">
          {after}
        </span>
      </div>
    </Card>
  );
}
