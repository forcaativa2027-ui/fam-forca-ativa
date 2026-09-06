"use client";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Pencil, X, ChevronUp, ChevronDown, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAllCarouselItems } from "@/hooks/use-queries";
import { supabase } from "@/lib/supabase/client";
import { createCarouselItem, updateCarouselItem, deleteCarouselItem, logCarouselAudit } from "@/services/carousel";
import type { CarouselItem, CarouselContentType, CarouselActionType, CarouselAudience } from "@/types/domain";

const CONTENT_TYPES: { value: CarouselContentType; label: string }[] = [
  { value: "banner", label: "Banner" },
  { value: "video", label: "Video" },
  { value: "noticia", label: "Noticia" },
  { value: "informativo", label: "Informativo" },
  { value: "evento", label: "Evento" },
  { value: "campanha", label: "Campanha" },
  { value: "outro", label: "Outro" },
];
const ACTION_TYPES: { value: CarouselActionType; label: string }[] = [
  { value: "nenhum", label: "Nenhuma" },
  { value: "interno", label: "Pagina interna" },
  { value: "externo", label: "Link externo" },
  { value: "noticia", label: "Noticia" },
  { value: "evento", label: "Evento" },
  { value: "video", label: "Video" },
  { value: "servico", label: "Servico" },
  { value: "fale_fam", label: "Fale com a FAM" },
  { value: "direitos", label: "Conheca seus direitos" },
];
const AUDIENCES: { value: CarouselAudience; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "nao_autenticados", label: "Nao autenticados" },
  { value: "cadastrados", label: "Cadastrados" },
  { value: "membros_ativos", label: "Membros ativos" },
  { value: "membros_inativos", label: "Membros inativos" },
];

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

type FormState = {
  title: string; description: string; content_type: CarouselContentType;
  image_url: string; video_url: string; cover_url: string;
  button_label: string; action_type: CarouselActionType; action_url: string;
  display_order: number; audience: CarouselAudience;
  starts_at: string; ends_at: string; is_active: boolean;
};

const EMPTY_FORM: FormState = {
  title: "", description: "", content_type: "banner",
  image_url: "", video_url: "", cover_url: "",
  button_label: "", action_type: "nenhum", action_url: "",
  display_order: 0, audience: "todos",
  starts_at: "", ends_at: "", is_active: true,
};

