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

const CHECKLIST = [
  { id: "completed", label: "Session completed" },
  { id: "clarity", label: "I understand what to do next" },
  { id: "supported", label: "I felt supported" },
  { id: "booked", label: "Next session booked" },
] as const;
type CheckId = (typeof CHECKLIST)[number]["id"];

type Step = "confirm" | "checklist" | "win" | "done";

function ConfirmSession() {
  const s = useDemoState();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("confirm");
  const [checked, setChecked] = useState<Record<CheckId, boolean>>({
    completed: true,
    clarity: true,
    supported: true,
    booked: false,
  });
  const [win, setWin] = useState("");

  const session = s.pendingSession ?? {
    client: "Alex Morgan",
    plan: "PT Kickstart · session 1 of 3",
    date: new Intl.DateTimeFormat("en-AU", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(new Date()),
    title: "Strength and confidence",
    valueCents: 7485,
    win: "",
  };

  const toggle = (id: CheckId) =>
    setChecked((c) => ({ ...c, [id]: !c[id] }));

  const handleSubmit = () => {
    const newSessions = 21;
    const newSplit = 60;
    const increaseCents = Math.round(session.valueCents * 0.6);
    demoStore.set({
      confirmedSessions: newSessions,
      currentSplitPct: newSplit,
      earningsCents: demoStore.get().earningsCents + increaseCents,
      clientsConfidence: checked.supported
        ? demoStore.get().clientsConfidence + 1
        : demoStore.get().clientsConfidence,
      lastConfirmedImpact: win || "Session confirmed",
      lastSupport: checked.supported ? 5 : 3,
      celebration: `Alex confirmed today's session${win ? ` — "${win}"` : ""}.`,
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
              How did today's session go?
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Sarah logged a PT session with you today. A quick check-in helps
              your coaching stay on track.
            </p>

            <Card className="mt-6 space-y-3 p-6">
              <Field label="Date" value={session.date} />
              <Field label="Session" value={`45-minute ${session.title}`} />
              <Field label="Plan" value={session.plan} />
            </Card>

            <div className="mt-6 space-y-3">
              <Button
                size="lg"
                className="h-14 w-full text-base font-semibold shadow-[var(--shadow-soft)]"
                onClick={() => setStep("checklist")}
              >
                <Check className="mr-2 size-5" /> Start check-in
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

        {step === "checklist" && (
          <>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
              A quick check-in
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Tick anything that's true for today.
            </p>

            <div className="mt-6 space-y-2">
              {CHECKLIST.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggle(c.id)}
                  className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left text-sm font-medium transition ${
                    checked[c.id]
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  <span
                    className={`grid size-5 shrink-0 place-items-center rounded-md border ${
                      checked[c.id]
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background"
                    }`}
                  >
                    {checked[c.id] && <Check className="size-3.5" />}
                  </span>
                  {c.label}
                </button>
              ))}
            </div>

            <Button
              size="lg"
              className="mt-8 h-14 w-full text-base font-semibold shadow-[var(--shadow-soft)]"
              onClick={() => setStep("win")}
              disabled={!checked.completed}
            >
              Continue <ArrowRight className="ml-1.5 size-4" />
            </Button>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              You must confirm the session took place to continue.
            </p>
          </>
        )}

        {step === "win" && (
          <>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
              What was your biggest win today?
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Optional — a sentence is plenty. Sarah reads these.
            </p>

            <textarea
              value={win}
              onChange={(e) => setWin(e.target.value)}
              placeholder="e.g. I used the weights area by myself for the first time."
              className="mt-6 min-h-28 w-full rounded-xl border border-border bg-card p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />

            <Button
              size="lg"
              className="mt-6 h-14 w-full text-base font-semibold shadow-[var(--shadow-soft)]"
              onClick={handleSubmit}
            >
              Submit confirmation
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 w-full text-muted-foreground"
              onClick={handleSubmit}
            >
              Skip and submit
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
              Thanks, Alex. Your trainer's payout has been released.
            </p>
            <p className="text-xs text-muted-foreground">
              Your check-in helps Sarah shape the next session around what
              matters most to you.
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
