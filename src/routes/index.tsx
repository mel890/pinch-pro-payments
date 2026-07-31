import { createFileRoute } from "@tanstack/react-router";
import vezaptLogo from "@/assets/vezapt-logo.png.asset.json";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Check,
  Sparkles,
  Minus,
  Plus,
  ScanLine,
  Users,
  TrendingUp,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VezaPT × Pinch — Live Pitch Walkthrough" },
      {
        name: "description",
        content:
          "A presenter-controlled walkthrough of one prepaid PT pack becoming recurring revenue: manager dashboard, trainer app and member SMS moving in sync.",
      },
      { property: "og:title", content: "VezaPT × Pinch — Live Pitch Walkthrough" },
      {
        property: "og:description",
        content:
          "One story, three synced views: Northside Club's Kickstart campaign, Sarah's trainer app and Alex's phone.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PitchDemo,
});

/* ── Hardcoded story ─────────────────────────────────────────────────── */

const STEPS = [
  "Campaign live",
  "Alex buys the Kickstart Pack",
  "VezaPT auto-matches Sarah",
  "Sarah accepts the opportunity",
  "Session 1 verified",
  "Sessions 2 & 3 delivered",
  "Member feedback captured",
  "Sarah recommends 2×/week",
  "Alex agrees — recurring starts",
  "Conversion lands across the club",
] as const;

const SESSION_TITLES = ["Understand", "Progress", "Review"] as const;

/** How many of the 3 sessions the script has unlocked at this step. */
export function sessionsAvailable(step: number): number {
  if (step >= 5) return 3;
  if (step >= 4) return 1;
  return 0;
}

const CONFIDENCE = [5, 6, 7, 8] as const;
const VISITS = [1.4, 1.9, 2.3, 2.6] as const;
const CLARITY = [4, 6, 7, 8] as const;

function metrics(step: number, v: number) {
  return {
    packs: 12 + (step >= 1 ? 1 : 0),
    verified: 148 + v,
    conversions: 5 + (step >= 9 ? 1 : 0),
    recurring: step >= 9 ? 1800 : 1620,
    r30: step >= 9 ? 94 : 92,
    r60: step >= 9 ? 81 : 78,
    r90: step >= 9 ? 66 : 61,
    confidence: CONFIDENCE[v],
    visits: VISITS[v],
    clarity: CLARITY[v],
  };
}

function stage(step: number, v: number) {
  if (step >= 9) return "Converted";
  if (step >= 4) return `In sessions ${v}/3`;
  if (step >= 3) return "Matched · booked";
  if (step >= 2) return "Matched";
  if (step >= 1) return "Bought";
  return "—";
}

/* ── Small utilities ─────────────────────────────────────────────────── */

function useCountUp(value: number, decimals = 0) {
  const [display, setDisplay] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const start = from.current;
    if (start === value) return;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / 700);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(start + (value - start) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return display.toFixed(decimals);
}

function Stat({
  label,
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  highlight,
}: {
  label: string;
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  highlight?: boolean;
}) {
  const shown = useCountUp(value, decimals);
  return (
    <div
      className={`rounded-2xl border p-4 transition-colors duration-500 ${
        highlight
          ? "border-pitch-cyan/50 bg-pitch-cyan/10"
          : "border-white/10 bg-white/[0.03]"
      }`}
    >
      <p className="text-[10px] uppercase tracking-[0.16em] text-white/45">
        {label}
      </p>
      <p
        className={`mt-1.5 font-mono text-2xl font-semibold tabular-nums ${
          highlight ? "text-pitch-cyan" : "text-white"
        }`}
      >
        {prefix}
        {shown}
        {suffix}
      </p>
    </div>
  );
}

function Bar({
  label,
  value,
  max,
  suffix = "",
  decimals = 0,
}: {
  label: string;
  value: number;
  max: number;
  suffix?: string;
  decimals?: number;
}) {
  const shown = useCountUp(value, decimals);
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-white/60">{label}</span>
        <span className="font-mono text-xs tabular-nums text-pitch-cyan">
          {shown}
          {suffix}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-pitch-cyan transition-[width] duration-700 ease-out"
          style={{ width: `${Math.min(100, (value / max) * 100)}%` }}
        />
      </div>
    </div>
  );
}

/* ── Manager dashboard (cyan) ────────────────────────────────────────── */

export type GrowthAction = {
  id: string;
  label: string;
  bonus: number;
  /** who controls the outcome — member-completed bonuses stay pending until Alex acts */
  kind: "member" | "trainer";
  ptInstruction: string;
  memberSms: string;
  memberCta: string;
  memberReply: string;
  counterLabel: string;
  counterBase: number;
  optional?: boolean;
};

