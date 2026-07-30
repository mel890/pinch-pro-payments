import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, ArrowRight, Heart, Clock, AlertTriangle } from "lucide-react";
import { formatAUD } from "@/lib/money";
import { VerificationSteps } from "@/components/verification-steps";

import {
  useJourney,
  journey,
  activeSession,
  confirmedCount,
  MEMBER,
  TRAINER,
  type SessionFeedback,
} from "@/lib/journey-store";

export const Route = createFileRoute("/confirm-session/demo")({
  head: () => ({
    meta: [
      { title: "Please confirm today's session — VezaPT Pay" },
      {
        name: "description",
        content:
          "Member confirmation: confirm today's session took place as expected, share how it helped, or send it for review. No response for 12 hours verifies without dispute.",
      },
      { property: "og:title", content: "Confirm today's session — VezaPT Pay" },
      {
        property: "og:description",
        content:
          "A 20-second member confirmation that verifies the session and makes the trainer payout eligible.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ConfirmSession,
});


function ConfirmSession() {
  const s = useJourney();
  const session = activeSession(s);
  const [tookPlace, setTookPlace] = useState<boolean | null>(null);
  const [supported, setSupported] =
    useState<SessionFeedback["supported"] | null>(null);
  const [understands, setUnderstands] =
    useState<SessionFeedback["understands"] | null>(null);
  const [nextBooked, setNextBooked] = useState<boolean | null>(null);
  const [win, setWin] = useState("");
  const [done, setDone] = useState<{ n: number; disputed: boolean } | null>(null);

  if (done) {
    const released = s.sessions.find((x) => x.n === done.n);
    return (
      <Shell>
        <Card
          className={`p-6 text-center ${
            done.disputed
              ? "border-destructive/40 bg-destructive/5"
              : "border-primary/40 bg-primary/5"
          }`}
        >
          <div
            className={`mx-auto grid size-12 place-items-center rounded-full ${
              done.disputed ? "bg-destructive/15" : "bg-primary/15"
            }`}
          >
            {done.disputed ? (
              <AlertTriangle className="size-6 text-destructive" />
            ) : (
              <Check className="size-6 text-primary" />
            )}
          </div>
          <p className="mt-3 text-xl font-semibold">
            {done.disputed
              ? "Thank you. The session has been sent for review."
              : `Session confirmed. Thank you, ${MEMBER.first}.`}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {done.disputed
              ? "Your club manager will look into this. Your session credit is preserved and no payout is eligible while it's under review."
              : `Session verified — ${TRAINER.first}'s payout is now eligible${
                  released ? ` (${formatAUD(released.payoutCents)})` : ""
                }, and one session was deducted from your pack.`}
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            {confirmedCount(s)} of 3 Kickstart sessions verified.
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

  if (!session || session.status !== "awaiting_feedback") {
    return (
      <Shell>
        <Card className="border-border p-6">
          <p className="text-lg font-semibold">Nothing to confirm right now</p>
          <p className="mt-1 text-sm text-muted-foreground">
            You'll be asked for feedback once {TRAINER.first} completes your
            session.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild size="sm" variant="secondary">
              <Link to="/checkin">Open my check-in code</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/journey/alex">My journey</Link>
            </Button>
          </div>
        </Card>
      </Shell>
    );
  }


  const ready =
    tookPlace !== null &&
    (tookPlace === false ||
      (supported !== null && understands !== null && nextBooked !== null));

  const submit = () => {
    journey.submitFeedback(session.n, {
      tookPlace: tookPlace === true,
      supported: supported ?? "Yes",
      understands: understands ?? "Yes",
      nextBooked: nextBooked === true,
      win: win.trim() || null,
    });
    setDone({ n: session.n, disputed: tookPlace === false });
  };

  return (
    <Shell>
      <Card className="border-border p-6">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Session {session.n} · {session.title} · with {TRAINER.name}
        </p>
        <h2 className="mt-1 text-2xl font-semibold">
          Please confirm today's session
        </h2>
        <VerificationSteps status={session.status} className="mt-4" />

        <Question
          label="Did today's session take place as expected?"
          options={["Yes", "No"]}
          value={tookPlace === null ? null : tookPlace ? "Yes" : "No"}
          onChange={(v) => setTookPlace(v === "Yes")}
        />


        {tookPlace !== false && (
          <>
            <Question
              label="Did you feel supported?"
              options={["Yes", "Somewhat", "No"]}
              value={supported}
              onChange={(v) => setSupported(v as SessionFeedback["supported"])}
            />
            <Question
              label="Do you know what to do next?"
              options={["Yes", "Not yet"]}
              value={understands}
              onChange={(v) =>
                setUnderstands(v as SessionFeedback["understands"])
              }
            />
            <Question
              label="Is your next session booked?"
              options={["Yes", "No"]}
              value={nextBooked === null ? null : nextBooked ? "Yes" : "No"}
              onChange={(v) => setNextBooked(v === "Yes")}
            />

            <div className="mt-5">
              <label
                htmlFor="win"
                className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground"
              >
                <Heart className="size-3" /> What was your biggest win today?
                (optional)
              </label>
              <Textarea
                id="win"
                value={win}
                onChange={(e) => setWin(e.target.value)}
                placeholder="e.g. I squatted with the bar on my own for the first time."
                className="mt-2 min-h-20"
              />
            </div>
          </>
        )}

        <Button
          size="lg"
          className="mt-5 w-full"
          disabled={!ready}
          variant={tookPlace === false ? "destructive" : "default"}
          onClick={submit}
        >
          {tookPlace === false ? "Raise a dispute" : "Confirm session"}
        </Button>

        <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
          <Clock className="size-3.5" /> If you don't respond, the session
          verifies automatically 12 hours after completion.
        </p>
        <button
          type="button"
          className="mt-2 w-full text-center text-xs text-muted-foreground underline"
          onClick={() => {
            journey.timeoutVerify(session.n);
            setDone({ n: session.n, disputed: false });
          }}
        >
          Simulate 12-hour no-dispute timeout
        </button>
      </Card>
    </Shell>
  );
}

function Question({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string | null;
  onChange: (v: string) => void;
}) {
  return (
    <div className="mt-5">
      <p className="text-sm font-medium">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            className={`rounded-xl border px-4 py-2.5 text-sm transition-colors ${
              value === o
                ? "border-primary/50 bg-primary/10 text-primary"
                : "border-border bg-card/60 hover:border-primary/30"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
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
