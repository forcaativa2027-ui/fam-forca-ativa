"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { memberSchema, type MemberInput } from "@/schemas";
import { useAllMembers, useCells } from "@/hooks/use-queries";
import { supabase } from "@/lib/supabase/client";
import { createMember, updateMember, deleteMember } from "@/services/members";
import { logAudit } from "@/services/audit";
import type { Member } from "@/types/domain";

const STAGES: [Member["journey_stage"], string][] = [
  ["visitante","Visitante"],["novo_convertido","Novo convertido"],["consolidacao","Consolidação"],
  ["discipulado","Discipulado"],["batismo","Batismo"],["membro_ativo","Membro ativo"],
  ["servo","Servo"],["lider_formacao","Líder em formação"],["lider","Líder"],
  ["supervisor","Supervisor"],["missionario","Missionário"],
];

export function MembersAdmin() {
  const { data: members = [] } = useAllMembers();
  const { data: cells = [] } = useCells();
  const qc = useQueryClient();
  const [err, setErr] = useState("");
  const [editing, setEditing] = useState<Member | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<MemberInput>({
      resolver: zodResolver(memberSchema),
      defaultValues: { journey_stage: "visitante" },
    });

  function startEdit(m: Member) {
    setEditing(m); setErr("");
    reset({
      full_name: m.full_name, email: m.email ?? "", phone: m.phone ?? "",
      birth_date: m.birth_date ?? "", life_group_id: m.life_group_id,
      journey_stage: m.journey_stage,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function cancelEdit() { setEditing(null); reset({ journey_stage: "visitante" }); }

  async function onSubmit(v: MemberInput) {
    setErr("");
    // Inferir church_id pela célula
    let church_id: string | null | undefined;
    if (v.life_group_id) {
      const cell = cells.find((c) => c.id === v.life_group_id);
      church_id = cell?.church_id ?? undefined;
    }
    try {
      const payload: Partial<Member> = {
        full_name: v.full_name,
        email: v.email || null,
        phone: v.phone || null,
        birth_date: v.birth_date || null,
        life_group_id: v.life_group_id || null,
        journey_stage: v.journey_stage,
        ...(church_id !== undefined ? { church_id } : {}),
      };
      if (editing) {
        await updateMember(supabase, editing.id, payload);
        await logAudit(supabase, "update", "members", editing.id, { name: v.full_name });
      } else {
        const created = await createMember(supabase, payload);
        await logAudit(supabase, "insert", "members", created.id, { name: v.full_name });
      }
      cancelEdit();
      qc.invalidateQueries({ queryKey: ["all-members"] });
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Erro ao salvar");
    }
  }
  async function remove(m: Member) {
    if (!confirm(`Remover ${m.full_name}?`)) return;
    try {
      await deleteMember(supabase, m.id);
      await logAudit(supabase, "delete", "members", m.id, { name: m.full_name });
      qc.invalidateQueries({ queryKey: ["all-members"] });
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Erro ao remover");
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{editing ? "Editar membro" : "Cadastrar membro"}</CardTitle>
              <CardDescription>{editing ? `Alterando ${editing.full_name}` : "Adicione uma pessoa ao sistema"}</CardDescription>
            </div>
            {editing && (
              <Button onClick={cancelEdit} variant="ghost" size="sm" className="gap-1"><X className="h-3.5 w-3.5" />Cancelar</Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <Field label="Nome completo" error={errors.full_name?.message}>
              <Input {...register("full_name")} placeholder="Maria Silva" />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="E-mail" error={errors.email?.message}>
                <Input type="email" {...register("email")} placeholder="maria@email.com" />
              </Field>
              <Field label="Telefone"><Input {...register("phone")} placeholder="(00) 00000-0000" /></Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Data de nascimento" error={errors.birth_date?.message}>
                <Input type="date" {...register("birth_date")} />
              </Field>
              <Field label="Célula">
                <select {...register("life_group_id")} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                  <option value="">— Sem célula —</option>
                  {cells.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Etapa da jornada">
              <select {...register("journey_stage")} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                {STAGES.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </Field>
            {err && <p className="text-sm text-destructive">{err}</p>}
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              <Plus className="h-4 w-4" />{editing ? "Salvar alterações" : "Cadastrar membro"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <h3 className="font-display text-lg text-navy">Membros cadastrados ({members.length})</h3>
      <div className="space-y-2">
        {members.length === 0 && <p className="text-sm italic text-muted">Nenhum membro cadastrado ainda.</p>}
        {members.map((m) => {
          const cell = cells.find((c) => c.id === m.life_group_id);
          return (
            <div key={m.id} className="flex items-center gap-3 rounded-xl border bg-card p-3">
              <div className="flex-1">
                <b className="text-navy">{m.full_name}</b>
                <p className="text-xs text-muted">
                  {STAGES.find(([s]) => s === m.journey_stage)?.[1] ?? m.journey_stage}
                  {cell ? ` · ${cell.name}` : ""}
                  {m.phone ? ` · ${m.phone}` : ""}
                </p>
              </div>
              <Button onClick={() => startEdit(m)} variant="outline" size="sm" className="gap-1"><Pencil className="h-3.5 w-3.5" /></Button>
              <Button onClick={() => remove(m)} variant="destructive" size="sm"><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          );
        })}
      </div>
    </div>
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
