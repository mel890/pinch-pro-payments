import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { RotateCcw, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { journey } from "@/lib/journey-store";

/**
 * Prominent "Restart demo" control for live recordings: clears local demo
 * state and returns to step 1 without a page refresh.
 */
export function RestartDemoButton() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<"idle" | "confirm" | "done">("idle");

  useEffect(() => {
    if (phase === "idle") return;
    const ms = phase === "confirm" ? 4000 : 1600;
    const t = setTimeout(() => setPhase("idle"), ms);
    return () => clearTimeout(t);
  }, [phase]);

  const onClick = () => {
    if (phase !== "confirm") {
      setPhase("confirm");
      return;
    }
    journey.reset();
    setPhase("done");
    navigate({ to: "/" });
  };

  return (
    <Button
      type="button"
      size="sm"
      variant={phase === "confirm" ? "default" : "outline"}
      onClick={onClick}
      aria-label="Restart demo from step 1"
      className="h-9 gap-2 rounded-xl font-medium"
    >
      {phase === "done" ? (
        <Check className="size-4" strokeWidth={2} />
      ) : (
        <RotateCcw className="size-4" strokeWidth={2} />
      )}
      <span className="hidden sm:inline">
        {phase === "confirm"
          ? "Confirm restart"
          : phase === "done"
            ? "Back at step 1"
            : "Restart demo"}
      </span>
      <span className="sm:hidden">
        {phase === "confirm" ? "Confirm" : "Restart"}
      </span>
    </Button>
  );
}
