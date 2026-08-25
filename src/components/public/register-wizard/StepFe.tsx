"use client";
import { Droplets, Flame } from "lucide-react";
import { DatePicker } from "@/components/shared/DatePicker";
import { Input } from "@/components/ui/input";
import { Field, NavButtons, YesNoIcon } from "./RegisterWizardHelpers";
import type { RegisterState, UpdateFn } from "./RegisterWizardTypes";

// ============================================================
// ETAPA 7 — Experiências e interesses sociais
// ============================================================
export function StepFe({ s, update, onBack, onNext }: { s: RegisterState; update: UpdateFn; onBack: () => void; onNext: () => void }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-2xl font-bold text-navy">Suas experiências e interesses</h2>
        <p className="text-base text-muted">Essas informações ajudam a FAM a apresentar oportunidades adequadas para você</p>
      </div>

      <Field label="Você já participou de algum projeto social ou voluntariado?">
        <YesNoIcon value={s.baptized} onChange={(v) => update("baptized", v)} icon={<Droplets className="h-7 w-7" />} />
      </Field>
      {s.baptized && (
        <Field label="Quando foi sua última participação?"><DatePicker value={s.baptism_date} onChange={(v) => update("baptism_date", v)} placeholder="Data da última participação" disableFuture /></Field>
      )}

      <Field label="Em qual organização, projeto ou iniciativa você já atuou? (opcional)">
        <Input className="h-12 text-base" value={s.last_church} onChange={(e) => update("last_church", e.target.value)} placeholder="Nome da organização ou projeto" />
      </Field>

      <Field label="Você já participou de alguma formação sobre proteção, acolhimento ou atuação social?">
        <YesNoIcon value={s.holy_spirit_baptized} onChange={(v) => update("holy_spirit_baptized", v)} icon={<Flame className="h-7 w-7" />} />
      </Field>
      {s.holy_spirit_baptized && (
        <Field label="Quando foi essa formação?"><DatePicker value={s.holy_spirit_baptism_date} onChange={(v) => update("holy_spirit_baptism_date", v)} placeholder="Data da formação" disableFuture /></Field>
      )}

      <NavButtons onBack={onBack} onNext={onNext} />
    </div>
  );
}
