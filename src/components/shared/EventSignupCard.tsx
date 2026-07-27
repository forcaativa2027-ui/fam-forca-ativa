"use client";
import { useState } from "react";
import Link from "next/link";
import { CalendarDays, MapPin, Video, X, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase/client";
import { registerForEvent } from "@/services/events";
import type { RegistrationEvent } from "@/types/domain";

interface Prefill {
  full_name: string;
  email?: string | null;
  phone?: string | null;
}

export function EventSignupCard({
  event, compact = false, urgent = false, hideHeader = false, showDetailsLink = false, prefill = null, onRegistered,
}: {
  event: RegistrationEvent;
  /** versão compacta usada na aba Alertas */
  compact?: boolean;
  /** destaque vermelho — usado pra alertas de evento na aba Alertas */
  urgent?: boolean;
  /** esconde nome/data/local — usado na página dedicada do evento, que já mostra isso no cabeçalho */
  hideHeader?: boolean;
  /** mostra link "Ver detalhes" pra página pública /eventos/[slug] */
  showDetailsLink?: boolean;
  /** dados do membro logado, pra pular o formulário */
  prefill?: Prefill | null;
  onRegistered?: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState(prefill?.full_name ?? "");
  const [email, setEmail] = useState(prefill?.email ?? "");
  const [phone, setPhone] = useState(prefill?.phone ?? "");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<"confirmada" | "lista_espera" | null>(null);
  const [err, setErr] = useState("");

  const dateLabel = new Date(event.start_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

  async function submit() {
    if (!name.trim()) { setErr("Informe seu nome completo."); return; }
    setBusy(true); setErr("");
    try {
      const res = await registerForEvent(supabase, event.id, name.trim(), email || null, phone || null);
      setResult(res.reg_status === "lista_espera" ? "lista_espera" : "confirmada");
      onRegistered?.();
    } catch (e) {
      setErr((e as { message?: string })?.message ?? "Não foi possível concluir a inscrição.");
    } finally { setBusy(false); }
  }

  // Membro logado com dados completos → um clique só, sem formulário.
  async function quickSubmit() {
    if (!prefill?.full_name) { setShowForm(true); return; }
    setBusy(true); setErr("");
    try {
      const res = await registerForEvent(supabase, event.id, prefill.full_name, prefill.email ?? null, prefill.phone ?? null);
      setResult(res.reg_status === "lista_espera" ? "lista_espera" : "confirmada");
      onRegistered?.();
    } catch (e) {
      setErr((e as { message?: string })?.message ?? "Não foi possível concluir a inscrição.");
    } finally { setBusy(false); }
  }

  if (result) {
    return (
      <div className={`flex items-center gap-2 rounded-lg border p-3 ${compact ? "text-sm" : ""} bg-emerald-50 border-emerald-200`}>
        <Check className="h-4 w-4 shrink-0 text-emerald-600" />
        <p className="text-emerald-700">
          {result === "confirmada" ? "Inscrição confirmada!" : "Vaga esgotada — você entrou na lista de espera."}
        </p>
      </div>
    );
  }

  const wrapperClass = urgent
    ? "bg-red-50 border-red-300"
    : compact
      ? "bg-blue-50 border-blue-200"
      : "bg-card";

  return (
    <div className={`rounded-lg border p-3 ${wrapperClass}`}>
      {!hideHeader && (
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <b className={urgent ? "text-red-700" : "text-navy"}>{event.name}</b>
            <p className={`mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs ${urgent ? "text-red-600" : "text-muted-foreground"}`}>
              <span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {dateLabel}</span>
              {event.is_online
                ? <span className="inline-flex items-center gap-1"><Video className="h-3 w-3" /> Online</span>
                : event.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {event.location}</span>}
            </p>
            {!compact && event.description && <p className="mt-1.5 text-sm text-muted-foreground">{event.description}</p>}
            {showDetailsLink && (
              <Link href={`/eventos/${event.slug}`} className={`mt-1 inline-flex items-center gap-1 text-xs font-semibold underline ${urgent ? "text-red-700" : "text-navy"}`}>
                Ver detalhes <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>
          {!showForm && (
            <Button size="sm" disabled={busy} onClick={quickSubmit} className="shrink-0" variant={urgent ? "destructive" : "default"}>
              {busy ? "Enviando…" : "Inscrever-se"}
            </Button>
          )}
        </div>
      )}

      {hideHeader && !showForm && (
        <Button disabled={busy} onClick={quickSubmit} className="w-full">
          {busy ? "Enviando…" : "Inscrever-se"}
        </Button>
      )}

      {showForm && (
        <div className={hideHeader ? "space-y-2" : "mt-3 space-y-2 border-t pt-3"}>
          <Input placeholder="Nome completo" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="grid gap-2 sm:grid-cols-2">
            <Input placeholder="E-mail (opcional)" value={email ?? ""} onChange={(e) => setEmail(e.target.value)} />
            <Input placeholder="Telefone (opcional)" value={phone ?? ""} onChange={(e) => setPhone(e.target.value)} />
          </div>
          {err && <p className="text-xs text-destructive">{err}</p>}
          <div className="flex gap-2">
            <Button size="sm" onClick={submit} disabled={busy}>{busy ? "Enviando…" : "Confirmar inscrição"}</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}><X className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
      )}
      {!showForm && err && <p className="mt-2 text-xs text-destructive">{err}</p>}
    </div>
  );
}
