"use client";
import { useState } from "react";
import { Accessibility, Sun, Moon, MonitorSmartphone, Type, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAccessibility } from "./AccessibilityProvider";
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
  const { theme, fontSize, setTheme, setFontSize } = useAccessibility();

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

            <Button onClick={() => setOpen(false)} className="w-full">Concluído</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
