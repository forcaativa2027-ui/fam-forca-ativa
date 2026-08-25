"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, FileDown, Pencil, Plus, Trash2, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/shared/DatePicker";
import { sermonSchema, type SermonInput } from "@/schemas";
import { useSermons, useChurches } from "@/hooks/use-queries";
import { supabase } from "@/lib/supabase/client";
import { youtubeThumb } from "@/services/content";
import { logAudit, diffFields } from "@/services/audit";
import type { Sermon } from "@/types/domain";
import { Field } from "./PanelHelpers";

export function SermonsAdmin() {
  const { data: sermons = [] } = useSermons();
  const { data: churches = [] } = useChurches();
  const qc = useQueryClient();
  const [err, setErr] = useState("");
  const [editing, setEditing] = useState<Sermon | null>(null);
  const [churchId, setChurchId] = useState<string>("");
  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } =
    useForm<SermonInput>({ resolver: zodResolver(sermonSchema), defaultValues: { is_featured: false, published_at: new Date().toISOString().slice(0, 10) } });
  const urlWatch = watch("youtube_url");

  function startEdit(s: Sermon) {
    setEditing(s); setErr(""); setChurchId(s.church_id ?? "");
    reset({
      title: s.title, youtube_url: s.youtube_url, reference: s.reference ?? "", speaker: s.speaker ?? "",
      category: s.category ?? "", duration: s.duration ?? "", description: s.description ?? "", pdf_url: s.pdf_url ?? "",
      published_at: s.published_at ? s.published_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
      is_featured: s.is_featured,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function cancelEdit() { setEditing(null); setChurchId(""); reset({ is_featured: false, published_at: new Date().toISOString().slice(0, 10) }); }

  async function onSubmit(v: SermonInput) {
    setErr("");
    const payload = {
      title: v.title, youtube_url: v.youtube_url, reference: v.reference || null, speaker: v.speaker || null,
      category: v.category || null, duration: v.duration || null,
      description: v.description || null, pdf_url: v.pdf_url || null,
      church_id: churchId || null,
      published_at: v.published_at ? new Date(v.published_at).toISOString() : new Date().toISOString(),
      is_featured: v.is_featured,
      thumbnail_url: youtubeThumb(v.youtube_url),
    };
    if (editing) {
      const { error } = await supabase.from("sermons").update(payload).eq("id", editing.id);
      if (error) { setErr(error.message); return; }
      const diff = diffFields(editing as unknown as Record<string, unknown>, payload);
      await logAudit(supabase, "update", "sermons", editing.id, {}, diff ?? undefined);
      setEditing(null);
    } else {
      const next_order = sermons.length > 0 ? Math.max(...sermons.map((s) => s.sort_order)) + 1 : 0;
      const { data, error } = await supabase.from("sermons").insert({ ...payload, sort_order: next_order }).select().single();
      if (error) { setErr(error.message); return; }
      await logAudit(supabase, "insert", "sermons", data.id, {}, { after: data as unknown as Record<string, unknown> });
    }
    reset({ is_featured: false, published_at: new Date().toISOString().slice(0, 10) });
    setChurchId("");
    qc.invalidateQueries({ queryKey: ["sermons"] });
    qc.invalidateQueries({ queryKey: ["public-sermons"] });
  }
  async function remove(s: Sermon) {
    if (!confirm("Remover esta pregação?")) return;
    const { error } = await supabase.from("sermons").delete().eq("id", s.id);
    if (!error) {
      await logAudit(supabase, "delete", "sermons", s.id, {}, { before: s as unknown as Record<string, unknown> });
      qc.invalidateQueries({ queryKey: ["sermons"] });
      qc.invalidateQueries({ queryKey: ["public-sermons"] });
    }
  }
  async function move(s: Sermon, sortedList: Sermon[], dir: "up" | "down") {
    const idx = sortedList.findIndex((x) => x.id === s.id);
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sortedList.length) return;
    const a = sortedList[idx], b = sortedList[swapIdx];
    const { error: e1 } = await supabase.from("sermons").update({ sort_order: b.sort_order }).eq("id", a.id);
    const { error: e2 } = await supabase.from("sermons").update({ sort_order: a.sort_order }).eq("id", b.id);
    if (!e1 && !e2) {
      qc.invalidateQueries({ queryKey: ["sermons"] });
      qc.invalidateQueries({ queryKey: ["public-sermons"] });
    }
  }

  const sorted = [...sermons].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{editing ? "Editar pregação" : "Adicionar pregação (YouTube)"}</CardTitle>
            {editing && <Button onClick={cancelEdit} variant="ghost" size="sm" className="gap-1"><X className="h-3.5 w-3.5" />Cancelar</Button>}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <Field label="Título" error={errors.title?.message}><Input {...register("title")} placeholder="Ex: O Bezerro de Ouro" /></Field>
            <Field label="Link do YouTube" error={errors.youtube_url?.message}><Input {...register("youtube_url")} placeholder="https://youtube.com/watch?v=..." /></Field>
            <div className="grid gap-3 sm:grid-cols-4">
              <Field label="Referência"><Input {...register("reference")} placeholder="Ex 32:1-14" /></Field>
              <Field label="Pregador"><Input {...register("speaker")} placeholder="Pra. Anne" /></Field>
              <Field label="Categoria"><Input {...register("category")} placeholder="Série" /></Field>
              <Field label="Duração"><Input {...register("duration")} placeholder="Ex: 42:15" /></Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Data da pregação"><DatePicker value={watch("published_at") ?? ""} onChange={(v) => setValue("published_at", v)} placeholder="Data da pregação" /></Field>
              <Field label="Igreja">
                <select value={churchId} onChange={(e) => setChurchId(e.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                  <option value="">— Todas / Nacional —</option>
                  {churches.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Tema / Descrição (aparece pro usuário)">
              <textarea {...register("description")} rows={3} className="w-full rounded-md border bg-background p-3 text-sm" placeholder="Contexto, tema, resumo da mensagem…" />
            </Field>
            <Field label="Link do PDF da palavra (opcional)"><Input {...register("pdf_url")} placeholder="https://..." /></Field>
            {urlWatch && youtubeThumb(urlWatch) && <img src={youtubeThumb(urlWatch)!} alt="" className="h-24 rounded-md border" />}
            {err && <p className="text-sm text-destructive">{err}</p>}
            <Button type="submit" disabled={isSubmitting} className="gap-2"><Plus className="h-4 w-4" /> {editing ? "Salvar alterações" : "Adicionar pregação"}</Button>
          </form>
        </CardContent>
      </Card>
      <h3 className="font-display text-lg text-navy">Pregações publicadas ({sermons.length})</h3>
      <div className="space-y-3">
        {sorted.map((s, idx) => (
          <div key={s.id} className="flex items-center gap-3 rounded-xl border bg-card p-3">
            <div className="flex flex-col gap-0.5">
              <button onClick={() => move(s, sorted, "up")} disabled={idx === 0} className="text-muted-foreground hover:text-navy disabled:opacity-30"><ChevronUp className="h-4 w-4" /></button>
              <button onClick={() => move(s, sorted, "down")} disabled={idx === sorted.length - 1} className="text-muted-foreground hover:text-navy disabled:opacity-30"><ChevronDown className="h-4 w-4" /></button>
            </div>
            <img src={s.thumbnail_url || youtubeThumb(s.youtube_url) || ""} alt="" className="h-14 w-24 rounded object-cover" />
            <div className="flex-1">
              <b className="text-navy">{s.title}</b>
              <p className="text-xs text-muted">{[s.reference, s.speaker, s.category, churches.find((c) => c.id === s.church_id)?.name].filter(Boolean).join(" · ")}</p>
              <p className="text-[11px] text-muted-foreground">Pregado em {new Date(s.published_at).toLocaleDateString("pt-BR")}</p>
            </div>
            <Button asChild variant="outline" size="sm"><a href={s.youtube_url} target="_blank" rel="noreferrer">Abrir</a></Button>
            {s.pdf_url && (
              <Button asChild variant="outline" size="sm" title="Baixar PDF da palavra"><a href={s.pdf_url} target="_blank" rel="noreferrer"><FileDown className="h-3.5 w-3.5" /></a></Button>
            )}
            <Button onClick={() => startEdit(s)} variant="outline" size="sm"><Pencil className="h-3.5 w-3.5" /></Button>
            <Button onClick={() => remove(s)} variant="destructive" size="sm"><Trash2 className="h-3.5 w-3.5" /></Button>
          </div>
        ))}
      </div>
    </div>
  );
}
