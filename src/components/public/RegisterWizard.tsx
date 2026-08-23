"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DarkBlueTheme } from "@/components/shared/DarkBlueTheme";
import { useChurches, useActiveCommunity, useCells } from "@/hooks/use-queries";
import type { PipelineIntent } from "@/types/domain";

import { INITIAL_STATE, TOTAL_STEPS, BASICO_STEP, type RegisterState } from "./register-wizard/RegisterWizardTypes";
import { FinishedScreen } from "./register-wizard/RegisterWizardHelpers";
import { StepConta } from "./register-wizard/StepConta";
import { StepTipoCadastro } from "./register-wizard/StepTipoCadastro";
import { StepFinalizacaoBasica } from "./register-wizard/StepFinalizacaoBasica";
import { StepVerificacao } from "./register-wizard/StepVerificacao";
import { StepPessoal } from "./register-wizard/StepPessoal";
import { StepLocalizacao } from "./register-wizard/StepLocalizacao";
import { StepComunidade } from "./register-wizard/StepComunidade";
import { StepFe } from "./register-wizard/StepFe";
import { StepJornada } from "./register-wizard/StepJornada";
import { StepIntencao } from "./register-wizard/StepIntencao";
import { StepFinalizacao } from "./register-wizard/StepFinalizacao";

export default function RegisterWizard() {
  const params = useSearchParams();
  const initialIntent = (params.get("intent") as PipelineIntent | null) ?? "conhecer";
  const { data: churches = [] } = useChurches();
  const { data: cells = [] } = useCells();
  const { data: activeCommunity } = useActiveCommunity();
  const [s, setS] = useState<RegisterState>({ ...INITIAL_STATE, intent: initialIntent });
  const [done, setDone] = useState(false);
  const [globalErr, setGlobalErr] = useState("");

  useEffect(() => {
    if (activeCommunity?.id && !s.community_id) {
      setS((prev) => ({ ...prev, community_id: activeCommunity.id }));
    }
  }, [activeCommunity?.id, s.community_id]);

  function update<K extends keyof RegisterState>(k: K, v: RegisterState[K]) {
    setS((prev) => ({ ...prev, [k]: v }));
  }
  function goTo(step: number) { setS((prev) => ({ ...prev, step })); }

  if (done) return <FinishedScreen hasLg={!!s.life_group_id} />;

  return (
    <DarkBlueTheme className="p-4">
      <div className="mx-auto max-w-xl py-8">
        <Link href="/" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Voltar à página inicial
        </Link>

        <Card className="overflow-hidden">
          <div className="border-b border-white/10 bg-white/5 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <img src="/brand/fam-logo.jpg" alt="Instituto FAM — Força Ativa da Mulher" className="h-6 w-6 object-contain" />
                <b className="font-display text-base">Cadastro FAM</b>
              </div>
              {s.step !== BASICO_STEP && (
                <span className="text-xs font-bold uppercase tracking-wider text-white/60">Etapa {s.step} de {TOTAL_STEPS}</span>
              )}
            </div>
            <div className="mt-3 flex gap-1">
              {Array.from({ length: s.step === BASICO_STEP ? 2 : TOTAL_STEPS }).map((_, i) => (
                <div key={i} className={`h-1 flex-1 rounded-full ${s.step === BASICO_STEP ? "bg-gold" : i < s.step ? "bg-gold" : "bg-border"}`} />
              ))}
            </div>
          </div>

          <CardContent className="p-6">
            {globalErr && <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{globalErr}</p>}

            {s.step === 1 && <StepConta s={s} update={update} onNext={() => goTo(2)} />}
            {s.step === 2 && (
              <StepTipoCadastro
                s={s} update={update}
                onBack={() => goTo(1)}
                onBasico={() => { update("flow", "basico"); goTo(BASICO_STEP); }}
                onCompleto={() => { update("flow", "completo"); goTo(3); }}
              />
            )}
            {s.step === 3 && <StepVerificacao s={s} update={update} onBack={() => goTo(2)} onNext={() => goTo(4)} />}
            {s.step === 4 && <StepPessoal s={s} update={update} onBack={() => goTo(3)} onNext={() => goTo(5)} />}
            {s.step === 5 && <StepLocalizacao s={s} update={update} onBack={() => goTo(4)} onNext={() => goTo(6)} />}
            {s.step === 6 && <StepComunidade s={s} update={update} churches={churches} cells={cells} onBack={() => goTo(5)} onNext={() => goTo(7)} />}
            {s.step === 7 && <StepFe s={s} update={update} onBack={() => goTo(6)} onNext={() => goTo(8)} />}
            {s.step === 8 && <StepJornada s={s} update={update} onBack={() => goTo(7)} onNext={() => goTo(9)} />}
            {s.step === 9 && <StepIntencao s={s} update={update} onBack={() => goTo(8)} onNext={() => goTo(10)} />}
            {s.step === 10 && <StepFinalizacao s={s} update={update} onBack={() => goTo(9)} onDone={() => setDone(true)} setGlobalErr={setGlobalErr} />}
            {s.step === BASICO_STEP && <StepFinalizacaoBasica s={s} update={update} onBack={() => goTo(2)} onDone={() => setDone(true)} setGlobalErr={setGlobalErr} />}
          </CardContent>
        </Card>
      </div>
    </DarkBlueTheme>
  );
}
