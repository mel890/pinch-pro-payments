import { createFileRoute, Link } from "@tanstack/react-router";
import { useDemoState, demoStore, TIER, formatAUD } from "@/lib/demo-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  TrendingUp,
  Users,
  Heart,
  Zap,
  Star,
  RotateCcw,
  ArrowRight,
  Trophy,
} from "lucide-react";
import { CoachMe } from "@/components/coach-me";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sarah's dashboard — VezaPT Pay" },
      {
        name: "description",
        content:
          "Sarah Williams' VezaPT Pay dashboard: earnings, tier progress, and client impact at a glance.",
      },
      { property: "og:title", content: "Sarah's dashboard — VezaPT Pay" },
      {
        property: "og:description",
        content: "Earnings, tier progress and client impact for PTs.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const s = useDemoState();
  const nextTierGap = Math.max(0, TIER.unlockAt - s.confirmedSessions);
  const tierUnlocked = s.confirmedSessions >= TIER.unlockAt;

  const tierProgress = Math.min(100, (s.confirmedSessions / 30) * 100);

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="mx-auto max-w-3xl px-5 pt-8 sm:px-8 sm:pt-12">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              VezaPT Pay
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Good morning, Sarah
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Here's how your coaching is compounding.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => demoStore.reset()}
            className="text-muted-foreground"
          >
            <RotateCcw className="mr-1.5 size-3.5" /> Reset demo
          </Button>
        </div>

        {/* Celebration */}
        {s.celebration && (
          <Card className="mt-6 overflow-hidden border-0 bg-[image:var(--gradient-soft)] p-5 shadow-[var(--shadow-soft)]">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary/15 p-2 text-primary">
                <Sparkles className="size-5" />
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  {tierUnlocked ? "60% tier unlocked" : "Nice work"}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {s.celebration}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Hero earnings card */}
        <Card className="mt-6 overflow-hidden border-0 bg-[image:var(--gradient-hero)] p-6 text-primary-foreground shadow-[var(--shadow-soft)] sm:p-8">
          <p className="text-sm font-medium uppercase tracking-wide opacity-80">
            Earnings this cycle
          </p>
          <p className="mt-1 text-5xl font-semibold tracking-tight sm:text-6xl">
            {formatAUD(s.earningsCents)}
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <MiniStat
              label="Confirmed sessions"
              value={String(s.confirmedSessions)}
            />
            <MiniStat
              label="Current PT share"
              value={`${s.currentSplitPct}%`}
            />
          </div>
        </Card>

        {/* Tier progress */}
        <Card className="mt-4 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-4 text-primary" />
              <h2 className="text-base font-semibold text-foreground">
                Tier progress
              </h2>
            </div>
            {tierUnlocked ? (
              <Badge className="bg-success/15 text-[color:var(--success)] hover:bg-success/15">
                <Trophy className="mr-1 size-3" /> 60% tier unlocked
              </Badge>
            ) : (
              <Badge variant="secondary">
                {nextTierGap} session to unlock 60%
              </Badge>
            )}
          </div>

          <div className="mt-5">
            <Progress value={tierProgress} className="h-2.5" />
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>0</span>
              <span>10</span>
              <span>20</span>
              <span>30+</span>
            </div>
          </div>

          <div className="mt-5 grid gap-2 text-sm sm:grid-cols-3">
            <TierRow range="Sessions 1–10" pct="40%" active={s.confirmedSessions <= 10} />
            <TierRow
              range="Sessions 11–20"
              pct="50%"
              active={s.confirmedSessions > 10 && s.confirmedSessions < 21}
            />
            <TierRow
              range="Sessions 21+"
              pct="60%"
              active={s.confirmedSessions >= 21}
            />
          </div>

          <p className="mt-4 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
            Your higher rate applies to sessions delivered after you reach each tier.
          </p>
        </Card>

        {/* CTA */}
        <div className="mt-6">
          <Button
            asChild
            size="lg"
            className="h-14 w-full text-base font-semibold shadow-[var(--shadow-soft)]"
          >
            <Link to="/complete-session">
              Complete a session
              <ArrowRight className="ml-1.5 size-4" />
            </Link>
          </Button>
        </div>

        {/* Impact section */}
        <div className="mt-10">
          <div className="flex items-center gap-2">
            <Heart className="size-4 text-primary" />
            <h2 className="text-base font-semibold text-foreground">
              Your impact
            </h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            What clients reported over the last 30 days.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <ImpactCard
              icon={<Users className="size-4" />}
              label="Clients supported"
              value="8"
            />
            <ImpactCard
              icon={<TrendingUp className="size-4" />}
              label="Training consistently"
              value="5"
            />
            <ImpactCard
              icon={<Heart className="size-4" />}
              label="Clients reported improved confidence"
              value={String(s.clientsConfidence)}
              highlight={s.clientsConfidence > 4}
            />
            <ImpactCard
              icon={<Zap className="size-4" />}
              label="Clients reported more energy"
              value={String(s.clientsEnergy)}
            />
          </div>

          <Card className="mt-3 flex items-center justify-between p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-warm/20 p-2 text-[color:var(--warm)]">
                <Star className="size-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Average support
                </p>
                <p className="text-xs text-muted-foreground">
                  How supported clients felt
                </p>
              </div>
            </div>
            <p className="text-2xl font-semibold text-foreground">
              4.7<span className="text-sm text-muted-foreground">/5</span>
            </p>
          </Card>
        </div>

        <CoachMe />

        <div className="mt-10 flex justify-center">
          <Link
            to="/demo-console"
            className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Open technical demo console
          </Link>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/15 p-3 backdrop-blur">
      <p className="text-xs opacity-80">{label}</p>
      <p className="mt-0.5 text-xl font-semibold">{value}</p>
    </div>
  );
}

function TierRow({
  range,
  pct,
  active,
}: {
  range: string;
  pct: string;
  active: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs ${
        active
          ? "border-primary/40 bg-primary/5 text-foreground"
          : "border-border bg-background text-muted-foreground"
      }`}
    >
      <span>{range}</span>
      <span className="font-semibold">{pct}</span>
    </div>
  );
}

function ImpactCard({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <Card
      className={`flex items-center justify-between p-5 transition ${
        highlight ? "border-primary/40 bg-primary/5" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-primary/10 p-2 text-primary">
          {icon}
        </div>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
      <p className="text-2xl font-semibold text-foreground">{value}</p>
    </Card>
  );
}
