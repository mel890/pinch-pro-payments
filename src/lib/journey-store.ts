import { useEffect, useSyncExternalStore } from "react";

/** One complete member journey: Alex Morgan @ Northside Club with Sarah Marino. */

export const CLUB = { name: "Northside Club", members: 800 };
export const MEMBER = { name: "Alex Morgan", first: "Alex" };
export const TRAINER = { name: "Sarah Marino", first: "Sarah" };

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

/** Full member intake captured on the purchase page. */
export type IntakeForm = {
  fullName: string;
  email: string;
  mobile: string;
  ageBand: string;
  goal: string;
  motivation: string;
  targetWeeks: string;
  experience: string;
  attendance: string;
  activities: string[];
  conditions: string[];
  injuryNotes: string;
  clearedByDoctor: "Yes" | "No" | "Not sure";
  days: string[];
  times: string;
  sessionsPerWeek: string;
  style: string;
  accountability: string;
  confidence: number;
  notes: string;
  consent: boolean;
};

export const INTAKE_DEFAULTS: IntakeForm = {
  fullName: "Alex Morgan",
  email: "alex.morgan@example.com",
  mobile: "0412 448 902",
  ageBand: "35–44",
  goal: "Build strength and feel confident using the gym",
  motivation:
    "I've had a membership for a year and mostly use the treadmill. I want to know what I'm doing in the weights area.",
  targetWeeks: "12 weeks",
  experience: "Beginner",
  attendance: "1–2 visits per week",
  activities: ["Treadmill / walking", "Group classes"],
  conditions: ["Lower-back sensitivity"],
  injuryNotes:
    "Lower back gets sore after long days at a desk. Left knee clicks on deep squats but no pain.",
  clearedByDoctor: "Yes",
  days: ["Tuesday", "Thursday"],
  times: "Evening (6–8 pm)",
  sessionsPerWeek: "2 per week",
  style: "Supportive and structured",
  accountability: "Weekly check-in message",
  confidence: 5,
  notes: "Prefer a quieter part of the gym for the first session.",
  consent: true,
};

export const INTAKE_OPTIONS = {
  ageBands: ["18–24", "25–34", "35–44", "45–54", "55+"],
  goals: [
    "Build strength and feel confident using the gym",
    "Lose body fat and improve fitness",
    "Return to training after a break",
    "Improve posture and reduce back pain",
    "Train for an event",
  ],
  targetWeeks: ["6 weeks", "12 weeks", "6 months", "No fixed deadline"],
  experience: [
    "Complete beginner",
    "Beginner",
    "Some experience",
    "Confident and consistent",
  ],
  attendance: [
    "Not training yet",
    "1–2 visits per week",
    "3–4 visits per week",
    "5+ visits per week",
  ],
  activities: [
    "Treadmill / walking",
    "Group classes",
    "Cycling",
    "Swimming",
    "Free weights",
    "Machines only",
    "Sport",
  ],
  conditions: [
    "None",
    "Lower-back sensitivity",
    "Knee injury",
    "Shoulder injury",
    "Asthma",
    "Pregnancy / post-natal",
    "High blood pressure",
    "Recent surgery",
  ],
  days: [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ],
  times: [
    "Early morning (5–7 am)",
    "Morning (7–10 am)",
    "Midday (11 am–2 pm)",
    "Afternoon (2–5 pm)",
    "Evening (6–8 pm)",
  ],
  sessionsPerWeek: ["1 per week", "2 per week", "3 per week", "Flexible"],
  styles: [
    "Supportive and structured",
    "Direct and challenging",
    "Technical and educational",
    "Relaxed and social",
  ],
  accountability: [
    "Weekly check-in message",
    "In-session only",
    "App reminders",
    "Monthly review call",
  ],
};


export const BEFORE = { confidence: 5, visits: 1.4, clarity: 4 };
export const AFTER = { confidence: 8, visits: 2.6, clarity: 8 };

export type SessionStatus =
  | "booked"
  | "qr_issued"
  | "checked_in"
  | "in_progress"
  | "awaiting_feedback"
  | "verified"
  | "review_required"
  | "cancelled"
  | "no_show";

export type PayoutStatus =
  | "Not started"
  | "Pending delivery"
  | "Awaiting verification"
  | "Payout eligible"
  | "Review required"
  | "Paid";

/** How the member checked in at the start of the session. */
export type CodeMethod = "qr" | "backup" | "manual" | null;
/** Legacy alias. */
export type CheckinMethod = CodeMethod;

