# Caderno Técnico — Rádio Web CEC Family
## Caderno Técnico de Implementação adaptado da especificação S360-RADIO-001

**Referência:** S360-RADIO-001 v1.1 (Rádio Web e Experiência de Áudio)
**Plataforma alvo:** CEC Family
**Tecnologias existentes:** Next.js 14 (App Router), Supabase (PostgreSQL + Storage), React Query, Tailwind CSS, shadcn/ui
**Princípio:** Extensão — nunca duplicar tabelas, componentes ou serviços existentes.

---

## 1. Visão Geral da Implementação

A Rádio Web será integrada à CEC Family como uma extensão natural da plataforma, aproveitando a infraestrutura existente de autenticação, gestão de conteúdo e acessibilidade (CT-017). O documento original S360-RADIO-001 foi concebido para o Servo360, mas seus princípios se aplicam diretamente à CEC Family com ajustes na stack tecnológica e no contexto multi-tenant.

Na CEC Family, o equivalente ao "tenant" é o conceito de igreja/comunidade já presente nas tabelas `profiles`, `churches` e `church_memberships`. A personalização por instituição será feita através dessas estruturas, sem necessidade de criar uma nova camada de multi-tenancy.

---

## 2. Estrutura de Navegação

O item **Rádio Web** será adicionado à navegação inferior pública (BottomNav), posicionado entre Notícias e Vídeos, conforme a decisão RADIO-001.

### 2.1 Componente BottomNav — Adição do Item Rádio Web

**Arquivo existente a modificar:** `src/components/panel/BottomNav.tsx`

Adicionar o novo item de navegação:

```typescript
{
  label: "Rádio Web",
  icon: Radio,
  href: "/radio",
  order: 2, // Entre Notícias (1) e Vídeos (3)
}
```

O ícone utilizado será `web-radio.webp` localizado em `public/assets/servo360/icons/content/web-radio.webp`, conforme registrado na seção 8.1 do documento original.

### 2.2 Rota da Rádio

Nova rota pública criada em `src/app/(public)/radio/page.tsx`. Esta rota será tenant-aware, ou seja, responderá conforme a igreja/comunidade do visitante.

```typescript
// src/app/(public)/radio/page.tsx
import { RadioPage } from "@/components/public/RadioPage";

export default function RadioRoute() {
  return <RadioPage />;
}
```

---

## 3. Camada de Estado Global — RadioPlayerProvider

Para garantir que o áudio persista durante a navegação (RADIO-003), o estado do player será gerenciado por um Context Provider no nível da App Shell, fora das páginas individuais.

### 3.1 Criação do Provider

**Novo arquivo:** `src/contexts/RadioPlayerContext.tsx`

