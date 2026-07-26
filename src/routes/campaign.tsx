import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Check, Mail, QrCode, Share2, Rocket } from "lucide-react";
import { formatAUD } from "@/lib/money";
import {
  useJourney,
  journey,
  CAMPAIGN,
  CLUB,
  KICKSTART,
} from "@/lib/journey-store";

export const Route = createFileRoute("/campaign")({
  head: () => ({
    meta: [
      { title: "Launch the PT Kickstart Campaign — VezaPT Pay" },
      {
        name: "description",
        content:
          "Northside Club launches a ready-to-run PT Kickstart Campaign: $249 member price, $199 trainer payout, $50 club campaign fee — no PT sales team required.",
      },
      {
        property: "og:title",
        content: "Launch the PT Kickstart Campaign — VezaPT Pay",
      },
      {
        property: "og:description",
        content:
          "One campaign card: product, price, payout, capacity and channels. Launch in a single click.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CampaignLaunch,
});

const CHANNEL_ICONS = [Mail, Share2, QrCode];

function CampaignLaunch() {
  const s = useJourney();

  return (
    <div className="min-h-screen bg-background pb-20 text-foreground">
      <div className="mx-auto max-w-3xl px-5 pt-10 sm:px-8">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {CLUB.name} · manager
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
          {CAMPAIGN.name}
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          {CAMPAIGN.subtitle}
        </p>

        <Card className="mt-6 border-primary/30 bg-[image:var(--gradient-hero)] p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <Badge
              className={
                s.campaignLive
                  ? "border border-primary/50 bg-primary/15 text-primary"
                  : "border border-border bg-card/60 text-muted-foreground"
              }
            >
              {s.campaignLive ? "Campaign live" : "Ready to launch"}
            </Badge>
            <p className="text-xs text-muted-foreground">
              Your rental model stays exactly as it is
            </p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Row label="Product" value="3-Session Kickstart Pack" />
            <Row label="Member price" value={formatAUD(KICKSTART.priceCents)} accent />
            <Row
              label="Trainer payout"
              value={formatAUD(KICKSTART.trainerPayoutCents)}
            />
            <Row
              label="Club campaign fee"
              value={formatAUD(KICKSTART.clubFeeCents)}
            />
            <Row
              label="Available trainer capacity"
              value={`${CAMPAIGN.capacityPacks} packs`}
            />
            <Row
              label="Participating trainers"
              value={`${CAMPAIGN.trainers}`}
            />
          </div>

          <div className="mt-5">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Channels
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {CAMPAIGN.channels.map((c, i) => {
                const Icon = CHANNEL_ICONS[i] ?? Mail;
                return (
                  <span
                    key={c}
                    className="flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1 text-xs"
                  >
                    <Icon className="size-3.5 text-primary" /> {c}
                  </span>
                );
              })}
            </div>
          </div>

          {s.campaignLive ? (
            <div className="mt-6">
              <p className="flex items-center gap-2 text-sm text-primary">
                <Check className="size-4" /> Campaign live — members can buy the
                Kickstart Pack now.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild>
                  <Link to="/pay">
                    Open member purchase experience{" "}
                    <ArrowRight className="ml-1 size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/trainer-capacity">Review trainer capacity</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-6">
              <Button
                size="lg"
                className="shadow-[var(--shadow-soft)]"
                onClick={() => journey.launchCampaign()}
              >
                <Rocket className="mr-2 size-4" /> Launch campaign
              </Button>
              <Button asChild size="lg" variant="ghost" className="ml-2">
                <Link to="/pay">Open member purchase experience</Link>
              </Button>
            </div>
          )}
        </Card>

        <p className="mt-4 text-xs text-muted-foreground">
          No campaign copy to write, no payment splits to configure, no products
          to design. VezaPT ships the campaign; the club approves it.
        </p>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        accent ? "border-primary/40 bg-primary/5" : "border-border bg-card/60"
      }`}
    >
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-1 font-mono text-lg font-semibold tabular-nums ${
          accent ? "text-primary" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}
