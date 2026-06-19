"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Pencil, X, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cellSchema, type CellInput } from "@/schemas";
import { useCells, useSectors, useAllMembers } from "@/hooks/use-queries";
import { supabase } from "@/lib/supabase/client";
import { createCell, updateCell, deleteCell } from "@/services/cells";
import { logAudit } from "@/services/audit";
import type { Cell } from "@/types/domain";

const WEEKDAYS: [string, string][] = [
  ["domingo","Domingo"],["segunda","Segunda"],["terca","Terça"],
  ["quarta","Quarta"],["quinta","Quinta"],["sexta","Sexta"],["sabado","Sábado"],
];

export function CellsAdmin() {
  const { data: cells = [] } = useCells();
  const { data: sectors = [] } = useSectors();
  const { data: members = [] } = useAllMembers();
  const qc = useQueryClient();
  const [err, setErr] = useState("");
  const [editing, setEditing] = useState<Cell | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<CellInput>({ resolver: zodResolver(cellSchema) });

  function startEdit(c: Cell) {
    setEditing(c); setErr("");
    reset({
      name: c.name,
      sector_id: c.sector_id ?? "",
      address: c.address ?? "",
      state: c.state ?? "",
      city: c.city ?? "",
      neighborhood: c.neighborhood ?? "",
      meeting_weekday: c.meeting_weekday,
      meeting_time: c.meeting_time ? c.meeting_time.slice(0,5) : "",
      leader_id: null,
      host_id: null,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function cancelEdit() { setEditing(null); reset(); }

  async function onSubmit(v: CellInput) {
    setErr("");
    try {
      const payload: Partial<Cell> = {
        name: v.name,
        sector_id: v.sector_id,
        address: v.address || null,
        state: v.state || null,
        city: v.city || null,
        neighborhood: v.neighborhood || null,
        meeting_weekday: v.meeting_weekday ?? null,
        meeting_time: v.meeting_time || null,
      };
      if (editing) {
        await updateCell(supabase, editing.id, payload);
        await logAudit(supabase, "update", "life_groups", editing.id, { name: v.name });
      } else {
        const created = await createCell(supabase, payload);
        await logAudit(supabase, "insert", "life_groups", created.id, { name: v.name });
      }
      cancelEdit();
      qc.invalidateQueries({ queryKey: ["cells"] });
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Erro ao salvar");
    }
  }
  async function remove(c: Cell) {
    if (!confirm(`Remover célula "${c.name}"?\n\nMembros vinculados ficarão sem célula.`)) return;
    try {
      await deleteCell(supabase, c.id);
      await logAudit(supabase, "delete", "life_groups", c.id, { name: c.name });
      qc.invalidateQueries({ queryKey: ["cells"] });
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Erro ao remover");
    }
  }

  // Agrupa por setor
  const bySector = sectors.map((s) => ({
    sector: s,
    cells: cells.filter((c) => c.sector_id === s.id),
  }));
  const orphans = cells.filter((c) => !c.sector_id);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{editing ? "Editar célula" : "Cadastrar célula"}</CardTitle>
              <CardDescription>{editing ? `Alterando ${editing.name}` : "Vincule a um setor existente"}</CardDescription>
            </div>
            {editing && <Button onClick={cancelEdit} variant="ghost" size="sm" className="gap-1"><X className="h-3.5 w-3.5" />Cancelar</Button>}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <Field label="Nome da célula" error={errors.name?.message}>
              <Input {...register("name")} placeholder="Ex: Vida Nova" />
            </Field>
            <Field label="Setor" error={errors.sector_id?.message}>
              <select {...register("sector_id")} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                <option value="">— Selecione um setor —</option>
                {sectors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Dia da semana">
                <select {...register("meeting_weekday")} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                  <option value="">— Selecione —</option>
                  {WEEKDAYS.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </Field>
              <Field label="Horário (HH:MM)" error={errors.meeting_time?.message}>
                <Input type="time" {...register("meeting_time")} />
              </Field>
            </div>
            <Field label="Endereço" error={errors.address?.message}>
              <Input {...register("address")} placeholder="Rua, número, complemento" />
            </Field>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Estado" error={errors.state?.message}>
                <Input {...register("state")} placeholder="Ex: AM" maxLength={3} />
              </Field>
              <Field label="Cidade" error={errors.city?.message}>
                <Input {...register("city")} placeholder="Ex: Manaus" />
              </Field>
              <Field label="Bairro" error={errors.neighborhood?.message}>
                <Input {...register("neighborhood")} placeholder="Ex: Praça 14" />
              </Field>
            </div>
            {err && <p className="text-sm text-destructive">{err}</p>}
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              <Plus className="h-4 w-4" />{editing ? "Salvar alterações" : "Cadastrar célula"}
            </Button>
            <p className="text-xs text-muted">
              Dica: <b>{members.length}</b> membro(s) já cadastrado(s) podem ser vinculados na aba "Membros".
            </p>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {bySector.map(({ sector, cells: sectorCells }) => (
          <div key={sector.id}>
            <h3 className="mb-2 font-display text-lg text-navy">{sector.name} <span className="text-sm text-muted">({sectorCells.length} célula(s))</span></h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {sectorCells.length === 0 && <p className="text-sm italic text-muted">Nenhuma célula neste setor.</p>}
              {sectorCells.map((c) => <CellCard key={c.id} cell={c} onEdit={startEdit} onRemove={remove} />)}
            </div>
          </div>
        ))}

        {orphans.length > 0 && (
          <div>
            <h3 className="mb-2 font-display text-lg text-yellow-700">Sem setor ({orphans.length})</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {orphans.map((c) => <CellCard key={c.id} cell={c} onEdit={startEdit} onRemove={remove} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CellCard({ cell: c, onEdit, onRemove }: { cell: Cell; onEdit: (c: Cell) => void; onRemove: (c: Cell) => void }) {
  return (
    <Card className="border-l-4 border-l-gold">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <b className="block truncate text-navy">{c.name}</b>
            {c.meeting_weekday && c.meeting_time && (
              <p className="mt-1 flex items-center gap-1 text-xs text-muted"><Clock className="h-3 w-3" />{WEEKDAYS.find(([v])=>v===c.meeting_weekday)?.[1]} às {c.meeting_time.slice(0,5)}</p>
            )}
            {c.address && <p className="mt-1 flex items-start gap-1 text-xs text-muted"><MapPin className="mt-0.5 h-3 w-3 shrink-0" />{c.address}</p>}
          </div>
          <div className="flex gap-1">
            <Button onClick={() => onEdit(c)} variant="outline" size="sm"><Pencil className="h-3.5 w-3.5" /></Button>
            <Button onClick={() => onRemove(c)} variant="destructive" size="sm"><Trash2 className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>{children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