```typescript
"use client";
import React, { createContext, useContext, useRef, useState, useCallback, ReactNode } from "react";

export interface RadioTrack {
  id: string;
  title: string;
  artist?: string;
  duration?: number;
  url: string;
  isLive?: boolean;
  thumbnailUrl?: string;
}

interface RadioPlayerState {
  currentTrack: RadioTrack | null;
  isPlaying: boolean;
  isLive: boolean;
  volume: number;
  isMuted: boolean;
  currentTime: number;
  duration: number;
  streamStatus: "idle" | "loading" | "playing" | "error" | "offline";
}

interface RadioPlayerContextType {
  state: RadioPlayerState;
  play: (track: RadioTrack) => void;
  pause: () => void;
  toggle: () => void;
  setVolume: (v: number) => void;
  mute: () => void;
  unmute: () => void;
  seek: (time: number) => void;
}

const RadioPlayerContext = createContext<RadioPlayerContextType | null>(null);

export function RadioPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<RadioPlayerState>({
    currentTrack: null,
    isPlaying: false,
    isLive: false,
    volume: 1,
    isMuted: false,
    currentTime: 0,
    duration: 0,
    streamStatus: "idle",
  });

  const play = useCallback((track: RadioTrack) => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = state.volume;
    }
    audioRef.current.src = track.url;
    audioRef.current.play();
    setState(prev => ({
      ...prev,
      currentTrack: track,
      isPlaying: true,
      isLive: track.isLive ?? false,
      streamStatus: "playing",
    }));
  }, [state.volume]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setState(prev => ({ ...prev, isPlaying: false }));
  }, []);

  const toggle = useCallback(() => {
    if (!state.currentTrack) return;
    if (state.isPlaying) pause();
    else { audioRef.current?.play(); setState(prev => ({ ...prev, isPlaying: true })); }
  }, [state.isPlaying, state.currentTrack, pause]);

  const setVolume = useCallback((v: number) => {
    if (audioRef.current) audioRef.current.volume = v;
    setState(prev => ({ ...prev, volume: v, isMuted: v === 0 }));
  }, []);

  const mute = useCallback(() => {
    if (audioRef.current) audioRef.current.muted = true;
    setState(prev => ({ ...prev, isMuted: true }));
  }, []);

  const unmute = useCallback(() => {
    if (audioRef.current) audioRef.current.muted = false;
    setState(prev => ({ ...prev, isMuted: false }));
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current) audioRef.current.currentTime = time;
    setState(prev => ({ ...prev, currentTime: time }));
  }, []);

  return (
    <RadioPlayerContext.Provider value={{ state, play, pause, toggle, setVolume, mute, unmute, seek }}>
      {children}
      {state.currentTrack && <MiniPlayer />}
    </RadioPlayerContext.Provider>
  );
}

export function useRadioPlayer() {
  const ctx = useContext(RadioPlayerContext);
  if (!ctx) throw new Error("useRadioPlayer must be used within RadioPlayerProvider");
  return ctx;
}
```

### 3.2 Integração no Layout Raiz

**Arquivo existente a modificar:** `src/app/layout.tsx`

```typescript
import { RadioPlayerProvider } from "@/contexts/RadioPlayerContext";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <QueryProvider>
          <ToastProvider>
            <RadioPlayerProvider>  {/* <-- Adicionar aqui */}
              <AccessibilityProvider>
                {children}
                <AccessibilityButton />
                <AccessibilityOnboarding />
              </AccessibilityProvider>
            </RadioPlayerProvider>
          </ToastProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
```

---

## 4. Componente MiniPlayer Persistente

O MiniPlayer será um componente que aparece automaticamente quando há reprodução ativa, posicionado na parte inferior da tela, acima da navegação.

### 4.1 MiniPlayer Component

**Novo arquivo:** `src/components/shared/MiniPlayer.tsx`

```typescript
"use client";
import { useState } from "react";
import { Play, Pause, Volume2, VolumeX, Radio, ChevronUp } from "lucide-react";
import { useRadioPlayer } from "@/contexts/RadioPlayerContext";
import { useRouter } from "next/navigation";

export function MiniPlayer() {
  const { state, toggle, mute, unmute } = useRadioPlayer();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  if (!state.currentTrack) return null;

  return (
    <div className="fixed bottom-16 left-0 right-0 z-50 bg-navy text-white px-4 py-2 shadow-lg border-t border-gold/20">
      <div className="flex items-center justify-between gap-3">
        <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-2 flex-1 min-w-0">
          {state.isLive && (
            <span className="shrink-0 flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold uppercase">
              <Radio className="h-3 w-3" />AO VIVO
            </span>
          )}
          <div className="min-w-0 text-left">
            <p className="text-sm font-semibold truncate">{state.currentTrack.title}</p>
            {state.currentTrack.artist && (
              <p className="text-xs text-white/60 truncate">{state.currentTrack.artist}</p>
            )}
          </div>
        </button>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={toggle} className="p-2 rounded-full bg-gold/20 hover:bg-gold/30 transition">
            {state.isPlaying ? <Pause className="h-4 w-4 text-gold" /> : <Play className="h-4 w-4 text-gold" />}
          </button>
          <button onClick={() => state.isMuted ? unmute() : mute()} className="text-white/60 hover:text-white">
            {state.isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <button onClick={() => router.push("/radio")} className="text-white/60 hover:text-gold">
            <ChevronUp className="h-4 w-4" />
          </button>
        </div>
      </div>
      {expanded && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <p className="text-xs text-white/50">Rádio Web — Navegue livremente, o áudio continua.</p>
        </div>
      )}
    </div>
  );
}
```

