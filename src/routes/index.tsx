import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getSnapshot,
  DEMO_TRAINER_SARAH,
  DEMO_MEMBER_ALEX,
  DEFAULT_DEMO_PACK_NAME,
} from "@/lib/vezapt-live.functions";
import { QrCode, ArrowRight, Smartphone, LayoutDashboard } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VezaPT Pay · Sandbox" },
      {
        name: "description",
        content:
          "VezaPT Pay hackathon demo. Scan the QR to pay on the client's phone, then verify from the same handset to release the trainer's split.",
      },
      { property: "og:title", content: "VezaPT Pay · Sandbox" },
      {
        property: "og:description",
        content:
          "Performance-based PT compensation demo: pay by QR, complete on the trainer screen, verify on the phone.",
      },
    ],
  }),
  loader: async ({ context }) =>
    context.queryClient.ensureQueryData({
      queryKey: ["snapshot"],
      queryFn: () => getSnapshot(),
      staleTime: 0,
    }),
  component: StartScreen,
});

function StartScreen() {
  const { data: snap } = useSuspenseQuery({
    queryKey: ["snapshot"],
    queryFn: () => getSnapshot(),
    staleTime: 0,
  });

  const pack =
    snap.packs.find((p: any) => p.name === DEFAULT_DEMO_PACK_NAME) ??
    snap.packs[0];
  const trainerId = pack?.trainer_id ?? DEMO_TRAINER_SARAH;
  const memberId = pack?.member_id ?? DEMO_MEMBER_ALEX;

  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);

  const payUrl = pack
    ? `${origin}/pay?pack=${pack.id}&trainer=${trainerId}&member=${memberId}`
    : "";
  const qrSrc = payUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=8&color=EAF1F2&bgcolor=151E22&data=${encodeURIComponent(payUrl)}`
    : "";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-5 pt-10 pb-16 sm:px-8">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              VezaPT Pay
            </p>
            <h1 className="mt-2 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
              Turn member interest into paid coaching—without adding a PT sales team.
            </h1>
          </div>
          <Badge className="border border-warm/40 bg-warm/10 text-[color:var(--warm)] hover:bg-warm/10">
            Pinch · Sandbox
          </Badge>
        </header>

        <p className="mt-4 max-w-2xl text-sm text-muted-foreground">
          Launch ready-made PT packs and challenges, match each buyer with an
          available trainer, and track whether every purchase becomes an active,
          ongoing coaching relationship.
        </p>

        <section className="mt-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            How VezaPT turns interest into coaching
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <JourneyCard
              step="1 · Gym"
              title="Gym launches an offer"
              body="Choose an always-on pack or quarterly challenge."
              to="/dashboard"
            />
            <JourneyCard
              step="2 · Member"
              title="Members buy or register"
              body="Promote through email, social, QR codes and in-club campaigns."
              to="/pay"
              search={pack ? { pack: pack.id, trainer: trainerId, member: memberId } : undefined}
            />
            <JourneyCard
              step="3 · VezaPT"
              title="VezaPT matches the right trainer"
              body="Based on availability, capacity, speciality and member preference."
              to="/dashboard"
            />
            <JourneyCard
              step="4 · Trainer"
              title="Trainer accepts the paid opportunity"
              body="The trainer sees the commitment and payout before accepting."
              to="/trainer"
              highlight
            />
            <JourneyCard
              step="5 · Member"
              title="Member starts coaching"
              body="Sessions, templates and habits begin automatically."
              to="/me"
            />
            <JourneyCard
              step="6 · VezaPT"
              title="VezaPT tracks progression"
              body="See who starts, completes and moves into ongoing coaching."
              to="/dashboard"
            />
          </div>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <Card className="border-border bg-card p-6">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <QrCode className="size-3.5" /> Campaign QR
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {pack?.name ?? "No pack seeded"}
              {pack && (
                <span className="ml-1 font-mono">
                  · ${(Number(pack.total_amount) / 100).toFixed(2)}
                </span>
              )}
            </p>

            {qrSrc && (
              <div className="mt-4 flex flex-col items-center gap-3 rounded-xl bg-background/60 p-4">
                <img
                  src={qrSrc}
                  alt="Scan to open the member checkout"
                  width={200}
                  height={200}
                  className="rounded-md"
                />
              </div>
            )}

            <p className="mt-3 text-[11px] text-muted-foreground">
              Drop this QR into posters, emails or in-club screens. Every scan
              opens a live checkout, matched to an available trainer.
            </p>
          </Card>

          <Card className="border-primary/30 bg-[image:var(--gradient-hero)] p-6">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-primary">
              <Smartphone className="size-3.5" /> Product promise
            </div>
            <p className="mt-3 text-lg font-semibold leading-snug text-foreground">
              Every offer becomes a matched trainer, an active member and a
              measurable coaching relationship.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              No PT sales team required. Interest becomes income, and income
              becomes ongoing coaching.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link to="/dashboard">
                  Launch a campaign <ArrowRight className="ml-1.5 size-4" />
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/opportunity">
                  View trainer opportunity <ArrowRight className="ml-1.5 size-4" />
                </Link>
              </Button>

              <Button asChild size="sm" variant="ghost">
                <Link
                  to="/pay"
                  search={pack ? { pack: pack.id, trainer: trainerId, member: memberId } : undefined}
                >
                  <LayoutDashboard className="mr-1.5 size-4" /> See the member journey
                </Link>
              </Button>
            </div>
          </Card>
        </section>

        <div className="mt-10 flex justify-center">
          <Link
            to="/demo-console"
            className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Technical integration console
          </Link>
        </div>

      </div>
    </div>
  );
}

function JourneyCard({
  step,
  title,
  body,
  to,
  search,
  highlight,
}: {
  step: string;
  title: string;
  body?: string;
  to: string;
  search?: Record<string, string> | undefined;
  highlight?: boolean;
}) {
  return (
    <Link to={to} search={search as any} className="group">
      <Card
        className={`h-full p-5 transition ${
          highlight
            ? "border-primary/40 bg-primary/5 hover:border-primary/60"
            : "border-border hover:border-primary/40"
        }`}
      >
        <p
          className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${
            highlight ? "text-primary" : "text-muted-foreground"
          }`}
        >
          {step}
        </p>
        <p className="mt-2 text-sm font-semibold leading-snug text-foreground">{title}</p>
        {body && <p className="mt-1 text-xs leading-snug text-muted-foreground">{body}</p>}
        <ArrowRight className="mt-4 size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
      </Card>
    </Link>
  );
}


function RoleCard({
  to,
  icon,
  title,
  subtitle,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <Link to={to} className="group">
      <Card className="flex items-center justify-between border-border p-5 transition hover:border-primary/60">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {icon} {title}
          </div>
          <p className="mt-1 text-sm text-foreground/80">{subtitle}</p>
        </div>
        <ArrowRight className="size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
      </Card>
    </Link>
  );
}

