import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Check } from "lucide-react";
import { formatAUD } from "@/lib/money";
import {
  useJourney,
  journey,
  activeSession,
  SESSION_STATUS_LABEL,
  MEMBER,
  TRAINER,
} from "@/lib/journey-store";

export const Route = createFileRoute("/complete-session")({
  head: () => ({
    meta: [
      { title: "Complete a session — VezaPT Pay" },
      {
        name: "description",
        content:
          "Trainer completion: confirm the session was delivered, whether the next one is booked, and capture the member's win.",
      },
      { property: "og:title", content: "Complete a session — VezaPT Pay" },
      {
        property: "og:description",
        content:
          "Lightweight trainer completion that moves the session to awaiting member feedback.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CompleteSession,
});

function CompleteSession() {
  const s = useJourney();
  const navigate = useNavigate();
  const session = activeSession(s);
  const [delivered, setDelivered] = useState<boolean | null>(null);
  const [nextBooked, setNextBooked] = useState<boolean | null>(null);
  const [win, setWin] = useState("");

  if (!session) {
    return (
      <Shell>
        <Card className="border-border p-6">
          <p className="text-lg font-semibold">Nothing to complete</p>
          <Button asChild className="mt-4" size="sm">
            <Link to="/journey/alex">Back to the journey</Link>
          </Button>
        </Card>
      </Shell>
    );
  }

  if (session.status === "booked" || session.status === "qr_issued") {
    return (
      <Shell>
        <Card className="border-border p-6">
          <p className="text-lg font-semibold">
            {MEMBER.first} hasn't checked in yet
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Scan the member's one-time QR code to start session {session.n}.
          </p>
          <Button asChild className="mt-4" size="sm">
            <Link to="/scan">Open the scanner</Link>
          </Button>
        </Card>
      </Shell>
    );
  }

  if (session.status === "awaiting_feedback") {
    return (
      <Shell>
        <Card className="border-primary/40 bg-primary/5 p-6">
          <div className="flex items-center gap-2 text-primary">
            <Check className="size-5" />
            <p className="font-semibold">Completion recorded</p>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {MEMBER.first} has been notified for feedback. The session verifies
            automatically after 12 hours if there's no dispute, releasing{" "}
            {formatAUD(session.payoutCents)}.
          </p>
          <Button asChild className="mt-4" size="sm" variant="secondary">
            <Link to="/confirm-session/demo">
              Preview member feedback <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
        </Card>
      </Shell>
    );
  }

  return (
    <Shell>
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {TRAINER.name} · session {session.n} of 3
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {session.title} with {MEMBER.first}
          </h1>
        </div>
        <Badge className="border border-primary/40 bg-primary/10 text-primary">
          {SESSION_STATUS_LABEL[session.status]}
        </Badge>
      </header>

      <Card className="mt-5 space-y-5 p-6">
        <Choice
          label="Was the session delivered in full?"
          value={delivered}
          onChange={setDelivered}
        />
        <Choice
          label="Is the next session booked?"
          value={nextBooked}
          onChange={setNextBooked}
        />
        <div>
          <label
            htmlFor="win"
            className="text-[11px] uppercase tracking-wider text-muted-foreground"
          >
            Anything worth noting? (optional)
          </label>
          <Textarea
            id="win"
            value={win}
            onChange={(e) => setWin(e.target.value)}
            placeholder="e.g. Alex squatted with the bar unassisted for the first time."
            className="mt-2 min-h-20"
          />
        </div>

        <Button
          size="lg"
          className="w-full"
          disabled={delivered === null || nextBooked === null}
          onClick={() => {
            journey.completeSession(session.n, {
              delivered: delivered === true,
              nextBooked: nextBooked === true,
              win: win.trim() || null,
            });
            if (delivered === false) navigate({ to: "/exceptions" });
          }}
        >
          Record completion
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Completion moves the session to awaiting feedback — payout of{" "}
          {formatAUD(session.payoutCents)} is released at verification.
        </p>
      </Card>
    </Shell>
  );
}

function Choice({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | null;
  onChange: (v: boolean) => void;
}) {
  return (
    <div>
      <p className="text-sm font-medium">{label}</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {[true, false].map((opt) => (
          <button
            key={String(opt)}
            type="button"
            onClick={() => onChange(opt)}
            className={`rounded-xl border px-4 py-3 text-sm transition-colors ${
              value === opt
                ? "border-primary/50 bg-primary/10 text-primary"
                : "border-border bg-card/60 hover:border-primary/30"
            }`}
          >
            {opt ? "Yes" : "No"}
          </button>
        ))}
      </div>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background pb-16 text-foreground">
      <div className="mx-auto max-w-xl px-5 pt-8 sm:px-8 sm:pt-12">{children}</div>
    </div>
  );
}
