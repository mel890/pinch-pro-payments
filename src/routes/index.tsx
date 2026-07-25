import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  ShoppingBag,
  Handshake,
  CheckCircle2,
  Star,
  RefreshCw,
  Users,
  Wrench,
} from "lucide-react";
import { formatAUD } from "@/lib/money";
import {
  useJourney,
  confirmedCount,
  CLUB,
  MEMBER,
  TRAINER,
  KICKSTART,
  ONGOING,
} from "@/lib/journey-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VezaPT Pay — one member journey, end to end" },
      {
        name: "description",
        content:
          "Follow Alex Morgan from a $249 gym-promoted Kickstart Pack to twice-weekly recurring coaching with Sarah — purchase, match, delivery, confirmation, review and conversion.",
      },
      { property: "og:title", content: "VezaPT Pay — one member journey, end to end" },
      {
        property: "og:description",
        content:
          "A guided demo: Kickstart purchase, trainer match, three confirmed sessions, progress review and conversion to ongoing coaching.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const s = useJourney();
  const done = confirmedCount(s);

  const steps: {
    n: number;
    title: string;
    blurb: string;
    to: string;
    icon: typeof Users;
    done: boolean;
  }[] = [
    {
      n: 1,
      title: "Manager launches campaign",
      blurb: `${CLUB.name} promotes the Kickstart Pack to ${CLUB.members} members — capacity checked first.`,
      to: "/trainer-capacity",
      icon: Users,
      done: s.paid,
    },
    {
      n: 2,
      title: `${MEMBER.first} buys Kickstart`,
      blurb: `${formatAUD(KICKSTART.priceCents)} with goals, availability and confidence captured at checkout.`,
      to: "/pay",
      icon: ShoppingBag,
      done: s.paid,
    },
    {
      n: 3,
      title: `${TRAINER.first} accepts`,
      blurb: `Full commitment and ${formatAUD(KICKSTART.trainerPayoutCents)} payout shown before she responds.`,
      to: "/opportunity",
      icon: Handshake,
      done: s.accepted,
    },
    {
      n: 4,
      title: "Deliver three sessions",
      blurb: `Understand → Personalise → Review. ${MEMBER.first} confirms each one. (${done} of 3)`,
      to: "/journey/alex",
      icon: CheckCircle2,
      done: done === 3,
    },
    {
      n: 5,
      title: "Review progress",
      blurb: "Confidence 5 → 8, visits 1.4 → 2.6, clarity 4 → 8.",
      to: "/review",
      icon: Star,
      done: s.recommended,
    },
    {
      n: 6,
      title: "Convert to 2× weekly",
      blurb: `${formatAUD(ONGOING.weeklyCents)} per week, recurring through Pinch.`,
      to: "/ongoing",
      icon: RefreshCw,
      done: s.ongoingActive,
    },
    {
      n: 7,
      title: "View manager impact",
      blurb: "Commercial, member and trainer outcomes from one purchase.",
      to: "/dashboard",
      icon: Users,
      done: s.ongoingActive,
    },
    {
      n: 8,
      title: "Open Pinch integration console",
      blurb: "Checkout creation, webhooks, payment and session logs.",
      to: "/demo-console",
      icon: Wrench,
      done: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 text-foreground">
      <div className="mx-auto max-w-5xl px-5 pt-12 sm:px-8">
        <Badge className="border border-primary/40 bg-primary/10 text-primary">
          {CLUB.name} · guided demo
        </Badge>
        <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">
          One member. One journey. From a first paid session to ongoing coaching.
        </h1>
        <p className="mt-4 max-w-2xl text-sm text-muted-foreground sm:text-base">
          {MEMBER.name} buys a gym-promoted {KICKSTART.name}, is matched with{" "}
          {TRAINER.name}, completes three confirmed sessions, reviews measured
          progress, and continues on a {formatAUD(ONGOING.weeklyCents)} weekly
          plan. Every dollar and every outcome is visible along the way.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button asChild size="lg" className="shadow-[var(--shadow-soft)]">
            <Link to="/pay">
              Start the journey <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/dashboard">Manager impact view</Link>
          </Button>
        </div>

        <section className="mt-10">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Guided demo navigation
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {steps.map((step) => (
              <Link
                key={step.n}
                to={step.to}
                className="group block focus:outline-none"
              >
                <Card
                  className={`h-full p-5 transition-colors ${
                    step.done
                      ? "border-primary/40 bg-primary/5"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="grid size-9 shrink-0 place-items-center rounded-xl border border-primary/30 bg-primary/10">
                      <step.icon className="size-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Step {step.n}
                        {step.done && " · done"}
                      </p>
                      <p className="mt-0.5 font-semibold">{step.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {step.blurb}
                      </p>
                    </div>
                    <ArrowRight className="ml-auto size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-10 grid gap-3 sm:grid-cols-3">
          <Money label="Kickstart price" value={formatAUD(KICKSTART.priceCents)} />
          <Money
            label="Trainer payout"
            value={formatAUD(KICKSTART.trainerPayoutCents)}
            accent
          />
          <Money label="Club campaign fee" value={formatAUD(KICKSTART.clubFeeCents)} />
        </section>
      </div>
    </div>
  );
}

function Money({
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
