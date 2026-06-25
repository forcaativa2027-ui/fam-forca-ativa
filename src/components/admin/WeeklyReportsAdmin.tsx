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

interface AttendanceRow {
  member_id: string; full_name: string;
  kind: WeeklyAttendanceKind; present: boolean; absence_reason: string;
  had_mda_15_dias: boolean; had_cc: boolean; had_cel: boolean;
}
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
      had_mda_15_dias: false, had_cc: false, had_cel: false,
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
  function toggleMda(memberId: string) {
    setAttendance((rows) => rows.map((r) => r.member_id === memberId ? { ...r, had_mda_15_dias: !r.had_mda_15_dias } : r));
  }
  function toggleCc(memberId: string) {
    setAttendance((rows) => rows.map((r) => r.member_id === memberId ? { ...r, had_cc: !r.had_cc } : r));
  }
  function toggleCel(memberId: string) {
    setAttendance((rows) => rows.map((r) => r.member_id === memberId ? { ...r, had_cel: !r.had_cel } : r));
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
          had_mda_15_dias: a.had_mda_15_dias,
          had_cc: a.had_cc, had_cel: a.had_cel,
        })),
        visits: visits.filter((vi) => vi.visitor_name.trim()).map((vi) => ({
          visitor_name: vi.visitor_name, phone: vi.phone || undefined, notes: vi.notes || undefined,
        })),
        // Indicadores semanais (Caderno 11-B)
        members_with_disciplers: v.members_with_disciplers,
        mda_15_dias_happened: v.mda_15_dias_happened,
        mda_15_dias_count: v.mda_15_dias_count,
        ge_happened: v.ge_happened,
        ge_location: v.ge_location,
        ge_when: v.ge_when,
        oferta_pix: v.oferta_pix,
        oferta_especie: v.oferta_especie,
        ebd_count: v.ebd_count,
        cc_count: v.cc_count,
        cel_count: v.cel_count,
        kg_amor: v.kg_amor,
        // Discipulado
        disc_realizados: v.disc_realizados,
        disc_ativos: v.disc_ativos,
        disc_encontros: v.disc_encontros,
        disc_interrompidos: v.disc_interrompidos,
        disc_novos: v.disc_novos,
        // Consolidação
        cons_retornantes: v.cons_retornantes,
        cons_acompanhamento: v.cons_acompanhamento,
        cons_integrados: v.cons_integrados,
        cons_novos_membros: v.cons_novos_membros,
        // Liderança
        lid_aux_treinamento: v.lid_aux_treinamento,
        lid_em_formacao: v.lid_em_formacao,
        lid_potencial_multiplicador: v.lid_potencial_multiplicador,
        lid_observacoes: v.lid_observacoes,
        // Multiplicação
        mult_filha_preparacao: v.mult_filha_preparacao,
        mult_nova_lideranca: v.mult_nova_lideranca,
        mult_potencial: v.mult_potencial,
        // Saúde
        saude_status: v.saude_status || undefined,
        saude_comentarios: v.saude_comentarios,
        // Necessidades pastorais
        nec_oracao_urgente: v.nec_oracao_urgente,
        nec_visita_pastoral: v.nec_visita_pastoral,
        nec_problema_familiar: v.nec_problema_familiar,
        nec_problema_espiritual: v.nec_problema_espiritual,
        nec_encaminhar_supervisor: v.nec_encaminhar_supervisor,
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

              {/* Indicadores semanais (Caderno 11-B) */}
              <div className="rounded-xl border-2 border-dashed border-gold/40 bg-gold/5 p-3 space-y-3">
                <Label className="block font-bold uppercase tracking-wider text-gold text-xs">Indicadores da semana</Label>

                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="Membros c/ discipuladores">
                    <Input type="number" min={0} {...register("members_with_disciplers")} placeholder="0" />
                  </Field>
                  <Field label="Decisões por Cristo">
                    <Input type="number" min={0} {...register("decisions_count")} placeholder="0" />
                  </Field>
                  <Field label="EBD (membros)">
                    <Input type="number" min={0} {...register("ebd_count")} placeholder="0" />
                  </Field>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="CC — Cap. da Casa (qtd)">
                    <Input type="number" min={0} {...register("cc_count")} placeholder="0" />
                  </Field>
                  <Field label="CEL — Cap. da Célula (qtd)">
                    <Input type="number" min={0} {...register("cel_count")} placeholder="0" />
                  </Field>
                  <Field label="KG do Amor (kg)">
                    <Input type="number" step="0.5" min={0} {...register("kg_amor")} placeholder="0" />
                  </Field>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Oferta PIX (R$)">
                    <Input type="number" step="0.01" min={0} {...register("oferta_pix")} placeholder="0,00" />
                  </Field>
                  <Field label="Oferta em espécie (R$)">
                    <Input type="number" step="0.01" min={0} {...register("oferta_especie")} placeholder="0,00" />
                  </Field>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 rounded-md border bg-card p-3">
                  <Field label="Houve MDA de 15 dias?">
                    <select {...register("mda_15_dias_happened")} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                      <option value="false">Não</option>
                      <option value="true">Sim</option>
                    </select>
                  </Field>
                  <Field label="Quantos membros participaram do MDA?">
                    <Input type="number" min={0} {...register("mda_15_dias_count")} placeholder="0" />
                  </Field>
                </div>

                <div className="rounded-md border bg-card p-3 space-y-3">
                  <Field label="Houve GE (Grupo de Evangelismo)?">
                    <select {...register("ge_happened")} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                      <option value="false">Não</option>
                      <option value="true">Sim</option>
                    </select>
                  </Field>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Onde foi o GE?">
                      <Input {...register("ge_location")} placeholder="Ex: Rua da Paz, 200" />
                    </Field>
                    <Field label="Quando foi o GE?">
                      <Input {...register("ge_when")} placeholder="Ex: Sábado às 16h" />
                    </Field>
                  </div>
                </div>
              </div>

              {/* Acompanhamento ministerial — 6 seções colapsáveis */}
              <div className="space-y-2">
                {/* DISCIPULADO */}
                <details className="rounded-xl border bg-card">
                  <summary className="cursor-pointer select-none px-4 py-3 font-semibold text-navy hover:bg-navy-50/50">
                    📖 Discipulado
                  </summary>
                  <div className="border-t p-3 space-y-3">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Field label="Discipulados realizados">
                        <Input type="number" min={0} {...register("disc_realizados")} placeholder="0" />
                      </Field>
                      <Field label="Discípulos ativos">
                        <Input type="number" min={0} {...register("disc_ativos")} placeholder="0" />
                      </Field>
                      <Field label="Encontros realizados">
                        <Input type="number" min={0} {...register("disc_encontros")} placeholder="0" />
                      </Field>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Discipulados interrompidos">
                        <Input type="number" min={0} {...register("disc_interrompidos")} placeholder="0" />
                      </Field>
                      <Field label="Novos discipulados iniciados">
                        <Input type="number" min={0} {...register("disc_novos")} placeholder="0" />
                      </Field>
                    </div>
                  </div>
                </details>

                {/* CONSOLIDAÇÃO */}
                <details className="rounded-xl border bg-card">
                  <summary className="cursor-pointer select-none px-4 py-3 font-semibold text-navy hover:bg-navy-50/50">
                    🤝 Consolidação
                  </summary>
                  <div className="border-t p-3 grid gap-3 sm:grid-cols-2">
                    <Field label="Visitantes retornantes">
                      <Input type="number" min={0} {...register("cons_retornantes")} placeholder="0" />
                    </Field>
                    <Field label="Visitantes em acompanhamento">
                      <Input type="number" min={0} {...register("cons_acompanhamento")} placeholder="0" />
                    </Field>
                    <Field label="Visitantes integrados ao LG">
                      <Input type="number" min={0} {...register("cons_integrados")} placeholder="0" />
                    </Field>
                    <Field label="Novos membros">
                      <Input type="number" min={0} {...register("cons_novos_membros")} placeholder="0" />
                    </Field>
                  </div>
                </details>

                {/* FORMAÇÃO DE LIDERANÇA */}
                <details className="rounded-xl border bg-card">
                  <summary className="cursor-pointer select-none px-4 py-3 font-semibold text-navy hover:bg-navy-50/50">
                    👑 Formação de Liderança
                  </summary>
                  <div className="border-t p-3 space-y-3">
                    <div className="space-y-1.5">
                      <label className="flex cursor-pointer items-center gap-2 text-sm">
                        <input type="checkbox" {...register("lid_aux_treinamento")} className="h-4 w-4 accent-gold" />
                        Existe auxiliar em treinamento?
                      </label>
                      <label className="flex cursor-pointer items-center gap-2 text-sm">
                        <input type="checkbox" {...register("lid_em_formacao")} className="h-4 w-4 accent-gold" />
                        Existe líder em formação?
                      </label>
                      <label className="flex cursor-pointer items-center gap-2 text-sm">
                        <input type="checkbox" {...register("lid_potencial_multiplicador")} className="h-4 w-4 accent-gold" />
                        Existe potencial multiplicador?
                      </label>
                    </div>
                    <Field label="Observações sobre liderança">
                      <textarea {...register("lid_observacoes")} rows={2}
                        className="w-full rounded-md border bg-background p-2 text-sm"
                        placeholder="Quem está sendo formado, em que estágio, próximos passos…" />
                    </Field>
                  </div>
                </details>

                {/* MULTIPLICAÇÃO */}
                <details className="rounded-xl border bg-card">
                  <summary className="cursor-pointer select-none px-4 py-3 font-semibold text-navy hover:bg-navy-50/50">
                    ✂️ Multiplicação
                  </summary>
                  <div className="border-t p-3 space-y-1.5">
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input type="checkbox" {...register("mult_filha_preparacao")} className="h-4 w-4 accent-gold" />
                      Existe célula filha em preparação?
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input type="checkbox" {...register("mult_nova_lideranca")} className="h-4 w-4 accent-gold" />
                      Existe nova liderança sendo preparada?
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input type="checkbox" {...register("mult_potencial")} className="h-4 w-4 accent-gold" />
                      O grupo possui potencial de multiplicação?
                    </label>
                  </div>
                </details>

                {/* SAÚDE DO LG */}
                <details className="rounded-xl border bg-card" open>
                  <summary className="cursor-pointer select-none px-4 py-3 font-semibold text-navy hover:bg-navy-50/50">
                    ❤️ Saúde do Life Group <span className="text-[10px] text-muted">(avaliação do líder)</span>
                  </summary>
                  <div className="border-t p-3 space-y-3">
                    <Field label="Como você avalia a saúde deste LG nesta semana?">
                      <select {...register("saude_status")} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                        <option value="">— Não informar —</option>
                        <option value="muito_saudavel">🟢🟢 Muito saudável</option>
                        <option value="saudavel">🟢 Saudável</option>
                        <option value="atencao">🟡 Atenção</option>
                        <option value="necessita_apoio">🔴 Necessita apoio</option>
                      </select>
                    </Field>
                    <Field label="Comentários do líder">
                      <textarea {...register("saude_comentarios")} rows={2}
                        className="w-full rounded-md border bg-background p-2 text-sm"
                        placeholder="Pontos fortes, atenções, contexto…" />
                    </Field>
                  </div>
                </details>

                {/* NECESSIDADES PASTORAIS */}
                <details className="rounded-xl border bg-card">
                  <summary className="cursor-pointer select-none px-4 py-3 font-semibold text-navy hover:bg-navy-50/50">
                    🙏 Necessidades Pastorais
                  </summary>
                  <div className="border-t p-3 space-y-1.5">
                    <p className="mb-2 text-[11px] uppercase tracking-wider text-muted">Marque tudo que se aplica:</p>
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input type="checkbox" {...register("nec_oracao_urgente")} className="h-4 w-4 accent-red-500" />
                      Pedido urgente de oração
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input type="checkbox" {...register("nec_visita_pastoral")} className="h-4 w-4 accent-red-500" />
                      Necessidade de visita pastoral
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input type="checkbox" {...register("nec_problema_familiar")} className="h-4 w-4 accent-red-500" />
                      Problema familiar
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input type="checkbox" {...register("nec_problema_espiritual")} className="h-4 w-4 accent-red-500" />
                      Problema espiritual
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input type="checkbox" {...register("nec_encaminhar_supervisor")} className="h-4 w-4 accent-red-500" />
                      Encaminhar ao supervisor
                    </label>
                  </div>
                </details>
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
                      {/* Marcações individuais (Caderno 11-B) */}
                      {a.present && (
                        <div className="mt-2 flex flex-wrap items-center gap-3 border-t pt-2 text-[11px]">
                          <span className="text-muted">Participou de:</span>
                          <label className="flex cursor-pointer items-center gap-1">
                            <input type="checkbox" checked={a.had_mda_15_dias} onChange={() => toggleMda(a.member_id)} className="h-3.5 w-3.5 accent-gold" />
                            <span>MDA 15 dias</span>
                          </label>
                          <label className="flex cursor-pointer items-center gap-1">
                            <input type="checkbox" checked={a.had_cc} onChange={() => toggleCc(a.member_id)} className="h-3.5 w-3.5 accent-gold" />
                            <span>CC (Cap. da Casa)</span>
                          </label>
                          <label className="flex cursor-pointer items-center gap-1">
                            <input type="checkbox" checked={a.had_cel} onChange={() => toggleCel(a.member_id)} className="h-3.5 w-3.5 accent-gold" />
                            <span>CEL (Cap. da Célula)</span>
                          </label>
                        </div>
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
              <Button type="submit" disabled={isSubmitting} className="gap-2">
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
