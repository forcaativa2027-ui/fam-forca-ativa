"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { X, CalendarDays, MapPin, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";
import { listPublicRegistrationEvents, listMyEventRegistrations } from "@/services/events";
import { logEventView, logEventClick } from "@/services/eventAnalytics";
import type { Profile, RegistrationEvent } from "@/types/domain";

const SEEN_KEY_PREFIX = "cec-event-popup-seen-";

export function EventLoginPopup({ profile }: { profile: Profile | null | undefined }) {
  const [event, setEvent] = useState<RegistrationEvent | null>(null);

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;

    (async () => {
      try {
        const [visible, myRegs] = await Promise.all([
          listPublicRegistrationEvents(supabase, profile.church_id),
          listMyEventRegistrations(supabase),
        ]);
        const registeredIds = new Set(myRegs.filter((r) => r.status !== "cancelada").map((r) => r.event_id));
        const eligible = visible
          .filter((e) => !registeredIds.has(e.id))
          .filter((e) => {
            try { return sessionStorage.getItem(SEEN_KEY_PREFIX + e.id) !== "1"; } catch { return true; }
          })
          .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());

        if (!cancelled && eligible.length > 0) {
          setEvent(eligible[0]);
          logEventView(supabase, eligible[0].id, "popup");
        }
      } catch { /* pop-up é um extra — nunca deve travar o login */ }
    })();

    return () => { cancelled = true; };
  }, [profile]);

  function dismiss() {
    if (event) {
      try { sessionStorage.setItem(SEEN_KEY_PREFIX + event.id, "1"); } catch { /* localStorage indisponível — sem problema */ }
    }
    setEvent(null);
  }

  if (!event) return null;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/60 p-4" onClick={dismiss}>
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={dismiss}
          className="absolute right-3 top-3 z-10 rounded-full bg-black/40 p-1 text-white hover:bg-black/60"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>

        {event.banner_url && (
          <img src={event.banner_url} alt={event.name} className="h-40 w-full object-cover" />
        )}

        <div className="space-y-3 p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gold">Evento</p>
            <h2 className="mt-0.5 font-display text-xl text-navy">{event.name}</h2>
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

          {event.description && <p className="line-clamp-3 text-sm text-muted-foreground">{event.description}</p>}

          <Link href={`/eventos/${event.slug}?origem=popup`} onClick={() => { logEventClick(supabase, event.id, "popup"); dismiss(); }}>
            <Button className="w-full">Acessar Inscrição</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
