"use client";
import { Progress } from "@/components/ui/progress";

/** Servo360 Shared — promovido da Academy (ACA-UX-001 §40). Barra de progresso com percentual. */
export function ProgressIndicator({ value, label }: { value: number; label?: string }) {
  const pct = Math.round(Math.min(100, Math.max(0, value)));
  return (
    <div className="space-y-1">
      <Progress value={pct} />
      <p className="text-right text-[11px] font-semibold text-muted-foreground">{label ?? `${pct}%`}</p>
    </div>
  );
}
