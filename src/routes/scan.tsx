import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScanLine, Check, X, ArrowRight, ShieldAlert } from "lucide-react";
import { VerificationSteps } from "@/components/verification-steps";
import {
  useJourney,
  journey,
  activeSession,
  SESSION_STATUS_LABEL,
  MEMBER,
  TRAINER,
  CLUB,
  KICKSTART,
} from "@/lib/journey-store";

export const Route = createFileRoute("/scan")({
  head: () => ({
    meta: [
      { title: "Scan check-in code — VezaPT Pay" },
      {
        name: "description",
        content:
          "Trainer scanner: validates the member, trainer, booking, pack, completion window and single-use status before the session log.",
      },
      { property: "og:title", content: "Scan check-in code — VezaPT Pay" },
      {
        property: "og:description",
        content:
          "Scan the member's single-use check-in code to start verification.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ScanScreen,
});

const CHECKS = [
  "Member identity matches the booking",
  "Trainer is the assigned coach",
  "Booking belongs to this club and pack",
  "Session number matches the purchased pack",
  "Inside the allowed completion window",
  "Code has not been used before",
];

const INVALID_STATES = [
  { label: "Expired code", message: "This check-in code has expired." },
  { label: "Already used", message: "This code has already been used." },
  {
    label: "Wrong trainer",
    message: "This session is assigned to another trainer.",
  },
  {
    label: "Wrong booking",
    message: "This code does not match the selected booking.",
  },
  {
    label: "Outside window",
    message: "This code is outside the completion window.",
  },
];

function ScanScreen() {
  const s = useJourney();
  const navigate = useNavigate();
  const session = activeSession(s);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!session) {
    return (
      <Shell>
        <Card className="border-border p-6">
          <p className="text-lg font-semibold">No session awaiting completion</p>
          <Button asChild className="mt-4" size="sm">
            <Link to="/journey/alex">Back to the journey</Link>
          </Button>
        </Card>
      </Shell>
    );
  }

  const scanned = session.qrUsed;

  const doScan = (method: "qr" | "backup" | "manual") => {
    journey.scanCompletionCode(session.n, method);
    setError(null);
  };

  return (
    <Shell>
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {TRAINER.name} · {CLUB.name}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Scan {MEMBER.first}'s check-in code
          </h1>
        </div>
        <Badge className="border border-primary/40 bg-primary/10 text-primary">
          {SESSION_STATUS_LABEL[session.status]}
        </Badge>
      </header>

      <VerificationSteps status={session.status} className="mt-4" />

      <Card className="mt-5 p-6">
        {scanned ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-primary">
              <Check className="size-5" />
              <p className="font-semibold">Check-in code accepted</p>
            </div>
            <p className="text-sm text-muted-foreground">
              {MEMBER.first} is checked in and the session is now in progress. One
              session is reserved from the pack — no payout is released yet.
            </p>
            <ul className="space-y-1.5">
              {CHECKS.map((c) => (
                <li key={c} className="flex gap-2 text-sm text-muted-foreground">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                  {c}
                </li>
              ))}
            </ul>
            <div className="rounded-xl border border-border bg-background/40 p-4 text-sm">
              <Row label="Session" value={`${session.n} of 3 · ${session.title}`} />
              <Row label="Pack" value={KICKSTART.name} />
              <Row
                label="Code accepted"
                value={`${session.checkinAt ?? ""} · ${
                  session.checkinMethod === "manual"
                    ? "manual override"
                    : session.checkinMethod === "backup"
                      ? "backup code"
                      : "QR scan"
                }`}
              />
              <Row label="Pack credit" value="Reserved (not yet deducted)" />
              <Row label="Payout" value="Held until verification" />
            </div>
            <Button
              className="w-full"
              onClick={() => navigate({ to: "/complete-session" })}
            >
              Complete {MEMBER.first}'s session <ArrowRight className="ml-1 size-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid h-44 place-items-center rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <ScanLine className="size-8 animate-pulse text-primary" />
                <span className="text-sm">
                  Point the camera at {MEMBER.first}'s check-in code
                </span>
              </div>
            </div>
            <Button className="w-full" onClick={() => doScan("qr")}>
              Open scanner — simulate successful scan
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Scanning checks the member in and starts the session.
            </p>

            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Enter backup code
              </p>
              <div className="mt-2 flex gap-2">
                <Input
                  value={code}
                  inputMode="numeric"
                  maxLength={7}
                  placeholder="000 000"
                  onChange={(e) => setCode(e.target.value)}
                  className="font-mono tracking-[0.2em]"
                />
                <Button
                  variant="secondary"
                  onClick={() => {
                    const clean = code.replace(/\s/g, "");
                    if (clean === session.backupCode.replace(/\s/g, "")) {
                      doScan("backup");
                    } else {
                      setError("This code does not match the selected booking.");
                    }
                  }}
                >
                  Verify
                </Button>
              </div>
              {error && (
                <p className="mt-2 flex items-center gap-1.5 text-sm text-destructive">
                  <X className="size-4" /> {error}
                </p>
              )}
              {error && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Retry the scan, re-enter the backup code, or request manager
                  review below.
                </p>
              )}
            </div>

            <div className="rounded-xl border border-dashed border-border p-3">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Preview an invalid code state
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {INVALID_STATES.map((st) => (
                  <button
                    key={st.label}
                    type="button"
                    onClick={() => setError(st.message)}
                    className="rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground hover:border-destructive/50 hover:text-destructive"
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => doScan("manual")}
              className="flex w-full items-center gap-2 rounded-xl border border-dashed border-border px-4 py-3 text-left text-sm text-muted-foreground hover:border-primary/40"
            >
              <ShieldAlert className="size-4" />
              Request manager review — manual override creates a review-required
              record
            </button>
          </div>
        )}
      </Card>
    </Shell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 py-0.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background pb-16 text-foreground">
      <div className="mx-auto max-w-md px-5 pt-8 sm:pt-12">{children}</div>
    </div>
  );
}
