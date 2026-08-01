"use client";
import { useEffect, useState } from "react";
import { ArrowRight, Check, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAccessibility, PROFILE_PRESETS } from "./AccessibilityProvider";
import { WELCOME_PROFILE_STYLE } from "./onboarding/ProfileIcons";
import { LivingLogo } from "./LivingLogo";
import { feedback } from "@/lib/feedback";
import type { AccessibilityProfile } from "@/types/domain";

/** CT-018 §5 — os quatro perfis oferecidos no assistente de boas-vindas. */
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

/** Botão principal — azul institucional (CT-018 §8), específico deste assistente. */
function PrimaryButton(props: React.ComponentProps<typeof Button>) {
  const { className = "", ...rest } = props;
  return (
    <Button
      {...rest}
      className={`h-12 bg-[#2563EB] text-white hover:bg-[#1D4ED8] focus-visible:ring-[#2563EB] ${className}`}
    />
  );
}

/**
 * CT-018 (v1.1 consolidada) — Assistente de Boas-vindas e Personalização
 * da Experiência. Página dedicada de tela cheia com quatro telas:
 * boas-vindas (com logo oficial) → escolha do perfil (com checkbox
 * "Não mostrar novamente") → aplicação → confirmação.
 */
export function AccessibilityOnboarding() {
  const { onboarded, loaded, onboardingForceOpen, applyProfile, markOnboarded, closeOnboarding } = useAccessibility();
  const [step, setStep] = useState<Step>("boas_vindas");
  const [selected, setSelected] = useState<AccessibilityProfile | null>(null);
  const [dontShowAgain, setDontShowAgain] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  // Primeiro acesso já concluído nesta aba, mas ainda não persistido (checkbox desmarcado) —
  // fecha o overlay desta vez sem impedir que ele volte a abrir sozinho no próximo login.
  const [sessionDismissed, setSessionDismissed] = useState(false);

  const isFirstAccess = !onboarded && !sessionDismissed;
  const visible = loaded && (isFirstAccess || onboardingForceOpen);

  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    setReducedMotion(!!mq?.matches);
  }, []);

  // Sempre que o assistente é (re)aberto, volta pra primeira tela.
  useEffect(() => {
    if (visible) { setStep("boas_vindas"); setSelected(null); setDontShowAgain(true); }
  }, [visible]);

  if (!visible) return null;

  function finish(profile: AccessibilityProfile) {
    setStep("aplicando");
    const delay = reducedMotion ? 0 : 900;
    window.setTimeout(() => {
      applyProfile(profile);
      // CT-018 §7 — "Não mostrar novamente" e perfil de experiência são independentes:
      // só persiste onboarded=true (suprime a tela nos próximos acessos) se marcado.
      if (dontShowAgain) markOnboarded();
      setSessionDismissed(true);
      feedback("success", "success");
      setStep("confirmacao");
    }, delay);
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0F172A]/35 p-4 backdrop-blur-sm animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
      aria-label="Assistente de boas-vindas e personalização"
    >
      {/* DS-003 §7 — Welcome Overlay: 460-520px de largura no desktop, calc(100%-32px)
          no smartphone (dado pelo padding do wrapper), altura máxima 75vh/78vh. */}
      <div
        className="relative flex w-full max-h-[78vh] flex-col overflow-hidden rounded-3xl bg-[#F8FAFC] shadow-2xl animate-in zoom-in-95 duration-300 sm:w-[500px] sm:max-h-[75vh]"
      >
        {/* Reaberto manualmente (não é o primeiro acesso): permite fechar sem concluir. */}
        {!isFirstAccess && step !== "aplicando" && step !== "confirmacao" && (
          <button
            onClick={closeOnboarding}
            aria-label="Fechar personalização"
            className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-white text-[#475569] shadow-md hover:bg-[#F1F5F9]"
          >
            ✕
          </button>
        )}
        <div className="flex w-full flex-1 flex-col overflow-y-auto px-5 py-6 sm:px-7 sm:py-7">
          {step === "boas_vindas" && (
            <WelcomeScreen
              onStart={() => setStep("escolha")}
              onUseDefault={() => finish("padrao")}
            />
          )}
          {step === "escolha" && (
            <ChooseProfileScreen
              selected={selected}
              onSelect={(p) => { setSelected(p); feedback("select", "select"); }}
              dontShowAgain={dontShowAgain}
              onToggleDontShowAgain={setDontShowAgain}
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
    </div>
  );
}

function WelcomeScreen({ onStart, onUseDefault }: { onStart: () => void; onUseDefault: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
      <LivingLogo size={88} animated />
      <div className="max-w-sm space-y-3">
        <h1 className="text-[22px] font-bold leading-tight text-[#0F172A]">
          Seja muito bem-vindo(a)!
        </h1>
        <p className="text-sm leading-relaxed text-[#475569]">
          É uma alegria ter você conosco.
        </p>
        <p className="text-sm leading-relaxed text-[#475569]">
          Que esta plataforma seja uma ferramenta para fortalecer sua caminhada, sua comunhão e seu crescimento.
        </p>
        <p className="text-sm leading-relaxed text-[#475569]">
          Vamos preparar sua experiência para oferecer uma navegação mais confortável, simples e personalizada.
        </p>
      </div>
      <div className="flex w-full flex-col gap-3">
        <PrimaryButton size="lg" onClick={onStart} className="w-full gap-2 text-base">
          Continuar <ArrowRight className="h-4 w-4" />
        </PrimaryButton>
        <Button variant="ghost" onClick={onUseDefault} className="h-11 w-full min-h-[44px] text-[#475569]">
          Usar configuração padrão
        </Button>
      </div>
    </div>
  );
}

function ChooseProfileScreen({
  selected, onSelect, dontShowAgain, onToggleDontShowAgain, onContinue, onUseDefault,
}: {
  selected: AccessibilityProfile | null;
  onSelect: (p: AccessibilityProfile) => void;
  dontShowAgain: boolean;
  onToggleDontShowAgain: (v: boolean) => void;
  onContinue: () => void;
  onUseDefault: () => void;
}) {
  const preview = selected ? PROFILE_PRESETS[selected] : null;

  return (
    <div className="flex flex-1 flex-col gap-5 py-1">
      <div className="text-center">
        <LivingLogo size={44} animated compact />
        <h1 className="mt-3 text-xl font-bold text-[#0F172A]">Vamos personalizar sua experiência</h1>
        <p className="mt-1 text-sm text-[#475569]">Escolha a opção que oferece mais conforto para você.</p>
      </div>

      <div className="grid grid-cols-1 gap-3">
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
              className="relative flex items-start gap-3 rounded-2xl p-3 text-left shadow-sm transition-all duration-150 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            >
              {isSelected && (
                <span
                  className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full text-white"
                  style={{ background: style.solid }}
                >
                  <Check className="h-4 w-4" />
                </span>
              )}
              <Icon size={48} />
              <div className="min-w-0 flex-1">
                {p.badge && (
                  <span
                    className="mb-1 inline-block w-fit rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide text-white"
                    style={{ background: style.solid }}
                  >
                    {p.badge}
                  </span>
                )}
                <b style={{ color: style.text }} className="block text-base">{p.name}</b>
                <p className="mt-0.5 text-xs text-[#475569]">{p.desc}</p>
                {isSelected && (
                  <span style={{ color: style.solid }} className="mt-1 block text-xs font-bold">Selecionado</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {preview && (
        <div className="rounded-xl border border-dashed border-[#CBD5E1] bg-white p-3 text-xs text-[#475569]">
          <b className="text-[#0F172A]">Prévia: </b>
          fonte {preview.font_size.replace("_", " ")}, contraste {preview.contrast.replace("_", " ")},
          espaçamento {preview.spacing}
          {preview.sound_enabled ? ", som ativado" : ""}
          {preview.haptic_enabled ? ", vibração ativada" : ""}.
        </div>
      )}

      {/* CT-018 §7 — "Não mostrar novamente" (independente do perfil escolhido). */}
      <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#0F172A] focus-within:ring-2 focus-within:ring-[#2563EB]">
        <input
          type="checkbox"
          checked={!dontShowAgain}
          onChange={(e) => onToggleDontShowAgain(!e.target.checked)}
          className="h-5 w-5 shrink-0 rounded border-2 border-[#94A3B8] accent-[#2563EB]"
        />
        Não mostrar esta tela novamente
      </label>

      <div className="mt-auto flex flex-col gap-3 pt-1">
        <PrimaryButton
          size="lg"
          disabled={!selected}
          onClick={onContinue}
          className="w-full gap-2 text-base"
        >
          Continuar <ArrowRight className="h-4 w-4" />
        </PrimaryButton>
        <Button variant="ghost" onClick={onUseDefault} className="h-11 min-h-[44px] w-full text-[#475569]">
          Usar configuração padrão
        </Button>
      </div>
    </div>
  );
}

function ApplyingScreen() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#2563EB]/20 border-t-[#2563EB]" />
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
          <b>Meu Painel → Perfil → Acessibilidade e Personalização</b>.
        </p>
      </div>
      <PrimaryButton size="lg" onClick={onEnter} className="w-full max-w-sm text-base">
        Entrar no CEC FAMILY
      </PrimaryButton>
    </div>
  );
}
