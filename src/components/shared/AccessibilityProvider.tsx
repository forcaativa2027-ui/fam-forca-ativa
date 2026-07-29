"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { getUserPreferences, upsertUserPreferences, DEFAULT_PREFERENCES } from "@/services/accessibility";
import { feedbackSettings, feedback } from "@/lib/feedback";
import type {
  AccessibilityTheme, AccessibilityFontSize, AccessibilityContrast,
  AccessibilitySpacing, AccessibilityAnimations, AccessibilityProfile,
} from "@/types/domain";

const LOCAL_KEY = "cec_accessibility_prefs";

interface AccessibilityState {
  theme: AccessibilityTheme;
  fontSize: AccessibilityFontSize;
  contrast: AccessibilityContrast;
  spacing: AccessibilitySpacing;
  animations: AccessibilityAnimations;
  activeProfile: AccessibilityProfile;
  soundEnabled: boolean;
  soundVolume: number;
  hapticEnabled: boolean;
  hapticIntensity: "leve" | "medio" | "forte";
  onboarded: boolean;
  loaded: boolean;
  setTheme: (t: AccessibilityTheme) => void;
  setFontSize: (f: AccessibilityFontSize) => void;
  setContrast: (c: AccessibilityContrast) => void;
  setSpacing: (s: AccessibilitySpacing) => void;
  setAnimations: (a: AccessibilityAnimations) => void;
  setSoundEnabled: (v: boolean) => void;
  setSoundVolume: (v: number) => void;
  setHapticEnabled: (v: boolean) => void;
  setHapticIntensity: (v: "leve" | "medio" | "forte") => void;
  applyProfile: (p: AccessibilityProfile) => void;
  markOnboarded: () => void;
}

const AccessibilityContext = createContext<AccessibilityState | null>(null);

const FONT_SCALE: Record<AccessibilityFontSize, string> = {
  pequena: "93.75%", media: "100%", grande: "112.5%", extra_grande: "125%",
};

/** CT-017 §18 — cada perfil pronto aplica um conjunto de preferências de uma vez. */
export const PROFILE_PRESETS: Record<AccessibilityProfile, {
  font_size: AccessibilityFontSize; contrast: AccessibilityContrast; spacing: AccessibilitySpacing;
  animations: AccessibilityAnimations; sound_enabled: boolean; haptic_enabled: boolean; simplified: boolean;
}> = {
  padrao:       { font_size: "media",        contrast: "normal",     spacing: "padrao",       animations: "normal",    sound_enabled: false, haptic_enabled: false, simplified: false },
  idoso:        { font_size: "grande",       contrast: "alto",       spacing: "confortavel",  animations: "reduzida",  sound_enabled: true,  haptic_enabled: true,  simplified: false },
  baixa_visao:  { font_size: "extra_grande", contrast: "muito_alto", spacing: "ampliado",     animations: "reduzida",  sound_enabled: false, haptic_enabled: false, simplified: false },
  smartphone:   { font_size: "media",        contrast: "normal",     spacing: "padrao",       animations: "normal",    sound_enabled: false, haptic_enabled: true,  simplified: false },
  tablet:       { font_size: "media",        contrast: "normal",     spacing: "confortavel",  animations: "normal",    sound_enabled: false, haptic_enabled: false, simplified: false },
  desktop:      { font_size: "media",        contrast: "normal",     spacing: "compacto",     animations: "normal",    sound_enabled: false, haptic_enabled: false, simplified: false },
  simplificado: { font_size: "grande",       contrast: "normal",     spacing: "confortavel",  animations: "desativada",sound_enabled: false, haptic_enabled: false, simplified: true },
};

