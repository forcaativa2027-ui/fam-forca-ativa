"use client";
import { Sparkles, User, Glasses, LayoutList } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAccessibility } from "./AccessibilityProvider";

/**
 * CT-017 §18 — Perfis Inteligentes, aplicados no primeiro acesso.
 * Nesta fase (1) só ajustam tema+fonte — as demais preferências
 * entram nas próximas fases, reaproveitando esse mesmo fluxo.
 */
const PROFILES = [
  { key: "padrao", label: "Padrão", icon: Sparkles, desc: "A experiência recomendada pela plataforma", font: "media" as const, extras: undefined },
  { key: "idoso", label: "Perfil Idoso", icon: User, desc: "Fonte maior, som e vibração ao tocar", font: "grande" as const, extras: { sound: true, haptic: true } },
  { key: "baixa_visao", label: "Baixa Visão", icon: Glasses, desc: "Fonte extra grande e alto contraste", font: "extra_grande" as const, extras: undefined },
  { key: "simplificado", label: "Simplificado", icon: LayoutList, desc: "Menos elementos na tela, navegação mais direta", font: "grande" as const, extras: undefined },
];

export function AccessibilityOnboarding() {
  const { onboarded, loaded, setFontSize, setSoundEnabled, setHapticEnabled, markOnboarded } = useAccessibility();

  if (!loaded || onboarded) return null;

  function choose(font: "media" | "grande" | "extra_grande", extras?: { sound?: boolean; haptic?: boolean }) {
    setFontSize(font);
    if (extras?.sound) setSoundEnabled(true);
    if (extras?.haptic) setHapticEnabled(true);
    markOnboarded();
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) markOnboarded(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-lg text-navy">Como você prefere usar a plataforma?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted">Escolha o que for mais confortável — você pode mudar isso a qualquer momento no botão de acessibilidade.</p>
        <div className="space-y-2 pt-1">
          {PROFILES.map((p) => {
            const Ico = p.icon;
            return (
              <button
                key={p.key}
                onClick={() => choose(p.font, p.extras)}
                className="flex w-full items-center gap-3 rounded-xl border-2 border-border p-3 text-left transition hover:border-gold/50 hover:bg-gold/5 hover:shadow-sm"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-navy/10 text-navy"><Ico className="h-5 w-5" /></span>
                <span>
                  <b className="block text-navy">{p.label}</b>
                  <span className="text-xs text-muted">{p.desc}</span>
                </span>
              </button>
            );
          })}
        </div>
        <Button variant="ghost" onClick={() => markOnboarded()} className="w-full text-muted-foreground">
          Pular e usar o padrão
        </Button>
      </DialogContent>
    </Dialog>
  );
}