export function CarouselAdmin() {
  const { data: items = [] } = useAllCarouselItems();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<CarouselItem | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  function startCreate() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, display_order: items.length });
    setErr("");
  }

  function startEdit(item: CarouselItem) {
    setEditing(item);
    setForm({
      title: item.title, description: item.description ?? "",
      content_type: item.content_type,
      image_url: item.image_url ?? "", video_url: item.video_url ?? "",
      cover_url: item.cover_url ?? "",
      button_label: item.button_label ?? "", action_type: item.action_type,
      action_url: item.action_url ?? "",
      display_order: item.display_order, audience: item.audience,
      starts_at: fromIsoToLocal(item.starts_at), ends_at: fromIsoToLocal(item.ends_at),
      is_active: item.is_active,
    });
    setErr("");
  }

  function cancel() { setEditing(null); setForm(EMPTY_FORM); setErr(""); }

  async function handleSave() {
    setErr(""); setBusy(true);
    try {
      if (!form.title.trim()) { setErr("Titulo e obrigatorio"); setBusy(false); return; }

      const payload = {
        title: form.title.trim(), description: form.description.trim() || null,
        content_type: form.content_type,
        image_url: form.image_url.trim() || null,
        video_url: form.video_url.trim() || null,
        cover_url: form.cover_url.trim() || null,
        button_label: form.button_label.trim() || null,
        action_type: form.action_type,
        action_url: form.action_url.trim() || null,
        display_order: form.display_order,
        audience: form.audience,
        starts_at: toIsoOrNull(form.starts_at), ends_at: toIsoOrNull(form.ends_at),
        is_active: form.is_active,
      };

      if (editing) {
        await updateCarouselItem(supabase, editing.id, payload);
        await logCarouselAudit(supabase, "CARROSSEL_EDITADO", editing.id, form.title);
      } else {
        const created = await createCarouselItem(supabase, payload);
        await logCarouselAudit(supabase, "CARROSSEL_CRIADO", created.id, form.title);
      }
      cancel();
      qc.invalidateQueries({ queryKey: ["all-carousel-items"] });
      qc.invalidateQueries({ queryKey: ["active-carousel-items"] });
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Erro ao salvar");
    } finally { setBusy(false); }
  }

  async function handleDelete(item: CarouselItem) {
    if (!confirm(`Excluir "${item.title}"?`)) return;
    try {
      await deleteCarouselItem(supabase, item.id);
      await logCarouselAudit(supabase, "CARROSSEL_REMOVIDO", item.id, item.title);
      qc.invalidateQueries({ queryKey: ["all-carousel-items"] });
      qc.invalidateQueries({ queryKey: ["active-carousel-items"] });
      if (editing?.id === item.id) cancel();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Erro ao excluir");
    }
  }

  async function handleToggle(item: CarouselItem) {
    try {
      await updateCarouselItem(supabase, item.id, { is_active: !item.is_active });
      await logCarouselAudit(supabase, item.is_active ? "CARROSSEL_DESATIVADO" : "CARROSSEL_ATIVADO", item.id, item.title);
      qc.invalidateQueries({ queryKey: ["all-carousel-items"] });
      qc.invalidateQueries({ queryKey: ["active-carousel-items"] });
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Erro ao alterar status");
    }
  }

  async function handleMove(item: CarouselItem, dir: -1 | 1) {
    const newOrder = item.display_order + dir;
    if (newOrder < 0) return;
    try {
      await updateCarouselItem(supabase, item.id, { display_order: newOrder });
      await logCarouselAudit(supabase, "CARROSSEL_REORDENADO", item.id, item.title, { new_order: newOrder });
      qc.invalidateQueries({ queryKey: ["all-carousel-items"] });
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Erro ao reordenar");
    }
  }

  const isEditing = editing !== null || form.title !== "";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-navy">Carrossel Institucional</h2>
          <p className="text-sm text-muted">Gerencie os conteudos exibidos no carrossel da pagina inicial.</p>
        </div>
        <Button onClick={startCreate} className="gap-1"><Plus className="h-4 w-4" /> Adicionar</Button>
      </div>

      {err && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{err}</p>}

      {/* Formulario */}
      {isEditing && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{editing ? "Editar Item" : "Novo Item"}</CardTitle>
              <Button variant="ghost" size="sm" onClick={cancel}><X className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Titulo *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Tipo *</Label>
                <select value={form.content_type} onChange={(e) => setForm({ ...form, content_type: e.target.value as CarouselContentType })}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                  {CONTENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Descricao</Label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm" rows={2} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>URL da Imagem</Label>
                <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." />
              </div>
              <div className="space-y-1">
                <Label>URL do Video</Label>
                <Input value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} placeholder="https://youtube.com/..." />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Capa do Video</Label>
                <Input value={form.cover_url} onChange={(e) => setForm({ ...form, cover_url: e.target.value })} placeholder="https://..." />
              </div>
              <div className="space-y-1">
                <Label>Texto do Botao</Label>
                <Input value={form.button_label} onChange={(e) => setForm({ ...form, button_label: e.target.value })} placeholder="Saiba mais" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1">
                <Label>Acao</Label>
                <select value={form.action_type} onChange={(e) => setForm({ ...form, action_type: e.target.value as CarouselActionType })}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                  {ACTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label>URL de Destino</Label>
                <Input value={form.action_url} onChange={(e) => setForm({ ...form, action_url: e.target.value })} placeholder="https://..." />
              </div>
              <div className="space-y-1">
                <Label>Ordem</Label>
                <Input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1">
                <Label>Publico</Label>
                <select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value as CarouselAudience })}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                  {AUDIENCES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Data Inicio</Label>
                <Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Data Fim</Label>
                <Input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="carousel-active" checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="h-4 w-4 rounded border-input" />
              <Label htmlFor="carousel-active">Ativo</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={cancel}>Cancelar</Button>
              <Button onClick={handleSave} disabled={busy}>{busy ? "Salvando..." : "Salvar"}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista */}
      <div className="space-y-2">
        {items.length === 0 && (
          <p className="py-8 text-center text-sm italic text-muted">Nenhum item no carrossel. Clique em "Adicionar" para criar o primeiro.</p>
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
              <p className="text-xs text-muted">Ordem: {item.display_order} | Publico: {item.audience}</p>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => handleMove(item, -1)} className="rounded p-1 text-muted hover:bg-muted" aria-label="Mover para cima"><ChevronUp className="h-4 w-4" /></button>
              <button onClick={() => handleMove(item, 1)} className="rounded p-1 text-muted hover:bg-muted" aria-label="Mover para baixo"><ChevronDown className="h-4 w-4" /></button>
              <button onClick={() => handleToggle(item)} className="rounded p-1 text-muted hover:bg-muted" aria-label={item.is_active ? "Desativar" : "Ativar"}>
                {item.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              <button onClick={() => startEdit(item)} className="rounded p-1 text-muted hover:bg-muted" aria-label="Editar"><Pencil className="h-4 w-4" /></button>
              <button onClick={() => handleDelete(item)} className="rounded p-1 text-destructive hover:bg-destructive/10" aria-label="Excluir"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
