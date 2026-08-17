"use client";
import { useState, useEffect } from "react";
import { useRadioPlayer } from "@/contexts/RadioPlayerContext";
import { useToast } from "@/components/shared/ToastProvider";

interface RadioProgram {
  id: string;
  title: string;
  description?: string;
  host_name?: string;
  category: string;
  start_time: string;
  end_time?: string;
  isLive: boolean;
  audioUrl: string;
  thumbnailUrl?: string;
}

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  pregacao: React.createElement("svg", { className: "h-5 w-5" }, ...),
  louvor: React.createElement("svg", { className: "h-5 w-5" }, ...),
  devocional: React.createElement("svg", { className: "h-5 w-5" }, ...),
  noticia: React.createElement("svg", { className: "h-5 w-5" }, ...),
  entrevista: React.createElement("svg", { className: "h-5 w-5" }, ...),
  estudo: React.createElement("svg", { className: "h-5 w-5" }, ...),
  especial: React.createElement("svg", { className: "h-5 w-5" }, ...),
};

export function RadioPage() {
  const { state, play } = useRadioPlayer();
  const { toast } = useToast();
  const [programs, setPrograms] = useState<RadioProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("todos");

  useEffect(() => {
    // Carregar programas do banco quando o componente monta
    const loadPrograms = async () => {
      try {
        const { supabase } = await import("@/lib/supabase/client");
        const { data, error } = await supabase
          .from("radio_programs")
          .select("*")
          .eq("is_active", true)
          .order("start_time", { ascending: true });
        
        if (error) throw error;
        setPrograms(data as RadioProgram[]);
      } catch (e) {
        console.error("Erro ao carregar programas:", e);
      } finally {
        setLoading(false);
      }
    };
    
    loadPrograms();
  }, []);

  function handlePlay(program: RadioProgram) {
    // Verificar se já está tocando esse programa
    if (state.currentTrack?.id === program.id && state.isPlaying) {
      // Se estiver tocando o mesmo, faz pause
      // Note: precisaríamos de um toggle no player
      toast("info", "Já está tocando", program.title);
      return;
    }
    
    play({
      id: program.id,
      title: program.title,
      artist: program.host_name,
      url: program.audioUrl,
      isLive: program.isLive,
      thumbnail: program.thumbnailUrl,
    });
    toast("success", "Ouvindo agora", program.title);
  }

  const categories = ["todos", ...new Set(programs.map(p => p.category))];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <svg className="h-12 w-12 mx-auto text-gold animate-pulse" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" fill="none" stroke="gold" strokeWidth="3"/>
            <path fill="gold" d="M8 16l4-4 4 4V8"/>
          </svg>
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
      {state.currentTrack && state.currentTrack.isLive && (
        <section className="rounded-2xl border-2 border-red-200 bg-red-50 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white uppercase">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3.5C5.8 3.5 2.5 5.7 1 8.5s3.5 5 8 5 8-2.5 8-5S18.5 3.5 12 3.5zm0 2C5.5 5.5 2 8 2 11.5s2.5 6 6 6 6-2.5 6-6S14.5 5.5 12 5.5zm0 6.5C2.5 8.5 1 10.5 1 14s2.5 5.5 6 5.5 5-2.5 8-5S17 8.5 12 8.5zm0 6.5C8 11.5 6 13 6 15.5s2.5 4.5 6 4.5S15.5 11.5 12 11.5zm3.5-10.5c.8-.8 2-.8 2.8 0l2.1 2.1c.4.4.4 1 0 1.4l-2 2c-.4.4-1 .4-1.4 0l-1.4-1.4c-.8-.8-2-.8-2.8 0l-2.1 2.1c-.4.4-.4 1 0 1.4l1.4 1.4c.4.4 1 .4 1.4 0z"/></svg>
              Tocando
            </span>
          </div>
          <h2 className="text-xl font-bold text-navy">{state.currentTrack?.title}</h2>
          {state.currentTrack?.artist && <p className="text-sm text-muted-foreground">com {state.currentTrack?.artist}</p>}
          {state.currentTrack?.description && <p className="text-sm text-ink/70">{state.currentTrack?.description}</p>}
          <button
            onClick={() => handlePlay({ ...state.currentTrack, isLive: true })}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gold px-4 py-3 font-bold text-navy hover:bg-gold/90 transition"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="gold" strokeWidth="3"><path d="M5 12h14M12 5l7 7-7 7"/></svg> Continuar
          </button>
        </section>
      )}

      {/* Programação */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-navy">Programação e Conteúdos</h2>
        {programs.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">
            Nenhum conteúdo disponível nesta categoria.
          </p>
        )}
        {programs.map(program => {
          const isPlaying = state.currentTrack?.id === program.id && state.isPlaying;
          const CategoryIcon = CATEGORY_ICONS[program.category] || React.createElement("svg", { className: "h-5 w-5 text-navy/50" }, ...);
          
          return (
            <div
              key={program.id}
              className={`group flex items-center gap-3 rounded-xl border p-4 transition hover:shadow-md cursor-pointer ${isPlaying ? "border-gold bg-gold/5" : "hover:border-navy/30"}`}
              onClick={() => handlePlay(program)}
            >
              <div className={`shrink-0 flex h-12 w-12 items-center justify-center rounded-xl ${isPlaying ? "bg-gold/20" : "bg-muted"}`}>
                {isPlaying ? (
                  <svg className="h-5 w-5 text-gold animate-pulse" viewBox="0 0 24 24" fill="currentColor"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                ) : (
                  CategoryIcon
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm text-navy truncate">{program.title}</p>
                {program.host_name && <p className="text-xs text-muted-foreground">{program.host_name}</p>}
                <div className="flex items-center gap-2 mt-0.5">
                  {program.isLive && (
                    <span className="text-[10px] font-bold text-red-500">AO VIVO</span>
                  )}
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(program.start_time * 1000).toLocaleString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
              <button className="shrink-0 p-2 rounded-full hover:bg-gold/10 transition">
                <svg className="h-5 w-5 text-gold" viewBox="0 0 24 24" fill="none" stroke="gold" strokeWidth="3"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            </div>
          );
        })}
      </section>
    </div>
  );
}
