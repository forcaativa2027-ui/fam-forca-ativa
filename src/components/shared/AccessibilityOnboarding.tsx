"use client";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, PartyPopper, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAccessibility, PROFILE_PRESETS } from "./AccessibilityProvider";
import { WELCOME_PROFILE_STYLE } from "./onboarding/ProfileIcons";
import type { AccessibilityProfile } from "@/types/domain";

/** CT-018 — os quatro perfis oferecidos nesta versão do assistente. */
const WELCOME_PROFILES: {
  key: AccessibilityProfile;
  name: string;
  badge?: string;
  desc: string;
  traits: string[];
}[] = [
  {
    key: "padrao",
    name: "Experiência Padrão",
    badge: "RECOMENDADO",
    desc: "Interface equilibrada, confortável e adequada para a maioria dos usuários.",
    traits: ["Fonte média", "Botões grandes", "Ícones coloridos", "Animações suaves"],
  },
  {
    key: "idoso",
    name: "Perfil Confortável",
    desc: "Letras maiores, botões ampliados e uma navegação mais confortável.",
    traits: ["Fonte grande", "Botões extra grandes", "Alto contraste", "Menos itens por tela"],
  },
  {
    key: "baixa_visao",
    name: "Perfil Baixa Visão",
    desc: "Fonte ampliada, alto contraste e elementos maiores para facilitar a leitura.",
    traits: ["Fonte extra grande", "Contraste muito alto", "Bordas mais fortes", "Foco bem visível"],
  },
  {
    key: "simplificado",
    name: "Perfil Simplificado",
    desc: "Interface limpa, poucos elementos por tela e navegação mais direta.",
    traits: ["Menus simplificados", "Menos elementos", "Atalhos diretos", "Textos objetivos"],
  },
];

type Step = "boas_vindas" | "escolha" | "aplicando" | "confirmacao";

/**
 * CT-018 — Assistente de Boas-vindas e Personalização da Experiência.
 * Substitui o antigo diálogo simples de Perfis Inteligentes (CT-017 §18)
 * por uma experiência acolhedora em página dedicada de tela cheia, com
 * quatro telas: boas-vindas, escolha do perfil (com prévia em tempo
 * real), aplicação e confirmação.
 */
export function AccessibilityOnboarding() {
  const { onboarded, loaded, onboardingForceOpen, applyProfile, markOnboarded, closeOnboarding } = useAccessibility();
  const [step, setStep] = useState<Step>("boas_vindas");
  const [selected, setSelected] = useState<AccessibilityProfile | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  const isFirstAccess = !onboarded;
  const visible = loaded && (isFirstAccess || onboardingForceOpen);

  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    setReducedMotion(!!mq?.matches);
  }, []);

  // Sempre que o assistente é (re)aberto, volta pra primeira tela.
  useEffect(() => {
    if (visible) { setStep("boas_vindas"); setSelected(null); }
  }, [visible]);

  if (!visible) return null;

  function finish(profile: AccessibilityProfile) {
    setStep("aplicando");
    const delay = reducedMotion ? 0 : 900;
    window.setTimeout(() => {
      applyProfile(profile);
      markOnboarded();
      setStep("confirmacao");
    }, delay);
  }

  return (
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-[#F8FAFC]"
      role="dialog"
      aria-modal="true"
      aria-label="Assistente de boas-vindas e personalização"
    >
      {/* Reaberto manualmente (não é o primeiro acesso): permite fechar sem concluir. */}
      {!isFirstAccess && step !== "aplicando" && step !== "confirmacao" && (
        <button
          onClick={closeOnboarding}
          aria-label="Fechar personalização"
          className="fixed right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-white text-[#475569] shadow-md hover:bg-[#F1F5F9]"
        >
          ✕
        </button>
      )}
      <div className="mx-auto flex min-h-full max-w-[1100px] flex-col px-4 py-8 sm:px-8">
        {step === "boas_vindas" && (
          <WelcomeScreen
            onStart={() => setStep("escolha")}
            onUseDefault={() => finish("padrao")}
          />
        )}
        {step === "escolha" && (
          <ChooseProfileScreen
            selected={selected}
            onSelect={setSelected}
            onBack={() => setStep("boas_vindas")}
            onContinue={() => selected && finish(selected)}
            onUseDefault={() => finish("padrao")}
          />
        )}
        {step === "aplicando" && <ApplyingScreen />}
        {step === "confirmacao" && (
          <ConfirmationScreen onEnter={closeOnboarding} />
        )}
      </div>
    </div>
  );
}

function WelcomeScreen({ onStart, onUseDefault }: { onStart: () => void; onUseDefault: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
      <div className="grid h-24 w-24 place-items-center rounded-full bg-navy/10">
        <Sparkles className="h-11 w-11 text-navy" />
      </div>
      <div className="max-w-lg space-y-3">
        <h1 className="text-[26px] font-bold leading-tight text-[#0F172A]">
          Seja muito bem-vindo(a) ao CEC FAMILY!
        </h1>
        <p className="text-base leading-relaxed text-[#475569]">
          Estamos felizes em receber você. Antes de começar, vamos preparar a plataforma para
          oferecer uma experiência mais confortável, simples e adequada às suas preferências.
        </p>
        <p className="text-base leading-relaxed text-[#475569]">
          Essa configuração leva poucos segundos e poderá ser alterada quando desejar.
        </p>
      </div>
      <div className="flex w-full max-w-sm flex-col gap-3">
        <Button size="lg" onClick={onStart} className="h-12 w-full gap-2 text-base">
          Vamos começar <ArrowRight className="h-4 w-4" />
        </Button>
        <Button variant="ghost" onClick={onUseDefault} className="h-11 w-full min-h-[44px] text-[#475569]">
          Usar configuração padrão
        </Button>
      </div>
    </div>
  );
}