export type SessionFeedback = {
  tookPlace: boolean;
  supported: "Yes" | "Somewhat" | "No";
  understands: "Yes" | "Not yet";
  nextBooked: boolean;
  win: string | null;
};

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
  /** Deliver → Scan → Log → Confirm → Verify. */
  status: SessionStatus;
  scheduledLabel: string;
  /** Completion code lifecycle. */
  qrIssued: boolean;
  qrUsed: boolean;
  backupCode: string;
  checkinMethod: CodeMethod;
  /** Timestamp the completion code was accepted. */
  checkinAt: string | null;
  completedAt: string | null;
  fullyDelivered: boolean | null;
  nextBooked: boolean | null;
  issueNote: string | null;
  feedbackAt: string | null;
  feedback: SessionFeedback | null;
  verifiedAt: string | null;
  verifiedVia: "member" | "timeout" | "manager" | null;
  reviewReason: string | null;
  reserved: boolean;
  deducted: boolean;
};


export type ExceptionAction = {
  n: number;
  action: string;
  at: string;
};

export type JourneyState = {
  campaignLive: boolean;
  intakeSubmitted: boolean;
  intake: IntakeForm;

  paid: boolean;
  matched: boolean;
  matchConfirmed: boolean;
  accepted: boolean;
  declineReason: string | null;
  sessions: SessionPlan[];
  exceptionLog: ExceptionAction[];
  reviewComplete: boolean;
  recommended: boolean;
  ongoingActive: boolean;
  /** Timestamp label for when Alex was notified of the ongoing recommendation. */
  memberNotifiedAt: string | null;
};


const SESSION_TEMPLATES: Pick<
  SessionPlan,
  "n" | "title" | "purpose" | "prep" | "aims" | "payoutCents"
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

const SCHEDULE = [
  "Tuesday 6:00 pm",
  "Thursday 6:00 pm",
  "Tuesday 6:00 pm (next week)",
];

const BACKUP_CODES = ["481 902", "336 741", "205 618"];

