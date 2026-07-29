"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { getUserPreferences, upsertUserPreferences, DEFAULT_PREFERENCES } from "@/services/accessibility";
import type { AccessibilityTheme, AccessibilityFontSize } from "@/types/domain";

const LOCAL_KEY = "cec_accessibility_prefs";

interface AccessibilityState {
  theme: AccessibilityTheme;
  fontSize: AccessibilityFontSize;
  onboarded: boolean;
  loaded: boolean;
  setTheme: (t: AccessibilityTheme) => void;
  setFontSize: (f: AccessibilityFontSize) => void;
  markOnboarded: () => void;
}

const AccessibilityContext = createContext<AccessibilityState | null>(null);

const FONT_SCALE: Record<AccessibilityFontSize, string> = {
  pequena: "93.75%", media: "100%", grande: "112.5%", extra_grande: "125%",
};

function applyToDocument(theme: AccessibilityTheme, fontSize: AccessibilityFontSize) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const prefersDark = typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  const isDark = theme === "escuro" || (theme === "automatico" && prefersDark);
  root.classList.toggle("cec-dark", isDark);
  root.style.fontSize = FONT_SCALE[fontSize];
}

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<AccessibilityTheme>(DEFAULT_PREFERENCES.theme);
  const [fontSize, setFontSizeState] = useState<AccessibilityFontSize>(DEFAULT_PREFERENCES.font_size);
  const [onboarded, setOnboarded] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);

  // Carrega: localStorage primeiro (aplica na hora, sem "flash"), depois
  // Supabase se estiver logado (fonte de verdade — sincroniza entre dispositivos).
  useEffect(() => {
    try {
      const local = localStorage.getItem(LOCAL_KEY);
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed.theme) setThemeState(parsed.theme);
        if (parsed.font_size) setFontSizeState(parsed.font_size);
        applyToDocument(parsed.theme ?? theme, parsed.font_size ?? fontSize);
      }
    } catch { /* ignora localStorage inválido */ }

    supabase.auth.getUser().then(async ({ data }) => {
      const uid = data.user?.id ?? null;
      setProfileId(uid);
      if (uid) {
        const prefs = await getUserPreferences(supabase, uid);
        if (prefs) {
          setThemeState(prefs.theme); setFontSizeState(prefs.font_size); setOnboarded(prefs.onboarded);
          applyToDocument(prefs.theme, prefs.font_size);
        }
      }
      setLoaded(true);
    });

    // Reagir a mudança do tema do sistema operacional quando estiver em "automático"
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    const onChange = () => applyToDocument(theme, fontSize);
    mq?.addEventListener?.("change", onChange);
    return () => mq?.removeEventListener?.("change", onChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persist = useCallback((patch: Partial<{ theme: AccessibilityTheme; font_size: AccessibilityFontSize; onboarded: boolean }>) => {
    try {
      const current = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? "{}");
      localStorage.setItem(LOCAL_KEY, JSON.stringify({ ...current, ...patch }));
    } catch { /* noop */ }
    if (profileId) upsertUserPreferences(supabase, profileId, patch).catch(() => {});
  }, [profileId]);

  const setTheme = useCallback((t: AccessibilityTheme) => {
    setThemeState(t); applyToDocument(t, fontSize); persist({ theme: t });
  }, [fontSize, persist]);

  const setFontSize = useCallback((f: AccessibilityFontSize) => {
    setFontSizeState(f); applyToDocument(theme, f); persist({ font_size: f });
  }, [theme, persist]);

  const markOnboarded = useCallback(() => {
    setOnboarded(true); persist({ onboarded: true });
  }, [persist]);

  return (
    <AccessibilityContext.Provider value={{ theme, fontSize, onboarded, loaded, setTheme, setFontSize, markOnboarded }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error("useAccessibility precisa estar dentro de <AccessibilityProvider>");
  return ctx;
}
