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
      <div className="mx-auto max-w-4xl px-5 pt-10 pb-16 sm:px-8">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              VezaPT Pay
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
              Start the demo
            </h1>
          </div>
          <Badge className="border border-warm/40 bg-warm/10 text-[color:var(--warm)] hover:bg-warm/10">
            Pinch · Sandbox
          </Badge>
        </header>

        <p className="mt-3 max-w-xl text-sm text-muted-foreground">
          Scan the QR on the client's phone to buy a pack, then complete on the
          trainer screen, then verify back on the phone. Money moves only when
          the client releases it.
        </p>

        <div className="mt-8 grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Card className="overflow-hidden border-border bg-[image:var(--gradient-hero)] p-6">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <QrCode className="size-3.5" /> Client checkout
            </div>
            <p className="mt-2 text-lg font-semibold">
              {pack?.name ?? "No pack seeded"}
            </p>
            <p className="font-mono text-sm text-muted-foreground">
              {pack ? `$${(Number(pack.total_amount) / 100).toFixed(2)} · ${pack.sessions_total} sessions` : "—"}
            </p>

            {qrSrc && (
              <div className="mt-5 flex flex-col items-center gap-3 rounded-xl bg-card p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrSrc}
                  alt="Scan to open the client checkout"
                  width={240}
                  height={240}
                  className="rounded-md"
                />
                <p className="break-all text-center font-mono text-[10px] text-muted-foreground">
                  {payUrl}
                </p>
              </div>
            )}

            {pack && (
              <Button asChild className="mt-5 w-full" size="lg">
                <Link
                  to="/pay"
                  search={{ pack: pack.id, trainer: trainerId, member: memberId }}
                >
                  Open client view <ArrowRight className="ml-1.5 size-4" />
                </Link>
              </Button>
            )}
          </Card>

          <div className="flex flex-col gap-5">
            <RoleCard
              to="/trainer"
              icon={<Smartphone className="size-4" />}
              title="Trainer screen"
              subtitle="Sarah's queue: acknowledge, complete, watch tier climb."
            />
            <RoleCard
              to="/me"
              icon={<Smartphone className="size-4" />}
              title="Client screen"
              subtitle="Verify a completed session — releases the split live."
            />
            <RoleCard
              to="/dashboard"
              icon={<LayoutDashboard className="size-4" />}
              title="Manager dashboard"
              subtitle="Earned vs held vs club margin, live from the same tables."
            />
          </div>
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            to="/demo-console"
            className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Open technical integration console
          </Link>
        </div>
      </div>
    </div>
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
