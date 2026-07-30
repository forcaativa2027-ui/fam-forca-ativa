"use client";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, X, Users, FileDown, ArrowLeft, Mic, ArrowUpCircle, ArrowDownCircle, Star, ListOrdered } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  useRegistrationEventsAdmin, useEventRegistrations, useEventRegistrationSummary, useChurches,
  useEventFunnel, useEventAnalyticsByOrigin, useEventSpeakers, useEventFeedbackSummary, useEventSchedule,
} from "@/hooks/use-queries";
import { supabase } from "@/lib/supabase/client";
import {
  createRegistrationEvent, updateRegistrationEvent, deleteRegistrationEvent, cancelRegistration, saveEventSpeakers,
  adminUpdateRegistration, adminMoveRegistrationStatus, finalizeEventAttendance, saveEventSchedule,
} from "@/services/events";
import { logAudit, diffFields } from "@/services/audit";
import { CheckinScanner } from "./EventCheckinAdmin";
import { MediaLibraryPicker } from "@/components/shared/MediaLibraryPicker";
import { TaxonomyPicker } from "@/components/shared/TaxonomyPicker";
import { exportToExcel } from "@/lib/export";
import type {
  RegistrationEvent, RegistrationEventStatus, CustomFieldDefinition, CustomFieldType,
  PopupTemplate, PopupRepeatMode, EventSpeaker, EventRegistration, EventScheduleItem,
} from "@/types/domain";

const STATUS_LABELS: Record<RegistrationEventStatus, string> = {
  rascunho: "Rascunho",
  em_revisao: "Em revisão",
  agendado: "Agendado",
  inscricoes_abertas: "Inscrições abertas",
  inscricoes_encerradas: "Inscrições encerradas",
  lotado: "Lotado",
  em_andamento: "Em andamento",
  finalizado: "Finalizado",
  cancelado: "Cancelado",
  arquivado: "Arquivado",
};
const STATUS_COLORS: Record<RegistrationEventStatus, string> = {
  rascunho: "bg-slate-100 text-slate-600",
  em_revisao: "bg-slate-100 text-slate-600",
  agendado: "bg-sky-100 text-sky-700",
  inscricoes_abertas: "bg-emerald-100 text-emerald-700",
  inscricoes_encerradas: "bg-amber-100 text-amber-700",
  lotado: "bg-orange-100 text-orange-700",
  em_andamento: "bg-purple-100 text-purple-700",
  finalizado: "bg-slate-200 text-slate-700",
  cancelado: "bg-red-100 text-red-700",
  arquivado: "bg-slate-100 text-slate-500",
};
const CUSTOM_FIELD_TYPE_LABELS: Record<CustomFieldType, string> = {
  texto_curto: "Texto curto", texto_longo: "Texto longo", selecao_unica: "Seleção única",
  selecao_multipla: "Seleção múltipla", sim_nao: "Sim ou não", data: "Data",
};

const CATEGORY_SUGGESTIONS = [
  "Culto Especial", "Conferência", "Congresso", "Encontro", "Retiro", "Acampamento", "Curso",
  "Treinamento", "Escola de Líderes", "Encontro com Deus", "Evento de Jovens", "Evento de Casais",
  "Evento Infantil", "Evento Feminino", "Evento Masculino", "Ação Social", "Campanha Missionária",
  "Reunião", "Celebração",
];

/** Status "efetivo" calculado a partir dos dados (não muda o status salvo no banco) —
 *  evita que o admin precise ficar trocando manualmente quando a capacidade lota ou o evento já passou. */
function computedBadge(e: RegistrationEvent): { label: string; className: string } | null {
  const now = Date.now();
  const start = new Date(e.start_at).getTime();
  const end = e.end_at ? new Date(e.end_at).getTime() : start;
  if (e.status === "inscricoes_abertas" && e.capacity != null) {
    // (a contagem de confirmados vem do resumo, não temos aqui na listagem — indicamos por capacidade só quando fizer sentido no futuro)
  }
  if ((e.status === "inscricoes_abertas" || e.status === "inscricoes_encerradas") && now >= start && now <= end) {
    return { label: "Em andamento", className: STATUS_COLORS.em_andamento };
  }
  if ((e.status === "inscricoes_abertas" || e.status === "inscricoes_encerradas") && now > end) {
    return { label: "Finalizado", className: STATUS_COLORS.finalizado };
  }
  return null;
}

function slugify(s: string): string {
  return s.trim().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}

