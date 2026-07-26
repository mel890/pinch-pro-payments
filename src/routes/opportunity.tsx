import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Check, Clock, Sparkles, X } from "lucide-react";
import { formatAUD } from "@/lib/money";
import {
  useJourney,
  journey,
  KICKSTART,
  MEMBER,
  TRAINER,
  TRAINER_BRIEF,
} from "@/lib/journey-store";

export const Route = createFileRoute("/opportunity")({
  head: () => ({
    meta: [
      { title: "Paid coaching opportunity — VezaPT Pay" },
      {
        name: "description",
        content:
          "Sarah reviews a paid Kickstart opportunity: member goal, preferred times, full commitment and a $199 payout, then accepts or declines with a reason.",
      },
      { property: "og:title", content: "Paid coaching opportunity — VezaPT Pay" },
      {
        property: "og:description",
        content:
          "A trainer-facing paid opportunity with the full commitment and payout shown up front.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Opportunity,
});

const REASONS = [
  "Times do not match",
  "Outside scope",
  "At capacity",
  "Conflict",
  "Other",
];

function Opportunity() {
  const s = useJourney();
  const [declining, setDeclining] = useState(false);

  if (!s.paid) {
    return (
      <Shell>
        <Card className="border-border p-6">
          <p className="text-lg font-semibold">No opportunity waiting</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Opportunities appear once a member purchases a gym-promoted product.
          </p>
          <Button asChild className="mt-4">
            <Link to="/pay">Start with Alex's purchase</Link>
          </Button>
        </Card>
      </Shell>
    );
  }

  if (s.accepted) {
    return (
      <Shell>
        <Card className="border-primary/40 bg-primary/5 p-6">
          <div className="flex items-center gap-2 text-primary">
            <Check className="size-5" />
            <p className="text-lg font-semibold">
              {MEMBER.first} is now your Kickstart client.
            </p>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Contact them and book session one. Preferred times:{" "}
            {s.intake.days.join(", ")}, {s.intake.times}.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Stat label="Contracted payout" value={formatAUD(KICKSTART.trainerPayoutCents)} />
            <Stat label="Released on confirmation" value="Per session" />
          </div>
          <Button asChild className="mt-5">
            <Link to="/journey/alex">
              Open Alex's journey <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
        </Card>
      </Shell>
    );
  }

  if (s.declineReason) {
    return (
      <Shell>
        <Card className="border-border p-6">
          <p className="text-lg font-semibold">Opportunity declined</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Reason recorded: {s.declineReason}. VezaPT is offering it to the next
            suitable trainer with matching capacity.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => journey.decline("")}
          >
            Undo for the demo
          </Button>
        </Card>
      </Shell>
    );
  }

  return (
    <Shell>
      <Card className="border-primary/30 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Badge className="border border-primary/40 bg-primary/10 text-primary">
              New prepaid client opportunity
            </Badge>
            <h2 className="mt-2 text-2xl font-semibold">
              {MEMBER.name} purchased a {KICKSTART.name}
            </h2>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
            <Clock className="size-3.5" /> Response deadline: 2 hours
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Field label="Goal" value={s.intake.goal} />
          <Field label="Experience" value={s.intake.experience} />
          <Field
            label="Preferred times"
            value={`${s.intake.days.join(", ")}, ${s.intake.times}`}
          />
          <Field label="Coaching preference" value={s.intake.style} />
          <Field label="Confidence today" value={`${s.intake.confidence}/10`} />
          <Field
            label="Injuries / conditions"
            value={s.intake.conditions.join(", ") || "None reported"}
          />
        </div>

        {s.intake.injuryNotes && (
          <div className="mt-3 rounded-xl border border-warning/30 bg-warning/5 p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Health notes from {MEMBER.first}
            </p>
            <p className="mt-1 text-sm">{s.intake.injuryNotes}</p>
          </div>
        )}


        <div className="mt-5 rounded-xl border border-primary/30 bg-primary/5 p-4">
          <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-primary">
            <Sparkles className="size-3.5" /> AI-generated trainer brief
          </p>
          <p className="mt-2 text-sm leading-relaxed">{TRAINER_BRIEF}</p>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Stat label="Your commitment" value="3 × 45 min" />
          <Stat
            label="Total trainer payout"
            value={formatAUD(KICKSTART.trainerPayoutCents)}
            accent
          />
          <Stat label="Club campaign fee" value={formatAUD(KICKSTART.clubFeeCents)} />
        </div>


        <div className="mt-6 flex flex-wrap gap-2">
          <Button size="lg" onClick={() => journey.accept()} className="shadow-[var(--shadow-soft)]">
            <Check className="mr-2 size-4" /> Accept opportunity
          </Button>
          <Button size="lg" variant="outline" onClick={() => setDeclining((v) => !v)}>
            <X className="mr-2 size-4" /> Decline
          </Button>
        </div>

        {declining && (
          <div className="mt-4 rounded-xl border border-border bg-card/60 p-4">
            <p className="text-sm font-medium">Why are you declining?</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {REASONS.map((r) => (
                <Button
                  key={r}
                  size="sm"
                  variant="secondary"
                  onClick={() => journey.decline(r)}
                >
                  {r}
                </Button>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Declined or timed-out opportunities are offered automatically to
              the next suitable trainer.
            </p>
          </div>
        )}
      </Card>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background pb-20 text-foreground">
      <div className="mx-auto max-w-3xl px-5 pt-10 sm:px-8">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {TRAINER.name} · opportunities
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Paid coaching opportunity
        </h1>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card/60 p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm">{value}</p>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        accent ? "border-primary/40 bg-primary/5" : "border-border bg-card/60"
      }`}
    >
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-1 font-mono text-lg font-semibold tabular-nums ${
          accent ? "text-primary" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}
