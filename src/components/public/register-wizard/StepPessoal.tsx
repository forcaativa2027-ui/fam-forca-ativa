"use client";
import { useState } from "react";
import { Check } from "lucide-react";
import { DatePicker } from "@/components/shared/DatePicker";
import { Field, NavButtons } from "./RegisterWizardHelpers";
import type { RegisterState, UpdateFn } from "./RegisterWizardTypes";

// ============================================================
// ETAPA 4 — Dados pessoais (estado civil, nascimento/idade, sexo)
// ============================================================
export function StepPessoal({ s, update, onBack, onNext }: { s: RegisterState; update: UpdateFn; onBack: () => void; onNext: () => void }) {
  const [err, setErr] = useState("");
  const MARITAL = [
    { label: "Solteiro(a)", icon: "🙂" }, { label: "Casado(a)", icon: "💍" },
    { label: "Divorciado(a)", icon: "💔" }, { label: "Viúvo(a)", icon: "🕊️" },
    { label: "União estável", icon: "❤️" },
  ];

  const age = (() => {
    if (!s.birth_date) return null;
    const b = new Date(s.birth_date);
    if (isNaN(b.getTime())) return null;
    const today = new Date();
    let a = today.getFullYear() - b.getFullYear();
    const m = today.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < b.getDate())) a--;
    return a;
  })();

  function next() {
    if (!s.gender) { setErr("Selecione uma opção"); return; }
    setErr("");
    onNext();
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-2xl font-bold text-navy">Um pouco mais sobre você</h2>
      </div>

      <Field label="Estado civil">
        <div className="grid grid-cols-2 gap-2">
          {MARITAL.map((m) => (
            <button key={m.label} type="button" onClick={() => update("marital_status", m.label)}
              className={`flex items-center gap-2.5 rounded-xl border-2 p-3.5 text-left text-base transition hover:scale-[1.01] hover:shadow-sm ${s.marital_status === m.label ? "border-gold bg-gold/10 font-bold text-navy shadow-md" : "border-border bg-card text-ink hover:border-navy/30"}`}>
              <span className="text-xl">{m.icon}</span>{m.label}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Data de nascimento">
        <DatePicker value={s.birth_date} onChange={(v) => update("birth_date", v)} placeholder="Data de nascimento" disableFuture />
        {age !== null && <p className="mt-1 text-sm font-semibold text-gold">Idade: {age} anos</p>}
      </Field>

      <Field label="Sexo" error={err}>
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => update("gender", "masculino")}
            className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition hover:scale-[1.02] hover:shadow-sm ${s.gender === "masculino" ? "border-blue-500 bg-blue-500/10 shadow-md" : "border-border bg-card hover:border-blue-300"}`}>
            <div className={`relative grid aspect-square w-full max-w-[140px] place-items-center overflow-hidden rounded-2xl transition ${s.gender === "masculino" ? "ring-4 ring-blue-500" : "ring-2 ring-blue-100"}`}>
              <img src="/images/avatar-masculino.png" alt="Masculino" className="h-full w-full object-cover" />
              {s.gender === "masculino" && (
                <span className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-blue-500 text-white shadow">
                  <Check className="h-4 w-4" strokeWidth={3} />
                </span>
              )}
            </div>
            <b className="text-base text-navy">Masculino</b>
          </button>
          <button type="button" onClick={() => update("gender", "feminino")}
            className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition hover:scale-[1.02] hover:shadow-sm ${s.gender === "feminino" ? "border-pink-500 bg-pink-500/10 shadow-md" : "border-border bg-card hover:border-pink-300"}`}>
            <div className={`relative grid aspect-square w-full max-w-[140px] place-items-center overflow-hidden rounded-2xl transition ${s.gender === "feminino" ? "ring-4 ring-pink-500" : "ring-2 ring-pink-100"}`}>
              <img src="/images/avatar-feminino.png" alt="Feminino" className="h-full w-full object-cover" />
              {s.gender === "feminino" && (
                <span className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-pink-500 text-white shadow">
                  <Check className="h-4 w-4" strokeWidth={3} />
                </span>
              )}
            </div>
            <b className="text-base text-navy">Feminino</b>
          </button>
        </div>
      </Field>

      <NavButtons onBack={onBack} onNext={next} />
    </div>
  );
}
