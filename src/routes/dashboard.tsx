import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle2, Circle } from "lucide-react";
import { formatAUD } from "@/lib/money";
import {
  useJourney,
  confirmedCount,
  CLUB,
  MEMBER,
  TRAINER,
  KICKSTART,
  ONGOING,
  BEFORE,
  AFTER,
  ANNUALISED_CENTS,
} from "@/lib/journey-store";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Manager impact — Northside Club | VezaPT Pay" },
      {
        name: "description",
        content:
          "One Kickstart purchase tracked end to end: $249 sold, $199 trainer payout, $50 club fee, and a converted $180-per-week coaching relationship.",
      },
      { property: "og:title", content: "Manager impact — VezaPT Pay" },
      {
        property: "og:description",
        content:
          "Commercial, member and trainer impact from a single gym-promoted PT product.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ManagerImpact,
});

function ManagerImpact() {
  const s = useJourney();
  const done = confirmedCount(s);

  const stages = [
    { label: "Purchased", done: s.paid },
    { label: "Trainer accepted", done: s.accepted },
    { label: "First session started", done: s.sessions[0].completed },
    { label: `${done} of 3 completed`, done: done === 3 },
    { label: "Converted to ongoing coaching", done: s.ongoingActive },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 text-foreground">
      <div className="mx-auto max-w-5xl px-5 pt-10 sm:px-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              {CLUB.name} · manager view
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
              {MEMBER.name}'s complete journey
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              What one gym-promoted product produced commercially, for the
              member, and for the trainer.
            </p>
          </div>
          <Badge className="border border-primary/40 bg-primary/10 text-primary">
            Coach: {TRAINER.name}
          </Badge>
        </header>

        {/* Journey rail */}
        <Card className="mt-6 border-border p-5">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Journey status
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-3">
            {stages.map((st, i) => (
              <div key={st.label} className="flex items-center gap-2">
                <div
                  className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${
                    st.done
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {st.done ? (
                    <CheckCircle2 className="size-4" />
                  ) : (
                    <Circle className="size-4" />
                  )}
                  {st.label}
                </div>
                {i < stages.length - 1 && (
                  <ArrowRight className="size-3.5 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Commercial */}
        <Section title="Commercial impact">
          <Tile label="Kickstart revenue" value={formatAUD(KICKSTART.priceCents)} />
          <Tile label="Club campaign fee" value={formatAUD(KICKSTART.clubFeeCents)} />
          <Tile
            label={`${TRAINER.first} payout`}
            value={formatAUD(KICKSTART.trainerPayoutCents)}
          />
          <Tile
            label="Ongoing plan"
            value={`${formatAUD(ONGOING.weeklyCents)}/week`}
            accent={s.ongoingActive}
            note={s.ongoingActive ? "Active" : "Not yet converted"}
          />
          <Tile
            label="Annualised value at current plan"
            value={formatAUD(ANNUALISED_CENTS)}
            note="Indicative, not guaranteed revenue"
            wide
          />
        </Section>

        {/* Member impact */}
        <Section title="Member impact">
          <Tile
            label="Confidence"
            value={`${BEFORE.confidence} → ${AFTER.confidence}`}
            accent
          />
          <Tile
            label="Weekly visits"
            value={`${BEFORE.visits} → ${AFTER.visits}`}
            accent
          />
          <Tile
            label="Programme clarity"
            value={`${BEFORE.clarity} → ${AFTER.clarity}`}
            accent
          />
          <Tile
            label="Ongoing coaching"
            value={s.ongoingActive ? "Active" : "Pending"}
          />
          <Tile label="30-day retention check" value="Scheduled" />
          <Tile label="90-day retention tracking" value="Active" />
        </Section>

        {/* Trainer impact */}
        <Section title={`Trainer impact · ${TRAINER.name}`}>
          <Tile
            label="New recurring client"
            value={s.ongoingActive ? "Yes" : "Pending"}
          />
          <Tile label="Weekly sessions added" value="+2" accent />
          <Tile
            label="Pack-to-ongoing conversion"
            value={s.ongoingActive ? "Completed" : "Open"}
          />
          <Tile
            label="Follow-up"
            value={s.recommended ? "Completed" : "Outstanding"}
          />
          <Tile label="Client Connection" value="Strong" accent />
        </Section>

        <div className="mt-8 flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to="/journey/alex">Open Alex's journey</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/trainer-capacity">Check team capacity</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/exceptions">Session exceptions</Link>
          </Button>

          <Button asChild variant="ghost">
            <Link to="/demo-console">Pinch integration console</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {children}
      </div>
    </section>
  );
}

function Tile({
  label,
  value,
  note,
  accent,
  wide,
}: {
  label: string;
  value: string;
  note?: string;
  accent?: boolean;
  wide?: boolean;
}) {
  return (
    <Card
      className={`p-4 ${wide ? "sm:col-span-2 lg:col-span-3" : ""} ${
        accent ? "border-primary/40 bg-primary/5" : "border-border"
      }`}
    >
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-1 font-mono text-2xl font-semibold tabular-nums ${
          accent ? "text-primary" : ""
        }`}
      >
        {value}
      </p>
      {note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}
    </Card>
  );
}
