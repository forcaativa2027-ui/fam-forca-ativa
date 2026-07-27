"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { CalendarDays, MapPin, Video, X, Check, ArrowRight, CalendarPlus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase/client";
import { registerForEvent, registerGroupForEvent, type GroupParticipantInput } from "@/services/events";
import { logEventView, logEventClick } from "@/services/eventAnalytics";
import { registrationProtocol, googleCalendarUrl, icsDownloadUrl, eventCheckinQrUrl } from "@/lib/eventShare";
import { EventShareButtons } from "@/components/shared/EventShareButtons";
import type { RegistrationEvent, CustomFieldDefinition } from "@/types/domain";

interface Prefill {
  full_name: string;
  email?: string | null;
  phone?: string | null;
}

interface Companion {
  full_name: string;
  cpf: string;
}

interface ResultRow {
  full_name: string;
  status: "confirmada" | "lista_espera";
  registration_id: string;
}

/** Renderiza os campos personalizados definidos pelo admin e devolve as respostas. */
function CustomFieldsForm({
  fields, answers, onChange,
}: {
  fields: CustomFieldDefinition[];
  answers: Record<string, unknown>;
  onChange: (id: string, value: unknown) => void;
}) {
  if (fields.length === 0) return null;
  return (
    <div className="space-y-2 border-t pt-3">
      {fields.map((f) => (
        <div key={f.id} className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            {f.label}{f.required && " *"}
          </label>
          {f.type === "texto_curto" && (
            <Input value={(answers[f.id] as string) ?? ""} onChange={(e) => onChange(f.id, e.target.value)} />
          )}
          {f.type === "texto_longo" && (
            <textarea
              value={(answers[f.id] as string) ?? ""}
              onChange={(e) => onChange(f.id, e.target.value)}
              rows={3}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          )}
          {f.type === "data" && (
            <Input type="date" value={(answers[f.id] as string) ?? ""} onChange={(e) => onChange(f.id, e.target.value)} />
          )}
          {f.type === "sim_nao" && (
            <select
              value={(answers[f.id] as string) ?? ""}
              onChange={(e) => onChange(f.id, e.target.value)}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="">Selecione…</option>
              <option value="sim">Sim</option>
              <option value="nao">Não</option>
            </select>
          )}
          {f.type === "selecao_unica" && (
            <select
              value={(answers[f.id] as string) ?? ""}
              onChange={(e) => onChange(f.id, e.target.value)}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="">Selecione…</option>
              {(f.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          )}
          {f.type === "selecao_multipla" && (
            <div className="flex flex-wrap gap-2">
              {(f.options ?? []).map((o) => {
                const selected = ((answers[f.id] as string[]) ?? []).includes(o);
                return (
                  <button
                    key={o} type="button"
                    onClick={() => {
                      const current = (answers[f.id] as string[]) ?? [];
                      onChange(f.id, selected ? current.filter((x) => x !== o) : [...current, o]);
                    }}
                    className={`rounded-full border px-2.5 py-1 text-xs ${selected ? "bg-navy text-white border-navy" : "bg-background"}`}
                  >
                    {o}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function EventSignupCard({
  event, compact = false, urgent = false, highlighted = false, hideHeader = false, showDetailsLink = false, prefill = null, origin = null, onRegistered,
}: {
  event: RegistrationEvent;
  /** versão compacta usada na aba Alertas */
  compact?: boolean;
  /** destaque vermelho — usado pra alertas de evento na aba Alertas */
  urgent?: boolean;
  /** destaque dourado — evento marcado como "Destacar na página pública" pelo admin */
  highlighted?: boolean;
  /** esconde nome/data/local — usado na página dedicada do evento, que já mostra isso no cabeçalho */
  hideHeader?: boolean;
  /** mostra link "Ver detalhes" pra página pública /eventos/[slug] */
  showDetailsLink?: boolean;
  /** dados do membro logado, pra pré-preencher o formulário */
  prefill?: Prefill | null;
  /** de onde esse card está sendo mostrado (agenda | alertas | popup | pagina_publica...) — vira indicador no admin */
  origin?: string | null;
  onRegistered?: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState(prefill?.full_name ?? "");
  const [email, setEmail] = useState(prefill?.email ?? "");
  const [phone, setPhone] = useState(prefill?.phone ?? "");
  const [cpf, setCpf] = useState("");
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedImageUse, setAcceptedImageUse] = useState(false);
  const [customAnswers, setCustomAnswers] = useState<Record<string, unknown>>({});
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<ResultRow[] | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    logEventView(supabase, event.id, origin);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.id]);

  const dateLabel = new Date(event.start_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

  function openForm() {
    logEventClick(supabase, event.id, origin);
    setShowForm(true);
  }

  function addCompanion() {
    setCompanions((c) => [...c, { full_name: "", cpf: "" }]);
  }
  function updateCompanion(i: number, patch: Partial<Companion>) {
    setCompanions((c) => c.map((comp, idx) => (idx === i ? { ...comp, ...patch } : comp)));
  }
  function removeCompanion(i: number) {
    setCompanions((c) => c.filter((_, idx) => idx !== i));
  }

  async function submit() {
    if (!name.trim()) { setErr("Informe o nome completo."); return; }
    if (event.requires_cpf && !cpf.trim()) { setErr("CPF é obrigatório para este evento."); return; }
    if (!acceptedPrivacy) { setErr("É necessário aceitar a política de privacidade."); return; }
    const missingRequired = event.custom_fields.some((f) => f.required && !customAnswers[f.id]);
    if (missingRequired) { setErr("Preencha os campos obrigatórios."); return; }
    if (companions.some((c) => !c.full_name.trim())) { setErr("Informe o nome de todos os acompanhantes (ou remova a linha vazia)."); return; }

    setBusy(true); setErr("");
    try {
      if (companions.length === 0) {
        const res = await registerForEvent(supabase, event.id, name.trim(), email || null, phone || null, {
          cpf: cpf || null, acceptedPrivacyPolicy: acceptedPrivacy, acceptedImageUse, customAnswers,
        });
        setResults([{ full_name: name.trim(), status: res.reg_status === "lista_espera" ? "lista_espera" : "confirmada", registration_id: res.registration_id }]);
      } else {
        const participants: GroupParticipantInput[] = [
          { full_name: name.trim(), email: email || null, phone: phone || null, cpf: cpf || null, custom_answers: customAnswers },
          ...companions.map((c) => ({ full_name: c.full_name.trim(), cpf: c.cpf || null })),
        ];
        const res = await registerGroupForEvent(supabase, event.id, participants, { acceptedPrivacyPolicy: acceptedPrivacy, acceptedImageUse });
        setResults(res.map((r) => ({ full_name: r.full_name, status: r.reg_status === "lista_espera" ? "lista_espera" : "confirmada", registration_id: r.registration_id })));
      }
      onRegistered?.();
    } catch (e) {
      setErr((e as { message?: string })?.message ?? "Não foi possível concluir a inscrição.");
    } finally { setBusy(false); }
  }

  if (results) {
    const firstId = results[0]?.registration_id;
    return (
      <div className={`rounded-lg border p-3 ${compact ? "text-sm" : ""} bg-emerald-50 border-emerald-200 space-y-3`}>
        <div className="space-y-1.5">
          {results.map((r) => (
            <div key={r.registration_id} className="flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0 text-emerald-600" />
              <p className="text-emerald-700">
                <b>{r.full_name}</b>: {r.status === "confirmada" ? "inscrição confirmada!" : "vaga esgotada — entrou na lista de espera."}
              </p>
            </div>
          ))}
        </div>
        {firstId && (
          <p className="text-xs text-emerald-700/80">
            Protocolo: <b className="font-mono">{registrationProtocol(firstId)}</b>
          </p>
        )}
        {!compact && (
          <div className="flex flex-wrap gap-3">
            {results.filter((r) => r.status === "confirmada").map((r) => (
              <div key={r.registration_id} className="rounded-lg border bg-white p-2 text-center">
                <img src={eventCheckinQrUrl(r.registration_id)} alt={`QR Code — ${r.full_name}`} className="h-24 w-24" />
                <p className="mt-1 max-w-[96px] truncate text-[10px] text-muted-foreground">{r.full_name}</p>
              </div>
            ))}
          </div>
        )}
        {!compact && (
          <div className="flex flex-wrap items-center gap-2 border-t border-emerald-200 pt-3">
            <a href={googleCalendarUrl(event)} target="_blank" rel="noopener noreferrer">
              <Button type="button" size="sm" variant="outline" className="gap-1.5">
                <CalendarPlus className="h-3.5 w-3.5" /> Google Agenda
              </Button>
            </a>
            <a href={icsDownloadUrl(event)} download={`${event.slug}.ics`}>
              <Button type="button" size="sm" variant="outline" className="gap-1.5">
                <CalendarPlus className="h-3.5 w-3.5" /> Apple/Outlook (.ics)
              </Button>
            </a>
          </div>
        )}
        <EventShareButtons event={event} />
      </div>
    );
  }

  const wrapperClass = urgent
    ? "bg-red-50 border-red-300"
    : highlighted
      ? "bg-gradient-to-br from-amber-50 to-card border-gold ring-1 ring-gold/40"
      : compact ? "bg-blue-50 border-blue-200" : "bg-card";

  return (
    <div className={`relative rounded-lg border p-3 ${wrapperClass}`}>
      {highlighted && (
        <span className="absolute -top-2 left-3 rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold uppercase text-navy shadow">
          ★ Destaque
        </span>
      )}
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
              <Link href={`/eventos/${event.slug}${origin ? `?origem=${origin}` : ""}`} className={`mt-1 inline-flex items-center gap-1 text-xs font-semibold underline ${urgent ? "text-red-700" : "text-navy"}`}>
                Ver detalhes <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>
          {!showForm && (
            <Button size="sm" disabled={busy} onClick={openForm} className="shrink-0" variant={urgent ? "destructive" : "default"}>
              Inscrever-se
            </Button>
          )}
        </div>
      )}

      {hideHeader && !showForm && (
        <Button disabled={busy} onClick={openForm} className="w-full">Inscrever-se</Button>
      )}

      {showForm && (
        <div className={hideHeader ? "space-y-3" : "mt-3 space-y-3 border-t pt-3"}>
          <Input placeholder="Nome completo" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="grid gap-2 sm:grid-cols-2">
            <Input placeholder="E-mail (opcional)" value={email ?? ""} onChange={(e) => setEmail(e.target.value)} />
            <Input placeholder="Telefone (opcional)" value={phone ?? ""} onChange={(e) => setPhone(e.target.value)} />
          </div>
          {event.requires_cpf && (
            <Input placeholder="CPF (obrigatório para este evento)" value={cpf} onChange={(e) => setCpf(e.target.value)} />
          )}

          <CustomFieldsForm
            fields={event.custom_fields}
            answers={customAnswers}
            onChange={(id, value) => setCustomAnswers((a) => ({ ...a, [id]: value }))}
          />

          {/* Inscrição familiar/em grupo */}
          <div className="border-t pt-3">
            {companions.map((c, i) => (
              <div key={i} className="mb-2 flex items-center gap-2">
                <Input placeholder="Nome do acompanhante" value={c.full_name} onChange={(e) => updateCompanion(i, { full_name: e.target.value })} />
                {event.requires_cpf && (
                  <Input placeholder="CPF" value={c.cpf} onChange={(e) => updateCompanion(i, { cpf: e.target.value })} className="max-w-[140px]" />
                )}
                <Button type="button" size="sm" variant="ghost" onClick={() => removeCompanion(i)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            ))}
            {companions.length < 9 && (
              <Button type="button" size="sm" variant="outline" onClick={addCompanion} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Inscrever acompanhante (família/grupo)
              </Button>
            )}
          </div>

          <div className="space-y-1.5 border-t pt-3">
            <label className="flex items-start gap-2 text-xs text-muted-foreground">
              <input type="checkbox" checked={acceptedPrivacy} onChange={(e) => setAcceptedPrivacy(e.target.checked)} className="mt-0.5" />
              Li e aceito a <Link href="/privacidade" target="_blank" className="underline">política de privacidade</Link>. *
            </label>
            {event.requires_image_consent && (
              <label className="flex items-start gap-2 text-xs text-muted-foreground">
                <input type="checkbox" checked={acceptedImageUse} onChange={(e) => setAcceptedImageUse(e.target.checked)} className="mt-0.5" />
                Autorizo o uso da minha imagem neste evento para fins de divulgação.
              </label>
            )}
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
