import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Play,
  QrCode,
  RotateCcw,
  ScanLine,
  Sparkles,
  Minus,
  Plus,
} from "lucide-react";
import { createPitchSubscription } from "@/lib/pitch-demo.functions";

export const Route = createFileRoute("/pitch-demo")({
  head: () => ({
    meta: [
      { title: "VezaPT × Pinch — Live Pitch Demo" },
      {
        name: "description",
        content:
          "Presenter-controlled walkthrough of the VezaPT member journey: prepaid Kickstart pack, matched trainer, verified sessions and recurring coaching billed through Pinch.",
      },
      { property: "og:title", content: "VezaPT × Pinch — Live Pitch Demo" },
      {
        property: "og:description",
        content:
          "A scripted three-screen demo: manager dashboard, trainer app and member SMS, ending in a live Pinch subscription.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PitchDemo,
});

/* ------------------------------------------------------------------ */
/* Story constants                                                     */
/* ------------------------------------------------------------------ */

const CYAN = "#00C2CB";
const VIOLET = "#7C3AED";
const CERISE = "#D62654";
const GREEN = "#22C55E";

const MEMBER = "Alex Morgan";
const GOAL = "Build strength & train consistently";
const TRAINER = "Sarah Nguyen";

const STEPS = [
  "Idle — campaign live",
  "Alex buys Kickstart",
  "VezaPT auto-matches",
  "Sarah accepts",
  "Session 1 — QR check-in",
  "Sessions 2 & 3",
  "Feedback captured",
  "Sarah recommends ongoing",
  "Alex agrees — Pinch",
  "Conversion lands",
];

const SESSION_LABELS = ["Understand", "Progress", "Review"];

type SubState = {
  phase: "idle" | "loading" | "done";
  id: string | null;
  status: string | null;
  error: string | null;
};

type Demo = {
  step: number;
  verified: number;
  accepted: boolean;
  feedback: boolean;
  perWeek: number;
  recommended: boolean;
  growthActive: boolean;
  growthAsked: boolean;
  growthDone: boolean;
  sub: SubState;
};

const INITIAL: Demo = {
  step: 0,
  verified: 0,
  accepted: false,
  feedback: false,
  perWeek: 2,
  recommended: false,
  growthActive: false,
  growthAsked: false,
  growthDone: false,
  sub: { phase: "idle", id: null, status: null, error: null },
};

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

function useCountUp(value: number, decimals = 0) {
  const [display, setDisplay] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const start = performance.now();
    const a = from.current;
    const b = value;
    if (a === b) return;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 700);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(a + (b - a) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = b;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return display.toFixed(decimals);
}

function Reveal({
  show,
  children,
  className = "",
}: {
  show: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`transition-all duration-500 ease-out ${
        show
          ? "translate-y-0 opacity-100"
          : "pointer-events-none max-h-0 translate-y-2 overflow-hidden opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}

const money = (n: number) =>
  new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 0,
  }).format(n);

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

function PitchDemo() {
  const [d, setD] = useState<Demo>(INITIAL);
  const patch = useCallback(
    (p: Partial<Demo>) => setD((prev) => ({ ...prev, ...p })),
    [],
  );

  const runSubscription = useCallback(async () => {
    setD((prev) =>
      prev.sub.phase === "idle"
        ? { ...prev, sub: { ...prev.sub, phase: "loading" } }
        : prev,
    );
    try {
      const res = await createPitchSubscription();
      setD((prev) => ({
        ...prev,
        sub: {
          phase: "done",
          id: res.subscriptionId,
          status: res.subscriptionStatus ?? (res.ok ? "active" : null),
          error: res.error,
        },
      }));
    } catch (e: any) {
      setD((prev) => ({
        ...prev,
        sub: {
          phase: "done",
          id: null,
          status: null,
          error: String(e?.message ?? e),
        },
      }));
    }
  }, []);

  const goTo = useCallback(
    (next: number) => {
      const step = Math.max(0, Math.min(STEPS.length - 1, next));
      setD((prev) => {
        const s: Demo = { ...prev, step };
        if (step >= 3) s.accepted = true;
        if (step >= 4) s.verified = Math.max(s.verified, 1);
        if (step >= 5 && step > prev.step) s.verified = 3;
        if (step >= 6) s.feedback = true;
        if (step >= 7) s.recommended = true;
        if (step < 3) s.accepted = false;
        if (step < 4) s.verified = 0;
        if (step === 4) s.verified = Math.min(s.verified, 1);
        if (step < 6) s.feedback = false;
        if (step < 7) s.recommended = false;
        return s;
      });
      if (step >= 8) void runSubscription();
    },
    [runSubscription],
  );

  const reset = () => setD(INITIAL);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goTo(d.step + 1);
      if (e.key === "ArrowLeft") goTo(d.step - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [d.step, goTo]);

  const playSessions = () => {
    let n = Math.max(d.verified, 1);
    const tick = () => {
      n += 1;
      patch({ verified: Math.min(3, n) });
      if (n < 3) setTimeout(tick, 1100);
    };
    if (n < 3) setTimeout(tick, 400);
  };

  return (
    <div className="min-h-screen bg-[#050C15] text-white">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#050C15]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-4 px-5 py-3">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold tracking-tight">
              Veza<span style={{ color: CYAN }}>PT</span>
            </span>
            <span className="text-xs font-semibold" style={{ color: CERISE }}>
              × Pinch
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => goTo(d.step - 1)}
              className="flex h-9 items-center gap-1 rounded-xl border border-white/15 px-3 text-sm text-white/80 transition hover:bg-white/10"
            >
              <ChevronLeft className="size-4" /> Prev
            </button>
            <div className="min-w-[240px] rounded-xl border border-white/10 bg-white/5 px-4 py-1.5 text-center">
              <span className="text-[11px] uppercase tracking-widest text-white/40">
                Step {d.step}
              </span>
              <div className="text-sm font-semibold">{STEPS[d.step]}</div>
            </div>
            <button
              onClick={() => goTo(d.step + 1)}
              className="flex h-9 items-center gap-1 rounded-xl px-4 text-sm font-semibold text-[#04121a] transition hover:brightness-110"
              style={{ background: CYAN }}
            >
              Next <ChevronRight className="size-4" />
            </button>
            <button
              onClick={reset}
              className="flex h-9 items-center gap-1 rounded-xl border border-white/15 px-3 text-sm text-white/70 transition hover:bg-white/10"
            >
              <RotateCcw className="size-4" /> Reset
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1600px] gap-6 px-5 py-6 lg:grid-cols-[52fr_48fr]">
        <ManagerDashboard d={d} onToggleGrowth={() => patch({ growthActive: !d.growthActive })} />
        <div className="grid gap-6 sm:grid-cols-2">
          <PtApp
            d={d}
            onAccept={() => patch({ accepted: true })}
            onScan={() => patch({ verified: Math.min(3, d.verified + 1) })}
            onPlay={playSessions}
            onPerWeek={(n) => patch({ perWeek: n })}
            onRecommend={() => patch({ recommended: true })}
            onMarkAsked={() => patch({ growthAsked: true })}
          />
          <MemberPhone
            d={d}
            onFeedback={() => patch({ feedback: true })}
            onGrowthTap={() => patch({ growthDone: true })}
            onAgree={runSubscription}
          />
        </div>
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Manager dashboard                                                   */
/* ------------------------------------------------------------------ */

function ManagerDashboard({
  d,
  onToggleGrowth,
}: {
  d: Demo;
  onToggleGrowth: () => void;
}) {
  const packs = d.step >= 1 ? 1 : 0;
  const conversions = d.step >= 9 ? 1 : 0;
  const recurring = d.step >= 9 ? 180 : 0;
  const retention = 62 + (d.verified * 4) + (conversions ? 12 : 0);

  const packsC = useCountUp(packs);
  const sessC = useCountUp(d.verified);
  const convC = useCountUp(conversions);
  const revC = useCountUp(recurring);
  const retC = useCountUp(retention);

  const stage =
    d.step >= 9
      ? "Converted"
      : d.verified > 0
        ? `In sessions ${d.verified}/3`
        : d.step >= 2
          ? "Matched"
          : d.step >= 1
            ? "Bought"
            : "Campaign live";

  return (
    <section className="rounded-3xl border border-white/10 bg-[#0A1B2D] p-6 shadow-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">
            Northside Club · Kickstart Campaign
          </h1>
          <p className="text-xs text-white/45">Manager dashboard · live</p>
        </div>
        <span
          className="rounded-full px-3 py-1 text-[11px] font-semibold"
          style={{ background: `${CYAN}1f`, color: CYAN }}
        >
          ● Live
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Tile label="Packs sold" value={packsC} />
        <Tile label="Sessions verified" value={sessC} suffix="/3" />
        <Tile label="Conversions" value={convC} />
        <Tile label="Recurring rev." value={`$${revC}`} suffix="/wk" />
        <Tile label="90-day retention" value={retC} suffix="%" />
      </div>

      {/* Journey rail */}
      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">{MEMBER}</div>
            <div className="text-xs text-white/45">Goal: {GOAL}</div>
          </div>
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold"
            style={{ background: `${CYAN}1f`, color: CYAN }}
          >
            {stage}
          </span>
        </div>
        <div className="mt-4 flex items-center gap-2">
          {["Bought", "Matched", "In sessions", "Converted"].map((s, i) => {
            const on =
              (i === 0 && d.step >= 1) ||
              (i === 1 && d.step >= 2) ||
              (i === 2 && d.verified > 0) ||
              (i === 3 && d.step >= 9);
            return (
              <div key={s} className="flex-1">
                <div
                  className="h-1.5 rounded-full transition-all duration-500"
                  style={{ background: on ? CYAN : "rgba(255,255,255,.12)" }}
                />
                <div
                  className="mt-1.5 text-[11px] transition"
                  style={{ color: on ? CYAN : "rgba(255,255,255,.35)" }}
                >
                  {s}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Member progress */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <Progress label="Confidence" from={5} to={8} v={d.verified} unit="/10" />
        <Progress label="Weekly visits" from={1.4} to={2.6} v={d.verified} decimals={1} />
        <Progress label="Goal clarity" from={4} to={8} v={d.verified} unit="/10" />
      </div>

      {/* Event feed */}
      <div className="mt-5 space-y-2">
        <Reveal show={d.step >= 1}>
          <Event
            tone={CERISE}
            title={`${money(249)} · PT Kickstart Pack — payment received`}
            sub="via Pinch · one-off · campaign fee $50 · trainer payout $199"
          />
        </Reveal>
        <Reveal show={d.step >= 2}>
          <Event
            tone={CYAN}
            title={`VezaPT matched ${MEMBER} → ${TRAINER}`}
            sub="schedule · capacity · fit"
          />
        </Reveal>
        <Reveal show={d.step >= 6}>
          <Event tone={CYAN} title="Feedback captured — 😀 great session" sub="Member pulse updated" />
        </Reveal>
        <Reveal show={d.growthDone}>
          <Event tone={CERISE} title="Reviews captured +1 · +$15 → Sarah" sub="Growth bonus · via Pinch" />
        </Reveal>
        <Reveal show={d.step >= 8}>
          <Event
            tone={CERISE}
            title="Twice-Weekly Coaching — $180/week recurring"
            sub={
              d.sub.phase === "loading"
                ? "processing… via Pinch"
                : d.sub.id
                  ? `via Pinch · ${d.sub.id} · ${d.sub.status ?? "active"}`
                  : "via Pinch"
            }
          />
        </Reveal>
        <Reveal show={!!d.sub.error}>
          <div className="rounded-xl border border-white/10 bg-black/40 p-3 font-mono text-[11px] text-white/60">
            {d.sub.error}
          </div>
        </Reveal>
      </div>

      {/* Growth actions */}
      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">Growth Actions</div>
          <span className="text-[11px] text-white/40">
            Club-configurable — bonuses paid via Pinch
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between rounded-xl border p-3 transition"
          style={{
            borderColor: d.growthActive ? CYAN : "rgba(255,255,255,.1)",
            background: d.growthActive ? `${CYAN}12` : "transparent",
          }}
        >
          <div>
            <div className="text-sm">Request Google review</div>
            <div className="text-[11px]" style={{ color: CERISE }}>
              +$15 · via Pinch
            </div>
          </div>
          <button
            onClick={onToggleGrowth}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold transition"
            style={{
              background: d.growthActive ? CYAN : "rgba(255,255,255,.08)",
              color: d.growthActive ? "#04121a" : "rgba(255,255,255,.7)",
            }}
          >
            {d.growthActive ? "Active" : "Activate"}
          </button>
        </div>
        <Reveal show={d.growthAsked}>
          <div className="mt-2 text-[11px] text-white/50">
            1 asked · {d.growthDone ? 1 : 0} completed
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Tile({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string;
  suffix?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
      <div className="text-[11px] uppercase tracking-wider text-white/40">{label}</div>
      <div className="mt-1 font-mono text-2xl font-semibold tabular-nums" style={{ color: CYAN }}>
        {value}
        {suffix ? <span className="text-sm text-white/40">{suffix}</span> : null}
      </div>
    </div>
  );
}

function Progress({
  label,
  from,
  to,
  v,
  unit = "",
  decimals = 0,
}: {
  label: string;
  from: number;
  to: number;
  v: number;
  unit?: string;
  decimals?: number;
}) {
  const value = from + ((to - from) * v) / 3;
  const shown = useCountUp(value, decimals);
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <div className="text-[11px] text-white/40">{label}</div>
      <div className="font-mono text-lg tabular-nums">
        {shown}
        {unit}
      </div>
      <div className="mt-2 h-1 rounded-full bg-white/10">
        <div
          className="h-1 rounded-full transition-all duration-700"
          style={{ width: `${(v / 3) * 100}%`, background: CYAN }}
        />
      </div>
    </div>
  );
}

function Event({ tone, title, sub }: { tone: string; title: string; sub: string }) {
  return (
    <div
      className="rounded-xl border p-3"
      style={{ borderColor: `${tone}55`, background: `${tone}12` }}
    >
      <div className="text-sm font-semibold" style={{ color: tone }}>
        {title}
      </div>
      <div className="text-[11px] text-white/50">{sub}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Phones                                                              */
/* ------------------------------------------------------------------ */

function Phone({
  label,
  bg,
  children,
}: {
  label: string;
  bg: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 text-[11px] uppercase tracking-widest text-white/35">{label}</div>
      <div
        className="mx-auto w-full max-w-[340px] overflow-hidden rounded-[2rem] border-[6px] border-black/70 shadow-2xl"
        style={{ background: bg }}
      >
        <div className="h-6" />
        <div className="max-h-[720px] min-h-[560px] overflow-y-auto px-3 pb-5">{children}</div>
      </div>
    </div>
  );
}

function PtApp({
  d,
  onAccept,
  onScan,
  onPlay,
  onPerWeek,
  onRecommend,
  onMarkAsked,
}: {
  d: Demo;
  onAccept: () => void;
  onScan: () => void;
  onPlay: () => void;
  onPerWeek: (n: number) => void;
  onRecommend: () => void;
  onMarkAsked: () => void;
}) {
  return (
    <Phone label="PT app · Sarah" bg="#14121F">
      <div className="flex items-center justify-between px-1 pb-3">
        <div className="text-sm font-semibold text-white">Sarah Nguyen</div>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
          style={{ background: `${VIOLET}33`, color: "#C4B5FD" }}
        >
          VezaPT
        </span>
      </div>

      {d.step < 2 && (
        <div className="mt-16 text-center text-xs text-white/30">No opportunities yet</div>
      )}

      <Reveal show={d.step >= 2}>
        <div
          className="rounded-2xl border p-4"
          style={{ borderColor: `${VIOLET}66`, background: `${VIOLET}1a` }}
        >
          <div className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: "#C4B5FD" }}>
            <Sparkles className="size-3.5" /> Prepaid opportunity
          </div>
          <div className="mt-2 text-sm font-semibold text-white">{MEMBER}</div>
          <div className="text-xs text-white/55">Goal: {GOAL}</div>
          <div className="mt-2 text-xs text-white/70">3-session Kickstart · 45 min each</div>
          <div className="mt-1 font-mono text-sm" style={{ color: "#C4B5FD" }}>
            $199 · payout eligible
          </div>
          {d.accepted ? (
            <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold" style={{ color: GREEN }}>
              <Check className="size-4" /> Accepted — first session booked
            </div>
          ) : (
            <button
              onClick={onAccept}
              className="mt-3 w-full rounded-xl py-2 text-sm font-semibold text-white transition hover:brightness-110"
              style={{ background: VIOLET }}
            >
              Accept opportunity
            </button>
          )}
        </div>
      </Reveal>

      <Reveal show={d.step >= 4} className="mt-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="text-[11px] uppercase tracking-wider text-white/40">Session runner</div>
          <div className="mt-2 space-y-2">
            {SESSION_LABELS.map((lbl, i) => (
              <div
                key={lbl}
                className="flex items-center justify-between rounded-xl border px-3 py-2 text-xs transition"
                style={{
                  borderColor: d.verified > i ? `${GREEN}66` : "rgba(255,255,255,.1)",
                  background: d.verified > i ? `${GREEN}14` : "transparent",
                }}
              >
                <span className="text-white/80">
                  Session {i + 1} — {lbl}
                </span>
                {d.verified > i ? (
                  <span className="flex items-center gap-1 font-semibold" style={{ color: GREEN }}>
                    <Check className="size-3.5" /> Verified
                  </span>
                ) : (
                  <span className="text-white/30">pending</span>
                )}
              </div>
            ))}
          </div>
          {d.verified < 3 && (
            <div className="mt-3 flex gap-2">
              <button
                onClick={onScan}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-semibold text-white transition hover:brightness-110"
                style={{ background: VIOLET }}
              >
                <ScanLine className="size-4" /> Scan check-in
              </button>
              {d.step >= 5 && (
                <button
                  onClick={onPlay}
                  className="flex items-center gap-1.5 rounded-xl border border-white/15 px-3 text-xs text-white/70"
                >
                  <Play className="size-3.5" /> Play
                </button>
              )}
            </div>
          )}
        </div>
      </Reveal>

      <Reveal show={d.feedback} className="mt-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="text-[11px] uppercase tracking-wider text-white/40">Member pulse</div>
          <div className="mt-1 text-sm text-white">😀 Alex loved the last session</div>
        </div>
      </Reveal>

      <Reveal show={d.growthActive} className="mt-3">
        <div className="rounded-2xl border p-4" style={{ borderColor: `${CERISE}55`, background: `${CERISE}14` }}>
          <div className="text-[11px] font-semibold" style={{ color: CERISE }}>
            Bonus opportunity
          </div>
          <div className="mt-1 text-sm text-white">Request Google review</div>
          <div className="font-mono text-xs" style={{ color: CERISE }}>
            +$15 · via Pinch
          </div>
          {d.growthDone ? (
            <div className="mt-2 text-xs font-semibold" style={{ color: GREEN }}>
              Completed ✓ +$15 via Pinch
            </div>
          ) : d.growthAsked ? (
            <div className="mt-2 text-xs text-white/50">Asked — waiting on Alex</div>
          ) : (
            <button
              onClick={onMarkAsked}
              className="mt-2 w-full rounded-xl border border-white/20 py-1.5 text-xs font-semibold text-white"
            >
              Mark as asked
            </button>
          )}
        </div>
      </Reveal>

      <Reveal show={d.step >= 7} className="mt-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="text-[11px] uppercase tracking-wider text-white/40">
            Recommended sessions / week
          </div>
          <div className="mt-2 flex items-center justify-center gap-4">
            <button
              onClick={() => onPerWeek(Math.max(1, d.perWeek - 1))}
              className="rounded-full border border-white/15 p-1.5 text-white/70"
            >
              <Minus className="size-4" />
            </button>
            <span className="font-mono text-2xl text-white">{d.perWeek}</span>
            <button
              onClick={() => onPerWeek(Math.min(4, d.perWeek + 1))}
              className="rounded-full border border-white/15 p-1.5 text-white/70"
            >
              <Plus className="size-4" />
            </button>
          </div>
          {d.recommended ? (
            <div className="mt-3 text-center text-xs" style={{ color: GREEN }}>
              Sent to Alex ✓
            </div>
          ) : (
            <button
              onClick={onRecommend}
              className="mt-3 w-full rounded-xl py-2 text-sm font-semibold text-white"
              style={{ background: VIOLET }}
            >
              Send to Alex
            </button>
          )}
        </div>
      </Reveal>

      <Reveal show={d.step >= 9} className="mt-3">
        <div className="rounded-2xl border p-4" style={{ borderColor: `${CERISE}55`, background: `${CERISE}14` }}>
          <div className="text-sm font-semibold text-white">Ongoing client activated</div>
          <div className="mt-1 font-mono text-xs" style={{ color: CERISE }}>
            Recurring payout · via Pinch
          </div>
        </div>
      </Reveal>
    </Phone>
  );
}

function Bubble({
  from,
  children,
  tone,
}: {
  from: "them" | "me";
  children: React.ReactNode;
  tone?: string;
}) {
  const me = from === "me";
  return (
    <div className={`flex ${me ? "justify-end" : "justify-start"}`}>
      <div
        className="max-w-[85%] rounded-2xl px-3 py-2 text-[13px] leading-snug"
        style={
          me
            ? { background: tone ?? GREEN, color: "white" }
            : { background: "#E9E9EB", color: "#111" }
        }
      >
        {children}
      </div>
    </div>
  );
}

function MemberPhone({
  d,
  onFeedback,
  onGrowthTap,
  onAgree,
}: {
  d: Demo;
  onFeedback: () => void;
  onGrowthTap: () => void;
  onAgree: () => void;
}) {
  const [linkOpen, setLinkOpen] = useState(false);
  useEffect(() => {
    if (d.step < 8) setLinkOpen(false);
  }, [d.step]);

  const sessionNo = Math.max(1, Math.min(3, d.verified || 1));

  return (
    <Phone label="Member phone · Alex" bg="#FFFFFF">
      <div className="sticky top-0 -mx-3 mb-3 border-b border-black/10 bg-white/90 px-3 py-2 text-center text-[13px] font-semibold text-black backdrop-blur">
        Northside Club
      </div>

      {linkOpen ? (
        <LinkPage d={d} onAgree={onAgree} onBack={() => setLinkOpen(false)} />
      ) : (
        <div className="space-y-2.5">
          <Reveal show={d.step >= 1}>
            <div
              className="rounded-2xl border p-3"
              style={{ borderColor: `${CERISE}55`, background: `${CERISE}0f` }}
            >
              <div className="text-[13px] font-semibold" style={{ color: CERISE }}>
                Payment received ✓ {money(249)}
              </div>
              <div className="text-[11px]" style={{ color: CERISE }}>
                via Pinch · PT Kickstart Pack
              </div>
              <div className="mt-1 text-[11px] text-black/50">Goal: {GOAL}</div>
            </div>
          </Reveal>

          <Reveal show={d.accepted}>
            <Bubble from="them">
              You're matched with Sarah 🎉 First session booked.
            </Bubble>
          </Reveal>

          <Reveal show={d.step >= 4}>
            <Bubble from="them">
              <div>
                Session {sessionNo} of 3 — show this at check-in 💪
                <div className="mt-2 rounded-xl bg-white p-2">
                  <QRCodeSVG
                    value={`vezapt:checkin:alex:session-${sessionNo}`}
                    size={116}
                    className="mx-auto"
                  />
                </div>
                <div className="mt-2 flex items-center gap-1 text-[11px] text-black/50">
                  <QrCode className="size-3" /> Goal: {GOAL}
                </div>
                {d.verified >= sessionNo && (
                  <div className="mt-1 text-[12px] font-semibold" style={{ color: GREEN }}>
                    Checked in ✓
                  </div>
                )}
              </div>
            </Bubble>
          </Reveal>

          <Reveal show={d.verified >= 3}>
            <Bubble from="them">All 3 sessions done — nice work, Alex 👏</Bubble>
          </Reveal>

          <Reveal show={d.step >= 6}>
            <Bubble from="them">
              How was your session?
              <div className="mt-2 flex gap-2 text-xl">
                {["😀", "🙂", "😐"].map((e) => (
                  <button key={e} onClick={onFeedback} className="rounded-lg bg-white px-2 py-1">
                    {e}
                  </button>
                ))}
              </div>
            </Bubble>
          </Reveal>
          <Reveal show={d.feedback}>
            <Bubble from="me">😀</Bubble>
          </Reveal>

          <Reveal show={d.growthAsked}>
            <Bubble from="them">
              Loved our sessions, Alex 💪 If you've got 30 secs, a quick Google review would mean a
              lot — no pressure.
              <button
                onClick={onGrowthTap}
                className="mt-1 block underline"
                style={{ color: "#1D4ED8" }}
              >
                northsideclub.com/review
              </button>
            </Bubble>
          </Reveal>
          <Reveal show={d.growthDone}>
            <Bubble from="me">Done ⭐️⭐️⭐️⭐️⭐️</Bubble>
          </Reveal>

          <Reveal show={d.recommended}>
            <Bubble from="them">
              Massive progress, Alex 💪 To keep it going I'd recommend {d.perWeek} sessions/week —
              $180/week, plan built around your goal. Set it up?
              <button
                onClick={() => setLinkOpen(true)}
                className="mt-1 block underline"
                style={{ color: "#1D4ED8" }}
              >
                vezapt.com/alex/ongoing
              </button>
            </Bubble>
          </Reveal>

          <Reveal show={d.step >= 9}>
            <Bubble from="me">All set 🙌</Bubble>
          </Reveal>
        </div>
      )}
    </Phone>
  );
}

function LinkPage({
  d,
  onAgree,
  onBack,
}: {
  d: Demo;
  onAgree: () => void;
  onBack: () => void;
}) {
  const done = d.sub.phase === "done";
  return (
    <div className="rounded-2xl p-4 text-black" style={{ background: `${GREEN}12` }}>
      <button onClick={onBack} className="text-[11px] text-black/40">
        ← back to messages
      </button>
      <div className="mt-2 text-[11px] font-semibold" style={{ color: GREEN }}>
        Northside Club × VezaPT
      </div>
      <h2 className="mt-1 text-base font-bold">Keep your momentum, Alex</h2>
      <p className="mt-1 text-[12px] text-black/60">Goal: {GOAL}</p>

      <div className="mt-3 rounded-xl border border-black/10 bg-white p-3">
        <div className="text-[13px] font-semibold">Twice-Weekly Coaching</div>
        <div className="text-[12px] text-black/55">2 sessions/week</div>
        <div className="mt-1 font-mono text-lg font-bold" style={{ color: CERISE }}>
          $180/week
        </div>
        <div className="text-[11px]" style={{ color: CERISE }}>
          via Pinch
        </div>
      </div>

      {d.sub.phase === "idle" && (
        <button
          onClick={onAgree}
          className="mt-3 w-full rounded-xl py-2.5 text-sm font-bold text-white"
          style={{ background: GREEN }}
        >
          Agree & start
        </button>
      )}
      {d.sub.phase === "loading" && (
        <div className="mt-3 rounded-xl bg-white py-2.5 text-center text-sm text-black/50">
          processing…
        </div>
      )}
      {done && (
        <div className="mt-3 rounded-xl border p-3" style={{ borderColor: `${CERISE}55`, background: `${CERISE}0f` }}>
          <div className="text-sm font-bold" style={{ color: GREEN }}>
            You're all set! ✓
          </div>
          <div className="text-[12px] font-semibold" style={{ color: CERISE }}>
            $180/week via Pinch ✓
          </div>
          {d.sub.id && (
            <div className="mt-1 font-mono text-[10px] text-black/50">
              {d.sub.id} · {d.sub.status ?? "active"}
            </div>
          )}
          {d.sub.error && (
            <div className="mt-1 font-mono text-[10px] text-black/40">{d.sub.error}</div>
          )}
        </div>
      )}
    </div>
  );
}
