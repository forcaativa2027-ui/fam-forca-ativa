"use client";

import { useRadioPlayer } from "./RadioPlayerContext";

export default function RadioPage() {
  const { isPlaying, currentTitle } = useRadioPlayer();
  
  return (
    <div>
      <h1 className="text-3xl font-bold">Rádio Web</h1>
      <button className="p-2 rounded bg-white/20">
        {isPlaying ? "⏸️" : "▶️"}
      </button>
      <span className="text-white/90 text-sm">{currentTitle || "Rádio Web"}</span>
    </div>
  );
}
