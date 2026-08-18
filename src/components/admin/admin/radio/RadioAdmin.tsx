"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Pencil, X, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { radioProgramSchema, type RadioProgramInput } from "@/schemas/radioProgramSchema";
import { useAllRadioPrograms, useMyProfile } from "@/hooks/use-queries";
import { supabase } from "@/lib/supabase/client";
import { createRadioProgram, updateRadioProgram, deleteRadioProgram } from "@/services/radio";
import type { RadioProgram, Weekday } from "@/types/domain";

const WEEKDAYS: { value: Weekday; label: string }[] = [
  { value: "domingo", label: "Domingo" },
  { value: "segunda", label: "Segunda-feira" },
  { value: "terca", label: "Terça-feira" },
  { value: "quarta", label: "Quarta-feira" },
  { value: "quinta", label: "Quinta-feira" },
  { value: "sexta", label: "Sexta-feira" },
  { value: "sabado", label: "Sábado" },
];

export function RadioAdmin() {
  const { data: programs = [] } = useAllRadioPrograms();
  const { data: myProfile } = useMyProfile();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<RadioProgram | null>(null);
  const [err, setErr] = useState("");
  const [formOpen, setFormOpen] = useState(false);

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } =
    useForm<RadioProgramInput>({
      resolver: zodResolver(radioProgramSchema),
      defaultValues: { title: "", is_recurring: true, is_active: true, sort_order: 0 },
    });

  function startEdit(p: RadioProgram) {
    setEditing(p);
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
    setFormOpen(false);
    setErr("");
    reset({ title: "", is_recurring: true, is_active: true, sort_order: 0 });
  }

  async function onSubmit(v: RadioProgramInput) {
    setErr("");
    try {
      const churchId = myProfile?.church_id ?? "";
      if (editing) {
        await updateRadioProgram(supabase, editing.id, v);
      } else {
        const nextOrder = programs.length > 0 ? Math.max(...programs.map((p) => p.sort_order)) + 1 : 0;
        await createRadioProgram(supabase, churchId, { ...v, sort_order: nextOrder });
      }
      cancelEdit();
      qc.invalidateQueries({ queryKey: ["all-radio-programs"] });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro ao salvar";
      setErr(msg);
    }
  }

  async function remove(p: RadioProgram) {
    if (!confirm(`Apagar programa "${p.title}"?`)) return;
    try {
      await deleteRadioProgram(supabase, p.id);
      qc.invalidateQueries({ queryKey: ["all-radio-programs"] });
    } catch (e: unknown) { alert(e instanceof Error ? e.message : "Erro"); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <Button onClick={() => { setErr(""); setFormOpen(true); }} className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Adicionar Programa
        </Button>
      </div>

      <Card className="rounded-xl border border-border p-6">
        <CardHeader>
          <CardTitle>Programação da Rádio Web</CardTitle>
          <CardDescription>Gerenciar programas da grade de programação</CardDescription>
        </CardHeader>
        <CardContent>
          {err && <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{err}</p>}
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
                <Button size="ghost" className="p-1 rounded" onClick={() => startEdit(p)} title="Editar">
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button size="ghost" className="p-1 rounded text-destructive" onClick={() => remove(p)} title="Excluir">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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
    </div>
  );
}