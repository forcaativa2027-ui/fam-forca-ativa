"use client";
import Link from "next/link";
import { useState } from "react";
import {
  Play, Calendar, Music, MapPin, Church as ChurchIcon, Sun, Sparkles,
  Clock, ArrowRight, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  usePublicSermons, usePublicEvents, useChurches, useCells,
} from "@/hooks/use-queries";
import { youtubeThumb } from "@/services/content";
import { getDefaultServices, getTodaysWord } from "@/services/institutional";
import type { EventItem, Church, Cell } from "@/types/domain";

const STATUS_LABELS: Record<EventItem["status"], string> = {
  abertas: "Inscrições abertas", encerradas: "Encerradas", esgotado: "Esgotado", em_breve: "Em breve",
};
const WEEKDAY_LABELS: Record<string, string> = {
  domingo: "Domingo", segunda: "Segunda", terca: "Terça",
  quarta: "Quarta", quinta: "Quinta", sexta: "Sexta", sabado: "Sábado",
};

export default function PublicHome() {
  const [tab, setTab] = useState("inicio");
  const { data: sermons = [] } = usePublicSermons();
  const { data: events = [] } = usePublicEvents();
  const { data: churches = [] } = useChurches();
  const { data: cells = [] } = useCells();
  const word = getTodaysWord();
  const featured = sermons.find((s) => s.is_featured) ?? sermons[0];
  const sede = churches.find((c) => c.type === "sede") ?? churches[0] ?? null;
  const services = getDefaultServices(sede);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b-[3px] border-gold bg-navy">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-white">
            <Sparkles className="h-5 w-5 text-gold" />
            <span className="font-display text-lg font-bold tracking-wide">CEC FAMILY</span>
          </Link>
          <Button asChild size="sm"><Link href="/entrar">Área do membro</Link></Button>
        </div>
      </header>

      <Tabs value={tab} onValueChange={setTab} className="container py-4">
        <div className="overflow-x-auto">
          <TabsList className="bg-transparent border-b border-border rounded-none h-auto justify-start gap-0 p-0 min-w-max">
            <NavTrigger value="inicio">Início</NavTrigger>
            <NavTrigger value="cultos">Cultos</NavTrigger>
            <NavTrigger value="videos">Vídeos</NavTrigger>
            <NavTrigger value="agenda">Agenda</NavTrigger>
            <NavTrigger value="igrejas">Igrejas</NavTrigger>
            <NavTrigger value="celulas">Mapa de Células</NavTrigger>
          </TabsList>
        </div>

        {/* === INÍCIO === */}
        <TabsContent value="inicio" className="space-y-8">
          {/* Hero */}
          <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy-600 to-navy p-8 md:p-12">
            <span className="inline-block rounded-full border border-gold px-3 py-1 text-[11px] font-extrabold tracking-widest text-gold">CEC MANAUS</span>
            <h1 className="mt-4 font-display text-3xl md:text-5xl font-semibold leading-tight text-white">Bem-vindo à nossa família</h1>
            <p className="mt-3 max-w-xl text-sm md:text-base text-white/80">
              Acompanhe pregações, agenda, cultos e a vida das nossas células — abertos a todos.
              Para discipulado e gestão pastoral, entre na área do membro.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={() => setTab("videos")} className="gap-2"><Play className="h-4 w-4" /> Ver pregações</Button>
              <Button variant="outline" onClick={() => setTab("cultos")} className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white">Horários de culto</Button>
            </div>
          </section>

          {/* Palavra do dia */}
          <section>
            <Card className="bg-gradient-to-br from-gold/10 to-gold/0 border-gold/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-navy"><Sun className="h-5 w-5 text-gold" />{word.title}</CardTitle>
                {word.verse_ref && <CardDescription className="text-base font-semibold text-gold">{word.verse_ref}</CardDescription>}
              </CardHeader>
              <CardContent>
                {word.verse_text && <p className="font-display text-lg italic text-ink leading-relaxed">"{word.verse_text}"</p>}
                {word.reflection && <p className="mt-3 text-sm text-muted">{word.reflection}</p>}
              </CardContent>
            </Card>
          </section>

          {/* Mensagem em destaque */}
          {featured && (
            <section>
              <h2 className="mb-4 font-display text-xl text-navy">Mensagem em destaque</h2>
              <a href={featured.youtube_url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-2xl border bg-navy">
                <div className="relative">
                  <img src={featured.thumbnail_url || youtubeThumb(featured.youtube_url) || ""} alt="" className="aspect-video w-full object-cover" />
                  <div className="absolute inset-0 m-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold/95 text-navy"><Play className="h-7 w-7" /></div>
                </div>
                <div className="p-5">
                  <b className="text-lg text-white">{featured.title}</b>
                  <p className="mt-1 text-sm text-white/70">{[featured.reference, featured.speaker].filter(Boolean).join(" · ")}</p>
                </div>
              </a>
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
        </TabsContent>

        {/* === CULTOS === */}
        <TabsContent value="cultos">
          <h2 className="mb-2 font-display text-2xl text-navy">Cultos e encontros</h2>
          <p className="mb-6 text-sm text-muted">Horários e dias das celebrações na {sede?.name ?? "Sede"}.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {services.map((s) => (
              <Card key={s.id} className="border-l-4 border-l-gold">
                <CardContent className="flex items-center gap-4 pt-6">
                  <div className="text-center">
                    <b className="block font-display text-xl text-navy">{s.time}</b>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-muted">{WEEKDAY_LABELS[s.weekday]}</span>
                  </div>
                  <div className="flex-1 border-l border-border pl-4">
                    <b className="text-ink">{s.description ?? "Culto"}</b>
                    {sede?.address && <p className="mt-1 flex items-center gap-1 text-xs text-muted"><MapPin className="h-3 w-3" />{sede.address}</p>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* === VÍDEOS === */}
        <TabsContent value="videos">
          <h2 className="mb-4 font-display text-2xl text-navy">Pregações</h2>
          {sermons.length === 0 ? (
            <p className="py-8 text-center italic text-muted">Em breve novas pregações por aqui.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sermons.map((s) => (
                <a key={s.id} href={s.youtube_url} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md">
                  <div className="relative">
                    <img src={s.thumbnail_url || youtubeThumb(s.youtube_url) || ""} alt="" className="aspect-video w-full object-cover" />
                    <div className="absolute inset-0 m-auto flex h-12 w-12 items-center justify-center rounded-full bg-navy/85 text-white"><Play className="h-5 w-5" /></div>
                  </div>
                  <div className="p-4">
                    <b className="block text-sm text-ink">{s.title}</b>
                    <p className="mt-1 text-xs text-muted">{[s.reference, s.speaker].filter(Boolean).join(" · ")}</p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </TabsContent>

        {/* === AGENDA === */}
        <TabsContent value="agenda">
          <h2 className="mb-4 font-display text-2xl text-navy">Agenda</h2>
          {events.length === 0 ? (
            <p className="py-8 text-center italic text-muted">Nenhum evento publicado no momento.</p>
          ) : (
            <div className="space-y-3">{events.map((ev) => <EventRow key={ev.id} ev={ev} light />)}</div>
          )}
        </TabsContent>

        {/* === IGREJAS === */}
        <TabsContent value="igrejas">
          <h2 className="mb-4 font-display text-2xl text-navy">Nossas igrejas</h2>
          {churches.length === 0 ? (
            <p className="py-8 text-center italic text-muted">Nenhuma igreja cadastrada.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {churches.map((c) => <ChurchCard key={c.id} church={c} />)}
            </div>
          )}
        </TabsContent>

        {/* === MAPA DAS CÉLULAS === */}
        <TabsContent value="celulas">
          <h2 className="mb-2 font-display text-2xl text-navy">Mapa das células</h2>
          <p className="mb-6 text-sm text-muted">Encontre a célula (Life Group) mais próxima de você.</p>
          <CellsList cells={cells} />
        </TabsContent>
      </Tabs>

      <footer className="container flex flex-wrap items-center justify-between gap-3 border-t py-6">
        <p className="text-xs text-muted">CEC Manaus · Comunidade Evangélica Cristã</p>
        <Link href="/entrar" className="text-xs font-bold text-gold hover:underline">Área do membro →</Link>
      </footer>
    </div>
  );
}

function NavTrigger({ value, children }: { value: string; children: React.ReactNode }) {
  return (
    <TabsTrigger value={value} className="rounded-none bg-transparent px-4 py-3 text-sm font-semibold text-muted data-[state=active]:bg-transparent data-[state=active]:text-navy data-[state=active]:border-b-2 data-[state=active]:border-gold">
      {children}
    </TabsTrigger>
  );
}

function EventRow({ ev, light }: { ev: EventItem; light?: boolean }) {
  const d = new Date(ev.starts_at);
  const day = d.toLocaleDateString("pt-BR", { day:"2-digit" });
  const mon = d.toLocaleDateString("pt-BR", { month:"short" }).replace(".", "");
  return (
    <div className={`flex items-center gap-4 rounded-xl border p-4 ${light ? "bg-card" : "bg-navy text-white border-navy-600"}`}>
      <div className="flex w-12 flex-col items-center leading-tight">
        <b className="text-lg text-gold">{day}</b>
        <span className={`text-[11px] uppercase ${light ? "text-muted" : "text-white/70"}`}>{mon}</span>
      </div>
      <div className="flex-1">
        <b className={`text-sm ${light ? "text-ink" : "text-white"}`}>{ev.title}</b>
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
