"use client";
import { useState } from "react";
import { Play, Pause, Volume2, VolumeX, Radio, ChevronUp } from "lucide-react";
import { useRadioPlayer } from "@/contexts/RadioPlayerContext";
import { useRouter } from "next/navigation";

export function MiniPlayer() {
  const { state, toggle, mute, unmute } = useRadioPlayer();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  if (!state.currentTrack) return null;

  return (
    <div className="fixed bottom-16 left-0 right-0 z-50 bg-navy text-white px-4 py-2 shadow-lg border-t border-gold/20">
      <div className="flex items-center justify-between gap-3">
        <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-2 flex-1 min-w-0">
          {state.isLive && (
            <span className="shrink-0 flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold uppercase">
              <Radio className="h-3 w-3" />AO VIVO
            </span>
          )}
          <div className="min-w-0 text-left">
            <p className="text-sm font-semibold truncate">{state.currentTrack.title}</p>
            {state.currentTrack.artist && (
              <p className="text-xs text-white/60 truncate">{state.currentTrack.artist}</p>
            )}
          </div>
        </button>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={toggle} className="p-2 rounded-full bg-gold/20 hover:bg-gold/30 transition">
            {state.isPlaying ? <Pause className="h-4 w-4 text-gold" /> : <Play className="h-4 w-4 text-gold" />}
          </button>
          <button onClick={() => state.isMuted ? unmute() : mute()} className="text-white/60 hover:text-white">
            {state.isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <button onClick={() => router.push("/radio")} className="text-white/60 hover:text-gold">
            <ChevronUp className="h-4 w-4" />
          </button>
        </div>
      </div>
      {expanded && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <p className="text-xs text-white/50">Rádio Web — Navegue livremente, o áudio continua.</p>
        </div>
      )}
    </div>
  );
}