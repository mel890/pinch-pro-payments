import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import {
  useJourney,
  journey,
  MATCH,
  INTAKE,
  MEMBER,
  TRAINER,
} from "@/lib/journey-store";

export const Route = createFileRoute("/match")({
  head: () => ({
    meta: [
      { title: "Best trainer match — VezaPT Pay" },
      {
        name: "description",
        content:
          "VezaPT recommends Sarah Marino for Alex's Kickstart Pack based on schedule fit, capacity, beginner strength experience and coaching style.",
      },
      { property: "og:title", content: "Best trainer match — VezaPT Pay" },
      {
        property: "og:description",
        content:
          "An AI-assisted, rules-based trainer recommendation with a manager override.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MatchScreen,
});

function MatchScreen() {
  const s = useJourney();
  const [selected, setSelected] = useState(TRAINER.name);

  if (!s.paid) {
    return (
      <Wrap>
        <Card className="border-border p-6">
          <p className="text-lg font-semibold">No match to make yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Matching starts the moment a member buys the Kickstart Pack.
          </p>
          <Button asChild className="mt-4" size="sm">
            <Link to="/pay">Open Alex's purchase</Link>
          </Button>
        </Card>
      </Wrap>
    );
  }

  return (
    <Wrap>
      <Card className="border-primary/30 bg-[image:var(--gradient-hero)] p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-primary">
            <Sparkles className="size-3.5" /> AI-assisted recommendation
          </span>
          <Badge className="border border-primary/40 bg-primary/10 text-primary">
            Match confidence: {MATCH.confidence}
          </Badge>
        </div>

        <p className="mt-4 text-[10px] uppercase tracking-wider text-muted-foreground">
          Best trainer match for {MEMBER.name}
        </p>
        <h2 className="mt-1 text-2xl font-semibold">{TRAINER.name}</h2>

        <ul className="mt-4 space-y-2">
          {MATCH.reasons.map((r) => (
            <li key={r} className="flex items-start gap-2 text-sm">
              <Check className="mt-0.5 size-4 shrink-0 text-primary" />
              {r}
            </li>
          ))}
        </ul>

        <div className="mt-5 rounded-xl border border-border bg-card/60 p-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Matched on deterministic rules
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {MATCH.rules.map((r) => (
              <span
                key={r}
                className="rounded-full border border-border px-2.5 py-0.5 text-[11px] text-muted-foreground"
              >
                {r}
              </span>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            A rules-based recommendation, not a trained predictive model. A
            manager can override it.
          </p>
        </div>

        <div className="mt-5">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Manager override
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {[TRAINER.name, ...MATCH.alternatives].map((name) => (
              <Button
                key={name}
                size="sm"
                variant={selected === name ? "default" : "outline"}
                onClick={() => setSelected(name)}
              >
                {name}
                {name === TRAINER.name ? " · recommended" : ""}
              </Button>
            ))}
          </div>
        </div>

        {s.matchConfirmed ? (
          <div className="mt-6">
            <p className="flex items-center gap-2 text-sm text-primary">
              <Check className="size-4" /> {selected} has been sent the prepaid
              opportunity.
            </p>
            <Button asChild className="mt-4">
              <Link to="/opportunity">
                Open the trainer's view <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
          </div>
        ) : (
          <Button
            size="lg"
            className="mt-6 shadow-[var(--shadow-soft)]"
            onClick={() => journey.confirmMatch()}
          >
            Send opportunity to {selected.split(" ")[0]}
          </Button>
        )}
      </Card>

      <Card className="mt-4 border-border p-5">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Why {TRAINER.first} fits {MEMBER.first}
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Fact label="Alex prefers" value={`${INTAKE.days}, ${INTAKE.times}`} />
          <Fact label="Sarah's availability" value="Tue/Thu evenings open" />
          <Fact label="Alex's experience" value={INTAKE.experience} />
          <Fact label="Sarah's speciality" value="Beginner strength" />
          <Fact label="Coaching preference" value={INTAKE.style} />
          <Fact label="Acceptance reliability" value="94% within 2 hours" />
        </div>
      </Card>
    </Wrap>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card/60 p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm">{value}</p>
    </div>
  );
}

function Wrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background pb-20 text-foreground">
      <div className="mx-auto max-w-3xl px-5 pt-10 sm:px-8">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          VezaPT matching
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
          Best trainer match
        </h1>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
