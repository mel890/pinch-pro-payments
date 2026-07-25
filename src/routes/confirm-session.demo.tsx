import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Heart } from "lucide-react";
import { formatAUD } from "@/lib/money";
import {
  useJourney,
  journey,
  activeSession,
  confirmedCount,
  MEMBER,
  TRAINER,
} from "@/lib/journey-store";

export const Route = createFileRoute("/confirm-session/demo")({
  head: () => ({
    meta: [
      { title: "How did today's session go? — VezaPT Pay" },
      {
        name: "description",
        content:
          "A member confirms their PT session in four taps, records their biggest win, and releases their trainer's payout.",
      },
      { property: "og:title", content: "Confirm your session — VezaPT Pay" },
      {
        property: "og:description",
        content:
          "Human, two-minute session confirmation that releases the trainer's payout.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ConfirmSession,
});

const QUESTIONS = [
  { key: "completed", label: "Was the session completed?" },
  { key: "supported", label: "Did you feel supported?" },
  { key: "clarity", label: "Do you understand what to do next?" },
  { key: "booked", label: "Is your next session booked?" },
] as const;

function ConfirmSession() {
  const s = useJourney();
  const session = activeSession(s);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [win, setWin] = useState("");
  const [justConfirmed, setJustConfirmed] = useState<number | null>(null);

  const ready = answers.completed === true;

  if (justConfirmed !== null) {
    const released = s.sessions.find((x) => x.n === justConfirmed);
    return (
      <Shell>
        <Card className="border-primary/40 bg-primary/5 p-6 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-primary/15">
            <Check className="size-6 text-primary" />
          </div>
          <p className="mt-3 text-xl font-semibold">
            Session confirmed. Thanks, {MEMBER.first}.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {TRAINER.first}'s payout has been released
            {released ? ` — ${formatAUD(released.payoutCents)}` : ""}.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            {confirmedCount(s)} of 3 Kickstart sessions confirmed.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button asChild variant="secondary">
              <Link to="/journey/alex">
                Back to my journey <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
            {confirmedCount(s) === 3 && (
              <Button asChild>
                <Link to="/review">See my progress review</Link>
              </Button>
            )}
          </div>
        </Card>
      </Shell>
    );
  }

  if (!session || !session.completed) {
    return (
      <Shell>
        <Card className="border-border p-6">
          <p className="text-lg font-semibold">Nothing to confirm right now</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Your trainer will send a confirmation after your next session.
          </p>
          <Button asChild className="mt-4" size="sm">
            <Link to="/journey/alex">Open my journey</Link>
          </Button>
        </Card>
      </Shell>
    );
  }

  return (
    <Shell>
      <Card className="border-border p-6">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Session {session.n} · {session.title} · with {TRAINER.name}
        </p>
        <h2 className="mt-1 text-2xl font-semibold">How did today's session go?</h2>

        <div className="mt-5 space-y-2">
          {QUESTIONS.map((q) => {
            const on = answers[q.key] === true;
            return (
              <button
                key={q.key}
                type="button"
                onClick={() =>
                  setAnswers((a) => ({ ...a, [q.key]: !a[q.key] }))
                }
                className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                  on
                    ? "border-primary/50 bg-primary/10"
                    : "border-border bg-card/60 hover:border-primary/30"
                }`}
              >
                <span
                  className={`grid size-5 shrink-0 place-items-center rounded-md border ${
                    on ? "border-primary bg-primary/20" : "border-border"
                  }`}
                >
                  {on && <Check className="size-3.5 text-primary" />}
                </span>
                {q.label}
              </button>
            );
          })}
        </div>

        <div className="mt-5">
          <label
            htmlFor="win"
            className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground"
          >
            <Heart className="size-3" /> What was your biggest win today?
            (optional)
          </label>
          <textarea
            id="win"
            value={win}
            onChange={(e) => setWin(e.target.value)}
            placeholder="e.g. I squatted with the bar on my own for the first time."
            className="mt-2 min-h-20 w-full rounded-xl border border-border bg-card p-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <Button
          size="lg"
          className="mt-5 w-full shadow-[var(--shadow-soft)]"
          disabled={!ready}
          onClick={() => {
            journey.confirm(session.n, win.trim() || null);
            setJustConfirmed(session.n);
          }}
        >
          Confirm session
        </Button>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Confirming releases your trainer's payment for this session.
        </p>
      </Card>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background pb-20 text-foreground">
      <div className="mx-auto max-w-md px-5 pt-10">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {MEMBER.name}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Session check-in
        </h1>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}
