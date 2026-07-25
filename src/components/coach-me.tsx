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
      "Personalise sessions, coach clearly, progress appropriately and create meaningful experiences.",
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
      "Schedule effectively, follow up consistently, manage the client lifecycle and reduce admin gaps.",
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
    signal: "Client retention is trending down",
    dimensions: ["connection", "movement"],
    explanation:
      "Clients are attending, but fewer are returning consistently. Focus on making the next sessions feel more personal, progressive and connected to what matters most to each client.",
    actions: [
      "Ask one deeper goal question",
      "Add one visible progression",
      "Book the next session before the client leaves",
    ],
    why: "Repeat-booking rate over the last 4 weeks is easing off while attendance holds steady.",
  },
  {
    id: "cancellations",
    signal: "Cancellations are rising",
    dimensions: ["flow", "brand"],
    explanation:
      "More sessions are being rescheduled or dropped late. Tighten your scheduling rhythm and reinforce the value clients see in showing up.",
    actions: [
      "Send a warm 24-hour check-in message",
      "Offer two firm session slots for next week",
      "Share one client win publicly this week",
    ],
    why: "Late cancellations in the last fortnight are trending above your usual baseline.",
  },
  {
    id: "conversion",
    signal: "Conversion is dipping",
    dimensions: ["connection", "financial"],
    explanation:
      "Intro sessions aren't converting into packs as often. Lean into what each prospect actually wants and recommend the plan that fits with confidence.",
    actions: [
      "Recap the client's goal in their own words",
      "Recommend a specific pack, not options",
      "Book the follow-up before they leave the floor",
    ],
    why: "Intro-to-pack conversion has softened compared to your rolling average.",
  },
  {
    id: "production",
    signal: "Production is dipping",
    dimensions: ["financial", "flow"],
    explanation:
      "Delivered sessions per week are below your usual run rate. Rebuild the week's structure and protect your prime coaching hours.",
    actions: [
      "Block two extra prime-time slots this week",
      "Reach out to three clients due for a re-book",
      "Review pack balances and flag any close to renewal",
    ],
    why: "Session count this cycle is pacing under your last-cycle average.",
  },
  {
    id: "feedback",
    signal: "Feedback is becoming flat",
    dimensions: ["movement", "connection"],
    explanation:
      "Client ratings are steady but no longer climbing. Bring more variety and meaning into sessions so clients feel visible progress again.",
    actions: [
      "Introduce one new movement pattern",
      "Name a small win in each session out loud",
      "Ask one client what would make this a 5/5",
    ],
    why: "Post-session ratings have plateaued over the last 3 weeks.",
  },
  {
    id: "quality",
    signal: "High production, quality slipping",
    dimensions: ["connection", "brand"],
    explanation:
      "You're delivering strong volume, and it's showing in how personal each session feels. Protect the coaching quality that got you here.",
    actions: [
      "Arrive 5 minutes early to reset between clients",
      "Personalise the warm-up for each client",
      "Send one thoughtful follow-up message per day",
    ],
    why: "Volume is high while support scores have eased slightly.",
  },
];

export function CoachMe() {
  const [scenarioId, setScenarioId] = useState<string>("retention");
  const [showAll, setShowAll] = useState(false);
  const [focus, setFocus] = useState(false);
  const scenario = SCENARIOS.find((s) => s.id === scenarioId)!;

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Compass className="size-4 text-primary" />
          <h2 className="text-base font-semibold text-foreground">Coach Me</h2>
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

      <Card className="mt-4 overflow-hidden border-0 bg-[image:var(--gradient-soft)] p-6 shadow-[var(--shadow-soft)]">
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
                  className="gap-1 bg-white/70 text-foreground"
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

        <div className="mt-5 rounded-xl bg-white/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Next three actions
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
            {focus ? "Focus started" : "Start focus"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAll((v) => !v)}
          >
            {showAll ? "Hide" : "View"} all five dimensions
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
