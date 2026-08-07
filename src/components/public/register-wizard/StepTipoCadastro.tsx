"use client";
import { ArrowLeft, ArrowRight, Eye, Heart, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RegisterState, UpdateFn } from "./RegisterWizardTypes";

// ============================================================
// ETAPA 2 — Escolha do Tipo de Cadastro (Básico ou Completo)
// ============================================================
export function StepTipoCadastro({ s, onBack, onBasico, onCompleto }: {
  s: RegisterState; update: UpdateFn;
  onBack: () => void; onBasico: () => void; onCompleto: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <PartyPopper className="h-5 w-5 text-gold" />
        <div>
          <h2 className="font-display text-2xl font-bold text-navy">Sua conta foi criada com sucesso!</h2>
          <p className="text-base text-muted">Como você quer continuar, {s.full_name.split(" ")[0] || "amigo(a)"}?</p>
        </div>
      </div>

      <div className="rounded-xl border-2 border-border bg-card p-4">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-navy/10"><Eye className="h-5 w-5 text-navy" /></div>
          <div className="flex-1">
            <b className="text-navy">Cadastro Básico</b>
            <p className="mt-1 text-sm text-muted">
              Você já pode acessar a plataforma com o e-mail e a senha cadastrados. Com o Cadastro Básico você pode:
            </p>
            <ul className="mt-2 space-y-1 text-sm text-ink">
              <li>• Acessar a Home do Usuário</li>
              <li>• Inscrever-se em eventos</li>
              <li>• Receber notificações</li>
              <li>• Conhecer melhor nossa igreja</li>
            </ul>
            <p className="mt-2 text-xs text-muted">
              Caso futuramente deseje se tornar membro ou participar de um Life Group, será necessário concluir o Cadastro Completo.
            </p>
          </div>
        </div>
        <Button type="button" onClick={onBasico} variant="outline" className="mt-3 h-14 w-full gap-2 rounded-xl text-base shadow-sm transition active:scale-95">
          Entrar na Home do Usuário <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="rounded-xl border-2 border-gold bg-gold/5 p-4">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gold/20"><Heart className="h-5 w-5 text-gold" /></div>
          <div className="flex-1">
            <b className="text-navy">Continuar Cadastro Completo</b>
            <p className="mt-1 text-sm text-muted">
              Quanto mais informações conhecermos sobre você, melhor poderemos acolhê-lo, acompanhá-lo e oferecer uma experiência personalizada dentro da igreja.
            </p>
            <p className="mt-2 text-xs text-muted">Obrigatório para: membros efetivos, emissão da Carteira de Membro, Life Groups, discipulado e acompanhamento pastoral.</p>
          </div>
        </div>
        <Button type="button" onClick={onCompleto} className="mt-3 h-14 w-full gap-2 rounded-xl text-base shadow-md transition hover:shadow-lg active:scale-95">
          Continuar Cadastro <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <button type="button" onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-muted hover:text-navy">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>
    </div>
  );
}
