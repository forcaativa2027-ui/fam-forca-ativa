"use client";
import { useRadioPlayer } from "./RadioPlayerContext";

export default function RadioPage() {
  const { isPlaying, currentTitle } = useRadioPlayer();
  return (
    <div>
      <h1>Rádio Web</h1>
      <p>Status: {isPlaying ? "Tocando" : "Parado"}</p>
      <p>{currentTitle || "Sem título"}</p>
    </div>
  );
}
