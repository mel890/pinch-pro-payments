import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import {
  CheckCircle2,
  Clock,
  XCircle,
  ShieldCheck,
  Activity,
  CreditCard,
  Repeat,
  Package,
  ChevronRight,
  Play,
  Copy,
  ChevronDown,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

export const Route = createFileRoute("/demo-console")({
  head: () => ({
    meta: [
      { title: "Pinch Integration Console — VezaPT Pay" },
      {
        name: "description",
        content:
          "Live payment events connecting purchase, service delivery and recurring coaching in VezaPT Pay.",
      },
      { property: "og:title", content: "Pinch Integration Console — VezaPT Pay" },
      {
        property: "og:description",
        content:
          "Verify how Pinch confirms payment and VezaPT activates coaching packs and recurring billing.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PinchConsole,
});

/* ------------------------------------------------------------------ */
/* Demo data                                                           */
/* ------------------------------------------------------------------ */

type Source = "VezaPT" | "Pinch";
type Status = "complete" | "pending" | "failed";

type TimelineEvent = {
  id: string;
  name: string;
  description: string;
  time: string;
  status: Status;
  source: Source;
  detail: {
    eventId: string;
    recordId: string;
    received: string;
    processed: string;
    result: string;
    related: string;
    idempotency: string;
    retries: number;
    payload: Record<string, unknown>;
  };
};

const BASE_DATE = "2026-07-24";
const t = (hhmm: string) => `${BASE_DATE} ${hhmm} AEST`;

function ev(
  id: string,
  name: string,
  description: string,
  time: string,
  source: Source,
  detail: Partial<TimelineEvent["detail"]> = {},
  status: Status = "complete",
): TimelineEvent {
  return {
    id,
    name,
    description,
    time: t(time),
    status,
    source,
    detail: {
      eventId: detail.eventId ?? `evt_test_${id}`,
      recordId: detail.recordId ?? "purchase_demo_001",
      received: t(time),
      processed: t(time),
      result: detail.result ?? "Processed successfully",
      related: detail.related ?? "Alex Morgan — PT Kickstart Pack",
      idempotency: detail.idempotency ?? "First time this event ID was seen",
      retries: detail.retries ?? 0,
      payload: detail.payload ?? {
        provider: "pinch",
        environment: "test",
        event_type: "workflow.step",
        provider_event_id: `evt_test_${id}`,
        purchase_id: "purchase_demo_001",
        amount: 24900,
        currency: "AUD",
        status: "confirmed",
      },
    },
  };
}

const KICKSTART_EVENTS: TimelineEvent[] = [
  ev("kick_01", "Purchase created", "VezaPT created purchase purchase_demo_001.", "09:02", "VezaPT"),
  ev("kick_02", "Payment Link requested", "A hosted Pinch checkout was requested for $249 AUD.", "09:02", "VezaPT"),
  ev("kick_03", "Checkout opened", "Alex opened the Pinch-hosted checkout.", "09:03", "Pinch"),
  ev("kick_04", "Payment submitted", "Payment details were securely submitted to Pinch.", "09:04", "Pinch", {
    payload: {
      provider: "pinch",
      environment: "test",
      event_type: "payment.submitted",
      provider_event_id: "evt_test_8X2K...",
      purchase_id: "purchase_demo_001",
      payment_method: "card ending ••••",
      amount: 24900,
      currency: "AUD",
      status: "processing",
    },
  }),
  ev("kick_05", "Payment confirmed by Pinch", "Pinch reported the transaction as successful.", "09:04", "Pinch", {
    eventId: "evt_test_8X2K...",
    payload: {
      provider: "pinch",
      environment: "test",
      event_type: "payment.confirmed",
      provider_event_id: "evt_test_8X2K...",
      purchase_id: "purchase_demo_001",
      amount: 24900,
      currency: "AUD",
      status: "confirmed",
    },
  }),
  ev("kick_06", "Webhook received", "VezaPT received the confirmed payment event.", "09:04", "VezaPT", {
    eventId: "evt_test_8X2K...",
  }),
  ev("kick_07", "Webhook verified", "The incoming event passed signature and source validation.", "09:04", "VezaPT", {
    result: "Signature valid — source verified",
  }),
  ev("kick_08", "Duplicate check passed", "The provider event ID had not been processed previously.", "09:04", "VezaPT", {
    idempotency: "No prior record of evt_test_8X2K... — processed once",
  }),
  ev("kick_09", "Purchase updated", "Purchase status changed from Pending to Paid.", "09:05", "VezaPT", {
    result: "purchase_demo_001 → Paid",
  }),
  ev("kick_10", "Pack activated", "Alex received three available Kickstart sessions.", "09:05", "VezaPT", {
    related: "Kickstart Pack — 3 sessions available",
  }),
  ev("kick_11", "Trainer matching initiated", "VezaPT started matching Alex with an available trainer.", "09:05", "VezaPT", {
    related: "Match request — Northside Club",
  }),
];

const RECURRING_EVENTS: TimelineEvent[] = [
  ev("rec_01", "Ongoing plan recommended", "Sarah recommended Twice-Weekly Coaching after Alex’s progress review.", "16:10", "VezaPT", { recordId: "plan_demo_001", related: "Alex Morgan — Twice-Weekly Coaching" }),
  ev("rec_02", "Member accepted plan", "Alex selected the $180 weekly coaching plan.", "16:14", "VezaPT", { recordId: "plan_demo_001", related: "Alex Morgan — Twice-Weekly Coaching" }),
  ev("rec_03", "Payer record created", "Alex was registered as a payer in the Pinch test environment.", "16:15", "Pinch", { recordId: "plan_demo_001", eventId: "pyr_test_cD59...", related: "Payer record (test)" }),
  ev("rec_04", "Payment authority created", "Alex authorised the recurring payment arrangement.", "16:16", "Pinch", { recordId: "plan_demo_001", eventId: "auth_test_9Qm2...", related: "Payment authority (masked)" }),
  ev("rec_05", "Weekly schedule created", "A $180 weekly collection schedule was created.", "16:16", "Pinch", { recordId: "plan_demo_001", related: "Weekly schedule — $180 AUD" }),
  ev("rec_06", "Confirmation received", "Pinch confirmed the recurring arrangement.", "16:17", "Pinch", { recordId: "plan_demo_001", related: "Recurring arrangement confirmed" }),
  ev("rec_07", "Coaching plan activated", "VezaPT changed the plan status from Authority pending to Active.", "16:17", "VezaPT", { recordId: "plan_demo_001", result: "plan_demo_001 → Active" }),
  ev("rec_08", "Next collection scheduled", "The next payment date was stored in VezaPT.", "16:17", "VezaPT", { recordId: "plan_demo_001", result: "Next collection: 31 Jul 2026" }),
];

const FAILED_EVENTS: TimelineEvent[] = [
  ev("fail_01", "Checkout created", "A hosted Pinch checkout was created for $249 AUD.", "11:20", "VezaPT", { recordId: "purchase_demo_002", related: "Jordan Blake — PT Kickstart Pack" }),
  ev("fail_02", "Payment attempted", "Payment details were submitted to Pinch.", "11:21", "Pinch", { recordId: "purchase_demo_002" }),
  {
    ...ev("fail_03", "Payment declined", "Test payment declined by the issuing bank.", "11:21", "Pinch", {
      recordId: "purchase_demo_002",
      result: "Declined — test card",
      payload: {
        provider: "pinch",
        environment: "test",
        event_type: "payment.failed",
        provider_event_id: "evt_test_4LmQ...",
        purchase_id: "purchase_demo_002",
        amount: 24900,
        currency: "AUD",
        status: "declined",
      },
    }),
    status: "failed",
  },
  ev("fail_04", "Failure webhook received", "VezaPT received the failed payment event.", "11:21", "VezaPT", { recordId: "purchase_demo_002" }),
  ev("fail_05", "Purchase changed to Failed", "Purchase status changed from Pending to Failed.", "11:21", "VezaPT", { recordId: "purchase_demo_002", result: "purchase_demo_002 → Failed" }),
  ev("fail_06", "Pack remained inactive", "No sessions were created and no trainer matching started.", "11:21", "VezaPT", { recordId: "purchase_demo_002", result: "Pack inactive" }),
];

const DUPLICATE_EVENTS: TimelineEvent[] = [
  ev("dup_01", "First event processed", "Pinch confirmed the payment and VezaPT created three sessions.", "09:04", "VezaPT", {
    eventId: "evt_test_8X2K...",
    idempotency: "First time this event ID was seen — processed",
    result: "3 sessions created",
  }),
  ev("dup_02", "Duplicate event ignored", "The same provider event ID arrived again and was skipped.", "09:06", "VezaPT", {
    eventId: "evt_test_8X2K...",
    idempotency: "Event ID already stored — ignored",
    result: "No change — sessions remain 3, not 6",
    retries: 1,
  }),
];

const DEMO_STEPS = [
  "Creating purchase",
  "Requesting Pinch checkout",
  "Checkout opened",
  "Awaiting confirmation",
  "Webhook received",
  "Payment confirmed",
  "Pack activated",
  "Trainer matching initiated",
];

/* ------------------------------------------------------------------ */
/* Small presentational pieces                                         */
/* ------------------------------------------------------------------ */

function StatusPill({ status, label }: { status: Status; label?: string }) {
  const map = {
    complete: { cls: "pill pill-verified", Icon: CheckCircle2, text: label ?? "Complete" },
    pending: { cls: "pill pill-pending", Icon: Clock, text: label ?? "Pending" },
    failed: { cls: "pill pill-review", Icon: XCircle, text: label ?? "Failed" },
  }[status];
  return (
    <span className={map.cls}>
      <map.Icon className="size-3.5" strokeWidth={2} />
      {map.text}
    </span>
  );
}

function SourcePill({ source }: { source: Source }) {
  return (
    <span
      className={
        source === "Pinch"
          ? "pill pill-paid"
          : "pill border-[oklch(0.663_0.160_152.4/32%)] bg-[oklch(0.663_0.160_152.4/12%)] text-success"
      }
    >
      {source}
    </span>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  tone: "payment" | "workflow";
}) {
  return (
    <Card className="card-elevated">
      <CardContent className="flex items-center gap-3 p-4">
        <span
          className={`grid size-9 shrink-0 place-items-center rounded-xl ${
            tone === "payment"
              ? "bg-[var(--payment-surface)] text-payment"
              : "bg-[oklch(0.663_0.160_152.4/14%)] text-success"
          }`}
        >
          <Icon className="size-4.5" strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground">{label}</div>
          <div
            className={`truncate text-sm font-semibold ${
              tone === "payment" ? "text-payment" : "text-success"
            }`}
          >
            {value}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({ label, value, tone }: { label: string; value: string; tone?: "payment" | "workflow" }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border/60 py-2 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={`text-sm font-medium tabular-nums ${
          tone === "payment" ? "text-payment" : tone === "workflow" ? "text-success" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function Timeline({
  title,
  events,
  onOpen,
  activeCount,
}: {
  title: string;
  events: TimelineEvent[];
  onOpen: (e: TimelineEvent) => void;
  activeCount?: number;
}) {
  const visible = activeCount === undefined ? events : events.slice(0, activeCount);
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      <ol className="relative space-y-1 pl-1">
        {visible.map((e, i) => (
          <li key={e.id} className="relative pl-7">
            {i < visible.length - 1 && (
              <span className="absolute left-[9px] top-6 h-[calc(100%-0.5rem)] w-px bg-border" />
            )}
            <span
              className={`absolute left-0 top-3 grid size-[19px] place-items-center rounded-full border ${
                e.status === "failed"
                  ? "border-[oklch(0.586_0.222_17.6/45%)] bg-[oklch(0.586_0.222_17.6/18%)] text-destructive"
                  : e.source === "Pinch"
                    ? "border-[var(--payment-border)] bg-[var(--payment-surface)] text-payment"
                    : "border-[oklch(0.663_0.160_152.4/34%)] bg-[oklch(0.663_0.160_152.4/14%)] text-success"
              }`}
            >
              {e.status === "failed" ? (
                <XCircle className="size-3" strokeWidth={2.25} />
              ) : (
                <CheckCircle2 className="size-3" strokeWidth={2.25} />
              )}
            </span>
            <button
              type="button"
              onClick={() => onOpen(e)}
              className="group flex w-full items-start gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-white/5"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{e.name}</span>
                  <SourcePill source={e.source} />
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{e.description}</p>
                <p className="mt-1 text-[11px] tabular-nums text-muted-foreground/80">{e.time}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2 pt-0.5">
                <StatusPill status={e.status} />
                <ChevronRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

function PinchConsole() {
  const [selected, setSelected] = useState<TimelineEvent | null>(null);
  const [showFailed, setShowFailed] = useState(false);
  const [showDuplicate, setShowDuplicate] = useState(false);
  const [demoStep, setDemoStep] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const runDemo = () => {
    if (timer.current) clearTimeout(timer.current);
    setDemoStep(0);
    const tick = (n: number) => {
      timer.current = setTimeout(() => {
        setDemoStep(n);
        if (n < DEMO_STEPS.length - 1) tick(n + 1);
      }, 1400);
    };
    tick(1);
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-8 sm:px-6">
      {/* Header */}
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Pinch Integration Console
          </h1>
          <span className="pill pill-paid uppercase tracking-wide">Test mode</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Live payment events connecting purchase, service delivery and recurring coaching.
        </p>
        <p className="text-xs text-muted-foreground/80">No real funds are being transferred.</p>
      </header>

      {/* Summary */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard icon={CreditCard} label="Payment status" value="Confirmed" tone="payment" />
        <SummaryCard icon={Package} label="Kickstart Pack" value="Active" tone="workflow" />
        <SummaryCard icon={Repeat} label="Recurring coaching" value="Active" tone="workflow" />
        <SummaryCard icon={Activity} label="Integration health" value="Connected" tone="payment" />
      </div>

      {/* Kickstart transaction */}
      <Card className="card-elevated">
        <CardHeader className="gap-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>PT Kickstart Pack purchase</CardTitle>
            <div className="flex items-center gap-2">
              <span className="pill pill-verified">
                <ShieldCheck className="size-3.5" /> Verified test transaction
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            This record was updated from a Pinch test-environment webhook.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-x-8 sm:grid-cols-2">
            <div>
              <Field label="Member" value="Alex Morgan" />
              <Field label="Club" value="Northside Club" />
              <Field label="Product" value="3-session Kickstart Pack" />
              <Field label="Amount" value="$249.00 AUD" tone="payment" />
              <Field label="Payment provider" value="Pinch" tone="payment" />
            </div>
            <div>
              <Field label="Environment" value="Test" />
              <Field label="Purchase status" value="Paid" tone="payment" />
              <Field label="Pack status" value="Active" tone="workflow" />
              <Field label="Sessions available" value="3" tone="workflow" />
              <Field label="Payment details" value="Not stored by VezaPT" />
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--payment-border)] bg-[var(--payment-surface)] p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-payment">
              <CheckCircle2 className="size-4" /> Payment confirmed
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Pinch confirmed the transaction. VezaPT activated Alex’s Kickstart Pack and initiated
              trainer matching.
            </p>
          </div>

          <Timeline title="Initial purchase" events={KICKSTART_EVENTS} onOpen={setSelected} />
        </CardContent>
      </Card>

      {/* Guided presentation mode */}
      <Card className="ai-card rounded-3xl">
        <CardHeader className="gap-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-base">Guided presentation mode</CardTitle>
            <Button onClick={runDemo} size="sm">
              <Play className="size-4" /> Run payment demo
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Replays the same event records as the test-payment flow. Animation alone is not proof of
            payment — the records above come from the Pinch test webhook.
          </p>
        </CardHeader>
        {demoStep !== null && (
          <CardContent>
            <ol className="space-y-2">
              {DEMO_STEPS.map((s, i) => (
                <li key={s} className="flex items-center gap-3 text-sm">
                  {i <= demoStep ? (
                    <CheckCircle2 className="size-4 text-success" />
                  ) : (
                    <Clock className="size-4 text-muted-foreground/60" />
                  )}
                  <span className={i <= demoStep ? "" : "text-muted-foreground/60"}>{s}</span>
                  {i === demoStep && i < DEMO_STEPS.length - 1 && (
                    <StatusPill status="pending" label="In progress" />
                  )}
                </li>
              ))}
            </ol>
          </CardContent>
        )}
      </Card>

      {/* Recurring coaching */}
      <Card className="card-elevated">
        <CardHeader className="gap-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Twice-Weekly Coaching</CardTitle>
            <span className="pill pill-verified">
              <ShieldCheck className="size-3.5" /> Verified test transaction
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            This record was updated from a Pinch test-environment webhook.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-x-8 sm:grid-cols-2">
            <div>
              <Field label="Member" value="Alex Morgan" />
              <Field label="Trainer" value="Sarah Marino" />
              <Field label="Plan" value="2 sessions per week" />
              <Field label="Price" value="$180.00 AUD per week" tone="payment" />
            </div>
            <div>
              <Field label="Payment provider" value="Pinch" tone="payment" />
              <Field label="Environment" value="Test" />
              <Field label="Plan status" value="Active" tone="workflow" />
              <Field label="Next collection" value="31 Jul 2026" />
              <Field label="Billing frequency" value="Weekly" />
            </div>
          </div>

          <div className="rounded-2xl border border-[oklch(0.663_0.160_152.4/32%)] bg-[oklch(0.663_0.160_152.4/12%)] p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-success">
              <CheckCircle2 className="size-4" /> Recurring coaching active
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Alex authorised weekly billing through Pinch. VezaPT activated the ongoing coaching
              plan with Sarah.
            </p>
          </div>

          <Timeline title="Recurring billing" events={RECURRING_EVENTS} onOpen={setSelected} />
        </CardContent>
      </Card>

      {/* Integration health */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-base">Integration health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-x-8 sm:grid-cols-2">
            <div>
              <Field label="API connection" value="Connected" tone="payment" />
              <Field label="Webhook endpoint" value="Receiving events" tone="payment" />
              <Field label="Last webhook" value={t("16:17")} />
              <Field label="Signature verification" value="Passing" tone="workflow" />
            </div>
            <div>
              <Field label="Idempotency protection" value="Active" tone="workflow" />
              <Field label="Failed events" value="0" />
              <Field label="Unprocessed events" value="0" />
            </div>
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground/80">
            Health indicators reflect the current test environment.
          </p>
        </CardContent>
      </Card>

      {/* Service and payout status */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-base">Service and payout status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-x-8 sm:grid-cols-2">
            <div>
              <Field label="Purchase paid" value="Yes" tone="payment" />
              <Field label="Trainer assigned" value="Sarah Marino" />
              <Field
                label="Session 1 check-in code"
                value="Scanned and validated"
                tone="workflow"
              />
            </div>
            <div>
              <Field label="Session 1 trainer log" value="Submitted" tone="workflow" />
              <Field label="Member confirmation" value="Confirmed" tone="workflow" />
              <Field label="Payout status" value="Payout eligible" tone="workflow" />
            </div>
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground/80">
            Payment for the pack was already confirmed by Pinch. Session
            verification determines when the trainer's fulfilment amount becomes
            payout eligible.
          </p>
        </CardContent>
      </Card>

      {/* Session verification event timeline */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-base">
            Session verification events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-1.5 text-sm">
            {[
              "Session delivered",
              "Check-in code generated",
              "Check-in code scanned",
              "Code validated",
              "Session log submitted",
              "Member confirmation requested",
              "Member confirmed — or no-dispute timeout completed",
              "Session verified",
              "Pack balance updated",
              "Trainer payout marked eligible",
            ].map((label, i) => (
              <li key={label} className="flex items-start gap-2.5">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-secondary font-mono text-[10px] font-semibold">
                  {i + 1}
                </span>
                <span className="text-muted-foreground">{label}</span>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-[11px] text-muted-foreground/80">
            Member confirmation does not create or authorise the original
            payment — it releases the trainer's fulfilment amount for payout.
          </p>
        </CardContent>
      </Card>


      {/* Error demonstrations */}
      <Card className="card-elevated">
        <CardHeader className="gap-3">
          <CardTitle className="text-base">Safeguard demonstrations</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowFailed((v) => !v)}>
              <ChevronDown
                className={`size-4 transition-transform ${showFailed ? "rotate-180" : ""}`}
              />
              Show failed-payment example
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowDuplicate((v) => !v)}>
              <ChevronDown
                className={`size-4 transition-transform ${showDuplicate ? "rotate-180" : ""}`}
              />
              Show duplicate-webhook example
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            These are separate sample transactions. Alex’s successful journey above is unchanged.
          </p>
        </CardHeader>
        {(showFailed || showDuplicate) && (
          <CardContent className="space-y-8">
            {showFailed && (
              <div className="space-y-4 rounded-2xl border border-[oklch(0.586_0.222_17.6/34%)] bg-[oklch(0.586_0.222_17.6/10%)] p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold">Failed payment — sample transaction</span>
                  <StatusPill status="failed" label="Payment failed" />
                </div>
                <div className="grid gap-x-8 sm:grid-cols-2">
                  <div>
                    <Field label="Payment status" value="Failed" />
                    <Field label="Pack status" value="Inactive" />
                  </div>
                  <div>
                    <Field label="Reason" value="Test payment declined" />
                    <Field label="Workflow outcome" value="No trainer matching initiated" />
                  </div>
                </div>
                <Timeline title="Declined purchase" events={FAILED_EVENTS} onOpen={setSelected} />
                <p className="text-sm font-medium text-destructive">
                  VezaPT does not activate a pack unless Pinch confirms payment.
                </p>
              </div>
            )}
            {showDuplicate && (
              <div className="space-y-4 rounded-2xl border border-border bg-surface-2 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold">Duplicate webhook — sample event</span>
                  <StatusPill status="complete" label="Handled safely" />
                </div>
                <div className="grid gap-x-8 sm:grid-cols-2">
                  <div>
                    <Field label="First event" value="Processed" tone="workflow" />
                    <Field label="Duplicate event" value="Ignored" />
                  </div>
                  <div>
                    <Field label="Pack sessions created" value="3, not 6" tone="workflow" />
                  </div>
                </div>
                <Timeline title="Duplicate handling" events={DUPLICATE_EVENTS} onOpen={setSelected} />
                <p className="text-xs text-muted-foreground">
                  Provider event IDs are stored and processed once.
                </p>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Commercial flow summary */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-base">Commercial flow</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="flex flex-wrap items-center gap-2 text-xs">
            {[
              { text: "$249 Kickstart purchase", tone: "payment" },
              { text: "Pinch confirms payment", tone: "payment" },
              { text: "VezaPT activates 3-session pack", tone: "workflow" },
              { text: "Sarah delivers verified coaching", tone: "workflow" },
              { text: "Alex accepts $180/week plan", tone: "workflow" },
              { text: "Pinch creates recurring billing", tone: "payment" },
              { text: "VezaPT tracks conversion and retention", tone: "workflow" },
            ].map((s, i, arr) => (
              <li key={s.text} className="flex items-center gap-2">
                <span
                  className={
                    s.tone === "payment"
                      ? "rounded-full border border-[var(--payment-border)] bg-[var(--payment-surface)] px-3 py-1.5 font-medium text-payment"
                      : "rounded-full border border-[oklch(0.663_0.160_152.4/32%)] bg-[oklch(0.663_0.160_152.4/12%)] px-3 py-1.5 font-medium text-success"
                  }
                >
                  {s.text}
                </span>
                {i < arr.length - 1 && (
                  <ChevronRight className="size-3.5 text-muted-foreground" />
                )}
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <EventDrawer event={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Drawer                                                              */
/* ------------------------------------------------------------------ */

function EventDrawer({ event, onClose }: { event: TimelineEvent | null; onClose: () => void }) {
  const [showPayload, setShowPayload] = useState(false);
  return (
    <Sheet open={!!event} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {event && (
          <>
            <SheetHeader>
              <SheetTitle>{event.name}</SheetTitle>
              <SheetDescription>{event.description}</SheetDescription>
            </SheetHeader>
            <div className="space-y-4 px-4 pb-8">
              <div className="flex items-center gap-2">
                <StatusPill status={event.status} />
                <SourcePill source={event.source} />
              </div>
              <div>
                <Field label="Provider" value={event.source === "Pinch" ? "Pinch (test)" : "VezaPT"} />
                <Field label="Event ID" value={event.detail.eventId} />
                <Field label="Purchase / plan ID" value={event.detail.recordId} />
                <Field label="Received" value={event.detail.received} />
                <Field label="Processed" value={event.detail.processed} />
                <Field label="Processing result" value={event.detail.result} />
                <Field label="Related VezaPT record" value={event.detail.related} />
                <Field label="Idempotency result" value={event.detail.idempotency} />
                <Field label="Retry count" value={String(event.detail.retries)} />
              </div>

              <button
                type="button"
                onClick={() => setShowPayload((v) => !v)}
                className="flex w-full items-center justify-between rounded-xl border border-border px-3 py-2 text-sm hover:bg-white/5"
              >
                Technical payload
                <ChevronDown
                  className={`size-4 transition-transform ${showPayload ? "rotate-180" : ""}`}
                />
              </button>
              {showPayload && (
                <div className="relative">
                  <pre className="overflow-x-auto rounded-xl border border-border bg-surface-2 p-3 text-[11px] leading-relaxed text-muted-foreground">
{JSON.stringify(event.detail.payload, null, 2)}
                  </pre>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-2"
                    onClick={() =>
                      navigator.clipboard?.writeText(JSON.stringify(event.detail.payload, null, 2))
                    }
                  >
                    <Copy className="size-3.5" />
                  </Button>
                  <p className="mt-2 text-[11px] text-muted-foreground/80">
                    Sanitised payload. Keys, secrets, card and bank details are never shown.
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
