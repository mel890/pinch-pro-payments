import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getSnapshot,
  verifySession,
  DEMO_MEMBER_ALEX,
} from "@/lib/vezapt-live.functions";
import { formatAUD } from "@/lib/money";
import { CheckCircle2, Sparkles, Clock } from "lucide-react";

export const Route = createFileRoute("/me")({
  head: () => ({
    meta: [
      { title: "Your sessions — VezaPT Pay" },
      {
        name: "description",
        content:
          "Verify each completed PT session to release your trainer's split. Sandbox demo — no real money moves.",
      },
      { property: "og:title", content: "Your sessions — VezaPT Pay" },
      {
        property: "og:description",
        content:
          "Client-side verification screen for VezaPT Pay hackathon demo.",
      },
    ],
  }),
  loader: async ({ context }) =>
    context.queryClient.ensureQueryData({
      queryKey: ["snapshot"],
      queryFn: () => getSnapshot(),
      staleTime: 0,
    }),
  component: MeScreen,
});

function MeScreen() {
  const { data: snap } = useSuspenseQuery({
    queryKey: ["snapshot"],
    queryFn: () => getSnapshot(),
    staleTime: 0,
    refetchInterval: 3000,
  });
  const qc = useQueryClient();

  // Default: the demo member from the QR/pay flow (Alex). Falls back to any
  // member with a session so the demo still shows.
  const memberId = DEMO_MEMBER_ALEX;
  const member = snap.members.find((m: any) => m.id === memberId);

  const mine = snap.sessions.filter((s: any) => s.member_id === memberId);
  const toVerify = mine.filter((s: any) => s.status === "completed");
  const inProgress = mine.filter((s: any) =>
    ["pending", "acknowledged"].includes(s.status),
  );
  const done = mine.filter((s: any) => s.status === "confirmed");

  const [flash, setFlash] = useState<null | {
    trainerName: string;
    ptPct: number;
    ptCents: number;
    clubCents: number;
    tierUpgraded: boolean;
    tierName: string;
  }>(null);

  const verify = useMutation({
    mutationFn: (id: string) => verifySession({ data: { sessionId: id } }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["snapshot"] });
      setFlash({
        trainerName: res.trainerName,
        ptPct: res.ptPct,
        ptCents: res.ptCents,
        clubCents: res.clubCents,
        tierUpgraded: res.tierUpgraded,
        tierName: res.tierName,
      });
    },
  });

  const packBalances = snap.packs
    .filter((p: any) => p.member_id === memberId)
    .map((p: any) => ({
      ...p,
      remaining: Number(p.sessions_total) - Number(p.sessions_completed ?? 0),
    }));

  return (
    <div className="min-h-screen bg-background text-foreground pb-16">
      <div className="mx-auto max-w-md px-5 pt-8">
        <header className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {member?.name ?? "Your account"}
          </p>
          <Badge className="border border-warm/40 bg-warm/10 text-[color:var(--warm)]">
            Sandbox
          </Badge>
        </header>

        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Your sessions
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          When your trainer marks a session complete, verify it here to release
          their split.
        </p>

        {packBalances.length > 0 && (
          <div className="mt-5 space-y-2">
            {packBalances.map((p: any) => (
              <Card key={p.id} className="flex items-center justify-between border-border p-4">
                <div>
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.sessions_completed ?? 0} of {p.sessions_total} used
                  </p>
                </div>
                <p className="font-mono text-lg tabular-nums text-primary">
                  {p.remaining}
                </p>
              </Card>
            ))}
          </div>
        )}

        {flash && (
          <Card className="mt-5 border-primary/40 bg-primary/10 p-5">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="size-5" />
              <p className="font-semibold">Split applied · live</p>
            </div>
            <div className="mt-3 space-y-1 font-mono text-sm tabular-nums">
              <SplitRow
                label={`${flash.trainerName} · ${flash.ptPct}%`}
                value={formatAUD(flash.ptCents)}
                accent
              />
              <SplitRow
                label={`Club · ${100 - flash.ptPct}%`}
                value={formatAUD(flash.clubCents)}
              />
            </div>
            {flash.tierUpgraded && (
              <p className="mt-3 rounded-md bg-primary/15 p-2 text-xs text-primary">
                {flash.trainerName} reached {flash.tierName} — this session paid
                at {flash.ptPct}%.
              </p>
            )}
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-primary transition-all duration-700"
                style={{ width: `${flash.ptPct}%` }}
              />
            </div>
          </Card>
        )}

        <section className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Ready to verify
          </h2>
          <div className="mt-2 space-y-3">
            {toVerify.length === 0 && (
              <Card className="border-dashed border-border p-5 text-center text-sm text-muted-foreground">
                Nothing to verify right now.
              </Card>
            )}
            {toVerify.map((s: any) => {
              const trainer = snap.trainers.find(
                (t: any) => t.id === s.trainer_id,
              );
              return (
                <Card key={s.id} className="border-primary/30 bg-primary/5 p-5">
                  <p className="font-semibold">
                    Session with {trainer?.name?.replace("Test PT ", "")}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Marked complete by trainer · worth{" "}
                    <span className="font-mono">
                      {formatAUD(s.session_value_cents)}
                    </span>
                  </p>
                  <Button
                    size="lg"
                    className="mt-4 h-12 w-full font-semibold shadow-[var(--shadow-soft)]"
                    onClick={() => verify.mutate(s.id)}
                    disabled={verify.isPending}
                  >
                    <CheckCircle2 className="mr-2 size-4" />
                    {verify.isPending ? "Releasing…" : "Verify session"}
                  </Button>
                </Card>
              );
            })}
          </div>
        </section>

        {inProgress.length > 0 && (
          <section className="mt-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Upcoming
            </h2>
            <div className="mt-2 space-y-2">
              {inProgress.map((s: any) => {
                const trainer = snap.trainers.find(
                  (t: any) => t.id === s.trainer_id,
                );
                return (
                  <Card key={s.id} className="flex items-center justify-between border-border p-4">
                    <div>
                      <p className="text-sm">
                        With {trainer?.name?.replace("Test PT ", "")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {s.status === "acknowledged"
                          ? "Trainer acknowledged"
                          : "Assigned"}
                      </p>
                    </div>
                    <Clock className="size-4 text-muted-foreground" />
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {done.length > 0 && (
          <section className="mt-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Verified
            </h2>
            <div className="mt-2 space-y-2">
              {done.slice(0, 5).map((s: any) => (
                <Card key={s.id} className="flex items-center justify-between border-border p-3">
                  <p className="text-xs text-muted-foreground">
                    {new Date(s.member_confirmed_at ?? s.created_at).toLocaleString()}
                  </p>
                  <p className="font-mono text-xs tabular-nums text-primary">
                    +{formatAUD(s.pt_amount_cents)} to PT
                  </p>
                </Card>
              ))}
            </div>
          </section>
        )}

        <div className="mt-10 flex justify-center gap-4 text-xs text-muted-foreground">
          <Link to="/" className="underline underline-offset-4 hover:text-foreground">
            Start
          </Link>
          <Link to="/trainer" className="underline underline-offset-4 hover:text-foreground">
            Trainer view
          </Link>
          <Link to="/dashboard" className="underline underline-offset-4 hover:text-foreground">
            Manager view
          </Link>
        </div>
      </div>
    </div>
  );
}

function SplitRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={accent ? "text-primary" : "text-muted-foreground"}>
        {label}
      </span>
      <span className={accent ? "text-primary" : "text-foreground"}>
        {value}
      </span>
    </div>
  );
}
