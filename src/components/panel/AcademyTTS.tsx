"use client";
import { Play, Pause, Square, Volume2, Mic, MicOff, Loader2, AlertCircle } from "lucide-react";
import { useTTS, type TTSBlock } from "@/hooks/useTTS";
import { useVoiceCommands, type VoiceStatus } from "@/hooks/useVoiceCommands";
import { splitIntoSentences } from "@/services/tts";
import { getAvailableVoices } from "@/services/tts";
import { useEffect, useState } from "react";

/**
 * CEC Academy Bloco 6 (ACA-B06-UI §4) — Controles de Leitura
 * Assistida: Ler, Pausar, Continuar, Parar, Velocidade, Voz.
 */
export function AcademyTTSControls({ tts, blocks }: { tts: ReturnType<typeof useTTS>; blocks: TTSBlock[] }) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    function load() { setVoices(getAvailableVoices()); }
    load();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.onvoiceschanged = load;
    }
  }, []);

  if (!tts.supported) {
    return (
      <p className="flex items-center gap-1.5 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        <AlertCircle className="h-3.5 w-3.5" />Leitura assistida não é suportada neste navegador.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-2.5">
      {tts.status === "idle" || tts.status === "stopped" ? (
        <button onClick={() => blocks.length > 0 && tts.read(blocks)} className="flex items-center gap-1.5 rounded-md bg-navy px-3 py-1.5 text-xs font-bold text-white">
          <Play className="h-3.5 w-3.5" />Ler
        </button>
      ) : tts.status === "speaking" ? (
        <button onClick={tts.pause} className="flex items-center gap-1.5 rounded-md bg-gold px-3 py-1.5 text-xs font-bold text-navy">
          <Pause className="h-3.5 w-3.5" />Pausar
        </button>
      ) : (
        <button onClick={tts.resume} className="flex items-center gap-1.5 rounded-md bg-navy px-3 py-1.5 text-xs font-bold text-white">
          <Play className="h-3.5 w-3.5" />Continuar
        </button>
      )}
      <button onClick={tts.stop} disabled={tts.status === "idle"} className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold text-muted-foreground disabled:opacity-40">
        <Square className="h-3.5 w-3.5" />Parar
      </button>

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Volume2 className="h-3.5 w-3.5" />
        <select value={tts.rate} onChange={(e) => tts.setRate(Number(e.target.value))} className="h-7 rounded border bg-background px-1 text-xs">
          <option value={0.75}>Lenta</option>
          <option value={1}>Normal</option>
          <option value={1.25}>Rápida</option>
          <option value={1.5}>Muito rápida</option>
        </select>
      </div>

      {voices.length > 0 && (
        <select value={tts.voiceURI ?? ""} onChange={(e) => tts.setVoiceURI(e.target.value || null)} className="h-7 max-w-[140px] rounded border bg-background px-1 text-xs">
          <option value="">Voz padrão</option>
          {voices.slice(0, 8).map((v) => <option key={v.voiceURI} value={v.voiceURI}>{v.name}</option>)}
        </select>
      )}

      <button onClick={tts.toggleHighlight} className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${tts.highlightEnabled ? "border-gold bg-gold/10 text-navy" : "text-muted-foreground"}`}>
        Destacar texto
      </button>
    </div>
  );
}

/** Renderiza um bloco de texto, destacando a sentença atual quando esse bloco está sendo lido. */
export function AcademyHighlightedText({ text, blockId, tts, className }: { text: string; blockId: string; tts: ReturnType<typeof useTTS>; className?: string }) {
  const isActiveBlock = tts.currentBlockId === blockId && tts.status !== "idle" && tts.status !== "stopped";
  if (!isActiveBlock || !tts.highlightEnabled) {
    return <p className={className}>{text}</p>;
  }
  const sentences = splitIntoSentences(text);
  return (
    <p className={className}>
      {sentences.map((s, i) => (
        <span key={i} className={i === tts.sentenceIndex ? "rounded bg-gold/30 px-0.5 text-navy" : ""}>{s}{" "}</span>
      ))}
    </p>
  );
}

const VOICE_STATUS_LABEL: Record<VoiceStatus, string> = {
  desligado: "Comandos de voz", ouvindo: "Ouvindo…", processando: "Processando…", erro: "Não entendi, tente de novo",
};

/**
 * CEC Academy Bloco 6 (ACA-B06-UI §5) — Botão de Comandos de Voz.
 * `onCommand` recebe a ação reconhecida ("ler", "pausar", "parar",
 * "proxima", "anterior", "concluir", "voltar").
 */
export function AcademyVoiceButton({ onCommand }: { onCommand: (action: string) => void }) {
  const vc = useVoiceCommands(onCommand);
  if (!vc.supported) return null;

  return (
    <button
      onClick={vc.status === "ouvindo" ? vc.stopListening : vc.listen}
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
        vc.status === "ouvindo" ? "border-red-400 bg-red-50 text-red-600" :
        vc.status === "erro" ? "border-amber-400 bg-amber-50 text-amber-700" :
        "border-border text-muted-foreground hover:border-gold/40"
      }`}
    >
      {vc.status === "ouvindo" ? <Mic className="h-3.5 w-3.5 animate-pulse" /> :
       vc.status === "processando" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> :
       vc.status === "erro" ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
      {VOICE_STATUS_LABEL[vc.status]}
    </button>
  );
}

export type { TTSBlock };
