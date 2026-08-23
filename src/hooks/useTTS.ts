"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import * as Tts from "@/services/tts";
import { getUserPreferences, upsertUserPreferences } from "@/services/accessibility";

export type TTSStatus = "idle" | "speaking" | "paused" | "stopped";

export interface TTSBlock {
  id: string;    // identifica o bloco (ex: "content_main", "content_reflexao")
  label: string; // rótulo amigável (ex: "Conteúdo principal")
  text: string;
}

/**
 * CEC Academy Bloco 6 — Hook de Leitura Assistida. Lê uma fila de
 * blocos de texto em sequência (objetivo → conteúdo → reflexão →
 * ...), com destaque de sentença sincronizado e persistência das
 * preferências (velocidade, voz, destacar) em user_preferences.extra.
 */
export function useTTS(profileId: string | null) {
  const [status, setStatus] = useState<TTSStatus>("idle");
  const [blocks, setBlocks] = useState<TTSBlock[]>([]);
  const [blockIndex, setBlockIndex] = useState(0);
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [rate, setRateState] = useState(1);
  const [voiceURI, setVoiceURIState] = useState<string | null>(null);
  const [highlightEnabled, setHighlightEnabled] = useState(true);
  const sentencesRef = useRef<string[]>([]);
  const supported = Tts.isTTSSupported();

  // Carrega preferências salvas (velocidade, voz, destacar)
  useEffect(() => {
    if (!profileId) return;
    getUserPreferences(supabase, profileId).then((prefs) => {
      const extra = prefs?.extra ?? {};
      if (typeof extra.tts_rate === "number") setRateState(extra.tts_rate);
      if (typeof extra.tts_voice === "string") setVoiceURIState(extra.tts_voice);
      if (typeof extra.tts_highlight === "boolean") setHighlightEnabled(extra.tts_highlight);
    });
  }, [profileId]);

  function persist(patch: Record<string, unknown>) {
    if (!profileId) return;
    getUserPreferences(supabase, profileId).then((prefs) => {
      upsertUserPreferences(supabase, profileId, { extra: { ...(prefs?.extra ?? {}), ...patch } });
    });
  }

  const speakBlock = useCallback((bIndex: number, blockList: TTSBlock[]) => {
    if (bIndex >= blockList.length) { setStatus("idle"); return; }
    const block = blockList[bIndex];
    const sentences = Tts.splitIntoSentences(block.text);
    sentencesRef.current = sentences;
    setSentenceIndex(0);
    Tts.speakText(block.text, {
      rate, voiceURI,
      onStart: () => setStatus("speaking"),
      onBoundary: (charIndex) => {
        // Descobre em qual sentença esse caractere cai, pra destacar ela
        let acc = 0;
        for (let i = 0; i < sentences.length; i++) {
          acc += sentences[i].length + 1;
          if (charIndex < acc) { setSentenceIndex(i); break; }
        }
      },
      onEnd: () => {
        const next = bIndex + 1;
        setBlockIndex(next);
        speakBlock(next, blockList);
      },
      onError: () => setStatus("stopped"),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rate, voiceURI]);

  function read(newBlocks: TTSBlock[]) {
    if (!supported) return;
    Tts.stopSpeech();
    setBlocks(newBlocks);
    setBlockIndex(0);
    speakBlock(0, newBlocks);
  }

  function pause() { Tts.pauseSpeech(); setStatus("paused"); }
  function resume() { Tts.resumeSpeech(); setStatus("speaking"); }
  function stop() { Tts.stopSpeech(); setStatus("stopped"); setBlockIndex(0); setSentenceIndex(0); }

  function setRate(r: number) { setRateState(r); persist({ tts_rate: r }); }
  function setVoiceURI(v: string | null) { setVoiceURIState(v); persist({ tts_voice: v }); }
  function toggleHighlight() { setHighlightEnabled((v) => { persist({ tts_highlight: !v }); return !v; }); }

  useEffect(() => () => Tts.stopSpeech(), []); // para a leitura se sair da tela

  return {
    supported, status, blocks, blockIndex, sentenceIndex,
    currentBlockId: blocks[blockIndex]?.id ?? null,
    rate, voiceURI, highlightEnabled,
    read, pause, resume, stop, setRate, setVoiceURI, toggleHighlight,
  };
}
