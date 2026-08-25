"use client";
import { MessageCircle, Phone as PhoneIcon } from "lucide-react";
import { NavButtons } from "./RegisterWizardHelpers";
import type { RegisterState, UpdateFn } from "./RegisterWizardTypes";

// ============================================================
// ETAPA 3 — Verificação (WhatsApp ou SMS — escolha do usuário)
// ============================================================
export function StepVerificacao({ s, update, onBack, onNext }: { s: RegisterState; update: UpdateFn; onBack: () => void; onNext: () => void }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-2xl font-bold text-navy">Como prefere validar seu número?</h2>
        <p className="text-base text-muted">Enviamos um código de confirmação pra {s.phone || "seu telefone"}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => update("verify_method", "whatsapp")}
          className={`flex flex-col items-center gap-2 rounded-xl border-2 p-5 transition ${s.verify_method === "whatsapp" ? "border-gold bg-gold/5" : "border-border bg-card hover:border-navy/30"}`}>
          <MessageCircle className={`h-7 w-7 ${s.verify_method === "whatsapp" ? "text-green-600" : "text-muted"}`} />
          <b className="text-sm text-navy">WhatsApp</b>
        </button>
        <button type="button" onClick={() => update("verify_method", "sms")}
          className={`flex flex-col items-center gap-2 rounded-xl border-2 p-5 transition ${s.verify_method === "sms" ? "border-gold bg-gold/5" : "border-border bg-card hover:border-navy/30"}`}>
          <PhoneIcon className={`h-7 w-7 ${s.verify_method === "sms" ? "text-navy" : "text-muted"}`} />
          <b className="text-sm text-navy">SMS</b>
        </button>
      </div>

      <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800">
        A verificação automática por {s.verify_method === "whatsapp" ? "WhatsApp" : "SMS"} ainda está sendo configurada pela nossa equipe.
        Por enquanto, sua conta é confirmada pelo e-mail — pode continuar o cadastro normalmente.
      </div>

      <NavButtons onBack={onBack} onNext={onNext} />
    </div>
  );
}
