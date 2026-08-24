"use client";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, Check, PartyPopper, X, Settings, CheckCircle2 } from "lucide-react";
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
 * da Experiência. Card compacto com opções de fechar, configurações ou padrão.
 */
export function AccessibilityOnboarding() {
  const { onboarded, loaded, onboardingForceOpen, applyProfile, markOnboarded, closeOnboarding } = useAccessibility();
  const [step, setStep] = useState<Step>("boas_vindas");
  const [selected, setSelected] = useState<AccessibilityProfile | null>(null);
  const [dontShowAgain, setDontShowAgain] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
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

  const useDefaultAndClose = () => {
    applyProfile("padrao");
    markOnboarded();
    closeOnboarding();
  };

  const openSettings = () => {
    closeOnboarding();
    // Navega para a página de configurações de acessibilidade
    window.location.href = "/configuracoes?tab=acessibilidade";
  };

  if (!loaded) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-fam-lavender overflow-hidden animate-slide-up">
        {/* Header compacto */}
        <div className="flex items-center justify-between p-4 border-b border-fam-lavender">
          <div className="flex items-center gap-3">
            <LivingLogo size={36} animated={true} showSlogan={false} />
            <div>
              <h1 id="onboarding-title" className="font-display text-lg font-bold text-fam-plum">
                Boas-vindas à FAM
              </h1>
              <p className="text-xs text-fam-muted">
                Personalize sua experiência
              </p>
            </div>
          </div>
          <button
            onClick={() => { markOnboarded(); closeOnboarding(); }}
            className="p-1 rounded-lg hover:bg-fam-lavender text-fam-muted transition-colors"
            aria-label="Fechar e usar padrão"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Step 1: Boas-vindas */}
          {step === "boas_vindas" && (
            <div className="space-y-4 text-center">
              <LivingLogo size={64} animated={true} showSlogan={true} />
              <h2 className="font-display text-xl font-bold text-fam-plum">
                Bem-vinda à FAM
              </h2>
              <p className="text-sm text-fam-muted">
                Personalize sua experiência para navegar com mais conforto.
              </p>
              <PrimaryButton onClick={handleNext} className="w-full">
                Continuar
              </PrimaryButton>
            </div>
          )}

          {/* Step 2: Escolha do perfil */}
          {step === "escolha" && (
            <div className="space-y-3">
              <h2 className="font-display text-lg font-bold text-fam-plum text-center">
                Como você prefere navegar?
              </h2>
              <p className="text-xs text-fam-muted text-center">
                Escolha um perfil ou use o padrão
              </p>
              <div className="grid gap-2">
                {WELCOME_PROFILES.map((profile) => (
                  <button
                    key={profile.key}
                    onClick={() => setSelected(profile.key)}
                    className={`relative p-3 rounded-xl border-2 text-left transition-all ${
                      selected === profile.key
                        ? "border-fam-magenta bg-fam-magenta/5 ring-2 ring-fam-magenta/20"
                        : "border-fam-lavender hover:border-fam-magenta/50 hover:bg-fam-ivory-pink"
                    }`}
                  >
                    {selected === profile.key && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-fam-magenta flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-white" />
                      </span>
                    )}
                    {profile.badge && (
                      <span className="absolute -top-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 text-[10px] font-bold bg-fam-gold text-fam-deep-plum rounded-full">
                        {profile.badge}
                      </span>
                    )}
                    <div className="flex items-start gap-2">
                      <LivingLogo
                        size={36}
                        animated={false}
                        showSlogan={false}
                        className="shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-fam-deep-plum text-sm">{profile.name}</h3>
                        <p className="text-xs text-fam-muted mt-0.5">{profile.desc}</p>
                        <ul className="mt-1.5 space-y-0.5">
                          {profile.traits.map((trait, i) => (
                            <li key={i} className="text-[11px] text-fam-muted flex items-center gap-1">
                              <span className="w-1 h-1 rounded-full bg-fam-magenta/50" />
                              {trait}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-2 text-xs text-fam-muted mt-2">
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-fam-lavender text-fam-magenta focus:ring-fam-magenta"
                />
                <span>Não mostrar novamente</span>
              </label>
              <div className="space-y-2 pt-2">
                <PrimaryButton
                  onClick={handleNext}
                  disabled={!selected}
                  className="w-full"
                >
                  Continuar
                </PrimaryButton>
                <Button variant="ghost" onClick={openSettings} className="w-full text-xs">
                  <Settings className="h-3.5 w-3.5 mr-1.5" />
                  Ir para configurações
                </Button>
                <Button variant="ghost" onClick={useDefaultAndClose} className="w-full text-xs">
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                  Usar configuração padrão
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Aplicando */}
          {step === "aplicando" && selected && (
            <div className="space-y-4 text-center">
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 border-4 border-fam-magenta/20 rounded-full animate-pulse" />
                <div className="relative w-full h-full rounded-full bg-fam-magenta/10 flex items-center justify-center">
                  <PartyPopper className="w-8 h-8 text-fam-magenta animate-bounce" />
                </div>
              </div>
              <h2 className="font-display text-lg font-bold text-fam-plum">
                Aplicando seu perfil…
              </h2>
              <p className="text-sm text-fam-muted">
                Estamos configurando tudo para você.
              </p>
            </div>
          )}

          {/* Step 4: Confirmação */}
          {step === "confirmacao" && (
            <div className="space-y-4 text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-fam-success/10 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-fam-success" />
              </div>
              <h2 className="font-display text-xl font-bold text-fam-plum">
                Tudo pronto! 🎉
              </h2>
              <p className="text-sm text-fam-muted">
                Sua experiência foi personalizada com sucesso.
              </p>
              <p className="text-xs text-fam-muted">
                Você poderá alterar essas configurações a qualquer momento em{" "}
                <b>Configurações → Acessibilidade</b>.
              </p>
              <PrimaryButton size="lg" onClick={() => { markOnboarded(); closeOnboarding(); }} className="w-full">
                Entrar na FAM — FORÇA ATIVA DA MULHER
              </PrimaryButton>
            </div>
          )}

          {/* Navegação inferior (passos) */}
          <div className="flex items-center justify-center gap-1">
            {["boas_vindas", "escolha", "aplicando", "confirmacao"].map((s, i) => (
              <button
                key={s}
                disabled
                className={`w-6 h-1.5 rounded-full transition-colors ${
                  ["boas_vindas", "escolha", "aplicando", "confirmacao"].indexOf(step) >= i
                    ? "bg-fam-magenta"
                    : "bg-fam-lavender"
                }`}
              />
            ))}
          </div>

          {/* Botão voltar (exceto na primeira tela) */}
          {step !== "boas_vindas" && (
            <Button variant="ghost" onClick={handleBack} className="w-full mt-2">
              <ArrowRight className="h-4 w-4 rotate-180 mr-2" />
              Voltar
            </Button>
          )}

          {/* Botões de ação rápida no rodapé */}
          <div className="flex gap-2 pt-2 border-t border-fam-lavender">
            <Button variant="ghost" size="sm" onClick={useDefaultAndClose} className="flex-1" aria-label="Usar configuração padrão">
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
              Padrão
            </Button>
            <Button variant="outline" size="sm" onClick={openSettings} className="flex-1" aria-label="Ir para configurações">
              <Settings className="h-3.5 w-3.5 mr-1.5" />
              Configurações
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { markOnboarded(); closeOnboarding(); }} className="flex-1" aria-label="Fechar e usar padrão">
              <X className="h-3.5 w-3.5 mr-1.5" />
              Fechar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
