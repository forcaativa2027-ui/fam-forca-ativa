"use client";
import { Check } from "lucide-react";
import { NavButtons } from "./RegisterWizardHelpers";
import { INTENT_LABELS, type RegisterState, type UpdateFn } from "./RegisterWizardTypes";
import type { PipelineIntent } from "@/types/domain";

// ============================================================
// ETAPA 9 — Como podemos te servir (intenção)
// ============================================================
export function StepIntencao({ s, update, onBack, onNext }: { s: RegisterState; update: UpdateFn; onBack: () => void; onNext: () => void }) {
  const intents: PipelineIntent[] = ["lifegroup","discipulado","acompanhamento_pastoral","visita","conhecer","batismo","servir","outro"];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-2xl font-bold text-navy">Como podemos te servir?</h2>
        <p className="text-base text-muted">Escolha o que melhor descreve seu desejo agora</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {intents.map((k) => {
          const cfg = INTENT_LABELS[k];
          const Ico = cfg.icon;
          const selected = s.intent === k;
          return (
            <button key={k} type="button" onClick={() => update("intent", k)}
              className={`relative flex items-start gap-3 rounded-xl border-2 p-4 text-left transition hover:scale-[1.01] ${selected ? "border-gold bg-gold/10 shadow-md" : "border-border bg-card hover:border-gold/40"}`}>
              {selected && (
                <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-gold text-navy">
                  <Check className="h-4 w-4" strokeWidth={3} />
                </span>
              )}
              <Ico className={`h-6 w-6 shrink-0 ${selected ? "text-gold" : "text-muted"}`} />
              <div>
                <b className="text-base text-navy">{cfg.label}</b>
                <p className="text-base text-muted">{cfg.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      <NavButtons onBack={onBack} onNext={onNext} />
    </div>
  );
}
