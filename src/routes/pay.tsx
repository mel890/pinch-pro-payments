import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getSnapshot, purchasePack } from "@/lib/vezapt-live.functions";
import { formatAUD } from "@/lib/money";
import { CheckCircle2, Lock, ShieldCheck } from "lucide-react";

const paySearchSchema = z.object({
  pack: z.string().optional(),
  trainer: z.string().optional(),
  member: z.string().optional(),
});

export const Route = createFileRoute("/pay")({
  head: () => ({
    meta: [
      { title: "Pay your PT pack — VezaPT Pay" },
      {
        name: "description",
        content:
          "Sandbox client checkout: pay for your PT pack. Funds only release to your trainer when you confirm each session.",
      },
      { property: "og:title", content: "Pay your PT pack — VezaPT Pay" },
      {
        property: "og:description",
        content:
          "Sandbox checkout for the VezaPT Pay hackathon demo. No real money moves.",
      },
    ],
  }),
  validateSearch: paySearchSchema,
  loader: async ({ context }) =>
    context.queryClient.ensureQueryData({
      queryKey: ["snapshot"],
      queryFn: () => getSnapshot(),
      staleTime: 0,
    }),
  component: PayScreen,
});

function PayScreen() {
  const search = Route.useSearch();
  const { data: snap } = useSuspenseQuery({
    queryKey: ["snapshot"],
    queryFn: () => getSnapshot(),
    staleTime: 0,
  });
  const qc = useQueryClient();
  const navigate = useNavigate();

  const pack =
    snap.packs.find((p: any) => p.id === search.pack) ?? snap.packs[0];
  const trainerId = search.trainer ?? pack?.trainer_id;
  const memberId = search.member ?? pack?.member_id;

  const trainer = snap.trainers.find((t: any) => t.id === trainerId);
  const member = snap.members.find((m: any) => m.id === memberId);

  const perSession = pack
    ? Math.round(
        Number(pack.total_amount) / (Number(pack.sessions_total) || 1),
      )
    : 0;

  const [card, setCard] = useState({ number: "4111 1111 1111 1111", exp: "12/29", cvc: "123" });
  const [done, setDone] = useState<null | { pinchId: string; sessionId: string }>(null);

  const buy = useMutation({
    mutationFn: () =>
      purchasePack({
        data: {
          packId: pack.id,
          trainerId: trainerId!,
          memberId: memberId!,
          method: "QR",
        },
      }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["snapshot"] });
      setDone({
        pinchId: res.pinchId,
        sessionId: (res.session as any)?.id ?? "",
      });
    },
  });

  if (!pack) {
    return (
      <div className="mx-auto max-w-md p-8 text-center">
        <p>No pack available. Seed the demo packs from /demo-console.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-md px-5 pt-8 pb-16">
        <header className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            VezaPT Pay
          </p>
          <Badge className="border border-warm/40 bg-warm/10 text-[color:var(--warm)] hover:bg-warm/10">
            Pinch · Sandbox
          </Badge>
        </header>

        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          {pack.name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          With {trainer?.name ?? "your trainer"}
          {member ? ` · Paying as ${member.name}` : ""}
        </p>

        <Card className="mt-6 border-border p-5">
          <Row label="Pack price" value={formatAUD(pack.total_amount)} />
          <Row label="Sessions" value={String(pack.sessions_total)} />
          <Row label="Per session" value={formatAUD(perSession)} />
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-border/60 bg-secondary/40 p-3 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>
              Charged now, held by the club. Each session's split releases only
              after you tap Verify.
            </span>
          </div>
        </Card>

        {!done && (
          <Card className="mt-4 border-border p-5">
            <p className="text-sm font-medium">Card details</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Test card only · tokenised client-side · no real charge
            </p>
            <div className="mt-4 space-y-3">
              <LabeledInput
                label="Card number"
                value={card.number}
                onChange={(v) => setCard((c) => ({ ...c, number: v }))}
              />
              <div className="grid grid-cols-2 gap-3">
                <LabeledInput
                  label="Expiry"
                  value={card.exp}
                  onChange={(v) => setCard((c) => ({ ...c, exp: v }))}
                />
                <LabeledInput
                  label="CVC"
                  value={card.cvc}
                  onChange={(v) => setCard((c) => ({ ...c, cvc: v }))}
                />
              </div>
            </div>

            <Button
              size="lg"
              className="mt-5 h-14 w-full text-base font-semibold shadow-[var(--shadow-soft)]"
              onClick={() => buy.mutate()}
              disabled={buy.isPending}
            >
              <Lock className="mr-2 size-4" />
              {buy.isPending ? "Processing…" : `Pay ${formatAUD(pack.total_amount)}`}
            </Button>

            {buy.error && (
              <p className="mt-2 text-xs text-destructive">
                {(buy.error as Error).message}
              </p>
            )}
          </Card>
        )}

        {done && (
          <Card className="mt-4 border-primary/40 bg-primary/10 p-5">
            <div className="flex items-center gap-2 text-primary">
              <CheckCircle2 className="size-5" />
              <p className="font-semibold">Payment received</p>
            </div>
            <p className="mt-1 text-sm text-foreground/80">
              {pack.sessions_total} sessions credited. Session 1 is now assigned
              to {trainer?.name ?? "your trainer"}.
            </p>
            <div className="mt-3 space-y-1 font-mono text-xs text-muted-foreground">
              <div>pinch_payment_id: {done.pinchId}</div>
              <div>session_id: {done.sessionId}</div>
            </div>
            <Button
              asChild
              size="lg"
              className="mt-5 h-12 w-full font-semibold"
            >
              <Link to="/me">Go to your sessions</Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 w-full"
              onClick={() => navigate({ to: "/trainer" })}
            >
              Peek at the trainer screen
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono tabular-nums text-foreground">{value}</span>
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-border bg-secondary/60 px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-primary"
      />
    </label>
  );
}
