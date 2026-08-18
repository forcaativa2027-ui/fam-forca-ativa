"use client";
import { useRef, useState, useEffect } from "react";
import { useRadioPlayer } from "./RadioPlayerContext";
import { Volume2, VolumeX, RotateCcw, ChevronUp, Play, Pause, Radio } from "lucide-react";

export function RadioMiniPlayer() {
  const { isPlaying, currentTitle, isLive, volume, hasError, errorMessage, togglePlay, setVolume, retry } = useRadioPlayer();
  const [expanded, setExpanded] = useState(false);
  const [muted, setMuted] = useState(false);
  const prevVolume = useRef(1);

  function handleVolumeToggle() {
    if (muted) {
      setVolume(prevVolume.current);
      setMuted(false);
    } else {
      prevVolume.current = volume;
      setVolume(0);
      setMuted(true);
    }
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 bg-navy/90 shadow-[0_-2px_10px_rgba(0,0,0,0.15)] backdrop-blur">
      <div className="p-4 flex items-center gap-3">
        <button
          onClick={togglePlay}
          aria-label={isPlaying ? "Pausar" : "Reproduzir"}
          className="p-2 rounded bg-white/20 hover:bg-white/30 transition"
        >
          {isPlaying ? <Pause className="h-4 w-4 text-white" /> : <Play className="h-4 w-4 text-white" />}
        </button>
        <span className="text-white/90 text-sm truncate flex-1">{hasError ? "Erro na reprodução" : (currentTitle || "Rádio Web")}</span>
        {isLive && !hasError && (
          <span className="flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
            <Radio className="h-3 w-3" /> Ao vivo
          </span>
        )}
        {hasError && (
          <button
            onClick={retry}
            aria-label="Tentar novamente"
            className="flex items-center gap-1 rounded-full bg-gold px-2.5 py-1 text-xs font-semibold text-navy hover:bg-gold/90"
          >
            <RotateCcw className="h-3 w-3" /> Tentar de novo
          </button>
        )}
        <button
          onClick={handleVolumeToggle}
          aria-label={muted ? "Ativar som" : "Silenciar"}
          className="p-2 rounded text-white/80 hover:bg-white/10 transition"
        >
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
        <button onClick={() => setExpanded(!expanded)} aria-label="Expandir" className="text-sm text-gold hover:text-white">
          <ChevronUp className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>
      </div>
      {expanded && (
        <div className="border-t border-white/10 px-4 py-3 space-y-3">
          {hasError && errorMessage && <p className="text-xs text-red-300">{errorMessage}</p>}
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/60">Volume</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={(e) => { setVolume(Number(e.target.value)); setMuted(Number(e.target.value) === 0); }}
              aria-label="Volume"
              className="flex-1 accent-gold"
            />
            <span className="text-xs text-white/60 w-8 text-right">{Math.round((muted ? 0 : volume) * 100)}%</span>
          </div>
          <p className="text-xs text-white/50">Rádio Web — navegue livremente, o áudio continua.</p>
        </div>
      )}
    </div>
  );
}