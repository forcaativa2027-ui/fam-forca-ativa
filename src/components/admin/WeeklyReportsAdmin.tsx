"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, ClipboardList, Eye } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { weeklyReportSchema, type WeeklyReportFormInput } from "@/schemas";
import { useCells, useAllMembers, useWeeklyReports } from "@/hooks/use-queries";
import { supabase } from "@/lib/supabase/client";
import { createWeeklyReport, deleteWeeklyReport } from "@/services/weeklyReports";
import { logAudit } from "@/services/audit";
import type { WeeklyAttendanceKind } from "@/types/domain";

interface AttendanceRow { member_id: string; full_name: string; kind: WeeklyAttendanceKind; present: boolean; absence_reason: string; }
interface VisitRow { id: string; visitor_name: string; phone: string; notes: string; }

export function WeeklyReportsAdmin() {
  const { data: cells = [] } = useCells();
  const { data: members = [] } = useAllMembers();
  const [cellId, setCellId] = useState<string>("");
  const { data: reports = [] } = useWeeklyReports(cellId || null);
  const qc = useQueryClient();
  const [err, setErr] = useState("");
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const [visits, setVisits] = useState<VisitRow[]>([]);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<WeeklyReportFormInput>({
      resolver: zodResolver(weeklyReportSchema),
      defaultValues: { meeting_date: new Date().toISOString().slice(0,10), flowed: "null", decisions_count: 0 },
    });

  function onPickCell(id: string) {
    setCellId(id);
    const cellMembers = members.filter((m) => m.life_group_id === id && m.status === "ativo");
    setAttendance(cellMembers.map((m) => ({
      member_id: m.id, full_name: m.full_name,
      kind: "membro" as WeeklyAttendanceKind, present: true, absence_reason: "",
    })));
    setVisits([]);
    reset({
      life_group_id: id,
      meeting_date: new Date().toISOString().slice(0,10),
      flowed: "null", decisions_count: 0,
    });
  }

  function togglePresent(memberId: string) {
    setAttendance((rows) => rows.map((r) => r.member_id === memberId ? { ...r, present: !r.present } : r));
  }
  function setKind(memberId: string, kind: WeeklyAttendanceKind) {
    setAttendance((rows) => rows.map((r) => r.member_id === memberId ? { ...r, kind } : r));
  }
  function setAbsence(memberId: string, reason: string) {
    setAttendance((rows) => rows.map((r) => r.member_id === memberId ? { ...r, absence_reason: reason } : r));
  }
  function addVisit() {
    setVisits((v) => [...v, { id: crypto.randomUUID(), visitor_name: "", phone: "", notes: "" }]);
  }
  function updateVisit(id: string, patch: Partial<VisitRow>) {
    setVisits((rows) => rows.map((v) => v.id === id ? { ...v, ...patch } : v));
  }
  function removeVisit(id: string) { setVisits((v) => v.filter((x) => x.id !== id)); }

  async function onSubmit(v: WeeklyReportFormInput) {
    setErr("");
    try {
      const id = await createWeeklyReport(supabase, {
        life_group_id: v.life_group_id,
        meeting_date: v.meeting_date,
        share_theme: v.share_theme,
        bible_text: v.bible_text,
        flowed: v.flowed === "null" ? null : v.flowed === "sim",
        flowed_reason: v.flowed_reason,
        decisions_count: v.decisions_count,
        needs: v.needs,
        summary: v.summary,
        attendance: attendance.map((a) => ({
          member_id: a.member_id, kind: a.kind, present: a.present,
          absence_reason: a.absence_reason || undefined,
        })),
        visits: visits.filter((vi) => vi.visitor_name.trim()).map((vi) => ({
          visitor_name: vi.visitor_name, phone: vi.phone || undefined, notes: vi.notes || undefined,
        })),
      });
      await logAudit(supabase, "insert", "meeting_reports", id);
      qc.invalidateQueries({ queryKey: ["weekly-reports", cellId] });
      // Reset preservando célula
      reset({ life_group_id: cellId, meeting_date: new Date().toISOString().slice(0,10), flowed: "null", decisions_count: 0 });
      setAttendance((rows) => rows.map((r) => ({ ...r, present: true, absence_reason: "" })));
      setVisits([]);
      alert("Relatório salvo!");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Erro ao salvar");
    }
  }
  async function remove(id: string) {
    if (!confirm("Apagar este relatório?")) return;
    try {
      await deleteWeeklyReport(supabase, id);
      await logAudit(supabase, "delete", "meeting_reports", id);
      qc.invalidateQueries({ queryKey: ["weekly-reports", cellId] });
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Erro");
    }
  }

  const present = attendance.filter((a) => a.present);
  const membrosPres = present.filter((a) => a.kind === "membro").length;
  const freqPres = present.filter((a) => a.kind === "frequentador").length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5 text-gold" />Relatório semanal de célula</CardTitle>
          <CardDescription>Fiel ao papel físico: tema, "fluiu?", presença categorizada e visitas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 space-y-1.5">
            <Label>Selecione a célula</Label>
            <select value={cellId} onChange={(e) => onPickCell(e.target.value)}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm">
              <option value="">— Selecione —</option>
              {cells.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {cellId && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <input type="hidden" {...register("life_group_id")} value={cellId} />

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Data do encontro" error={errors.meeting_date?.message}>
                  <Input type="date" {...register("meeting_date")} />
                </Field>
                <Field label="Tema do compartilhamento"><Input {...register("share_theme")} placeholder="Tema da palavra" /></Field>
              </div>
              <Field label="Texto bíblico"><Input {...register("bible_text")} placeholder="Ex: João 3:16" /></Field>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Fluiu?">
                  <select {...register("flowed")} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                    <option value="null">— Não informar —</option>
                    <option value="sim">Sim</option>
                    <option value="nao">Não</option>
                  </select>
                </Field>
                <Field label="Por quê?"><Input {...register("flowed_reason")} placeholder="Motivo (opcional)" /></Field>
              </div>

              {/* Presença */}
              <div>
                <Label className="mb-2 block">Presença ({present.length}/{attendance.length} presentes — {membrosPres} membros + {freqPres} frequentadores)</Label>
                {attendance.length === 0 && (
                  <p className="text-sm italic text-muted">Nenhum membro cadastrado nesta célula. Cadastre membros antes de criar o relatório.</p>
                )}
                <div className="space-y-2">
                  {attendance.map((a) => (
                    <div key={a.member_id} className="rounded-lg border p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <input type="checkbox" checked={a.present} onChange={() => togglePresent(a.member_id)} className="h-4 w-4 accent-gold" />
                        <b className="flex-1 text-sm text-navy">{a.full_name}</b>
                        <select value={a.kind} onChange={(e) => setKind(a.member_id, e.target.value as WeeklyAttendanceKind)}
                          className="h-8 rounded border bg-background px-2 text-xs">
                          <option value="membro">Membro</option>
                          <option value="frequentador">Frequentador</option>
                        </select>
                      </div>
                      {!a.present && (
                        <Input value={a.absence_reason} onChange={(e) => setAbsence(a.member_id, e.target.value)}
                          placeholder="Motivo da falta (opcional)" className="mt-2 h-9 text-sm" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Visitas */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Label>Visitas da semana ({visits.length})</Label>
                  <Button type="button" onClick={addVisit} variant="outline" size="sm" className="gap-1"><Plus className="h-3.5 w-3.5" />Adicionar</Button>
                </div>
                <div className="space-y-2">
                  {visits.map((v) => (
                    <div key={v.id} className="rounded-lg border p-3">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Input value={v.visitor_name} onChange={(e) => updateVisit(v.id, { visitor_name: e.target.value })} placeholder="Nome do visitante" className="h-9 text-sm" />
                        <Input value={v.phone} onChange={(e) => updateVisit(v.id, { phone: e.target.value })} placeholder="Telefone" className="h-9 text-sm" />
                      </div>
                      <Input value={v.notes} onChange={(e) => updateVisit(v.id, { notes: e.target.value })} placeholder="Notas" className="mt-2 h-9 text-sm" />
                      <Button type="button" onClick={() => removeVisit(v.id)} variant="ghost" size="sm" className="mt-1 text-destructive">Remover visita</Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Decisões na noite"><Input type="number" min="0" {...register("decisions_count")} /></Field>
                <Field label="Necessidades"><Input {...register("needs")} /></Field>
              </div>
              <Field label="Observações gerais">
                <textarea {...register("summary")} rows={2} className="w-full rounded-md border bg-background p-3 text-sm" placeholder="Resumo livre do encontro" />
              </Field>

              {err && <p className="text-sm text-destructive">{err}</p>}
              <Button type="submit" disabled={isSubmitting || attendance.length === 0} className="gap-2">
                <Plus className="h-4 w-4" />Salvar relatório
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {cellId && (
        <div>
          <h3 className="mb-2 font-display text-lg text-navy">Relatórios anteriores ({reports.length})</h3>
          <div className="space-y-2">
            {reports.length === 0 && <p className="text-sm italic text-muted">Nenhum relatório salvo para esta célula.</p>}
            {reports.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl border bg-card p-3">
                <div className="min-w-0 flex-1">
                  <b className="text-navy">{new Date(r.meeting_date).toLocaleDateString("pt-BR")}</b>
                  {r.share_theme && <p className="text-xs text-muted">{r.share_theme}</p>}
                  <p className="mt-1 text-[11px] text-muted">
                    {r.total_present ?? r.attendance_count} presentes · {r.visitors_count} visita(s) · {r.decisions_count} decisão(ões)
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button asChild variant="outline" size="sm" className="gap-1">
                    <Link href={`/admin/relatorio/${r.id}`}><Eye className="h-3.5 w-3.5" />Ver</Link>
                  </Button>
                  <Button onClick={() => remove(r.id)} variant="destructive" size="sm"><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
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
