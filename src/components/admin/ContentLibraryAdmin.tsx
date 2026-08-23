"use client";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, X, Image as ImageIcon, Video, FileText, Library } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useContentLibrary, useChurches } from "@/hooks/use-queries";
import { supabase } from "@/lib/supabase/client";
import { createContentLibraryItem, deleteContentLibraryItem } from "@/services/contentLibrary";
import { logAudit } from "@/services/audit";
import { youtubeThumbnailUrl, isValidYoutubeUrl } from "@/lib/youtube";
import type { ContentLibraryType } from "@/types/domain";

const TYPE_LABELS: Record<ContentLibraryType, string> = {
  imagem: "Imagem", video_youtube: "Vídeo (YouTube)", documento: "Documento", logo: "Logo", outro: "Outro",
};
const TYPE_ICONS: Record<ContentLibraryType, React.ReactNode> = {
  imagem: <ImageIcon className="h-4 w-4" />, video_youtube: <Video className="h-4 w-4" />,
  documento: <FileText className="h-4 w-4" />, logo: <ImageIcon className="h-4 w-4" />, outro: <FileText className="h-4 w-4" />,
};

export function ContentLibraryAdmin() {
  const qc = useQueryClient();
  const { data: items = [] } = useContentLibrary();
  const [open, setOpen] = useState(false);
  const [filterType, setFilterType] = useState<"todos" | ContentLibraryType>("todos");

  async function remove(id: string, title: string) {
    if (!confirm(`Remover "${title}" da biblioteca? Isso não apaga onde o link já foi usado, só remove daqui.`)) return;
    await deleteContentLibraryItem(supabase, id);
    await logAudit(supabase, "delete", "content_library", id, { title });
    qc.invalidateQueries({ queryKey: ["content-library"] });
  }

  const filtered = filterType === "todos" ? items : items.filter((i) => i.type === filterType);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Library className="h-5 w-5 text-gold" />Biblioteca de Arquivos</CardTitle>
            <CardDescription>
              Repositório de links reutilizáveis — imagens, vídeos do YouTube e documentos.
              Ainda não é upload de arquivo de verdade, é uma lista organizada de links pra não perder/repetir.
            </CardDescription>
          </div>
          <Button onClick={() => setOpen(true)} className="gap-1.5"><Plus size={16} /> Adicionar</Button>
        </CardHeader>
        <CardContent>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {(["todos", "imagem", "video_youtube", "documento", "logo", "outro"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${filterType === t ? "bg-navy text-white border-navy" : "bg-card"}`}
              >
                {t === "todos" ? "Todos" : TYPE_LABELS[t]}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm italic text-muted-foreground">Nada aqui ainda.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((item) => {
                const thumb = item.type === "video_youtube" ? youtubeThumbnailUrl(item.url) : item.type === "imagem" || item.type === "logo" ? item.url : null;
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
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-navy underline">Abrir link</a>
                        <Button size="sm" variant="ghost" onClick={() => remove(item.id, item.title)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {open && <NewItemDialog onClose={() => setOpen(false)} />}
    </div>
  );
}

function NewItemDialog({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const { data: churches = [] } = useChurches();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<ContentLibraryType>("imagem");
  const [url, setUrl] = useState("");
  const [tags, setTags] = useState("");
  const [churchId, setChurchId] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function save() {
    if (!title.trim()) { setErr("Dê um título/nome pro item."); return; }
    if (!url.trim()) { setErr("Cole o link."); return; }
    if (type === "video_youtube" && !isValidYoutubeUrl(url)) { setErr("Esse link não parece ser do YouTube."); return; }
    setBusy(true); setErr("");
    try {
      await createContentLibraryItem(supabase, {
        title: title.trim(), type, url: url.trim(),
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        church_id: churchId || null,
      });
      qc.invalidateQueries({ queryKey: ["content-library"] });
      onClose();
    } catch (e) {
      setErr((e as { message?: string })?.message ?? "Erro ao salvar");
    } finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Adicionar à biblioteca</CardTitle>
          <Button onClick={onClose} variant="ghost" size="sm"><X className="h-4 w-4" /></Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Tipo</Label>
            <select value={type} onChange={(e) => setType(e.target.value as ContentLibraryType)} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
              {(Object.keys(TYPE_LABELS) as ContentLibraryType[]).map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
            </select>
          </div>
          <div>
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Banner Congresso 2026" />
          </div>
          <div>
            <Label>{type === "video_youtube" ? "Link do YouTube" : "URL"}</Label>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder={type === "video_youtube" ? "https://www.youtube.com/watch?v=…" : "https://…"} />
          </div>
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
          <Button onClick={save} disabled={busy} className="w-full">{busy ? "Salvando…" : "Adicionar"}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
