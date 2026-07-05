"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Pencil, X, Megaphone, Search, UserPlus, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { evangelismGroupSchema, type EvangelismGroupInput } from "@/schemas";
import { useEvangelismGroups, useCells, useAllMembers, useEvangelismParticipants } from "@/hooks/use-queries";
import { supabase } from "@/lib/supabase/client";
import * as Eg from "@/services/evangelismGroups";
import * as Pp from "@/services/pipeline";
import { logAudit } from "@/services/audit";
import type { EvangelismGroup } from "@/types/domain";
import { STAGE_LABELS, STAGE_COLORS } from "./CrmPipelineAdmin";

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>{children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

const WEEKDAYS: [string, string][] = [
  ["domingo","Domingo"],["segunda","Segunda"],["terca","Terça"],
  ["quarta","Quarta"],["quinta","Quinta"],["sexta","Sexta"],["sabado","Sábado"],
];

/**
 * Grupo de Evangelismo (ADR-001 / pedido do usuário) — subdivisão de um
 * Life Group. Uma célula pode ter um ou mais grupos, cada um com um ou
 * mais responsáveis (não é um único "líder", é uma lista de pessoas).
 */
export function EvangelismGroupsAdmin() {
  const { data: groups = [] } = useEvangelismGroups();
  const { data: cells = [] } = useCells();
  const { data: members = [] } = useAllMembers();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<EvangelismGroup | null>(null);
  const [selectedLeaders, setSelectedLeaders] = useState<string[]>([]);
  const [err, setErr] = useState("");
  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } =
    useForm<EvangelismGroupInput>({ resolver: zodResolver(evangelismGroupSchema) });

  const cellIdWatch = watch("cell_id");
  const [leaderQuery, setLeaderQuery] = useState("");
  const filteredMembers = leaderQuery.trim().length >= 2
    ? members.filter(m => m.full_name.toLowerCase().includes(leaderQuery.trim().toLowerCase())).slice(0, 8)
    : [];

  function startEdit(g: EvangelismGroup) {
    setEditing(g); setErr("");
    setSelectedLeaders(g.leader_ids ?? []);
    reset({
      name: g.name, cell_id: g.cell_id,
      address: g.address ?? "", neighborhood: g.neighborhood ?? "", city: g.city ?? "", state: g.state ?? "",
      meeting_weekday: g.meeting_weekday, meeting_time: g.meeting_time?.slice(0,5) ?? "",
    });
  }
  function cancelEdit() {
    setEditing(null); setErr(""); setSelectedLeaders([]);
    reset({ name: "", cell_id: "", address: "", neighborhood: "", city: "", state: "", meeting_weekday: null, meeting_time: "" });
  }
  function toggleLeader(memberId: string) {
    setSelectedLeaders(prev => prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]);
  }

  async function onSubmit(v: EvangelismGroupInput) {
    setErr("");
    try {
      if (editing) {
        await Eg.updateEvangelismGroup(supabase, editing.id, v, selectedLeaders);
        await logAudit(supabase, "update", "evangelism_groups", editing.id, { name: v.name });
      } else {
        const created = await Eg.createEvangelismGroup(supabase, v, selectedLeaders);
        await logAudit(supabase, "insert", "evangelism_groups", created.id, { name: v.name });
      }
      cancelEdit();
      qc.invalidateQueries({ queryKey: ["evangelism-groups"] });
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : "Erro ao salvar"); }
  }
  async function remove(g: EvangelismGroup) {
    if (!confirm(`Remover o grupo de evangelismo "${g.name}"?`)) return;
    try {
      await Eg.deleteEvangelismGroup(supabase, g.id);
      await logAudit(supabase, "delete", "evangelism_groups", g.id, { name: g.name });
      qc.invalidateQueries({ queryKey: ["evangelism-groups"] });
    } catch (e: unknown) { alert(e instanceof Error ? e.message : "Erro ao remover"); }
  }

  const byCell = cells.map(c => ({ cell: c, groups: groups.filter(g => g.cell_id === c.id) })).filter(x => x.groups.length > 0 || x.cell.id === cellIdWatch);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><Megaphone className="h-4 w-4" />{editing ? "Editar grupo de evangelismo" : "Cadastrar grupo de evangelismo"}</CardTitle>
              <CardDescription>Uma célula pode ser responsável por um ou mais grupos.</CardDescription>
            </div>
            {editing && <Button onClick={cancelEdit} variant="ghost" size="sm" className="gap-1"><X className="h-3.5 w-3.5" />Cancelar</Button>}
          </div>
        </CardHeader>
        <CardContent>
          {cells.length === 0 ? (
            <p className="text-sm italic text-amber-700">Cadastre ao menos um Life Group primeiro, na aba "Life Groups".</p>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <Field label="Nome do grupo" error={errors.name?.message}>
                <Input {...register("name")} placeholder="Ex: Grupo de Evangelismo — Vila Nova" />
              </Field>
              <Field label="Life Group responsável" error={errors.cell_id?.message}>
                <select {...register("cell_id")} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                  <option value="">— Selecione —</option>
                  {cells.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Bairro"><Input {...register("neighborhood")} /></Field>
                <Field label="Cidade"><Input {...register("city")} /></Field>
              </div>
              <Field label="Endereço"><Input {...register("address")} /></Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Dia da semana">
                  <select {...register("meeting_weekday")} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                    <option value="">— Selecione —</option>
                    {WEEKDAYS.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </Field>
                <Field label="Horário" error={errors.meeting_time?.message}><Input type="time" {...register("meeting_time")} /></Field>
              </div>

              <Field label="Responsáveis — um ou mais membros efetivos da igreja">
                {selectedLeaders.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {selectedLeaders.map(id => (
                      <span key={id} className="flex items-center gap-1 rounded-full bg-navy-50 px-2.5 py-1 text-xs font-medium text-navy">
                        {members.find(m => m.id === id)?.full_name ?? "—"}
                        <button type="button" onClick={() => toggleLeader(id)} className="text-navy-400 hover:text-red-600"><X className="h-3 w-3" /></button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input className="pl-8" value={leaderQuery} onChange={e => setLeaderQuery(e.target.value)} placeholder="Buscar membro pelo nome…" />
                </div>
                {filteredMembers.length > 0 && (
                  <div className="mt-1 rounded-md border max-h-40 overflow-y-auto">
                    {filteredMembers.map(m => (
                      <button
                        key={m.id} type="button"
                        onClick={() => { toggleLeader(m.id); setLeaderQuery(""); }}
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent"
                      >
                        {m.full_name}
                        {selectedLeaders.includes(m.id) && <span className="text-xs text-green-600">já adicionado</span>}
                      </button>
                    ))}
                  </div>
                )}
              </Field>

              {err && <p className="text-sm text-destructive">{err}</p>}
              <Button type="submit" disabled={isSubmitting} className="gap-2">
                {editing ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />} {editing ? "Salvar alterações" : "Cadastrar grupo"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        {groups.length === 0 && <p className="text-sm italic text-muted">Nenhum grupo de evangelismo cadastrado ainda.</p>}
        {byCell.map(({ cell, groups: cellGroups }) => cellGroups.length > 0 && (
          <div key={cell.id}>
            <h4 className="mb-2 text-sm font-semibold text-navy">{cell.name}</h4>
            <div className="space-y-2">
              {cellGroups.map(g => (
                <GroupCard key={g.id} g={g} churchId={cell.church_id} onEdit={() => startEdit(g)} onDelete={() => remove(g)} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GroupCard({ g, churchId, onEdit, onDelete }: { g: EvangelismGroup; churchId: string | null; onEdit: () => void; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const qc = useQueryClient();
  const { data: participants = [], isLoading } = useEvangelismParticipants(expanded ? g.id : null);
  const [pName, setPName] = useState("");
  const [pPhone, setPPhone] = useState("");
  const [adding, setAdding] = useState(false);
  const [pErr, setPErr] = useState("");

  async function addParticipant() {
    if (!pName.trim() || !pPhone.trim()) { setPErr("Nome e telefone são obrigatórios."); return; }
    if (!churchId) { setPErr("Esse Life Group não está vinculado a nenhuma igreja/sede."); return; }
    setAdding(true); setPErr("");
    try {
      await Pp.createEvangelismParticipant(supabase, {
        full_name: pName.trim(), phone: pPhone.trim(),
        community_id: churchId, life_group_id: g.cell_id,
        evangelism_group_id: g.id,
      });
      setPName(""); setPPhone("");
      qc.invalidateQueries({ queryKey: ["evangelism-participants", g.id] });
    } catch (e: unknown) { setPErr(e instanceof Error ? e.message : "Erro ao adicionar participante."); }
    finally { setAdding(false); }
  }

  return (
    <div className="rounded-md border bg-card">
      <div className="flex items-center justify-between p-3">
        <button className="flex flex-1 items-center gap-2 text-left" onClick={() => setExpanded(v => !v)}>
          {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          <div>
            <b className="text-navy">{g.name}</b>
            <p className="text-xs text-muted">
              {(g.leader_names ?? []).join(", ") || "sem responsável"}
              {g.meeting_weekday && ` · ${g.meeting_weekday}`}
              {g.meeting_time && ` ${g.meeting_time.slice(0,5)}`}
            </p>
          </div>
        </button>
        <div className="flex gap-2">
          <Button onClick={onEdit} variant="outline" size="sm"><Pencil className="h-3.5 w-3.5" /></Button>
          <Button onClick={onDelete} variant="destructive" size="sm"><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
      </div>
      {expanded && (
        <div className="border-t p-3 space-y-3">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Participantes (pessoas sendo evangelizadas)</p>
          <div className="flex flex-wrap gap-2">
            <Input className="max-w-[200px]" placeholder="Nome" value={pName} onChange={e => setPName(e.target.value)} />
            <Input className="max-w-[160px]" placeholder="Telefone" value={pPhone} onChange={e => setPPhone(e.target.value)} />
            <Button size="sm" onClick={addParticipant} disabled={adding} className="gap-1">
              <UserPlus className="h-3.5 w-3.5" /> Adicionar
            </Button>
          </div>
          {pErr && <p className="text-xs text-destructive">{pErr}</p>}
          {isLoading ? (
            <p className="text-xs italic text-muted-foreground">Carregando…</p>
          ) : participants.length === 0 ? (
            <p className="text-xs italic text-muted-foreground">Nenhum participante registrado ainda.</p>
          ) : (
            <div className="space-y-1.5">
              {participants.map(p => (
                <div key={p.id} className="flex items-center justify-between rounded border px-2.5 py-1.5 text-sm">
                  <div>
                    <span className="font-medium text-navy">{p.full_name}</span>
                    {p.phone && <span className="ml-2 text-xs text-muted-foreground">{p.phone}</span>}
                  </div>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${STAGE_COLORS[p.stage]}`}>{STAGE_LABELS[p.stage]}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
