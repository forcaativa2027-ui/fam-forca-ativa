"use client";
import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Wand2, Lock, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useCells, useAllMembers, useMonthlyReports, useMonthlyReportFull } from "@/hooks/use-queries";
import { supabase } from "@/lib/supabase/client";
import {
  prefillMonthlyReport, updateWeekTotals, updateMemberWeek,
  setMonthlyNucleo, closeMonthlyReport,
} from "@/services/monthlyReports";
import { logAudit } from "@/services/audit";
import type { MonthlyReportWeek, MonthlyReportMemberWeek } from "@/types/domain";

const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

const WEEK_FIELDS: { key: keyof MonthlyReportWeek; label: string; money?: boolean }[] = [
  { key: "num_membros",            label: "Nº de Membros" },
  { key: "memb_c_discipuladores",  label: "Membros c/ discipuladores" },
  { key: "mda_15_dias",            label: "MDA 15 dias" },
  { key: "ge",                     label: "GE (Grupo de Evangelismo)" },
  { key: "visitantes",             label: "Visitantes" },
  { key: "oferta_pix",             label: "Oferta PIX", money: true },
  { key: "oferta_especie",         label: "Oferta em espécie", money: true },
  { key: "ebd",                    label: "EBD" },
  { key: "cc",                     label: "CC (Cap. da Casa)" },
  { key: "cel",                    label: "CEL (Cap. da Célula)" },
  { key: "kg_amor",                label: "KG do Amor (kg)" },
];

