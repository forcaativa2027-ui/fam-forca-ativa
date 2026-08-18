
"use client";
import { useState, useEffect } from "react";
import { useRadioPlayer } from "./RadioPlayerContext";
import { useRadioConfig } from "@/hooks/use-queries";
import { useRadioPrograms, useRadioEpisodes } from "@/services/radio";
import { useToggleFavorite, useRadioFavorites } from "@/hooks/use-radio-favorites";
import { BookOpen, Music, Heart, Newspaper, Mic2 } from "lucide-react";

// Removido interface Program complexo - usando tipos simples

export default function RadioPage() {
  const { isPlaying, currentTitle, isLive } = useRadioPlayer();
  const { data: config, isLoading: configLoading } = useRadioConfig();
  
  // Tipos simplificados - qualquer programa
  const [programs, setPrograms] = useState<Array<{
    id: string;
    title: string;
    description: string;
    host_name: string;
    category: string;
  }]([]);
  
  const [episodes, setEpisodes] = useState<Array<{
    id: string;
    title: string;
    description: string;
    audio_url: string;
  }[]>([]);
  
  const { data: favorites, isFavorite } = useRadioFavorites(
    typeof window !== "undefined" ? window.userId : null
  );
  const { toggleFavorite } = useToggleFavorite(
    typeof window !== "undefined" ? window.userId : null
  );

  useEffect(() => {
    // Buscar programs do banco
    // ...
  }, []);

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto max-w-7xl">
        <header className="mb-8">
          <h1 className="font-display text-3xl font-bold text-navy">Rádio Web</h1>
          {config && (
            <p className="mt-2 text-muted">{config.display_name || "Rádio Web"}</p>
          )}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Configuração e Programação (esquerda) */}
          <div className="lg:col-span-2 space-y-6">

            {/* Config da rádio */}
            {config && (
              <div className="bg-card p-6 rounded-xl border border-gold/30">
                <div className="flex items-center gap-4">
                  {config.logo_url && (
                    <img src={config.logo_url} alt={config.display_name} className="h-12 w-12 rounded object-cover" />
                  )}
                  <div>
                    <h2 className="font-display text-xl font-bold text-navy">{config.display_name}</h2>
                    {config.short_name && (
                      <p className="text-sm text-muted">{config.short_name}</p>
                    )}
                  </div>
                </div>
                <p className="mt-2 text-sm text-muted">{config.description || "Sem descrição"}.</p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button onClick={() => setShowPlayer(true)} className="flex-1 py-2 rounded bg-gold text-navy font-semibold">Tocar AO VIVO</button>
                  <button onClick={() => setShowPlayer(false)} className="py-2 rounded border border-gold text-navy font-semibold">Player</button>
                </div>
              </div>
            )}

            {/* Programação */}
            <div>
              <h2 className="font-display text-2xl font-bold text-navy">Programação</h2>
              {programs.length === 0 && (
                <p className="text-muted">Nenhum programa cadastrado.</p>
              )}
              <div className="space-y-3">
                {programs.map((p) => (
                  <div key={p.id} className="p-4 rounded-xl border border-gray-200 hover:border-gold transition-colors">
                    <div className="flex items-center gap-3">
                      <Heart className="shrink-0 h-4 w-4 text-red-500" />
                      <span className="text-sm font-medium text-navy">{p.title}</span>
                    </div>
                    <p className="text-xs text-muted">{p.description}</p>
                    <div className="text-xs text-gray-400">
                      {p.weekday && `<span>{weekday}:</span>`}
                      <span>{p.start_time?.slice(0, 5) || "—"} – {p.end_time?.slice(0, 5) || "—"}</span>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Heart className="shrink-0 h-4 w-4 text-red-500" />
                    <span className="text-xs text-gray-300">{favorites.some((f) => f.program_id === /* program id */) ? "Favoritado" : "Favoritar"}</span>
                    <button
                      onClick={() => toggleFavorite(window.userId!, /* program id */)}
                      className="text-xs text-gray-400 hover:text-red-500"
                      title="Favoritar"
                    >
                      ❤
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Episódios */}
          <div>
            <h2 className="font-display text-2xl font-bold text-navy">Episódios</h2>
            {episodes.length === 0 && (
              <p className="text-muted py-4">Nenhum episódio disponível.</p>
            )}
            <div className="space-y-3">
              {episodes.map((e) => (
                <div key={e.id} className="p-4 rounded-xl border border-gray-200 hover:border-gold transition-colors">
                  <div className="flex items-center gap-3">
                    <Heart className="shrink-0 h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium text-navy">{e.title}</span>
                  </div>
                  <p className="text-sm text-muted">{e.description}</p>
                  <button
                    onClick={() => player.playEpisode(e.audio_url, e.title)}
                    className="mt-2 w-full py-2 rounded bg-gold text-navy font-semibold text-sm"
                    title="Tocar episódio"
                  >
                    Tocar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

}
