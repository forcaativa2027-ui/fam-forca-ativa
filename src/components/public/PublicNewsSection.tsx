"use client";
import { useState } from "react";
import { Newspaper, Calendar as Cal, Play, ExternalLink, Share2, Ticket, Pin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { usePublicNews, useVisibleNewsVideos, useMyProfile } from "@/hooks/use-queries";
import type { News, NewsCategory, VisibleNewsVideo } from "@/types/domain";
import Link from "next/link";

const CATEGORIES: { value: NewsCategory; label: string }[] = [
  { value: "minha_comunidade", label: "Minha região" },
  { value: "cec_manaus",       label: "FAM — Manaus" },
  { value: "cec_brasilia",     label: "FAM — Brasília" },
  { value: "geral",            label: "Institucional" },
];

export function PublicNewsSection({ churchId }: { churchId?: string | null } = {}) {
  const [cat, setCat] = useState<NewsCategory | "todas">("todas");
  const { data: all = [] } = usePublicNews(undefined, churchId);
  const filtered = cat === "todas" ? all : all.filter((n) => n.category === cat);

  return (
    <div className="space-y-6">
      <FamNewsVideosHero />

      <div className="flex items-center gap-2 text-navy">
        <Newspaper className="h-5 w-5 text-gold" />
        <h2 className="font-display text-2xl">Notícias</h2>
      </div>

      <Tabs value={cat} onValueChange={(v) => setCat(v as NewsCategory | "todas")}>
        <div className="overflow-x-auto">
          <TabsList className="min-w-max">
            <TabsTrigger value="todas">Todas</TabsTrigger>
            {CATEGORIES.map((c) => <TabsTrigger key={c.value} value={c.value}>{c.label}</TabsTrigger>)}
          </TabsList>
        </div>

        <TabsContent value={cat}>
          {filtered.length === 0 ? (
            <p className="py-8 text-center italic text-muted">Nenhuma notícia publicada nessa categoria.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((n) => <NewsCard key={n.id} news={n} />)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function extractYoutubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}

function FamNewsVideosHero() {
  const { data: me } = useMyProfile();
  const { data: videos = [] } = useVisibleNewsVideos(me?.id ?? null);
  const [openId, setOpenId] = useState<string | null>(null);

  if (videos.length === 0) return null;
  const [main, ...rest] = videos;
  const openVideo = videos.find((v) => v.id === openId) ?? main;
  const ytId = extractYoutubeId(openVideo.video_url);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-navy">
        <Play className="h-5 w-5 text-gold" />
        <h2 className="font-display text-2xl">FAM em ação</h2>
      </div>

      <Card className="overflow-hidden border-2 border-gold/30">
        <div className="relative aspect-video w-full bg-navy">
          {ytId ? (
            <iframe
              src={`https://www.youtube.com/embed/${ytId}${openVideo.allow_autoplay ? "?autoplay=1&mute=1" : ""}`}
              className="h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen
            />
          ) : openVideo.cover_image_url ? (
            <a href={openVideo.video_url} target="_blank" rel="noopener noreferrer" className="relative block h-full w-full">
              <img src={openVideo.cover_image_url} alt="" className="h-full w-full object-cover opacity-80" />
              <span className="absolute inset-0 grid place-items-center">
                <span className="grid h-16 w-16 place-items-center rounded-full bg-gold text-navy shadow-lg"><Play className="h-7 w-7 fill-current" /></span>
              </span>
            </a>
          ) : (
            <a href={openVideo.video_url} target="_blank" rel="noopener noreferrer" className="grid h-full w-full place-items-center text-white/70">
              <Play className="h-10 w-10" />
            </a>
          )}
        </div>
        <CardContent className="space-y-2 pt-4">
          <div className="flex items-center gap-2">
            {openVideo.is_pinned && <Pin className="h-3.5 w-3.5 text-gold" />}
            <h3 className="font-display text-lg text-navy">{openVideo.title}</h3>
          </div>
          {openVideo.description && <p className="text-sm text-muted">{openVideo.description}</p>}
          {openVideo.event_start_at && (
            <p className="flex items-center gap-1 text-xs text-muted"><Cal className="h-3 w-3" />{new Date(openVideo.event_start_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</p>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            {openVideo.show_event_button && openVideo.event_slug && (
              <Button asChild size="sm" variant="outline" className="gap-1.5"><Link href={`/eventos/${openVideo.event_slug}`}><ExternalLink className="h-3.5 w-3.5" />Ver evento</Link></Button>
            )}
            {openVideo.show_signup_button && openVideo.event_slug && (
              <Button asChild size="sm" className="gap-1.5"><Link href={`/eventos/${openVideo.event_slug}`}><Ticket className="h-3.5 w-3.5" />Inscrever-se</Link></Button>
            )}
            {openVideo.show_share_button && (
              <Button size="sm" variant="ghost" className="gap-1.5" onClick={() => { navigator.share?.({ title: openVideo.title, url: window.location.href }); }}>
                <Share2 className="h-3.5 w-3.5" />Compartilhar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {rest.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {rest.map((v) => (
            <button key={v.id} onClick={() => setOpenId(v.id)} className="w-48 shrink-0 text-left">
              <div className="relative aspect-video overflow-hidden rounded-lg bg-navy/10">
                {v.cover_image_url ? <img src={v.cover_image_url} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center"><Play className="h-6 w-6 text-navy/40" /></div>}
              </div>
              <p className="mt-1 truncate text-xs font-semibold text-navy">{v.title}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function NewsCard({ news: n }: { news: News }) {
  const cat = CATEGORIES.find((c) => c.value === n.category)?.label ?? n.category;
  return (
    <Card className="overflow-hidden">
      {n.cover_url && <img src={n.cover_url} alt="" className="aspect-video w-full object-cover" />}
      <CardHeader>
        <span className="text-[10px] font-extrabold tracking-widest text-gold">{cat.toUpperCase()}</span>
        <CardTitle className="text-base leading-snug">{n.title}</CardTitle>
        {n.published_at && (
          <CardDescription className="flex items-center gap-1 text-xs">
            <Cal className="h-3 w-3" />{new Date(n.published_at).toLocaleDateString("pt-BR")}
            {n.author_name && <span> · {n.author_name}</span>}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {n.summary && <p className="text-sm text-muted">{n.summary}</p>}
      </CardContent>
    </Card>
  );
}
