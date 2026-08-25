"use client";
import { useState } from "react";
import { Play, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useRadioPlayer } from "./RadioPlayerContext";
import { registerRadioPlay } from "@/services/radio";

export function EpisodePlayButton({
  episodeId,
  title,
  coverUrl,
  audioUrl,
}: {
  episodeId: string;
  title: string;
  coverUrl?: string | null;
  audioUrl: string;
}) {
  const player = useRadioPlayer();
  const [loading, setLoading] = useState(false);

  const play = () => {
    setLoading(true);
    registerRadioPlay(supabase, { church_id: null, episode_id: episodeId, source: "episode" })
      .catch(() => undefined)
      .finally(() => {
        player.playEpisode(audioUrl, title, coverUrl ?? undefined);
        setLoading(false);
      });
  };

  return (
    <button
      onClick={play}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-xl bg-gold px-5 py-2.5 text-sm font-semibold text-navy transition hover:bg-gold/90 disabled:opacity-60"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
      {player.isPlaying && player.currentTitle === title ? "Reproduzindo..." : "Ouvir agora"}
    </button>
  );
}