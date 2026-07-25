import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  Circle,
  CalendarCheck,
  Sparkles,
  ArrowRight,
  Send,
  NotebookPen,
} from "lucide-react";

export const Route = createFileRoute("/journey/alex")({
  head: () => ({
    meta: [
      { title: "Alex's coaching journey — VezaPT" },
      {
        name: "description",
        content:
          "Track Alex Morgan through the PT product ladder: sessions completed, habit adherence and the next recommended step.",
      },
      { property: "og:title", content: "Alex's coaching journey — VezaPT" },
      {
        property: "og:description",
        content:
          "The product ladder view for a single member: Start → Build → Transform → Continue.",
      },
    ],
  }),
  component: ClientJourney,
});

type Milestone = { label: string; state: "done" | "next" | "todo"; sub?: string };

const KICKSTART_STEPS: Milestone[] = [
  { label: "Purchased", state: "done", sub: "PT Kickstart · $249" },
  { label: "Trainer accepted", state: "done", sub: "Matched with Sarah Nguyen" },
  { label: "Session 1 complete", state: "done", sub: "Confirmed, confidence win" },
  { label: "Session 2 booked", state: "next", sub: "Thursday 6:30 pm" },
  { label: "Session 3 not booked", state: "todo", sub: "Suggest final review slot" },
];

const LADDER = [
  { name: "Start", product: "Kickstart", active: true },
  { name: "Build", product: "6-Week Momentum", active: false },
  { name: "Transform", product: "12-Week Transformation", active: false },
  { name: "Continue", product: "Ongoing 1:1 / hybrid / online", active: false },
];

function ClientJourney() {
  const [sent, setSent] = useState(false);
  const [reviewBooked, setReviewBooked] = useState(false);
  const [note, setNote] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground pb-16">
      <div className="mx-auto max-w-4xl px-5 pt-8 sm:px-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Client journey
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
              Alex's coaching journey
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Product ladder view — see where Alex is now, and shape the next
              step as a coaching conversation rather than a hard sell.
            </p>
          </div>
          <Badge className="border border-primary/40 bg-primary/10 text-primary">
            With Sarah Nguyen
          </Badge>
        </header>

        {/* Ladder */}
        <section className="mt-6">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Product ladder
          </p>
          <div className="mt-2 grid gap-2 sm:grid-cols-4">
            {LADDER.map((rung) => (
              <Card
                key={rung.name}
                className={`p-4 ${
                  rung.active
                    ? "border-primary/40 bg-primary/5"
                    : "border-border bg-card/60"
                }`}
              >
                <p
                  className={`text-[10px] uppercase tracking-wider ${
                    rung.active ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {rung.name}
                </p>
                <p className="mt-1 text-sm font-semibold">{rung.product}</p>
                {rung.active && (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Current product
                  </p>
                )}
              </Card>
            ))}
          </div>
        </section>

        {/* Current product detail */}
        <section className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <Card className="border-border p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Current product
                </p>
                <p className="mt-1 text-lg font-semibold">Kickstart Pack</p>
              </div>
              <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
                In progress
              </Badge>
            </div>

            <ul className="mt-5 space-y-3">
              {KICKSTART_STEPS.map((m) => (
                <li key={m.label} className="flex items-start gap-3">
                  {m.state === "done" ? (
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
                  ) : m.state === "next" ? (
                    <div className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 border-primary bg-primary/10">
                      <div className="size-1.5 rounded-full bg-primary" />
                    </div>
                  ) : (
                    <Circle className="mt-0.5 size-5 shrink-0 text-muted-foreground/60" />
                  )}
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-medium ${
                        m.state === "todo" ? "text-muted-foreground" : "text-foreground"
                      }`}
                    >
                      {m.label}
                    </p>
                    {m.sub && (
                      <p className="text-xs text-muted-foreground">{m.sub}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Progress
                </p>
                <p className="mt-1 text-sm font-medium">2 of 3 sessions scheduled</p>
                <Progress value={67} className="mt-2 h-1.5" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Habit adherence
                </p>
                <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-primary">
                  72%
                </p>
                <p className="text-xs text-muted-foreground">
                  Last 7 days · check-ins logged
                </p>
              </div>
            </div>
          </Card>

          {/* Next step + prompt */}
          <div className="space-y-4">
            <Card className="border-primary/30 bg-[image:var(--gradient-hero)] p-5">
              <p className="text-[10px] uppercase tracking-wider text-primary">
                Next recommended step
              </p>
              <p className="mt-1 text-lg font-semibold">6-Week Momentum</p>
              <p className="mt-1 text-xs text-muted-foreground">
                One PT session per week, plus templates, weekly accountability
                and a final review.
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="size-3.5 text-primary" />
                Member price $699 · trainer payout $599
              </div>
            </Card>

            <Card className="border-border p-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Prompt to trainer
              </p>
              <p className="mt-2 text-sm leading-relaxed text-foreground/90">
                Alex has completed two sessions and is attending consistently.
                Discuss the next-step programme before the final Kickstart
                session so it feels like a coaching conversation, not a pitch.
              </p>
            </Card>
          </div>
        </section>

        {/* Actions */}
        <section className="mt-6 space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button
              size="lg"
              className="shadow-[var(--shadow-soft)]"
              onClick={() => setSent(true)}
              disabled={sent}
            >
              <Send className="mr-2 size-4" />
              {sent ? "Recommendation sent" : "Send next-step recommendation"}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setReviewBooked(true)}
              disabled={reviewBooked}
            >
              <CalendarCheck className="mr-2 size-4" />
              {reviewBooked ? "Final review booked" : "Book final review"}
            </Button>
          </div>

          <Card className="border-border p-4">
            <label
              htmlFor="coaching-note"
              className="text-[10px] uppercase tracking-wider text-muted-foreground"
            >
              <NotebookPen className="mr-1 inline size-3" />
              Add coaching note
            </label>
            <textarea
              id="coaching-note"
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                setNoteSaved(false);
              }}
              placeholder="e.g. Alex wants to feel confident using the weights floor unassisted by session 3."
              className="mt-2 min-h-20 w-full rounded-xl border border-border bg-card p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Notes are visible to Alex on request and inform future coaching.
              </p>
              <Button
                size="sm"
                variant="secondary"
                disabled={!note.trim() || noteSaved}
                onClick={() => setNoteSaved(true)}
              >
                {noteSaved ? "Note saved" : "Save note"}
              </Button>
            </div>
          </Card>
        </section>

        <div className="mt-10 flex justify-center gap-4 text-xs text-muted-foreground">
          <Link to="/" className="underline underline-offset-4 hover:text-foreground">Start</Link>
          <Link to="/trainer" className="underline underline-offset-4 hover:text-foreground">Trainer dashboard</Link>
          <Link to="/dashboard" className="underline underline-offset-4 hover:text-foreground">
            Manager dashboard <ArrowRight className="inline size-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
