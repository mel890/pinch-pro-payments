import { Check } from "lucide-react";
import type { SessionStatus } from "@/lib/journey-store";

export const VERIFY_STEPS = [
  "Booked",
  "QR",
  "Checked in",
  "Feedback",
  "Verified",
] as const;

/** Which of the five stages the session is currently sitting in (0-indexed). */
export function stepIndexOf(status: SessionStatus): number {
  switch (status) {
    case "booked":
      return 0;
    case "qr_issued":
      return 1;
    case "checked_in":
    case "in_progress":
      return 2;
    case "awaiting_feedback":
      return 3;
    case "verified":
      return 4;
    default:
      return 3;
  }
}

export function VerificationSteps({
  status,
  className = "",
}: {
  status: SessionStatus;
  className?: string;
}) {
  const active = stepIndexOf(status);
  const review = status === "review_required";

  return (
    <ol className={`flex items-center gap-1.5 ${className}`}>
      {VERIFY_STEPS.map((label, i) => {
        const done = !review && (i < active || status === "verified");
        const current = !review && i === active && status !== "verified";
        return (
          <li key={label} className="flex flex-1 items-center gap-1.5">
            <div className="flex-1">
              <div
                className={`h-1.5 rounded-full ${
                  review && i >= active
                    ? "bg-destructive/60"
                    : done
                      ? "bg-emerald-500"
                      : current
                        ? "bg-primary"
                        : "bg-muted"
                }`}
              />
              <p
                className={`mt-1.5 flex items-center gap-1 text-[10px] uppercase tracking-wider ${
                  current
                    ? "font-semibold text-primary"
                    : done
                      ? "text-emerald-500"
                      : review && i >= active
                        ? "text-destructive"
                        : "text-muted-foreground"
                }`}
              >
                {done && <Check className="size-3" />}
                {label}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
