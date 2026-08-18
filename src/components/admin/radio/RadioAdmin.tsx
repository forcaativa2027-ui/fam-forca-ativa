"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Pencil, X, Music, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { radioProgramSchema, type RadioProgramInput } from "@/schemas/radioProgramSchema";
import { useAllRadioPrograms, useAllRadioEpisodes, useMyProfile, useRadioConfigAdmin } from "@/hooks/use-queries";
import { supabase } from "@/lib/supabase/client";
import {
  createRadioProgram, updateRadioProgram, deleteRadioProgram,
  createRadioEpisode, updateRadioEpisode, deleteRadioEpisode,
  upsertRadioConfig,
} from "@/services/radio";
import type { RadioProgram, RadioEpisode, Weekday } from "@/types/domain";

const WEEKDAYS: { value: Weekday; label: string }[] = [
  { value: "domingo", label: "Domingo" },
  { value: "segunda", label: "Segunda-feira" },
  { value: "terca", label: "Terça-feira" },
  { value: "quarta", label: "Quarta-feira" },
  { value: "quinta", label: "Quinta-feira" },
  { value: "sexta", label: "Sexta-feira" },
  { value: "sabado", label: "Sábado" },
];

const EPISODE_CATEGORIES = [
  { value: "pregacao", label: "Pregação" },
  { value: "louvor", label: "Louvor" },
  { value: "noticia", label: "Notícia" },
  { value: "devocional", label: "Devocional" },
  { value: "entrevista", label: "Entrevista" },
  { value: "estudo", label: "Estudo" },
  { value: "especial", label: "Especial" },
];