function applyToDocument(
  theme: AccessibilityTheme, fontSize: AccessibilityFontSize,
  contrast: AccessibilityContrast = "normal", spacing: AccessibilitySpacing = "padrao",
  animations: AccessibilityAnimations = "normal", simplified = false,
) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const prefersDark = typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  const isDark = theme === "escuro" || (theme === "automatico" && prefersDark);
  root.classList.toggle("cec-dark", isDark);
  root.style.fontSize = FONT_SCALE[fontSize];
  root.setAttribute("data-contrast", contrast);
  root.setAttribute("data-spacing", spacing);
  root.setAttribute("data-animations", animations);
  root.setAttribute("data-simplified", String(simplified));
}

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<AccessibilityTheme>(DEFAULT_PREFERENCES.theme);
  const [fontSize, setFontSizeState] = useState<AccessibilityFontSize>(DEFAULT_PREFERENCES.font_size);
  const [contrast, setContrastState] = useState<AccessibilityContrast>("normal");
  const [spacing, setSpacingState] = useState<AccessibilitySpacing>("padrao");
  const [animations, setAnimationsState] = useState<AccessibilityAnimations>("normal");
  const [simplified, setSimplifiedState] = useState(false);
  const [activeProfile, setActiveProfile] = useState<AccessibilityProfile>("padrao");
  const [soundEnabled, setSoundEnabledState] = useState(false);
  const [soundVolume, setSoundVolumeState] = useState(0.5);
  const [hapticEnabled, setHapticEnabledState] = useState(false);
  const [hapticIntensity, setHapticIntensityState] = useState<"leve" | "medio" | "forte">("medio");
  const [onboarded, setOnboarded] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);

  function syncExtra(extra: Record<string, unknown>) {
    feedbackSettings.soundEnabled = !!extra.sound_enabled;
    feedbackSettings.soundVolume = typeof extra.sound_volume === "number" ? extra.sound_volume : 0.5;
    feedbackSettings.hapticEnabled = !!extra.haptic_enabled;
    feedbackSettings.hapticIntensity = (extra.haptic_intensity as "leve" | "medio" | "forte") ?? "medio";
    setSoundEnabledState(feedbackSettings.soundEnabled);
    setSoundVolumeState(feedbackSettings.soundVolume);
    setHapticEnabledState(feedbackSettings.hapticEnabled);
    setHapticIntensityState(feedbackSettings.hapticIntensity);
    setContrastState((extra.contrast as AccessibilityContrast) ?? "normal");
    setSpacingState((extra.spacing as AccessibilitySpacing) ?? "padrao");
    setAnimationsState((extra.animations as AccessibilityAnimations) ?? "normal");
    setSimplifiedState(!!extra.simplified);
    setActiveProfile((extra.active_profile as AccessibilityProfile) ?? "padrao");
    return {
      contrast: (extra.contrast as AccessibilityContrast) ?? "normal",
      spacing: (extra.spacing as AccessibilitySpacing) ?? "padrao",
      animations: (extra.animations as AccessibilityAnimations) ?? "normal",
      simplified: !!extra.simplified,
    };
  }

  // Carrega: localStorage primeiro (aplica na hora, sem "flash"), depois
  // Supabase se estiver logado (fonte de verdade — sincroniza entre dispositivos).
  useEffect(() => {
    let t = theme, f = fontSize;
    try {
      const local = localStorage.getItem(LOCAL_KEY);
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed.theme) { setThemeState(parsed.theme); t = parsed.theme; }
        if (parsed.font_size) { setFontSizeState(parsed.font_size); f = parsed.font_size; }
        const ex = parsed.extra ? syncExtra(parsed.extra) : undefined;
        applyToDocument(t, f, ex?.contrast, ex?.spacing, ex?.animations, ex?.simplified);
      }
    } catch { /* ignora localStorage inválido */ }

    supabase.auth.getUser().then(async ({ data }) => {
      const uid = data.user?.id ?? null;
      setProfileId(uid);
      if (uid) {
        const prefs = await getUserPreferences(supabase, uid);
        if (prefs) {
          setThemeState(prefs.theme); setFontSizeState(prefs.font_size); setOnboarded(prefs.onboarded);
          const ex = syncExtra(prefs.extra ?? {});
          applyToDocument(prefs.theme, prefs.font_size, ex.contrast, ex.spacing, ex.animations, ex.simplified);
        }
      }
      setLoaded(true);
    });

    // Reagir a mudança do tema do sistema operacional quando estiver em "automático"
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    const onChange = () => applyToDocument(theme, fontSize, contrast, spacing, animations, simplified);
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
    setThemeState(t); applyToDocument(t, fontSize, contrast, spacing, animations, simplified); persist({ theme: t });
  }, [fontSize, contrast, spacing, animations, simplified, persist]);

  const setFontSize = useCallback((f: AccessibilityFontSize) => {
    setFontSizeState(f); applyToDocument(theme, f, contrast, spacing, animations, simplified); persist({ font_size: f });
  }, [theme, contrast, spacing, animations, simplified, persist]);

  const setContrast = useCallback((c: AccessibilityContrast) => {
    setContrastState(c); applyToDocument(theme, fontSize, c, spacing, animations, simplified); persist({ extra: { contrast: c } });
  }, [theme, fontSize, spacing, animations, simplified, persist]);

  const setSpacing = useCallback((s: AccessibilitySpacing) => {
    setSpacingState(s); applyToDocument(theme, fontSize, contrast, s, animations, simplified); persist({ extra: { spacing: s } });
  }, [theme, fontSize, contrast, animations, simplified, persist]);

  const setAnimations = useCallback((a: AccessibilityAnimations) => {
    setAnimationsState(a); applyToDocument(theme, fontSize, contrast, spacing, a, simplified); persist({ extra: { animations: a } });
  }, [theme, fontSize, contrast, spacing, simplified, persist]);

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

  /** CT-017 §18 — aplica todas as preferências de um Perfil Inteligente de uma vez. */
  const applyProfile = useCallback((p: AccessibilityProfile) => {
    const preset = PROFILE_PRESETS[p];
    setActiveProfile(p);
    setFontSizeState(preset.font_size);
    setContrastState(preset.contrast);
    setSpacingState(preset.spacing);
    setAnimationsState(preset.animations);
    setSimplifiedState(preset.simplified);
    feedbackSettings.soundEnabled = preset.sound_enabled;
    feedbackSettings.hapticEnabled = preset.haptic_enabled;
    setSoundEnabledState(preset.sound_enabled);
    setHapticEnabledState(preset.haptic_enabled);
    applyToDocument(theme, preset.font_size, preset.contrast, preset.spacing, preset.animations, preset.simplified);
    persist({
      font_size: preset.font_size,
      extra: {
        contrast: preset.contrast, spacing: preset.spacing, animations: preset.animations,
        simplified: preset.simplified, sound_enabled: preset.sound_enabled, haptic_enabled: preset.haptic_enabled,
        active_profile: p,
      },
    });
    feedback("success", "success");
  }, [theme, persist]);

  const markOnboarded = useCallback(() => {
    setOnboarded(true); persist({ onboarded: true });
  }, [persist]);

  return (
    <AccessibilityContext.Provider value={{
      theme, fontSize, contrast, spacing, animations, activeProfile,
      soundEnabled, soundVolume, hapticEnabled, hapticIntensity, onboarded, loaded,
      setTheme, setFontSize, setContrast, setSpacing, setAnimations,
      setSoundEnabled, setSoundVolume, setHapticEnabled, setHapticIntensity, applyProfile, markOnboarded,
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
