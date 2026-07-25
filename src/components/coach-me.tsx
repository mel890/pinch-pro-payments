import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Compass,
  Heart,
  Dumbbell,
  Sparkles,
  Workflow,
  LineChart,
  ChevronDown,
  Target,
  CheckCircle2,
} from "lucide-react";

type DimensionKey =
  | "connection"
  | "movement"
  | "brand"
  | "flow"
  | "financial";

const DIMENSIONS: Record<
  DimensionKey,
  { name: string; icon: React.ReactNode; blurb: string }
> = {
  connection: {
    name: "Client Connection",
    icon: <Heart className="size-4" />,
    blurb:
      "Build trust, understand goals, follow up and make clients feel seen.",
  },
  movement: {
    name: "Movement Mastery",
    icon: <Dumbbell className="size-4" />,
    blurb:
      "Personalise sessions, coach clearly, progress appropriately and create meaningful training experiences.",
  },
  brand: {
    name: "Brand Power",
    icon: <Sparkles className="size-4" />,
    blurb:
      "Be visible, professional, credible and represent the club well.",
  },
  flow: {
    name: "Flow in Function",
    icon: <Workflow className="size-4" />,
    blurb:
      "Schedule effectively, follow up consistently, manage the client lifecycle and reduce operational gaps.",
  },
  financial: {
    name: "Financial IQ",
    icon: <LineChart className="size-4" />,
    blurb:
      "Know your numbers, understand production, recommend services confidently and build sustainable income.",
  },
};

type Scenario = {
  id: string;
  signal: string;
  dimensions: [DimensionKey, DimensionKey];
  explanation: string;
  actions: string[];
  why: string;
};

const SCENARIOS: Scenario[] = [
  {
    id: "retention",
    signal: "Client retention is starting to dip",
    dimensions: ["connection", "movement"],
    explanation:
      "Clients are attending, but fewer are returning consistently. Focus on making the next sessions feel more personal, progressive and connected to what matters most to each client.",
    actions: [
      "Ask one deeper goal question",
      "Add one visible progression",
      "Book the next session before the client leaves",
    ],
    why: "Repeat-booking rate over the last four weeks is easing off while attendance holds steady.",
  },
  {
    id: "buying-not-attending",
    signal: "Clients buying but not attending",
    dimensions: ["flow", "connection"],
    explanation:
      "Clients are committing, but not building a consistent training rhythm.",
    actions: [
      "Book session two before the client leaves",
      "Follow up within 24 hours",
      "Review clients with no future booking",
    ],
    why: "New pack activations are outpacing first-week session bookings.",
  },
  {
    id: "cancellations",
    signal: "Cancellations are rising",
    dimensions: ["flow", "brand"],
    explanation:
      "You are creating interest, but sessions are being lost before delivery.",
    actions: [
      "Confirm tomorrow's appointments",
      "Contact recent cancellations",
      "Clarify expectations and next steps",
    ],
    why: "Late cancellations in the last fortnight are trending above your usual baseline.",
  },
  {
    id: "conversion",
    signal: "Conversion is dipping",
    dimensions: ["connection", "financial"],
    explanation:
      "Clients are engaging, but the next step may not feel clear or relevant.",
    actions: [
      "Ask why the goal matters now",
      "Reflect the client's own words",
      "Recommend one clear service option",
    ],
    why: "Intro-to-pack conversion has softened compared to your rolling average.",
  },
  {
    id: "production",
    signal: "Production is dipping",
    dimensions: ["financial", "flow"],
    explanation:
      "Your session volume is falling even though you still have active clients.",
    actions: [
      "Review clients with unused sessions",
      "Fill recurring appointments",
      "Contact clients with no next booking",
    ],
    why: "Delivered sessions this cycle are pacing under your last-cycle average.",
  },
  {
    id: "feedback",
    signal: "Feedback is becoming flat",
    dimensions: ["movement", "connection"],
    explanation:
      "Clients are attending, but the experience may be becoming too routine.",
    actions: [
      "Personalise one part of the session",
      "Use one clearer coaching cue",
      "Ask the client what felt most useful",
    ],
    why: "Post-session support ratings have plateaued over the last three weeks.",
  },
  {
    id: "quality",
    signal: "High production, quality slipping",
    dimensions: ["connection", "brand"],
    explanation:
      "Your business is growing, but clients may be feeling less seen.",
    actions: [
      "Review three client goals",
      "Slow down the session close",
      "Follow up personally with one client",
    ],
    why: "Volume is high while support scores have eased slightly.",
  },
  {
    id: "kickstart-s2",
    signal: "Kickstart clients are not booking session two",
    dimensions: ["flow", "connection"],
    explanation:
      "Kickstart buyers complete session one but leave without their next appointment in the calendar, so momentum stalls before the pack proves itself.",
    actions: [
      "Book session two before the member leaves the floor",
      "Send a same-day check-in with one thing that went well",
      "Reconfirm the member's original goal at the start of session two",
    ],
    why: "Kickstart session-1 to session-2 booking rate is trailing your rolling average.",
  },
  {
    id: "habit-checkins",
    signal: "Challenge participants are missing habit check-ins",
    dimensions: ["flow", "movement"],
    explanation:
      "Attendance is fine, but habit tracking has gone quiet — the between-session support that makes challenges work.",
    actions: [
      "Message the three lowest-adherence clients directly",
      "Simplify each client's habit down to one daily action",
      "Open the next session by reviewing this week's check-ins",
    ],
    why: "Less than half of active challenge clients logged a check-in in the last 7 days.",
  },
  {
    id: "final-reviews",
    signal: "Final reviews are not being booked",
    dimensions: ["flow", "financial"],
    explanation:
      "Packs are finishing without a structured review conversation, so the next-step opportunity slips past.",
    actions: [
      "Book the final review before session three of every Kickstart",
      "Prepare one progress artefact — a lift, a photo, a habit chart",
      "Prepare one clear next-step recommendation per client",
    ],
    why: "Final review bookings are trailing pack completions by more than half.",
  },
  {
    id: "pack-to-ongoing",
    signal: "Pack-to-ongoing conversion is below team average",
    dimensions: ["connection", "financial"],
    explanation:
      "Members are finishing packs, but not moving into 6-Week Momentum or ongoing support at the rate the rest of the team is.",
    actions: [
      "Reconnect each pack finisher to their original goal",
      "Recommend one clear next product per client",
      "Offer the choice between 1:1, hybrid and online support",
    ],
    why: "Your pack-to-ongoing rate is 12 points below the team median this quarter.",
  },
  {
    id: "completed-no-progression",
    signal: "Kickstart clients are completing sessions but not progressing",
    dimensions: ["financial", "connection"],
    explanation:
      "Four clients completed their packs this month, but only one had a documented next-step conversation.",
    actions: [
      "Book the final review before session three",
      "Link progress back to the member's original goal",
      "Recommend one clear next step",
      "Offer one-to-one, hybrid or online support",
    ],
    why: "Pack completions this month: 4. Documented next-step conversations: 1.",
  },
  {
    id: "over-capacity",
    signal: "Accepted client load is above your capacity",
    dimensions: ["flow", "movement"],
    explanation:
      "You've accepted more challenge opportunities than your available weekly slots — quality and reliability are at risk before delivery even begins.",
    actions: [
      "Decline the next opportunity or add availability",
      "Re-check evening capacity for the current campaign",
      "Rebalance existing clients across your open slots",
    ],
    why: "Accepted delivery hours exceed your published weekly capacity.",
  },
];

