import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight } from "lucide-react";
import {
  useJourney,
  confirmedCount,
  MEMBER,
  TRAINER,
  type JourneyState,
} from "@/lib/journey-store";

type Prompt = {
  signal: string;
  why: string;
  dimensions: [string, string];
  actions: string[];
  cta: { label: string; to: string };
};

function promptFor(s: JourneyState): Prompt {
  const done = confirmedCount(s);

  if (!s.accepted) {
    return {
      signal: "A paid opportunity is waiting for a response",
      why: `${MEMBER.name} has already paid for a Kickstart Pack. Fast acceptance is the strongest first signal a new member receives.`,
      dimensions: ["Client Connection", "Flow in Function"],
      actions: [
        "Review the goal and preferred times before responding",
        "Accept or decline within the response window",
        "Message Alex the same day to book session one",
      ],
      cta: { label: "Open the opportunity", to: "/opportunity" },
    };
  }

  if (done === 0) {
    return {
      signal: "Session one is the confidence moment",
      why: "Alex rated confidence 5/10 and attends 1.4 times a week. One visible early win changes the whole pack.",
      dimensions: ["Client Connection", "Movement Mastery"],
      actions: [
        "Open by restating Alex's goal in Alex's words",
        "Build in one lift or movement Alex can repeat alone",
        "Agree a single independent action before session two",
      ],
      cta: { label: "Open Alex's journey", to: "/journey/alex" },
    };
  }

  if (done === 1) {
    return {
      signal: "Follow up and lock in session two",
      why: "Kickstart clients who do not book session two within four days rarely finish the pack.",
      dimensions: ["Client Connection", "Flow in Function"],
      actions: [
        "Send a short follow-up referencing Alex's first-session win",
        "Confirm the Tuesday/Thursday 6–8 pm slot",
        "Check the habit tracker was started",
      ],
      cta: { label: "Open Alex's journey", to: "/journey/alex" },
    };
  }

  if (done === 2) {
    return {
      signal: "Prepare the progress review before session three",
      why: "Session three is where support is decided. Walking in without measured progress turns a coaching conversation into a pitch.",
      dimensions: ["Brand Power", "Financial IQ"],
      actions: [
        "Bring confidence, attendance and clarity before/after numbers",
        "Reassess confidence out of 10 with Alex",
        "Recommend one clear ongoing option — not a menu",
      ],
      cta: { label: "Open the progress review", to: "/review" },
    };
  }

  if (done === 3 && !s.recommended) {
    return {
      signal: "Kickstart completed without a next-step conversation",
      why: "All three sessions are confirmed and the pack is finished, but no ongoing option has been recommended yet.",
      dimensions: ["Client Connection", "Financial IQ"],
      actions: [
        "Reconnect Alex to the original goal",
        "Show visible progress from the review",
        "Recommend one suitable coaching option",
        "Send the follow-up within 24 hours",
      ],
      cta: { label: "Complete the review", to: "/review" },
    };
  }

  if (s.recommended && !s.ongoingActive) {
    return {
      signal: "Recommendation sent — keep the momentum",
      why: "Alex has the Twice-Weekly Coaching recommendation. Momentum drops off after a week without the first booked block.",
      dimensions: ["Brand Power", "Flow in Function"],
      actions: [
        "Hold two provisional slots for the start week",
        "Answer pause and cancellation questions up front",
        "Confirm the first monthly review date",
      ],
      cta: { label: "See Alex's plan screen", to: "/ongoing" },
    };
  }

  return {
    signal: "New recurring client — protect the first month",
    why: `Alex converted to ${"Twice-Weekly Coaching"}. The 30-day window decides whether this becomes a long-term relationship.`,
    dimensions: ["Client Connection", "Financial IQ"],
    actions: [
      "Schedule the next two sessions today",
      "Set the 30-day retention check-in",
      "Track attendance against the 2.6 visits baseline",
    ],
    cta: { label: "View manager impact", to: "/dashboard" },
  };
}

export function CoachMeJourney() {
  const s = useJourney();
  const p = promptFor(s);

  return (
    <Card className="border-primary/30 bg-[image:var(--gradient-hero)] p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-primary" />
        <p className="text-[10px] uppercase tracking-wider text-primary">
          Coach me · live signal for {TRAINER.first}
        </p>
      </div>
      <p className="mt-2 text-lg font-semibold leading-snug">{p.signal}</p>
      <p className="mt-1 text-sm text-muted-foreground">{p.why}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {p.dimensions.map((d) => (
          <span
            key={d}
            className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] text-primary"
          >
            {d}
          </span>
        ))}
      </div>

      <ul className="mt-4 space-y-1.5">
        {p.actions.map((a) => (
          <li key={a} className="flex gap-2 text-sm text-foreground/90">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
            {a}
          </li>
        ))}
      </ul>

      <Button asChild size="sm" variant="secondary" className="mt-4">
        <Link to={p.cta.to}>
          {p.cta.label} <ArrowRight className="ml-1 size-3.5" />
        </Link>
      </Button>
    </Card>
  );
}
