import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Clock, ArrowRight, CheckCircle2, FlaskConical } from "lucide-react";
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

export const Route = createFileRoute("/checkin")({
  head: () => ({
    meta: [
      { title: "Confirm today's session — VezaPT Pay" },
      {
        name: "description",
        content:
          "Member session completion screen: a single-use check-in code plus six-digit backup code, shown to the trainer at the end of the booked session.",
      },
      { property: "og:title", content: "Confirm today's session — VezaPT Pay" },
      {
        property: "og:description",
        content:
          "Show your check-in code to your trainer at the end of your session to start verification.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CompletionCodeScreen,
});

function CompletionCodeScreen() {
  const s = useJourney();
  const session = activeSession(s);
  const [origin, setOrigin] = useState("");

  useEffect(() => setOrigin(window.location.origin), []);
  useEffect(() => {
    if (session && (session.status === "booked" || session.status === "in_progress"))
      journey.issueCompletionCode(session.n);
  }, [session?.n, session?.status]);

  if (!session) {
    return (
      <Shell>
        <Card className="border-border p-6">
          <p className="text-lg font-semibold">No session to confirm</p>
          <p className="mt-1 text-sm text-muted-foreground">
            All Kickstart sessions are verified.
          </p>
          <Button asChild className="mt-4" size="sm">
            <Link to="/journey/alex">Open my journey</Link>
          </Button>
        </Card>
      </Shell>
    );
  }

  const used = session.qrUsed;
  const url = `${origin}/scan?s=${session.n}&t=${session.backupCode.replace(" ", "")}`;

  return (
    <Shell>
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {CLUB.name} · {KICKSTART.name}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Confirm today's session
          </h1>
        </div>
        <Badge className="border border-primary/40 bg-primary/10 text-primary">
          {SESSION_STATUS_LABEL[session.status]}
        </Badge>
      </header>

      <VerificationSteps status={session.status} className="mt-4" />

      <Card className="mt-5 flex flex-col items-center gap-5 p-6">
        {used ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <CheckCircle2 className="size-10 text-primary" />
            <p className="text-lg font-semibold">Check-in code accepted</p>
            <p className="text-sm text-muted-foreground">
              This code has been used once and is no longer valid. Verification
              is now in progress.
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-2xl bg-white p-5 ring-1 ring-border">
              {origin ? (
                <QRCodeSVG value={url} size={216} level="M" fgColor="#0f172a" />
              ) : (
                <div className="size-[216px]" />
              )}
            </div>
            <p className="text-center text-sm font-medium">
              Show this code to {TRAINER.first} at the end of your session
            </p>
            <div className="w-full rounded-xl border border-dashed border-border p-4 text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Backup code
              </p>
              <p className="mt-1 font-mono text-3xl font-semibold tracking-[0.3em] tabular-nums">
                {session.backupCode}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Use if the camera or venue Wi-Fi fails.
              </p>
            </div>
          </>
        )}

        <div className="w-full space-y-1.5 rounded-xl border border-border/60 bg-background/40 p-4 text-sm">
          <Row label="Member" value={MEMBER.name} />
          <Row label="Trainer" value={TRAINER.name} />
          <Row label="Club" value={CLUB.name} />
          <Row label="Pack" value={KICKSTART.name} />
          <Row label="Session" value={`${session.n} of 3 · ${session.title}`} />
          <Row label="Booked for" value={session.scheduledLabel} />
        </div>

        <div className="flex w-full flex-col gap-1.5 rounded-xl border border-primary/30 bg-primary/5 p-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-primary" /> Single use — this
            code becomes invalid the moment it is scanned.
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="size-3.5 text-primary" /> Valid from the scheduled
            end of your session until the completion window closes.
          </span>
          <span className="flex items-center gap-1.5">
            <FlaskConical className="size-3.5 text-amber-500" /> Test mode: the
            completion window is not enforced for this demo.
          </span>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          {MEMBER.first}'s unique check-in code confirms that {MEMBER.first} and{" "}
          {TRAINER.first} are together at the end of the booked session. Scanning
          starts the verification process.
        </p>
      </Card>

      <Button asChild variant="outline" className="mt-4 w-full">
        <Link to="/scan">
          Open trainer scanner <ArrowRight className="ml-1 size-4" />
        </Link>
      </Button>
    </Shell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
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
