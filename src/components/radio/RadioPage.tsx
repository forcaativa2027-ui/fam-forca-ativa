"use client";
import { useState, useEffect } from "react";
import { useRadioPlayer } from "./RadioPlayerContext";
import { listRadioPrograms, listRadioEpisodes, getRadioConfig } from "@/services/radio";
import { useRadioConfig, useRadioPrograms, useRadioEpisodes } from "@/hooks/use-queries";
import { ChurchIcon } from "lucide-react";

interface Program {
  id: string;
  title: string;
  description: string | null;
  host_name: string | null;
  cover_url: string | null;
  weekday: string | null;
  start_time: string | null;
  end_time: string | null;
  is_recurring: boolean;
  is_active: boolean;
  sort_order: number;
}

interface Episode {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  audio_url: string;
  duration_seconds: number | null;
  category: string | null;
  speaker: string | null;
  published_at: string | null;
  status: "draft" | "published" | "archived";
  is_featured: boolean;
  sort_order: number;
}

export function RadioPage() {
  const [churchId, setChurchId] = useState<string | undefined>(undefined);
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [showPlayer, setShowPlayer] = useState(false);

  const { data: config = null } = useRadioConfig(churchId);
  const { data: programs = [] } = useRadioPrograms(churchId);
  const { data: episodes = [], isLoading } = useRadioEpisodes(churchId, category);

  const player = useRadioPlayer();

  useEffect(() => {
    if (config?.stream_url) {
      player.playStream(config.stream_url, config.display_name ?? "Rádio Web", config.logo_url ?? null);
    }
  }, [config, player]);

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
                  <div key={p.id} className="p-4 rounded-xl border border-gold/30 hover:border-gold">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-navy">{p.title}</span>
                      {p.is_recurring && (
                        <span className="text-xs bg-gold/10 text-gold px-2 py-1 rounded">Recorrente</span>
                      )}
                    </div>
                    {p.description && (
                      <p className="mt-1 text-sm text-muted line-clamp-2">{p.description}</p>
                    )}
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted">
                      {p.weekday && <span>{WEEKDAY_LABELS[p.weekday as keyof typeof WEEKDAY_LABELS]}:</span>}
      <span>{p.start_time?.slice(0, 5) || "—"} – {p.end_time?.slice(0, 5) || "—"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Episódios (direita) */}
          <div>
            <h2 className="font-display text-2xl font-bold text-navy">Episódios</h2>
            {isLoading && (
              <p className="text-muted py-4">Carregando...</p>
            )}
            {episodes.length === 0 && (
              <p className="text-muted py-4">Nenhum episódio disponível.</p>
            )}
            <div className="space-y-3">
              {episodes.map((e) => (
                <div key={e.id} className="p-4 rounded-xl border border-gray-200 hover:border-gold transition-colors">
                  <div className="flex items-center gap-3">
                    {e.is_featured && (
                      <span className="text-xs bg-gold/10 text-gold px-2 py-1 rounded">Destacado</span>
                    )}
                    <span className="text-sm font-medium text-navy">{e.title}</span>
                  </div>
                  {e.description && (
                    <p className="mt-1 text-sm text-muted line-clamp-2">{e.description}</p>
                  )}
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted">
                    {e.speaker && <span>{e.speaker}</span>}
                    {e.published_at && (
                      <span>
                        {new Date(e.published_at).toLocaleDateString("pt-BR")}
                        {e.category && <span>{e.category}</span>}
                      </span>
                    )}
                  </div>
                  {e.audio_url && (
                    <button
                      onClick={() => {
                        player.playEpisode(e.audio_url, e.title, e.cover_url ?? null);
                        setShowPlayer(true);
                      }}
                      className="mt-2 w-full py-2 rounded bg-gold text-navy font-semibold text-sm"
                    >
                      Tocar
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const WEEKDAY_LABELS: Record<string, string> = {
  domingo: "Domingo", segunda: "Segunda", terca: "Terça",
  quarta: "Quarta", quinta: "Quinta", sexta: "Sexta", sabado: "Sábado",
};