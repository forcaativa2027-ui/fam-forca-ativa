"use client";
import { useEffect, useRef, useState } from "react";
import { Box, Download, ExternalLink, ZoomIn } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useMyProfile, usePlaybackProgress } from "@/hooks/use-queries";
import * as Kl from "@/services/knowledgeLibrary";
import type { KnowledgeObject } from "@/types/domain";

/**
 * CEC Academy Bloco 5 — Player Unificado. Um componente só que se
 * adapta ao tipo de mídia (vídeo, áudio, PDF, imagem, modelo 3D),
 * com capítulos, legendas, audiodescrição, velocidade e
 * continuidade (retoma de onde parou).
 */
export function UnifiedMediaPlayer({ object }: { object: KnowledgeObject }) {
  const { data: me } = useMyProfile();
  const { data: progress } = usePlaybackProgress(me?.id ?? null, object.id);
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null);
  const [useAudioDescription, setUseAudioDescription] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);
  const url = object.storage_url || object.external_url;

  // Retoma de onde parou, assim que o progresso salvo carregar
  useEffect(() => {
    if (mediaRef.current && progress?.position_seconds) {
      mediaRef.current.currentTime = progress.position_seconds;
    }
  }, [progress]);

  function persistProgress(finished = false) {
    if (!me?.id || !mediaRef.current) return;
    Kl.savePlaybackProgress(supabase, me.id, object.id, mediaRef.current.currentTime, mediaRef.current.playbackRate, finished);
  }

  // Salva a posição periodicamente (a cada 10s de reprodução) e ao pausar/sair
  useEffect(() => {
    const id = setInterval(() => { if (mediaRef.current && !mediaRef.current.paused) persistProgress(); }, 10000);
    return () => { clearInterval(id); persistProgress(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [object.id]);

  if (!url && object.object_type !== "modelo_3d") {
    return <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">Nenhum arquivo disponível pra esse objeto.</p>;
  }

  if (object.object_type === "video") {
    return (
      <div className="space-y-2">
        <video
          ref={mediaRef as React.RefObject<HTMLVideoElement>}
          src={useAudioDescription && object.audio_description_url ? object.audio_description_url : url ?? undefined}
          controls className="w-full rounded-lg bg-black"
          onPause={() => persistProgress()}
          onEnded={() => persistProgress(true)}
        >
          {object.subtitles_url && <track kind="subtitles" src={object.subtitles_url} srcLang="pt" label="Português" default />}
        </video>
        {object.audio_description_url && (
          <button onClick={() => setUseAudioDescription((v) => !v)} className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${useAudioDescription ? "border-gold bg-gold/10 text-navy" : "text-muted-foreground"}`}>
            {useAudioDescription ? "✓ " : ""}Audiodescrição
          </button>
        )}
        {object.chapters && object.chapters.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {object.chapters.map((c, i) => (
              <button key={i} onClick={() => { if (mediaRef.current) mediaRef.current.currentTime = c.time_seconds; }}
                className="rounded-full border bg-card px-2 py-1 text-[11px] text-navy hover:border-gold/50">
                {c.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (object.object_type === "podcast" || object.object_type === "biblia") {
    return (
      <div className="space-y-2">
        <audio
          ref={mediaRef as React.RefObject<HTMLAudioElement>}
          src={useAudioDescription && object.audio_description_url ? object.audio_description_url : url ?? undefined}
          controls className="w-full"
          onPause={() => persistProgress()}
          onEnded={() => persistProgress(true)}
        />
        {object.audio_description_url && (
          <button onClick={() => setUseAudioDescription((v) => !v)} className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${useAudioDescription ? "border-gold bg-gold/10 text-navy" : "text-muted-foreground"}`}>
            {useAudioDescription ? "✓ " : ""}Faixa alternativa
          </button>
        )}
      </div>
    );
  }

  if (object.object_type === "pdf") {
    return (
      <div className="space-y-2">
        <iframe src={url ?? undefined} className="h-[480px] w-full rounded-lg border" title={object.title} />
        {object.download_allowed && url && (
          <a href={url} download className="flex w-fit items-center gap-1.5 text-xs font-semibold text-navy hover:underline"><Download className="h-3.5 w-3.5" />Baixar PDF</a>
        )}
      </div>
    );
  }

  if (object.object_type === "imagem" || object.object_type === "mapa" || object.object_type === "infografico") {
    return (
      <>
        <button onClick={() => setZoomOpen(true)} className="relative block w-full overflow-hidden rounded-lg border">
          <img src={url ?? undefined} alt={object.title} className="w-full object-contain" />
          <span className="absolute bottom-2 right-2 rounded-full bg-navy/80 p-1.5 text-white"><ZoomIn className="h-3.5 w-3.5" /></span>
        </button>
        {zoomOpen && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/90 p-4" onClick={() => setZoomOpen(false)}>
            <img src={url ?? undefined} alt={object.title} className="max-h-full max-w-full object-contain" />
          </div>
        )}
      </>
    );
  }

  if (object.object_type === "modelo_3d") {
    // Visualização 3D completa (WebGL) fica pra uma próxima fase — por
    // ora, abre o modelo num visualizador externo (ex: Sketchfab) ou
    // baixa o arquivo, sem tentar renderizar 3D customizado aqui.
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-6 text-center">
        <Box className="h-10 w-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Modelo 3D — visualização completa ainda não disponível nesta versão.</p>
        {url && (
          <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm font-semibold text-navy hover:underline">
            <ExternalLink className="h-3.5 w-3.5" />Abrir modelo em nova aba
          </a>
        )}
      </div>
    );
  }

  // livro/artigo/apostila/plano_aula/questionário — sem player específico, link simples
  return url ? (
    <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm font-semibold text-navy hover:underline">
      <ExternalLink className="h-3.5 w-3.5" />Abrir {object.title}
    </a>
  ) : null;
}
