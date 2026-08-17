"use client";
import { useRef, useState, useEffect } from "react";
import { useRadioPlayer } from "./RadioPlayerContext";

export function RadioPlayer({ churchId }: { churchId?: string }): React.ReactNode = {
  const { isPlaying, currentTitle, isLive, streamUrl, volume, togglePlay, setVolume, seek, stop } = useRadioPlayer();
  const [expanded, setExpanded] = useState(false);
  const [episode, setEpisode] = useState<{ url: string; title: string; cover: string } | null>(null);

  useEffect(() => {
    const audio = new Audio(streamUrl ?? "");
    audio.volume = volume;

    const handleTimeUpdate = () => {
      seek(audio.currentTime);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    return () => audio.removeEventListener("timeupdate", handleTimeUpdate);
  }, [streamUrl, volume, seek]);

  return (
    <div>
      <button onClick={togglePlay} className="p-2 rounded bg-white/20">
        {isPlaying ? "⏸️" : "▶️"}
      </button>
      <span className="text-white/90 text-sm">{currentTitle || "Rádio Web"}</span>
      {isLive && <span className="text-red-400 text-xs">AO VIVO</span>}
      <button onClick={() => setExpanded(true)} className="ml-2 text-sm text-gold hover:text-white">Expandir</button>
      <span className="text-white/60 text-xs">🔊{volume.toFixed(1)}</span>
    </div>
  );
};