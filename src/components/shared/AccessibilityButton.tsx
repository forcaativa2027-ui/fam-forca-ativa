"use client";
import { useState } from "react";
import { Accessibility, Sun, Moon, MonitorSmartphone, Type, Volume2, VolumeX, Vibrate } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAccessibility } from "./AccessibilityProvider";
import { playSound } from "@/lib/feedback";
import type { AccessibilityTheme, AccessibilityFontSize } from "@/types/domain";

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

/**
 * CT-017 — Central de Acessibilidade e Personalização. Botão
 * sempre visível (canto inferior direito, flutuante) que abre o
 * painel de preferências — acessível em qualquer tela, a qualquer
 * momento, sem precisar procurar em submenus.
 */
export function AccessibilityButton() {
  const [open, setOpen] = useState(false);
  const {
    theme, fontSize, setTheme, setFontSize,
    soundEnabled, soundVolume, setSoundEnabled, setSoundVolume,
    hapticEnabled, hapticIntensity, setHapticEnabled, setHapticIntensity,
  } = useAccessibility();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Abrir Central de Acessibilidade"
        className="fixed bottom-5 right-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-navy text-gold shadow-lg transition hover:scale-105 hover:bg-navy-600 active:scale-95"
      >
        <Accessibility className="h-6 w-6" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg"><Accessibility className="h-5 w-5 text-gold" />Acessibilidade e Personalização</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 pt-2">
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

            <p className="text-xs text-muted-foreground">
              Suas preferências ficam salvas na sua conta e valem em qualquer aparelho que você usar pra acessar a plataforma.
            </p>

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

            <Button onClick={() => setOpen(false)} className="w-full">Concluído</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
