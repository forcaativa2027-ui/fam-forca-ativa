"use client";
import { useState } from "react";
import { HeartHandshake } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

const QUESTIONS = [
  "O que este texto me ensina?",
  "O que chamou minha atenção?",
  "O que devo colocar em prática?",
  "Há algo pelo qual devo orar?",
] as const;

/**
 * CEC Academy — Bíblia Integrada, Modo Devocional. Nenhuma
 * resposta é criada automaticamente — o registro no Diário só
 * acontece quando o membro clica explicitamente.
 * ACA-BIB-01 §14 / ACA-BIB-04 §24.
 */
export function BibleDevotionalPanel({ reference, busy, onRegister }: {
  reference: string; busy: boolean;
  onRegister: (answers: Record<string, string>) => void;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const hasAnyAnswer = Object.values(answers).some((v) => v.trim());

  return (
    <Card className="border-2 border-gold/30 bg-gold/5">
      <CardContent className="space-y-3 pt-4">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gold">
          <HeartHandshake className="h-3.5 w-3.5" />Devocional — {reference}
        </p>
        {QUESTIONS.map((q) => (
          <div key={q}>
            <label className="mb-1 block text-sm font-semibold text-navy">{q}</label>
            <Textarea rows={2} value={answers[q] ?? ""} onChange={(e) => setAnswers((prev) => ({ ...prev, [q]: e.target.value }))} />
          </div>
        ))}
        <button onClick={() => onRegister(answers)} disabled={busy || !hasAnyAnswer}
          className="w-full rounded-md bg-navy py-2 text-sm font-bold text-white disabled:opacity-40">
          {busy ? "Registrando…" : "Registrar no Diário"}
        </button>
      </CardContent>
    </Card>
  );
}