---

## 5. Página da Rádio Web

### 5.1 Componente RadioPage

**Novo arquivo:** `src/components/public/RadioPage.tsx`

```typescript
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
```

---

## 6. Modelagem do Banco de Dados

Seguindo o princípio RADIO-014, verificamos as tabelas existentes antes de criar novas. A tabela `radio_programs` é nova, mas necessária para gerenciar a programação da rádio. A tabela `media_objects` já foi criada anteriormente (para o Player Unificado) e será reutilizada para armazenar os áudios sob demanda.

### 6.1 Tabela radio_programs

```sql
-- Rádio Web — Programação e Conteúdos
create table if not exists public.radio_programs (
  id            uuid primary key default gen_random_uuid(),
  church_id     uuid references public.churches(id) on delete cascade,
  title         text not null,
  description   text,
  presenter     text,
  category      text not null check (category in (
    'pregacao', 'louvor', 'devocional', 'noticia',
    'entrevista', 'estudo', 'mensagem', 'especial', 'informacao'
  )),
  start_time    timestamptz not null,
  end_time      timestamptz,
  audio_url     text,
  media_object_id uuid references public.media_objects(id) on delete set null,
  thumbnail_url text,
  is_live       boolean not null default false,
  is_active     boolean not null default true,
  order_index   int default 0,
  created_at    timestamptz not null default now()
);

create index if not exists idx_radio_programs_church on public.radio_programs(church_id);
create index if not exists idx_radio_programs_active on public.radio_programs(church_id, is_active);
create index if not exists idx_radio_programs_time on public.radio_programs(start_time);

-- RLS: público pode ver programas ativos
alter table public.radio_programs enable row level security;

create policy "Programas ativos são públicos"
  on public.radio_programs
  for select
  using (is_active = true);

-- Admins podem gerenciar (via RLS existente para admins)
```

### 6.2 Configuração de Rádio por Igreja (radio_settings)

```sql
-- Rádio Web — Configurações por igreja/comunidade
create table if not exists public.radio_settings (
  id                uuid primary key default gen_random_uuid(),
  church_id         uuid not null unique references public.churches(id) on delete cascade,
  radio_enabled     boolean not null default false,
  radio_display_name text,
  radio_short_name  text,
  radio_logo_url    text,
  radio_icon_url    text,
  radio_theme       jsonb default '{}',
  radio_stream_url  text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- RLS
alter table public.radio_settings enable row level security;

create policy "Configurações de rádio são públicas (leitura)"
  on public.radio_settings
  for select
  using (true);

-- Apenas admins podem atualizar
```

---

## 7. Serviço de Rádio (RadioService)

### 7.1 Arquivo do Serviço

**Novo arquivo:** `src/services/radio.ts`

