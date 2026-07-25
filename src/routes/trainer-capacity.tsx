import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ArrowRight, Rocket, Sliders, UserPlus } from "lucide-react";

export const Route = createFileRoute("/trainer-capacity")({
  head: () => ({
    meta: [
      { title: "Can the team fulfil this campaign? — VezaPT Pay" },
      {
        name: "description",
        content:
          "Preview trainer capacity by product and frequency before launching a PT campaign, so the club never sells more coaching than it can deliver.",
      },
      { property: "og:title", content: "Trainer capacity check — VezaPT Pay" },
      {
        property: "og:description",
        content:
          "See total available places per campaign and prevent overselling before launch.",
      },
    ],
  }),
  component: TrainerCapacity,
});

type Row = {
  trainer: string;
  kickstart: number;
  challenge1x: number;
  challenge2x: number;
  eveningAfter5pm: number;
};

const ROWS: Row[] = [
  { trainer: "Sarah", kickstart: 4, challenge1x: 3, challenge2x: 2, eveningAfter5pm: 3 },
  { trainer: "James", kickstart: 3, challenge1x: 2, challenge2x: 1, eveningAfter5pm: 1 },
  { trainer: "Mia", kickstart: 5, challenge1x: 4, challenge2x: 2, eveningAfter5pm: 2 },
];

function TrainerCapacity() {
  const navigate = useNavigate();
  const [confirmed, setConfirmed] = useState<null | "launched" | "asked" | "adjusted">(
    null,
  );

  const totals = useMemo(() => {
    return ROWS.reduce(
      (acc, r) => ({
        kickstart: acc.kickstart + r.kickstart,
        challenge1x: acc.challenge1x + r.challenge1x,
        challenge2x: acc.challenge2x + r.challenge2x,
        evening: acc.evening + r.eveningAfter5pm,
      }),
      { kickstart: 0, challenge1x: 0, challenge2x: 0, evening: 0 },
    );
  }, []);

  const totalPlaces = totals.kickstart + totals.challenge1x + totals.challenge2x;
  const eveningTight = totals.evening <= 6;

  return (
    <div className="min-h-screen bg-background text-foreground pb-16">
      <div className="mx-auto max-w-5xl px-5 pt-8 sm:px-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Campaign readiness · Northside Club
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
              Can the team fulfil this campaign?
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Review opted-in trainer capacity by product and frequency before
              you launch. This prevents selling coaching the team cannot
              deliver.
            </p>
          </div>
          <Badge className="border border-warm/40 bg-warm/10 text-[color:var(--warm)]">
            Winter Strength Campaign · Draft
          </Badge>
        </header>

        {/* Capacity table */}
        <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Trainer</th>
                  <th className="px-4 py-3 font-medium">Kickstart capacity</th>
                  <th className="px-4 py-3 font-medium">1× weekly challenge</th>
                  <th className="px-4 py-3 font-medium">2× weekly challenge</th>
                  <th className="px-4 py-3 font-medium text-right">Row total</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((r) => {
                  const rowTotal = r.kickstart + r.challenge1x + r.challenge2x;
                  return (
                    <tr key={r.trainer} className="border-t border-border">
                      <td className="px-4 py-3 font-medium">{r.trainer}</td>
                      <td className="px-4 py-3 font-mono tabular-nums">{r.kickstart}</td>
                      <td className="px-4 py-3 font-mono tabular-nums">{r.challenge1x}</td>
                      <td className="px-4 py-3 font-mono tabular-nums">{r.challenge2x}</td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-muted-foreground">
                        {rowTotal}
                      </td>
                    </tr>
                  );
                })}
                <tr className="border-t border-border bg-secondary/40">
                  <td className="px-4 py-3 font-semibold uppercase tracking-wider text-xs text-muted-foreground">
                    Total
                  </td>
                  <td className="px-4 py-3 font-mono text-base font-semibold tabular-nums">
                    {totals.kickstart}
                  </td>
                  <td className="px-4 py-3 font-mono text-base font-semibold tabular-nums">
                    {totals.challenge1x}
                  </td>
                  <td className="px-4 py-3 font-mono text-base font-semibold tabular-nums">
                    {totals.challenge2x}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-base font-semibold tabular-nums text-primary">
                    {totalPlaces}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Available places */}
        <section className="mt-4 grid gap-3 md:grid-cols-2">
          <Card className="border-primary/40 bg-primary/5 p-5">
            <p className="text-[10px] uppercase tracking-wider text-primary">
              Available campaign capacity
            </p>
            <p className="mt-2 font-mono text-4xl font-semibold tabular-nums">
              {totalPlaces} places
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Across Kickstart, 1× and 2× weekly challenges combined.
            </p>
          </Card>

          <Card
            className={`p-5 ${
              eveningTight
                ? "border-warm/40 bg-warm/10"
                : "border-border bg-card"
            }`}
          >
            <div className="flex items-start gap-2">
              <div
                className={`mt-0.5 rounded-full p-1.5 ${
                  eveningTight
                    ? "bg-warm/20 text-[color:var(--warm)]"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                <AlertTriangle className="size-4" />
              </div>
              <div>
                <p
                  className={`text-[10px] uppercase tracking-wider ${
                    eveningTight ? "text-[color:var(--warm)]" : "text-muted-foreground"
                  }`}
                >
                  Time-of-day warning
                </p>
                <p className="mt-1 text-sm font-medium">
                  Evening capacity is limited.
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Only {totals.evening} places are available after 5:00 pm. Most
                  members prefer evening slots — consider asking trainers to add
                  availability before launching.
                </p>
              </div>
            </div>
          </Card>
        </section>

        {/* Actions */}
        <section className="mt-6 flex flex-wrap gap-2">
          <Button
            size="lg"
            className="shadow-[var(--shadow-soft)]"
            onClick={() => setConfirmed("launched")}
          >
            <Rocket className="mr-2 size-4" />
            Launch with current capacity
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => setConfirmed("asked")}
          >
            <UserPlus className="mr-2 size-4" />
            Ask trainers to add availability
          </Button>
          <Button
            size="lg"
            variant="ghost"
            onClick={() => setConfirmed("adjusted")}
          >
            <Sliders className="mr-2 size-4" />
            Adjust campaign limit
          </Button>
        </section>

        {confirmed && (
          <Card className="mt-4 border-primary/30 bg-primary/5 p-4 text-sm">
            {confirmed === "launched" && (
              <p>
                Winter Strength Campaign launched with a cap of{" "}
                <strong>{totalPlaces} places</strong>. Sales will pause
                automatically when capacity is reached, with a waiting list
                available.
              </p>
            )}
            {confirmed === "asked" && (
              <p>
                Availability requests sent to all three trainers. You'll be
                notified as evening slots come online.
              </p>
            )}
            {confirmed === "adjusted" && (
              <p>
                Opening the campaign editor lets you cap intake per product or
                per trainer before you publish.
              </p>
            )}
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={() => navigate({ to: "/dashboard" })}>
                Back to dashboard <ArrowRight className="ml-1 size-3" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirmed(null)}>
                Undo
              </Button>
            </div>
          </Card>
        )}

        <div className="mt-10 flex justify-center gap-4 text-xs text-muted-foreground">
          <Link to="/" className="underline underline-offset-4 hover:text-foreground">Start</Link>
          <Link to="/dashboard" className="underline underline-offset-4 hover:text-foreground">Manager dashboard</Link>
          <Link to="/opportunity" className="underline underline-offset-4 hover:text-foreground">Trainer opportunity</Link>
        </div>
      </div>
    </div>
  );
}