function ChooseProfileScreen({
  selected, onSelect, onBack, onContinue, onUseDefault,
}: {
  selected: AccessibilityProfile | null;
  onSelect: (p: AccessibilityProfile) => void;
  onBack: () => void;
  onContinue: () => void;
  onUseDefault: () => void;
}) {
  const preview = selected ? PROFILE_PRESETS[selected] : null;

  return (
    <div className="flex flex-1 flex-col gap-6 py-2">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-[#0F172A]">Escolha a melhor experiência para você</h1>
        <p className="mt-2 text-base text-[#475569]">
          Selecione uma opção abaixo. Você poderá personalizar ou alterar esta escolha posteriormente.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {WELCOME_PROFILES.map((p) => {
          const style = WELCOME_PROFILE_STYLE[p.key];
          const isSelected = selected === p.key;
          const Icon = style.Icon;
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => onSelect(p.key)}
              aria-pressed={isSelected}
              style={{
                background: style.soft,
                borderColor: isSelected ? style.solid : style.border,
                borderWidth: isSelected ? 3 : 1,
              }}
              className="relative flex flex-col gap-3 rounded-2xl p-4 text-left shadow-sm transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            >
              {isSelected && (
                <span
                  className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full text-white"
                  style={{ background: style.solid }}
                >
                  <Check className="h-4 w-4" />
                </span>
              )}
              {p.badge && (
                <span
                  className="w-fit rounded-full px-2 py-0.5 text-[11px] font-bold tracking-wide text-white"
                  style={{ background: style.solid }}
                >
                  {p.badge}
                </span>
              )}
              <Icon size={64} />
              <div>
                <b style={{ color: style.text }} className="block text-lg">{p.name}</b>
                <p className="mt-1 text-sm text-[#475569]">{p.desc}</p>
              </div>
              <ul className="mt-1 flex flex-wrap gap-1.5">
                {p.traits.map((t) => (
                  <li
                    key={t}
                    style={{ color: style.text, background: "rgba(255,255,255,.6)" }}
                    className="rounded-full px-2 py-0.5 text-xs font-medium"
                  >
                    {t}
                  </li>
                ))}
              </ul>
              {isSelected && (
                <span style={{ color: style.solid }} className="text-xs font-bold">Selecionado</span>
              )}
            </button>
          );
        })}
      </div>

      {preview && (
        <div className="rounded-xl border border-dashed border-[#CBD5E1] bg-white p-4 text-sm text-[#475569]">
          <b className="text-[#0F172A]">Prévia: </b>
          fonte {preview.font_size.replace("_", " ")}, contraste {preview.contrast.replace("_", " ")},
          espaçamento {preview.spacing}
          {preview.sound_enabled ? ", som ativado" : ""}
          {preview.haptic_enabled ? ", vibração ativada" : ""}.
        </div>
      )}

      <div className="mt-auto flex flex-col-reverse items-stretch justify-between gap-3 pt-4 sm:flex-row sm:items-center">
        <Button variant="ghost" onClick={onBack} className="h-11 min-h-[44px] gap-2 text-[#475569]">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
          <Button variant="ghost" onClick={onUseDefault} className="h-11 min-h-[44px] text-[#475569]">
            Usar configuração padrão
          </Button>
          <Button
            size="lg"
            disabled={!selected}
            onClick={onContinue}
            className="h-12 w-full gap-2 text-base sm:w-auto"
          >
            Continuar <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function ApplyingScreen() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-navy/20 border-t-navy" />
      <div>
        <h2 className="text-xl font-semibold text-[#0F172A]">Preparando sua experiência...</h2>
        <ul className="mt-3 space-y-1 text-sm text-[#475569]">
          <li>Aplicando preferências</li>
          <li>Ajustando a interface</li>
          <li>Salvando configurações</li>
        </ul>
      </div>
    </div>
  );
}

function ConfirmationScreen({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
      <div className="grid h-24 w-24 place-items-center rounded-full bg-[#F0FDF4]">
        <PartyPopper className="h-11 w-11 text-[#16A34A]" />
      </div>
      <div className="max-w-md space-y-2">
        <h1 className="text-2xl font-bold text-[#0F172A]">Tudo pronto! 🎉</h1>
        <p className="text-base text-[#475569]">Sua experiência foi personalizada com sucesso.</p>
        <p className="text-sm text-[#475569]">
          Você poderá alterar essas configurações a qualquer momento em{" "}
          <b>Configurações → Acessibilidade e Personalização</b>.
        </p>
      </div>
      <Button size="lg" onClick={onEnter} className="h-12 w-full max-w-sm text-base">
        Entrar no CEC FAMILY
      </Button>
    </div>
  );
}
