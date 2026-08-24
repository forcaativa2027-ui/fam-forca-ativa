"use client";
import { usePathname } from "next/navigation";
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

  const pathname = usePathname();
  const isAnaliseRisco = pathname === "/analise-risco";
  const isFirstAccess = !onboarded && !sessionDismissed;
  const visible = loaded && (isFirstAccess || onboardingForceOpen) && !isAnaliseRisco;

  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    setReducedMotion(!!mq?.matches);
  }, []);

  // Sempre que o assistente é (re)aberto, volta pra primeira tela.
  useEffect(() => {
    if (onboardingForceOpen) {
      setStep("boas_vindas");
      setSelected(null);
    }
  }, [onboardingForceOpen]);

  // Persiste preferência "não mostrar novamente" no localStorage.
  useEffect(() => {
    if (dontShowAgain && step === "escolha") {
      localStorage.setItem("cec_accessibility_dont_show", "true");
    } else {
      localStorage.removeItem("cec_accessibility_dont_show");
    }
  }, [dontShowAgain, step]);

  if (!visible) return null;

  const handleNext = () => {
    const order: Step[] = ["boas_vindas", "escolha", "aplicando", "confirmacao"];
    const idx = order.indexOf(step);
    if (idx < order.length - 1) setStep(order[idx + 1]);
  };

  const handleBack = () => {
    const order: Step[] = ["boas_vindas", "escolha", "aplicando", "confirmacao"];
    const idx = order.indexOf(step);
    if (idx > 0) setStep(order[idx - 1]);
  };

  const applyAndFinish = (profile: AccessibilityProfile) => {
    applyProfile(profile);
    markOnboarded();
    closeOnboarding();
  };

  if (!loaded) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="relative w-full max-w-2xl mx-4 rounded-2xl bg-white shadow-xl overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="relative border-b border-fam-lavender p-6">
          <LivingLogo size={48} animated={true} showSlogan={false} />
          <h1 id="onboarding-title" className="mt-4 font-display text-2xl font-bold text-fam-plum text-center">
            Bem-vinda à FAM
          </h1>
          <p className="mt-2 text-center text-fam-muted">
            Personalize sua experiência para navegar com mais conforto.
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Step 1: Boas-vindas */}
          {step === "boas_vindas" && (
            <div className="space-y-6 text-center">
              <LivingLogo size={96} animated={true} showSlogan={true} />
              <h2 className="font-display text-2xl font-bold text-fam-plum">
                Bem-vinda à FAM — Força Ativa da Mulher
              </h2>
              <p className="text-fam-muted">
                Antes de começar, vamos personalizar sua experiência para que
                a navegação seja confortável e acessível para você.
              </p>
              <PrimaryButton onClick={handleNext} className="w-full">
                Continuar
              </PrimaryButton>
            </div>
          )}

          {/* Step 2: Escolha do perfil */}
          {step === "escolha" && (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-bold text-fam-plum text-center">
                Como você prefere navegar?
              </h2>
              <p className="text-sm text-fam-muted text-center">
                Escolha um perfil pré-definido ou personalize depois.
              </p>
              <div className="grid gap-3">
                {WELCOME_PROFILES.map((profile) => (
                  <button
                    key={profile.key}
                    onClick={() => setSelected(profile.key)}
                    className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                      selected === profile.key
                        ? "border-fam-magenta bg-fam-magenta/5 ring-2 ring-fam-magenta/20"
                        : "border-fam-lavender hover:border-fam-magenta/50 hover:bg-fam-ivory-pink"
                    }`}
                  >
                    {selected === profile.key && (
                      <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-fam-magenta flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </span>
                    )}
                    {profile.badge && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 text-xs font-bold bg-fam-gold text-fam-deep-plum rounded-full">
                        {profile.badge}
                      </span>
                    )}
                    <div className="flex items-start gap-3">
                      <LivingLogo
                        size={48}
                        animated={false}
                        showSlogan={false}
                        className="shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-fam-deep-plum">{profile.name}</h3>
                        {profile.badge && (
                          <span className="inline-block mt-1 px-2 py-0.5 text-xs font-bold bg-fam-gold text-fam-deep-plum rounded-full">
                            {profile.badge}
                          </span>
                        )}
                        <p className="mt-1 text-sm text-fam-muted">{profile.desc}</p>
                        <ul className="mt-2 space-y-1">
                          {profile.traits.map((trait, i) => (
                            <li key={i} className="text-xs text-fam-muted flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-fam-magenta/50" />
                              {trait}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-2 text-sm text-fam-muted mt-4">
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="w-4 h-4 rounded border-fam-lavender text-fam-magenta focus:ring-fam-magenta"
                />
                <span>Não mostrar novamente</span>
              </label>
              <PrimaryButton
                onClick={handleNext}
                disabled={!selected}
                className="w-full"
              >
                Continuar
              </PrimaryButton>
            </div>
          )}

          {/* Step 3: Aplicando */}
          {step === "aplicando" && selected && (
            <div className="space-y-6 text-center">
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 border-4 border-fam-magenta/20 rounded-full animate-pulse" />
                <div className="relative w-full h-full rounded-full bg-fam-magenta/10 flex items-center justify-center">
                  <PartyPopper className="w-12 h-12 text-fam-magenta animate-bounce" />
                </div>
              </div>
              <h2 className="font-display text-xl font-bold text-fam-plum">
                Aplicando seu perfil…
              </h2>
              <p className="text-fam-muted">
                Estamos configurando tudo para você.
              </p>
            </div>
          )}

          {/* Step 4: Confirmação */}
          {step === "confirmacao" && (
            <div className="space-y-6 text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-fam-success/10 flex items-center justify-center">
                <Check className="w-10 h-10 text-fam-success" />
              </div>
              <h2 className="font-display text-2xl font-bold text-fam-plum">
                Tudo pronto! 🎉
              </h2>
              <p className="text-base text-fam-muted">
                Sua experiência foi personalizada com sucesso.
              </p>
              <p className="text-sm text-fam-muted">
                Você poderá alterar essas configurações a qualquer momento em{" "}
                <b>Meu Painel → Perfil → Acessibilidade e Personalização</b>.
              </p>
              <PrimaryButton size="lg" onClick={() => { markOnboarded(); closeOnboarding(); }} className="w-full max-w-sm text-base">
                Entrar na FAM — FORÇA ATIVA DA MULHER
              </PrimaryButton>
            </div>
          )}

          {/* Navegação inferior (passos) */}
          <div className="mt-6 flex items-center justify-center gap-1">
            {["boas_vindas", "escolha", "aplicando", "confirmacao"].map((s, i) => (
              <button
                key={s}
                disabled
                className={`w-8 h-2 rounded-full transition-colors ${
                  ["boas_vindas", "escolha", "aplicando", "confirmacao"].indexOf(step) >= i
                    ? "bg-fam-magenta"
                    : "bg-fam-lavender"
                }`}
              />
            ))}
          </div>

          {/* Botão voltar (exceto na primeira tela) */}
          {step !== "boas_vindas" && (
            <Button variant="ghost" onClick={handleBack} className="w-full mt-4">
              <ArrowRight className="h-4 w-4 rotate-180 mr-2" />
              Voltar
            </Button>
          )}

          {/* Fechar no canto (permite pular) */}
          <button
            onClick={() => { markOnboarded(); closeOnboarding(); }}
            className="absolute top-4 right-4 p-1 rounded-lg hover:bg-fam-lavender text-fam-muted transition-colors"
            aria-label="Pular e fechar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
