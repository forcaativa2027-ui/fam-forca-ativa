"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { getUserPreferences, upsertUserPreferences, DEFAULT_PREFERENCES } from "@/services/accessibility";
import { feedbackSettings, feedback } from "@/lib/feedback";
import type { AccessibilityTheme, AccessibilityFontSize } from "@/types/domain";

const LOCAL_KEY = "cec_accessibility_prefs";

interface AccessibilityState {
  theme: AccessibilityTheme;
  fontSize: AccessibilityFontSize;
  soundEnabled: boolean;
  soundVolume: number;
  hapticEnabled: boolean;
  hapticIntensity: "leve" | "medio" | "forte";
  onboarded: boolean;
  loaded: boolean;
  setTheme: (t: AccessibilityTheme) => void;
  setFontSize: (f: AccessibilityFontSize) => void;
  setSoundEnabled: (v: boolean) => void;
  setSoundVolume: (v: number) => void;
  setHapticEnabled: (v: boolean) => void;
  setHapticIntensity: (v: "leve" | "medio" | "forte") => void;
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
  const [soundEnabled, setSoundEnabledState] = useState(false);
  const [soundVolume, setSoundVolumeState] = useState(0.5);
  const [hapticEnabled, setHapticEnabledState] = useState(false);
  const [hapticIntensity, setHapticIntensityState] = useState<"leve" | "medio" | "forte">("medio");
  const [onboarded, setOnboarded] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);

  function syncFeedbackSettings(extra: Record<string, unknown>) {
    feedbackSettings.soundEnabled = !!extra.sound_enabled;
    feedbackSettings.soundVolume = typeof extra.sound_volume === "number" ? extra.sound_volume : 0.5;
    feedbackSettings.hapticEnabled = !!extra.haptic_enabled;
    feedbackSettings.hapticIntensity = (extra.haptic_intensity as "leve" | "medio" | "forte") ?? "medio";
    setSoundEnabledState(feedbackSettings.soundEnabled);
    setSoundVolumeState(feedbackSettings.soundVolume);
    setHapticEnabledState(feedbackSettings.hapticEnabled);
    setHapticIntensityState(feedbackSettings.hapticIntensity);
  }

  // Carrega: localStorage primeiro (aplica na hora, sem "flash"), depois
  // Supabase se estiver logado (fonte de verdade — sincroniza entre dispositivos).
  useEffect(() => {
    try {
      const local = localStorage.getItem(LOCAL_KEY);
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed.theme) setThemeState(parsed.theme);
        if (parsed.font_size) setFontSizeState(parsed.font_size);
        if (parsed.extra) syncFeedbackSettings(parsed.extra);
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
          syncFeedbackSettings(prefs.extra ?? {});
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

  const persist = useCallback((patch: Partial<{ theme: AccessibilityTheme; font_size: AccessibilityFontSize; onboarded: boolean; extra: Record<string, unknown> }>) => {
    let merged: { theme?: AccessibilityTheme; font_size?: AccessibilityFontSize; onboarded?: boolean; extra: Record<string, unknown> } = { extra: {} };
    try {
      const current = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? "{}");
      merged = { ...current, ...patch, extra: { ...(current.extra ?? {}), ...(patch.extra ?? {}) } };
      localStorage.setItem(LOCAL_KEY, JSON.stringify(merged));
    } catch { /* noop */ }
    if (profileId) {
      // Sempre envia o "extra" mesclado por completo, senão o upsert sobrescreveria
      // o jsonb inteiro só com a chave que mudou agora, perdendo as demais.
      upsertUserPreferences(supabase, profileId, { ...patch, extra: patch.extra ? merged.extra : undefined }).catch(() => {});
    }
  }, [profileId]);

  const setTheme = useCallback((t: AccessibilityTheme) => {
    setThemeState(t); applyToDocument(t, fontSize); persist({ theme: t });
  }, [fontSize, persist]);

  const setFontSize = useCallback((f: AccessibilityFontSize) => {
    setFontSizeState(f); applyToDocument(theme, f); persist({ font_size: f });
  }, [theme, persist]);

  const setSoundEnabled = useCallback((v: boolean) => {
    feedbackSettings.soundEnabled = v; setSoundEnabledState(v);
    persist({ extra: { sound_enabled: v } });
    if (v) feedback("success", "select");
  }, [persist]);

  const setSoundVolume = useCallback((v: number) => {
    feedbackSettings.soundVolume = v; setSoundVolumeState(v);
    persist({ extra: { sound_volume: v } });
  }, [persist]);

  const setHapticEnabled = useCallback((v: boolean) => {
    feedbackSettings.hapticEnabled = v; setHapticEnabledState(v);
    persist({ extra: { haptic_enabled: v } });
    if (v) feedback("success", "success");
  }, [persist]);

  const setHapticIntensity = useCallback((v: "leve" | "medio" | "forte") => {
    feedbackSettings.hapticIntensity = v; setHapticIntensityState(v);
    persist({ extra: { haptic_intensity: v } });
    feedback("select", "select");
  }, [persist]);

  const markOnboarded = useCallback(() => {
    setOnboarded(true); persist({ onboarded: true });
  }, [persist]);

  return (
    <AccessibilityContext.Provider value={{
      theme, fontSize, soundEnabled, soundVolume, hapticEnabled, hapticIntensity, onboarded, loaded,
      setTheme, setFontSize, setSoundEnabled, setSoundVolume, setHapticEnabled, setHapticIntensity, markOnboarded,
    }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error("useAccessibility precisa estar dentro de <AccessibilityProvider>");
  return ctx;
}
