"use client";
import { useState, useEffect } from "react";
import { Radio, Play, Clock, Calendar, Mic2, Heart, Newspaper, BookOpen, MessageSquare, Star, Music2, BookOpenCheck, Users } from "lucide-react";
import { useRadioPlayer } from "@/contexts/RadioPlayerContext";
import { useToast } from "@/components/shared/ToastProvider";

interface RadioProgram {
  id: string;
  title: string;
  description?: string;
  presenter?: string;
  category: string;
  start_time: string;
  end_time?: string;
  isLive: boolean;
  audioUrl: string;
  thumbnailUrl?: string;
}

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  pregacao: BookOpenCheck,
  louvor: Music2,
  devocional: Heart,
  noticia: Newspaper,
  entrevista: Mic2,
  estudo: BookOpen,
  mensagem: MessageSquare,
  especial: Star,
};

export function RadioPage() {
  const { state, play } = useRadioPlayer();
  const { toast } = useToast();
  const [programs, setPrograms] = useState<RadioProgram[]>([]);
  const [liveProgram, setLiveProgram] = useState<RadioProgram | null>(null);
  const [nextProgram, setNextProgram] = useState<RadioProgram | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("todos");

  useEffect(() => {
    loadRadioContent();
  }, []);

  async function loadRadioContent() {
    try {
      const { supabase } = await import("@/lib/supabase/client");
      const { data, error } = await supabase
        .from("radio_programs")
        .select("*")
        .eq("is_active", true)
        .order("start_time");

      if (error) throw error;

      const now = new Date().toISOString();
      const live = data.find(p => p.start_time <= now && (!p.end_time || p.end_time > now) && p.isLive);
      const next = data.find(p => p.start_time > now);

      setPrograms(data as RadioProgram[]);
      setLiveProgram(live ?? null);
      setNextProgram(next ?? null);
    } catch (e) {
      toast("error", "Erro ao carregar a Rádio", "Tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  }

  function handlePlay(program: RadioProgram) {
    play({
      id: program.id,
      title: program.title,
      artist: program.presenter,
      url: program.audioUrl,
      isLive: program.isLive,
      thumbnailUrl: program.thumbnailUrl,
    });
    toast("success", "Ouvindo agora", program.title);
  }

  const categories = ["todos", ...new Set(programs.map(p => p.category))];
  const filteredPrograms = activeCategory === "todos"
    ? programs
    : programs.filter(p => p.category === activeCategory);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <Radio className="h-12 w-12 mx-auto text-gold animate-pulse" />
          <p className="mt-3 text-sm text-muted-foreground">Carregando Rádio Web...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-navy">Rádio Web</h1>
        <p className="text-sm text-muted-foreground">Sua comunidade, sempre ouvindo</p>
      </div>

      {/* Ao Vivo */}
      {liveProgram && (
        <section className="rounded-2xl border-2 border-red-200 bg-red-50 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white uppercase">
              <Radio className="h-3.5 w-3.5" />AO VIVO
            </span>
          </div>
          <h2 className="text-xl font-bold text-navy">{liveProgram.title}</h2>
          {liveProgram.presenter && <p className="text-sm text-muted-foreground">com {liveProgram.presenter}</p>}
          {liveProgram.description && <p className="text-sm text-ink/70">{liveProgram.description}</p>}
          <button
            onClick={() => handlePlay(liveProgram)}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gold px-4 py-3 font-bold text-navy hover:bg-gold/90 transition"
          >
            <Play className="h-5 w-5" />Ouvir agora
          </button>
        </section>
      )}

      {/* Próximo Programa */}
      {nextProgram && (
        <section className="rounded-xl border bg-blue-50 p-4">
          <p className="text-xs font-bold uppercase text-blue-600 mb-1">Próximo</p>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-semibold">{nextProgram.title}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {new Date(nextProgram.start_time).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </section>
      )}

      {/* Categorias */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold capitalize transition ${
              activeCategory === cat
                ? "bg-navy text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Lista de Programas */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-navy">Programação e Conteúdos</h2>
        {filteredPrograms.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">
            Nenhum conteúdo disponível nesta categoria.
          </p>
        )}
        {filteredPrograms.map(program => {
          const Icon = CATEGORY_ICONS[program.category] ?? Radio;
          const isPlaying = state.currentTrack?.id === program.id && state.isPlaying;
          return (
            <div
              key={program.id}
              className={`group flex items-center gap-3 rounded-xl border p-4 transition hover:shadow-md cursor-pointer ${
                isPlaying ? "border-gold bg-gold/5" : "hover:border-navy/30"
              }`}
              onClick={() => handlePlay(program)}
            >
              <div className={`shrink-0 flex h-12 w-12 items-center justify-center rounded-xl ${isPlaying ? "bg-gold/20" : "bg-muted"}`}>
                {isPlaying ? <Radio className="h-5 w-5 text-gold animate-pulse" /> : <Icon className="h-5 w-5 text-navy/50" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm text-navy truncate">{program.title}</p>
                {program.presenter && <p className="text-xs text-muted-foreground">{program.presenter}</p>}
                <div className="flex items-center gap-2 mt-0.5">
                  {program.isLive && (
                    <span className="text-[10px] font-bold uppercase text-red-500">AO VIVO</span>
                  )}
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(program.start_time).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
              <button className="shrink-0 p-2 rounded-full hover:bg-gold/10 transition">
                <Play className="h-5 w-5 text-gold" />
              </button>
            </div>
          );
        })}
      </section>
    </div>
  );
}