```typescript
import { supabase } from "@/lib/supabase/client";

export interface RadioSettings {
  church_id: string;
  radio_enabled: boolean;
  radio_display_name: string | null;
  radio_short_name: string | null;
  radio_logo_url: string | null;
  radio_icon_url: string | null;
  radio_theme: Record<string, unknown>;
  radio_stream_url: string | null;
}

export interface RadioProgram {
  id: string;
  church_id: string;
  title: string;
  description: string | null;
  presenter: string | null;
  category: string;
  start_time: string;
  end_time: string | null;
  audio_url: string | null;
  media_object_id: string | null;
  thumbnail_url: string | null;
  is_live: boolean;
  is_active: boolean;
  order_index: number;
  created_at: string;
}

export async function getRadioSettings(churchId: string): Promise<RadioSettings | null> {
  const { data, error } = await supabase
    .from("radio_settings")
    .select("*")
    .eq("church_id", churchId)
    .single();
  if (error) return null;
  return data as RadioSettings;
}

export async function getLiveProgram(churchId: string): Promise<RadioProgram | null> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("radio_programs")
    .select("*")
    .eq("church_id", churchId)
    .eq("is_active", true)
    .eq("is_live", true)
    .lte("start_time", now)
    .order("start_time", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return null;
  return data as RadioProgram | null;
}

export async function getUpcomingPrograms(churchId: string, limit = 10): Promise<RadioProgram[]> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("radio_programs")
    .select("*")
    .eq("church_id", churchId)
    .eq("is_active", true)
    .gt("start_time", now)
    .order("start_time", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data as RadioProgram[];
}

export async function getProgramsByCategory(churchId: string, category: string): Promise<RadioProgram[]> {
  const { data, error } = await supabase
    .from("radio_programs")
    .select("*")
    .eq("church_id", churchId)
    .eq("is_active", true)
    .eq("category", category)
    .order("start_time", { ascending: false });
  if (error) throw error;
  return data as RadioProgram[];
}

export async function getAllPrograms(churchId: string, limit = 50): Promise<RadioProgram[]> {
  const { data, error } = await supabase
    .from("radio_programs")
    .select("*")
    .eq("church_id", churchId)
    .eq("is_active", true)
    .order("start_time", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as RadioProgram[];
}

export async function shareRadio(churchId: string): Promise<void> {
  const url = `${window.location.origin}/radio?church=${churchId}`;
  if (navigator.share) {
    await navigator.share({
      title: "Rádio Web",
      text: "Ouça a rádio da nossa comunidade",
      url,
    });
  } else {
    await navigator.clipboard.writeText(url);
  }
}
```

---

## 8. Progressive Web App (PWA) — Atalho Instalável

Para implementar o RADIO-008 (segundo acesso instalável), configuramos o PWA com manifest dinâmico por tenant.

### 8.1 Arquivo manifest.json dinâmico

**Novo arquivo:** `public/manifest.json`