const INITIAL: JourneyState = {
  campaignLive: false,
  intakeSubmitted: false,
  intake: { ...INTAKE_DEFAULTS },

  paid: false,
  matched: false,
  matchConfirmed: false,
  accepted: false,
  declineReason: null,
  sessions: SESSION_TEMPLATES.map((s, i) => ({
    ...s,
    booked: false,
    completed: false,
    confirmed: false,
    win: null,
    status: "booked" as SessionStatus,
    scheduledLabel: SCHEDULE[i],
    qrIssued: false,
    qrUsed: false,
    backupCode: BACKUP_CODES[i],
    checkinMethod: null,
    checkinAt: null,
    completedAt: null,
    fullyDelivered: null,
    nextBooked: null,
    issueNote: null,
    feedbackAt: null,
    feedback: null,
    verifiedAt: null,
    verifiedVia: null,
    reviewReason: null,

    reserved: false,
    deducted: false,
  })),
  exceptionLog: [],
  reviewComplete: false,
  recommended: false,
  ongoingActive: false,
  memberNotifiedAt: null,
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
        intake: { ...INTAKE_DEFAULTS, ...(parsed.intake ?? {}) },

        // Always re-apply the current copy/templates over stored progress.
        sessions: INITIAL.sessions.map((base) => {
          const saved = parsed.sessions.find((x) => x.n === base.n);
          if (!saved) return base;
          const {
            n: _n,
            title: _t,
            purpose: _p,
            prep: _pr,
            aims: _a,
            payoutCents: _c,
            scheduledLabel: _s,
            backupCode: _b,
            ...progress
          } = saved;
          return { ...base, ...progress };
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
  updateIntake: (next: Partial<IntakeForm>) =>
    patch({ intake: { ...state.intake, ...next } }),

  pay: () =>
    patch({ paid: true, intakeSubmitted: true, matched: true, campaignLive: true }),
  accept: () => {
    const sessions = state.sessions.map((s) =>
      s.n === 1 ? { ...s, booked: true, status: "booked" as SessionStatus } : s,
    );
    patch({ accepted: true, declineReason: null, sessions });
  },
  decline: (reason: string) => patch({ declineReason: reason, accepted: false }),
  update: (n: number, next: Partial<SessionPlan>) =>
    patch({
      sessions: state.sessions.map((s) => (s.n === n ? { ...s, ...next } : s)),
    }),

  /* ---------- Deliver → Scan → Log → Confirm → Verify ---------- */

  /** Trainer taps "Complete session" at the end of delivery. */
  startCompletion: (n: number) =>
    journeyPatchSession(n, (s) =>
      s.status === "booked" || s.status === "in_progress"
        ? { ...s, status: "in_progress" }
        : s,
    ),

  /** Member opens their session completion screen: one-time QR + backup code. */
  issueCompletionCode: (n: number) =>
    journeyPatchSession(n, (s) =>
      s.qrUsed || (s.status !== "booked" && s.status !== "in_progress")
        ? s
        : { ...s, qrIssued: true, status: "code_ready" },
    ),

  /** Trainer scans the completion code (or keys the backup code). Reserves the session. */
  scanCompletionCode: (n: number, method: Exclude<CodeMethod, null>) =>
    journeyPatchSession(n, (s) =>
      s.qrUsed
        ? s
        : {
            ...s,
            qrUsed: true,
            qrIssued: true,
            checkinMethod: method,
            checkinAt: nowLabel(),
            reserved: true,
            status: "awaiting_log",
            reviewReason:
              method === "manual"
                ? "Manual override — completion code not scanned"
                : s.reviewReason,
          },
    ),

  /** Trainer session log. */
  logSession: (
    n: number,
    input: {
      delivered: boolean;
      nextBooked: boolean;
      win: string | null;
      issue?: string | null;
    },
  ) => {
    const sessions = state.sessions.map((s) => {
      if (s.n !== n) return s;
      if (!input.delivered) {
        return {
          ...s,
          completed: false,
          status: "review_required" as SessionStatus,
          completedAt: nowLabel(),
          fullyDelivered: false,
          issueNote: input.issue?.trim() || null,
          reviewReason: "Trainer reported the session was not fully delivered",
        };
      }
      return {
        ...s,
        completed: true,
        completedAt: nowLabel(),
        fullyDelivered: true,
        nextBooked: input.nextBooked,
        win: input.win ?? s.win,
        issueNote: input.issue?.trim() || null,
        status: "awaiting_confirmation" as SessionStatus,
      };
    });
    const idx = sessions.findIndex((s) => s.n === n);
    if (input.delivered && input.nextBooked && sessions[idx + 1]) {
      sessions[idx + 1] = { ...sessions[idx + 1], booked: true };
    }
    patch({ sessions });
  },

  /** Member confirmation stage — confirming verifies and makes the payout eligible. */
  submitFeedback: (n: number, feedback: SessionFeedback) =>
    journeyPatchSession(n, (s) =>
      feedback.tookPlace
        ? {
            ...s,
            feedback,
            feedbackAt: nowLabel(),
            win: feedback.win ?? s.win,
            confirmed: true,
            completed: true,
            deducted: true,
            reserved: false,
            verifiedAt: nowLabel(),
            verifiedVia: "member",
            status: "verified",
          }
        : {
            ...s,
            feedback,
            feedbackAt: nowLabel(),
            status: "review_required",
            reviewReason: "Member reported the session did not take place as expected",
          },
    ),

  /** 12-hour no-dispute timeout verifies the session. */
  timeoutVerify: (n: number) =>
    journeyPatchSession(n, (s) =>
      s.status !== "awaiting_confirmation"
        ? s
        : {
            ...s,
            confirmed: true,
            deducted: true,
            reserved: false,
            verifiedAt: nowLabel(),
            verifiedVia: "timeout",
            status: "verified",
          },
    ),


  /** Manager resolution from the exception queue. */
  resolveException: (n: number, outcome: "verify" | "cancel" | "no_show") => {
    const at = nowLabel();
    const sessions = state.sessions.map((s) => {
      if (s.n !== n) return s;
      if (outcome === "verify") {
        return {
          ...s,
          confirmed: true,
          completed: true,
          deducted: true,
          reserved: false,
          verifiedAt: at,
          reviewReason: null,
          status: "verified" as SessionStatus,
        };
      }
      // Cancelled or no-show: restore the reserved pack credit.
      return {
        ...s,
        confirmed: false,
        completed: false,
        reserved: false,
        deducted: false,
        qrUsed: false,
        qrIssued: false,
        checkinMethod: null,
        checkinAt: null,
        completedAt: null,
        feedback: null,
        feedbackAt: null,
        status: (outcome === "cancel" ? "cancelled" : "no_show") as SessionStatus,
      };
    });
    patch({
      sessions,
      exceptionLog: [
        ...state.exceptionLog,
        {
          n,
          at,
          action:
            outcome === "verify"
              ? "Manually verified and payout released"
              : outcome === "cancel"
                ? "Cancelled — pack credit restored"
                : "Marked no-show — pack credit restored",
        },
      ],
    });
  },

  /** Restore a cancelled/no-show session back to booked. */
  rebook: (n: number) =>
    journeyPatchSession(n, (s) => ({
      ...s,
      status: "booked",
      booked: true,
      reviewReason: null,
    })),

  /** Legacy one-tap confirm, kept for older screens. */
  confirm: (n: number, win: string | null) => {
    const sessions = state.sessions.map((s) =>
      s.n === n
        ? {
            ...s,
            confirmed: true,
            completed: true,
            deducted: true,
            reserved: false,
            verifiedAt: nowLabel(),
            status: "verified" as SessionStatus,
            win,
          }
        : s,
    );
    const idx = sessions.findIndex((s) => s.n === n);
    if (sessions[idx + 1]) sessions[idx + 1] = { ...sessions[idx + 1], booked: true };
    patch({ sessions });
  },
  completeReview: () => patch({ reviewComplete: true }),
  recommend: () => patch({ recommended: true, reviewComplete: true }),
  startOngoing: () => patch({ ongoingActive: true, recommended: true }),

  /** Presenter shortcut: run all three sessions through to verified. */
  simulatePackDelivery: () => {
    const at = nowLabel();
    const wins = [
      "Completed a full set of goblet squats unassisted",
      "Added weight to the trap-bar deadlift with clean technique",
      "Ran the whole warm-up independently",
    ];
    patch({
      campaignLive: true,
      intakeSubmitted: true,
      paid: true,
      matched: true,
      matchConfirmed: true,
      accepted: true,
      declineReason: null,
      sessions: state.sessions.map((s) => ({
        ...s,
        booked: true,
        qrIssued: true,
        qrUsed: true,
        checkinMethod: s.checkinMethod ?? "qr",
        checkinAt: s.checkinAt ?? at,
        completed: true,
        completedAt: s.completedAt ?? at,
        fullyDelivered: true,
        nextBooked: s.n < 3,
        win: s.win ?? wins[s.n - 1],
        feedbackAt: s.feedbackAt ?? at,
        feedback:
          s.feedback ?? {
            tookPlace: true,
            supported: "Yes",
            understands: "Yes",
            nextBooked: s.n < 3,
            win: wins[s.n - 1],
          },
        confirmed: true,
        deducted: true,
        reserved: false,
        verifiedAt: s.verifiedAt ?? at,
        reviewReason: null,
        status: "verified" as SessionStatus,
      })),
    });
  },

  /** Sarah sends Alex the ongoing twice-weekly recommendation. */
  notifyMember: () =>
    patch({
      recommended: true,
      reviewComplete: true,
      memberNotifiedAt: state.memberNotifiedAt ?? nowLabel(),
    }),
};

function journeyPatchSession(n: number, fn: (s: SessionPlan) => SessionPlan) {
  patch({ sessions: state.sessions.map((s) => (s.n === n ? fn(s) : s)) });
}

function nowLabel(): string {
  return new Intl.DateTimeFormat("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date());
}

export const SESSION_STATUS_LABEL: Record<SessionStatus, string> = {
  booked: "Booked",
  in_progress: "Session in progress",
  code_ready: "Completion code ready",
  code_accepted: "Completion code accepted",
  awaiting_log: "Awaiting trainer log",
  awaiting_confirmation: "Awaiting member confirmation",
  verified: "Verified",
  review_required: "Review required",
  cancelled: "Cancelled",
  no_show: "No-show",
};

/** What the member/trainer should do next, in plain language. */
export const SESSION_NEXT_ACTION: Record<SessionStatus, string> = {
  booked: "Deliver the booked session",
  in_progress: "Ask the member to open their completion code",
  code_ready: "Scan the member's completion code",
  code_accepted: "Log the session",
  awaiting_log: "Log the session",
  awaiting_confirmation: "Waiting on the member — auto-verifies after 12 hours",
  verified: "Nothing — payout eligible",
  review_required: "Manager review required",
  cancelled: "Rebook the session",
  no_show: "Rebook the session",
};

export function payoutStatusOf(s: SessionPlan): PayoutStatus {
  switch (s.status) {
    case "verified":
      return "Payout eligible";
    case "awaiting_confirmation":
      return "Awaiting member confirmation";
    case "code_ready":
    case "code_accepted":
    case "awaiting_log":
      return "Verification in progress";
    case "in_progress":
      return "Session in progress";
    case "review_required":
      return "Review required";
    default:
      return "Not started";
  }
}


/** Pack balance: 3 credits, reserved when the completion code is scanned, deducted at verification. */
export function packBalance(s: JourneyState) {
  const total = s.sessions.length;
  const deducted = s.sessions.filter((x) => x.deducted).length;
  const reserved = s.sessions.filter((x) => x.reserved).length;
  return { total, deducted, reserved, remaining: total - deducted - reserved };
}

export function exceptions(s: JourneyState): SessionPlan[] {
  return s.sessions.filter(
    (x) =>
      x.status === "review_required" ||
      x.status === "no_show" ||
      x.status === "cancelled" ||
      (x.checkinMethod === "manual" && x.status !== "verified"),
  );
}

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
