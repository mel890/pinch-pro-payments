import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ShieldCheck, RotateCcw, ArrowLeft } from "lucide-react";
import { formatAUD } from "@/lib/money";
import {
  useJourney,
  journey,
  exceptions,
  packBalance,
  SESSION_STATUS_LABEL,
  MEMBER,
  TRAINER,
  CLUB,
} from "@/lib/journey-store";

export const Route = createFileRoute("/exceptions")({
  head: () => ({
    meta: [
      { title: "Session exceptions — VezaPT Pay" },
      {
        name: "description",
        content:
          "Manager exception queue for disputed sessions, manual check-ins and time-window issues, with pack credit restoration.",
      },
      { property: "og:title", content: "Session exceptions — VezaPT Pay" },
      {
        property: "og:description",
        content:
          "Review disputes, manual check-ins and time issues before any payout is released.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Exceptions,
});

function Exceptions() {
  const s = useJourney();
  const queue = exceptions(s);
  const balance = packBalance(s);

  return (
    <div className="min-h-screen bg-background pb-20 text-foreground">
      <div className="mx-auto max-w-3xl px-5 pt-10 sm:px-8">
        <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
          <Link to="/dashboard">
            <ArrowLeft className="mr-1 size-4" /> Manager dashboard
          </Link>
        </Button>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Session exceptions
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          {CLUB.name} · anything that can't verify automatically lands here.
          Payouts stay held until a manager resolves the item.
        </p>

        <Card className="mt-5 grid gap-3 border-border p-4 sm:grid-cols-3">
          <Stat label="Pack credits remaining" value={String(balance.remaining)} />
          <Stat label="Reserved (in progress)" value={String(balance.reserved)} />
          <Stat label="Deducted (verified)" value={String(balance.deducted)} />
        </Card>

        <section className="mt-6 space-y-4">
          {queue.length === 0 && (
            <Card className="border-border p-6">
              <p className="flex items-center gap-2 font-semibold">
                <ShieldCheck className="size-5 text-primary" /> No exceptions
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Every session verified through QR check-in, trainer completion
                and member feedback.
              </p>
            </Card>
          )}

          {queue.map((sess) => (
            <Card key={sess.n} className="border-amber-500/40 bg-amber-500/5 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Session {sess.n} · {MEMBER.name} with {TRAINER.name}
                  </p>
                  <p className="mt-0.5 text-lg font-semibold">{sess.title}</p>
                </div>
                <Badge className="border border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  {SESSION_STATUS_LABEL[sess.status]}
                </Badge>
              </div>

              <p className="mt-3 flex items-start gap-2 text-sm">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
                {sess.reviewReason ??
                  (sess.checkinMethod === "manual"
                    ? "Manual check-in — QR not scanned"
                    : "Requires manager review")}
              </p>

              <div className="mt-3 grid gap-1 rounded-xl border border-border/60 bg-background/40 p-3 text-sm sm:grid-cols-2">
                <Row label="Booked" value={sess.scheduledLabel} />
                <Row label="Check-in" value={sess.checkinAt ?? "None recorded"} />
                <Row
                  label="Completion"
                  value={sess.completedAt ?? "Not recorded"}
                />
                <Row label="Payout held" value={formatAUD(sess.payoutCents)} />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() => journey.resolveException(sess.n, "verify")}
                >
                  Verify and release payout
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => journey.resolveException(sess.n, "cancel")}
                >
                  Cancel — restore pack credit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => journey.resolveException(sess.n, "no_show")}
                >
                  Mark no-show
                </Button>
                {(sess.status === "cancelled" || sess.status === "no_show") && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => journey.rebook(sess.n)}
                  >
                    <RotateCcw className="mr-1.5 size-4" /> Rebook session
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </section>

        {s.exceptionLog.length > 0 && (
          <Card className="mt-6 border-border p-5">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Resolution log
            </p>
            <ul className="mt-2 space-y-1.5">
              {s.exceptionLog.map((e, i) => (
                <li key={i} className="text-sm text-muted-foreground">
                  Session {e.n} · {e.action} · {e.at}
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">{value}</p>
    </div>
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
