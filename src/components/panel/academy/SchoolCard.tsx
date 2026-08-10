"use client";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";

export interface SchoolCardViewModel {
  id: string;
  title: string;
  description?: string;
  icon: LucideIcon;
  courseCount?: number;
  lessonCount?: number;
}

/**
 * ACA-UX-001 Fase C — card de Escola/Trilha (§12). Não mostra "0"
 * como informação principal — some a contagem quando vazia (§12).
 */
export function SchoolCard({ vm, onClick }: { vm: SchoolCardViewModel; onClick: () => void }) {
  const Icon = vm.icon;
  const hasCounts = (vm.courseCount ?? 0) > 0;

  return (
    <button
      onClick={onClick}
      className="flex h-full w-full flex-col items-start gap-2 rounded-xl border bg-card p-4 text-left transition hover:border-gold/50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
    >
      <span className="icon-tile-md bg-gold/10 text-gold" aria-hidden="true"><Icon className="h-5 w-5" /></span>
      <span className="font-display text-base text-navy">{vm.title}</span>
      {vm.description && <span className="text-xs text-muted-foreground">{vm.description}</span>}
      <span className="mt-auto flex w-full items-center justify-between pt-2">
        {hasCounts ? (
          <span className="text-[11px] font-semibold text-muted-foreground">
            {vm.courseCount} {vm.courseCount === 1 ? "curso" : "cursos"}
            {vm.lessonCount ? ` • ${vm.lessonCount} aulas` : ""}
          </span>
        ) : <span />}
        <span className="flex items-center gap-1 text-xs font-bold text-gold">Explorar <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></span>
      </span>
    </button>
  );
}
