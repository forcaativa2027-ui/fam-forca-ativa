"use client";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, X, Image as ImageIcon, Video, FileText, Library, Upload, ChevronLeft, ChevronRight, Play, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useContentLibrary, useChurches } from "@/hooks/use-queries";
import { supabase } from "@/lib/supabase/client";
import { createContentLibraryItem, deleteContentLibraryItem } from "@/services/contentLibrary";
import { logAudit } from "@/services/audit";
import { youtubeThumbnailUrl, isValidYoutubeUrl } from "@/lib/youtube";
import { uploadContentLibraryFile, validateFile, getFolderForType, MAX_FILE_SIZE } from "@/services/storage";
import { createCarouselItem, updateCarouselItem, deleteCarouselItem, listAllCarouselItems, logCarouselAudit } from "@/services/carousel";
import type { ContentLibraryType, ContentLibraryItem } from "@/types/domain";
import type { CarouselItem } from "@/types/domain";

const TYPE_LABELS: Record<ContentLibraryType, string> = {
  imagem: "Imagem", video_youtube: "Vídeo (YouTube)", documento: "Documento",
  logo: "Logo", outro: "Outro", arquivo: "Arquivo", carrossel: "Carrossel",
};
const TYPE_ICONS: Record<ContentLibraryType, React.ReactNode> = {
  imagem: <ImageIcon className="h-4 w-4" />, video_youtube: <Video className="h-4 w-4" />,
  documento: <FileText className="h-4 w-4" />, logo: <ImageIcon className="h-4 w-4" />,
  outro: <FileText className="h-4 w-4" />, arquivo: <Upload className="h-4 w-4" />,
  carrossel: <ImageIcon className="h-4 w-4" />,
};

const TABS: { key: ContentLibraryType; label: string; icon: React.ReactNode }[] = [
  { key: "imagem", label: "Imagens", icon: <ImageIcon className="h-4 w-4" /> },
  { key: "video_youtube", label: "Vídeos", icon: <Video className="h-4 w-4" /> },
  { key: "documento", label: "Documentos", icon: <FileText className="h-4 w-4" /> },
  { key: "arquivo", label: "Arquivos", icon: <Upload className="h-4 w-4" /> },
  { key: "carrossel", label: "Carrossel", icon: <ImageIcon className="h-4 w-4" /> },
];

