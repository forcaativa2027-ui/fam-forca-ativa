"use client";
import type { LucideIcon } from "lucide-react";

export interface BibleToolViewModel {
  id: string;
  label: string;
  icon: LucideIcon;
  available: boolean;    // §17 — ferramenta ainda não operacional não aparece como funcional
}

/**
 * ACA-UX-001 Fase C — ferramenta de estudo compacta (Favoritos,
 * Anotações, Mapas, Léxico, Comparar, Histórico — §17). Se
 * available=false, o item simplesmente não é renderizado pelo
 * chamador — este componente não decide isso sozinho, só exibe.
 */
export function BibleToolCard({ vm, onClick }: { vm: BibleToolViewModel; onClick: () => void }) {
  const Icon = vm.icon;
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 rounded-xl border bg-card p-3 text-center transition hover:border-gold/50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
    >
      <span className="icon-tile-sm bg-navy/10 text-navy" aria-hidden="true"><Icon className="h-4 w-4" /></span>
      <span className="text-xs font-semibold text-navy">{vm.label}</span>
    </button>
  );
}

export interface BibleCategoryViewModel {
  id: string;
  title: string;
  icon: LucideIcon;
  bookCount: number;
}

/** ACA-UX-001 Fase C — categoria bíblica (Pentateuco, Evangelhos, etc. — §19/§20). */
export function BibleCategoryCard({ vm, onClick }: { vm: BibleCategoryViewModel; onClick: () => void }) {
  const Icon = vm.icon;
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 rounded-xl border bg-card p-3 text-left transition hover:border-gold/50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
    >
      <span className="icon-tile-sm bg-gold/10 text-gold" aria-hidden="true"><Icon className="h-4 w-4" /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-navy">{vm.title}</span>
        <span className="text-[11px] text-muted-foreground">{vm.bookCount} {vm.bookCount === 1 ? "livro" : "livros"}</span>
      </span>
    </button>
  );
}
