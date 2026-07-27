"use client";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, X, Users, FileDown, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  useRegistrationEventsAdmin, useEventRegistrations, useEventRegistrationSummary, useChurches,
} from "@/hooks/use-queries";
import { supabase } from "@/lib/supabase/client";
import {
  createRegistrationEvent, updateRegistrationEvent, deleteRegistrationEvent, cancelRegistration,
} from "@/services/events";
import { logAudit } from "@/services/audit";
import { exportToExcel } from "@/lib/export";
import type { RegistrationEvent, RegistrationEventStatus } from "@/types/domain";

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
      await logAudit(supabase, "delete", "registration_events", e.id, { name: e.name });
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
  const [bannerUrl, setBannerUrl] = useState(event?.banner_url ?? "");
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
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  function handleNameChange(v: string) {
    setName(v);
    if (!slugTouched) setSlug(slugify(v));
  }

  async function save() {
    if (!name.trim()) { setErr("Nome é obrigatório."); return; }
    if (!slug.trim()) { setErr("Slug é obrigatório."); return; }
    if (!startAt) { setErr("Data/hora de início é obrigatória."); return; }
    if (isOnline && !onlineUrl.trim()) { setErr("Informe o link do evento online."); return; }
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
      };
      if (event) {
        await updateRegistrationEvent(supabase, event.id, payload);
        await logAudit(supabase, "update", "registration_events", event.id, { name });
      } else {
        const created = await createRegistrationEvent(supabase, payload);
        await logAudit(supabase, "insert", "registration_events", created.id, { name });
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
          <Field label="Slug (URL pública)">
            <Input value={slug} onChange={(e) => { setSlug(slugify(e.target.value)); setSlugTouched(true); }} placeholder="congresso-jovens-2026" />
          </Field>
          <Field label="Descrição">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
          </Field>
          <Field label="Imagem de divulgação (URL — opcional, usada no pop-up e na página do evento)">
            <Input value={bannerUrl} onChange={(e) => setBannerUrl(e.target.value)} placeholder="https://…" />
          </Field>

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

          <div className="flex flex-wrap items-center gap-4 rounded-md border p-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={highlightDashboard} onChange={(e) => setHighlightDashboard(e.target.checked)} />
              Destacar no dashboard
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={highlightPublic} onChange={(e) => setHighlightPublic(e.target.checked)} />
              Destacar na página pública
            </label>
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
  const { data: registrations = [] } = useEventRegistrations(event.id);
  const { data: summary } = useEventRegistrationSummary(event.id);

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
          {registrations.length === 0 ? (
            <p className="py-6 text-center text-sm italic text-muted-foreground">Ninguém se inscreveu ainda.</p>
          ) : (
            <div className="space-y-2">
              {registrations.map((r) => (
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
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {[r.email, r.phone].filter(Boolean).join(" · ") || "Sem contato informado"}
                      {" · "}{new Date(r.registered_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  {r.status !== "cancelada" && (
                    <Button onClick={() => cancel(r.id, r.full_name)} variant="destructive" size="sm">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