export function ContentLibraryAdmin() {
  const qc = useQueryClient();
  const { data: libraryItems = [] } = useContentLibrary();
  const { data: carouselItems = [] } = useQuery({ queryKey: ["all-carousel-items"], queryFn: () => listAllCarouselItems(supabase) });
  const [activeTab, setActiveTab] = useState<ContentLibraryType>("imagem");
  const handleTabChange = (value: string) => setActiveTab(value as ContentLibraryType);
  const [filterType, setFilterType] = useState<"todos" | ContentLibraryType>("todos");

  async function removeLibraryItem(id: string, title: string) {
    if (!confirm(`Remover "${title}" da biblioteca?`)) return;
    await deleteContentLibraryItem(supabase, id);
    await logAudit(supabase, "delete", "content_library", id, { title });
    qc.invalidateQueries({ queryKey: ["content-library"] });
  }

  const libraryFiltered = filterType === "todos" ? libraryItems : libraryItems.filter((i) => i.type === filterType);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Library className="h-5 w-5 text-gold" />Biblioteca de Arquivos</CardTitle>
            <CardDescription>
              Repositório de mídias e arquivos — upload direto, links do YouTube e documentos.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              {TABS.map((t) => (
                <TabsTrigger key={t.key} value={t.key} className="gap-1 py-2">
                  {t.icon} {t.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {TABS.map((tab) => (
              <TabsContent key={tab.key} value={tab.key} className="mt-4">
                {tab.key === "carrossel" ? (
                  <CarouselTab
                    items={carouselItems}
                    onChange={() => qc.invalidateQueries({ queryKey: ["all-carousel-items"] })}
                    libraryItems={libraryItems.filter((i) => i.type === "arquivo" || i.type === "imagem" || i.type === "video_youtube")}
                  />
                ) : (
                  <LibraryTab
                    type={tab.key}
                    items={libraryFiltered}
                    onRemove={removeLibraryItem}
                    onChange={() => qc.invalidateQueries({ queryKey: ["content-library"] })}
                    filterType={filterType}
                    setFilterType={setFilterType}
                  />
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function LibraryTab({
  type,
  items,
  onRemove,
  onChange,
  filterType,
  setFilterType,
}: {
  type: ContentLibraryType;
  items: ContentLibraryItem[];
  onRemove: (id: string, title: string) => Promise<void>;
  onChange: () => void;
  filterType: "todos" | ContentLibraryType;
  setFilterType: (v: "todos" | ContentLibraryType) => void;
}) {
  const [open, setOpen] = useState(false);
  const { data: churches = [] } = useChurches();
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [tags, setTags] = useState("");
  const [churchId, setChurchId] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  const isFileUpload = type === "arquivo";

  async function save() {
    if (!title.trim()) { setErr("Dê um título/nome pro item."); return; }
    if (isFileUpload) {
      if (!file) { setErr("Selecione um arquivo."); return; }
      const validation = validateFile(file);
      if (validation) { setErr(validation); return; }
    } else {
      if (!url.trim()) { setErr("Cole o link."); return; }
      if (type === "video_youtube" && !isValidYoutubeUrl(url)) { setErr("Esse link não parece ser do YouTube."); return; }
    }

    setBusy(true); setErr(""); setUploadProgress(0);
    try {
      let finalUrl = url.trim();

      if (isFileUpload && file) {
        setUploadProgress(10);
        const folder = getFolderForType(type);
        const result = await uploadContentLibraryFile(file, folder);
        setUploadProgress(80);
        if ("error" in result) throw new Error(result.error);
        finalUrl = result.url;
      }

      await createContentLibraryItem(supabase, {
        title: title.trim(), type, url: finalUrl,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        church_id: churchId || null,
      });
      onChange();
      setOpen(false);
      setTitle(""); setUrl(""); setFile(null); setTags(""); setChurchId("");
    } catch (e) {
      setErr((e as { message?: string })?.message ?? "Erro ao salvar");
    } finally { setBusy(false); setUploadProgress(0); }
  }

  const filtered = items.filter((i) => i.type === type);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 mb-3">
        {(["todos", "imagem", "video_youtube", "documento", "logo", "outro", "arquivo"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${filterType === t ? "bg-navy text-white border-navy" : "bg-card"}`}
          >
            {t === "todos" ? "Todos" : TYPE_LABELS[t]}
          </button>
        ))}
        <Button onClick={() => setOpen(true)} className="gap-1.5 ml-auto"><Plus size={16} /> Adicionar</Button>
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm italic text-muted-foreground">Nada aqui ainda. Clique em "Adicionar".</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => {
            const thumb = item.type === "video_youtube" ? youtubeThumbnailUrl(item.url) : item.type === "imagem" || item.type === "logo" ? item.url : item.type === "arquivo" ? item.url : null;
            return (
              <div key={item.id} className="overflow-hidden rounded-lg border bg-card">
                {thumb ? (
                  <img src={thumb} alt={item.title} className="h-28 w-full object-cover" />
                ) : (
                  <div className="grid h-28 w-full place-items-center bg-muted/40 text-muted-foreground">{TYPE_ICONS[item.type]}</div>
                )}
                <div className="p-2.5">
                  <p className="truncate text-sm font-semibold text-navy">{item.title}</p>
                  <p className="text-[10px] uppercase text-muted-foreground">{TYPE_LABELS[item.type]}</p>
                  {item.tags.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {item.tags.map((t) => <span key={t} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{t}</span>)}
                    </div>
                  )}
                  <div className="mt-2 flex items-center justify-between">
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-navy underline">{isFileUpload ? "Abrir arquivo" : "Abrir link"}</a>
                    <Button size="sm" variant="ghost" onClick={() => onRemove(item.id, item.title)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {open && (
        <NewItemDialog
          type={type}
          onClose={() => { setOpen(false); setTitle(""); setUrl(""); setFile(null); setTags(""); setChurchId(""); setErr(""); }}
          title={title} setTitle={setTitle}
          url={url} setUrl={setUrl}
          file={file} setFile={setFile}
          tags={tags} setTags={setTags}
          churchId={churchId} setChurchId={setChurchId}
          churches={churches}
          busy={busy} err={err} setErr={setErr}
          onSave={save}
          uploadProgress={uploadProgress}
          isFileUpload={isFileUpload}
        />
      )}
    </div>
  );
}

function NewItemDialog({
  type, onClose, title, setTitle, url, setUrl, file, setFile,
  tags, setTags, churchId, setChurchId, churches,
  busy, err, setErr, onSave, uploadProgress, isFileUpload,
}: {
  type: ContentLibraryType; onClose: () => void;
  title: string; setTitle: (v: string) => void;
  url: string; setUrl: (v: string) => void;
  file: File | null; setFile: (v: File | null) => void;
  tags: string; setTags: (v: string) => void;
  churchId: string; setChurchId: (v: string) => void;
  churches: { id: string; name: string }[];
  busy: boolean; err: string; setErr: (v: string) => void;
  onSave: () => Promise<void>;
  uploadProgress: number; isFileUpload: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Adicionar à biblioteca — {TYPE_LABELS[type]}</CardTitle>
          <Button onClick={onClose} variant="ghost" size="sm"><X className="h-4 w-4" /></Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Banner Congresso 2026" />
          </div>

          {isFileUpload ? (
            <div className="space-y-2">
              <Label>Arquivo</Label>
              <div className={`border-2 rounded-lg p-4 text-center ${file ? "bg-green-50 border-green-200" : "border-dashed"}`}>
                <input
                  type="file"
                  accept="image/*,video/*,application/pdf,.doc,.docx"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f); }}
                  className="hidden" id={`file-upload-${type}`}
                />
                <label htmlFor={`file-upload-${type}`} className="cursor-pointer">
                  {file ? (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
                      <Button variant="ghost" size="sm" onClick={(e) => { e.preventDefault(); setFile(null); }}>Remover</Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-8 w-8 text-muted" />
                      <span className="text-sm text-muted">Clique ou arraste para enviar</span>
                      <span className="text-xs text-muted">Máx. 100MB — Imagens, vídeos, PDF, DOC</span>
                    </div>
                  )}
                </label>
              </div>
              {uploadProgress > 0 && (
                <div className="space-y-1">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-navy transition-all" style={{ width: `${uploadProgress}%` }} />
                  </div>
                  <span className="text-xs text-muted">Enviando... {uploadProgress}%</span>
                </div>
              )}
            </div>
          ) : (
            <div>
              <Label>{type === "video_youtube" ? "Link do YouTube" : "URL"}</Label>
              <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder={type === "video_youtube" ? "https://www.youtube.com/watch?v=…" : "https://…"} />
            </div>
          )}

          <div>
            <Label>Tags (separadas por vírgula, opcional)</Label>
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="jovens, congresso, 2026" />
          </div>
          <div>
            <Label>Igreja (opcional — vazio = disponível pra rede toda)</Label>
            <select value={churchId} onChange={(e) => setChurchId(e.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
              <option value="">Rede toda</option>
              {churches.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {err && <p className="text-sm text-destructive">{err}</p>}
          <Button onClick={onSave} disabled={busy} className="w-full">{busy ? (isFileUpload && uploadProgress > 0 ? `Enviando... ${uploadProgress}%` : "Salvando…") : "Adicionar"}</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function CarouselTab({
  items,
  onChange,
  libraryItems,
}: {
  items: CarouselItem[];
  onChange: () => void;
  libraryItems: ContentLibraryItem[];
}) {
  const [editing, setEditing] = useState<CarouselItem | null>(null);
  const [form, setForm] = useState<Partial<CarouselItem> & { image_file?: File; video_file?: File; cover_file?: File }>({
    title: "", description: "", content_type: "banner",
    image_url: "", video_url: "", cover_url: "",
    button_label: "", action_type: "nenhum", action_url: "",
    display_order: 0, audience: "todos",
    starts_at: "", ends_at: "", is_active: true,
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const CONTENT_TYPES = ["banner", "video", "noticia", "informativo", "evento", "campanha", "outro"] as const;
  const ACTION_TYPES = ["nenhum", "interno", "externo", "noticia", "evento", "video", "servico", "fale_fam", "direitos"] as const;
  const AUDIENCES = ["todos", "nao_autenticados", "cadastrados", "membros_ativos", "membros_inativos"] as const;

  function toIsoOrNull(local: string | undefined | null): string | null {
    if (!local || !local.trim()) return null;
    try { return new Date(local).toISOString(); } catch { return null; }
  }
  function fromIsoToLocal(iso: string | null): string {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch { return ""; }
  }

  function startCreate() {
    setEditing(null);
    setForm({ title: "", description: "", content_type: "banner", image_url: "", video_url: "", cover_url: "",
      button_label: "", action_type: "nenhum", action_url: "", display_order: items.length, audience: "todos",
      starts_at: "", ends_at: "", is_active: true });
  }

  function startEdit(item: CarouselItem) {
    setEditing(item);
    setForm({
      title: item.title, description: item.description ?? "", content_type: item.content_type,
      image_url: item.image_url ?? "", video_url: item.video_url ?? "", cover_url: item.cover_url ?? "",
      button_label: item.button_label ?? "", action_type: item.action_type, action_url: item.action_url ?? "",
      display_order: item.display_order, audience: item.audience,
      starts_at: fromIsoToLocal(item.starts_at), ends_at: fromIsoToLocal(item.ends_at), is_active: item.is_active,
    });
  }

  function cancel() { setEditing(null); setErr(""); }

  async function handleSave() {
    if (!form.title.trim()) { setErr("Título é obrigatório"); return; }
    setBusy(true); setErr("");
    try {
      const uploads = await Promise.all([
        form.image_file ? uploadContentLibraryFile(form.image_file, "carrossel") : null,
        form.video_file ? uploadContentLibraryFile(form.video_file, "carrossel") : null,
        form.cover_file ? uploadContentLibraryFile(form.cover_file, "carrossel") : null,
      ]);

      const payload = {
        title: form.title.trim(), description: form.description.trim() || null,
        content_type: form.content_type,
        image_url: uploads[0] && "url" in uploads[0] ? uploads[0].url : form.image_url || null,
        video_url: uploads[1] && "url" in uploads[1] ? uploads[1].url : form.video_url || null,
        cover_url: uploads[2] && "url" in uploads[2] ? uploads[2].url : form.cover_url || null,
        button_label: form.button_label || null, action_type: form.action_type,
        action_url: form.action_url || null,
        display_order: form.display_order, audience: form.audience,
        starts_at: toIsoOrNull(form.starts_at), ends_at: toIsoOrNull(form.ends_at),
        is_active: form.is_active,
      };

      if (editing) {
        await updateCarouselItem(supabase, editing.id, payload);
        await logCarouselAudit(supabase, "CARROSSEL_EDITADO", editing.id, form.title!);
      } else {
        const created = await createCarouselItem(supabase, payload);
        await logCarouselAudit(supabase, "CARROSSEL_CRIADO", created.id, form.title!);
      }
      cancel(); onChange();
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  }

  async function handleDelete(item: CarouselItem) {
    if (!confirm(`Excluir "${item.title}"?`)) return;
    try { await deleteCarouselItem(supabase, item.id); await logCarouselAudit(supabase, "CARROSSEL_REMOVIDO", item.id, item.title); onChange(); } catch { setErr("Erro ao excluir"); }
  }

  async function handleToggle(item: CarouselItem) {
    try { await updateCarouselItem(supabase, item.id, { is_active: !item.is_active }); await logCarouselAudit(supabase, item.is_active ? "CARROSSEL_DESATIVADO" : "CARROSSEL_ATIVADO", item.id, item.title); onChange(); } catch { setErr("Erro ao alterar status"); }
  }

  async function handleMove(item: CarouselItem, dir: -1 | 1) {
    const newOrder = item.display_order + dir;
    if (newOrder < 0) return;
    try { await updateCarouselItem(supabase, item.id, { display_order: newOrder }); await logCarouselAudit(supabase, "CARROSSEL_REORDENADO", item.id, item.title, { new_order: newOrder }); onChange(); } catch { setErr("Erro ao reordenar"); }
  }

  const isEditing = editing !== null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-bold text-navy">Carrossel da Página Inicial</h3>
          <p className="text-sm text-muted">Gerencie os conteúdos do carrossel institucional (após o HERO, antes dos FAM Vídeos).</p>
        </div>
        <Button onClick={startCreate} className="gap-1"><Plus className="h-4 w-4" /> Adicionar Item</Button>
      </div>

      {err && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{err}</p>}

      {isEditing && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{editing ? "Editar Item" : "Novo Item do Carrossel"}</CardTitle>
              <Button variant="ghost" size="sm" onClick={cancel}><X className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1"><Label>Título *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div className="space-y-1"><Label>Tipo *</Label><select value={form.content_type} onChange={(e) => setForm({ ...form, content_type: e.target.value })} className="h-10 w-full rounded-md border bg-background px-3 text-sm">{CONTENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
            </div>
            <div className="space-y-1"><Label>Descrição</Label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-md border bg-background px-3 py-2 text-sm" rows={2} /></div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1"><Label>Imagem</Label><Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." />
                <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) setForm({ ...form, image_file: f }); }} className="mt-1" />
              </div>
              <div className="space-y-1"><Label>Vídeo</Label><Input value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} placeholder="https://youtube.com/..." />
                <input type="file" accept="video/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) setForm({ ...form, video_file: f }); }} className="mt-1" />
              </div>
              <div className="space-y-1"><Label>Capa do Vídeo</Label><Input value={form.cover_url} onChange={(e) => setForm({ ...form, cover_url: e.target.value })} placeholder="https://..." />
                <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) setForm({ ...form, cover_file: f }); }} className="mt-1" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1"><Label>Texto do Botão</Label><Input value={form.button_label} onChange={(e) => setForm({ ...form, button_label: e.target.value })} placeholder="Saiba mais" /></div>
              <div className="space-y-1"><Label>Ação</Label><select value={form.action_type} onChange={(e) => setForm({ ...form, action_type: e.target.value })} className="h-10 w-full rounded-md border bg-background px-3 text-sm">{ACTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
              <div className="space-y-1"><Label>URL Destino</Label><Input value={form.action_url} onChange={(e) => setForm({ ...form, action_url: e.target.value })} placeholder="https://..." /></div>
            </div>

            <div className="grid gap-4 sm:grid-cols-4">
              <div className="space-y-1"><Label>Ordem</Label><Input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })} /></div>
              <div className="space-y-1"><Label>Público</Label><select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} className="h-10 w-full rounded-md border bg-background px-3 text-sm">{AUDIENCES.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
              <div className="space-y-1"><Label>Início</Label><Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} /></div>
              <div className="space-y-1"><Label>Fim</Label><Input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} /></div>
            </div>

            <div className="flex items-center gap-2"><input type="checkbox" id="carousel-active" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="h-4 w-4 rounded border-input" /><Label htmlFor="carousel-active">Ativo</Label></div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={cancel}>Cancelar</Button>
              <Button onClick={handleSave} disabled={busy}>{busy ? "Salvando..." : "Salvar"}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {items.length === 0 && (
          <p className="py-8 text-center text-sm italic text-muted">Nenhum item no carrossel. Clique em "Adicionar Item" para criar o primeiro.</p>
        )}
        {items.map((item) => (
          <div key={item.id} className={`flex items-center gap-3 rounded-xl border p-3 ${item.is_active ? "bg-card" : "bg-muted/30 opacity-60"}`}>
            {item.cover_url || item.image_url ? (
              <img src={item.cover_url || item.image_url || ""} alt="" className="h-12 w-16 rounded object-cover" />
            ) : (
              <div className="flex h-12 w-16 items-center justify-center rounded bg-muted text-xs text-muted">Sem img</div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <b className="truncate text-sm text-navy">{item.title}</b>
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold uppercase text-muted">{item.content_type}</span>
                {!item.is_active && <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] font-bold text-destructive">Inativo</span>}
              </div>
              <p className="text-xs text-muted">Ordem: {item.display_order} | Público: {item.audience}</p>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => handleMove(item, -1)} className="rounded p-1 text-muted hover:bg-muted" aria-label="Mover para cima"><ChevronUp className="h-4 w-4" /></button>
              <button onClick={() => handleMove(item, 1)} className="rounded p-1 text-muted hover:bg-muted" aria-label="Mover para baixo"><ChevronDown className="h-4 w-4" /></button>
              <button onClick={() => handleToggle(item)} className="rounded p-1 text-muted hover:bg-muted" aria-label={item.is_active ? "Desativar" : "Ativar"}>
                {item.is_active ? <ExternalLink className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
              <button onClick={() => startEdit(item)} className="rounded p-1 text-muted hover:bg-muted" aria-label="Editar"><ImageIcon className="h-4 w-4" /></button>
              <button onClick={() => handleDelete(item)} className="rounded p-1 text-destructive hover:bg-destructive/10" aria-label="Excluir"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";