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
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              VezaPT Pay
            </p>
            <h1 className="mt-2 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
              Pay trainers for sessions delivered. Show them the difference those sessions make.
            </h1>
          </div>
          <Badge className="border border-warm/40 bg-warm/10 text-[color:var(--warm)] hover:bg-warm/10">
            Pinch · Sandbox
          </Badge>
        </header>

        <p className="mt-4 max-w-2xl text-sm text-muted-foreground">
          VezaPT Pay connects client-confirmed coaching, progressive trainer
          earnings and real client impact in one simple flow.
        </p>

        <section className="mt-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            The session-confirmation journey
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <JourneyCard
              step="Client"
              title="Choose the support that fits your goals."
              to="/pay"
              search={pack ? { pack: pack.id, trainer: trainerId, member: memberId } : undefined}
            />
            <JourneyCard
              step="Trainer"
              title="Deliver coaching, confirm the session and build sustainable production."
              to="/trainer"
            />
            <JourneyCard
              step="Client confirmation"
              title="Confirm the session and record what changed."
              to="/me"
              highlight
            />
            <JourneyCard
              step="Manager"
              title="See revenue, trainer performance, client momentum and coaching priorities."
              to="/dashboard"
            />
          </div>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <Card className="border-border bg-card p-6">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <QrCode className="size-3.5" /> Sandbox purchase QR
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
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrSrc}
                  alt="Scan to open the client checkout"
                  width={200}
                  height={200}
                  className="rounded-md"
                />
              </div>
            )}

            {pack && (
              <Button asChild className="mt-4 w-full" size="sm" variant="secondary">
                <Link
                  to="/pay"
                  search={{ pack: pack.id, trainer: trainerId, member: memberId }}
                >
                  Open client view <ArrowRight className="ml-1.5 size-4" />
                </Link>
              </Button>
            )}
            <p className="mt-3 text-[11px] text-muted-foreground">
              The purchase step exists so we can run the full flow end-to-end.
              The heart of the demo is what happens after: coaching, client
              confirmation and impact.
            </p>
          </Card>

          <Card className="border-primary/30 bg-[image:var(--gradient-hero)] p-6">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-primary">
              <Smartphone className="size-3.5" /> Product promise
            </div>
            <p className="mt-3 text-lg font-semibold leading-snug text-foreground">
              Payment is linked to verified service. Impact is captured at the
              same moment.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Every confirmed session grows the trainer's income and creates
              evidence of the difference they are making.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link to="/trainer">
                  Open Sarah's dashboard <ArrowRight className="ml-1.5 size-4" />
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/dashboard">
                  <LayoutDashboard className="mr-1.5 size-4" /> Manager view
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
  to,
  search,
  highlight,
}: {
  step: string;
  title: string;
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
        <p className="mt-2 text-sm leading-snug text-foreground">{title}</p>
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

