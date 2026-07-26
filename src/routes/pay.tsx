import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, CreditCard, ArrowRight, ShieldCheck } from "lucide-react";
import { formatAUD } from "@/lib/money";
import {
  useJourney,
  journey,
  KICKSTART,
  INTAKE,
  CLUB,
  MEMBER,
} from "@/lib/journey-store";

export const Route = createFileRoute("/pay")({
  head: () => ({
    meta: [
      { title: "PT Kickstart Pack — start with clarity | VezaPT Pay" },
      {
        name: "description",
        content:
          "Buy the 3-session PT Kickstart Pack: goal and confidence review, personalised starting programme, habit tracker and a recommended next step.",
      },
      { property: "og:title", content: "PT Kickstart Pack — VezaPT Pay" },
      {
        property: "og:description",
        content:
          "Three 45-minute PT sessions, a personalised starting programme and a clear next step for $249.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MemberPurchase,
});

const FIELDS: { label: string; value: string }[] = [
  { label: "Primary goal", value: INTAKE.goal },
  { label: "Training experience", value: INTAKE.experience },
  { label: "Preferred days", value: INTAKE.days },
  { label: "Preferred times", value: INTAKE.times },
  { label: "Coaching style", value: INTAKE.style },
  { label: "Confidence today", value: `${INTAKE.confidence}/10` },
  { label: "Current gym attendance", value: `${INTAKE.attendance} visits per week` },
];

function MemberPurchase() {
  const s = useJourney();
  const [paying, setPaying] = useState(false);

  const buy = () => {
    setPaying(true);
    setTimeout(() => {
      journey.pay();
      setPaying(false);
    }, 900);
  };

  return (
    <div className="min-h-screen bg-background pb-20 text-foreground">
      <div className="mx-auto max-w-5xl px-5 pt-10 sm:px-8">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {CLUB.name} · member offer
        </p>
        <h1 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
          Start with clarity, confidence and a plan.
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Three coached sessions with a {CLUB.name} trainer, a programme built
          around your goal, and a clear recommendation for what comes next.
        </p>

        {s.paid ? (
          <Card className="mt-8 border-primary/40 bg-primary/5 p-6">
            <div className="flex items-center gap-2 text-primary">
              <Check className="size-5" />
              <p className="text-lg font-semibold">Payment confirmed.</p>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              We're finding the right trainer for you. You'll hear from your
              coach shortly to book session one.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Paid label="Payment status" value="Paid" />
              <Paid label="Amount" value={formatAUD(KICKSTART.priceCents)} />
            </div>
            <Button asChild className="mt-5">
              <Link to="/match">
                Next: VezaPT recommends a trainer{" "}
                <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>

          </Card>
        ) : (
          <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
            <Card className="border-primary/30 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Badge className="border border-primary/40 bg-primary/10 text-primary">
                    Entry product
                  </Badge>
                  <h2 className="mt-2 text-2xl font-semibold">{KICKSTART.name}</h2>
                </div>
                <div className="text-right">
                  <p className="font-mono text-3xl font-semibold tabular-nums">
                    {formatAUD(KICKSTART.priceCents)}
                  </p>
                  <p className="text-xs text-muted-foreground">one-off payment</p>
                </div>
              </div>

              <ul className="mt-5 space-y-2">
                {KICKSTART.includes.map((i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    {i}
                  </li>
                ))}
              </ul>

              <Button
                size="lg"
                className="mt-6 w-full shadow-[var(--shadow-soft)]"
                onClick={buy}
                disabled={paying}
              >
                <CreditCard className="mr-2 size-4" />
                {paying ? "Opening secure checkout…" : "Buy with Pinch"}
              </Button>
              <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="size-3.5" /> Secure Australian payment
                processing. Sandbox for this demo.
              </p>
            </Card>

            <Card className="border-border p-6">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                About you · {MEMBER.name}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Your answers go straight to the trainer we match you with.
              </p>
              <dl className="mt-4 space-y-3">
                {FIELDS.map((f) => (
                  <div key={f.label}>
                    <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      {f.label}
                    </dt>
                    <dd className="mt-0.5 rounded-lg border border-border bg-card/70 px-3 py-2 text-sm">
                      {f.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function Paid({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card/60 p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-mono text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}
