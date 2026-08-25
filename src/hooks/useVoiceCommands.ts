"use client";
import { useCallback, useRef, useState } from "react";
import * as Vc from "@/services/voiceCommands";

export type VoiceStatus = "desligado" | "ouvindo" | "processando" | "erro";

/**
 * CEC Academy Bloco 6 — Hook de Comandos de Voz. `onCommand` recebe
 * a ação reconhecida (ver VOICE_COMMANDS) — quem usa o hook decide
 * o que fazer com cada uma.
 */
export function useVoiceCommands(onCommand: (action: string) => void) {
  const [status, setStatus] = useState<VoiceStatus>("desligado");
  const [lastTranscript, setLastTranscript] = useState("");
  const recRef = useRef<ReturnType<typeof Vc.createRecognizer>>(null);
  const supported = Vc.isVoiceSupported();

  const listen = useCallback(() => {
    if (!supported) return;
    setStatus("ouvindo");
    const rec = Vc.createRecognizer(
      (transcript) => {
        setStatus("processando");
        setLastTranscript(transcript);
        const action = Vc.matchVoiceCommand(transcript);
        if (action) onCommand(action);
        setStatus("desligado");
      },
      () => setStatus((s) => (s === "processando" ? s : "desligado")),
      () => setStatus("erro"),
    );
    if (!rec) return;
    recRef.current = rec;
    rec.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onCommand]);

  function stopListening() {
    recRef.current?.abort();
    setStatus("desligado");
  }

  return { supported, status, lastTranscript, listen, stopListening };
}
