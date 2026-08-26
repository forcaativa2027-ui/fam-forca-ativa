"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Play, Calendar, Music, MapPin, Church as ChurchIcon, Sparkles,
  Clock, ArrowRight, ExternalLink, LayoutDashboard, FileDown,
  Home, Newspaper, Video, MessageCircle, HeartHandshake, LogIn, Users2, Radio, ShieldAlert,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { BottomNav, BottomNavSpacer, type BottomNavItem } from "@/components/shared/BottomNav";
import {
  usePublicSermons, usePublicEvents, useChurches, useCells, usePublicNews, useChurchGivingInfo,
  useServiceTimes, useTodaysWord, useActiveBanners, useActiveCommunity, useMyProfile,
  usePublicRegistrationEvents, useRadioConfig, useMyMember,
} from "@/hooks/use-queries";
import { EventSignupCard } from "@/components/shared/EventSignupCard";
import { youtubeThumb } from "@/services/content";
import { defaultServiceTimes, defaultWord } from "@/services/institutional";
import { PublicNewsSection } from "./PublicNewsSection";
import { PublicContactForms } from "./PublicContactForms";
import { PublicParticipateSection } from "./PublicParticipateSection";
import { HeroCarousel } from "./HeroCarousel";
import type { EventItem, Church, Cell } from "@/types/domain";
import RadioPage from "@/components/radio/RadioPage";
import { RadioMiniPlayer } from "@/components/radio/RadioMiniPlayer";
import { useRadioEnabled } from "@/hooks/use-radio-enabled";

const STATUS_LABELS: Record<EventItem["status"], string> = {
  abertas: "Inscrições abertas", encerradas: "Encerradas", esgotado: "Esgotado", em_breve: "Em breve",
};
const EVENT_TYPE_LABELS: Record<string, string> = {
  culto: "Evento", congresso: "Congresso", conferencia: "Conferência",
  encontro: "Encontro", ebd: "Formação", outro: "Outro",
};
const EVENT_TYPE_COLORS: Record<string, string> = {
  culto: "bg-fam-plum/10 text-fam-plum border-fam-plum/25",
  congresso: "bg-fam-gold/15 text-fam-plum border-fam-gold/30",
  conferencia: "bg-fam-lilac/20 text-fam-plum border-fam-lilac/40",
  encontro: "bg-fam-coral/15 text-fam-plum border-fam-coral/30",
  ebd: "bg-fam-pink/10 text-fam-magenta border-fam-pink/30",
  outro: "bg-muted/20 text-muted border-border",
};
const WEEKDAY_LABELS: Record<string, string> = {
  domingo: "Domingo", segunda: "Segunda", terca: "Terça",
  quarta: "Quarta", quinta: "Quinta", sexta: "Sexta", sabado: "Sábado",
};

