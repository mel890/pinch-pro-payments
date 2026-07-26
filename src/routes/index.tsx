import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Rocket,
  ShoppingBag,
  Sparkles,
  Handshake,
  CheckCircle2,
  Star,
  RefreshCw,
  LayoutDashboard,
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
      { title: "VezaPT Pay — one prepaid PT journey, end to end" },
      {
        name: "description",
        content:
          "A guided demo: Northside Club promotes one $249 Kickstart Pack, Alex buys through Pinch, VezaPT matches Sarah, three sessions are delivered and Alex converts to twice-weekly coaching.",
      },
      {
        property: "og:title",
        content: "VezaPT Pay — one prepaid PT journey, end to end",
      },
      {
        property: "og:description",
        content:
          "Campaign, purchase, match, delivery, review, conversion and manager impact in eight steps.",
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

  const steps = [
    {
      n: 1,
      title: "Launch campaign",
      blurb: `${CLUB.name} switches on the Kickstart Campaign — one product, ready to run.`,
      to: "/campaign",
      icon: Rocket,
      done: s.campaignLive,
    },
    {
      n: 2,
      title: `${MEMBER.first} buys Kickstart`,
      blurb: `${formatAUD(KICKSTART.priceCents)} through Pinch, with goal, availability and confidence captured.`,
      to: "/pay",
      icon: ShoppingBag,
      done: s.paid,
    },
    {
      n: 3,
      title: `VezaPT matches ${TRAINER.first}`,
      blurb: "AI-assisted recommendation on schedule, capacity and coaching fit.",
      to: "/match",
      icon: Sparkles,
      done: s.matchConfirmed,
    },
    {
      n: 4,
      title: `${TRAINER.first} accepts`,
      blurb: `A prepaid opportunity with a ${formatAUD(KICKSTART.trainerPayoutCents)} payout shown up front.`,
      to: "/opportunity",
      icon: Handshake,
      done: s.accepted,
    },
    {
      n: 5,
      title: "Deliver three sessions",
      blurb: `Understand → Progress → Review. ${MEMBER.first} confirms each one. (${done} of 3)`,
      to: "/journey/alex",
      icon: CheckCircle2,
      done: done === 3,
    },
    {
      n: 6,
      title: `Review ${MEMBER.first}'s progress`,
      blurb: "Confidence 5 → 8, visits 1.4 → 2.6, clarity 4 → 8.",
      to: "/review",
      icon: Star,
      done: s.recommended,
    },
    {
      n: 7,
      title: "Convert to 2× weekly coaching",
      blurb: `${formatAUD(ONGOING.weeklyCents)} per week, recurring through Pinch.`,
      to: "/ongoing",
      icon: RefreshCw,
      done: s.ongoingActive,
    },
    {
      n: 8,
      title: "View manager impact",
      blurb: "Packs sold, members started, conversions, campaign revenue, retention.",
      to: "/dashboard",
      icon: LayoutDashboard,
      done: s.ongoingActive,
    },
  ];

  const promises = [
    {
      who: "For gyms",
      text: "Keep your current rental model and add a ready-to-run PT campaign without hiring a sales team.",
    },
    {
      who: "For trainers",
      text: "Receive prepaid clients, deliver three valuable sessions and keep the ongoing coaching relationship.",
    },
    {
      who: "For members",
      text: "Buy a clear starting product, get matched with the right trainer and continue only when the coaching is working.",
    },
    {
      who: "For Pinch",
      text: "Process the initial gym-promoted purchase, then transition the member into PT-owned recurring billing.",
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 text-foreground">
      <div className="mx-auto max-w-5xl px-5 pt-12 sm:px-8">
        <Badge className="border border-primary/40 bg-primary/10 text-primary">
          {CLUB.name} · guided demo
        </Badge>
        <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">
          One prepaid pack. One trainer. One member who keeps going.
        </h1>
        <p className="mt-4 max-w-2xl text-sm text-muted-foreground sm:text-base">
          {MEMBER.name} buys the gym-promoted {KICKSTART.name} for{" "}
          {formatAUD(KICKSTART.priceCents)}, is matched with {TRAINER.name},
          confirms three sessions and converts to {ONGOING.name} at{" "}
          {formatAUD(ONGOING.weeklyCents)} per week.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button asChild size="lg" className="shadow-[var(--shadow-soft)]">
            <Link to="/campaign">
              Start the demo <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/demo-console">
              <Wrench className="mr-2 size-4" /> Pinch integration console
            </Link>
          </Button>
        </div>

        <section className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {promises.map((p) => (
            <Card key={p.who} className="border-border p-4">
              <p className="text-[10px] uppercase tracking-wider text-primary">
                {p.who}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{p.text}</p>
            </Card>
          ))}
        </section>

        <section className="mt-10">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            The eight-step journey
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {steps.map((st) => (
              <Link
                key={st.n}
                to={st.to}
                className="group rounded-xl border border-border bg-card/60 p-4 transition-colors hover:border-primary/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`grid size-7 place-items-center rounded-lg border font-mono text-xs ${
                        st.done
                          ? "border-primary/50 bg-primary/15 text-primary"
                          : "border-border text-muted-foreground"
                      }`}
                    >
                      {st.n}
                    </span>
                    <st.icon className="size-4 text-primary" />
                  </div>
                  {st.done && (
                    <CheckCircle2 className="size-4 shrink-0 text-primary" />
                  )}
                </div>
                <p className="mt-3 font-semibold">{st.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{st.blurb}</p>
                <span className="mt-2 inline-flex items-center text-xs text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  Open <ArrowRight className="ml-1 size-3" />
                </span>
              </Link>
            ))}
          </div>
        </section>

        <Card className="mt-10 border-primary/30 bg-[image:var(--gradient-hero)] p-6">
          <p className="text-[10px] uppercase tracking-wider text-primary">
            What this demo proves
          </p>
          <p className="mt-2 text-base leading-relaxed">
            The gym created the first paid opportunity. {TRAINER.first} delivered
            three valuable sessions and converted {MEMBER.first} into
            twice-weekly coaching. Pinch powered the one-off purchase and the
            recurring plan, while VezaPT connected the match, service journey,
            conversion and retention impact.
          </p>
        </Card>
      </div>
    </div>
  );
}
