"use client";
import { BookOpen, GraduationCap, HeartHandshake } from "lucide-react";
import type { BibleReadingMode } from "@/types/domain";

const MODES: { value: BibleReadingMode; label: string; icon: typeof BookOpen; hint: string }[] = [
  { value: "reading", label: "Leitura", icon: BookOpen, hint: "Máxima concentração no texto" },
  { value: "study", label: "Estudo", icon: GraduationCap, hint: "Destaques, anotações, salvos e Diário" },
  { value: "devotional", label: "Devocional", icon: HeartHandshake, hint: "Perguntas pra reflexão pessoal" },
];

/**
 * CEC Academy — Bíblia Integrada. Alterna entre os 3 modos de
 * uso. ACA-BIB-01 §14 / ACA-BIB-04 §25.
 */
export function BibleModeSelector({ mode, onChange }: { mode: BibleReadingMode; onChange: (m: BibleReadingMode) => void }) {
  return (
    <div className="flex gap-1 rounded-lg border bg-muted/20 p-1">
      {MODES.map((m) => {
        const Icon = m.icon;
        const active = mode === m.value;
        return (
          <button key={m.value} onClick={() => onChange(m.value)} title={m.hint}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold transition ${active ? "bg-card text-navy shadow-sm" : "text-muted-foreground hover:text-navy"}`}>
            <Icon className="h-3.5 w-3.5" />{m.label}
          </button>
        );
      })}
    </div>
  );
}
