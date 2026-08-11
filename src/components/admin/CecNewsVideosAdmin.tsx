"use client";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Video, Plus, Pencil, Trash2, Star, Pin, Link2, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  useNewsVideosAdmin, useRegistrationEventsAdmin, useStates, useNucleos, useDistricts, useSectors, useChurches, useMyProfile, useOrgTerminology,
} from "@/hooks/use-queries";
import { supabase } from "@/lib/supabase/client";
import * as NewsVideos from "@/services/newsVideos";
import { ORG_TERM_DEFAULTS } from "@/services/orgTerminology";
import type { NewsVideoScope, NewsVideoStatus, CecNewsVideoAdmin } from "@/types/domain";

const STATUS_CONFIG: Record<NewsVideoStatus, { label: string; color: string }> = {
  rascunho: { label: "Rascunho", color: "bg-gray-100 text-gray-700 border-gray-300" },
  em_revisao: { label: "Em revisão", color: "bg-amber-100 text-amber-800 border-amber-300" },
  agendado: { label: "Agendado", color: "bg-blue-100 text-blue-800 border-blue-300" },
  publicado: { label: "Publicado", color: "bg-green-100 text-green-800 border-green-300" },
  encerrado: { label: "Encerrado", color: "bg-gray-100 text-gray-700 border-gray-300" },
  arquivado: { label: "Arquivado", color: "bg-gray-100 text-gray-500 border-gray-300" },
  rejeitado: { label: "Rejeitado", color: "bg-red-100 text-red-800 border-red-300" },
  cancelado: { label: "Cancelado", color: "bg-red-100 text-red-800 border-red-300" },
};

/**
 * CEC News Vídeos — subaba da Central de Conteúdos. Permite
 * publicar vídeos com vínculo opcional a um Evento já cadastrado
 * (aproveitando nome/data/local/imagem automaticamente) e alcance
 * por escopo territorial.
 */