export function RegistrationEventsAdmin() {
  const qc = useQueryClient();
  const { data: events = [] } = useRegistrationEventsAdmin();
  const [editing, setEditing] = useState<RegistrationEvent | null>(null);
  const [open, setOpen] = useState(false);
  const [viewingRegistrants, setViewingRegistrants] = useState<RegistrationEvent | null>(null);

  async function remove(e: RegistrationEvent) {
    if (!confirm(`Excluir o evento "${e.name}"? As inscrições vinculadas também serão apagadas.`)) return;
    try {
      await deleteRegistrationEvent(supabase, e.id);
      await logAudit(supabase, "delete", "registration_events", e.id, {}, { before: e as unknown as Record<string, unknown> });
      qc.invalidateQueries({ queryKey: ["registration-events-admin"] });
    } catch (err) { alert((err as { message?: string })?.message ?? "Erro ao excluir"); }
  }

  if (viewingRegistrants) {
    return <RegistrantsView event={viewingRegistrants} onBack={() => setViewingRegistrants(null)} />;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Eventos com Inscrição</CardTitle>
            <CardDescription>
              Diferente da Agenda simples — aqui o evento tem inscrição de verdade, capacidade e lista de espera.
              Aprovação é sempre automática; pagamento ainda não está disponível (eventos são gratuitos por enquanto).
            </CardDescription>
          </div>
          <Button onClick={() => { setEditing(null); setOpen(true); }} className="gap-1.5"><Plus size={16} /> Novo evento</Button>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="py-6 text-center text-sm italic text-muted-foreground">Nenhum evento cadastrado ainda.</p>
          ) : (
            <div className="space-y-2">
              {events.map((e) => (
                <div key={e.id} className="flex items-center justify-between rounded-md border bg-card p-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <b className="text-navy">{e.name}</b>
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${STATUS_COLORS[e.status]}`}>
                        {STATUS_LABELS[e.status]}
                      </span>
                      {computedBadge(e) && (
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${computedBadge(e)!.className}`} title="Calculado pela data — não muda o status salvo">
                          {computedBadge(e)!.label}
                        </span>
                      )}
                      {e.category && (
                        <span className="rounded border px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">{e.category}</span>
                      )}
                      {e.capacity != null && (
                        <span className="rounded border px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
                          Capacidade: {e.capacity}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {new Date(e.start_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                      {e.location ? ` · ${e.location}` : ""}{e.is_online ? " · Online" : ""}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => setViewingRegistrants(e)} variant="outline" size="sm" className="gap-1.5">
                      <Users size={14} /> Inscritos
                    </Button>
                    <Button onClick={() => { setEditing(e); setOpen(true); }} variant="outline" size="sm"><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button onClick={() => remove(e)} variant="destructive" size="sm"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {open && <EventForm event={editing} onClose={() => setOpen(false)} />}
    </div>
  );
}

function EventForm({ event, onClose }: { event: RegistrationEvent | null; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: churches = [] } = useChurches();
  const [name, setName] = useState(event?.name ?? "");
  const [slug, setSlug] = useState(event?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!event);
  const [description, setDescription] = useState(event?.description ?? "");
  const [subtitle, setSubtitle] = useState(event?.subtitle ?? "");
  const [category, setCategory] = useState(event?.category ?? "");
  const [targetAudience, setTargetAudience] = useState(event?.target_audience ?? "");
  const [highlightDashboard, setHighlightDashboard] = useState(event?.highlight_dashboard ?? false);
  const [highlightPublic, setHighlightPublic] = useState(event?.highlight_public ?? false);
  const [requiresCpf, setRequiresCpf] = useState(event?.requires_cpf ?? false);
  const [requiresImageConsent, setRequiresImageConsent] = useState(event?.requires_image_consent ?? false);
  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>(event?.custom_fields ?? []);
  const [bannerUrl, setBannerUrl] = useState(event?.banner_url ?? "");
  const [popupVideoUrl, setPopupVideoUrl] = useState(event?.popup_video_url ?? "");
  const [popupTemplate, setPopupTemplate] = useState<PopupTemplate>(event?.popup_template ?? "classico");
  const [popupRepeatMode, setPopupRepeatMode] = useState<PopupRepeatMode>(event?.popup_repeat_mode ?? "uma_vez_por_sessao");
  const [popupRepeatIntervalHours, setPopupRepeatIntervalHours] = useState(event?.popup_repeat_interval_hours?.toString() ?? "24");
  const { data: existingSpeakers = [] } = useEventSpeakers(event?.id ?? null);
  const [speakers, setSpeakers] = useState<EventSpeaker[]>([]);
  useEffect(() => { if (existingSpeakers.length > 0) setSpeakers(existingSpeakers); }, [existingSpeakers]);
  const { data: existingSchedule = [] } = useEventSchedule(event?.id ?? null);
  const [schedule, setSchedule] = useState<EventScheduleItem[]>([]);
  useEffect(() => { if (existingSchedule.length > 0) setSchedule(existingSchedule); }, [existingSchedule]);
  const [churchId, setChurchId] = useState(event?.church_id ?? "");
  const [location, setLocation] = useState(event?.location ?? "");
  const [isOnline, setIsOnline] = useState(event?.is_online ?? false);
  const [onlineUrl, setOnlineUrl] = useState(event?.online_url ?? "");
  const [startAt, setStartAt] = useState(event?.start_at ? event.start_at.slice(0, 16) : "");
  const [endAt, setEndAt] = useState(event?.end_at ? event.end_at.slice(0, 16) : "");
  const [regOpensAt, setRegOpensAt] = useState(event?.registration_opens_at ? event.registration_opens_at.slice(0, 16) : "");
  const [regClosesAt, setRegClosesAt] = useState(event?.registration_closes_at ? event.registration_closes_at.slice(0, 16) : "");
  const [capacity, setCapacity] = useState(event?.capacity?.toString() ?? "");
  const [status, setStatus] = useState<RegistrationEventStatus>(event?.status ?? "rascunho");
  const [cancellationReason, setCancellationReason] = useState(event?.cancellation_reason ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  function handleNameChange(v: string) {
    setName(v);
    if (!slugTouched) setSlug(slugify(v));
  }

  function addCustomField() {
    setCustomFields((f) => [...f, { id: crypto.randomUUID(), label: "", type: "texto_curto", required: false, options: [] }]);
  }
  function updateCustomField(i: number, patch: Partial<CustomFieldDefinition>) {
    setCustomFields((f) => f.map((field, idx) => (idx === i ? { ...field, ...patch } : field)));
  }
  function removeCustomField(i: number) {
    setCustomFields((f) => f.filter((_, idx) => idx !== i));
  }

  function addSpeaker() {
    setSpeakers((s) => [...s, { id: crypto.randomUUID(), event_id: event?.id ?? "", name: "", photo_url: null, topic: null, order_index: s.length, created_at: "" }]);
  }
  function updateSpeaker(i: number, patch: Partial<EventSpeaker>) {
    setSpeakers((s) => s.map((sp, idx) => (idx === i ? { ...sp, ...patch } : sp)));
  }
  function removeSpeaker(i: number) {
    setSpeakers((s) => s.filter((_, idx) => idx !== i));
  }

  function addScheduleItem() {
    setSchedule((s) => [...s, {
      id: crypto.randomUUID(), event_id: event?.id ?? "", start_at: startAt ? new Date(startAt).toISOString() : new Date().toISOString(),
      end_at: null, title: "", description: null, location: null, speaker_id: null, order_index: s.length, created_at: "",
    }]);
  }
  function updateScheduleItem(i: number, patch: Partial<EventScheduleItem>) {
    setSchedule((s) => s.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }
  function removeScheduleItem(i: number) {
    setSchedule((s) => s.filter((_, idx) => idx !== i));
  }

  async function save() {
    if (!name.trim()) { setErr("Nome é obrigatório."); return; }
    if (!slug.trim()) { setErr("Slug é obrigatório."); return; }
    if (!startAt) { setErr("Data/hora de início é obrigatória."); return; }
    if (isOnline && !onlineUrl.trim()) { setErr("Informe o link do evento online."); return; }
    if (status === "cancelado" && !cancellationReason.trim()) { setErr("Informe o motivo do cancelamento — os inscritos verão essa mensagem."); return; }
    setBusy(true); setErr("");
    try {
      const payload = {
        name: name.trim(),
        slug: slug.trim(),
        description: description || null,
        subtitle: subtitle || null,
        category: category || null,
        target_audience: targetAudience || null,
        highlight_dashboard: highlightDashboard,
        highlight_public: highlightPublic,
        banner_url: bannerUrl || null,
        popup_video_url: popupVideoUrl || null,
        church_id: churchId || null,
        location: location || null,
        is_online: isOnline,
        online_url: isOnline ? onlineUrl.trim() : null,
        start_at: new Date(startAt).toISOString(),
        end_at: endAt ? new Date(endAt).toISOString() : null,
        registration_opens_at: regOpensAt ? new Date(regOpensAt).toISOString() : null,
        registration_closes_at: regClosesAt ? new Date(regClosesAt).toISOString() : null,
        capacity: capacity ? Number(capacity) : null,
        status,
        requires_cpf: requiresCpf,
        requires_image_consent: requiresImageConsent,
        custom_fields: customFields.filter((f) => f.label.trim() !== ""),
        popup_template: popupTemplate,
        popup_repeat_mode: popupRepeatMode,
        popup_repeat_interval_hours: popupRepeatMode === "intervalo_horas" ? Number(popupRepeatIntervalHours) || 24 : null,
        cancellation_reason: status === "cancelado" ? cancellationReason.trim() : null,
      };
      let eventId = event?.id;
      if (event) {
        await updateRegistrationEvent(supabase, event.id, payload);
        const diff = diffFields(event as unknown as Record<string, unknown>, payload as unknown as Record<string, unknown>);
        await logAudit(supabase, "update", "registration_events", event.id, {}, diff ?? undefined);
      } else {
        const created = await createRegistrationEvent(supabase, payload);
        eventId = created.id;
        await logAudit(supabase, "insert", "registration_events", created.id, {}, { after: created as unknown as Record<string, unknown> });
      }
      if (eventId) {
        await saveEventSpeakers(supabase, eventId, speakers.filter((s) => s.name.trim() !== ""));
        await saveEventSchedule(supabase, eventId, schedule.filter((s) => s.title.trim() !== ""));
      }
      qc.invalidateQueries({ queryKey: ["registration-events-admin"] });
      qc.invalidateQueries({ queryKey: ["registration-events-public"] });
      onClose();
    } catch (e) {
      const msg = (e as { message?: string })?.message ?? "Erro ao salvar";
      setErr(msg.includes("slug") ? "Já existe um evento com esse slug. Escolha outro." : msg);
    } finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <Card className="max-h-[90vh] w-full max-w-lg overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{event ? "Editar evento" : "Novo evento"}</CardTitle>
          <Button onClick={onClose} variant="ghost" size="sm"><X className="h-4 w-4" /></Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <Field label="Nome"><Input value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder="Ex: Congresso de Jovens 2026" /></Field>
          <Field label="Subtítulo / slogan (opcional)">
            <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Ex: Uma nova geração se levanta" />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Categoria">
              <Input list="event-category-suggestions" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ex: Congresso" />
              <datalist id="event-category-suggestions">
                {CATEGORY_SUGGESTIONS.map((c) => <option key={c} value={c} />)}
              </datalist>
            </Field>
            <Field label="Público-alvo (opcional)">
              <Input value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} placeholder="Ex: Jovens, Casais, Todos" />
            </Field>
          </div>

          <div className="rounded-md border p-3">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Categoria/tags centralizadas (opcional — complementa a categoria acima)</p>
            <TaxonomyPicker entityType="registration_events" entityId={event?.id ?? null} />
          </div>
          <Field label="Slug (URL pública)">
            <Input value={slug} onChange={(e) => { setSlug(slugify(e.target.value)); setSlugTouched(true); }} placeholder="congresso-jovens-2026" />
          </Field>
          <Field label="Descrição">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
          </Field>
          <Field label="Imagem de divulgação (URL — opcional, usada no pop-up e na página do evento)">
            <div className="flex gap-2">
              <Input value={bannerUrl} onChange={(e) => setBannerUrl(e.target.value)} placeholder="https://…" />
              <MediaLibraryPicker onPick={setBannerUrl} onlyTypes={["imagem", "logo"]} />
            </div>
          </Field>
          <Field label="Vídeo curto de divulgação (URL de um .mp4 direto — opcional, toca no pop-up de login)">
            <Input value={popupVideoUrl} onChange={(e) => setPopupVideoUrl(e.target.value)} placeholder="https://…/video.mp4" />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Estilo visual do pop-up">
              <select value={popupTemplate} onChange={(e) => setPopupTemplate(e.target.value as PopupTemplate)} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                <option value="classico">Clássico (azul-marinho/dourado)</option>
                <option value="moderno">Moderno (gradiente)</option>
                <option value="jovem">Jovem (cores vibrantes)</option>
              </select>
            </Field>
            <Field label="Repetir pop-up">
              <select value={popupRepeatMode} onChange={(e) => setPopupRepeatMode(e.target.value as PopupRepeatMode)} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                <option value="uma_vez_por_sessao">Uma vez por sessão (padrão)</option>
                <option value="sempre">Sempre que fizer login</option>
                <option value="intervalo_horas">A cada X horas</option>
                <option value="uma_vez_so">Só uma vez (nunca mais depois de fechar)</option>
              </select>
            </Field>
          </div>
          {popupRepeatMode === "intervalo_horas" && (
            <Field label="Intervalo (horas)">
              <Input type="number" min="1" value={popupRepeatIntervalHours} onChange={(e) => setPopupRepeatIntervalHours(e.target.value)} />
            </Field>
          )}

          <div className="rounded-md border p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Palestrantes/convidados (opcional)</p>
              <Button type="button" size="sm" variant="outline" onClick={addSpeaker} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Adicionar palestrante
              </Button>
            </div>
            {speakers.length === 0 && <p className="text-xs italic text-muted-foreground">Nenhum palestrante cadastrado.</p>}
            <div className="space-y-2">
              {speakers.map((s, i) => (
                <div key={s.id} className="flex items-center gap-2 rounded border p-2">
                  <Mic className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <Input placeholder="Nome" value={s.name} onChange={(e) => updateSpeaker(i, { name: e.target.value })} />
                  <Input placeholder="Tema (opcional)" value={s.topic ?? ""} onChange={(e) => updateSpeaker(i, { topic: e.target.value })} />
                  <Input placeholder="Foto (URL, opcional)" value={s.photo_url ?? ""} onChange={(e) => updateSpeaker(i, { photo_url: e.target.value })} className="max-w-[160px]" />
                  <Button type="button" size="sm" variant="ghost" onClick={() => removeSpeaker(i)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-md border p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Programação / cronograma (opcional)</p>
              <Button type="button" size="sm" variant="outline" onClick={addScheduleItem} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Adicionar item
              </Button>
            </div>
            {schedule.length === 0 && <p className="text-xs italic text-muted-foreground">Nenhum item de programação cadastrado.</p>}
            <div className="space-y-2">
              {[...schedule].sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime()).map((it) => {
                const i = schedule.indexOf(it);
                return (
                  <div key={it.id} className="space-y-2 rounded border p-2">
                    <div className="flex items-center gap-2">
                      <ListOrdered className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <Input placeholder="Título (ex: Abertura, Louvor, Palavra)" value={it.title} onChange={(e) => updateScheduleItem(i, { title: e.target.value })} />
                      <Button type="button" size="sm" variant="ghost" onClick={() => removeScheduleItem(i)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <Input type="datetime-local" value={it.start_at ? it.start_at.slice(0, 16) : ""} onChange={(e) => updateScheduleItem(i, { start_at: e.target.value ? new Date(e.target.value).toISOString() : it.start_at })} />
                      <Input type="datetime-local" placeholder="Fim (opcional)" value={it.end_at ? it.end_at.slice(0, 16) : ""} onChange={(e) => updateScheduleItem(i, { end_at: e.target.value ? new Date(e.target.value).toISOString() : null })} />
                      <select
                        value={it.speaker_id ?? ""}
                        onChange={(e) => updateScheduleItem(i, { speaker_id: e.target.value || null })}
                        className="h-10 rounded-md border bg-background px-2 text-sm"
                      >
                        <option value="">Sem palestrante</option>
                        {speakers.filter((s) => s.name.trim()).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                      <Input placeholder="Local/sala (opcional)" value={it.location ?? ""} onChange={(e) => updateScheduleItem(i, { location: e.target.value })} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Field label="Igreja (opcional — vazio = evento nacional/rede)">
            <select value={churchId} onChange={(e) => setChurchId(e.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
              <option value="">Nacional / Rede</option>
              {churches.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Início"><Input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} /></Field>
            <Field label="Fim (opcional)"><Input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} /></Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Inscrições abrem em (opcional)"><Input type="datetime-local" value={regOpensAt} onChange={(e) => setRegOpensAt(e.target.value)} /></Field>
            <Field label="Inscrições fecham em (opcional)"><Input type="datetime-local" value={regClosesAt} onChange={(e) => setRegClosesAt(e.target.value)} /></Field>
          </div>

          <Field label="Formato">
            <select value={isOnline ? "online" : "presencial"} onChange={(e) => setIsOnline(e.target.value === "online")} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
              <option value="presencial">Presencial</option>
              <option value="online">Online</option>
            </select>
          </Field>
          {isOnline ? (
            <Field label="Link do evento online"><Input value={onlineUrl} onChange={(e) => setOnlineUrl(e.target.value)} placeholder="https://…" /></Field>
          ) : (
            <Field label="Local"><Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ex: Sede Águas Claras" /></Field>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Capacidade (vazio = ilimitada)"><Input type="number" min="1" value={capacity} onChange={(e) => setCapacity(e.target.value)} /></Field>
            <Field label="Status">
              <select value={status} onChange={(e) => setStatus(e.target.value as RegistrationEventStatus)} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                {(Object.keys(STATUS_LABELS) as RegistrationEventStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </Field>
          </div>
          <p className="text-xs text-muted-foreground">
            <b>Inscrições abertas</b> é o único status que permite se inscrever e aparece resolvido como "aberto" pro público.
            <b> Agendado</b>, <b>Inscrições encerradas</b>, <b>Lotado</b>, <b>Em andamento</b>, <b>Finalizado</b> e <b>Cancelado</b> ficam visíveis (sem inscrição).
            <b> Rascunho</b>, <b>Em revisão</b> e <b>Arquivado</b> ficam escondidos do público.
          </p>

          {status === "cancelado" && (
            <Field label="Motivo do cancelamento (obrigatório — os inscritos vão ver essa mensagem)">
              <textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                rows={2}
                className="w-full rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm"
                placeholder="Ex: Evento remarcado por questões de agenda da igreja."
              />
            </Field>
          )}

          <div className="flex flex-wrap items-center gap-4 rounded-md border p-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={highlightDashboard} onChange={(e) => setHighlightDashboard(e.target.checked)} />
              Destacar no dashboard
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={highlightPublic} onChange={(e) => setHighlightPublic(e.target.checked)} />
              Destacar na página pública
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={requiresCpf} onChange={(e) => setRequiresCpf(e.target.checked)} />
              Exigir CPF na inscrição
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={requiresImageConsent} onChange={(e) => setRequiresImageConsent(e.target.checked)} />
              Pedir autorização de uso de imagem
            </label>
          </div>

          <div className="rounded-md border p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Perguntas personalizadas (opcional)</p>
              <Button type="button" size="sm" variant="outline" onClick={addCustomField} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Adicionar pergunta
              </Button>
            </div>
            {customFields.length === 0 && <p className="text-xs italic text-muted-foreground">Nenhuma pergunta extra — o inscrito só preenche nome/e-mail/telefone.</p>}
            <div className="space-y-2">
              {customFields.map((f, i) => (
                <div key={f.id} className="space-y-2 rounded border p-2">
                  <div className="flex items-center gap-2">
                    <Input placeholder="Texto da pergunta" value={f.label} onChange={(e) => updateCustomField(i, { label: e.target.value })} />
                    <select
                      value={f.type}
                      onChange={(e) => updateCustomField(i, { type: e.target.value as CustomFieldType })}
                      className="h-10 shrink-0 rounded-md border bg-background px-2 text-sm"
                    >
                      {(Object.keys(CUSTOM_FIELD_TYPE_LABELS) as CustomFieldType[]).map((t) => (
                        <option key={t} value={t}>{CUSTOM_FIELD_TYPE_LABELS[t]}</option>
                      ))}
                    </select>
                    <Button type="button" size="sm" variant="ghost" onClick={() => removeCustomField(i)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                  {(f.type === "selecao_unica" || f.type === "selecao_multipla") && (
                    <Input
                      placeholder="Opções separadas por vírgula (ex: P, M, G, GG)"
                      value={(f.options ?? []).join(", ")}
                      onChange={(e) => updateCustomField(i, { options: e.target.value.split(",").map((o) => o.trim()).filter(Boolean) })}
                    />
                  )}
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <input type="checkbox" checked={f.required ?? false} onChange={(e) => updateCustomField(i, { required: e.target.checked })} />
                    Obrigatória
                  </label>
                </div>
              ))}
            </div>
          </div>

          {err && <p className="text-sm text-destructive">{err}</p>}
          <Button onClick={save} disabled={busy} className="w-full">{busy ? "Salvando…" : "Salvar evento"}</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function RegistrantsView({ event, onBack }: { event: RegistrationEvent; onBack: () => void }) {
  const qc = useQueryClient();
  const [subTab, setSubTab] = useState<"inscritos" | "checkin" | "indicadores">("inscritos");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | "confirmada" | "lista_espera" | "cancelada">("todos");
  const [checkinFilter, setCheckinFilter] = useState<"todos" | "fez" | "nao_fez">("todos");
  const [editing, setEditing] = useState<EventRegistration | null>(null);
  const { data: registrations = [] } = useEventRegistrations(event.id);
  const { data: summary } = useEventRegistrationSummary(event.id);
  const { data: funnel } = useEventFunnel(event.id);
  const { data: byOrigin = [] } = useEventAnalyticsByOrigin(event.id);
  const { data: feedback } = useEventFeedbackSummary(event.id);
  const [finalizing, setFinalizing] = useState(false);

  async function finalizeAttendance() {
    if (!confirm("Encerrar presença deste evento? Todo mundo com inscrição confirmada que não fez check-in será marcado como ausente.")) return;
    setFinalizing(true);
    try {
      const count = await finalizeEventAttendance(supabase, event.id);
      await logAudit(supabase, "update", "registration_events", event.id, { action: "finalize_attendance", ausentes: count });
      qc.invalidateQueries({ queryKey: ["event-registrations", event.id] });
      qc.invalidateQueries({ queryKey: ["registration-events-admin"] });
      alert(`Presença encerrada. ${count} pessoa(s) marcada(s) como ausente.`);
    } catch (e) { alert((e as { message?: string })?.message ?? "Erro ao encerrar presença"); }
    finally { setFinalizing(false); }
  }

  const filtered = registrations.filter((r) => {
    if (statusFilter !== "todos" && r.status !== statusFilter) return false;
    if (checkinFilter === "fez" && !r.checked_in_at) return false;
    if (checkinFilter === "nao_fez" && r.checked_in_at) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      if (!r.full_name.toLowerCase().includes(q) && !(r.email ?? "").toLowerCase().includes(q) && !(r.phone ?? "").includes(q) && !(r.cpf ?? "").includes(q)) return false;
    }
    return true;
  });

  async function moveStatus(reg: EventRegistration, newStatus: "confirmada" | "lista_espera") {
    try {
      await adminMoveRegistrationStatus(supabase, reg.id, newStatus);
      await logAudit(supabase, "update", "event_registrations", reg.id, {}, { before: { status: reg.status }, after: { status: newStatus } });
      qc.invalidateQueries({ queryKey: ["event-registrations", event.id] });
      qc.invalidateQueries({ queryKey: ["event-registration-summary", event.id] });
    } catch (e) { alert((e as { message?: string })?.message ?? "Erro ao mover"); }
  }

  async function cancel(regId: string, name: string) {
    if (!confirm(`Cancelar a inscrição de "${name}"? Se houver lista de espera, o próximo é promovido automaticamente.`)) return;
    try {
      await cancelRegistration(supabase, regId);
      await logAudit(supabase, "update", "event_registrations", regId, { action: "cancel", event_id: event.id });
      qc.invalidateQueries({ queryKey: ["event-registrations", event.id] });
      qc.invalidateQueries({ queryKey: ["event-registration-summary", event.id] });
    } catch (e) { alert((e as { message?: string })?.message ?? "Erro ao cancelar"); }
  }

  function exportList() {
    exportToExcel(
      registrations as unknown as Record<string, unknown>[],
      [
        { header: "Nome", key: "full_name", width: 28 },
        { header: "E-mail", key: "email", width: 24 },
        { header: "Telefone", key: "phone", width: 16 },
        { header: "Status", key: "status", width: 14 },
        { header: "Inscrito em", key: "registered_at", width: 18, format: (v) => v ? new Date(v as string).toLocaleString("pt-BR") : "—" },
      ],
      `inscritos-${event.slug}`,
      "Inscritos"
    );
  }

  return (
    <div className="space-y-4">
      <Button onClick={onBack} variant="ghost" size="sm" className="gap-1.5"><ArrowLeft size={14} /> Voltar aos eventos</Button>

      <div className="flex gap-1.5 border-b">
        {([
          ["inscritos", "Inscritos"],
          ["checkin", "Check-in"],
          ["indicadores", "Indicadores"],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSubTab(key)}
            className={`border-b-2 px-3 py-2 text-sm font-semibold transition ${
              subTab === key ? "border-gold text-navy" : "border-transparent text-muted-foreground hover:text-navy"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {subTab === "checkin" && (
        <CheckinScanner eventId={event.id} eventName={event.name} embedded onChangeEvent={() => {}} />
      )}

      {subTab === "indicadores" && funnel && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Indicadores</CardTitle>
            <CardDescription>Funil: visualizações → cliques → inscrições. Visualizações contam cada vez que o card do evento aparece (Agenda, Alertas, pop-up ou página própria).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Visualizações", value: funnel.views },
                { label: "Visitantes únicos", value: funnel.unique_sessions },
                { label: "Cliques em Inscrever-se", value: funnel.clicks },
                { label: "Conversão", value: `${funnel.conversao_pct}%` },
              ].map((s) => (
                <div key={s.label} className="rounded-md border bg-card p-3 text-center">
                  <p className="text-2xl font-bold text-navy">{s.value}</p>
                  <p className="text-[11px] uppercase text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>

            {byOrigin.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Origem dos acessos</p>
                <div className="space-y-1">
                  {byOrigin.map((o) => (
                    <div key={o.origin} className="flex items-center justify-between rounded border px-2.5 py-1.5 text-sm">
                      <span className="capitalize">{o.origin.replace(/_/g, " ")}</span>
                      <span className="text-muted-foreground">{o.views} visualizações · {o.clicks} cliques</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {subTab === "indicadores" && feedback && feedback.total > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pesquisa de satisfação</CardTitle>
            <CardDescription>{feedback.total} resposta(s) · nota média {feedback.average}/5</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {feedback.comments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Ninguém deixou comentário — só notas.</p>
            ) : (
              feedback.comments.map((c, i) => (
                <div key={i} className="rounded-md border p-2.5">
                  <div className="mb-1 flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} className={`h-3.5 w-3.5 ${n <= c.rating ? "fill-gold text-gold" : "text-muted-foreground"}`} />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">{c.comment}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {subTab === "inscritos" && (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{event.name}</CardTitle>
            <CardDescription>
              {summary ? (
                <>
                  {summary.confirmadas} confirmada(s)
                  {summary.capacidade != null ? ` de ${summary.capacidade}` : ""} · {summary.lista_espera} em espera · {summary.canceladas} cancelada(s)
                </>
              ) : "Carregando resumo…"}
            </CardDescription>
          </div>
          <Button onClick={exportList} variant="outline" size="sm" className="gap-1.5" disabled={registrations.length === 0}>
            <FileDown size={14} /> Exportar Excel
          </Button>
        </CardHeader>
        <CardContent>
          {!event.attendance_closed_at && (
            <div className="mb-3 flex items-center justify-between rounded-md border border-amber-200 bg-amber-50 p-2.5">
              <p className="text-xs text-amber-800">Ainda não encerrado — quem não fez check-in continua como "pendente".</p>
              <Button size="sm" variant="outline" disabled={finalizing} onClick={finalizeAttendance}>
                {finalizing ? "Encerrando…" : "Encerrar presença"}
              </Button>
            </div>
          )}
          {event.attendance_closed_at && (
            <p className="mb-3 text-xs text-muted-foreground">
              Presença encerrada em {new Date(event.attendance_closed_at).toLocaleString("pt-BR")}.
            </p>
          )}
          <div className="mb-3 flex flex-wrap gap-2">
            <Input placeholder="Buscar por nome, e-mail, telefone ou CPF…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="h-10 rounded-md border bg-background px-2 text-sm">
              <option value="todos">Todos os status</option>
              <option value="confirmada">Confirmada</option>
              <option value="lista_espera">Lista de espera</option>
              <option value="cancelada">Cancelada</option>
            </select>
            <select value={checkinFilter} onChange={(e) => setCheckinFilter(e.target.value as typeof checkinFilter)} className="h-10 rounded-md border bg-background px-2 text-sm">
              <option value="todos">Check-in: todos</option>
              <option value="fez">Já fez check-in</option>
              <option value="nao_fez">Ainda não fez check-in</option>
            </select>
          </div>

          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm italic text-muted-foreground">
              {registrations.length === 0 ? "Ninguém se inscreveu ainda." : "Nenhum inscrito bate com esse filtro."}
            </p>
          ) : (
            <div className="space-y-2">
              {filtered.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-md border bg-card p-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <b className="text-navy">{r.full_name}</b>
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                        r.status === "confirmada" ? "bg-emerald-100 text-emerald-700"
                        : r.status === "lista_espera" ? "bg-amber-100 text-amber-700"
                        : "bg-slate-100 text-slate-500"
                      }`}>
                        {r.status === "confirmada" ? "Confirmada" : r.status === "lista_espera" ? "Lista de espera" : "Cancelada"}
                      </span>
                      {r.checked_in_at && <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-sky-700">✓ Check-in</span>}
                      {r.no_show && <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-red-600">Ausente</span>}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {[r.email, r.phone, r.cpf].filter(Boolean).join(" · ") || "Sem contato informado"}
                      {" · "}{new Date(r.registered_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    {r.status !== "cancelada" && (
                      <Button onClick={() => setEditing(r)} variant="outline" size="sm"><Pencil className="h-3.5 w-3.5" /></Button>
                    )}
                    {r.status === "lista_espera" && (
                      <Button onClick={() => moveStatus(r, "confirmada")} variant="outline" size="sm" title="Mover pra confirmada">
                        <ArrowUpCircle className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {r.status === "confirmada" && (
                      <Button onClick={() => moveStatus(r, "lista_espera")} variant="outline" size="sm" title="Mover pra lista de espera">
                        <ArrowDownCircle className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {r.status !== "cancelada" && (
                      <Button onClick={() => cancel(r.id, r.full_name)} variant="destructive" size="sm">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {editing && (
        <EditRegistrantDialog
          reg={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); qc.invalidateQueries({ queryKey: ["event-registrations", event.id] }); }}
        />
      )}
    </div>
  );
}

function EditRegistrantDialog({ reg, onClose, onSaved }: { reg: EventRegistration; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(reg.full_name);
  const [email, setEmail] = useState(reg.email ?? "");
  const [phone, setPhone] = useState(reg.phone ?? "");
  const [cpf, setCpf] = useState(reg.cpf ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function save() {
    if (!name.trim()) { setErr("Nome é obrigatório."); return; }
    setBusy(true); setErr("");
    try {
      await adminUpdateRegistration(supabase, reg.id, name.trim(), email || null, phone || null, cpf || null);
      await logAudit(supabase, "update", "event_registrations", reg.id, { action: "edit" });
      onSaved();
    } catch (e) {
      setErr((e as { message?: string })?.message ?? "Erro ao salvar");
    } finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <Card className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Editar inscrito</CardTitle>
          <Button onClick={onClose} variant="ghost" size="sm"><X className="h-4 w-4" /></Button>
        </CardHeader>
        <CardContent className="space-y-2">
          <Input placeholder="Nome completo" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input placeholder="Telefone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Input placeholder="CPF" value={cpf} onChange={(e) => setCpf(e.target.value)} />
          {err && <p className="text-xs text-destructive">{err}</p>}
          <Button onClick={save} disabled={busy} className="w-full">{busy ? "Salvando…" : "Salvar"}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
