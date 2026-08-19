"use client";
import { useEffect, useState } from "react";
import { Play, Pause, Loader2 } from "lucide-react";
import { useRadioConfig, useWhatsOnAir } from "@/hooks/use-queries";
import { useRadioPlayer } from "@/components/radio/RadioPlayerContext";
import { ShareButtons, radioBaseUrl } from "@/components/radio/ShareButtons";

export default function RadioEmbedPage() {
  const { data: config = null } = useRadioConfig(undefined);
  const { data: onAir } = useWhatsOnAir(null);
  const player = useRadioPlayer();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  const streamUrl = onAir?.stream_url ?? config?.stream_url ?? null;
  const liveTitle = onAir?.title ?? config?.display_name ?? "Rádio Web";
  const cover = onAir ? null : config?.logo_url ?? null;
  const embedUrl = `${radioBaseUrl()}/radio/embed`;

  const toggle = () => {
    if (player.isPlaying && player.isLive) {
      player.pause();
      return;
    }
    if (streamUrl) {
      player.playStream(streamUrl, liveTitle, cover ?? undefined);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-navy to-navy/90 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-gold/40 bg-background p-6 shadow-2xl">
        <div className="flex items-center gap-3">
          {config?.logo_url && (
            <img src={config.logo_url} alt={config.display_name} className="h-10 w-10 rounded-full object-cover" />
          )}
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-gold">
              {onAir?.host_name ? "No ar" : config?.display_name ?? "Rádio Web"}
            </p>
            <h1 className="truncate font-display text-lg font-bold text-navy">{liveTitle}</h1>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-4">
          <button
            onClick={toggle}
            disabled={!ready || !streamUrl}
            aria-label={player.isPlaying && player.isLive ? "Pausar" : "Tocar"}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-gold text-navy shadow-lg transition hover:bg-gold/90 disabled:opacity-50"
          >
            {!ready || (player.streamStatus === "loading" && !player.isPlaying) ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : player.isPlaying && player.isLive ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="ml-0.5 h-6 w-6" />
            )}
          </button>
          <div className="min-w-0 flex-1 text-sm text-muted">
            {!streamUrl ? (
              <p>Transmissão indisponível no momento.</p>
            ) : player.isPlaying && player.isLive ? (
              <p className="font-semibold text-green-600">Ao vivo agora</p>
            ) : (
              <p>Clique para ouvir ao vivo</p>
            )}
          </div>
        </div>

        <div className="mt-5 border-t border-gold/20 pt-4">
          <ShareButtons title={liveTitle} url={embedUrl} compact />
        </div>
      </div>
    </div>
  );
}