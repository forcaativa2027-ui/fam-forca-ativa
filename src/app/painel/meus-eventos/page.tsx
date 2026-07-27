"use client";
import { useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, MapPin, Video, QrCode, X, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MemberHeader } from "@/components/panel/MemberHeader";
import { useMyEventRegistrations, useMyProfile } from "@/hooks/use-queries";
import { supabase } from "@/lib/supabase/client";
import { cancelRegistration } from "@/services/events";
import { eventCheckinQrUrl, registrationProtocol } from "@/lib/eventShare";
import type { MyEventRegistration } from "@/types/domain";

const STATUS_LABELS: Record<string, string> = { confirmada: "Confirmada", lista_espera: "Lista de espera", cancelada: "Cancelada" };
const STATUS_COLORS: Record<string, string> = {
  confirmada: "bg-emerald-100 text-emerald-700",
  lista_espera: "bg-amber-100 text-amber-700",
  cancelada: "bg-slate-200 text-slate-500",
};

export default function MeusEventosPage() {
  const qc = useQueryClient();
  const { data: registrations = [], isLoading } = useMyEventRegistrations();
  const { data: profile } = useMyProfile();
  const [openQr, setOpenQr] = useState<string | null>(null);

  async function cancel(reg: MyEventRegistration) {
    if (!confirm(`Cancelar sua inscrição em "${reg.event.name}"?`)) return;
    try {
      await cancelRegistration(supabase, reg.id);
      qc.invalidateQueries({ queryKey: ["my-event-registrations"] });
    } catch (e) {
      alert((e as { message?: string })?.message ?? "Não foi possível cancelar.");
    }
  }

  const now = Date.now();
  const active = registrations.filter((r) => r.status !== "cancelada");
  const upcoming = active.filter((r) => new Date(r.event.end_at ?? r.event.start_at).getTime() >= now)
    .sort((a, b) => new Date(a.event.start_at).getTime() - new Date(b.event.start_at).getTime());
  const past = active.filter((r) => new Date(r.event.end_at ?? r.event.start_at).getTime() < now)
    .sort((a, b) => new Date(b.event.start_at).getTime() - new Date(a.event.start_at).getTime());
  const cancelled = registrations.filter((r) => r.status === "cancelada");

  return (
    <div className="min-h-screen bg-background">
      <MemberHeader active="dashboard" isAdmin={false} cardReady={false} onSignOut={async () => { await supabase.auth.signOut(); window.location.href = "/"; }} />
      <div className="mx-auto max-w-lg space-y-5 p-4 py-6">
        <Link href="/painel" className="inline-flex items-center gap-2 text-sm font-semibold text-navy hover:underline">
          <ArrowLeft className="h-4 w-4" /> Voltar ao painel
        </Link>
        <h1 className="font-display text-2xl text-navy">Meus Eventos</h1>

        {isLoading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Carregando…</p>
        ) : registrations.length === 0 ? (
          <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">
            Você ainda não se inscreveu em nenhum evento. Dá uma olhada na Agenda!
          </CardContent></Card>
        ) : (
          <>
            {upcoming.length > 0 && (
              <Section title="Próximos">
                {upcoming.map((r) => (
                  <RegistrationCard key={r.id} reg={r} onCancel={() => cancel(r)} onShowQr={() => setOpenQr(r.id)} showQr />
                ))}
              </Section>
            )}
            {past.length > 0 && (
              <Section title="Já aconteceram">
                {past.map((r) => <RegistrationCard key={r.id} reg={r} onCancel={() => cancel(r)} onShowQr={() => {}} showQr={false} />)}
              </Section>
            )}
            {cancelled.length > 0 && (
              <Section title="Canceladas">
                {cancelled.map((r) => <RegistrationCard key={r.id} reg={r} onCancel={() => {}} onShowQr={() => {}} showQr={false} />)}
              </Section>
            )}
          </>
        )}
      </div>

      {openQr && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/60 p-4" onClick={() => setOpenQr(null)}>
          <div className="rounded-xl bg-white p-5 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setOpenQr(null)} className="float-right -mt-1 -mr-1 text-muted-foreground"><X className="h-4 w-4" /></button>
            <img src={eventCheckinQrUrl(openQr)} alt="QR Code" className="mx-auto h-48 w-48" />
            <p className="mt-2 font-mono text-xs text-muted-foreground">Protocolo: {registrationProtocol(openQr)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Apresente este QR Code na entrada do evento.</p>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function RegistrationCard({
  reg, onCancel, onShowQr, showQr,
}: { reg: MyEventRegistration; onCancel: () => void; onShowQr: () => void; showQr: boolean }) {
  const e = reg.event;
  return (
    <Card>
      <CardContent className="space-y-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link href={`/eventos/${e.slug}`} className="font-semibold text-navy hover:underline">{e.name}</Link>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" />
                {new Date(e.start_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
              </span>
              {e.is_online
                ? <span className="inline-flex items-center gap-1"><Video className="h-3 w-3" /> Online</span>
                : e.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {e.location}</span>}
            </p>
          </div>
          <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${STATUS_COLORS[reg.status]}`}>
            {STATUS_LABELS[reg.status]}
          </span>
        </div>
        {reg.group_id && (
          <p className="flex items-center gap-1 text-[11px] text-muted-foreground"><Users className="h-3 w-3" /> Inscrição em grupo/família</p>
        )}
        {reg.checked_in_at && (
          <p className="text-[11px] text-emerald-600">✓ Check-in feito às {new Date(reg.checked_in_at).toLocaleTimeString("pt-BR")}</p>
        )}
        <div className="flex gap-2 pt-1">
          {showQr && reg.status !== "cancelada" && (
            <Button size="sm" variant="outline" className="gap-1.5" onClick={onShowQr}><QrCode className="h-3.5 w-3.5" /> Ver QR Code</Button>
          )}
          {reg.status !== "cancelada" && new Date(e.start_at).getTime() >= Date.now() && (
            <Button size="sm" variant="ghost" className="text-destructive" onClick={onCancel}>Cancelar inscrição</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
