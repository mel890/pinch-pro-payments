import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ArrowRight, Check } from "lucide-react";
import { formatAUD } from "@/lib/money";
import { VerificationSteps } from "@/components/verification-steps";
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
      { title: "Log the session — VezaPT Pay" },
      {
        name: "description",
        content:
          "Trainer session log: confirm the full session was delivered, whether the next one is booked, and record one client win.",
      },
      { property: "og:title", content: "Log the session — VezaPT Pay" },
      {
        property: "og:description",
        content:
          "A 30-second trainer log that moves the session to awaiting member confirmation.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LogSession,
});

function LogSession() {
  const s = useJourney();
  const navigate = useNavigate();
  const session = activeSession(s);
  const [delivered, setDelivered] = useState<boolean | null>(null);
  const [nextBooked, setNextBooked] = useState<boolean | null>(null);
  const [win, setWin] = useState("");
  const [issue, setIssue] = useState("");

  if (!session) {
    return (
      <Shell>
        <Card className="border-border p-6">
          <p className="text-lg font-semibold">Nothing to log</p>
          <Button asChild className="mt-4" size="sm">
            <Link to="/journey/alex">Back to the journey</Link>
          </Button>
        </Card>
      </Shell>
    );
  }

  if (
    session.status === "booked" ||
    session.status === "in_progress" ||
    session.status === "code_ready"
  ) {
    return (
      <Shell>
        <Card className="border-border p-6">
          <p className="text-lg font-semibold">
            {MEMBER.first}'s completion code hasn't been scanned yet
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Ask {MEMBER.first} to open their completion code, then scan it to
            start verification for session {session.n}.
          </p>
          <Button asChild className="mt-4" size="sm">
            <Link to="/scan">Open scanner</Link>
          </Button>
        </Card>
      </Shell>
    );
  }

  if (session.status === "awaiting_confirmation") {
    return (
      <Shell>
        <Card className="border-primary/40 bg-primary/5 p-6">
          <div className="flex items-center gap-2 text-primary">
            <Check className="size-5" />
            <p className="font-semibold">Session submitted</p>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {MEMBER.first} has been asked to confirm. If no dispute is raised
            within 12 hours the session verifies automatically, making{" "}
            {formatAUD(session.payoutCents)} payout eligible.
          </p>
          <VerificationSteps status={session.status} className="mt-4" />
          <Button asChild className="mt-4" size="sm" variant="secondary">
            <Link to="/confirm-session/demo">
              Open member confirmation <ArrowRight className="ml-1 size-4" />
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
            Log {MEMBER.first}'s session
          </h1>
        </div>
        <Badge className="border border-primary/40 bg-primary/10 text-primary">
          {SESSION_STATUS_LABEL[session.status]}
        </Badge>
      </header>

      <VerificationSteps status={session.status} className="mt-4" />

      <Card className="mt-5 space-y-5 p-6">
        <Choice
          label="Was the full session delivered?"
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
            Record one client win
          </label>
          <Input
            id="win"
            value={win}
            onChange={(e) => setWin(e.target.value)}
            placeholder="e.g. Alex completed all three exercises confidently."
            className="mt-2"
          />
        </div>
        <div>
          <label
            htmlFor="issue"
            className="text-[11px] uppercase tracking-wider text-muted-foreground"
          >
            Report an issue (optional)
          </label>
          <Textarea
            id="issue"
            value={issue}
            onChange={(e) => setIssue(e.target.value)}
            placeholder="Anything the club should know about this session."
            className="mt-2 min-h-16"
          />
        </div>

        <Button
          size="lg"
          className="w-full"
          disabled={delivered === null || nextBooked === null || !win.trim()}
          onClick={() => {
            journey.logSession(session.n, {
              delivered: delivered === true,
              nextBooked: nextBooked === true,
              win: win.trim() || null,
              issue: issue.trim() || null,
            });
            if (delivered === false) navigate({ to: "/exceptions" });
          }}
        >
          Submit session
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Submitting asks {MEMBER.first} to confirm. Payout of{" "}
          {formatAUD(session.payoutCents)} only becomes eligible once{" "}
          {MEMBER.first} confirms or the 12-hour no-dispute period passes.
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
