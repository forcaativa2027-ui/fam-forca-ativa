"use client";
import { ArrowRight } from "lucide-react";
import { ProgressIndicator } from "./ProgressIndicator";

export interface ContinueCardViewModel {
  title: string;
  subtitle?: string;
  progress?: number;      // 0-100, se aplicável
  actionLabel: string;
}

/**
 * ACA-UX-001 Fase C — "Continue sua jornada" / "Continue sua
 * leitura" (§10/§16). Sem progresso em andamento, NÃO renderiza um
 * card vazio — o chamador decide o CTA real de início nesse caso.
 */
export function ContinueCard({ vm, onClick }: { vm: ContinueCardViewModel; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full flex-col gap-2 rounded-xl border-2 border-gold/50 bg-gold/5 p-4 text-left transition hover:border-gold/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
    >
      <span className="font-display text-lg text-navy">{vm.title}</span>
      {vm.subtitle && <span className="text-xs text-muted-foreground">{vm.subtitle}</span>}
      {vm.progress !== undefined && <ProgressIndicator value={vm.progress} />}
      <span className="flex items-center gap-1 self-end text-sm font-bold text-gold">
        {vm.actionLabel} <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </span>
    </button>
  );
}

/** Variante pro estado "nada em andamento ainda" — CTA de início, não um card vazio disfarçado. */
export function StartCard({ title, actionLabel, onClick }: { title: string; actionLabel: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-xl border-2 border-dashed border-gold/40 bg-card p-4 text-left transition hover:border-gold/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
    >
      <span className="text-sm font-semibold text-navy">{title}</span>
      <span className="flex items-center gap-1 text-sm font-bold text-gold">
        {actionLabel} <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </span>
    </button>
  );
}
