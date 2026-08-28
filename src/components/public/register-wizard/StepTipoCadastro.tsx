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
          <h2 className="font-display text-2xl font-bold text-navy">Escolha como continuar</h2>
          <p className="text-base text-muted">Seus dados iniciais foram validados, {s.full_name.split(" ")[0] || "amigo(a)"}. Ainda falta concluir o cadastro.</p>
        </div>
      </div>

      <div className="rounded-xl border-2 border-border bg-card p-4">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-navy/10"><Eye className="h-5 w-5 text-navy" /></div>
          <div className="flex-1">
            <b className="text-navy">Cadastro Básico</b>
            <p className="mt-1 text-sm text-muted">
              Ao concluir o Cadastro Básico, você poderá acessar a plataforma com o e-mail e a senha cadastrados. Com o Cadastro Básico você poderá:
            </p>
            <ul className="mt-2 space-y-1 text-sm text-ink">
              <li>• Acessar a Home do Usuário</li>
              <li>• Inscrever-se em eventos</li>
              <li>• Receber notificações</li>
              <li>• Conhecer melhor o Instituto FAM e seus projetos</li>
            </ul>
            <p className="mt-2 text-xs text-muted">
              Caso futuramente deseje se associar, participar de projetos ou acessar benefícios exclusivos, será necessário concluir o Cadastro Completo.
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
              Quanto mais informações você compartilhar, melhor poderemos apresentar oportunidades de participação, comunicação e benefícios do Instituto.
            </p>
            <p className="mt-2 text-xs text-muted">Necessário para: associação, emissão do Member ID, acesso a comunicações exclusivas e participação em programas do Instituto.</p>
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