export function CoachMe() {
  const [scenarioId, setScenarioId] = useState<string>("retention");
  const [showAll, setShowAll] = useState(false);
  const [focus, setFocus] = useState(false);
  const scenario = SCENARIOS.find((s) => s.id === scenarioId)!;

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Compass className="size-4 text-primary" />
          <h2 className="text-base font-semibold text-foreground">Coach Me</h2>
          <Badge
            variant="secondary"
            className="ml-1 text-[10px] uppercase tracking-wider"
          >
            Demo coaching signal
          </Badge>
        </div>
        <select
          value={scenarioId}
          onChange={(e) => {
            setScenarioId(e.target.value);
            setFocus(false);
          }}
          className="rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          aria-label="Demo scenario"
        >
          {SCENARIOS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.signal}
            </option>
          ))}
        </select>
      </div>

      <Card className="mt-4 overflow-hidden border-primary/20 bg-[image:var(--gradient-hero)] p-6 shadow-[var(--shadow-soft)]">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-primary/15 p-2 text-primary">
            <Target className="size-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Current signal
            </p>
            <p className="mt-0.5 text-lg font-semibold text-foreground">
              {scenario.signal}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {scenario.dimensions.map((d) => (
                <Badge
                  key={d}
                  variant="secondary"
                  className="gap-1 bg-card/70 text-foreground"
                >
                  <span className="text-primary">{DIMENSIONS[d].icon}</span>
                  {DIMENSIONS[d].name}
                </Badge>
              ))}
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {scenario.explanation}
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {scenario.dimensions.map((d) => (
            <div
              key={d}
              className="rounded-xl border border-border/40 bg-card/60 p-3"
            >
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <span className="text-primary">{DIMENSIONS[d].icon}</span>
                {DIMENSIONS[d].name}
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {DIMENSIONS[d].blurb}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-xl bg-card/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Try these three actions next
          </p>
          <ul className="mt-2 space-y-2">
            {scenario.actions.map((a, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <CheckCircle2
                  className={`mt-0.5 size-4 shrink-0 ${
                    focus ? "text-primary" : "text-muted-foreground"
                  }`}
                />
                <span>{a}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            Why this: {scenario.why}
          </p>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={() => setFocus(true)}
            disabled={focus}
            className="shadow-[var(--shadow-soft)]"
          >
            {focus ? "Focus started" : "Start this focus"}
          </Button>
          <Button size="sm" variant="outline">
            Review at-risk clients
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowAll((v) => !v)}
          >
            View all Five Dimensions
            <ChevronDown
              className={`ml-1 size-3.5 transition-transform ${
                showAll ? "rotate-180" : ""
              }`}
            />
          </Button>
        </div>
      </Card>

      {showAll && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {(Object.keys(DIMENSIONS) as DimensionKey[]).map((k) => {
            const d = DIMENSIONS[k];
            const active = scenario.dimensions.includes(k);
            return (
              <Card
                key={k}
                className={`p-4 transition ${
                  active ? "border-primary/40 bg-primary/5" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-primary/10 p-1.5 text-primary">
                    {d.icon}
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {d.name}
                  </p>
                  {active && (
                    <Badge variant="secondary" className="ml-auto text-[10px]">
                      In focus
                    </Badge>
                  )}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {d.blurb}
                </p>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
