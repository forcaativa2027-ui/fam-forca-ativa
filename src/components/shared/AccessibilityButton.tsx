"use client";
import { useState } from "react";
import {
  Accessibility, Sun, Moon, MonitorSmartphone, Type, Volume2, VolumeX, Vibrate,
  Sparkles, User, Glasses, Smartphone, Tablet, Monitor, LayoutList, Contrast, MoveVertical, Zap,
  MousePointerClick, Palette,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAccessibility } from "./AccessibilityProvider";
import { playSound } from "@/lib/feedback";
import type { AccessibilityTheme, AccessibilityFontSize, AccessibilityProfile } from "@/types/domain";

const THEME_OPTIONS: { value: AccessibilityTheme; label: string; icon: React.ReactNode }[] = [
  { value: "claro", label: "Claro", icon: <Sun className="h-5 w-5" /> },
  { value: "escuro", label: "Escuro", icon: <Moon className="h-5 w-5" /> },
  { value: "automatico", label: "Automático", icon: <MonitorSmartphone className="h-5 w-5" /> },
];

const FONT_OPTIONS: { value: AccessibilityFontSize; label: string; sample: string }[] = [
  { value: "pequena", label: "Pequena", sample: "text-sm" },
  { value: "media", label: "Média", sample: "text-base" },
  { value: "grande", label: "Grande", sample: "text-lg" },
  { value: "extra_grande", label: "Extra Grande", sample: "text-xl" },
];

const PROFILE_OPTIONS: { value: AccessibilityProfile; label: string; icon: React.ReactNode }[] = [
  { value: "padrao", label: "Padrão", icon: <Sparkles className="h-4 w-4" /> },
  { value: "idoso", label: "Perfil Confortável", icon: <User className="h-4 w-4" /> },
  { value: "baixa_visao", label: "Baixa Visão", icon: <Glasses className="h-4 w-4" /> },
  { value: "simplificado", label: "Simplificado", icon: <LayoutList className="h-4 w-4" /> },
  { value: "smartphone", label: "Smartphone", icon: <Smartphone className="h-4 w-4" /> },
  { value: "tablet", label: "Tablet", icon: <Tablet className="h-4 w-4" /> },
  { value: "desktop", label: "Desktop", icon: <Monitor className="h-4 w-4" /> },
];

/**
 * CT-017 — Central de Acessibilidade e Personalização. Botão
 * sempre visível que abre o painel completo de preferências.
 */
