import { useEffect, useSyncExternalStore } from "react";

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

export const CAMPAIGN = {
  name: "PT Kickstart Campaign",
  subtitle: "Turn member interest into paid coaching without adding a PT sales team.",
  capacityPacks: 7,
  trainers: 3,
  channels: ["Email", "Social media", "In-club QR"],
};

export const MATCH = {
  confidence: "Strong",
  reasons: [
    "Available Tuesday and Thursday evenings",
    "Experienced with beginner strength clients",
    "Supportive and structured coaching style",
    "Currently accepting Kickstart clients",
  ],
  rules: [
    "Schedule compatibility",
    "Available capacity",
    "Goal and speciality match",
    "Coaching-style preference",
    "Acceptance reliability",
  ],
  alternatives: ["Dan Whitcombe", "Priya Raman"],
};

export const TRAINER_BRIEF =
  "Alex is a beginner who wants to feel more confident using the gym. Prioritise rapport, simple strength movements and an early confidence win.";

export const AI_SUMMARY =
  "Alex has completed all three sessions, improved confidence and increased gym attendance. Alex still values structure, accountability and technique support.";

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
  purpose: string[];
  prep: string[];
  aims: string[];
  booked: boolean;
  completed: boolean;
  confirmed: boolean;
  win: string | null;
  payoutCents: number;
};

export type JourneyState = {
  campaignLive: boolean;
  intakeSubmitted: boolean;
  paid: boolean;
  matched: boolean;
  matchConfirmed: boolean;
  accepted: boolean;
  declineReason: string | null;
  sessions: SessionPlan[];
  reviewComplete: boolean;
  recommended: boolean;
  ongoingActive: boolean;
};

const SESSION_TEMPLATES: Omit<
  SessionPlan,
  "booked" | "completed" | "confirmed" | "win"
>[] = [
  {
    n: 1,
    title: "Understand",
    purpose: [
      "Clarify Alex's goal and motivation",
      "Establish a starting point",
      "Create one early confidence win",
      "Agree on one action before session two",
    ],
    prep: [
      "Ask what currently feels uncomfortable in the gym",
      "Choose simple whole-body movements",
      "Finish with one task Alex can repeat independently",
    ],
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
    title: "Progress",
    purpose: [
      "Personalise the session",
      "Record one visible improvement",
      "Review confidence and attendance",
      "Ensure session three is booked",
    ],
    prep: [
      "Review soreness and confidence",
      "Progress one movement clearly",
      "Link the session back to Alex's original goal",
    ],
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
    purpose: [
      "Show Alex's progress",
      "Reassess confidence",
      "Identify remaining support needs",
      "Recommend one clear next step",
    ],
    prep: [
      "Compare Alex's starting and current confidence",
      "Show one measurable improvement",
      "Ask what Alex still doesn't feel confident doing alone",
      "Recommend one suitable ongoing plan",
    ],
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
  campaignLive: false,
  intakeSubmitted: false,
  paid: false,
  matched: false,
  matchConfirmed: false,
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

const STORAGE_KEY = "vezapt-journey-v2";
let hydrated = false;

function save() {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* demo-only persistence */
  }
}

/** Client-only: restore demo progress so a page reload keeps the story going. */
function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as JourneyState;
    if (parsed && Array.isArray(parsed.sessions)) {
      state = {
        ...structuredClone(INITIAL),
        ...parsed,
        // Always re-apply the current copy/templates over stored progress.
        sessions: INITIAL.sessions.map((base) => {
          const saved = parsed.sessions.find((x) => x.n === base.n);
          return saved
            ? {
                ...base,
                booked: !!saved.booked,
                completed: !!saved.completed,
                confirmed: !!saved.confirmed,
                win: saved.win ?? null,
              }
            : base;
        }),
      };
      emit();
    }
  } catch {
    /* ignore corrupt demo state */
  }
}

function patch(next: Partial<JourneyState>) {
  state = { ...state, ...next };
  save();
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
    save();
    emit();
  },
  launchCampaign: () => patch({ campaignLive: true }),
  confirmMatch: () => patch({ matchConfirmed: true, matched: true }),
  submitIntake: () => patch({ intakeSubmitted: true }),
  pay: () =>
    patch({ paid: true, intakeSubmitted: true, matched: true, campaignLive: true }),
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
  useEffect(hydrate, []);
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
