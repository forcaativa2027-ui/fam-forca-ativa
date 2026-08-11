"use client";
import type { ReactNode } from "react";

/**
 * Servo360 Shared — promovido da Academy (ACA-UX-001 §40): semântica
 * genérica, sem regra de negócio de nenhum módulo específico, suporta
 * CT-017 e Light/Dark, interface estável. Disponível pra qualquer área
 * da plataforma (Público, Membro, Admin, Academy, Kids…).
 */

/** Cabeçalho de seção, usado antes de cada bloco (CONTINUE SUA JORNADA, EXPLORAR, etc.) */
export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{title}</p>
      {action}
    </div>
  );
}

export type StatusTone = "neutral" | "success" | "warning" | "info" | "gold";
const TONE_CLASS: Record<StatusTone, string> = {
  neutral: "bg-navy/10 text-navy",
  success: "bg-green-100 text-green-700",
  warning: "bg-amber-100 text-amber-700",
  info: "bg-blue-100 text-blue-700",
  gold: "bg-gold/15 text-navy",
};

/** Selo compacto de estado/contagem — substitui os spans ad-hoc espalhados pelas telas. */
export function StatusBadge({ children, tone = "neutral" }: { children: ReactNode; tone?: StatusTone }) {
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ${TONE_CLASS[tone]}`}>{children}</span>;
}