export default function PublicHome() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") ?? "inicio";
  const [tab, setTab] = useState(initialTab);
  const [regEventCategory, setRegEventCategory] = useState<string>("todos");
  const { data: profile } = useMyProfile();
  const { data: myMember } = useMyMember();
  const { data: community } = useActiveCommunity();
  const communityId = community?.id ?? null;
  const { data: sermons = [] } = usePublicSermons(communityId);
  const { data: news = [] } = usePublicNews(undefined, communityId);
  const { data: events = [] } = usePublicEvents(communityId);
  const { data: registrationEvents = [] } = usePublicRegistrationEvents(profile?.church_id ?? null);
  const { data: churches = [] } = useChurches();
  const { data: cells = [] } = useCells();
  const { data: banners = [] } = useActiveBanners(communityId);
  const sede = community ?? churches.find((c) => c.type === "sede") ?? churches[0] ?? null;
  const { data: dbServices = [] } = useServiceTimes(sede?.id ?? null);
  const { data: dbWord } = useTodaysWord(communityId);
  const { data: radioEnabled } = useRadioEnabled(communityId);
  const { data: radioConfig } = useRadioConfig(communityId);

  // Rádio visível por padrão; ocultada apenas se desabilitada explicitamente (seção 25 do spec)
  const showRadio = radioEnabled?.is_enabled !== false;

  // Fallback inteligente: se o banco tem dados use-os; senao mostra defaults.
  const services = dbServices.length > 0 ? dbServices : defaultServiceTimes(sede);
  const word = dbWord ?? defaultWord();

  const navItems: (BottomNavItem | null)[] = [
    { key: "inicio", label: "Início", icon: <Home size={18} />, onClick: () => setTab("inicio") },
    { key: "noticias", label: "Notícias", icon: <Newspaper size={18} />, onClick: () => setTab("noticias") },
    ...(showRadio ? [{ key: "radio", label: "Rádio Web", icon: <Radio size={18} />, onClick: () => setTab("radio") }] : []),

    { key: "videos", label: "FAM Vídeos", icon: <Video size={18} />, onClick: () => setTab("videos") },
    { key: "agenda", label: "Agenda", icon: <Calendar size={18} />, onClick: () => setTab("agenda") },
    { key: "participar", label: "Participar", icon: <Sparkles size={18} />, onClick: () => setTab("participar") },
    { key: "contato", label: "Fale Conosco", icon: <MessageCircle size={18} />, onClick: () => setTab("contato") },
    { key: "risco", label: "Análise de Risco", icon: <ShieldAlert size={18} />, onClick: () => { window.location.href = "/analise-risco"; } },
    { key: "ofertar", label: "Doação", icon: <HeartHandshake size={18} />, onClick: () => setTab("ofertar") },
    ...(profile && myMember ? [{ key: "member-id", label: "Member ID", icon: <LayoutDashboard size={18} />, onClick: () => { window.location.href = "/painel/carteira"; } }] : []),
    !profile
      ? { key: "entrar", label: "Entrar", icon: <LogIn size={18} />, onClick: () => { window.location.href = "/entrar"; } }
      : null,
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b-[3px] border-gold bg-navy">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-white">
            <img src="/brand/fam-logo.jpg" alt="Logo do Instituto FAM — Força Ativa da Mulher" className="h-9 w-9 rounded-full bg-white object-contain p-0.5" />
            <span className="font-display text-lg font-bold tracking-wide">FAM · FORÇA ATIVA DA MULHER</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="hidden border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white sm:inline-flex">
              <Link href="/instituto">Conheça a FAM</Link>
            </Button>
            <Button asChild size="sm" className="bg-fam-pink text-white hover:bg-fam-rose">
              <Link href={profile ? "/painel" : "/entrar"}>{profile ? "Meu Painel" : "Área do membro"}</Link>
            </Button>
          </div>
        </div>
      </header>

      <Tabs value={tab} onValueChange={setTab} className="container py-4">

        {/* === INÍCIO === */}
        <TabsContent value="inicio" className="space-y-8">
          {/* Hero rotativo (carousel) — fallback para hero estático se sem banners */}
          <HeroCarousel banners={banners}
            onSeeVideos={() => setTab("videos")}
            onSeeServices={() => { window.location.href = "/fale-conosco"; }}
          />


          {/* Últimos Vídeos */}
          {sermons.length > 0 && (
            <section>
              <div className="mb-4 flex items-center justify-between">
                        <h2 className="font-display text-xl text-navy">FAM Vídeos</h2>
                <Button variant="ghost" onClick={() => setTab("videos")} className="gap-2">Mais vídeos... <ArrowRight className="h-4 w-4" /></Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {sermons.slice(0, 5).map((s) => (
                  <a key={s.id} href={s.youtube_url} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md">
                    <div className="relative">
                      <img src={s.thumbnail_url || youtubeThumb(s.youtube_url) || ""} alt="" className="aspect-video w-full object-cover" />
                      <div className="absolute inset-0 m-auto flex h-12 w-12 items-center justify-center rounded-full bg-navy/85 text-white"><Play className="h-5 w-5" /></div>
                      {s.duration && <span className="absolute bottom-1.5 right-1.5 rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-semibold text-white">{s.duration}</span>}
                    </div>
                    <div className="p-4">
                      <b className="block text-sm text-ink">{s.title}</b>
                      <p className="mt-1 text-xs text-muted">
                        {new Date(s.published_at).toLocaleDateString("pt-BR")}
                        {s.speaker ? ` · ${s.speaker}` : ""}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* Últimas Notícias */}
          {news.length > 0 && (
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-xl text-navy">Últimas notícias</h2>
                <Button variant="ghost" onClick={() => setTab("noticias")} className="gap-2">Ver todas <ArrowRight className="h-4 w-4" /></Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {news.slice(0, 3).map((n) => (
                  <button key={n.id} onClick={() => setTab("noticias")} className="block overflow-hidden rounded-xl border bg-card text-left transition-shadow hover:shadow-md">
                    {n.cover_url && <img src={n.cover_url} alt="" className="aspect-[16/9] w-full object-cover" />}
                    <div className="p-3">
                      <b className="line-clamp-2 text-sm text-ink">{n.title}</b>
                      {n.published_at && <p className="mt-1 text-xs text-muted">{new Date(n.published_at).toLocaleDateString("pt-BR")}</p>}
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Rádio Web */}
          {showRadio && radioConfig?.is_enabled && (
            <section>
              <div className="rounded-2xl border border-gold/30 bg-navy p-5 text-white">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="font-display text-xl font-bold">Rádio Web</h2>
                    <p className="mt-1 text-sm text-white/70">{radioConfig.display_name || "Sua comunidade, sempre ouvindo"}</p>
                  </div>
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gold/20 text-gold"><Radio className="h-6 w-6" /></span>
                </div>
                {radioConfig.stream_url && (
                  <Button onClick={() => setTab("radio")} className="mt-4 w-full gap-2 bg-gold text-navy hover:bg-gold/90">
                    <Play className="h-4 w-4" /> Ouvir agora
                  </Button>
                )}
                {!radioConfig.stream_url && (
                  <Button variant="outline" onClick={() => setTab("radio")} className="mt-4 w-full gap-2 border-white/30 text-white hover:bg-white/10">
                    Acessar a Rádio
                  </Button>
                )}
              </div>
            </section>
          )}

          {/* Próximos eventos resumo */}
          {events.length > 0 && (
            <section>
              <h2 className="mb-4 font-display text-xl text-navy">Próximos eventos</h2>
              <div className="space-y-3">{events.slice(0, 3).map((ev) => <EventRow key={ev.id} ev={ev} />)}</div>
              <Button variant="ghost" onClick={() => setTab("agenda")} className="mt-4 gap-2">Ver agenda completa <ArrowRight className="h-4 w-4" /></Button>
            </section>
          )}

          {/* Dashboard institucional FAM — sem horários de culto ou agenda eclesiástica */}
          <section aria-labelledby="fam-dashboard-title">
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-fam-magenta">Força Ativa da Mulher</p>
              <h2 id="fam-dashboard-title" className="mt-1 font-display text-xl text-navy">Como podemos apoiar você hoje?</h2>
              <p className="mt-1 max-w-2xl text-sm text-muted">Acesse acolhimento, informação e orientação de proteção em um só lugar.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <button type="button" onClick={() => setTab("contato")} className="rounded-2xl border border-fam-pink/30 bg-fam-pink/10 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fam-magenta">
                <MessageCircle className="h-6 w-6 text-fam-magenta" aria-hidden="true" />
                <b className="mt-3 block text-sm text-navy">Falar com a FAM</b>
                <span className="mt-1 block text-xs text-muted">Converse com nossa equipe de acolhimento.</span>
              </button>
              <button type="button" onClick={() => setTab("noticias")} className="rounded-2xl border border-fam-gold/30 bg-fam-gold/10 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fam-magenta">
                <Newspaper className="h-6 w-6 text-fam-plum" aria-hidden="true" />
                <b className="mt-3 block text-sm text-navy">Informação FAM</b>
                <span className="mt-1 block text-xs text-muted">Leia conteúdos, orientações e notícias.</span>
              </button>
              <button type="button" onClick={() => { window.location.href = "/analise-risco"; }} className="rounded-2xl border border-fam-plum/30 bg-fam-plum/10 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fam-magenta">
                <ShieldAlert className="h-6 w-6 text-fam-plum" aria-hidden="true" />
                <b className="mt-3 block text-sm text-navy">Acolhimento e proteção</b>
                <span className="mt-1 block text-xs text-muted">Receba uma orientação inicial de segurança.</span>
              </button>
            </div>
          </section>
        </TabsContent>

        {/* === NOTÍCIAS === */}
        <TabsContent value="noticias">
          <PublicNewsSection churchId={communityId} />
        </TabsContent>

        {/* === RADIO === */}
        <TabsContent value="radio">
          <RadioPage />
        </TabsContent>

          {/* Área de eventos removida da navegação pública */}
        {/* === VÍDEOS === */}
        <TabsContent value="videos">
          <h2 className="mb-4 font-display text-2xl text-navy">FAM Vídeos</h2>
          {sermons.length === 0 ? (
            <p className="py-8 text-center italic text-muted">Em breve novos conteúdos da FAM por aqui.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sermons.map((s) => (
                <div key={s.id} className="group overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md">
                  <a href={s.youtube_url} target="_blank" rel="noreferrer" className="block relative">
                    <img src={s.thumbnail_url || youtubeThumb(s.youtube_url) || ""} alt="" className="aspect-video w-full object-cover" />
                    <div className="absolute inset-0 m-auto flex h-12 w-12 items-center justify-center rounded-full bg-navy/85 text-white"><Play className="h-5 w-5" /></div>
                  </a>
                  <div className="p-4">
                    <b className="block text-sm text-ink">{s.title}</b>
                    <p className="mt-1 text-xs text-muted">{[s.reference, s.speaker].filter(Boolean).join(" · ")}</p>
                    {s.description && <p className="mt-1 text-xs text-muted line-clamp-2">{s.description}</p>}
                    {s.pdf_url && (
                      <a href={s.pdf_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-gold hover:underline">
                        <FileDown className="h-3.5 w-3.5" /> Baixar material
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* === AGENDA === */}
        <TabsContent value="agenda">
          <h2 className="mb-4 font-display text-2xl text-navy">Agenda de ações e eventos</h2>
          {registrationEvents.length > 0 && (
            <div className="mb-6 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Eventos com inscrição</h3>
              {(() => {
                const categories = Array.from(new Set(registrationEvents.map((e) => e.category).filter((c): c is string => !!c)));
                const filtered = regEventCategory === "todos" ? registrationEvents : registrationEvents.filter((e) => e.category === regEventCategory);
                return (
                  <>
                    {categories.length > 1 && (
                      <div className="mb-2 overflow-x-auto">
                        <div className="flex min-w-max gap-1.5">
                          <button
                            onClick={() => setRegEventCategory("todos")}
                            className={`rounded-full border px-3 py-1.5 text-xs font-bold uppercase transition ${
                              regEventCategory === "todos" ? "bg-navy text-white border-navy" : "bg-card text-muted border-border hover:border-navy/30"
                            }`}
                          >
                            Todos
                          </button>
                          {categories.map((c) => (
                            <button
                              key={c}
                              onClick={() => setRegEventCategory(c)}
                              className={`rounded-full border px-3 py-1.5 text-xs font-bold uppercase transition ${
                                regEventCategory === c ? "bg-navy text-white border-navy" : "bg-card text-muted border-border hover:border-navy/30"
                              }`}
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {filtered.length === 0 ? (
                      <p className="py-4 text-center text-sm italic text-muted-foreground">Nenhum evento nessa categoria.</p>
                    ) : (
                      [...filtered].sort((a, b) => (b.highlight_public ? 1 : 0) - (a.highlight_public ? 1 : 0)).map((ev) => (
                        <EventSignupCard
                          key={ev.id}
                          event={ev}
                          origin="agenda"
                          highlighted={ev.highlight_public}
                          prefill={profile ? { full_name: profile.full_name, email: profile.email, phone: profile.phone } : null}
                        />
                      ))
                    )}
                  </>
                );
              })()}
            </div>
          )}
          <AgendaList events={events} />
        </TabsContent>

        {/* === QUERO PARTICIPAR === */}
        <TabsContent value="participar">
          <PublicParticipateSection />
        </TabsContent>

        {/* === QUERO CONVERSAR === */}
        <TabsContent value="contato">
          <PublicContactForms churchId={communityId} />
        </TabsContent>

        {/* === FAM — ACOLHIMENTO E PROTEÇÃO === */}
        <TabsContent value="risco">
          <div className="mx-auto max-w-3xl py-6">
            <div className="rounded-xl border border-gold/30 bg-gold/5 p-5">
              <h2 className="font-display text-2xl text-navy">Análise de Risco</h2>
              <p className="mt-2 text-sm text-muted">Orientação inicial para mulheres em situação de vulnerabilidade. A ferramenta não substitui emergência, polícia, saúde ou avaliação profissional.</p>
              <Button asChild className="mt-4"><Link href="/analise-risco">Iniciar análise orientativa</Link></Button>
            </div>
          </div>
        </TabsContent>

        {/* === DÍZIMOS E OFERTAS === */}
        <TabsContent value="ofertar">
          <GivingSection churchId={communityId} />
        </TabsContent>
      </Tabs>

      <RadioMiniPlayer />
      <BottomNavSpacer />

      <footer className="container flex flex-wrap items-center justify-between gap-3 border-t py-6">
        <p className="text-xs text-muted">
          Instituto FAM · Força Ativa da Mulher
          {community?.whatsapp_phone && <> · WhatsApp: <a href={`https://wa.me/${community.whatsapp_phone.replace(/\D/g, '')}`} className="hover:underline">{community.whatsapp_phone}</a></>}
        </p>
        <Link href={profile ? "/painel" : "/entrar"} className="text-xs font-bold text-gold hover:underline">{profile ? "Meu Painel" : "Área do membro"} →</Link>
      </footer>

      <BottomNav items={navItems.filter((item): item is BottomNavItem => item !== null)} activeKey={tab} />
    </div>
  );
}

function EventRow({ ev, light }: { ev: EventItem; light?: boolean }) {
  const d = new Date(ev.starts_at);
  const day = d.toLocaleDateString("pt-BR", { day:"2-digit" });
  const mon = d.toLocaleDateString("pt-BR", { month:"short" }).replace(".", "");
  const tlabel = EVENT_TYPE_LABELS[ev.event_type] ?? EVENT_TYPE_LABELS.outro;
  const tcolor = EVENT_TYPE_COLORS[ev.event_type] ?? EVENT_TYPE_COLORS.outro;
  return (
    <div className={`flex items-center gap-4 rounded-xl border p-4 ${light ? "bg-card" : "bg-navy text-white border-navy-600"}`}>
      <div className="flex w-12 flex-col items-center leading-tight">
        <b className="text-lg text-gold">{day}</b>
        <span className={`text-[11px] uppercase ${light ? "text-muted" : "text-white/70"}`}>{mon}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <b className={`truncate text-sm ${light ? "text-ink" : "text-white"}`}>{ev.title}</b>
          <span className={`whitespace-nowrap rounded-full border px-1.5 py-0.5 text-[10px] font-bold uppercase ${light ? tcolor : "border-white/30 text-white/85"}`}>{tlabel}</span>
        </div>
        <p className={`mt-0.5 text-xs ${light ? "text-muted" : "text-white/70"}`}>
          {d.toLocaleTimeString("pt-BR", { hour:"2-digit", minute:"2-digit" })}{ev.location ? ` · ${ev.location}` : ""}
        </p>
      </div>
      <span className="whitespace-nowrap rounded-full border border-gold px-2 py-1 text-[11px] font-extrabold text-gold">{STATUS_LABELS[ev.status]}</span>
    </div>
  );
}

function ChurchCard({ church }: { church: Church }) {
  const fullAddress = [church.address, church.city, church.state].filter(Boolean).join(", ");
  const mapsUrl = fullAddress ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}` : null;
  const typeLabel = church.type === "sede" ? "SEDE" : church.type === "nucleo" ? "NÚCLEO" : "IGREJA LOCAL";
  return (
    <Card>
      <CardHeader>
        <span className="text-[10px] font-extrabold tracking-widest text-gold">{typeLabel}</span>
        <CardTitle className="flex items-center gap-2"><ChurchIcon className="h-5 w-5 text-navy" />{church.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {church.address && <p className="flex items-start gap-2 text-sm text-ink"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted" />{church.address}</p>}
        {(church.city || church.state) && <p className="text-xs text-muted ml-6">{[church.city, church.state].filter(Boolean).join(" — ")}</p>}
        {mapsUrl && (
          <Button asChild variant="outline" size="sm" className="mt-3 gap-1">
            <a href={mapsUrl} target="_blank" rel="noreferrer">Ver no mapa <ExternalLink className="h-3 w-3" /></a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function AgendaList({ events }: { events: EventItem[] }) {
  const [filter, setFilter] = useState<string>("todos");
  const types = ["todos","culto","congresso","conferencia","encontro","ebd","outro"] as const;
  const filtered = filter === "todos" ? events : events.filter((e) => (e.event_type ?? "outro") === filter);

  if (events.length === 0) {
    return <p className="py-8 text-center italic text-muted">Nenhum evento publicado no momento.</p>;
  }

  return (
    <div>
      <div className="mb-4 overflow-x-auto">
        <div className="flex min-w-max gap-1.5">
          {types.map((t) => (
            <button key={t} onClick={() => setFilter(t)}
              className={`rounded-full border px-3 py-1.5 text-xs font-bold uppercase transition ${
                filter === t
                  ? "bg-navy text-white border-navy"
                  : "bg-card text-muted border-border hover:border-navy/30"
              }`}>
              {t === "todos" ? "Todos" : (EVENT_TYPE_LABELS[t] ?? t)}
            </button>
          ))}
        </div>
      </div>
      {filtered.length === 0 ? (
        <p className="py-8 text-center italic text-muted">Nenhum evento nessa categoria.</p>
      ) : (
        <div className="space-y-3">{filtered.map((ev) => <EventRow key={ev.id} ev={ev} light />)}</div>
      )}
    </div>
  );
}

function CellsSearch({ cells }: { cells: Cell[] }) {
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [weekday, setWeekday] = useState("");
  const [time, setTime] = useState("");

  // Listas para os selects (apenas valores reais já cadastrados)
  const states = Array.from(new Set(cells.map((c) => c.state).filter(Boolean) as string[])).sort();
  const cities = Array.from(new Set(cells.filter((c) => !state || c.state === state).map((c) => c.city).filter(Boolean) as string[])).sort();
  const neighborhoods = Array.from(new Set(cells.filter((c) => (!city || c.city === city) && (!state || c.state === state)).map((c) => c.neighborhood).filter(Boolean) as string[])).sort();

  const filtered = cells.filter((c) => c.is_active)
    .filter((c) => !state || c.state === state)
    .filter((c) => !city || c.city === city)
    .filter((c) => !neighborhood || c.neighborhood === neighborhood)
    .filter((c) => !weekday || c.meeting_weekday === weekday)
    .filter((c) => !time || (c.meeting_time && c.meeting_time.slice(0,2) === time));

  const hasFilter = state || city || neighborhood || weekday || time;

  function clear() {
    setState(""); setCity(""); setNeighborhood(""); setWeekday(""); setTime("");
  }

  return (
    <div>
      <div className="mb-4 rounded-xl border bg-card p-4">
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">Filtros de busca</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <select value={state} onChange={(e) => { setState(e.target.value); setCity(""); setNeighborhood(""); }}
            className="h-10 rounded-md border bg-background px-3 text-sm">
            <option value="">Estado (todos)</option>
            {states.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={city} onChange={(e) => { setCity(e.target.value); setNeighborhood(""); }}
            className="h-10 rounded-md border bg-background px-3 text-sm">
            <option value="">Cidade (todas)</option>
            {cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)}
            className="h-10 rounded-md border bg-background px-3 text-sm">
            <option value="">Bairro (todos)</option>
            {neighborhoods.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <select value={weekday} onChange={(e) => setWeekday(e.target.value)}
            className="h-10 rounded-md border bg-background px-3 text-sm">
            <option value="">Dia (qualquer)</option>
            <option value="domingo">Domingo</option>
            <option value="segunda">Segunda</option>
            <option value="terca">Terça</option>
            <option value="quarta">Quarta</option>
            <option value="quinta">Quinta</option>
            <option value="sexta">Sexta</option>
            <option value="sabado">Sábado</option>
          </select>
          <select value={time} onChange={(e) => setTime(e.target.value)}
            className="h-10 rounded-md border bg-background px-3 text-sm">
            <option value="">Horário (qualquer)</option>
            <option value="06">Manhã (06h–11h)</option>
            <option value="12">Tarde (12h–17h)</option>
            <option value="18">Noite (18h–23h)</option>
          </select>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xs text-muted">{filtered.length} célula(s) encontrada(s)</p>
          {hasFilter && <Button onClick={clear} variant="ghost" size="sm">Limpar filtros</Button>}
        </div>
      </div>

      <CellsList cells={filtered} />
    </div>
  );
}

function CellsList({ cells }: { cells: Cell[] }) {
  const active = cells.filter((c) => c.is_active);
  if (active.length === 0) return <p className="py-8 text-center italic text-muted">Nenhuma célula cadastrada ainda.</p>;
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {active.map((c) => {
        const mapsUrl = c.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.address)}` : null;
        return (
          <Card key={c.id} className="border-l-4 border-l-gold">
            <CardHeader>
              <CardTitle className="text-base">{c.name}</CardTitle>
              {c.meeting_weekday && c.meeting_time && (
                <CardDescription className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{WEEKDAY_LABELS[c.meeting_weekday]} às {c.meeting_time.slice(0,5)}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {c.address ? (
                <p className="flex items-start gap-1 text-xs text-muted"><MapPin className="mt-0.5 h-3 w-3 shrink-0" />{c.address}</p>
              ) : (
                <p className="text-xs italic text-muted">Endereço não informado</p>
              )}
              {mapsUrl && (
                <Button asChild variant="link" size="sm" className="mt-2 h-auto p-0 text-xs">
                  <a href={mapsUrl} target="_blank" rel="noreferrer">Como chegar →</a>
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function GivingSection({ churchId }: { churchId: string | null }) {
  const { data: giving } = useChurchGivingInfo(churchId);

  return (
    <div className="mx-auto max-w-lg">
      <h2 className="mb-2 text-center font-display text-2xl text-navy">Momento da Generosidade</h2>
      <p className="mb-6 text-center text-sm text-muted">Sua contribuição sustenta a obra e alcança vidas. Deus abençoe sua generosidade.</p>

      {!giving?.qr_code_url ? (
        <p className="py-12 text-center text-sm italic text-muted-foreground">
          As informações de contribuição ainda não foram cadastradas pra essa comunidade.
        </p>
      ) : (
        <Card className="overflow-hidden border-2">
          <CardContent className="space-y-4 pt-6 text-center">
            <img src={giving.qr_code_url} alt="QR Code PIX" className="mx-auto w-full max-w-md rounded-lg border object-contain" />
            {giving.pix_key && (
              <div className="rounded-md bg-muted/30 p-2">
                <p className="text-[11px] uppercase text-muted-foreground">Chave Pix</p>
                <p className="select-all font-mono text-sm text-navy">{giving.pix_key}</p>
              </div>
            )}
            <div className="border-t pt-3 text-xs text-muted-foreground">
              {giving.razao_social && <p className="font-semibold text-navy">{giving.razao_social}</p>}
              {giving.cnpj && <p>CNPJ: {giving.cnpj}</p>}
              {giving.banco && <p>{giving.banco}</p>}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