export function CecNewsVideosAdmin({ prefillEventId }: { prefillEventId?: string | null } = {}) {
  const { data: videos = [], refetch } = useNewsVideosAdmin();
  const [showForm, setShowForm] = useState(!!prefillEventId);
  const [editing, setEditing] = useState<CecNewsVideoAdmin | null>(null);
  const { data: terms = ORG_TERM_DEFAULTS } = useOrgTerminology();
  const scopeLabels: Record<string, string> = { nacional: terms.nacional, sede: "Estado", nucleo: terms.nucleo, distrito: terms.distrito, setor: terms.setor, igreja: terms.igreja };

  async function remove(v: CecNewsVideoAdmin) {
    if (!confirm(`Remover o vídeo "${v.title}"?`)) return;
    await NewsVideos.deleteNewsVideo(supabase, v.id);
    refetch();
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 font-display text-xl text-navy"><Video className="h-5 w-5 text-gold" />CEC News Vídeos</h2>
          <p className="text-sm text-muted-foreground">Vídeos de divulgação de eventos, programações e comunicados — em destaque na aba Notícias.</p>
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(true); }} className="gap-1.5"><Plus className="h-4 w-4" />Publicar novo vídeo</Button>
      </div>

      <div className="space-y-2">
        {videos.map((v) => (
          <Card key={v.id}>
            <CardContent className="flex items-center gap-3 pt-4">
              {v.cover_image_url ? (
                <img src={v.cover_image_url} alt="" className="h-16 w-24 shrink-0 rounded-md object-cover" />
              ) : (
                <div className="grid h-16 w-24 shrink-0 place-items-center rounded-md bg-navy/10 text-navy"><Video className="h-6 w-6" /></div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  {v.is_pinned && <Pin className="h-3.5 w-3.5 text-gold" />}
                  {v.is_featured && <Star className="h-3.5 w-3.5 text-gold" />}
                  <p className="truncate font-semibold text-navy">{v.title}</p>
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {scopeLabels[v.scope]}{v.scope_ref_name ? ` · ${v.scope_ref_name}` : ""}
                  {v.event_name && <span className="ml-1 inline-flex items-center gap-0.5"><Link2 className="h-3 w-3" />{v.event_name}</span>}
                </p>
              </div>
              <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${STATUS_CONFIG[v.status].color}`}>{STATUS_CONFIG[v.status].label}</span>
              <div className="flex shrink-0 gap-1">
                <Button size="sm" variant="ghost" onClick={() => { setEditing(v); setShowForm(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button size="sm" variant="ghost" className="text-red-500" onClick={() => remove(v)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {videos.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Nenhum vídeo publicado ainda.</p>}
      </div>

      {showForm && (
        <VideoFormDialog
          editing={editing}
          prefillEventId={prefillEventId}
          onClose={() => setShowForm(false)}
          onDone={() => { setShowForm(false); refetch(); }}
        />
      )}
    </div>
  );
}

function VideoFormDialog({ editing, prefillEventId, onClose, onDone }: { editing: CecNewsVideoAdmin | null; prefillEventId?: string | null; onClose: () => void; onDone: () => void }) {
  const { data: me } = useMyProfile();
  const { data: allVideos = [] } = useNewsVideosAdmin();
  const { data: events = [] } = useRegistrationEventsAdmin();
  const { data: states = [] } = useStates();
  const { data: nucleos = [] } = useNucleos();
  const { data: districts = [] } = useDistricts();
  const { data: sectors = [] } = useSectors();
  const { data: churches = [] } = useChurches();
  const { data: terms = ORG_TERM_DEFAULTS } = useOrgTerminology();
  const scopeLabels: Record<string, string> = { nacional: terms.nacional, sede: "Estado", nucleo: terms.nucleo, distrito: terms.distrito, setor: terms.setor, igreja: terms.igreja };

  const [title, setTitle] = useState(editing?.title ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [videoUrl, setVideoUrl] = useState(editing?.video_url ?? "");
  const [coverUrl, setCoverUrl] = useState(editing?.cover_image_url ?? "");
  const [eventId, setEventId] = useState(editing?.event_id ?? "");
  const [scope, setScope] = useState<NewsVideoScope>(editing?.scope ?? "igreja");
  const [scopeRefId, setScopeRefId] = useState(editing?.scope_ref_id ?? "");
  const [displayStart, setDisplayStart] = useState(editing?.display_start_at?.slice(0, 10) ?? new Date().toISOString().slice(0, 10));
  const [displayEnd, setDisplayEnd] = useState(editing?.display_end_at?.slice(0, 10) ?? "");
  const [isFeatured, setIsFeatured] = useState(editing?.is_featured ?? false);
  const [isPinned, setIsPinned] = useState(editing?.is_pinned ?? false);
  const [allowAutoplay, setAllowAutoplay] = useState(editing?.allow_autoplay ?? false);
  const [showSignup, setShowSignup] = useState(editing?.show_signup_button ?? false);
  const [showEventBtn, setShowEventBtn] = useState(editing?.show_event_button ?? false);
  const [showShare, setShowShare] = useState(editing?.show_share_button ?? true);
  const [status, setStatus] = useState<NewsVideoStatus>(editing?.status ?? "rascunho");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  function applyEvent(id: string) {
    setEventId(id);
    const ev = events.find((e) => e.id === id);
    if (!ev) return;
    // Aproveita automaticamente os dados do evento — só o vídeo e a mensagem de divulgação são novos.
    if (!title) setTitle(ev.name);
    if (!description) setDescription(ev.description ?? "");
    if (!coverUrl && ev.banner_url) setCoverUrl(ev.banner_url);
    if (ev.church_id) { setScope("igreja"); setScopeRefId(ev.church_id); }
    setShowEventBtn(true);
    setShowSignup(true);
  }

  useEffect(() => {
    if (prefillEventId && !editing && events.length > 0 && !eventId) {
      applyEvent(prefillEventId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillEventId, events]);

  const scopeOptions = scope === "sede" ? states : scope === "nucleo" ? nucleos : scope === "distrito" ? districts : scope === "setor" ? sectors : scope === "igreja" ? churches : [];

  async function save() {
    if (!title.trim() || !videoUrl.trim()) { setErr("Preencha ao menos o título e o link do vídeo."); return; }
    if (scope !== "nacional" && !scopeRefId) { setErr("Selecione a referência do alcance escolhido."); return; }

    // Regra: só um vídeo em destaque por vez, no mesmo nível de alcance.
    if (isFeatured) {
      const conflicting = allVideos.find((v) =>
        v.id !== editing?.id && v.is_featured && v.status === "publicado" &&
        v.scope === scope && (scope === "nacional" || v.scope_ref_id === scopeRefId)
      );
      if (conflicting) {
        const ok = confirm(
          `Já existe um vídeo em destaque nesse nível ("${conflicting.title}"). ` +
          `Deseja substituir — tirando o destaque dele e colocando neste?`
        );
        if (!ok) return;
        await NewsVideos.updateNewsVideo(supabase, conflicting.id, { is_featured: false });
      }
    }

    setBusy(true); setErr("");
    try {
      const payload = {
        title, description: description || null, video_url: videoUrl, cover_image_url: coverUrl || null,
        event_id: eventId || null,
        scope, scope_ref_id: scope === "nacional" ? null : scopeRefId,
        display_start_at: new Date(displayStart).toISOString(),
        display_end_at: displayEnd ? new Date(displayEnd).toISOString() : null,
        published_at: status === "publicado" ? new Date().toISOString() : (editing?.published_at ?? null),
        is_featured: isFeatured, is_pinned: isPinned, allow_autoplay: allowAutoplay,
        show_signup_button: showSignup, show_event_button: showEventBtn, show_share_button: showShare,
        status, responsible_id: editing?.responsible_id ?? me?.id ?? null,
      };
      if (editing) await NewsVideos.updateNewsVideo(supabase, editing.id, payload);
      else await NewsVideos.createNewsVideo(supabase, payload);
      onDone();
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? "Erro ao salvar");
    } finally { setBusy(false); }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader><DialogTitle className="flex items-center justify-between">{editing ? "Editar vídeo" : "Publicar novo vídeo"}<Button size="sm" variant="ghost" onClick={onClose}><X className="h-4 w-4" /></Button></DialogTitle></DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="text-xs">Evento relacionado (opcional)</Label>
            <Select value={eventId} onValueChange={applyEvent}>
              <SelectTrigger><SelectValue placeholder="Nenhum — vídeo independente" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nenhum — vídeo independente</SelectItem>
                {events.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {eventId && <p className="mt-1 text-xs text-gold">Dados do evento aproveitados automaticamente — ajuste o que precisar.</p>}
          </div>

          <div><Label className="text-xs">Título</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título do vídeo" /></div>
          <div><Label className="text-xs">Descrição resumida</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} /></div>
          <div><Label className="text-xs">Link do vídeo (YouTube ou externo)</Label><Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=…" /></div>
          <div><Label className="text-xs">Imagem de capa (URL)</Label><Input value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="https://…" /></div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Abrangência</Label>
              <Select value={scope} onValueChange={(v) => { setScope(v as NewsVideoScope); setScopeRefId(""); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(scopeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {scope !== "nacional" && (
              <div>
                <Label className="text-xs">{scopeLabels[scope]}</Label>
                <Select value={scopeRefId} onValueChange={setScopeRefId}>
                  <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
                  <SelectContent>{scopeOptions.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Início da exibição</Label><Input type="date" value={displayStart} onChange={(e) => setDisplayStart(e.target.value)} /></div>
            <div><Label className="text-xs">Encerramento (opcional)</Label><Input type="date" value={displayEnd} onChange={(e) => setDisplayEnd(e.target.value)} /></div>
          </div>

          <div>
            <Label className="text-xs">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as NewsVideoStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(STATUS_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Configurações de exibição</p>
            <Toggle label="Exibir como destaque" checked={isFeatured} onChange={setIsFeatured} />
            <Toggle label="Fixar no topo" checked={isPinned} onChange={setIsPinned} />
            <Toggle label="Permitir reprodução automática" checked={allowAutoplay} onChange={setAllowAutoplay} />
            <Toggle label='Exibir botão "Inscrever-se"' checked={showSignup} onChange={setShowSignup} />
            <Toggle label='Exibir botão "Ver evento"' checked={showEventBtn} onChange={setShowEventBtn} />
            <Toggle label="Exibir botão de compartilhamento" checked={showShare} onChange={setShowShare} />
          </div>

          {err && <p className="text-sm text-destructive">{err}</p>}
          <Button onClick={save} disabled={busy} className="w-full">{busy ? "Salvando…" : editing ? "Salvar alterações" : "Publicar"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex w-full items-center justify-between text-sm text-ink">
      <span>{label}</span>
      <span className={`relative h-5 w-9 rounded-full transition ${checked ? "bg-gold" : "bg-border"}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${checked ? "left-[18px]" : "left-0.5"}`} />
      </span>
    </button>
  );
}
