"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Pencil, X, Music, Settings, ListMusic, Link2, Mic, Podcast, BarChart3, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { radioProgramSchema, type RadioProgramInput } from "@/schemas/radioProgramSchema";
import { useAllRadioPrograms, useAllRadioEpisodes, useMyProfile, useRadioConfigAdmin, useWhatsOnAir, useRadioPlaylists, useStudioInvites, useRadioRecordings, usePlaylistItems, usePodcastEpisodes, useRadioAnalytics, useEpisodePlayStats, useProgramGuests } from "@/hooks/use-queries";
import { supabase } from "@/lib/supabase/client";
import { StudioRemoto } from "./StudioRemoto";
import {
  createRadioProgram, updateRadioProgram, deleteRadioProgram,
  createRadioEpisode, updateRadioEpisode, deleteRadioEpisode,
  upsertRadioConfig,
  createRadioPlaylist, updateRadioPlaylist, deleteRadioPlaylist,
  addPlaylistItem, removePlaylistItem,
  createStudioInvite, revokeStudioInvite,
  updateRadioRecording,
  createProgramGuest, deleteProgramGuest,
  listRadioListeners, deleteRadioListener,
} from "@/services/radio";
import type { RadioProgram, RadioEpisode, RadioPlaylist, Weekday, RadioRecording, RadioProgramGuest, RadioListenerWithPrograms } from "@/types/domain";

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
  const { data: onAir } = useWhatsOnAir(churchId);
  const { data: playlists = [] } = useRadioPlaylists(churchId);
  const { data: podcastEpisodes = [] } = usePodcastEpisodes(churchId);
  const { data: analytics } = useRadioAnalytics(churchId);
  const { data: episodeStats = [] } = useEpisodePlayStats(churchId);
  const qc = useQueryClient();
  const [section, setSection] = useState<"config" | "programas" | "episodios" | "playlists" | "convites" | "gravacoes" | "podcasts" | "analytics" | "ouvintes">("programas");
  const [editing, setEditing] = useState<RadioProgram | null>(null);
  const [editingEp, setEditingEp] = useState<RadioEpisode | null>(null);
  const [err, setErr] = useState("");
  const [formOpen, setFormOpen] = useState(false);

  const [listeners, setListeners] = useState<RadioListenerWithPrograms[]>([]);
  const [listenersLoading, setListenersLoading] = useState(false);

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

  useEffect(() => {
    if (section !== "ouvintes") return;
    let cancelled = false;
    setListenersLoading(true);
    listRadioListeners(supabase, churchId)
      .then((rows) => {
        if (!cancelled) setListeners(rows);
      })
      .catch(() => {
        if (!cancelled) setErr("Não foi possível carregar os ouvintes.");
      })
      .finally(() => {
        if (!cancelled) setListenersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [section, churchId]);

  async function removeListener(id: string) {
    setErr("");
    try {
      await deleteRadioListener(supabase, id);
      setListeners((prev) => prev.filter((l) => l.id !== id));
    } catch {
      setErr("Não foi possível remover o ouvinte.");
    }
  }

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

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } =
    useForm<RadioProgramInput>({
      resolver: zodResolver(radioProgramSchema),
      defaultValues: { title: "", is_recurring: true, is_active: true, sort_order: 0, mode: "automatico", is_special: false },
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
      mode: p.mode ?? "automatico",
      fallback_url: p.fallback_url ?? "",
      playlist_id: p.playlist_id ?? "",
      is_special: p.is_special ?? false,
      special_start_date: p.special_start_date ?? "",
      special_end_date: p.special_end_date ?? "",
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

  // ── Playlists ──
  const [plFormOpen, setPlFormOpen] = useState(false);
  const [plEditing, setPlEditing] = useState<RadioPlaylist | null>(null);
  const [plName, setPlName] = useState("");
  const [plDescription, setPlDescription] = useState("");
  const [plMode, setPlMode] = useState<RadioPlaylist["mode"]>("ordered");
  const [plSubmitting, setPlSubmitting] = useState(false);
  const [activePlaylist, setActivePlaylist] = useState<RadioPlaylist | null>(null);

  async function saveItem(episodeId: string) {
    if (!activePlaylist || !episodeId) return;
    setErr("");
    try {
      await addPlaylistItem(supabase, activePlaylist.id, episodeId);
      qc.invalidateQueries({ queryKey: ["radio-playlist-items", activePlaylist.id] });
    } catch (e2: unknown) {
      const msg = e2 instanceof Error ? e2.message : "Erro ao adicionar item";
      setErr(msg);
    }
  }

  function openNewPlaylist() {
    setPlEditing(null);
    setErr("");
    setPlName(""); setPlDescription(""); setPlMode("ordered");
    setPlFormOpen(true);
  }
  function openEditPlaylist(p: RadioPlaylist) {
    setPlEditing(p);
    setErr("");
    setPlName(p.name); setPlDescription(p.description ?? ""); setPlMode(p.mode);
    setPlFormOpen(true);
  }
  function closePlaylistForm() {
    setPlFormOpen(false);
    setPlEditing(null);
  }

  async function savePlaylist(e: React.FormEvent) {
    e.preventDefault();
    if (!plName.trim()) return;
    setErr("");
    setPlSubmitting(true);
    try {
      if (plEditing) {
        await updateRadioPlaylist(supabase, plEditing.id, {
          name: plName.trim(), description: plDescription || null, mode: plMode,
        });
      } else {
        const nextOrder = playlists.length > 0 ? Math.max(...playlists.map((x) => x.sort_order)) + 1 : 0;
        await createRadioPlaylist(supabase, {
          church_id: churchId, name: plName.trim(), description: plDescription || null,
          mode: plMode, is_active: true, sort_order: nextOrder,
        });
      }
      closePlaylistForm();
      qc.invalidateQueries({ queryKey: ["radio-playlists"] });
    } catch (e2: unknown) {
      const msg = e2 instanceof Error ? e2.message : "Erro ao salvar playlist";
      setErr(msg);
    } finally {
      setPlSubmitting(false);
    }
  }

  async function removePlaylist(p: RadioPlaylist) {
    if (!confirm(`Apagar playlist "${p.name}"?`)) return;
    try {
      await deleteRadioPlaylist(supabase, p.id);
      if (activePlaylist?.id === p.id) setActivePlaylist(null);
      qc.invalidateQueries({ queryKey: ["radio-playlists"] });
    } catch (e2: unknown) { alert(e2 instanceof Error ? e2.message : "Erro"); }
  }

  async function removeItem(id: string) {
    if (!activePlaylist) return;
    if (!confirm("Remover este item da playlist?")) return;
    try {
      await removePlaylistItem(supabase, id);
      qc.invalidateQueries({ queryKey: ["radio-playlist-items", activePlaylist.id] });
    } catch (e2: unknown) { alert(e2 instanceof Error ? e2.message : "Erro"); }
  }

  // ── Convites do apresentador (Studio) ──
  const { data: invites = [] } = useStudioInvites(churchId);
  const { data: recordings = [] } = useRadioRecordings(churchId);
  const [invFormOpen, setInvFormOpen] = useState(false);
  const [invProgramId, setInvProgramId] = useState("");
  const [invPresenter, setInvPresenter] = useState("");
  const [invEmail, setInvPresenterEmail] = useState("");
  const [invStartsAt, setInvStartsAt] = useState("");
  const [invEndsAt, setInvEndsAt] = useState("");
  const [invSaving, setInvSaving] = useState(false);
  const [lastInviteUrl, setLastInviteUrl] = useState("");

  function openNewInvite() {
    setErr("");
    setInvProgramId(""); setInvPresenter(""); setInvPresenterEmail("");
    setInvStartsAt(""); setInvEndsAt(""); setLastInviteUrl("");
    setInvFormOpen(true);
  }

  async function saveInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!invProgramId || !invStartsAt || !invEndsAt) return;
    setErr("");
    setInvSaving(true);
    try {
      const created = await createStudioInvite(supabase, {
        church_id: churchId,
        program_id: invProgramId,
        presenter_name: invPresenter || null,
        presenter_email: invEmail || null,
        starts_at: new Date(invStartsAt).toISOString(),
        ends_at: new Date(invEndsAt).toISOString(),
        access_ends_at: new Date(new Date(invEndsAt).getTime() + 10 * 60000).toISOString(),
      });
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      setLastInviteUrl(`${origin}/radio/studio/invite/${created.token}`);
      qc.invalidateQueries({ queryKey: ["radio-studio-invites"] });
    } catch (e2: unknown) {
      const msg = e2 instanceof Error ? e2.message : "Erro ao criar convite";
      setErr(msg);
    } finally {
      setInvSaving(false);
    }
  }

  async function doRevokeInvite(id: string) {
    if (!confirm("Revogar este convite? O link deixará de funcionar imediatamente.")) return;
    try {
      await revokeStudioInvite(supabase, id);
      qc.invalidateQueries({ queryKey: ["radio-studio-invites"] });
    } catch (e2: unknown) { alert(e2 instanceof Error ? e2.message : "Erro"); }
  }

  // ── Gravações / Reprise ──
  async function markRecordingPublished(r: RadioRecording) {
    if (!confirm(`Publicar a gravação "${r.title}" como conteúdo da biblioteca?`)) return;
    try {
      await updateRadioRecording(supabase, r.id, { status: "publicada" });
      qc.invalidateQueries({ queryKey: ["radio-recordings"] });
      qc.invalidateQueries({ queryKey: ["all-radio-episodes"] });
    } catch (e2: unknown) { alert(e2 instanceof Error ? e2.message : "Erro"); }
  }

  async function markRecordingReprise(r: RadioRecording) {
    if (!confirm(`Marcar "${r.title}" como reprise na grade?`)) return;
    try {
      if (r.audio_url) {
        await createRadioEpisode(supabase, {
          church_id: r.church_id,
          program_id: r.program_id,
          title: r.title,
          description: r.review_notes ?? `Reprise da gravação de ${new Date(r.recorded_at).toLocaleString("pt-BR")}.`,
          audio_url: r.audio_url,
          duration_seconds: r.duration_seconds,
          category: (r.category as RadioEpisode["category"]) ?? "especial",
          speaker: r.presenter_name,
          published_at: new Date().toISOString(),
          status: "published",
        });
      }
      await updateRadioRecording(supabase, r.id, { is_reprise: true, status: "publicada" });
      qc.invalidateQueries({ queryKey: ["radio-recordings"] });
      qc.invalidateQueries({ queryKey: ["all-radio-episodes"] });
    } catch (e2: unknown) { alert(e2 instanceof Error ? e2.message : "Erro"); }
  }

  // ── Ciclo 2: Podcasts ──
  async function togglePodcast(e: RadioEpisode) {
    try {
      await updateRadioEpisode(supabase, e.id, { is_podcast: !e.is_podcast });
      qc.invalidateQueries({ queryKey: ["all-radio-episodes"] });
      qc.invalidateQueries({ queryKey: ["radio-podcasts"] });
    } catch (e2: unknown) { alert(e2 instanceof Error ? e2.message : "Erro"); }
  }

  // ── Ciclo 2: Convidados por programa ──
  const [guestsForProgram, setGuestsForProgram] = useState<RadioProgram | null>(null);
  const [guestName, setGuestName] = useState("");
  const [guestRole, setGuestRole] = useState<RadioProgramGuest["guest_role"]>("convidado");
  const [guestSaving, setGuestSaving] = useState(false);
  const { data: programGuests = [] } = useProgramGuests(guestsForProgram?.id ?? "");

  async function addGuest() {
    if (!guestsForProgram || !guestName.trim()) return;
    setGuestSaving(true);
    try {
      await createProgramGuest(supabase, {
        program_id: guestsForProgram.id,
        guest_name: guestName.trim(),
        guest_role: guestRole,
      });
      setGuestName("");
      qc.invalidateQueries({ queryKey: ["radio-program-guests"] });
    } catch (e2: unknown) { alert(e2 instanceof Error ? e2.message : "Erro"); }
    finally { setGuestSaving(false); }
  }

  async function removeGuest(id: string) {
    if (!confirm("Remover este convidado?")) return;
    try {
      await deleteProgramGuest(supabase, id);
      qc.invalidateQueries({ queryKey: ["radio-program-guests"] });
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
          <Button variant={section === "playlists" ? "default" : "outline"} onClick={() => setSection("playlists")}>
            <ListMusic className="mr-1 h-4 w-4" /> Playlists
          </Button>
          <Button variant={section === "convites" ? "default" : "outline"} onClick={() => setSection("convites")}>
            <Link2 className="mr-1 h-4 w-4" /> Convites
          </Button>
          <Button variant={section === "gravacoes" ? "default" : "outline"} onClick={() => setSection("gravacoes")}>
            <Mic className="mr-1 h-4 w-4" /> Gravações
          </Button>
          <Button variant={section === "podcasts" ? "default" : "outline"} onClick={() => setSection("podcasts")}>
            <Podcast className="mr-1 h-4 w-4" /> Podcasts
          </Button>
          <Button variant={section === "analytics" ? "default" : "outline"} onClick={() => setSection("analytics")}>
            <BarChart3 className="mr-1 h-4 w-4" /> Analytics
          </Button>
          <Button variant={section === "ouvintes" ? "default" : "outline"} onClick={() => setSection("ouvintes")}>
            <Users className="mr-1 h-4 w-4" /> Ouvintes
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
        ) : section === "playlists" ? (
          <Button onClick={openNewPlaylist} className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Adicionar Playlist
          </Button>
        ) : section === "convites" ? (
          <Button onClick={openNewInvite} className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Novo Convite
          </Button>
        ) : null}
      </div>

      {err && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{err}</p>}

      {/* Agora no Ar — Broadcast Engine */}
      <Card className="rounded-xl border border-border p-6">
        <CardHeader>
          <CardTitle>Agora no Ar</CardTitle>
          <CardDescription>Programa vigente definido pelo Broadcast Engine a partir da grade</CardDescription>
        </CardHeader>
        <CardContent>
          {!onAir ? (
            <p className="text-sm text-muted-foreground">Nenhum programa vigente neste horário. A rádio usa a stream configurada como fallback.</p>
          ) : (
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <div>
                <span className="block text-xs text-muted-foreground">Programa</span>
                <span className="font-semibold text-navy">{onAir.title}</span>
              </div>
              {onAir.host_name && (
                <div>
                  <span className="block text-xs text-muted-foreground">Apresentador</span>
                  <span>{onAir.host_name}</span>
                </div>
              )}
              <div>
                <span className="block text-xs text-muted-foreground">Horário</span>
                <span>{onAir.start_time?.slice(0, 5)} – {onAir.end_time?.slice(0, 5) || "—"}</span>
              </div>
              <div>
                <span className="block text-xs text-muted-foreground">Modo</span>
                <span className="rounded-full bg-navy/10 px-2 py-0.5 text-xs font-bold uppercase text-navy">
                  {onAir.mode === "ao_vivo" ? "Ao vivo" : onAir.mode === "hibrido" ? "Híbrido" : onAir.mode === "gravado" ? "Gravado" : "Automático"}
                </span>
              </div>
              {onAir.is_special && (
                <span className="rounded-full bg-gold/20 px-2 py-0.5 text-xs font-bold uppercase text-gold">Especial</span>
              )}
              {onAir.fallback_url && (
                <div>
                  <span className="block text-xs text-muted-foreground">Fallback</span>
                  <span className="text-xs">Playlist/áudio de contingência ativo</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

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
                  <Button variant="outline" size="sm" className="text-xs" onClick={() => setGuestsForProgram(p)} title="Gerenciar convidados">
                    <Plus className="mr-1 h-3 w-3" /> Convidados
                  </Button>
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
      ) : section === "playlists" ? (
        <div className="space-y-4">
          <Card className="rounded-xl border border-border p-6">
            <CardHeader>
              <CardTitle>Playlists</CardTitle>
              <CardDescription>Sequências de conteúdos para o modo automático e fallback contra silêncio</CardDescription>
            </CardHeader>
            <CardContent>
              {playlists.length === 0 && (
                <p className="text-center text-muted-foreground py-12">
                  Nenhuma playlist criada ainda.
                </p>
              )}
              <div className="space-y-2">
                {playlists.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/50">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-navy truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.mode === "ordered" ? "Ordenada" : p.mode === "shuffle" ? "Embaralhada" : "Temática"}
                        {p.description ? ` · ${p.description}` : ""}
                        {!p.is_active && " · Inativa"}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="p-1 rounded" onClick={() => { setActivePlaylist(p); setErr(""); }} title="Gerenciar itens">
                      <ListMusic className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="p-1 rounded" onClick={() => openEditPlaylist(p)} title="Editar">
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="p-1 rounded text-destructive" onClick={() => removePlaylist(p)} title="Excluir">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {activePlaylist && <PlaylistItemsEditor playlistId={activePlaylist.id} episodes={episodes} onAdd={saveItem} onRemove={removeItem} />}
        </div>
      ) : section === "convites" ? (
        <div className="space-y-4">
          <Card className="rounded-xl border border-border p-6">
            <CardHeader>
              <CardTitle>Convites do Apresentador</CardTitle>
              <CardDescription>Links temporários para o apresentador entrar no estúdio remoto dentro da janela autorizada</CardDescription>
            </CardHeader>
            <CardContent>
              {invites.length === 0 && (
                <p className="text-center text-muted-foreground py-12">
                  Nenhum convite gerado ainda.
                </p>
              )}
              <div className="space-y-2">
                {invites.map((inv) => {
                  const p = programs.find((x) => x.id === inv.program_id);
                  const active = inv.status === "ativo";

  return (
                    <div key={inv.id} className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/50">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm text-navy truncate">
                          {p?.title ?? "Programa"} {inv.presenter_name ? ` · ${inv.presenter_name}` : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(inv.starts_at).toLocaleString("pt-BR")} – {new Date(inv.ends_at).toLocaleString("pt-BR")}
                          {" · "}{inv.status}
                        </p>
                        {inv.status === "usado" && inv.used_at && (
                          <p className="text-xs text-emerald-600">Usado em {new Date(inv.used_at).toLocaleString("pt-BR")}</p>
                        )}
                      </div>
                      {active && (
                        <Button variant="ghost" size="sm" className="text-xs" onClick={() => {
                          const origin = typeof window !== "undefined" ? window.location.origin : "";
                          navigator.clipboard?.writeText(`${origin}/radio/studio/invite/${inv.token}`);
                          alert("Link copiado!");
                        }}>
                          Copiar link
                        </Button>
                      )}
                      {active && (
                        <Button variant="ghost" size="icon" className="p-1 rounded text-destructive" onClick={() => doRevokeInvite(inv.id)} title="Revogar">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {invFormOpen && (
            <Card className="rounded-xl border border-border p-6">
              <CardHeader>
                <CardTitle>Novo Convite</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={saveInvite} className="space-y-4">
                  <div>
                    <Label>Programa <span className="text-destructive">*</span></Label>
                    <select value={invProgramId} onChange={(e) => setInvProgramId(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option value="">—</option>
                      {programs.map((p) => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Apresentador</Label>
                      <Input value={invPresenter} onChange={(e) => setInvPresenter(e.target.value)} placeholder="Nome" />
                    </div>
                    <div>
                      <Label>E-mail</Label>
                      <Input value={invEmail} onChange={(e) => setInvPresenterEmail(e.target.value)} type="email" placeholder="email@exemplo.com" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Início da janela <span className="text-destructive">*</span></Label>
                      <Input value={invStartsAt} onChange={(e) => setInvStartsAt(e.target.value)} type="datetime-local" />
                    </div>
                    <div>
                      <Label>Fim da transmissão <span className="text-destructive">*</span></Label>
                      <Input value={invEndsAt} onChange={(e) => setInvEndsAt(e.target.value)} type="datetime-local" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button type="submit" disabled={invSaving}>
                      {invSaving ? "Gerando..." : "Gerar convite"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setInvFormOpen(false)}>Cancelar</Button>
                  </div>
                  {lastInviteUrl && (
                    <div className="rounded-md bg-muted p-3">
                      <p className="text-xs font-semibold text-muted-foreground">Link do convite:</p>
                      <p className="text-xs break-all text-navy">{lastInviteUrl}</p>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      ) : section === "gravacoes" ? (
        <div className="space-y-4">
          <Card className="rounded-xl border border-border p-6">
            <CardHeader>
              <CardTitle>Gravações do Studio</CardTitle>
              <CardDescription>Aprovar para a biblioteca ou marcar como reprise na grade</CardDescription>
            </CardHeader>
            <CardContent>
              {recordings.length === 0 && (
                <p className="text-center text-muted-foreground py-12">
                  Nenhuma gravação ainda. Convide um apresentador e use o estúdio remoto.
                </p>
              )}
              <div className="space-y-2">
                {recordings.map((r) => (
                  <div key={r.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/50">
                    {r.cover_url && (
                      <img src={r.cover_url} alt="Capa" className="h-12 w-12 rounded object-cover" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-navy truncate">{r.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(r.recorded_at).toLocaleString("pt-BR")}
                        {r.presenter_name ? ` · ${r.presenter_name}` : ""}
                        {r.is_reprise ? " · Reprise" : ""}
                        {" · "}{r.status}
                      </p>
                    </div>
                    {r.audio_url && (
                      <audio controls src={r.audio_url} className="h-8 max-w-[200px]" preload="none" />
                    )}
                    {r.status === "revisao" || r.status === "processando" ? (
                      <>
                        <Button variant="ghost" size="sm" className="text-xs" onClick={() => markRecordingPublished(r)}>
                          Publicar na biblioteca
                        </Button>
                        <Button variant="ghost" size="sm" className="text-xs" onClick={() => markRecordingReprise(r)}>
                          Marcar reprise
                        </Button>
                      </>
                    ) : null}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : section === "podcasts" ? (
        <div className="space-y-4">
          <Card className="rounded-xl border border-border p-6">
            <CardHeader>
              <CardTitle>Podcasts</CardTitle>
              <CardDescription>Episódios publicados e marcados como podcast — exibidos na aba Podcasts do player e no feed RSS</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-xs text-muted-foreground">
                Marque um conteúdo como podcast na aba Conteúdos para ele aparecer aqui e no feed RSS.
              </p>
              {podcastEpisodes.length === 0 && (
                <p className="text-center text-muted-foreground py-8">Nenhum podcast publicado ainda.</p>
              )}
              <div className="space-y-2">
                {podcastEpisodes.map((e) => (
                  <div key={e.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/50">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-navy truncate">{e.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {e.speaker ? `${e.speaker} · ` : ""}
                        {e.published_at ? new Date(e.published_at).toLocaleDateString("pt-BR") : "sem data"}
                      </p>
                    </div>
                    <a
                      href={`/radio/feed.xml`}
                      className="text-xs font-semibold text-gold underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Ver feed RSS
                    </a>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : section === "analytics" ? (
        <div className="space-y-4">
          <Card className="rounded-xl border border-border p-6">
            <CardHeader>
              <CardTitle>Analytics de Audiência</CardTitle>
              <CardDescription>Plays registrados pela biblioteca, podcasts, transmissões e reprises</CardDescription>
            </CardHeader>
            <CardContent>
              {!analytics ? (
                <p className="text-center text-muted-foreground py-8">Carregando métricas...</p>
              ) : analytics.total_plays === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhum play registrado ainda.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-border p-4">
                    <p className="text-2xl font-bold text-navy">{analytics.total_plays}</p>
                    <p className="text-xs text-muted-foreground">Total de plays</p>
                  </div>
                  <div className="rounded-lg border border-border p-4">
                    <p className="text-2xl font-bold text-navy">{analytics.unique_listeners}</p>
                    <p className="text-xs text-muted-foreground">Ouvintes únicos</p>
                  </div>
                  <div className="rounded-lg border border-border p-4">
                    <p className="text-2xl font-bold text-navy">
                      {Math.round(analytics.total_listened_seconds / 60)} min
                    </p>
                    <p className="text-xs text-muted-foreground">Tempo escutado</p>
                  </div>
                  <div className="rounded-lg border border-border p-4">
                    <p className="text-2xl font-bold text-navy">{analytics.live_plays}</p>
                    <p className="text-xs text-muted-foreground">Ao vivo</p>
                  </div>
                  <div className="rounded-lg border border-border p-4">
                    <p className="text-2xl font-bold text-navy">{analytics.podcast_plays}</p>
                    <p className="text-xs text-muted-foreground">Podcasts</p>
                  </div>
                  <div className="rounded-lg border border-border p-4">
                    <p className="text-2xl font-bold text-navy">{analytics.last_7d_plays}</p>
                    <p className="text-xs text-muted-foreground">Plays (7 dias)</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-xl border border-border p-6">
            <CardHeader>
              <CardTitle>Ranking por Conteúdo</CardTitle>
              <CardDescription>Os conteúdos mais ouvidos</CardDescription>
            </CardHeader>
            <CardContent>
              {episodeStats.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Sem dados ainda.</p>
              ) : (
                <div className="space-y-2">
                  {episodeStats.slice(0, 10).map((s) => (
                    <div key={s.episode_id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-navy">{s.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {s.total_plays} plays · {Math.round((s.total_listened_seconds ?? 0) / 60)} min
                          {s.is_podcast ? " · Podcast" : ""}
                        </p>
                      </div>
                      <span className="rounded-full bg-navy/10 px-2 py-0.5 text-xs font-bold text-navy">
                        #{s.total_plays}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : section === "ouvintes" ? (
        <Card className="rounded-xl border border-border p-6">
          <CardHeader>
            <CardTitle>Ouvintes</CardTitle>
            <CardDescription>
              Pessoas inscritas para receber aviso quando um programa entra no ar
            </CardDescription>
          </CardHeader>
          <CardContent>
            {listenersLoading ? (
              <p className="text-center text-muted-foreground py-8">Carregando...</p>
            ) : listeners.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum ouvinte inscrito ainda.
              </p>
            ) : (
              <div className="space-y-2">
                {listeners.map((l) => {
                  const programCount = (l.program_ids ?? []).length;
                  return (
                    <div key={l.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-navy">{l.name}</p>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                              l.status === "ativo"
                                ? "bg-green-100 text-green-700"
                                : l.status === "pausado"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {l.status}
                          </span>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {l.email} · {programCount > 0 ? `${programCount} programa(s)` : "todos os programas"} ·{" "}
                          {new Date(l.created_at).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeListener(l.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
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
                  <Button
                    variant={e.is_podcast ? "default" : "outline"}
                    size="sm"
                    className="text-xs"
                    onClick={() => togglePodcast(e)}
                    title={e.is_podcast ? "Remover do podcast" : "Marcar como podcast"}
                  >
                    <Podcast className="mr-1 h-3 w-3" />
                    {e.is_podcast ? "É Podcast" : "Podcast?"}
                  </Button>
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

      <StudioRemoto supabase={supabase} churchId={churchId} />

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
                    <Label>Modo de programação</Label>
                    <select {...register("mode")} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option value="automatico">Automático</option>
                      <option value="gravado">Gravado</option>
                      <option value="ao_vivo">Ao vivo</option>
                      <option value="hibrido">Híbrido</option>
                    </select>
                  </div>
                  <div>
                    <Label>Playlist</Label>
                    <select {...register("playlist_id")} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option value="">— Sem playlist —</option>
                      {playlists.map((pl) => (
                        <option key={pl.id} value={pl.id}>{pl.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <Label>Fallback (contingência contra silêncio)</Label>
                  <Input {...register("fallback_url")} type="url" placeholder="https://.../fallback.mp3 ou stream" />
                  {errors.fallback_url && <p className="mt-1 text-xs text-destructive">{errors.fallback_url.message}</p>}
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" {...register("is_special")} /> Programação especial (sobrescreve a grade)
                </label>
                {watch("is_special") && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Início da vigência</Label>
                      <Input {...register("special_start_date")} type="date" />
                    </div>
                    <div>
                      <Label>Fim da vigência</Label>
                      <Input {...register("special_end_date")} type="date" />
                    </div>
                  </div>
                )}
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
    {/* Modal de Playlist */}
      {plFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg rounded-xl border border-border p-6">
            <CardHeader>
              <CardTitle>{plEditing ? "Editar Playlist" : "Nova Playlist"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={savePlaylist} className="space-y-4">
                <div>
                  <Label>Nome <span className="text-destructive">*</span></Label>
                  <Input value={plName} onChange={(e) => setPlName(e.target.value)} required placeholder="Ex: Louvor da manhã" />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Input value={plDescription} onChange={(e) => setPlDescription(e.target.value)} placeholder="Breve descrição" />
                </div>
                <div>
                  <Label>Modo de reprodução</Label>
                  <select value={plMode} onChange={(e) => setPlMode(e.target.value as RadioPlaylist["mode"])} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="ordered">Ordenada</option>
                    <option value="shuffle">Embaralhada</option>
                    <option value="thematic">Temática</option>
                  </select>
                </div>
                <div className="mt-4 flex items-center justify-end gap-2">
                  <Button variant="outline" type="button" onClick={closePlaylistForm}>
                    <X className="h-4 w-4" /> Cancelar
                  </Button>
                  <Button type="submit" disabled={plSubmitting}>
                    {plEditing ? "Salvar Alterações" : "Criar Playlist"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Convidados do Programa */}
      {guestsForProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg rounded-xl border border-border p-6">
            <CardHeader>
              <CardTitle>Convidados — {guestsForProgram.title}</CardTitle>
              <CardDescription>Roteirize os participantes do programa</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="Nome do convidado" />
                <select value={guestRole} onChange={(e) => setGuestRole(e.target.value as RadioProgramGuest["guest_role"])} className="w-36 rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="convidado">Convidado</option>
                  <option value="especial">Especial</option>
                  <option value="co-apresentador">Co-apresentador</option>
                  <option value="musica">Música</option>
                </select>
                <Button type="button" onClick={addGuest} disabled={guestSaving || !guestName.trim()}>
                  Adicionar
                </Button>
              </div>
              {programGuests.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum convidado roteirizado ainda.</p>
              ) : (
                <div className="space-y-2">
                  {programGuests.map((g) => (
                    <div key={g.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-navy">{g.guest_name}</p>
                        <p className="text-xs text-muted-foreground">{g.guest_role}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="p-1 rounded text-destructive" onClick={() => removeGuest(g.id)} title="Remover">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-end">
                <Button variant="outline" onClick={() => setGuestsForProgram(null)}>
                  <X className="h-4 w-4" /> Fechar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function PlaylistItemsEditor({ playlistId, episodes, onAdd, onRemove }: {
  playlistId: string;
  episodes: RadioEpisode[];
  onAdd: (episodeId: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {
  const { data: items = [] } = usePlaylistItems(playlistId);
  const [episodeId, setEpisodeId] = useState("");
  const available = episodes.filter((e) => e.status === "published" && !items.some((i) => i.episode_id === e.id));

  return (
    <Card className="rounded-xl border border-border p-6">
      <CardHeader>
        <CardTitle>Itens da Playlist</CardTitle>
        <CardDescription>Adicione conteúdos publicados à sequência</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <select
            value={episodeId}
            onChange={(e) => setEpisodeId(e.target.value)}
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">— Selecionar conteúdo —</option>
            {available.map((e) => (
              <option key={e.id} value={e.id}>{e.title}</option>
            ))}
          </select>
          <Button type="button" onClick={() => { onAdd(episodeId); setEpisodeId(""); }} disabled={!episodeId}>
            Adicionar
          </Button>
        </div>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Playlist vazia.</p>
        ) : (
          <div className="space-y-2">
            {items.map((it, idx) => {
              const ep = episodes.find((e) => e.id === it.episode_id);
              return (
                <div key={it.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <span className="w-6 text-xs font-bold text-muted-foreground">{idx + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-navy truncate">{ep?.title ?? "Conteúdo removido"}</p>
                    {ep && (
                      <p className="text-xs text-muted-foreground">
                        {EPISODE_CATEGORIES.find((c) => c.value === ep.category)?.label ?? ep.category}
                      </p>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" className="p-1 rounded text-destructive" onClick={() => onRemove(it.id)} title="Remover">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}