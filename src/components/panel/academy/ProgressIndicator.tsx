"use client";
import { Progress } from "@/components/ui/progress";

/** ACA-UX-001 Fase C — barra de progresso com percentual, padrão em todos os cards. */
export function ProgressIndicator({ value, label }: { value: number; label?: string }) {
  const pct = Math.round(Math.min(100, Math.max(0, value)));
  return (
    <div className="space-y-1">
      <Progress value={pct} />
      <p className="text-right text-[11px] font-semibold text-muted-foreground">{label ?? `${pct}%`}</p>
    </div>
  );
}
