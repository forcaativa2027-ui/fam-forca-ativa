"use client";

/**
 * CEC Academy Bloco 6 (ACA-B06-UI §5) — Comandos de Voz. Usa a Web
 * Speech Recognition API. Suporte varia bastante por navegador —
 * funciona bem no Chrome/Edge, é limitado ou ausente no Safari/iOS
 * e no Firefox. Por isso, sempre verificar isVoiceSupported() antes
 * de mostrar o recurso, e nunca travar a tela se não for suportado.
 */

// Tipos mínimos — a API não tem tipagem oficial no TypeScript padrão
interface SpeechRecognitionResultLike { transcript: string; }
interface SpeechRecognitionLike extends EventTarget {
  lang: string; continuous: boolean; interimResults: boolean;
  start: () => void; stop: () => void; abort: () => void;
  onresult: ((event: { results: { 0: { 0: SpeechRecognitionResultLike } } }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function isVoiceSupported(): boolean {
  return getRecognitionCtor() !== null;
}

export function createRecognizer(onResult: (transcript: string) => void, onEnd: () => void, onError: () => void): SpeechRecognitionLike | null {
  const Ctor = getRecognitionCtor();
  if (!Ctor) return null;
  const rec = new Ctor();
  rec.lang = "pt-BR";
  rec.continuous = false;
  rec.interimResults = false;
  rec.onresult = (e) => onResult(e.results[0][0].transcript.toLowerCase().trim());
  rec.onerror = () => onError();
  rec.onend = () => onEnd();
  return rec;
}

/** Comandos reconhecidos e a que ação (chave) cada frase corresponde. */
export const VOICE_COMMANDS: { phrases: string[]; action: string }[] = [
  { phrases: ["ler", "começar leitura", "iniciar leitura"], action: "ler" },
  { phrases: ["pausar", "pausa"], action: "pausar" },
  { phrases: ["continuar", "retomar"], action: "continuar" },
  { phrases: ["parar", "parar leitura"], action: "parar" },
  { phrases: ["próxima lição", "próxima"], action: "proxima" },
  { phrases: ["lição anterior", "anterior"], action: "anterior" },
  { phrases: ["concluir lição", "concluir"], action: "concluir" },
  { phrases: ["voltar"], action: "voltar" },
];

/** Interpreta o texto reconhecido e devolve a ação correspondente, ou null se não reconhecer. */
export function matchVoiceCommand(transcript: string): string | null {
  for (const cmd of VOICE_COMMANDS) {
    if (cmd.phrases.some((p) => transcript.includes(p))) return cmd.action;
  }
  return null;
}