export function RadioAdmin() {
  const { data: myProfile } = useMyProfile();
  const churchId = myProfile?.church_id ?? null;
  const { data: programs = [] } = useAllRadioPrograms(churchId);
  const { data: episodes = [] } = useAllRadioEpisodes(churchId);
  const { data: config } = useRadioConfigAdmin(churchId);
  const qc = useQueryClient();
  const [section, setSection] = useState<"config" | "programas" | "episodios">("programas");
  const [editing, setEditing] = useState<RadioProgram | null>(null);
  const [editingEp, setEditingEp] = useState<RadioEpisode | null>(null);
  const [err, setErr] = useState("");
  const [formOpen, setFormOpen] = useState(false);

  const [cfg, setCfg] = useState({
    is_enabled: config?.is_enabled ?? false,
    display_name: config?.display_name ?? "Rádio Web",
    short_name: config?.short_name ?? "",
    logo_url: config?.logo_url ?? "",
    stream_url: config?.stream_url ?? "",
    theme_color: config?.theme_color ?? "",
    description: config?.description ?? "",
  });
  const [cfgSaving, setCfgSaving] = useState(false);
  const [cfgSaved, setCfgSaved] = useState(false);

  useEffect(() => {
    if (config && section === "config") syncConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  function syncConfig() {
    setCfg({
      is_enabled: config?.is_enabled ?? false,
      display_name: config?.display_name ?? "Rádio Web",
      short_name: config?.short_name ?? "",
      logo_url: config?.logo_url ?? "",
      stream_url: config?.stream_url ?? "",
      theme_color: config?.theme_color ?? "",
      description: config?.description ?? "",
    });
  }

  async function saveConfig(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setCfgSaving(true);
    try {
      await upsertRadioConfig(supabase, {
        church_id: churchId,
        is_enabled: cfg.is_enabled,
        display_name: cfg.display_name || "Rádio Web",
        short_name: cfg.short_name || null,
        logo_url: cfg.logo_url || null,
        stream_url: cfg.stream_url || null,
        theme_color: cfg.theme_color || null,
        description: cfg.description || null,
      });
      qc.invalidateQueries({ queryKey: ["radio-config-admin"] });
      qc.invalidateQueries({ queryKey: ["radio-config"] });
      setCfgSaved(true);
      setTimeout(() => setCfgSaved(false), 2500);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro ao salvar configuração";
      setErr(msg);
    } finally {
      setCfgSaving(false);
    }
  }

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<RadioProgramInput>({
      resolver: zodResolver(radioProgramSchema),
      defaultValues: { title: "", is_recurring: true, is_active: true, sort_order: 0 },
    });

  function startEdit(p: RadioProgram) {
    setEditing(p);
    setEditingEp(null);
    setErr("");
    setFormOpen(true);
    reset({
      title: p.title,
      description: p.description ?? "",
      host_name: p.host_name ?? "",
      cover_url: p.cover_url ?? "",
      weekday: p.weekday ?? undefined,
      start_time: p.start_time ?? "",
      end_time: p.end_time ?? "",
      is_recurring: p.is_recurring,
      is_active: p.is_active,
      sort_order: p.sort_order,
    });
  }
  function cancelEdit() {
    setEditing(null);
    setEditingEp(null);
    setFormOpen(false);
    setErr("");
    reset({ title: "", is_recurring: true, is_active: true, sort_order: 0 });
  }

  async function onSubmit(v: RadioProgramInput) {
    setErr("");
    try {
      if (editing) {
        await updateRadioProgram(supabase, editing.id, v);
      } else {
        const nextOrder = programs.length > 0 ? Math.max(...programs.map((p) => p.sort_order)) + 1 : 0;
        await createRadioProgram(supabase, churchId ?? "", { ...v, sort_order: nextOrder });
      }
      cancelEdit();
      qc.invalidateQueries({ queryKey: ["all-radio-programs"] });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro ao salvar";
      setErr(msg);
    }
  }

  async function removeProgram(p: RadioProgram) {
    if (!confirm(`Apagar programa "${p.title}"?`)) return;
    try {
      await deleteRadioProgram(supabase, p.id);
      qc.invalidateQueries({ queryKey: ["all-radio-programs"] });
    } catch (e: unknown) { alert(e instanceof Error ? e.message : "Erro"); }
  }

  // ── Episódios (conteúdos/músicas sob demanda) ──
  const [epFormOpen, setEpFormOpen] = useState(false);
  const [epTitle, setEpTitle] = useState("");
  const [epDescription, setEpDescription] = useState("");
  const [epCategory, setEpCategory] = useState<RadioEpisode["category"]>("pregacao");
  const [epSpeaker, setEpSpeaker] = useState("");
  const [epAudioUrl, setEpAudioUrl] = useState("");
  const [epCoverUrl, setEpCoverUrl] = useState("");
  const [epIsFeatured, setEpIsFeatured] = useState(false);
  const [epSubmitting, setEpSubmitting] = useState(false);

  function openNewEpisode() {
    setEditingEp(null);
    setErr("");
    setEpTitle(""); setEpDescription(""); setEpCategory("pregacao");
    setEpSpeaker(""); setEpAudioUrl(""); setEpCoverUrl(""); setEpIsFeatured(false);
    setEpFormOpen(true);
  }
  function openEditEpisode(e: RadioEpisode) {
    setEditingEp(e);
    setErr("");
    setEpTitle(e.title); setEpDescription(e.description ?? "");
    setEpCategory(e.category ?? "pregacao"); setEpSpeaker(e.speaker ?? "");
    setEpAudioUrl(e.audio_url); setEpCoverUrl(e.cover_url ?? ""); setEpIsFeatured(e.is_featured);
    setEpFormOpen(true);
  }
  function closeEpisodeForm() {
    setEpFormOpen(false);
    setEditingEp(null);
  }

  async function saveEpisode(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setEpSubmitting(true);
    try {
      if (editingEp) {
        await updateRadioEpisode(supabase, editingEp.id, {
          title: epTitle, description: epDescription || null, category: epCategory,
          speaker: epSpeaker || null, audio_url: epAudioUrl, cover_url: epCoverUrl || null,
          is_featured: epIsFeatured,
        });
      } else {
        const nextOrder = episodes.length > 0 ? Math.max(...episodes.map((x) => x.sort_order)) + 1 : 0;
        await createRadioEpisode(supabase, {
          church_id: churchId, title: epTitle, description: epDescription || null,
          category: epCategory, speaker: epSpeaker || null, audio_url: epAudioUrl,
          cover_url: epCoverUrl || null, is_featured: epIsFeatured, sort_order: nextOrder,
          status: "published",
        });
      }
      closeEpisodeForm();
      qc.invalidateQueries({ queryKey: ["all-radio-episodes"] });
    } catch (e2: unknown) {
      const msg = e2 instanceof Error ? e2.message : "Erro ao salvar";
      setErr(msg);
    } finally {
      setEpSubmitting(false);
    }
  }

  async function removeEpisode(e: RadioEpisode) {
    if (!confirm(`Apagar conteúdo "${e.title}"?`)) return;
    try {
      await deleteRadioEpisode(supabase, e.id);
      qc.invalidateQueries({ queryKey: ["all-radio-episodes"] });
    } catch (e2: unknown) { alert(e2 instanceof Error ? e2.message : "Erro"); }
  }

  return (
    <div className="space-y-6">
      {/* Alternador de seção */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-2">
          <Button variant={section === "config" ? "default" : "outline"} onClick={() => { setSection("config"); syncConfig(); }}>
            <Settings className="mr-1 h-4 w-4" /> Configuração
          </Button>
          <Button variant={section === "programas" ? "default" : "outline"} onClick={() => setSection("programas")}>
            Programação
          </Button>
          <Button variant={section === "episodios" ? "default" : "outline"} onClick={() => setSection("episodios")}>
            <Music className="mr-1 h-4 w-4" /> Conteúdos / Músicas
          </Button>
        </div>
        {section === "programas" ? (
          <Button onClick={() => { setErr(""); setFormOpen(true); }} className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Adicionar Programa
          </Button>
        ) : section === "episodios" ? (
          <Button onClick={openNewEpisode} className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Adicionar Conteúdo
          </Button>
        ) : null}
      </div>

      {err && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{err}</p>}

      {section === "config" ? (
        <Card className="rounded-xl border border-border p-6">
          <CardHeader>
            <CardTitle>Configuração da Rádio Web</CardTitle>
            <CardDescription>Ativar a rádio, nome, logomarca e URL do stream ao vivo</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveConfig} className="space-y-4">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input type="checkbox" checked={cfg.is_enabled} onChange={(e) => setCfg({ ...cfg, is_enabled: e.target.checked })} />
                Rádio habilitada (aparece no menu público e na Home)
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome de exibição</Label>
                  <Input value={cfg.display_name} onChange={(e) => setCfg({ ...cfg, display_name: e.target.value })} placeholder="Rádio Web" />
                </div>
                <div>
                  <Label>Nome curto</Label>
                  <Input value={cfg.short_name} onChange={(e) => setCfg({ ...cfg, short_name: e.target.value })} placeholder="Rádio CEC" />
                </div>
              </div>
              <div>
                <Label>URL do stream (ao vivo)</Label>
                <Input value={cfg.stream_url} onChange={(e) => setCfg({ ...cfg, stream_url: e.target.value })} type="url" placeholder="https://.../stream.m3u8 ou .mp3" />
              </div>
              <div>
                <Label>URL do logo</Label>
                <Input value={cfg.logo_url} onChange={(e) => setCfg({ ...cfg, logo_url: e.target.value })} type="url" placeholder="https://.../logo.png" />
              </div>
              <div>
                <Label>Cor do tema</Label>
                <Input value={cfg.theme_color} onChange={(e) => setCfg({ ...cfg, theme_color: e.target.value })} placeholder="#1a3a5c" />
              </div>
              <div>
                <Label>Descrição</Label>
                <Input value={cfg.description} onChange={(e) => setCfg({ ...cfg, description: e.target.value })} placeholder="Descrição da rádio" />
              </div>
              <div className="flex items-center justify-end gap-2">
                {cfgSaved && <span className="text-sm text-emerald-600">Configuração salva!</span>}
                <Button type="submit" disabled={cfgSaving}>
                  {cfgSaving ? "Salvando..." : "Salvar configuração"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : section === "programas" ? (
        <Card className="rounded-xl border border-border p-6">
          <CardHeader>
            <CardTitle>Programação da Rádio Web</CardTitle>
            <CardDescription>Gerenciar horários e programas da grade de programação</CardDescription>
          </CardHeader>
          <CardContent>
            {programs.length === 0 && (
              <p className="text-center text-muted-foreground py-12">
                Nenhum programa cadastrado ainda.
              </p>
            )}
            <div className="space-y-2">
              {programs.map((p) => (
                <div key={p.id} className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/50">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-navy truncate">{p.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.weekday ? `${WEEKDAYS.find((w) => w.value === p.weekday)?.label} · ` : ""}
                      {p.start_time ?? "—"} {p.end_time ? `– ${p.end_time}` : ""}
                      {p.host_name ? ` · ${p.host_name}` : ""}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="p-1 rounded" onClick={() => startEdit(p)} title="Editar">
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="p-1 rounded text-destructive" onClick={() => removeProgram(p)} title="Excluir">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-xl border border-border p-6">
          <CardHeader>
            <CardTitle>Conteúdos / Músicas</CardTitle>
            <CardDescription>Pregações, louvores, devocionais e demais conteúdos sob demanda</CardDescription>
          </CardHeader>
          <CardContent>
            {episodes.length === 0 && (
              <p className="text-center text-muted-foreground py-12">
                Nenhum conteúdo cadastrado ainda.
              </p>
            )}
            <div className="space-y-2">
              {episodes.map((e) => (
                <div key={e.id} className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/50">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-navy truncate">{e.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {EPISODE_CATEGORIES.find((c) => c.value === e.category)?.label ?? e.category}
                      {e.speaker ? ` · ${e.speaker}` : ""}
                      {e.status === "published" ? " · Publicado" : " · Rascunho"}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="p-1 rounded" onClick={() => openEditEpisode(e)} title="Editar">
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="p-1 rounded text-destructive" onClick={() => removeEpisode(e)} title="Excluir">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de Programa */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-2xl rounded-xl border border-border p-6">
            <CardHeader>
              <CardTitle>{editing ? "Editar Programa" : "Novo Programa"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label>Título <span className="text-destructive">*</span></Label>
                  <Input {...register("title")} placeholder="Ex: Culto da Manhã" />
                  {errors.title && <p className="mt-1 text-xs text-destructive">{errors.title.message}</p>}
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Input {...register("description")} placeholder="Descrição do programa" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Dia da semana</Label>
                    <select {...register("weekday")} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option value="">—</option>
                      {WEEKDAYS.map((w) => (
                        <option key={w.value} value={w.value}>{w.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Apresentador (host)</Label>
                    <Input {...register("host_name")} placeholder="Ex: João Silva" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Horário de início <span className="text-destructive">*</span></Label>
                    <Input {...register("start_time")} type="time" />
                    {errors.start_time && <p className="mt-1 text-xs text-destructive">{errors.start_time.message}</p>}
                  </div>
                  <div>
                    <Label>Horário de fim</Label>
                    <Input {...register("end_time")} type="time" />
                  </div>
                </div>
                <div>
                  <Label>URL da capa</Label>
                  <Input {...register("cover_url")} placeholder="https://exemplo.com/capa.jpg" />
                  {errors.cover_url && <p className="mt-1 text-xs text-destructive">{errors.cover_url.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Ordem de exibição</Label>
                    <Input {...register("sort_order", { valueAsNumber: true })} type="number" />
                  </div>
                  <div className="flex items-end gap-4 pb-1">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" {...register("is_recurring")} /> Recorrente
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" {...register("is_active")} /> Ativo
                    </label>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-end gap-2">
                  <Button variant="outline" type="button" onClick={cancelEdit}>
                    <X className="h-4 w-4" /> Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {editing ? "Salvar Alterações" : "Criar Programa"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Episódio/Conteúdo */}
      {epFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-2xl rounded-xl border border-border p-6">
            <CardHeader>
              <CardTitle>{editingEp ? "Editar Conteúdo" : "Novo Conteúdo"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={saveEpisode} className="space-y-4">
                <div>
                  <Label>Título <span className="text-destructive">*</span></Label>
                  <Input value={epTitle} onChange={(e) => setEpTitle(e.target.value)} required placeholder="Ex: Pregação — João 3:16" />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Input value={epDescription} onChange={(e) => setEpDescription(e.target.value)} placeholder="Descrição do conteúdo" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Categoria</Label>
                    <select value={epCategory ?? ""} onChange={(e) => setEpCategory(e.target.value as RadioEpisode["category"])} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      {EPISODE_CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Autor / Apresentador</Label>
                    <Input value={epSpeaker} onChange={(e) => setEpSpeaker(e.target.value)} placeholder="Ex: Pr. João Silva" />
                  </div>
                </div>
                <div>
                  <Label>Áudio (URL) <span className="text-destructive">*</span></Label>
                  <Input value={epAudioUrl} onChange={(e) => setEpAudioUrl(e.target.value)} required type="url" placeholder="https://.../audio.mp3" />
                </div>
                <div>
                  <Label>Capa (URL)</Label>
                  <Input value={epCoverUrl} onChange={(e) => setEpCoverUrl(e.target.value)} type="url" placeholder="https://.../capa.jpg" />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={epIsFeatured} onChange={(e) => setEpIsFeatured(e.target.checked)} /> Destacar na rádio
                </label>
                <div className="mt-4 flex items-center justify-end gap-2">
                  <Button variant="outline" type="button" onClick={closeEpisodeForm}>
                    <X className="h-4 w-4" /> Cancelar
                  </Button>
                  <Button type="submit" disabled={epSubmitting}>
                    {editingEp ? "Salvar Alterações" : "Publicar Conteúdo"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}