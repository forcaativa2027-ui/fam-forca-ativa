"use client";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { lookupCep, maskCep } from "@/services/pipeline";
import { Field, NavButtons } from "./RegisterWizardHelpers";
import type { RegisterState, UpdateFn } from "./RegisterWizardTypes";

// ============================================================
// ETAPA 5 — Localização (país + CEP com autocomplete)
// ============================================================
export function StepLocalizacao({ s, update, onBack, onNext }: { s: RegisterState; update: UpdateFn; onBack: () => void; onNext: () => void }) {
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState("");

  async function searchCep() {
    setBusy(true); setInfo("");
    const data = await lookupCep(s.cep);
    setBusy(false);
    if (!data) { setInfo("CEP não encontrado"); return; }
    update("state", data.uf ?? "");
    update("city", data.localidade ?? "");
    update("address", data.logradouro ?? "");
    update("neighborhood", data.bairro ?? "");
    setInfo("Endereço preenchido — você pode ajustar se quiser.");
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-2xl font-bold text-navy">Onde você mora?</h2>
        <p className="text-base text-muted">Pra encontrarmos a igreja mais próxima de você</p>
      </div>

      <Field label="País">
        <Input className="h-12 text-base" value={s.country} onChange={(e) => update("country", e.target.value)} placeholder="Brasil" />
      </Field>

      <Field label="CEP">
        <div className="flex gap-2">
          <Input className="h-12 text-base" value={s.cep} onChange={(e) => update("cep", maskCep(e.target.value))}
            placeholder="00000-000" inputMode="numeric" />
          <Button type="button" onClick={searchCep} disabled={busy} variant="outline" className="h-12 whitespace-nowrap rounded-xl px-5 text-base shadow-sm transition active:scale-95">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
          </Button>
        </div>
        {info && <p className="mt-1 text-xs text-gold">{info}</p>}
      </Field>

      <Field label="Endereço">
        <Input className="h-12 text-base" value={s.address} onChange={(e) => update("address", e.target.value)} placeholder="Rua, avenida..." />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Número (opcional)">
          <Input className="h-12 text-base" value={s.number} onChange={(e) => update("number", e.target.value)} placeholder="123" inputMode="numeric" />
        </Field>
        <Field label="Complemento (opcional)">
          <Input className="h-12 text-base" value={s.complemento} onChange={(e) => update("complemento", e.target.value)} placeholder="Apto, bloco, casa..." />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Bairro"><Input className="h-12 text-base" value={s.neighborhood} onChange={(e) => update("neighborhood", e.target.value)} /></Field>
        <Field label="Cidade"><Input className="h-12 text-base" value={s.city} onChange={(e) => update("city", e.target.value)} placeholder="Manaus" /></Field>
      </div>
      <Field label="Estado"><Input className="h-12 text-base" value={s.state} onChange={(e) => update("state", e.target.value.toUpperCase().slice(0,2))} placeholder="AM" /></Field>

      <NavButtons onBack={onBack} onNext={onNext} />
    </div>
  );
}
