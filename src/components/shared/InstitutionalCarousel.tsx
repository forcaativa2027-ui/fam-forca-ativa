"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, Play, ExternalLink } from "lucide-react";
import type { CarouselItem } from "@/types/domain";

interface Props {
  items: CarouselItem[];
  intervalMs?: number;
  onItemClick?: (item: CarouselItem) => void;
}

/**
 * FAM-CAR-01 — Carrossel Institucional de Conteudo
 * Exibe 3 cards simultaneamente (desktop), com card central destacado.
 * Rotaciona a cada 10s, pausa em interacao do usuario.
 */
export function InstitutionalCarousel({ items, intervalMs = 10000, onItemClick }: Props) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [prefersReduced, setPrefersReduced] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);

  // Detectar prefers-reduced-motion
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const total = items.length;

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % total);
  }, [total]);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + total) % total);
  }, [total]);

  const goTo = useCallback((idx: number) => {
    setCurrent(idx);
  }, []);

  // Rotacao automatica
  useEffect(() => {
    if (prefersReduced || paused || total <= 1) return;
    const timer = setInterval(next, intervalMs);
    return () => clearInterval(timer);
  }, [prefersReduced, paused, total, intervalMs, next]);

  // Pausa em hover/focus/touch
  const handleMouseEnter = () => setPaused(true);
  const handleMouseLeave = () => setPaused(false);
  const handleFocus = () => setPaused(true);
  const handleBlur = () => setPaused(false);

  // Touch swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setPaused(true);
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? next() : prev();
    }
    setPaused(false);
  };

  // Navegacao por teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
    if (e.key === "ArrowRight") { e.preventDefault(); next(); }
  };

  if (total === 0) return null;

  // Calcula indices dos 3 cards visiveis
  const getVisibleIndices = () => {
    const indices: number[] = [];
    for (let offset = -1; offset <= 1; offset++) {
      indices.push(((current + offset) % total + total) % total);
    }
    return indices;
  };

  const visibleIndices = getVisibleIndices();
  const typeIcons: Record<string, string> = {
    banner: "Banner", video: "Video", noticia: "Noticia",
    informativo: "Informativo", evento: "Evento", campanha: "Campanha", outro: "Outro",
  };

  return (
    <section
      ref={containerRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onKeyDown={handleKeyDown}
      role="region"
      aria-label="Carrossel de conteudo institucional"
      aria-roledescription="carrossel"
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-fam-magenta"> Conteudo Institucional</p>
          <h2 className="mt-1 font-display text-xl text-navy">Conheca nossas acoes e iniciativas</h2>
        </div>
        {total > 1 && (
          <div className="flex items-center gap-1">
            <button onClick={prev} aria-label="Anterior"
              className="rounded-full border border-border bg-card p-1.5 text-muted transition hover:bg-navy hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fam-magenta">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={next} aria-label="Proximo"
              className="rounded-full border border-border bg-card p-1.5 text-muted transition hover:bg-navy hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fam-magenta">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Cards — 1 no mobile, 3 no desktop */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3" aria-live="polite">
        {visibleIndices.map((idx, position) => {
          const item = items[idx];
          const isCenter = position === 1;
          return (
            <CarouselCard
              key={item.id}
              item={item}
              isCenter={isCenter}
              typeLabel={typeIcons[item.content_type] ?? item.content_type}
              onClick={() => onItemClick?.(item)}
            />
          );
        })}
      </div>

      {/* Indicadores */}
      {total > 1 && (
        <div className="mt-4 flex justify-center gap-1.5" role="tablist" aria-label="Navegacao do carrossel">
          {items.map((_, idx) => (
            <button
              key={idx}
              role="tab"
              aria-selected={idx === current}
              aria-label={`Ir para item ${idx + 1}`}
              onClick={() => goTo(idx)}
              className={`h-2 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fam-magenta ${
                idx === current ? "w-6 bg-fam-magenta" : "w-2 bg-border hover:bg-muted"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Card individual do carrossel                                       */
/* ------------------------------------------------------------------ */

function CarouselCard({ item, isCenter, typeLabel, onClick }: {
  item: CarouselItem; isCenter: boolean; typeLabel: string; onClick: () => void;
}) {
  const isVideo = item.content_type === "video" && item.video_url;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl border text-left transition-all ${
        isCenter
          ? "border-fam-magenta/40 bg-card shadow-lg ring-1 ring-fam-magenta/20 sm:-translate-y-1"
          : "border-border bg-card hover:border-navy/30 hover:shadow-md"
      }`}
    >
      {/* Imagem / Capa */}
      {(item.image_url || item.cover_url) && (
        <div className="relative aspect-[16/9] overflow-hidden">
          <img
            src={item.cover_url || item.image_url || ""}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          {isVideo && (
            <div className="absolute inset-0 flex items-center justify-center bg-navy/30">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-white/90 text-navy shadow-lg">
                <Play className="h-5 w-5 ml-0.5" />
              </span>
            </div>
          )}
          {/* Tag de tipo */}
          <span className="absolute top-2 left-2 rounded-full bg-navy/80 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
            {typeLabel}
          </span>
        </div>
      )}

      {/* Imagem via cover_url para videos sem image_url */}
      {!item.image_url && !item.cover_url && isVideo && (
        <div className="relative flex aspect-[16/9] items-center justify-center bg-gradient-to-br from-navy to-fam-plum">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-white/20 text-white">
            <Play className="h-6 w-6 ml-0.5" />
          </span>
          <span className="absolute top-2 left-2 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
            {typeLabel}
          </span>
        </div>
      )}

      {/* Conteudo */}
      <div className="p-4">
        <h3 className={`font-display text-base font-bold text-navy ${isCenter ? "" : "line-clamp-2"}`}>
          {item.title}
        </h3>
        {item.description && (
          <p className="mt-1 text-xs text-muted line-clamp-2">{item.description}</p>
        )}
        {item.button_label && (
          <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-fam-plum transition group-hover:text-fam-magenta">
            {item.button_label}
            {item.action_type === "externo" && <ExternalLink className="h-3 w-3" />}
          </span>
        )}
      </div>
    </button>
  );
}
