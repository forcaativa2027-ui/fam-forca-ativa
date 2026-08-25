"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { X, CalendarDays, MapPin, Video, Volume2, VolumeX, Users, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";
import { listPublicRegistrationEvents, listMyEventRegistrations, getRegistrationSummary, listEventSpeakers } from "@/services/events";
import { logEventView, logEventClick } from "@/services/eventAnalytics";
import type { Profile, RegistrationEvent, EventRegistrationSummary, EventSpeaker, PopupRepeatMode } from "@/types/domain";

const SEEN_SESSION_PREFIX = "cec-event-popup-seen-";     // sessionStorage — "uma_vez_por_sessao"
const SEEN_FOREVER_PREFIX = "cec-event-popup-forever-";  // localStorage — "uma_vez_so"
const LAST_SHOWN_PREFIX = "cec-event-popup-last-";        // localStorage timestamp — "intervalo_horas"

function shouldShow(event: RegistrationEvent): boolean {
  const mode: PopupRepeatMode = event.popup_repeat_mode;
  try {
    if (mode === "sempre") return true;
    if (mode === "uma_vez_so") return localStorage.getItem(SEEN_FOREVER_PREFIX + event.id) !== "1";
    if (mode === "intervalo_horas") {
      const last = localStorage.getItem(LAST_SHOWN_PREFIX + event.id);
      if (!last) return true;
      const hoursPassed = (Date.now() - Number(last)) / 3_600_000;
      return hoursPassed >= (event.popup_repeat_interval_hours ?? 24);
    }
    // uma_vez_por_sessao (padrão)
    return sessionStorage.getItem(SEEN_SESSION_PREFIX + event.id) !== "1";
  } catch { return true; }
}

function markShown(event: RegistrationEvent) {
  const mode = event.popup_repeat_mode;
  try {
    if (mode === "uma_vez_so") localStorage.setItem(SEEN_FOREVER_PREFIX + event.id, "1");
    else if (mode === "intervalo_horas") localStorage.setItem(LAST_SHOWN_PREFIX + event.id, String(Date.now()));
    else if (mode !== "sempre") sessionStorage.setItem(SEEN_SESSION_PREFIX + event.id, "1");
  } catch { /* sem storage disponível — sem problema, só reaparece mais vezes */ }
}

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
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

const TEMPLATE_STYLES = {
  classico: {
    card: "bg-white", eyebrow: "text-gold", title: "text-navy", body: "text-muted-foreground",
    countdownBox: "bg-navy/5", countdownNum: "text-navy", buttonVariant: "default" as const,
  },
  moderno: {
    card: "bg-gradient-to-br from-[#0E2A47] to-[#16345A] text-white", eyebrow: "text-gold", title: "text-white", body: "text-white/75",
    countdownBox: "bg-white/10", countdownNum: "text-white", buttonVariant: "default" as const,
  },
  jovem: {
    card: "bg-gradient-to-br from-fuchsia-600 via-purple-600 to-orange-500 text-white", eyebrow: "text-yellow-200", title: "text-white", body: "text-white/90",
    countdownBox: "bg-black/15", countdownNum: "text-white", buttonVariant: "default" as const,
  },
};

export function EventLoginPopup({ profile }: { profile: Profile | null | undefined }) {
  const [event, setEvent] = useState<RegistrationEvent | null>(null);
  const [summary, setSummary] = useState<EventRegistrationSummary | null>(null);
  const [speakers, setSpeakers] = useState<EventSpeaker[]>([]);
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
          .filter((e) => e.status === "inscricoes_abertas")
          .filter(shouldShow)
          .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());

        if (!cancelled && eligible.length > 0) {
          const chosen = eligible[0];
          setEvent(chosen);
          logEventView(supabase, chosen.id, "popup");
          getRegistrationSummary(supabase, chosen.id).then((s) => !cancelled && setSummary(s));
          listEventSpeakers(supabase, chosen.id).then((sp) => !cancelled && setSpeakers(sp));
          requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
        }
      } catch { /* pop-up é um extra — nunca deve travar o login */ }
    })();

    return () => { cancelled = true; };
  }, [profile]);

  const countdownTarget = event?.registration_closes_at ?? event?.start_at ?? null;
  const countdown = useCountdown(event ? countdownTarget : null);
  const vagasRestantes = event?.capacity != null && summary ? Math.max(event.capacity - summary.confirmadas, 0) : null;
  const style = TEMPLATE_STYLES[event?.popup_template ?? "classico"];

  function dismiss() {
    if (event) markShown(event);
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
        className={`relative w-full max-w-sm overflow-hidden rounded-xl shadow-2xl transition-all duration-300 ${style.card} ${visible ? "scale-100 opacity-100" : "scale-90 opacity-0"}`}
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
            <video ref={videoRef} src={event.popup_video_url} autoPlay muted={muted} loop playsInline className="h-40 w-full object-cover" />
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
            <p className={`text-xs font-bold uppercase tracking-widest ${style.eyebrow}`}>
              {firstName ? `${firstName}, temos um evento pra você!` : "Evento"}
            </p>
            <h2 className={`mt-0.5 font-display text-xl ${style.title}`}>{event.name}</h2>
            {event.subtitle && <p className={`text-sm ${style.body}`}>{event.subtitle}</p>}
          </div>

          <p className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-sm ${style.body}`}>
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" />
              {new Date(event.start_at).toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "short" })}
            </span>
            {event.is_online
              ? <span className="inline-flex items-center gap-1.5"><Video className="h-4 w-4" /> Online</span>
              : event.location && <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {event.location}</span>}
          </p>

          {countdown && (
            <div className={`grid grid-cols-4 gap-1.5 rounded-lg p-2 text-center ${style.countdownBox}`}>
              {[["dias", countdown.days], ["hrs", countdown.hours], ["min", countdown.minutes], ["seg", countdown.seconds]].map(([label, value]) => (
                <div key={label as string}>
                  <p className={`font-mono text-lg font-bold ${style.countdownNum}`}>{String(value).padStart(2, "0")}</p>
                  <p className={`text-[9px] uppercase ${style.body}`}>{label}</p>
                </div>
              ))}
            </div>
          )}

          {vagasRestantes !== null && (
            <p className={`flex items-center gap-1.5 text-xs font-medium ${style.body}`}>
              <Users className="h-3.5 w-3.5" />
              {vagasRestantes === 0 ? "Vagas esgotadas — entre na lista de espera" : `${vagasRestantes} vaga(s) restante(s)`}
              {summary && summary.confirmadas > 0 && ` · ${summary.confirmadas} já confirmados`}
            </p>
          )}

          {speakers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {speakers.slice(0, 4).map((sp) => (
                <div key={sp.id} className="flex items-center gap-1.5 rounded-full bg-black/10 px-2 py-1">
                  {sp.photo_url ? (
                    <img src={sp.photo_url} alt={sp.name} className="h-6 w-6 rounded-full object-cover" />
                  ) : (
                    <div className="grid h-6 w-6 place-items-center rounded-full bg-black/20"><Mic className="h-3 w-3" /></div>
                  )}
                  <span className={`text-xs font-medium ${style.title}`}>{sp.name}</span>
                </div>
              ))}
            </div>
          )}

          {event.description && <p className={`line-clamp-3 text-sm ${style.body}`}>{event.description}</p>}

          <Link href={`/eventos/${event.slug}?origem=popup`} onClick={() => { logEventClick(supabase, event.id, "popup"); dismiss(); }}>
            <Button className="w-full" variant={style.buttonVariant}>Acessar Inscrição</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
