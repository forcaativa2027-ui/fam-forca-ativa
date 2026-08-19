"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import { useRadioPlayer } from "./RadioPlayerContext";
import { listRadioPrograms, listRadioEpisodes, getRadioConfig } from "@/services/radio";
import { useRadioConfig, useRadioPrograms, useRadioEpisodes, useWhatsOnAir } from "@/hooks/use-queries";
import { InstallRadioButton } from "@/components/public/InstallRadioButton";
import { Share2 } from "lucide-react";

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

export function RadioPage({ churchId: initialChurchId }: { churchId?: string } = {}) {
  const [churchId] = useState<string | undefined>(initialChurchId ?? undefined);
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [showPlayer, setShowPlayer] = useState(false);

  const { data: config = null } = useRadioConfig(churchId);
  const { data: programs = [] } = useRadioPrograms(churchId);
  const { data: episodes = [], isLoading } = useRadioEpisodes(churchId, category);
  const { data: onAir } = useWhatsOnAir(churchId ?? null);

  const player = useRadioPlayer();
  const autoPlayedRef = useRef(false);

  // Broadcast Engine — decide o que está no ar agora (seção 5 do RADIO-002)
  useEffect(() => {
    if (!config || autoPlayedRef.current) return;
    if (!onAir) {
      // Sem programa vigente: mantém a stream configurada (fallback global)
      if (config.stream_url) player.playStream(config.stream_url, config.display_name ?? "Rádio Web", config.logo_url ?? undefined);
      autoPlayedRef.current = true;
      return;
    }
    // AO VIVO / HÍBRIDO → stream ao vivo
    if ((onAir.mode === "ao_vivo" || onAir.mode === "hibrido") && (onAir.stream_url || config.stream_url)) {
      player.playStream(onAir.stream_url ?? config.stream_url ?? "", onAir.title, config.logo_url ?? undefined);
      autoPlayedRef.current = true;
      return;
    }
    // AUTOMÁTICO / GRAVADO → fallback_url ou stream configurada
    const source = onAir.fallback_url || config.stream_url;
    if (source) {
      player.playStream(source, onAir.title, config.logo_url ?? undefined);
      autoPlayedRef.current = true;
    }
  }, [config, onAir, player]);

  const liveProgram = useMemo(() => {
    const today = WEEKDAY_KEYS[new Date().getDay()];
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    return programs.find((p) => {
      if (!p.weekday || p.weekday !== today || !p.start_time) return false;
      const start = toMinutes(p.start_time);
      if (p.end_time) {
        const end = toMinutes(p.end_time);
        return end >= start ? nowMin >= start && nowMin < end : nowMin >= start || nowMin < end;
      }
      return nowMin >= start;
    }) ?? null;
  }, [programs]);

  const nextProgram = useMemo(() => {
    const today = WEEKDAY_KEYS[new Date().getDay()];
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const laterToday = programs
      .filter((p) => p.weekday === today && p.start_time && toMinutes(p.start_time) > nowMin)
      .sort((a, b) => toMinutes(a.start_time!) - toMinutes(b.start_time!));
    if (laterToday.length > 0) return laterToday[0];
    for (let d = 1; d <= 7; d++) {
      const day = WEEKDAY_KEYS[(now.getDay() + d) % 7];
      const next = programs
        .filter((p) => p.weekday === day && p.start_time)
        .sort((a, b) => toMinutes(a.start_time!) - toMinutes(b.start_time!));
      if (next.length > 0) return { ...next[0], weekday: day };
    }
    return null;
  }, [programs]);

  async function handleShare() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Rádio Web", text: "Ouça a rádio da nossa comunidade", url });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      // compartilhamento cancelado ou indisponível — ignora
    }
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto max-w-7xl">
        <header className="mb-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold text-navy">Rádio Web</h1>
              {config && (
                <p className="mt-2 text-muted">{config.display_name || "Rádio Web"}</p>
              )}
            </div>
            <button
              onClick={handleShare}
              aria-label="Compartilhar Rádio Web"
              className="p-3 rounded-xl border border-gold/30 text-navy hover:bg-gold/10 transition"
            >
              <Share2 className="h-5 w-5" />
            </button>
          </div>
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
                <div className="mt-4">
                  <InstallRadioButton />
                </div>
              </div>
            )}

            {/* Agora no Ar / Próximo */}
            {((onAir && onAir.title) || liveProgram || nextProgram) && (
              <div className="space-y-3">
                {(onAir || liveProgram) && (
                  <div className="rounded-xl border-2 border-red-200 bg-red-50 p-4">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1.5 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white uppercase">
                        <span className="h-2 w-2 rounded-full bg-white animate-pulse" /> Agora no ar
                      </span>
                      {onAir?.mode && (
                        <span className="rounded-full bg-navy/10 px-2 py-0.5 text-[10px] font-bold uppercase text-navy">
                          {MODE_LABELS[onAir.mode]}
                        </span>
                      )}
                    </div>
                    <h3 className="mt-2 font-display text-lg font-bold text-navy">{onAir?.title ?? liveProgram?.title}</h3>
                    {(onAir?.host_name || liveProgram?.host_name) && (
                      <p className="text-sm text-muted">com {onAir?.host_name ?? liveProgram?.host_name}</p>
                    )}
                    {(onAir?.description || liveProgram?.description) && (
                      <p className="mt-1 text-sm text-muted line-clamp-2">{onAir?.description ?? liveProgram?.description}</p>
                    )}
                    <div className="mt-2 text-xs text-muted">
                      {onAir?.weekday ? `${WEEKDAY_LABELS[onAir.weekday as keyof typeof WEEKDAY_LABELS]}, ` : ""}
                      {onAir?.start_time?.slice(0, 5) ?? liveProgram?.start_time?.slice(0, 5)} – {onAir?.end_time?.slice(0, 5) ?? liveProgram?.end_time?.slice(0, 5) ?? "—"}
                    </div>
                  </div>
                )}
                {nextProgram && (
                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                    <p className="text-xs font-bold uppercase text-blue-600">Próximo</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-sm font-semibold text-navy">{nextProgram.title}</span>
                      {nextProgram.weekday !== WEEKDAY_KEYS[new Date().getDay()] && (
                        <span className="text-xs text-muted">{WEEKDAY_LABELS[nextProgram.weekday as keyof typeof WEEKDAY_LABELS]}</span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted">{nextProgram.start_time?.slice(0, 5)}</p>
                  </div>
                )}
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
                        player.playEpisode(e.audio_url, e.title, e.cover_url ?? undefined);
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

const WEEKDAY_KEYS = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];

const MODE_LABELS: Record<string, string> = {
  automatico: "Automático", gravado: "Gravado", ao_vivo: "Ao vivo", hibrido: "Híbrido",
};

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export default RadioPage;