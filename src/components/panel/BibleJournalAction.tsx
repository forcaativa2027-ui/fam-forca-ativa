"use client";
import { useState } from "react";
import { X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { JournalEntryType } from "@/types/domain";

const TYPE_OPTIONS: { value: JournalEntryType; label: string }[] = [
  { value: "reflexao", label: "Reflexão" },
  { value: "oracao", label: "Oração" },
  { value: "aprendizado", label: "Aprendizado" },
  { value: "duvida", label: "Dúvida" },
  { value: "versiculo", label: "Aplicação" },
];

/**
 * CEC Academy — Bíblia Integrada. Envia a referência + reflexão
 * pro Diário de Formação já existente — não cria um Diário novo.
 * ACA-BIB-04 §19.
 */
export function BibleJournalAction({ reference, verseText, onClose, onSave }: {
  reference: string; verseText: string; onClose: () => void;
  onSave: (entryType: JournalEntryType, reflection: string) => Promise<void>;
}) {
  const [entryType, setEntryType] = useState<JournalEntryType>("reflexao");
  const [reflection, setReflection] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try { await onSave(entryType, reflection); onClose(); } finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <Card className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <CardContent className="space-y-3 pt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-navy">Adicionar ao Diário</p>
            <button onClick={onClose}><X className="h-4 w-4 text-muted-foreground" /></button>
          </div>
          <div className="rounded-md bg-gold/10 px-2.5 py-2">
            <p className="text-xs font-semibold text-gold">{reference}</p>
            <p className="mt-0.5 text-sm italic text-ink">"{verseText}"</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {TYPE_OPTIONS.map((t) => (
              <button key={t.value} onClick={() => setEntryType(t.value)}
                className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${entryType === t.value ? "border-gold bg-gold/10 text-navy" : "text-muted-foreground"}`}>
                {t.label}
              </button>
            ))}
          </div>
          <Textarea value={reflection} onChange={(e) => setReflection(e.target.value)} rows={4} placeholder="Sua reflexão (opcional)…" />
          <button onClick={save} disabled={busy} className="w-full rounded-md bg-navy py-2 text-sm font-bold text-white disabled:opacity-60">
            {busy ? "Salvando…" : "Salvar no Diário"}
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
