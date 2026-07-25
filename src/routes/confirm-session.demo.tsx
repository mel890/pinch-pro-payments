import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { demoStore, useDemoState, formatAUD } from "@/lib/demo-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, HelpCircle, Sparkles, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/confirm-session/demo")({
  head: () => ({
    meta: [
      { title: "Confirm your session — VezaPT" },
      {
        name: "description",
        content:
          "Confirm your PT session with Sarah and share how it helped you today.",
      },
      { property: "og:title", content: "Confirm your session — VezaPT" },
      {
        property: "og:description",
        content: "Confirm your PT session and share your feedback.",
      },
    ],
  }),
  component: ConfirmSession,
});

const IMPACTS = [
  "Confidence",
  "Energy",
  "Strength",
  "Mobility",
  "Stress",
  "Consistency",
  "Progress toward my goal",
  "I learned something useful",
];

type Step = "confirm" | "impact" | "support" | "done";

function ConfirmSession() {
  const s = useDemoState();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("confirm");
  const [impact, setImpact] = useState<string | null>("Confidence");
  const [support, setSupport] = useState<number | null>(5);
  const [win, setWin] = useState("");


  const session = s.pendingSession ?? {
    client: "Alex Morgan",
    plan: "2× Weekly PT",
    date: new Intl.DateTimeFormat("en-AU", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(new Date()),
    title: "Strength and confidence",
    valueCents: 7485,
    win: "",
  };

  const handleSubmit = () => {
    // Apply demo state updates
    const newSessions = 21;
    const newSplit = 60;
    const increaseCents = Math.round(session.valueCents * 0.6); // 60% of $74.85 = $44.91
    demoStore.set({
      confirmedSessions: newSessions,
      currentSplitPct: newSplit,
      earningsCents: demoStore.get().earningsCents + increaseCents,
      clientsConfidence:
        impact === "Confidence"
          ? demoStore.get().clientsConfidence + 1
          : demoStore.get().clientsConfidence,
      clientsEnergy:
        impact === "Energy"
          ? demoStore.get().clientsEnergy + 1
          : demoStore.get().clientsEnergy,
      lastConfirmedImpact: impact,
      lastSupport: support,
      celebration: `Alex confirmed the session${
        impact ? ` and reported improved ${impact.toLowerCase()}` : ""
      }.`,
      pendingSession: null,
    });
    setStep("done");
  };

  return (
    <div className="min-h-screen bg-[image:var(--gradient-soft)] pb-16">
      <div className="mx-auto max-w-md px-5 pt-10 sm:pt-14">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          VezaPT
        </p>

        {step === "confirm" && (
          <>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              Confirm your session
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Sarah logged a PT session with you today.
            </p>

            <Card className="mt-6 space-y-3 p-6">
              <Field label="Date" value={session.date} />
              <Field label="Session" value={`45-minute ${session.title}`} />
              <Field label="Value" value={formatAUD(session.valueCents)} />
            </Card>

            <p className="mt-8 text-center text-base font-medium text-foreground">
              Did this session take place?
            </p>

            <div className="mt-4 space-y-3">
              <Button
                size="lg"
                className="h-14 w-full text-base font-semibold shadow-[var(--shadow-soft)]"
                onClick={() => setStep("impact")}
              >
                <Check className="mr-2 size-5" /> Yes, confirm
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-12 w-full text-sm"
              >
                <HelpCircle className="mr-2 size-4" /> I need help
              </Button>
            </div>
          </>
        )}

        {step === "impact" && (
          <>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
              What did today's session help with most?
            </h1>
            <div className="mt-6 grid grid-cols-2 gap-2">
              {IMPACTS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setImpact(opt)}
                  className={`rounded-xl border p-4 text-left text-sm font-medium transition ${
                    impact === opt
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            <Button
              size="lg"
              className="mt-8 h-14 w-full text-base font-semibold shadow-[var(--shadow-soft)]"
              onClick={() => setStep("support")}
              disabled={!impact}
            >
              Continue <ArrowRight className="ml-1.5 size-4" />
            </Button>
          </>
        )}

        {step === "support" && (
          <>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
              How supported did you feel today?
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              1 = not really, 5 = incredibly supported.
            </p>
            <div className="mt-8 flex justify-between gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setSupport(n)}
                  className={`flex h-16 flex-1 items-center justify-center rounded-2xl border text-xl font-semibold transition ${
                    support === n
                      ? "border-primary bg-primary text-primary-foreground shadow-[var(--shadow-soft)]"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>

            <div className="mt-8">
              <label
                htmlFor="win"
                className="text-sm font-medium text-foreground"
              >
                What was one win from today?{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </label>
              <textarea
                id="win"
                value={win}
                onChange={(e) => setWin(e.target.value)}
                placeholder="e.g. I used the weights area by myself for the first time."
                className="mt-2 min-h-20 w-full rounded-xl border border-border bg-card p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <Button
              size="lg"
              className="mt-6 h-14 w-full text-base font-semibold shadow-[var(--shadow-soft)]"
              onClick={handleSubmit}
              disabled={support === null}
            >
              Submit confirmation
            </Button>
          </>
        )}

        {step === "done" && (
          <Card className="mt-8 flex flex-col items-center gap-4 p-8 text-center shadow-[var(--shadow-soft)]">
            <div className="rounded-full bg-success/15 p-3 text-[color:var(--success)]">
              <Sparkles className="size-8" />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Session confirmed
            </h2>
            <p className="text-sm text-muted-foreground">
              Thanks, Alex. Your feedback helps Sarah see the difference her
              coaching is making.
            </p>
            <p className="text-xs text-muted-foreground">
              Your confirmed session has now been added to Sarah's verified
              production.
            </p>

            <Button
              size="lg"
              className="mt-4 h-12 w-full"
              onClick={() => navigate({ to: "/" })}
            >
              Return to Sarah's dashboard
            </Button>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
            >
              <Link to="/confirm-session/demo" onClick={() => setStep("confirm")}>
                Replay confirmation
              </Link>
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}
