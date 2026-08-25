"use client";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";

export interface FeatureCardViewModel {
  id: string;
  title: string;
  description?: string;
  icon: LucideIcon;
  actionLabel?: string;
  tone?: "gold" | "navy";
}

/**
 * ACA-UX-001 Fase C — card de funcionalidade (usado em "Explorar":
 * Exploração Bíblica, Bíblia Integrada — §11). Semântica de botão,
 * não div onClick (§26).
 */
export function FeatureCard({ vm, onClick }: { vm: FeatureCardViewModel; onClick: () => void }) {
  const Icon = vm.icon;
  const tone = vm.tone ?? "gold";
  const tileClass = tone === "gold" ? "bg-gold/10 text-gold" : "bg-navy/10 text-navy";
  const borderClass = tone === "gold" ? "border-gold/40 hover:border-gold/60" : "border-navy/20 hover:border-navy/40";

  return (
    <button
      onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-xl border-2 ${borderClass} bg-card p-4 text-left transition hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold`}
    >
      <span className={`icon-tile-md ${tileClass}`} aria-hidden="true"><Icon className="h-5 w-5" /></span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-base text-navy">{vm.title}</span>
        {vm.description && <span className="mt-0.5 block text-xs text-muted-foreground">{vm.description}</span>}
      </span>
      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </button>
  );
}
