import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { demoStore, formatAUD } from "@/lib/demo-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, QrCode, Calendar, User, Dumbbell } from "lucide-react";

const SESSION = {
  client: "Alex Morgan",
  plan: "2× Weekly PT",
  title: "Strength and confidence",
  valueCents: 7485,
};

export const Route = createFileRoute("/complete-session")({
  head: () => ({
    meta: [
      { title: "Complete a session — VezaPT Pay" },
      {
        name: "description",
        content:
          "Log a completed PT session and generate a client confirmation QR code.",
      },
      { property: "og:title", content: "Complete a session — VezaPT Pay" },
      {
        property: "og:description",
        content: "Log a session and send a confirmation QR to your client.",
      },
    ],
  }),
  component: CompleteSession,
});

function todayLabel() {
  return new Intl.DateTimeFormat("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
}

function CompleteSession() {
  const navigate = useNavigate();
  const [win, setWin] = useState("");
  const date = todayLabel();

  const handleGenerate = () => {
    demoStore.set({
      pendingSession: {
        client: SESSION.client,
        plan: SESSION.plan,
        date,
        title: SESSION.title,
        valueCents: SESSION.valueCents,
        win,
      },
    });
    navigate({ to: "/session-qr" });
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="mx-auto max-w-xl px-5 pt-8 sm:px-8 sm:pt-12">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="-ml-2 text-muted-foreground"
        >
          <Link to="/">
            <ArrowLeft className="mr-1 size-4" /> Back
          </Link>
        </Button>

        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Complete a session
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Confirm the details, then generate a confirmation QR for {SESSION.client.split(" ")[0]}.
        </p>

        <Card className="mt-6 border-primary/25 bg-primary/5 p-5">
          <p className="text-xs uppercase tracking-wider text-primary">
            Client context
          </p>
          <p className="mt-2 text-sm font-semibold text-foreground">
            {SESSION.client}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Goal: Build confidence using free weights
          </p>
          <p className="text-xs text-muted-foreground">
            Plan: {SESSION.plan} · Today's focus: Lower-body strength
          </p>
        </Card>

        <Card className="mt-4 divide-y divide-border p-0">
          <Row
            icon={<User className="size-4" />}
            label="Client"
            value={SESSION.client}
          />
          <Row
            icon={<Dumbbell className="size-4" />}
            label="Plan"
            value={SESSION.plan}
          />
          <Row
            icon={<Calendar className="size-4" />}
            label="Date"
            value={date}
          />
          <Row label="Session" value={`45-minute ${SESSION.title}`} />
          <Row
            label="Session value"
            value={formatAUD(SESSION.valueCents)}
          />
        </Card>

        <div className="mt-6">
          <Label htmlFor="win" className="text-sm font-medium text-foreground">
            Today's win{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Textarea
            id="win"
            value={win}
            onChange={(e) => setWin(e.target.value)}
            placeholder="e.g. Alex used the weights area confidently for the first time."
            className="mt-2 min-h-24"
          />
        </div>

        <Button
          size="lg"
          className="mt-8 h-14 w-full text-base font-semibold shadow-[var(--shadow-soft)]"
          onClick={handleGenerate}
        >
          <QrCode className="mr-2 size-5" />
          Generate confirmation QR
        </Button>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          {SESSION.client.split(" ")[0]}'s confirmation verifies the session and
          captures what the coaching helped with.
        </p>

      </div>
    </div>
  );
}

function Row({
  icon,
  label,
  value,
  emphasize,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </div>
      <p
        className={`text-sm ${
          emphasize
            ? "text-lg font-semibold text-foreground"
            : "font-medium text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