export const GROWTH_ACTIONS: GrowthAction[] = [
  {
    id: "review",
    label: "Request a Google review",
    bonus: 15,
    kind: "member",
    ptInstruction: "Ask Alex for a Google review. Paid when the review is left.",
    memberSms:
      "Loved our sessions, Alex 💪 If you've got 30 secs, a quick Google review would mean a lot — no pressure.",
    memberCta: "Leave a Google review ▶",
    memberReply: "Done ✓ left you 5 stars ⭐",
    counterLabel: "Reviews captured",
    counterBase: 23,
  },
  {
    id: "ig",
    label: "IG post & tag",
    bonus: 20,
    kind: "member",
    ptInstruction: "Invite Alex to post & tag. Paid when the tagged post goes live.",
    memberSms:
      "If you post a gym pic, tag me @sarahnguyen.pt & I'll repost you 🙌 only if you're keen!",
    memberCta: "Post & tag @sarahnguyen.pt ▶",
    memberReply: "Posted & tagged you 📸",
    counterLabel: "Tagged posts",
    counterBase: 11,
  },
];

function ManagerDashboard({
  step,
  verified,
  activeActions,
  toggleAction,
  askedActions,
  doneActions,
}: {
  step: number;
  verified: number;
  activeActions: string[];
  toggleAction: (id: string) => void;
  askedActions: string[];
  doneActions: string[];
}) {
  const m = metrics(step, verified);
  const completedList = GROWTH_ACTIONS.filter((a) => doneActions.includes(a.id));
  const completedActions = completedList.length;


  return (
    <section className="rounded-3xl border border-white/10 bg-pitch-navy p-5 shadow-[0_30px_90px_rgba(0,0,0,0.45)] sm:p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-pitch-cyan">
            Manager dashboard
          </p>
          <h2 className="mt-1 text-xl font-semibold text-white">
            Northside Club · Kickstart Campaign
          </h2>
        </div>
        <span className="rounded-full border border-pitch-cyan/40 bg-pitch-cyan/10 px-3 py-1 text-[11px] font-medium text-pitch-cyan">
          Campaign live
        </span>
      </header>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Packs sold" value={m.packs} highlight={step === 1} />
        <Stat
          label="Sessions verified"
          value={m.verified}
          highlight={step === 4 || step === 5}
        />
        <Stat label="Conversions" value={m.conversions} highlight={step === 9} />
        <Stat
          label="Recurring revenue"
          value={m.recurring}
          prefix="$"
          suffix="/wk"
          highlight={step === 9}
        />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3">
        <Stat label="30-day retention" value={m.r30} suffix="%" highlight={step === 9} />
        <Stat label="60-day retention" value={m.r60} suffix="%" highlight={step === 9} />
        <Stat label="90-day retention" value={m.r90} suffix="%" highlight={step === 9} />
      </div>

      {step >= 2 && (
        <div
          key={`match-${step >= 2}`}
          className="pitch-rise mt-4 flex items-start gap-3 rounded-2xl border border-pitch-cyan/30 bg-pitch-cyan/[0.07] p-4"
        >
          <Sparkles className="mt-0.5 size-4 shrink-0 text-pitch-cyan" />
          <p className="text-sm text-white/80">
            <span className="font-medium text-white">
              VezaPT matched Alex → Sarah
            </span>{" "}
            <span className="text-white/55">
              (schedule · capacity · coaching fit)
            </span>
          </p>
        </div>
      )}

      {/* Journey row */}
      <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-full bg-pitch-cyan/15 font-semibold text-pitch-cyan">
              AM
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">Alex Morgan</p>
              <p className="truncate text-xs text-white/50">
                Build strength &amp; train consistently
              </p>
            </div>
          </div>
          <span
            className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-medium transition-colors duration-500 ${
              step >= 9
                ? "border-pitch-cyan/50 bg-pitch-cyan/15 text-pitch-cyan"
                : "border-white/15 text-white/70"
            }`}
          >
            {stage(step, verified)}
          </span>
        </div>

        <ol className="mt-4 grid grid-cols-5 gap-2">
          {[
            { l: "Bought", at: 1, min: 0 },
            { l: "Matched", at: 2, min: 0 },
            { l: "1/3", at: 4, min: 1 },
            { l: "3/3", at: 5, min: 3 },
            { l: "Converted", at: 9, min: 0 },
          ].map((n) => {
            const on = step >= n.at && verified >= n.min;
            return (
              <li key={n.l} className="text-center">
                <div
                  className={`h-1.5 rounded-full transition-colors duration-500 ${
                    on ? "bg-pitch-cyan" : "bg-white/10"
                  }`}
                />
                <p
                  className={`mt-1.5 text-[10px] ${on ? "text-pitch-cyan" : "text-white/35"}`}
                >
                  {n.l}
                </p>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Member progress */}
      <div className="mt-4 grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:grid-cols-2">
        <Bar label="Weekly visits" value={m.visits} max={3} decimals={1} />
        <Bar label="Programme clarity" value={m.clarity} max={10} suffix="/10" />
      </div>

      {step >= 6 && (
        <p className="pitch-rise mt-4 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/75">
          <Check className="size-4 text-pitch-cyan" /> Feedback captured — Alex
          rated session 3 😀
        </p>
      )}

      {/* Revenue line */}
      <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-[10px] uppercase tracking-[0.16em] text-white/45">
          Revenue from this journey
        </p>
        <dl className="mt-3 space-y-2 text-sm">
          <Row k="Kickstart pack (one-off)" v={step >= 1 ? "$249" : "—"} />
          <Row k="Campaign fee to club" v={step >= 1 ? "$50" : "—"} />
          <Row
            k="Recurring coaching"
            v={step >= 9 ? "$180/wk" : "—"}
            accent={step >= 9}
          />
        </dl>
        {step >= 9 && (
          <p className="pitch-rise mt-3 flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium" style={{ borderColor: "rgba(214,38,84,0.45)", background: "rgba(214,38,84,0.12)", color: "#ff7ea2" }}>
            <TrendingUp className="size-3.5" /> Recurring billing active · via Pinch
          </p>
        )}
      </div>

      {/* Growth Actions (club-defined) */}
      <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[10px] uppercase tracking-[0.16em] text-white/45">
            Growth Actions
          </p>
          <p className="font-mono text-xs tabular-nums text-white/60">
            Actions completed:{" "}
            <span className="text-pitch-cyan">{completedActions}</span>
          </p>
        </div>

        <div className="mt-3 space-y-2">
          {GROWTH_ACTIONS.map((a) => {
            const on = activeActions.includes(a.id);
            const asked = askedActions.includes(a.id);
            const done = doneActions.includes(a.id);
            return (
              <div
                key={a.id}
                className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 transition-colors duration-300 ${
                  on
                    ? "border-pitch-cyan/50 bg-pitch-cyan/10"
                    : `border-white/10 bg-white/[0.02] ${a.optional ? "opacity-55" : ""}`
                }`}
              >
                <div className="min-w-0">
                  <p
                    className={`truncate text-sm ${on ? "text-pitch-cyan" : "text-white/75"}`}
                  >
                    {a.label}
                    {a.optional && !on && (
                      <span className="ml-2 text-[10px] uppercase tracking-wider text-white/35">
                        optional
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-white/45">
                    +${a.bonus} trainer bonus
                    {on && (
                      <>
                        {" · "}
                        <span className="font-mono tabular-nums">
                          {asked ? 1 : 0} asked · {done ? 1 : 0} completed
                        </span>
                        {" · "}
                        <span
                          style={{ color: done ? "#ff7ea2" : "rgba(255,255,255,0.4)" }}
                        >
                          {done ? "Paid via Pinch" : asked ? "Pending" : "Not asked"}
                        </span>
                      </>
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleAction(a.id)}
                  aria-pressed={on}
                  className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors duration-300 ${
                    on
                      ? "border-pitch-cyan/60 bg-pitch-cyan/20 text-pitch-cyan"
                      : "border-white/20 text-white/60"
                  }`}
                >
                  {on ? "Active" : "Activate"}
                </button>
              </div>
            );
          })}
        </div>

        <p className="mt-3 text-[11px] text-white/45">
          Club-configurable — bonuses paid via Pinch
        </p>

        {completedList.length > 0 && (
          <div className="mt-3 space-y-2">
            {completedList.map((a) => (
              <div key={a.id} className="grid gap-1">
                <p className="font-mono text-[11px] tabular-nums text-white/55">
                  {a.counterLabel}:{" "}
                  <span className="text-pitch-cyan">{a.counterBase + 1}</span>
                </p>
                <p
                  className="pitch-pop flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium"
                  style={{
                    borderColor: "rgba(214,38,84,0.45)",
                    background: "rgba(214,38,84,0.12)",
                    color: "#ff7ea2",
                  }}
                >
                  <Check className="size-3.5" /> +${a.bonus} → Sarah · via Pinch
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function Row({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-white/55">{k}</dt>
      <dd
        className={`font-mono tabular-nums ${accent ? "text-pitch-cyan" : "text-white/85"}`}
      >
        {v}
      </dd>
    </div>
  );
}

/* ── Phone frame ─────────────────────────────────────────────────────── */

function Phone({
  label,
  tone,
  children,
}: {
  label: string;
  tone: "violet" | "green";
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <p
        className={`mb-2 text-center text-[10px] uppercase tracking-[0.18em] ${
          tone === "violet" ? "text-pitch-violet" : "text-pitch-green"
        }`}
      >
        {label}
      </p>
      <div className="mx-auto w-full max-w-[300px] rounded-[2.2rem] border border-white/15 bg-black p-2 shadow-[0_30px_90px_rgba(0,0,0,0.5)]">
        <div className="relative h-[620px] overflow-hidden rounded-[1.7rem]">
          <div className="absolute left-1/2 top-2 z-20 h-5 w-24 -translate-x-1/2 rounded-full bg-black" />
          <div className="h-full overflow-y-auto">{children}</div>
        </div>
      </div>
    </div>
  );
}

/* ── PT app (violet) ─────────────────────────────────────────────────── */

function PtApp({
  step,
  verified,
  scanSession,
  playSessions,
  playing,
  perWeek,
  setPerWeek,
  activeActions,
  askedActions,
  doneActions,
  askAction,
}: {
  step: number;
  verified: number;
  scanSession: () => void;
  playSessions: () => void;
  playing: boolean;
  perWeek: number;
  setPerWeek: (n: number) => void;
  activeActions: string[];
  askedActions: string[];
  doneActions: string[];
  askAction: (id: string) => void;
}) {
  const sessionsDone = verified;
  const available = sessionsAvailable(step);
  const nextSession = sessionsDone < available ? sessionsDone : -1;
  return (
    <div className="min-h-full bg-pitch-ptbg px-4 pb-6 pt-9 text-white">
      <div className="flex items-center gap-2">
        <div className="grid size-8 place-items-center rounded-xl bg-pitch-violet/25 text-xs font-bold text-pitch-violet">
          SN
        </div>
        <div>
          <p className="text-sm font-semibold">Sarah Nguyen</p>
          <p className="text-[10px] text-white/45">Northside Club</p>
        </div>
      </div>

      {step === 0 && (
        <div className="pitch-rise mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-center">
          <Users className="mx-auto size-5 text-white/30" />
          <p className="mt-2 text-sm text-white/55">No opportunities right now</p>
        </div>
      )}

      {step >= 2 && (
        <div className="pitch-rise mt-4 rounded-2xl border border-pitch-violet/40 bg-pitch-violet/10 p-4">
          <p className="text-[10px] uppercase tracking-[0.16em] text-pitch-violet">
            Prepaid opportunity
          </p>
          <p className="mt-1.5 text-base font-semibold">Alex Morgan</p>
          <p className="mt-1 text-xs text-white/60">
            Goal: Build strength &amp; train consistently
          </p>
          <p className="mt-2 text-xs text-white/70">
            3-session Kickstart · 45 min each
          </p>
          <p className="mt-3 font-mono text-lg font-semibold text-pitch-violet">
            $199 · payout eligible
          </p>
          {step === 2 ? (
            <div className="mt-3 rounded-xl bg-pitch-violet px-4 py-2.5 text-center text-sm font-semibold">
              Accept opportunity
            </div>
          ) : (
            <p className="pitch-pop mt-3 flex items-center justify-center gap-1.5 rounded-xl border border-pitch-green/40 bg-pitch-green/10 px-4 py-2.5 text-sm font-semibold text-pitch-green">
              <Check className="size-4" /> Accepted
            </p>
          )}
        </div>
      )}

      {step >= 4 && (
        <div className="pitch-rise mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-[10px] uppercase tracking-[0.16em] text-white/45">
            Session runner
          </p>
          <div className="mt-3 space-y-2">
            {SESSION_TITLES.map((t, i) => {
              const done = i < sessionsDone;
              const isNext = i === nextSession;
              return (
                <div
                  key={t}
                  className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm transition-colors duration-500 ${
                    done
                      ? "border-pitch-green/35 bg-pitch-green/10"
                      : isNext
                        ? "border-pitch-violet/45 bg-pitch-violet/10"
                        : "border-white/10 bg-white/[0.02] text-white/45"
                  }`}
                >
                  <span>
                    {i + 1}. {t}
                  </span>
                  {done ? (
                    <span className="pitch-pop flex items-center gap-1 text-xs font-medium text-pitch-green">
                      <Check className="size-3.5" /> Session {i + 1} verified ✓
                    </span>
                  ) : isNext ? (
                    <button
                      type="button"
                      onClick={scanSession}
                      className="flex items-center gap-1.5 rounded-lg bg-pitch-violet px-2.5 py-1 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                    >
                      <ScanLine className="size-3.5" /> Scan check-in
                    </button>
                  ) : (
                    <span className="flex items-center gap-1 text-xs">
                      <ScanLine className="size-3.5" /> Awaiting check-in
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          {step >= 5 && sessionsDone < 3 && (
            <button
              type="button"
              onClick={playSessions}
              disabled={playing}
              className="mt-3 w-full rounded-xl border border-pitch-violet/40 bg-pitch-violet/10 px-3 py-2 text-xs font-semibold text-pitch-violet disabled:opacity-60"
            >
              {playing ? "Playing sessions…" : "▶ Play sessions"}
            </button>
          )}
        </div>
      )}


      {step >= 6 && (
        <div className="pitch-rise mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-[10px] uppercase tracking-[0.16em] text-white/45">
            Member pulse
          </p>
          <p className="mt-2 text-sm">
            😀 Alex felt great after session 3 — confidence 8/10
          </p>
        </div>
      )}

      {step >= 6 && activeActions.length > 0 && (
        <div className="pitch-rise mt-4 space-y-3">
          {GROWTH_ACTIONS.filter((a) => activeActions.includes(a.id)).map((a) => {
            const asked = askedActions.includes(a.id);
            const done = doneActions.includes(a.id);
            return (
              <div
                key={a.id}
                className="rounded-2xl border border-pitch-violet/40 bg-pitch-violet/10 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-pitch-violet">
                    Bonus Opportunity
                  </p>
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold"
                    style={{
                      background: done ? "rgba(214,38,84,0.18)" : "rgba(255,255,255,0.06)",
                      color: done ? "#ff7ea2" : "rgba(255,255,255,0.45)",
                    }}
                  >
                    +${a.bonus} · via Pinch
                  </span>
                </div>
                <p className="mt-1.5 text-sm font-semibold">{a.label}</p>
                <p className="mt-1 text-xs text-white/60">{a.ptInstruction}</p>

                {done ? (
                  <p
                    className="pitch-pop mt-3 flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold"
                    style={{ background: "rgba(214,38,84,0.18)", color: "#ff7ea2" }}
                  >
                    <Check className="size-4" /> Completed ✓ +${a.bonus} · via Pinch
                  </p>
                ) : asked ? (
                  <p className="mt-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-center text-xs font-medium text-white/55">
                    Pending — awaiting Alex
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => askAction(a.id)}
                    className="mt-3 w-full rounded-xl bg-pitch-violet px-4 py-2.5 text-sm font-semibold"
                  >
                    {a.kind === "trainer" ? "Mark as done" : "Mark as asked"}
                  </button>
                )}

                {!done && (
                  <p className="mt-2 text-center text-[10px] text-white/40">
                    {a.kind === "trainer"
                      ? "Paid via Pinch when you complete it"
                      : "Paid via Pinch only when Alex completes it"}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}




      {step >= 7 && (
        <div className="pitch-rise mt-4 rounded-2xl border border-pitch-violet/40 bg-pitch-violet/10 p-4">
          <p className="text-[10px] uppercase tracking-[0.16em] text-pitch-violet">
            Recommended sessions per week
          </p>
          <div className="mt-3 flex items-center justify-center gap-5">
            <button
              type="button"
              onClick={() => setPerWeek(Math.max(1, perWeek - 1))}
              aria-label="Fewer sessions per week"
              className="grid size-9 place-items-center rounded-full border border-white/15 text-white/70"
            >
              <Minus className="size-4" />
            </button>
            <span className="font-mono text-3xl font-semibold text-pitch-violet tabular-nums">
              {perWeek}
            </span>
            <button
              type="button"
              onClick={() => setPerWeek(Math.min(4, perWeek + 1))}
              aria-label="More sessions per week"
              className="grid size-9 place-items-center rounded-full border border-white/15 text-white/70"
            >
              <Plus className="size-4" />
            </button>
          </div>
          <p
            className={`mt-3 rounded-xl px-4 py-2.5 text-center text-sm font-semibold ${
              step >= 8
                ? "border border-pitch-green/40 bg-pitch-green/10 text-pitch-green"
                : "bg-pitch-violet text-white"
            }`}
          >
            {step >= 8 ? "Recommendation sent ✓" : "Send recommendation to Alex"}
          </p>
        </div>
      )}

      {step >= 9 && (
        <div
          className="pitch-pop mt-4 rounded-2xl border p-4"
          style={{
            borderColor: "rgba(214,38,84,0.45)",
            background: "rgba(214,38,84,0.12)",
          }}
        >
          <p className="text-sm font-semibold" style={{ color: "#ff7ea2" }}>
            Ongoing client activated
          </p>
          <p className="mt-1 text-xs text-white/70">
            Twice-weekly coaching · recurring payout · via Pinch
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Member phone — Messages UI (green) ──────────────────────────────── */

function FakeQr() {
  const cells = 121;
  return (
    <div className="mt-2 inline-block rounded-xl bg-white p-2">
      <div className="grid grid-cols-11 gap-[2px]">
        {Array.from({ length: cells }).map((_, i) => {
          const r = Math.floor(i / 11);
          const c = i % 11;
          const corner =
            (r < 3 && c < 3) || (r < 3 && c > 7) || (r > 7 && c < 3);
          const on = corner || (r * 7 + c * 5 + ((r * c) % 3)) % 3 === 0;
          return (
            <span
              key={i}
              className="size-[7px] rounded-[1px]"
              style={{ background: on ? "#0b1220" : "transparent" }}
            />
          );
        })}
      </div>
    </div>
  );
}

type Msg = { id: string; from: "club" | "alex"; body: React.ReactNode };

function memberThread(
  step: number,
  verified: number,
  askedActions: string[],
  doneActions: string[],
  completeAction: (id: string) => void,
): Msg[] {
  const msgs: Msg[] = [
    {
      id: "hello",
      from: "club",
      body: (
        <span>
          Hi Alex 👋 Northside Club here. Ready when you are — our PT Kickstart
          Pack is 3 × 45-min sessions.
        </span>
      ),
    },
  ];
  if (step >= 1)
    msgs.push({
      id: "paid",
      from: "club",
      body: (
        <span
          className="block rounded-xl px-3 py-2"
          style={{ background: "rgba(214,38,84,0.10)", color: "#a2103a" }}
        >
          <strong>Payment received ✓ $249</strong>
          <br />
          <span className="text-[11px] opacity-80">
            PT Kickstart Pack · via Pinch
          </span>
        </span>
      ),
    });
  if (step >= 3)
    msgs.push({
      id: "matched",
      from: "club",
      body: <span>You're matched with Sarah 🎉 First session booked.</span>,
    });
  for (let i = 0; i < sessionsAvailable(step); i++) {
    const n = i + 1;
    const done = i < verified;
    msgs.push({
      id: `s${n}`,
      from: "club",
      body: (
        <span>
          Session {n} of 3 — show this at check-in 💪
          <span
            className={`mt-2 block ${done ? "opacity-40" : ""}`}
          >
            <FakeQr />
          </span>
          {done ? (
            <span className="mt-2 block rounded-lg bg-[#22C55E]/15 px-2 py-1 text-[12px] font-semibold text-[#15803d]">
              Checked in ✓
            </span>
          ) : (
            <span className="mt-2 block text-[11px] opacity-70">
              Goal: Build strength &amp; train consistently
            </span>
          )}
        </span>
      ),
    });
  }
  if (step >= 6) {
    msgs.push({
      id: "fb",
      from: "club",
      body: (
        <span>
          How was your session?
          <span className="mt-2 flex gap-2 text-lg">
            <span className="rounded-full bg-white px-2 py-0.5 ring-2 ring-[#22C55E]">
              😀
            </span>
            <span className="rounded-full bg-white px-2 py-0.5 opacity-50">
              🙂
            </span>
            <span className="rounded-full bg-white px-2 py-0.5 opacity-50">
              😐
            </span>
          </span>
        </span>
      ),
    });
    msgs.push({ id: "fb-a", from: "alex", body: <span>😀</span> });
  }
  for (const a of GROWTH_ACTIONS) {
    if (!askedActions.includes(a.id)) continue;
    const done = doneActions.includes(a.id);
    msgs.push({
      id: `ga-${a.id}`,
      from: "club",
      body: (
        <span>
          {a.memberSms}
          {!done && (
            <button
              type="button"
              onClick={() => completeAction(a.id)}
              className="mt-2 block w-full rounded-xl bg-pitch-green px-3 py-1.5 text-[12px] font-semibold text-white"
            >
              {a.memberCta}
            </button>
          )}
        </span>
      ),
    });
    if (done)
      msgs.push({
        id: `ga-${a.id}-a`,
        from: "alex",
        body: <span>{a.memberReply}</span>,
      });
  }
  if (step >= 7)

    msgs.push({
      id: "rec",
      from: "club",
      body: (
        <span>
          Sarah recommends 2 sessions/week to reach your goal — $180/week.
          <span className="mt-1 block font-medium underline">
            Tap to start ▶
          </span>
        </span>
      ),
    });
  if (step >= 8)
    msgs.push({ id: "rec-a", from: "alex", body: <span>Let's do it 💪</span> });
  if (step >= 9)
    msgs.push({
      id: "set",
      from: "club",
      body: (
        <span
          className="block rounded-xl px-3 py-2"
          style={{ background: "rgba(214,38,84,0.10)", color: "#a2103a" }}
        >
          <strong>You're all set! ✓</strong>
          <br />
          <span className="text-[11px] opacity-80">
            Twice-Weekly Coaching · $180/week · via Pinch
          </span>
        </span>
      ),
    });
  return msgs;
}

function MemberPhone({
  step,
  verified,
  askedActions,
  doneActions,
  completeAction,
}: {
  step: number;
  verified: number;
  askedActions: string[];
  doneActions: string[];
  completeAction: (id: string) => void;
}) {
  const msgs = memberThread(
    step,
    verified,
    askedActions,
    doneActions,
    completeAction,
  );
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [step, verified, askedActions.length, doneActions.length]);


  const showLinkPage = step === 8;

  return (
    <div className="relative min-h-full bg-[#f2f2f7] text-[#111]">
      <div className="sticky top-0 z-10 border-b border-black/10 bg-[#f7f7fb]/95 px-4 pb-2 pt-9 text-center backdrop-blur">
        <p className="text-sm font-semibold">Northside Club</p>
        <p className="text-[10px] text-black/45">SMS</p>
      </div>

      <div className="space-y-2.5 px-3 py-4">
        {msgs.map((m) => (
          <div
            key={m.id}
            className={`pitch-rise flex ${m.from === "alex" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-[13px] leading-snug ${
                m.from === "alex"
                  ? "rounded-br-md text-white"
                  : "rounded-bl-md bg-[#e5e5ea] text-[#111]"
              }`}
              style={
                m.from === "alex" ? { background: "#22C55E" } : undefined
              }
            >
              {m.body}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {showLinkPage && (
        <div className="pitch-pop absolute inset-0 z-20 flex flex-col justify-between bg-white px-5 pb-6 pt-12">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-pitch-green">
              Northside Club
            </p>
            <h3 className="mt-2 text-xl font-semibold">
              Twice-Weekly Coaching
            </h3>
            <p className="mt-1 text-sm text-black/55">
              With Sarah · 2 sessions per week
            </p>
            <div className="mt-5 rounded-2xl border border-pitch-green/40 bg-pitch-green/10 p-4">
              <p className="text-[10px] uppercase tracking-[0.16em] text-pitch-green">
                Your goal
              </p>
              <p className="mt-1 text-sm font-medium">
                Build strength &amp; train consistently
              </p>
            </div>
            <div
              className="mt-3 rounded-2xl border p-4"
              style={{
                borderColor: "rgba(214,38,84,0.35)",
                background: "rgba(214,38,84,0.07)",
              }}
            >
              <p className="font-mono text-2xl font-semibold" style={{ color: "#D62654" }}>
                $180/week
              </p>
              <p className="mt-0.5 text-[11px] text-black/55">via Pinch</p>
            </div>
          </div>
          <div className="rounded-2xl bg-pitch-green py-3 text-center text-sm font-semibold text-white">
            Agree &amp; start
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────── */

function PitchDemo() {
  const [step, setStep] = useState(0);
  const [perWeek, setPerWeek] = useState(2);
  const [tab, setTab] = useState<"manager" | "pt" | "member">("manager");
  const [activeActions, setActiveActions] = useState<string[]>(["review"]);
  const [askedActions, setAskedActions] = useState<string[]>([]);
  const [doneActions, setDoneActions] = useState<string[]>([]);
  const [scanned, setScanned] = useState(0);
  const [playing, setPlaying] = useState(false);

  const toggleAction = useCallback((id: string) => {
    setActiveActions((a) =>
      a.includes(id) ? a.filter((x) => x !== id) : [...a, id],
    );
    setAskedActions((a) => a.filter((x) => x !== id));
    setDoneActions((a) => a.filter((x) => x !== id));
  }, []);

  const askAction = useCallback((id: string) => {
    setAskedActions((a) => (a.includes(id) ? a : [...a, id]));
    const meta = GROWTH_ACTIONS.find((a) => a.id === id);
    if (meta?.kind === "trainer") {
      setDoneActions((d) => (d.includes(id) ? d : [...d, id]));
    }
  }, []);

  const completeAction = useCallback((id: string) => {
    setDoneActions((d) => (d.includes(id) ? d : [...d, id]));
  }, []);

  const verified =
    step >= 6 ? 3 : Math.min(scanned, sessionsAvailable(step));

  const scanSession = useCallback(() => {
    setScanned((n) => Math.min(3, n + 1));
  }, []);

  const playSessions = useCallback(() => {
    setPlaying(true);
  }, []);

  useEffect(() => {
    if (!playing) return;
    if (verified >= sessionsAvailable(step)) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setScanned((n) => Math.min(3, n + 1)), 1100);
    return () => clearTimeout(t);
  }, [playing, verified, step]);

  const next = useCallback(() => setStep((s) => Math.min(9, s + 1)), []);
  const prev = useCallback(() => setStep((s) => Math.max(0, s - 1)), []);
  const reset = useCallback(() => {
    setStep(0);
    setPerWeek(2);
    setScanned(0);
    setPlaying(false);
    setActiveActions(["review"]);
    setAskedActions([]);
    setDoneActions([]);
  }, []);



  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  return (
    <div className="min-h-screen bg-[#060d16] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#060d16]/90 backdrop-blur-xl">
        <div className="mx-auto grid max-w-[1500px] grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <img
              src={vezaptLogo.url}
              alt="VezaPT"
              className="h-7 w-auto shrink-0"
            />

            <span
              className="text-xs font-medium"
              style={{ color: "#D62654" }}
            >
              × Pinch
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={prev}
              disabled={step === 0}
              className="grid size-9 place-items-center rounded-xl border border-white/15 text-white/80 transition-colors hover:bg-white/10 disabled:opacity-30"
              aria-label="Previous step"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="hidden min-w-[240px] text-center text-xs text-white/70 sm:block">
              Step {step} of 9 — {STEPS[step]}
            </span>
            <button
              type="button"
              onClick={next}
              disabled={step === 9}
              className="flex h-9 items-center gap-1.5 rounded-xl bg-pitch-cyan px-4 text-sm font-semibold text-[#06202a] transition-opacity hover:opacity-90 disabled:opacity-30"
            >
              Next <ChevronRight className="size-4" />
            </button>
            <button
              type="button"
              onClick={reset}
              className="grid size-9 place-items-center rounded-xl border border-white/15 text-white/80 transition-colors hover:bg-white/10"
              aria-label="Reset demo"
            >
              <RotateCcw className="size-4" />
            </button>
          </div>
        </div>
        <p className="px-4 pb-2 text-center text-xs text-white/70 sm:hidden">
          Step {step} of 9 — {STEPS[step]}
        </p>
      </header>

      {/* Mobile tabs */}
      <div className="mx-auto flex max-w-[1500px] gap-2 px-4 pt-4 xl:hidden">
        {(
          [
            ["manager", "Manager"],
            ["pt", "PT app"],
            ["member", "Member"],
          ] as const
        ).map(([k, l]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
              tab === k
                ? "border-pitch-cyan/50 bg-pitch-cyan/15 text-pitch-cyan"
                : "border-white/15 text-white/60"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      <main className="mx-auto grid max-w-[1500px] gap-6 px-4 py-6 sm:px-6 xl:grid-cols-[52fr_48fr]">
        <div className={tab === "manager" ? "block" : "hidden xl:block"}>
          <ManagerDashboard
            step={step}
            verified={verified}
            activeActions={activeActions}
            toggleAction={toggleAction}
            askedActions={askedActions}
            doneActions={doneActions}
          />
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className={tab === "pt" ? "block" : "hidden xl:block"}>
            <Phone label="PT app · Sarah" tone="violet">
              <PtApp
                step={step}
                verified={verified}
                scanSession={scanSession}
                playSessions={playSessions}
                playing={playing}
                perWeek={perWeek}
                setPerWeek={setPerWeek}
                activeActions={activeActions}
                askedActions={askedActions}
                doneActions={doneActions}
                askAction={askAction}
              />

            </Phone>
          </div>
          <div className={tab === "member" ? "block" : "hidden xl:block"}>
            <Phone label="Member phone · Alex" tone="green">
              <MemberPhone
                step={step}
                verified={verified}
                askedActions={askedActions}
                doneActions={doneActions}
                completeAction={completeAction}
              />
            </Phone>
          </div>
        </div>
      </main>

    </div>
  );
}