export function AccessibilityButton() {
  const [open, setOpen] = useState(false);
  const {
    theme, fontSize, setTheme, setFontSize,
    contrast, spacing, animations, setContrast, setSpacing, setAnimations,
    buttonSize, iconStyle, setButtonSize, setIconStyle,
    activeProfile, applyProfile,
    soundEnabled, soundVolume, setSoundEnabled, setSoundVolume,
    hapticEnabled, hapticIntensity, setHapticEnabled, setHapticIntensity,
    openOnboarding,
  } = useAccessibility();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Abrir Central de Acessibilidade"
        className="fixed bottom-24 right-5 z-[60] grid h-14 w-14 place-items-center rounded-full bg-navy text-gold shadow-lg transition hover:scale-105 hover:bg-navy-600 active:scale-95"
      >
        <Accessibility className="h-6 w-6" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] max-w-sm overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg"><Accessibility className="h-5 w-5 text-gold" />Acessibilidade e Personalização</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            {/* Perfis Inteligentes */}
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-navy"><Sparkles className="h-4 w-4" />Perfis Inteligentes</p>
              <div className="grid grid-cols-2 gap-2">
                {PROFILE_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => applyProfile(o.value)}
                    className={`flex items-center gap-2 rounded-xl border-2 p-2.5 text-xs font-semibold transition ${activeProfile === o.value ? "border-gold bg-gold/10 text-navy shadow-md" : "border-border text-muted hover:border-navy/30"}`}
                  >
                    {o.icon}{o.label}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[11px] text-muted-foreground">Escolher um perfil ajusta várias preferências de uma vez. Você ainda pode ajustar cada uma individualmente abaixo.</p>
            </div>

            <div>
              <p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-navy"><Sun className="h-4 w-4" />Tema</p>
              <div className="grid grid-cols-3 gap-2">
                {THEME_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => setTheme(o.value)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-xs font-semibold transition ${theme === o.value ? "border-gold bg-gold/10 text-navy shadow-md" : "border-border text-muted hover:border-navy/30"}`}
                  >
                    {o.icon}
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-navy"><Type className="h-4 w-4" />Tamanho da fonte</p>
              <div className="grid grid-cols-2 gap-2">
                {FONT_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => setFontSize(o.value)}
                    className={`rounded-xl border-2 p-3 text-left transition ${fontSize === o.value ? "border-gold bg-gold/10 shadow-md" : "border-border hover:border-navy/30"}`}
                  >
                    <span className={`block font-bold text-navy ${o.sample}`}>Aa</span>
                    <span className="text-xs text-muted">{o.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-navy"><Contrast className="h-4 w-4" />Contraste</p>
              <div className="grid grid-cols-3 gap-2">
                {([["normal","Normal"],["alto","Alto"],["muito_alto","Muito Alto"]] as const).map(([v,l]) => (
                  <button key={v} onClick={() => setContrast(v)}
                    className={`rounded-xl border-2 p-2.5 text-xs font-semibold transition ${contrast === v ? "border-gold bg-gold/10 text-navy shadow-md" : "border-border text-muted hover:border-navy/30"}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-navy"><MoveVertical className="h-4 w-4" />Espaçamento</p>
              <div className="grid grid-cols-4 gap-2">
                {([["compacto","Compacto"],["padrao","Padrão"],["confortavel","Confortável"],["ampliado","Ampliado"]] as const).map(([v,l]) => (
                  <button key={v} onClick={() => setSpacing(v)}
                    className={`rounded-xl border-2 p-2 text-[11px] font-semibold transition ${spacing === v ? "border-gold bg-gold/10 text-navy shadow-md" : "border-border text-muted hover:border-navy/30"}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-navy"><Zap className="h-4 w-4" />Animações</p>
              <div className="grid grid-cols-3 gap-2">
                {([["normal","Normais"],["reduzida","Reduzidas"],["desativada","Desativadas"]] as const).map(([v,l]) => (
                  <button key={v} onClick={() => setAnimations(v)}
                    className={`rounded-xl border-2 p-2.5 text-xs font-semibold transition ${animations === v ? "border-gold bg-gold/10 text-navy shadow-md" : "border-border text-muted hover:border-navy/30"}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-navy"><MousePointerClick className="h-4 w-4" />Tamanho dos Botões</p>
              <div className="grid grid-cols-3 gap-2">
                {([["normal","Normal"],["grande","Grande"],["extra_grande","Extra Grande"]] as const).map(([v,l]) => (
                  <button key={v} onClick={() => setButtonSize(v)}
                    className={`rounded-xl border-2 p-2.5 text-xs font-semibold transition ${buttonSize === v ? "border-gold bg-gold/10 text-navy shadow-md" : "border-border text-muted hover:border-navy/30"}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-navy"><Palette className="h-4 w-4" />Estilo dos Ícones</p>
              <div className="grid grid-cols-3 gap-2">
                {([["coloridos","Coloridos"],["monocromaticos","Monocromáticos"],["minimalistas","Minimalistas"]] as const).map(([v,l]) => (
                  <button key={v} onClick={() => setIconStyle(v)}
                    className={`rounded-xl border-2 p-2.5 text-[11px] font-semibold transition ${iconStyle === v ? "border-gold bg-gold/10 text-navy shadow-md" : "border-border text-muted hover:border-navy/30"}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border-2 border-border p-3">
              <button
                onClick={() => { setSoundEnabled(!soundEnabled); if (!soundEnabled) playSound("success"); }}
                className="flex w-full items-center justify-between"
              >
                <span className="flex items-center gap-2 text-sm font-bold text-navy">
                  {soundEnabled ? <Volume2 className="h-4 w-4 text-gold" /> : <VolumeX className="h-4 w-4 text-muted" />}
                  Sons da Interface
                </span>
                <span className={`relative h-6 w-11 rounded-full transition ${soundEnabled ? "bg-gold" : "bg-border"}`}>
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${soundEnabled ? "left-[22px]" : "left-0.5"}`} />
                </span>
              </button>
              {soundEnabled && (
                <div className="mt-3 flex items-center gap-2">
                  <VolumeX className="h-3.5 w-3.5 text-muted" />
                  <input
                    type="range" min={0} max={1} step={0.1} value={soundVolume}
                    onChange={(e) => setSoundVolume(Number(e.target.value))}
                    onMouseUp={() => playSound("click")}
                    className="h-1.5 flex-1 accent-gold"
                  />
                  <Volume2 className="h-3.5 w-3.5 text-muted" />
                </div>
              )}
            </div>

            <div className="rounded-xl border-2 border-border p-3">
              <button onClick={() => setHapticEnabled(!hapticEnabled)} className="flex w-full items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-bold text-navy">
                  <Vibrate className={`h-4 w-4 ${hapticEnabled ? "text-gold" : "text-muted"}`} />
                  Vibração ao Tocar
                </span>
                <span className={`relative h-6 w-11 rounded-full transition ${hapticEnabled ? "bg-gold" : "bg-border"}`}>
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${hapticEnabled ? "left-[22px]" : "left-0.5"}`} />
                </span>
              </button>
              {hapticEnabled && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {(["leve", "medio", "forte"] as const).map((i) => (
                    <button
                      key={i} onClick={() => setHapticIntensity(i)}
                      className={`rounded-lg border-2 py-1.5 text-xs font-semibold capitalize transition ${hapticIntensity === i ? "border-gold bg-gold/10 text-navy" : "border-border text-muted"}`}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              )}
              <p className="mt-2 text-[11px] text-muted-foreground">Funciona apenas em celulares Android — iPhone não suporta essa função.</p>
            </div>

            <p className="text-xs text-muted-foreground">
              Suas preferências ficam salvas na sua conta e valem em qualquer aparelho que você usar pra acessar a plataforma.
            </p>

            <Button
              variant="outline"
              onClick={() => { setOpen(false); openOnboarding(); }}
              className="w-full gap-2"
            >
              <Sparkles className="h-4 w-4" /> Reabrir Assistente de Personalização
            </Button>

            <Button onClick={() => setOpen(false)} className="w-full">Concluído</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
