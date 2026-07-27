"use client";
import Link from "next/link";
import { ArrowLeft, CalendarDays, MapPin, Video } from "lucide-react";
import { DarkBlueTheme } from "@/components/shared/DarkBlueTheme";
import { Card, CardContent } from "@/components/ui/card";
import { EventSignupCard } from "@/components/shared/EventSignupCard";
import { EventShareButtons } from "@/components/shared/EventShareButtons";
import { useRegistrationEventBySlug, useMyProfile } from "@/hooks/use-queries";

export default function EventoPage({ params, searchParams }: { params: { slug: string }; searchParams: { origem?: string } }) {
  const { data: event, isLoading } = useRegistrationEventBySlug(params.slug);
  const { data: profile } = useMyProfile();
  const origin = searchParams?.origem || "pagina_publica";

  return (
    <DarkBlueTheme className="p-4">
      <div className="mx-auto max-w-lg py-8">
        <Link href="/?tab=agenda" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Voltar à agenda
        </Link>

        {isLoading ? (
          <p className="py-16 text-center text-white/70">Carregando evento…</p>
        ) : !event ? (
          <Card><CardContent className="py-16 text-center text-muted-foreground">Evento não encontrado ou inscrições encerradas.</CardContent></Card>
        ) : (
          <>
            {event.banner_url && (
              <img src={event.banner_url} alt={event.name} className="mb-4 w-full rounded-xl object-cover" style={{ maxHeight: 220 }} />
            )}
            <Card className="overflow-hidden">
              <CardContent className="space-y-4 p-6">
                <div>
                  <h1 className="font-display text-2xl text-navy">{event.name}</h1>
                  <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-4 w-4" />
                      {new Date(event.start_at).toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "short" })}
                    </span>
                    {event.is_online
                      ? <span className="inline-flex items-center gap-1.5"><Video className="h-4 w-4" /> Online</span>
                      : event.location && <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {event.location}</span>}
                  </p>
                </div>
                {event.description && <p className="whitespace-pre-line text-sm text-muted-foreground">{event.description}</p>}

                <div className="border-t pt-3">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Compartilhar este evento</p>
                  <EventShareButtons event={event} />
                </div>

                <EventSignupCard
                  event={event}
                  hideHeader
                  origin={origin}
                  prefill={profile ? { full_name: profile.full_name, email: profile.email, phone: profile.phone } : null}
                />
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DarkBlueTheme>
  );
}