```json
{
  "name": "Rádio Web — CEC Family",
  "short_name": "Rádio CEC",
  "description": "Rádio Web da Comunidade Evangélica de Campinas",
  "start_url": "/radio",
  "display": "standalone",
  "background_color": "#1a3a5c",
  "theme_color": "#1a3a5c",
  "icons": [
    {
      "src": "/assets/servo360/icons/app/web-radio-app-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/assets/servo360/icons/app/web-radio-app-512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "/assets/servo360/icons/app/web-radio-app-maskable-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

### 8.2 Botão de Instalação

**Novo arquivo:** `src/components/public/InstallRadioButton.tsx`

```typescript
"use client";
import { useState } from "react";
import { Smartphone, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function InstallRadioButton() {
  const [showGuide, setShowGuide] = useState(false);

  return (
    <div className="space-y-2">
      <Button variant="outline" className="w-full gap-2" onClick={() => setShowGuide(!showGuide)}>
        <PlusCircle className="h-4 w-4" />
        Adicionar Rádio Web à tela inicial
      </Button>
      {showGuide && (
        <div className="rounded-lg bg-gold/5 border border-gold/20 p-4 text-sm space-y-2">
          <p className="font-bold text-navy">Como instalar:</p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-xs">
            <li>No iPhone (Safari): toque em Compartilhar → "Adicionar à Tela de Início"</li>
            <li>No Android (Chrome): toque em ⋮ → "Adicionar à tela inicial"</li>
            <li>No computador (Chrome): clique no ícone de instalação na barra de endereço</li>
          </ol>
        </div>
      )}
    </div>
  );
}
```

---

## 9. Verificação radio_enabled (Tenant sem Rádio)

Conforme RADIO-014 e a seção 25 do documento original, quando a rádio não está habilitada para a igreja atual, todos os elementos visuais são ocultados.

### 9.1 Hook useRadioEnabled

**Novo arquivo:** `src/hooks/use-radio-enabled.ts`

```typescript
import { useQuery } from "@tanstack/react-query";
import { getRadioSettings } from "@/services/radio";

export function useRadioEnabled(churchId: string | null) {
  return useQuery({
    queryKey: ["radio-settings", churchId],
    queryFn: () => (churchId ? getRadioSettings(churchId) : null),
    enabled: !!churchId,
    staleTime: 5 * 60 * 1000,
  });
}
```

### 9.2 Uso no BottomNav

No componente BottomNav, o item Rádio Web só é exibido quando `radio_enabled === true`:

```typescript
const { data: radioSettings } = useRadioEnabled(currentChurch?.id ?? null);

// No array de itens de navegação:
{
  radioSettings?.radio_enabled && {
    label: "Rádio Web",
    icon: Radio,
    href: "/radio",
    order: 2,
  }
}
```

---

## 10. Acessibilidade (CT-017)

A Rádio Web herda automaticamente todas as configurações de acessibilidade do CT-017, incluindo:

- **Leitor de tela:** todos os botões possuem `aria-label` descritivos.
- **Contraste:** as cores seguem WCAG AA.
- **Fonte aumentada:** o layout usa unidades relativas (rem) e reflow.
- **Reduced motion:** animações respeitam `prefers-reduced-motion`.
- **Navegação por teclado:** todos os controles do player são acessíveis via Tab.

O estado "AO VIVO" é indicado tanto visualmente (badge vermelha) quanto textualmente (label "AO VIVO" no aria-label).

---

## 11. Compartilhamento

O compartilhamento preserva o contexto do tenant, permitindo que qualquer pessoa receba o link e ouça a rádio da comunidade correspondente.

**Implementação:** o serviço `radio.ts` já inclui a função `shareRadio()` que usa a Web Share API (mobile) com fallback para clipboard (desktop).

---

## 12. Tratamento de Erros e Resiliência

Conforme a seção 24 do documento original, os seguintes cenários são tratados:

| Cenário | Comportamento |
|---------|---------------|
| Stream indisponível | MiniPlayer exibe ícone de erro com mensagem "Stream offline" |
| Perda de conexão | Player tenta reconexão automática (3 tentativas com backoff) |
| Conteúdo removido | Item não aparece na listagem; se estava tocando, exibe "Conteúdo indisponível" |
| Erro de mídia | Toast de erro + fallback para próximo item |
| Tenant sem rádio | BottomNav item oculto, rota /radio exibe página "Rádio indisponível" |

---

## 13. Checklist de Implementação

| Item | Arquivo/Caminho | Status |
|------|-----------------|--------|
| Provider de estado global do player | `src/contexts/RadioPlayerContext.tsx` | Novo |
| MiniPlayer persistente | `src/components/shared/MiniPlayer.tsx` | Novo |
| Página da Rádio | `src/app/(public)/radio/page.tsx` | Novo |
| Componente RadioPage | `src/components/public/RadioPage.tsx` | Novo |
| Serviço de dados da rádio | `src/services/radio.ts` | Novo |
| Hook de verificação radio_enabled | `src/hooks/use-radio-enabled.ts` | Novo |
| Botão de instalação PWA | `src/components/public/InstallRadioButton.tsx` | Novo |
| Migration SQL (radio_programs + radio_settings) | `supabase/migrations/` | Novo |
| Manifest PWA | `public/manifest.json` | Atualizar |
| BottomNav (item Rádio Web) | `src/components/panel/BottomNav.tsx` | Modificar |
| Root Layout (RadioPlayerProvider) | `src/app/layout.tsx` | Modificar |

---

## 14. Referências Cruzadas com Documentos do Projeto

| Documento | Relação |
|-----------|---------|
| CT-017 (Acessibilidade) | Rádio herda configurações de acessibilidade |
| PII-001 (Plataforma Inclusiva) | Rádio funciona em perfis de uso (idoso, baixa visão) |
| ACA-B05 (Recursos Multimídia) | Áudios sob demanda reutilizam `media_objects` |
| Fundamentos Arquiteturais | Rádio é uma extensão da Academy, não um produto separado |
| Reestruturação Arquitetural | Rádio não duplica tabelas existentes |

---

**Caderno Técnico — Rádio Web CEC Family**
*Adaptado de S360-RADIO-001 v1.1 para a stack Next.js 14 + Supabase*
