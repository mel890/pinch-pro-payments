import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CreditCard,
  HeartPulse,
  ShieldCheck,
  Sparkles,
  Target,
  UserRound,
  CalendarClock,
} from "lucide-react";
import { formatAUD } from "@/lib/money";
import {
  useJourney,
  journey,
  KICKSTART,
  CLUB,
  MEMBER,
  INTAKE_OPTIONS,
  type IntakeForm,
} from "@/lib/journey-store";

export const Route = createFileRoute("/pay")({
  head: () => ({
    meta: [
      { title: "PT Kickstart Pack — member intake & checkout | VezaPT Pay" },
      {
        name: "description",
        content:
          "Alex completes a four-step member intake — details, goals, injuries and health, schedule and coaching preferences — then buys the 3-session PT Kickstart Pack for $249.",
      },
      { property: "og:title", content: "PT Kickstart Pack — VezaPT Pay" },
      {
        property: "og:description",
        content:
          "A realistic member intake and checkout: goals, experience, injuries, availability and coaching style feed straight into trainer matching.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MemberPurchase,
});

const STEPS = [
  { title: "Your details", icon: UserRound },
  { title: "Goals & experience", icon: Target },
  { title: "Health & injuries", icon: HeartPulse },
  { title: "Schedule & coaching", icon: CalendarClock },
] as const;

function MemberPurchase() {
  const s = useJourney();
  const [form, setForm] = useState<IntakeForm>(s.intake);
  const [step, setStep] = useState(0);
  const [paying, setPaying] = useState(false);
  const [touched, setTouched] = useState(false);

  const set = <K extends keyof IntakeForm>(key: K, value: IntakeForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggle = (key: "activities" | "conditions" | "days", value: string) =>
    setForm((f) => {
      const list = f[key];
      const next = list.includes(value)
        ? list.filter((v) => v !== value)
        : [...list, value];
      return { ...f, [key]: next };
    });

  const errors = stepErrors(step, form);
  const [editing, setEditing] = useState(false);
  const showWizard = !s.intakeSubmitted || editing;

  const next = () => {
    setTouched(true);
    if (errors.length) return;
    setTouched(false);
    journey.updateIntake(form);
    if (step < STEPS.length - 1) setStep(step + 1);
    else {
      setEditing(false);
      journey.submitIntake();
    }
  };

  const editStep = (i: number) => {
    setStep(i);
    setTouched(false);
    setEditing(true);
  };


  const buy = () => {
    setPaying(true);
    journey.updateIntake(form);
    setTimeout(() => {
      journey.pay();
      setPaying(false);
    }, 900);
  };

  return (
    <div className="min-h-screen bg-background pb-20 text-foreground">
      <div className="mx-auto max-w-5xl px-5 pt-10 sm:px-8">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {CLUB.name} · member offer
        </p>
        <h1 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
          Start with clarity, confidence and a plan.
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Three coached sessions with a {CLUB.name} trainer, a programme built
          around your goal, and a clear recommendation for what comes next.
        </p>

        {s.paid ? (
          <PaidState form={form} />
        ) : (
          <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
            {!showWizard ? (
              <ReviewCard form={form} onEditStep={editStep} />
            ) : (

              <Card className="border-primary/25 p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Member intake · step {step + 1} of {STEPS.length}
                    </p>
                    <h2 className="mt-1 flex items-center gap-2 text-xl font-semibold">
                      {(() => {
                        const Icon = STEPS[step].icon;
                        return <Icon className="size-5 text-primary" />;
                      })()}
                      {STEPS[step].title}
                    </h2>
                  </div>
                  <Badge className="border border-primary/40 bg-primary/10 text-primary">
                    Takes about 2 minutes
                  </Badge>
                </div>

                <Progress
                  value={((step + 1) / STEPS.length) * 100}
                  className="mt-4 h-1.5"
                />

                <div className="mt-6 space-y-5">
                  {step === 0 && (
                    <>
                      <Row>
                        <Field label="Full name">
                          <Input
                            value={form.fullName}
                            onChange={(e) => set("fullName", e.target.value)}
                            placeholder="Alex Morgan"
                          />
                        </Field>
                        <Field label="Age range">
                          <NativeSelect
                            value={form.ageBand}
                            onChange={(v) => set("ageBand", v)}
                            options={INTAKE_OPTIONS.ageBands}
                          />
                        </Field>
                      </Row>
                      <Row>
                        <Field label="Email">
                          <Input
                            type="email"
                            value={form.email}
                            onChange={(e) => set("email", e.target.value)}
                            placeholder="you@example.com"
                          />
                        </Field>
                        <Field label="Mobile">
                          <Input
                            value={form.mobile}
                            onChange={(e) => set("mobile", e.target.value)}
                            placeholder="0400 000 000"
                          />
                        </Field>
                      </Row>
                      <p className="text-xs text-muted-foreground">
                        Your trainer uses these details to contact you and book
                        session one. {CLUB.name} never sells your data.
                      </p>
                    </>
                  )}

                  {step === 1 && (
                    <>
                      <Field label="Primary goal">
                        <NativeSelect
                          value={form.goal}
                          onChange={(v) => set("goal", v)}
                          options={INTAKE_OPTIONS.goals}
                        />
                      </Field>
                      <Field label="Why now? What would success look like?">
                        <Textarea
                          rows={3}
                          value={form.motivation}
                          onChange={(e) => set("motivation", e.target.value)}
                          placeholder="Tell your trainer what's prompted this."
                        />
                      </Field>
                      <Row>
                        <Field label="Timeframe in mind">
                          <NativeSelect
                            value={form.targetWeeks}
                            onChange={(v) => set("targetWeeks", v)}
                            options={INTAKE_OPTIONS.targetWeeks}
                          />
                        </Field>
                        <Field label="Training experience">
                          <NativeSelect
                            value={form.experience}
                            onChange={(v) => set("experience", v)}
                            options={INTAKE_OPTIONS.experience}
                          />
                        </Field>
                      </Row>
                      <Field label="Current gym attendance">
                        <NativeSelect
                          value={form.attendance}
                          onChange={(v) => set("attendance", v)}
                          options={INTAKE_OPTIONS.attendance}
                        />
                      </Field>
                      <Field label="What do you currently do? (select all)">
                        <Chips
                          options={INTAKE_OPTIONS.activities}
                          selected={form.activities}
                          onToggle={(v) => toggle("activities", v)}
                        />
                      </Field>
                      <Field
                        label={`Confidence in the gym today: ${form.confidence}/10`}
                      >
                        <Slider
                          min={1}
                          max={10}
                          step={1}
                          value={[form.confidence]}
                          onValueChange={([v]) => set("confidence", v)}
                        />
                        <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
                          <span>Not confident</span>
                          <span>Completely confident</span>
                        </div>
                      </Field>
                    </>
                  )}

                  {step === 2 && (
                    <>
                      <Field label="Injuries or conditions your trainer should know about">
                        <Chips
                          options={INTAKE_OPTIONS.conditions}
                          selected={form.conditions}
                          onToggle={(v) => toggle("conditions", v)}
                        />
                      </Field>
                      <Field label="Anything to explain? (pain, surgery, flare-ups)">
                        <Textarea
                          rows={3}
                          value={form.injuryNotes}
                          onChange={(e) => set("injuryNotes", e.target.value)}
                          placeholder="Describe what aggravates it and what helps."
                        />
                      </Field>
                      <Field label="Cleared by a doctor to exercise?">
                        <Chips
                          single
                          options={["Yes", "No", "Not sure"]}
                          selected={[form.clearedByDoctor]}
                          onToggle={(v) =>
                            set("clearedByDoctor", v as IntakeForm["clearedByDoctor"])
                          }
                        />
                      </Field>
                      <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 text-xs text-muted-foreground">
                        Your answers here are shared only with the trainer you're
                        matched with, so sessions can be adapted safely.
                      </div>
                    </>
                  )}

                  {step === 3 && (
                    <>
                      <Field label="Preferred days (select all that work)">
                        <Chips
                          options={INTAKE_OPTIONS.days}
                          selected={form.days}
                          onToggle={(v) => toggle("days", v)}
                        />
                      </Field>
                      <Row>
                        <Field label="Preferred time of day">
                          <NativeSelect
                            value={form.times}
                            onChange={(v) => set("times", v)}
                            options={INTAKE_OPTIONS.times}
                          />
                        </Field>
                        <Field label="Sessions per week">
                          <NativeSelect
                            value={form.sessionsPerWeek}
                            onChange={(v) => set("sessionsPerWeek", v)}
                            options={INTAKE_OPTIONS.sessionsPerWeek}
                          />
                        </Field>
                      </Row>
                      <Row>
                        <Field label="Coaching style you respond to">
                          <NativeSelect
                            value={form.style}
                            onChange={(v) => set("style", v)}
                            options={INTAKE_OPTIONS.styles}
                          />
                        </Field>
                        <Field label="Accountability between sessions">
                          <NativeSelect
                            value={form.accountability}
                            onChange={(v) => set("accountability", v)}
                            options={INTAKE_OPTIONS.accountability}
                          />
                        </Field>
                      </Row>
                      <Field label="Anything else your trainer should know?">
                        <Textarea
                          rows={2}
                          value={form.notes}
                          onChange={(e) => set("notes", e.target.value)}
                          placeholder="Optional"
                        />
                      </Field>
                      <label className="flex items-start gap-3 rounded-xl border border-border bg-card/60 p-4 text-sm">
                        <Checkbox
                          checked={form.consent}
                          onCheckedChange={(v) => set("consent", v === true)}
                          className="mt-0.5"
                        />
                        <span className="text-muted-foreground">
                          I agree to share these answers with my matched{" "}
                          {CLUB.name} trainer and confirm the health information
                          above is accurate.
                        </span>
                      </label>
                    </>
                  )}
                </div>

                {touched && errors.length > 0 && (
                  <ul className="mt-4 space-y-1 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                    {errors.map((e) => (
                      <li key={e}>{e}</li>
                    ))}
                  </ul>
                )}

                <div className="mt-6 flex items-center justify-between gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={step === 0}
                    onClick={() => {
                      setTouched(false);
                      setStep(step - 1);
                    }}
                  >
                    <ArrowLeft className="mr-1 size-4" /> Back
                  </Button>
                  <Button onClick={next} className="shadow-[var(--shadow-soft)]">
                    {step === STEPS.length - 1 ? "Review and pay" : "Continue"}
                    <ArrowRight className="ml-1 size-4" />
                  </Button>
                </div>
              </Card>
            )}

            <OfferCard
              form={form}
              ready={s.intakeSubmitted && !editing}
              paying={paying}
              onBuy={buy}
              onJump={editStep}
            />

          </div>
        )}
      </div>
    </div>
  );
}



function stepErrors(step: number, f: IntakeForm): string[] {
  const e: string[] = [];
  if (step === 0) {
    if (f.fullName.trim().length < 2) e.push("Enter your full name.");
    if (!/^\S+@\S+\.\S+$/.test(f.email)) e.push("Enter a valid email address.");
    if (f.mobile.replace(/\D/g, "").length < 8)
      e.push("Enter a contactable mobile number.");
  }
  if (step === 1 && f.motivation.trim().length < 10)
    e.push("Add a sentence about why you're starting now.");
  if (step === 2 && f.conditions.length === 0)
    e.push("Select at least one option — choose “None” if nothing applies.");
  if (step === 3) {
    if (f.days.length === 0) e.push("Select at least one preferred day.");
    if (!f.consent) e.push("Tick the consent box to continue.");
  }
  return e;
}

function ReviewCard({
  form,
  onEditStep,
}: {
  form: IntakeForm;
  onEdit?: () => void;
  onEditStep: (i: number) => void;
}) {
  return (
    <Card className="border-primary/25 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Member intake · complete
          </p>
          <h2 className="mt-1 text-xl font-semibold">Review your answers</h2>
        </div>
        <Badge className="border border-success/40 bg-success/10 text-success">
          Ready for matching
        </Badge>
      </div>

      <div className="mt-5 space-y-4">
        <Section
          title="Your details"
          onEdit={() => onEditStep(0)}
          rows={[
            ["Name", form.fullName],
            ["Age range", form.ageBand],
            ["Email", form.email],
            ["Mobile", form.mobile],
          ]}
        />
        <Section
          title="Goals & experience"
          onEdit={() => onEditStep(1)}
          rows={[
            ["Primary goal", form.goal],
            ["Why now", form.motivation],
            ["Timeframe", form.targetWeeks],
            ["Experience", form.experience],
            ["Attendance", form.attendance],
            ["Current activity", form.activities.join(", ") || "—"],
            ["Confidence today", `${form.confidence}/10`],
          ]}
        />
        <Section
          title="Health & injuries"
          onEdit={() => onEditStep(2)}
          rows={[
            ["Conditions", form.conditions.join(", ")],
            ["Notes", form.injuryNotes || "—"],
            ["Cleared to exercise", form.clearedByDoctor],
          ]}
        />
        <Section
          title="Schedule & coaching"
          onEdit={() => onEditStep(3)}
          rows={[
            ["Preferred days", form.days.join(", ")],
            ["Preferred time", form.times],
            ["Frequency", form.sessionsPerWeek],
            ["Coaching style", form.style],
            ["Accountability", form.accountability],
            ["Other notes", form.notes || "—"],
          ]}
        />
      </div>

      <div className="mt-5 rounded-xl border border-primary/30 bg-primary/5 p-4">
        <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-primary">
          <Sparkles className="size-3.5" /> What happens with this
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          VezaPT uses your goal, experience, injuries and availability to
          recommend the trainer who fits best — then hands them a brief so
          session one starts prepared.
        </p>
      </div>
    </Card>
  );
}

function Section({
  title,
  rows,
  onEdit,
}: {
  title: string;
  rows: [string, string][];
  onEdit: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card/60 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
        <Button variant="ghost" size="sm" onClick={onEdit}>
          Edit
        </Button>
      </div>
      <dl className="mt-2 grid gap-2 sm:grid-cols-2">
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {k}
            </dt>
            <dd className="mt-0.5 text-sm">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function OfferCard({
  form,
  ready,
  paying,
  onBuy,
  onJump,
}: {
  form: IntakeForm;
  ready: boolean;
  paying: boolean;
  onBuy: () => void;
  onJump: (i: number) => void;
}) {
  return (
    <Card className="h-fit border-border p-6">
      <Badge className="border border-primary/40 bg-primary/10 text-primary">
        Entry product
      </Badge>
      <div className="mt-2 flex items-start justify-between gap-3">
        <h2 className="text-xl font-semibold">{KICKSTART.name}</h2>
        <div className="text-right">
          <p className="font-mono text-2xl font-semibold tabular-nums">
            {formatAUD(KICKSTART.priceCents)}
          </p>
          <p className="text-xs text-muted-foreground">one-off payment</p>
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {KICKSTART.includes.map((i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <Check className="mt-0.5 size-4 shrink-0 text-primary" />
            {i}
          </li>
        ))}
      </ul>

      <div className="mt-5 rounded-xl border border-border bg-card/60 p-4">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Your intake so far · {MEMBER.name}
        </p>
        <div className="mt-2 space-y-1.5 text-sm">
          <Mini label="Goal" value={form.goal} onClick={() => onJump(1)} />
          <Mini
            label="Experience"
            value={form.experience}
            onClick={() => onJump(1)}
          />
          <Mini
            label="Health flags"
            value={form.conditions.join(", ") || "Not set"}
            onClick={() => onJump(2)}
          />
          <Mini
            label="Availability"
            value={`${form.days.join(", ") || "Not set"} · ${form.times}`}
            onClick={() => onJump(3)}
          />
        </div>
      </div>

      <Button
        size="lg"
        className="mt-5 w-full shadow-[var(--shadow-soft)]"
        onClick={onBuy}
        disabled={!ready || paying}
      >
        <CreditCard className="mr-2 size-4" />
        {paying
          ? "Opening secure checkout…"
          : ready
            ? "Buy with Pinch"
            : "Complete your intake to pay"}
      </Button>
      <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
        <ShieldCheck className="size-3.5" /> Secure Australian payment
        processing. Sandbox for this demo.
      </p>
    </Card>
  );
}

function PaidState({ form }: { form: IntakeForm }) {
  return (
    <Card className="mt-8 border-primary/40 bg-primary/5 p-6">
      <div className="flex items-center gap-2 text-primary">
        <Check className="size-5" />
        <p className="text-lg font-semibold">Payment confirmed.</p>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Your intake has been sent for matching. You'll hear from your coach
        shortly to book session one.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Paid label="Payment status" value="Paid" />
        <Paid label="Amount" value={formatAUD(KICKSTART.priceCents)} />
        <Paid label="Intake" value="7 answers shared" />
      </div>
      <div className="mt-4 rounded-xl border border-border bg-card/60 p-4">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Matching on
        </p>
        <p className="mt-1 text-sm">
          {form.goal} · {form.experience} · {form.days.join(", ")} ·{" "}
          {form.times} · {form.style}
        </p>
        {form.conditions.length > 0 && (
          <p className="mt-1 text-sm text-muted-foreground">
            Health flags: {form.conditions.join(", ")}
          </p>
        )}
      </div>
      <Button asChild className="mt-5">
        <Link to="/match">
          Next: VezaPT recommends a trainer{" "}
          <ArrowRight className="ml-1 size-4" />
        </Link>
      </Button>
    </Card>
  );
}

function Mini({
  label,
  value,
  onClick,
}: {
  label: string;
  value: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full rounded-lg border border-border/60 px-3 py-2 text-left transition-colors hover:border-primary/40"
    >
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="mt-0.5 block text-sm">{value}</span>
    </button>
  );
}

function Paid({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card/60 p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-mono text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function NativeSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 w-full rounded-lg border border-input bg-card/70 px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {options.map((o) => (
        <option key={o} value={o} className="bg-card text-foreground">
          {o}
        </option>
      ))}
    </select>
  );
}

function Chips({
  options,
  selected,
  onToggle,
  single,
}: {
  options: readonly string[];
  selected: string[];
  onToggle: (v: string) => void;
  single?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = selected.includes(o);
        return (
          <button
            key={o}
            type="button"
            aria-pressed={on}
            onClick={() => onToggle(o)}
            className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
              on
                ? "border-primary/60 bg-primary/15 text-primary"
                : "border-border text-muted-foreground hover:border-primary/40"
            } ${single ? "min-w-16 text-center" : ""}`}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}
