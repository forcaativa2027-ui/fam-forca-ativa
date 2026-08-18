"use client";
import { useRef, useState, useEffect } from "react";
import { useRadioPlayer } from "./RadioPlayerContext";

export function RadioMiniPlayer() {
  const { isPlaying, currentTitle, isLive, volume, togglePlay, setVolume } = useRadioPlayer();
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 bg-navy/80 shadow-[0_-2px_10px_rgba(0,0,0,0.15)]">
      <div className="p-4 flex items-center gap-3">
        <button onClick={togglePlay} className="p-2 rounded bg-white/20">
          {isPlaying ? "⏸️" : "▶️"}
        </button>
        <span className="text-white/90 text-sm">{currentTitle || "Rádio Web"}</span>
        {isLive && <span className="text-red-400 text-xs">AO VIVO</span>}
        <button onClick={() => setExpanded(true)} className="ml-2 text-sm text-gold hover:text-white">Expandir</button>
        <span className="text-white/60 text-xs">🔊{volume.toFixed(1)}</span>
      </div>
    </div>
  );
}