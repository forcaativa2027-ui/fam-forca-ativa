"use client";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "./RegisterWizardHelpers";
import { EMAIL_DOMAINS, maskCpf, type RegisterState, type UpdateFn } from "./RegisterWizardTypes";
import { maskPhone } from "@/services/pipeline";

// ============================================================
// ETAPA 1 — Conta (nome, CPF, e-mail com autocomplete, telefone)
// ============================================================
export function StepConta({ s, update, onNext }: { s: RegisterState; update: UpdateFn; onNext: () => void }) {
  const [err, setErr] = useState<Record<string,string>>({});
  const [showDomains, setShowDomains] = useState(false);

  function next() {
    const errs: Record<string,string> = {};
    if (s.full_name.trim().length < 3) errs.full_name = "Nome muito curto";
    const cleanPhone = s.phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) errs.phone = "Telefone incompleto";
    if (!s.email || !/^\S+@\S+\.\S+$/.test(s.email)) errs.email = "E-mail inválido";
    setErr(errs);
    if (Object.keys(errs).length === 0) onNext();
  }

  const atIndex = s.email.indexOf("@");
  const emailPrefix = atIndex >= 0 ? s.email.slice(0, atIndex) : s.email;
  const domainTyped = atIndex >= 0 ? s.email.slice(atIndex + 1) : "";
  const domainSuggestions = atIndex >= 0
    ? EMAIL_DOMAINS.filter((d) => d.startsWith(domainTyped)).slice(0, 4)
    : [];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-2xl font-bold text-navy">Vamos começar</h2>
        <p className="text-base text-muted">Conta um pouco sobre você</p>
      </div>

      <Field label="Nome completo" error={err.full_name}>
        <Input className="h-12 text-base" value={s.full_name} onChange={(e) => update("full_name", e.target.value)} placeholder="Maria Silva" autoFocus />
      </Field>

      <Field label="CPF (opcional)">
        <Input className="h-12 text-base" value={s.cpf} onChange={(e) => update("cpf", maskCpf(e.target.value))} placeholder="000.000.000-00" inputMode="numeric" />
      </Field>

      <div className="relative">
        <Field label="E-mail" error={err.email}>
          <Input className="h-12 text-base"
            value={s.email} type="text"
            onChange={(e) => { update("email", e.target.value); setShowDomains(e.target.value.includes("@")); }}
            onFocus={() => setShowDomains(s.email.includes("@"))}
            onBlur={() => setTimeout(() => setShowDomains(false), 150)}
            placeholder="seu@email.com"
          />
        </Field>
        {showDomains && domainSuggestions.length > 0 && (
          <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border bg-card shadow-lg">
            {domainSuggestions.map((d) => (
              <button key={d} type="button"
                onMouseDown={() => { update("email", `${emailPrefix}@${d}`); setShowDomains(false); }}
                className="block w-full px-3 py-2 text-left text-sm text-ink hover:bg-muted/40">
                {emailPrefix}@<b>{d}</b>
              </button>
            ))}
          </div>
        )}
      </div>

      <Field label="Telefone / WhatsApp" error={err.phone}>
        <Input className="h-12 text-base" value={s.phone} onChange={(e) => update("phone", maskPhone(e.target.value))} placeholder="(00) 00000-0000" inputMode="tel" />
      </Field>

      <div className="flex justify-end">
        <Button onClick={next} className="h-12 gap-2 rounded-xl text-base shadow-md transition hover:shadow-lg active:scale-95">Continuar <ArrowRight className="h-5 w-5" /></Button>
      </div>
    </div>
  );
}
