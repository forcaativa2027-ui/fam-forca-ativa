"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { X, CalendarDays, MapPin, Video, Volume2, VolumeX, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";
import { listPublicRegistrationEvents, listMyEventRegistrations, getRegistrationSummary } from "@/services/events";
import { logEventView, logEventClick } from "@/services/eventAnalytics";
import type { Profile, RegistrationEvent, EventRegistrationSummary } from "@/types/domain";

const SEEN_KEY_PREFIX = "cec-event-popup-seen-";

function useCountdown(target: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!target) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);
  if (!target) return null;
  const diff = new Date(target).getTime() - now;
  if (diff <= 0) return null;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { days, hours, minutes, seconds };
}

export function EventLoginPopup({ profile }: { profile: Profile | null | undefined }) {
  const [event, setEvent] = useState<RegistrationEvent | null>(null);
  const [summary, setSummary] = useState<EventRegistrationSummary | null>(null);
  const [visible, setVisible] = useState(false);
  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;

    (async () => {
      try {
        const [visibleEvents, myRegs] = await Promise.all([
          listPublicRegistrationEvents(supabase, profile.church_id),
          listMyEventRegistrations(supabase),
        ]);
        const registeredIds = new Set(myRegs.filter((r) => r.status !== "cancelada").map((r) => r.event_id));
        const eligible = visibleEvents
          .filter((e) => !registeredIds.has(e.id))
          .filter((e) => e.status === "inscricoes_abertas") // pop-up só faz sentido pra quem ainda pode se inscrever
          .filter((e) => {
            try { return sessionStorage.getItem(SEEN_KEY_PREFIX + e.id) !== "1"; } catch { return true; }
          })
          .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());

        if (!cancelled && eligible.length > 0) {
          const chosen = eligible[0];
          setEvent(chosen);
          logEventView(supabase, chosen.id, "popup");
          getRegistrationSummary(supabase, chosen.id).then((s) => !cancelled && setSummary(s));
          // pequeno atraso pra animação de entrada disparar depois do mount
          requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
        }
      } catch { /* pop-up é um extra — nunca deve travar o login */ }
    })();

    return () => { cancelled = true; };
  }, [profile]);

  const countdownTarget = event?.registration_closes_at ?? event?.start_at ?? null;
  const countdown = useCountdown(event ? countdownTarget : null);
  const vagasRestantes = event?.capacity != null && summary ? Math.max(event.capacity - summary.confirmadas, 0) : null;

  function dismiss() {
    if (event) {
      try { sessionStorage.setItem(SEEN_KEY_PREFIX + event.id, "1"); } catch { /* localStorage indisponível — sem problema */ }
    }
    setVisible(false);
    setTimeout(() => setEvent(null), 200);
  }

  function toggleSound() {
    setMuted((m) => !m);
    if (videoRef.current) videoRef.current.muted = !videoRef.current.muted;
  }

  if (!event) return null;
  const firstName = profile?.full_name?.split(" ")[0];

  return (
    <div
      className={`fixed inset-0 z-[100] grid place-items-center bg-black/60 p-4 transition-opacity duration-200 ${visible ? "opacity-100" : "opacity-0"}`}
      onClick={dismiss}
    >
      <div
        className={`relative w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-2xl transition-all duration-300 ${visible ? "scale-100 opacity-100" : "scale-90 opacity-0"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={dismiss}
          className="absolute right-3 top-3 z-10 rounded-full bg-black/40 p-1 text-white hover:bg-black/60"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>

        {event.popup_video_url ? (
          <div className="relative">
            <video
              ref={videoRef}
              src={event.popup_video_url}
              autoPlay muted={muted} loop playsInline
              className="h-40 w-full object-cover"
            />
            <button
              onClick={toggleSound}
              className="absolute bottom-2 right-2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70"
              aria-label={muted ? "Ativar som" : "Silenciar"}
            >
              {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            </button>
          </div>
        ) : event.banner_url ? (
          <img src={event.banner_url} alt={event.name} className="h-40 w-full object-cover" />
        ) : null}

        <div className="space-y-3 p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gold">
              {firstName ? `${firstName}, temos um evento pra você!` : "Evento"}
            </p>
            <h2 className="mt-0.5 font-display text-xl text-navy">{event.name}</h2>
            {event.subtitle && <p className="text-sm text-muted-foreground">{event.subtitle}</p>}
          </div>

          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" />
              {new Date(event.start_at).toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "short" })}
            </span>
            {event.is_online
              ? <span className="inline-flex items-center gap-1.5"><Video className="h-4 w-4" /> Online</span>
              : event.location && <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {event.location}</span>}
          </p>

          {countdown && (
            <div className="grid grid-cols-4 gap-1.5 rounded-lg bg-navy/5 p-2 text-center">
              {[["dias", countdown.days], ["hrs", countdown.hours], ["min", countdown.minutes], ["seg", countdown.seconds]].map(([label, value]) => (
                <div key={label as string}>
                  <p className="font-mono text-lg font-bold text-navy">{String(value).padStart(2, "0")}</p>
                  <p className="text-[9px] uppercase text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          )}

          {vagasRestantes !== null && (
            <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              {vagasRestantes === 0 ? "Vagas esgotadas — entre na lista de espera" : `${vagasRestantes} vaga(s) restante(s)`}
              {summary && summary.confirmadas > 0 && ` · ${summary.confirmadas} já confirmados`}
            </p>
          )}

          {event.description && <p className="line-clamp-3 text-sm text-muted-foreground">{event.description}</p>}

          <Link href={`/eventos/${event.slug}?origem=popup`} onClick={() => { logEventClick(supabase, event.id, "popup"); dismiss(); }}>
            <Button className="w-full">Acessar Inscrição</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
