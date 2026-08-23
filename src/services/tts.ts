"use client";

/**
 * CEC Academy Bloco 6 (ACA-B06-UI §4) — Leitura Assistida. Usa a
 * Web Speech API nativa do navegador (SpeechSynthesis) — sem
 * depender de nenhum serviço externo pago. Suporte varia por
 * navegador/SO, mas funciona bem em Chrome, Edge e Safari.
 *
 * IMPORTANTE (ACA-B06-DB §2, Categoria B): nada aqui é persistido
 * no banco — é só estado de execução em memória, no navegador.
 */

export function isTTSSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (!isTTSSupported()) return [];
  const voices = window.speechSynthesis.getVoices();
  // Prioriza vozes em português
  return voices.sort((a, b) => {
    const aPt = a.lang.startsWith("pt") ? 0 : 1;
    const bPt = b.lang.startsWith("pt") ? 0 : 1;
    return aPt - bPt;
  });
}

export interface SpeakOptions {
  rate?: number;        // 0.5 a 2
  voiceURI?: string | null;
  onStart?: () => void;
  onBoundary?: (charIndex: number) => void;
  onEnd?: () => void;
  onError?: () => void;
}

/** Fala um trecho de texto. Devolve o utterance, pra permitir cancelar externamente se precisar. */
export function speakText(text: string, opts: SpeakOptions = {}): SpeechSynthesisUtterance | null {
  if (!isTTSSupported() || !text.trim()) return null;
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = opts.rate ?? 1;
  utter.lang = "pt-BR";
  if (opts.voiceURI) {
    const voice = getAvailableVoices().find((v) => v.voiceURI === opts.voiceURI);
    if (voice) utter.voice = voice;
  }
  utter.onstart = () => opts.onStart?.();
  utter.onboundary = (e) => opts.onBoundary?.(e.charIndex);
  utter.onend = () => opts.onEnd?.();
  utter.onerror = () => opts.onError?.();
  window.speechSynthesis.speak(utter);
  return utter;
}

export function pauseSpeech(): void {
  if (isTTSSupported()) window.speechSynthesis.pause();
}
export function resumeSpeech(): void {
  if (isTTSSupported()) window.speechSynthesis.resume();
}
export function stopSpeech(): void {
  if (isTTSSupported()) window.speechSynthesis.cancel();
}

/** Divide um texto em sentenças, pra destacar uma de cada vez durante a leitura. */
export function splitIntoSentences(text: string): string[] {
  return text.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0);
}
