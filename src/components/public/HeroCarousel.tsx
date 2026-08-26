"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Banner } from "@/types/domain";
import { recordBannerEvent } from "@/services/banners";
import { supabase } from "@/lib/supabase/client";

interface Props {
  banners: Banner[];
  fallback?: React.ReactNode;
  intervalMs?: number;
  onSeeVideos?: () => void;
  onSeeServices?: () => void;
}

export function HeroCarousel({ banners, fallback, intervalMs = 7000, onSeeVideos, onSeeServices }: Props) {
  const active = banners.filter((b) => b.is_active);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const liveRef = useRef<HTMLHeadingElement>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const total = active.length;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    if (index >= total && total > 0) setIndex(0);
  }, [index, total]);

  useEffect(() => {
    if (total <= 1 || paused || reducedMotion) return;
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % total), intervalMs);
    return () => window.clearInterval(timer);
  }, [total, paused, reducedMotion, intervalMs]);

  const goTo = (nextIndex: number) => {
    setIndex((nextIndex + total) % total);
    setPaused(true);
    window.setTimeout(() => setPaused(false), 3500);
  };

  const banner = active[index];
  const external = Boolean(banner?.cta_url?.startsWith("http"));
  const imageUrl = banner?.desktop_image_url || banner?.image_url;
  const institutionalLabel = banner?.institutional_label || "FAM · FORÇA ATIVA DA MULHER";

  useEffect(() => {
    setImageFailed(false);
    if (banner?.id) void recordBannerEvent(supabase, banner.id, "impressao").catch(() => undefined);
  }, [banner?.id]);

  if (total === 0) {
    return <DefaultHero onSeeVideos={onSeeVideos} onSeeServices={onSeeServices} fallback={fallback} />;
  }

  return (
    <section
      aria-roledescription="carrossel"
      aria-label="Destaques da FAM"
      className="fam-carousel group relative overflow-hidden rounded-2xl border border-fam-gold/40 bg-gradient-to-br from-fam-purple via-fam-plum to-fam-night shadow-[0_14px_40px_rgba(74,23,63,0.18)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false);
      }}
    >
      <div
        className="relative min-h-[330px] bg-cover bg-center"
        role="group"
        aria-label={`Banner ${index + 1} de ${total}`}
        style={imageUrl && !imageFailed ? {
          backgroundImage: `linear-gradient(90deg, rgba(74,23,63,.96) 0%, rgba(74,23,63,.78) 48%, rgba(50,19,45,.28) 100%), url(${imageUrl})`,
        } : undefined}
      >
        {imageUrl && !imageFailed && (
          <img src={banner.mobile_image_url || imageUrl} alt={banner.image_alt || ""} className="sr-only" onError={() => { setImageFailed(true); void recordBannerEvent(supabase, banner.id, "erro_imagem").catch(() => undefined); }} />
        )}
        <div className="relative z-10 flex min-h-[330px] max-w-3xl flex-col justify-center px-8 py-12 md:px-14">
          <span className="w-fit rounded-full border border-fam-gold px-3 py-1 text-[11px] font-extrabold tracking-[0.18em] text-fam-gold-soft">
            {institutionalLabel}
          </span>
          <h2 ref={liveRef} aria-live="polite" className="mt-4 font-display text-3xl font-semibold leading-tight text-white md:text-5xl">
            {banner.title}
          </h2>
          {banner.subtitle && <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/85 md:text-base">{banner.subtitle}</p>}
          {banner.cta_label && banner.cta_url && (
            <div className="mt-6">
              <Button asChild className="gap-2 bg-fam-pink text-white shadow-lg shadow-fam-night/20 hover:bg-fam-rose">
                <a href={banner.cta_url} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined}
                  onClick={() => void recordBannerEvent(supabase, banner.id, "cta_click").catch(() => undefined)}>
                  {banner.cta_label}{external && <span aria-hidden="true">↗</span>}
                </a>
              </Button>
            </div>
          )}
        </div>

        {total > 1 && (
          <>
            <button type="button" onClick={() => goTo(index - 1)} aria-label="Banner anterior" className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/30 bg-fam-night/40 p-2 text-white backdrop-blur transition hover:bg-fam-pink focus:outline-none focus:ring-2 focus:ring-fam-gold-soft">
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button type="button" onClick={() => goTo(index + 1)} aria-label="Próximo banner" className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/30 bg-fam-night/40 p-2 text-white backdrop-blur transition hover:bg-fam-pink focus:outline-none focus:ring-2 focus:ring-fam-gold-soft">
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </>
        )}

        {total > 1 && (
          <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-fam-night/40 px-3 py-2 backdrop-blur" role="group" aria-label="Selecionar banner">
            {active.map((item, itemIndex) => (
              <button key={item.id} type="button" onClick={() => goTo(itemIndex)} aria-label={`Banner ${itemIndex + 1} de ${total}`} aria-current={itemIndex === index ? "true" : undefined} className={`h-2 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-fam-gold-soft ${itemIndex === index ? "w-8 bg-fam-gold-soft" : "w-2 bg-white/55 hover:bg-white"}`} />
            ))}
            <button type="button" onClick={() => setPaused((value) => !value)} aria-label={paused ? "Retomar carrossel" : "Pausar carrossel"} className="ml-1 rounded-full p-1 text-white hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-fam-gold-soft">
              {paused ? <Play className="h-3.5 w-3.5" aria-hidden="true" /> : <Pause className="h-3.5 w-3.5" aria-hidden="true" />}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function DefaultHero({ onSeeVideos, onSeeServices, fallback }: { onSeeVideos?: () => void; onSeeServices?: () => void; fallback?: React.ReactNode }) {
  if (fallback) return <>{fallback}</>;
  return (
    <section aria-label="Apresentação da FAM" className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-fam-purple via-fam-plum to-fam-night p-8 shadow-[0_14px_40px_rgba(74,23,63,0.18)] md:p-12">
      <span className="inline-block rounded-full border border-fam-gold px-3 py-1 text-[11px] font-extrabold tracking-[0.18em] text-fam-gold-soft">FAM · FORÇA ATIVA DA MULHER</span>
      <h1 className="mt-4 font-display text-3xl font-semibold leading-tight text-white md:text-5xl">Acolhimento, força e oportunidade</h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/85 md:text-base">Conheça os projetos, ações e canais de apoio da Força Ativa da Mulher.</p>
      <div className="mt-6 flex flex-wrap gap-3">
        {onSeeVideos && <Button onClick={onSeeVideos} className="bg-fam-pink text-white hover:bg-fam-rose">Conheça nossas ações</Button>}
        {onSeeServices && <Button variant="outline" onClick={onSeeServices} className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white">Fale com a FAM</Button>}
      </div>
      <Sparkles className="absolute right-5 top-5 h-10 w-10 text-fam-gold/30" aria-hidden="true" />
    </section>
  );
}
