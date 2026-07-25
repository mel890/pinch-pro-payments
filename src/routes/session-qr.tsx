import { createFileRoute, Link } from "@tanstack/react-router";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import { useDemoState, formatAUD } from "@/lib/demo-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";

export const Route = createFileRoute("/session-qr")({
  head: () => ({
    meta: [
      { title: "Session QR — VezaPT Pay" },
      {
        name: "description",
        content:
          "Show this QR code to your client so they can confirm today's PT session.",
      },
      { property: "og:title", content: "Session QR — VezaPT Pay" },
      {
        property: "og:description",
        content: "Client-facing QR code for PT session confirmation.",
      },
    ],
  }),
  component: SessionQR,
});

function SessionQR() {
  const s = useDemoState();
  const [origin, setOrigin] = useState("");
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const session = s.pendingSession ?? {
    client: "Alex Morgan",
    plan: "2× Weekly PT",
    date: "Today",
    title: "Strength and confidence",
    valueCents: 7485,
    win: "",
  };

  const url = `${origin}/confirm-session/demo`;

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="mx-auto max-w-xl px-5 pt-8 sm:px-8 sm:pt-12">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="-ml-2 text-muted-foreground"
        >
          <Link to="/complete-session">
            <ArrowLeft className="mr-1 size-4" /> Back
          </Link>
        </Button>

        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Ask Alex to scan and confirm
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Session with Sarah · {session.date}
        </p>

        <Card className="mt-6 flex flex-col items-center gap-6 p-8 shadow-[var(--shadow-soft)]">
          <div className="rounded-2xl bg-white p-5 ring-1 ring-border">
            {origin ? (
              <QRCodeSVG
                value={url}
                size={220}
                level="M"
                fgColor="#0f766e"
              />
            ) : (
              <div className="size-[220px]" />
            )}
          </div>

          <div className="w-full space-y-2 text-center">
            <p className="text-sm text-muted-foreground">Session value</p>
            <p className="text-3xl font-semibold text-foreground">
              {formatAUD(session.valueCents)}
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin text-primary" />
            Waiting for Alex…
          </div>
        </Card>

        <Button
          asChild
          variant="outline"
          size="lg"
          className="mt-6 h-12 w-full text-sm font-medium"
        >
          <Link to="/confirm-session/demo">Preview client confirmation</Link>
        </Button>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Or share this link: <span className="font-mono">{url || "…"}</span>
        </p>
      </div>
    </div>
  );
}
