import { useSyncExternalStore } from "react";

/** One complete member journey: Alex Morgan @ Northside Club with Sarah Nguyen. */

export const CLUB = { name: "Northside Club", members: 800 };
export const MEMBER = { name: "Alex Morgan", first: "Alex" };
export const TRAINER = { name: "Sarah Nguyen", first: "Sarah" };

export const KICKSTART = {
  name: "PT Kickstart Pack",
  priceCents: 24900,
  trainerPayoutCents: 19900,
  clubFeeCents: 5000,
  includes: [
    "3 × 45-minute PT sessions",
    "Goal and confidence review",
    "Personalised starting programme",
    "Simple habit tracker",
    "Recommended next step",
  ],
};

export const ONGOING = {
  name: "Twice-Weekly Coaching",
  weeklyCents: 18000,
  includes: [
    "2 × 45-minute PT sessions per week",
    "Personalised progressive programme",
    "Habit and attendance tracking",
    "Monthly progress review",
    `Support from ${TRAINER.first}`,
  ],
  startDate: "Monday 3 August",
  nextReview: "Monday 31 August",
};

export const INTAKE = {
  goal: "Build strength and feel confident using the gym",
  experience: "Beginner",
  days: "Tuesday and Thursday",
  times: "6–8 pm",
  style: "Supportive and structured",
  confidence: 5,
  attendance: 1.4,
};

export const BEFORE = { confidence: 5, visits: 1.4, clarity: 4 };
export const AFTER = { confidence: 8, visits: 2.6, clarity: 8 };

export type SessionPlan = {
  n: 1 | 2 | 3;
  title: string;
  aims: string[];
  booked: boolean;
  completed: boolean;
  confirmed: boolean;
  win: string | null;
  payoutCents: number;
};

export type JourneyState = {
  intakeSubmitted: boolean;
  paid: boolean;
  matched: boolean;
  accepted: boolean;
  declineReason: string | null;
  sessions: SessionPlan[];
  reviewComplete: boolean;
  recommended: boolean;
  ongoingActive: boolean;
};

const SESSION_TEMPLATES: Omit<SessionPlan, "booked" | "completed" | "confirmed" | "win">[] = [
  {
    n: 1,
    title: "Understand",
    aims: [
      "Clarify goal and motivation",
      "Assess starting point",
      "Create an early confidence win",
      "Agree on one independent action",
    ],
    payoutCents: 6633,
  },
  {
    n: 2,
    title: "Personalise",
    aims: [
      "Deliver a goal-aligned session",
      "Record one visible progression",
      "Review habit consistency",
      "Ensure session three is booked",
    ],
    payoutCents: 6633,
  },
  {
    n: 3,
    title: "Review and recommend",
    aims: [
      "Show progress",
      "Reassess confidence",
      "Discuss support needed",
      "Recommend one ongoing coaching option",
    ],
    payoutCents: 6634,
  },
];

const INITIAL: JourneyState = {
  intakeSubmitted: false,
  paid: false,
  matched: false,
  accepted: false,
  declineReason: null,
  sessions: SESSION_TEMPLATES.map((s) => ({
    ...s,
    booked: false,
    completed: false,
    confirmed: false,
    win: null,
  })),
  reviewComplete: false,
  recommended: false,
  ongoingActive: false,
};

let state: JourneyState = structuredClone(INITIAL);
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function patch(next: Partial<JourneyState>) {
  state = { ...state, ...next };
  emit();
}

export const journey = {
  get: () => state,
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  reset: () => {
    state = structuredClone(INITIAL);
    emit();
  },
  submitIntake: () => patch({ intakeSubmitted: true }),
  pay: () => patch({ paid: true, intakeSubmitted: true, matched: true }),
  accept: () => {
    const sessions = state.sessions.map((s) =>
      s.n === 1 ? { ...s, booked: true } : s,
    );
    patch({ accepted: true, declineReason: null, sessions });
  },
  decline: (reason: string) => patch({ declineReason: reason, accepted: false }),
  update: (n: number, next: Partial<SessionPlan>) =>
    patch({
      sessions: state.sessions.map((s) => (s.n === n ? { ...s, ...next } : s)),
    }),
  confirm: (n: number, win: string | null) => {
    const sessions = state.sessions.map((s) =>
      s.n === n ? { ...s, confirmed: true, completed: true, win } : s,
    );
    // Confirming a session auto-books the next one for the demo flow.
    const idx = sessions.findIndex((s) => s.n === n);
    if (sessions[idx + 1]) sessions[idx + 1] = { ...sessions[idx + 1], booked: true };
    patch({ sessions });
  },
  completeReview: () => patch({ reviewComplete: true }),
  recommend: () => patch({ recommended: true, reviewComplete: true }),
  startOngoing: () => patch({ ongoingActive: true, recommended: true }),
};

export function useJourney(): JourneyState {
  return useSyncExternalStore(journey.subscribe, journey.get, journey.get);
}

export function releasedPayoutCents(s: JourneyState): number {
  return s.sessions
    .filter((x) => x.confirmed)
    .reduce((sum, x) => sum + x.payoutCents, 0);
}

export function confirmedCount(s: JourneyState): number {
  return s.sessions.filter((x) => x.confirmed).length;
}

/** Next active session for the trainer/member: first not-yet-confirmed. */
export function activeSession(s: JourneyState): SessionPlan | null {
  return s.sessions.find((x) => !x.confirmed) ?? null;
}

export type JourneyStage =
  | "intake"
  | "paid"
  | "accepted"
  | "delivering"
  | "review"
  | "recommended"
  | "ongoing";

export function stageOf(s: JourneyState): JourneyStage {
  if (s.ongoingActive) return "ongoing";
  if (s.recommended) return "recommended";
  if (confirmedCount(s) === 3) return s.reviewComplete ? "review" : "review";
  if (s.accepted) return "delivering";
  if (s.paid) return "paid";
  return "intake";
}

export const ANNUALISED_CENTS = ONGOING.weeklyCents * 48; // $8,640
