import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Clock,
  Target,
  Calendar,
  Dumbbell,
  DollarSign,
  UserRound,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/opportunity")({
  head: () => ({
    meta: [
      { title: "New paid coaching opportunity — VezaPT Pay" },
      {
        name: "description",
        content:
          "A member has bought a coaching pack matched to your speciality. Review the payout, commitment and first session target before you accept.",
      },
      { property: "og:title", content: "New paid coaching opportunity — VezaPT Pay" },
      {
        property: "og:description",
        content:
          "Review the member, goal, times and payout, then accept or decline the opportunity.",
      },
    ],
  }),
  component: OpportunityScreen,
});

type Stage = "review" | "declining" | "accepted" | "declined";

const DECLINE_REASONS = [
  "Times do not match",
  "Outside my scope",
  "At capacity",
  "Existing conflict",
  "Other",
];

function OpportunityScreen() {
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>("review");
  const [reason, setReason] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-2xl px-5 pt-10 pb-16 sm:px-8">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              VezaPT Pay · Trainer
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              New paid coaching opportunity
            </h1>
          </div>
          <Badge className="border border-warm/40 bg-warm/10 text-[color:var(--warm)] hover:bg-warm/10">
            <Clock className="mr-1 size-3" /> 2h left
          </Badge>
        </header>

        {stage === "review" && (
          <Card className="mt-6 border-primary/30 bg-[image:var(--gradient-hero)] p-6">
            <p className="text-sm font-semibold text-primary">
              Alex has purchased a PT Kickstart Pack
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Matched to you based on availability, speciality and member preference.
            </p>

            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field icon={<Target className="size-4" />} label="Goal">
                Build strength and feel more confident in the gym
              </Field>
              <Field icon={<Calendar className="size-4" />} label="Preferred times">
                Tuesday or Thursday, 6:00–8:00 pm
              </Field>
              <Field icon={<UserRound className="size-4" />} label="Experience">
                Beginner
              </Field>
              <Field icon={<Dumbbell className="size-4" />} label="Programme">
                3 × 45-minute sessions
              </Field>
              <Field icon={<DollarSign className="size-4" />} label="Your payout" highlight>
                <span className="font-mono text-lg font-semibold text-foreground">$199</span>
              </Field>
              <Field icon={<DollarSign className="size-4" />} label="Club campaign fee">
                <span className="font-mono text-foreground">$50</span>
              </Field>
              <Field icon={<Calendar className="size-4" />} label="First session target">
                Within seven days
              </Field>
              <Field icon={<Clock className="size-4" />} label="Response deadline">
                2 hours remaining
              </Field>
            </dl>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <Button
                size="lg"
                className="h-12 flex-1 text-base font-semibold shadow-[var(--shadow-soft)]"
                onClick={() => setStage("accepted")}
              >
                <CheckCircle2 className="mr-2 size-5" /> Accept opportunity
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12"
                onClick={() => setStage("declining")}
              >
                Decline
              </Button>
            </div>

            <button className="mt-4 w-full text-center text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground">
              View full member profile
            </button>
          </Card>
        )}

        {stage === "declining" && (
          <Card className="mt-6 border-border p-6">
            <p className="text-sm font-semibold">Let the club know why</p>
            <p className="mt-1 text-xs text-muted-foreground">
              A suitable decline immediately reoffers the member to the next
              trainer, so they never wait.
            </p>

            <div className="mt-5 space-y-2">
              {DECLINE_REASONS.map((r) => (
                <label
                  key={r}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition ${
                    reason === r
                      ? "border-primary/60 bg-primary/10 text-foreground"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="decline-reason"
                    className="size-4 accent-[color:var(--primary)]"
                    checked={reason === r}
                    onChange={() => setReason(r)}
                  />
                  {r}
                </label>
              ))}
            </div>

            <div className="mt-6 flex gap-2">
              <Button
                size="lg"
                className="h-12 flex-1 font-semibold"
                disabled={!reason}
                onClick={() => setStage("declined")}
              >
                Confirm decline
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="h-12"
                onClick={() => setStage("review")}
              >
                Back
              </Button>
            </div>
          </Card>
        )}

        {stage === "accepted" && (
          <Card className="mt-6 border-primary/40 bg-primary/10 p-6">
            <div className="flex items-center gap-2 text-primary">
              <CheckCircle2 className="size-5" />
              <p className="font-semibold">Opportunity accepted</p>
            </div>
            <p className="mt-2 text-sm text-foreground/80">
              Alex has been notified. Reach out to book the first session within
              seven days — the payout releases as each session is confirmed.
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Button asChild size="lg" className="h-12 flex-1 font-semibold">
                <Link to="/trainer">
                  Go to your dashboard <ArrowRight className="ml-1.5 size-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-12"
                onClick={() => setStage("review")}
              >
                View again
              </Button>
            </div>
          </Card>
        )}

        {stage === "declined" && (
          <Card className="mt-6 border-border p-6">
            <p className="text-sm font-semibold">Thanks — we've noted "{reason}".</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Alex is already being reoffered to the next best-matched trainer.
              No time lost.
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Button asChild size="lg" className="h-12 flex-1 font-semibold">
                <Link to="/trainer">
                  Back to dashboard <ArrowRight className="ml-1.5 size-4" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="h-12"
                onClick={() => {
                  setReason(null);
                  setStage("review");
                }}
              >
                Reopen opportunity
              </Button>
            </div>
          </Card>
        )}

        <div className="mt-8 text-center">
          <button
            onClick={() => navigate({ to: "/" })}
            className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            ← Back to overview
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  icon,
  label,
  children,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        highlight
          ? "border-primary/40 bg-primary/5"
          : "border-border/60 bg-background/40"
      }`}
    >
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        <span className="text-primary">{icon}</span> {label}
      </div>
      <div className="mt-2 text-sm text-foreground">{children}</div>
    </div>
  );
}
