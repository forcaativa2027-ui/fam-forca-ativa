"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Check, Compass, Settings2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "fam.navigation.preferences.v1";

type NavigationMode = "confortavel" | "completa" | "compacta";

const OPTIONS: Array<{
  key: NavigationMode;
  title: string;
  description: string;
}> = [
  {
    key: "confortavel",
    title: "Confortável",
    description: "Poucos itens por vez, com textos e áreas de toque maiores.",
  },
  {
    key: "completa",
    title: "Completa",
    description: "Mostra todos os atalhos disponíveis na barra inferior.",
  },
  {
    key: "compacta",
    title: "Compacta",
    description: "Prioriza ícones e reduz o espaço ocupado pela navegação.",
  },
];

export function NavigationPreferencesPrompt() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<NavigationMode>("confortavel");
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    if (pathname !== "/") {
      setOpen(false);
      return;
    }
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (!saved) setOpen(true);
    } catch {
      setOpen(true);
    }
  }, [pathname]);

  useEffect(() => {
    const openPreferences = () => setOpen(true);
    window.addEventListener("fam:open-navigation-preferences", openPreferences);
    return () => window.removeEventListener("fam:open-navigation-preferences", openPreferences);
  }, []);

  if (!open || pathname !== "/") return null;

  function save() {
    const payload = { mode, dismissed: dontShowAgain, updatedAt: new Date().toISOString() };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // A preferência continua válida apenas nesta sessão quando o storage estiver indisponível.
    }
    window.dispatchEvent(new CustomEvent("fam:navigation-preference-changed", { detail: payload }));
    setOpen(false);
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-fam-night/35 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="navigation-preferences-title"
    >
      <section className="w-full max-w-lg rounded-3xl border border-fam-gold/30 bg-white p-6 text-fam-night shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-fam-plum/10 text-fam-plum">
              <Compass className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-fam-plum">Personalização</p>
              <h2 id="navigation-preferences-title" className="mt-1 text-xl font-bold">Configure sua navegação</h2>
              <p className="mt-1 text-sm text-slate-600">Deixe a plataforma mais confortável, simples e personalizada para você.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Fechar configuração de navegação"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fam-plum"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <fieldset className="mt-6 space-y-3">
          <legend className="text-sm font-semibold text-fam-night">Escolha como prefere navegar</legend>
          {OPTIONS.map((option) => {
            const selected = mode === option.key;
            return (
              <label
                key={option.key}
                className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition focus-within:ring-2 focus-within:ring-fam-plum ${selected ? "border-fam-plum bg-fam-plum/5" : "border-slate-200 hover:border-fam-plum/50"}`}
              >
                <input
                  type="radio"
                  name="navigation-mode"
                  value={option.key}
                  checked={selected}
                  onChange={() => setMode(option.key)}
                  className="mt-1 h-4 w-4 accent-fam-plum"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 font-semibold text-fam-night">
                    {option.title}
                    {selected && <Check className="h-4 w-4 text-fam-plum" aria-hidden="true" />}
                  </span>
                  <span className="mt-1 block text-sm text-slate-600">{option.description}</span>
                </span>
              </label>
            );
          })}
        </fieldset>

        <label className="mt-5 flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus-within:ring-2 focus-within:ring-fam-plum">
          <input
            type="checkbox"
            checked={dontShowAgain}
            onChange={(event) => setDontShowAgain(event.target.checked)}
            className="h-5 w-5 accent-fam-plum"
          />
          Não mostrar novamente neste dispositivo
        </label>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="min-h-[44px] text-slate-600">
            Agora não
          </Button>
          <Button type="button" onClick={save} className="min-h-[44px] gap-2 bg-fam-plum text-white hover:bg-fam-purple">
            <Settings2 className="h-4 w-4" aria-hidden="true" />
            Salvar preferência
          </Button>
        </div>
      </section>
    </div>
  );
}

export function openNavigationPreferences() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("fam:open-navigation-preferences"));
  }
}