export function MonthlyReportAdmin() {
  const { data: cells = [] } = useCells();
  const { data: allMembers = [] } = useAllMembers();
  const qc = useQueryClient();
  const today = new Date();
  const [cellId, setCellId] = useState("");
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [reportId, setReportId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const { data: reports = [] } = useMonthlyReports(cellId || null);
  const { data: full } = useMonthlyReportFull(reportId);
  const memberMap = new Map(allMembers.map((m) => [m.id, m]));

  async function doPrefill() {
    if (!cellId) { setErr("Selecione uma célula."); return; }
    setBusy(true); setErr("");
    try {
      const id = await prefillMonthlyReport(supabase, cellId, year, month);
      await logAudit(supabase, "custom", "monthly_reports", id, { action: "prefill", year, month });
      qc.invalidateQueries({ queryKey: ["monthly-reports", cellId] });
      qc.invalidateQueries({ queryKey: ["monthly-report-full", id] });
      setReportId(id);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Erro ao pré-preencher");
    } finally {
      setBusy(false);
    }
  }

  async function patchWeek(id: string, key: keyof MonthlyReportWeek, value: number) {
    try {
      await updateWeekTotals(supabase, id, { [key]: value });
      if (reportId) qc.invalidateQueries({ queryKey: ["monthly-report-full", reportId] });
    } catch (e: unknown) { alert(e instanceof Error ? e.message : "Erro ao salvar"); }
  }
  async function patchMemberWeek(id: string, key: keyof MonthlyReportMemberWeek, value: number) {
    try {
      await updateMemberWeek(supabase, id, { [key]: value });
      if (reportId) qc.invalidateQueries({ queryKey: ["monthly-report-full", reportId] });
    } catch (e: unknown) { alert(e instanceof Error ? e.message : "Erro ao salvar"); }
  }
  async function saveNucleo(value: string) {
    if (!full) return;
    try {
      await setMonthlyNucleo(supabase, full.report.id, value || null);
      qc.invalidateQueries({ queryKey: ["monthly-report-full", full.report.id] });
    } catch (e: unknown) { alert(e instanceof Error ? e.message : "Erro"); }
  }
  async function doClose() {
    if (!full || !confirm("Fechar este relatório? Após o fechamento ele fica marcado como finalizado.")) return;
    try {
      await closeMonthlyReport(supabase, full.report.id);
      await logAudit(supabase, "update", "monthly_reports", full.report.id, { action: "close" });
      qc.invalidateQueries({ queryKey: ["monthly-report-full", full.report.id] });
      qc.invalidateQueries({ queryKey: ["monthly-reports", cellId] });
    } catch (e: unknown) { alert(e instanceof Error ? e.message : "Erro"); }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileSpreadsheet className="h-5 w-5 text-gold" />Relatório mensal de Life Group</CardTitle>
          <CardDescription>Fiel ao papel: cabeçalho + 5 semanas × 11 indicadores + grade membros × MDA/CC/CEL</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Célula</Label>
              <select value={cellId} onChange={(e) => { setCellId(e.target.value); setReportId(null); }}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                <option value="">— Selecione —</option>
                {cells.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Mês</Label>
              <select value={month} onChange={(e) => { setMonth(Number(e.target.value)); setReportId(null); }}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Ano</Label>
              <Input type="number" min="2020" max="2100" value={year}
                onChange={(e) => { setYear(Number(e.target.value)); setReportId(null); }} />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={doPrefill} disabled={busy || !cellId} className="gap-2">
              <Wand2 className="h-4 w-4" />{busy ? "Pré-preenchendo…" : "Pré-preencher do banco"}
            </Button>
          </div>
          {err && <p className="mt-2 text-sm text-destructive">{err}</p>}

          {reports.length > 0 && (
            <div className="mt-4 border-t pt-4">
              <Label className="mb-2 block">Relatórios já gerados desta célula:</Label>
              <div className="flex flex-wrap gap-1.5">
                {reports.map((r) => (
                  <Button key={r.id} onClick={() => setReportId(r.id)}
                    variant={reportId === r.id ? "navy" : "outline"} size="sm">
                    {MONTHS[r.month-1]}/{r.year}{r.closed_at ? " 🔒" : ""}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {full && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{cells.find((c) => c.id === full.report.life_group_id)?.name} — {MONTHS[full.report.month-1]}/{full.report.year}</CardTitle>
                {full.report.closed_at ? (
                  <span className="flex items-center gap-1 rounded-full bg-navy-50 px-3 py-1 text-xs font-bold text-navy"><Lock className="h-3 w-3" />Fechado</span>
                ) : (
                  <Button onClick={doClose} variant="outline" size="sm" className="gap-1"><Lock className="h-3.5 w-3.5" />Fechar</Button>
                )}
              </div>
              <CardDescription>Núcleo</CardDescription>
            </CardHeader>
            <CardContent>
              <Input defaultValue={full.report.nucleo ?? ""} onBlur={(e) => saveNucleo(e.target.value)}
                placeholder="Nome do núcleo" disabled={!!full.report.closed_at} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Indicadores por semana</CardTitle>
              <CardDescription>Edite qualquer célula; salva ao sair do campo</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="p-2 text-xs uppercase text-muted">Indicador</th>
                    {full.weeks.map((w) => (
                      <th key={w.id} className="p-2 text-center text-xs font-bold uppercase text-navy">{w.week_number}ª sem.</th>
                    ))}
                    <th className="p-2 text-right text-xs uppercase text-muted">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {WEEK_FIELDS.map((f) => {
                    const total = full.weeks.reduce((s, w) => s + Number(w[f.key] ?? 0), 0);
                    return (
                      <tr key={f.key} className="border-b">
                        <td className="p-2 text-xs font-semibold text-navy-600">{f.label}</td>
                        {full.weeks.map((w) => (
                          <td key={w.id} className="p-1">
                            <input
                              type="number" min="0" step={f.money ? "0.01" : "1"}
                              defaultValue={Number(w[f.key] ?? 0)}
                              disabled={!!full.report.closed_at}
                              onBlur={(e) => patchWeek(w.id, f.key, Number(e.target.value) || 0)}
                              className="h-8 w-20 rounded border bg-background px-2 text-center text-sm disabled:opacity-50"
                            />
                          </td>
                        ))}
                        <td className="p-2 text-right text-xs font-bold text-navy">{f.money ? total.toFixed(2) : total}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Membros × Semana (MDA / CC / CEL)</CardTitle>
              <CardDescription>Contagens de presença/participação por membro em cada semana</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {full.members.length === 0 ? (
                <p className="text-sm italic text-muted">Nenhum membro neste relatório. Cadastre membros vinculados à célula antes de pré-preencher.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th rowSpan={2} className="p-2 align-bottom text-xs uppercase text-muted">Membro</th>
                      {[1,2,3,4,5].map((n) => (
                        <th key={n} colSpan={3} className="border-l p-1 text-center text-xs font-bold text-navy">{n}ª sem.</th>
                      ))}
                    </tr>
                    <tr className="border-b text-[10px] uppercase text-muted">
                      {[1,2,3,4,5].flatMap((n) => [
                        <th key={`${n}-mda`} className="border-l p-1 text-center">MDA</th>,
                        <th key={`${n}-cc`}  className="p-1 text-center">CC</th>,
                        <th key={`${n}-cel`} className="p-1 text-center">CEL</th>,
                      ])}
                    </tr>
                  </thead>
                  <tbody>
                    {full.members.map((memb) => {
                      const member = memberMap.get(memb.member_id);
                      return (
                        <tr key={memb.id} className="border-b">
                          <td className="p-2 text-xs font-semibold text-navy-600">{member?.full_name ?? "—"}</td>
                          {[1,2,3,4,5].map((n) => {
                            const w = memb.weeks.find((x) => x.week_number === n);
                            if (!w) return (
                              <React.Fragment key={`${memb.id}-na-${n}`}>
                                <td className="border-l p-1 text-center text-muted">—</td>
                                <td className="p-1 text-center text-muted">—</td>
                                <td className="p-1 text-center text-muted">—</td>
                              </React.Fragment>
                            );
                            return (
                              <React.Fragment key={`${memb.id}-${n}`}>
                                <td className="border-l p-1">
                                  <input type="number" min="0" defaultValue={w.mda}
                                    disabled={!!full.report.closed_at}
                                    onBlur={(e) => patchMemberWeek(w.id, "mda", Number(e.target.value) || 0)}
                                    className="h-7 w-12 rounded border bg-background text-center text-xs disabled:opacity-50" />
                                </td>
                                <td className="p-1">
                                  <input type="number" min="0" defaultValue={w.cc}
                                    disabled={!!full.report.closed_at}
                                    onBlur={(e) => patchMemberWeek(w.id, "cc", Number(e.target.value) || 0)}
                                    className="h-7 w-12 rounded border bg-background text-center text-xs disabled:opacity-50" />
                                </td>
                                <td className="p-1">
                                  <input type="number" min="0" defaultValue={w.cel}
                                    disabled={!!full.report.closed_at}
                                    onBlur={(e) => patchMemberWeek(w.id, "cel", Number(e.target.value) || 0)}
                                    className="h-7 w-12 rounded border bg-background text-center text-xs disabled:opacity-50" />
                                </td>
                              </React.Fragment>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
