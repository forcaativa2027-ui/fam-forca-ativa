"use client";
import type { ReactNode } from "react";

/** ACA-UX-001 Fase C — cabeçalho da Academy Home (§34). */
export function AcademyHeader({ tagline }: { tagline?: string }) {
  return (
    <div>
      <h1 className="font-display text-2xl text-navy">Academy</h1>
      <p className="text-sm text-muted-foreground">{tagline ?? "Cresça no conhecimento. Aprofunde sua fé."}</p>
    </div>
  );
}

/** ACA-UX-001 Fase C — cabeçalho da Bíblia Integrada (§35). */
export function BibleHeader({ tagline, action }: { tagline?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div>
        <h1 className="font-display text-2xl text-navy">Bíblia Integrada</h1>
        <p className="text-sm text-muted-foreground">{tagline ?? "Leia, pesquise, compare e aprofunde-se."}</p>
      </div>
      {action}
    </div>
  );
}

/** ACA-UX-001 Fase C — chip de item recente (§18: "João 3", "Salmos 23"...). */
export function RecentPassageChip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-full border bg-card px-3 py-1.5 text-xs font-semibold text-navy transition hover:border-gold/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
    >
      {label}
    </button>
  );
}
