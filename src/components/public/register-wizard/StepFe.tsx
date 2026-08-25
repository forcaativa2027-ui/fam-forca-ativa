"use client";
import { Droplets, Flame } from "lucide-react";
import { DatePicker } from "@/components/shared/DatePicker";
import { Input } from "@/components/ui/input";
import { Field, NavButtons, YesNoIcon } from "./RegisterWizardHelpers";
import type { RegisterState, UpdateFn } from "./RegisterWizardTypes";

// ============================================================
// ETAPA 7 — História de fé (batismo, última igreja, Espírito Santo)
// ============================================================
export function StepFe({ s, update, onBack, onNext }: { s: RegisterState; update: UpdateFn; onBack: () => void; onNext: () => void }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-2xl font-bold text-navy">Sua história de fé</h2>
        <p className="text-base text-muted">Isso nos ajuda a te acompanhar melhor — seja você novo ou antigo na fé</p>
      </div>

      <Field label="Você já foi batizado(a) nas águas?">
        <YesNoIcon value={s.baptized} onChange={(v) => update("baptized", v)} icon={<Droplets className="h-7 w-7" />} />
      </Field>
      {s.baptized && (
        <Field label="Data do batismo"><DatePicker value={s.baptism_date} onChange={(v) => update("baptism_date", v)} placeholder="Data do batismo" disableFuture /></Field>
      )}

      <Field label="Qual foi a última igreja que você frequentou? (opcional)">
        <Input className="h-12 text-base" value={s.last_church} onChange={(e) => update("last_church", e.target.value)} placeholder="Nome da igreja" />
      </Field>

      <Field label="Você já foi batizado(a) no Espírito Santo?">
        <YesNoIcon value={s.holy_spirit_baptized} onChange={(v) => update("holy_spirit_baptized", v)} icon={<Flame className="h-7 w-7" />} />
      </Field>
      {s.holy_spirit_baptized && (
        <Field label="Data do batismo no Espírito Santo"><DatePicker value={s.holy_spirit_baptism_date} onChange={(v) => update("holy_spirit_baptism_date", v)} placeholder="Data do batismo no Espírito Santo" disableFuture /></Field>
      )}

      <NavButtons onBack={onBack} onNext={onNext} />
    </div>
  );
}
