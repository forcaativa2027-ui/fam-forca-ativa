"use client";

/**
 * CT-017 §10-13 — Feedback Multissensorial. Gera sons curtos via
 * Web Audio API (sem precisar de arquivos de áudio hospedados) e
 * aciona vibração (Vibration API) quando o dispositivo suporta.
 *
 * As configurações atuais ficam num objeto mutável simples (fora do
 * React) pra que qualquer botão da plataforma consiga tocar
 * som/vibração sem precisar estar dentro de um componente que
 * consome o Context — o AccessibilityProvider mantém esse objeto
 * sincronizado sempre que o usuário muda uma preferência.
 */
export const feedbackSettings = {
  soundEnabled: false,
  soundVolume: 0.5,
  hapticEnabled: false,
  hapticIntensity: "medio" as "leve" | "medio" | "forte",
};

export type SoundKind = "click" | "select" | "menu" | "save" | "success" | "error";
export type HapticKind = "tap" | "select" | "success" | "error";

let audioCtx: AudioContext | null = null;
function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!audioCtx) audioCtx = new AC();
  return audioCtx;
}

const SOUND_RECIPES: Record<SoundKind, { freq: number; dur: number; gap?: number }[]> = {
  click:   [{ freq: 700, dur: 30 }],
  select:  [{ freq: 880, dur: 45 }],
  menu:    [{ freq: 600, dur: 40 }, { freq: 760, dur: 40, gap: 20 }],
  save:    [{ freq: 660, dur: 60 }],
  success: [{ freq: 660, dur: 70 }, { freq: 880, dur: 90, gap: 30 }],
  error:   [{ freq: 300, dur: 120 }],
};

/** Toca um som curto e discreto pra confirmar uma ação (§12). Não faz nada se o usuário desativou. */
export function playSound(kind: SoundKind) {
  if (!feedbackSettings.soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});

  let t = ctx.currentTime;
  for (const tone of SOUND_RECIPES[kind]) {
    if (tone.gap) t += tone.gap / 1000;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = tone.freq;
    gain.gain.value = 0;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(feedbackSettings.soundVolume * 0.25, t + 0.005);
    gain.gain.linearRampToValueAtTime(0, t + tone.dur / 1000);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + tone.dur / 1000 + 0.02);
    t += tone.dur / 1000;
  }
}

const HAPTIC_PATTERNS: Record<"leve" | "medio" | "forte", Record<HapticKind, number | number[]>> = {
  leve:  { tap: 8,  select: 10, success: [8, 40, 8],   error: [10, 30, 10, 30, 10] },
  medio: { tap: 15, select: 20, success: [15, 50, 15],  error: [20, 40, 20, 40, 20] },
  forte: { tap: 25, select: 35, success: [25, 60, 25],  error: [30, 50, 30, 50, 30] },
};

/** Aciona uma vibração curta e suave (§13). Só funciona em navegadores/dispositivos compatíveis (Android; iOS Safari não suporta a Vibration API). */
export function triggerHaptic(kind: HapticKind) {
  if (!feedbackSettings.hapticEnabled) return;
  if (typeof navigator === "undefined" || !navigator.vibrate) return;
  navigator.vibrate(HAPTIC_PATTERNS[feedbackSettings.hapticIntensity][kind]);
}

/** Atalho: dispara som + vibração juntos pra uma mesma ação. */
export function feedback(sound: SoundKind, haptic: HapticKind) {
  playSound(sound);
  triggerHaptic(haptic);
}
