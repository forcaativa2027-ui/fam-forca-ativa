import type { SupabaseClient } from "@supabase/supabase-js";
import type { MeetingReport, WeeklyAttendanceKind } from "@/types/domain";

export interface WeeklyReportInput {
  life_group_id: string;
  meeting_date: string;
  weekday?: string | null;
  share_theme?: string;
  bible_text?: string;
  flowed?: boolean | null;
  flowed_reason?: string;
  decisions_count?: number;
  needs?: string;
  summary?: string;
  attendance: { member_id: string; kind: WeeklyAttendanceKind; present: boolean; absence_reason?: string }[];
  visits: { visitor_name: string; phone?: string; notes?: string }[];
}

/** Cria relatorio semanal via RPC (calcula totais automaticamente). */
export async function createWeeklyReport(sb: SupabaseClient, input: WeeklyReportInput): Promise<string> {
  const { data, error } = await sb.rpc("create_weekly_report", {
    p_life_group_id: input.life_group_id,
    p_meeting_date: input.meeting_date,
    p_weekday: input.weekday ?? null,
    p_share_theme: input.share_theme ?? null,
    p_bible_text: input.bible_text ?? null,
    p_flowed: input.flowed ?? null,
    p_flowed_reason: input.flowed_reason ?? null,
    p_decisions_count: input.decisions_count ?? 0,
    p_needs: input.needs ?? null,
    p_summary: input.summary ?? null,
    p_attendance: input.attendance,
    p_visits: input.visits,
  });
  if (error) throw error;
  return data as string;
}

export async function listWeeklyReports(sb: SupabaseClient, cellId: string | null): Promise<MeetingReport[]> {
  if (!cellId) return [];
  const { data, error } = await sb.from("meeting_reports").select("*")
    .eq("life_group_id", cellId).order("meeting_date", { ascending: false });
  if (error) return [];
  return (data ?? []) as MeetingReport[];
}

export async function deleteWeeklyReport(sb: SupabaseClient, id: string): Promise<void> {
  const { error } = await sb.from("meeting_reports").delete().eq("id", id);
  if (error) throw error;
}

// ============================================================
// Tela detalhada: monta o relatório completo (report + LG + presença + visitas)
// ============================================================
import type { ReportFull, ReportAttendanceRow, ReportVisitRow, Cell } from "@/types/domain";

export async function getReportFull(sb: SupabaseClient, reportId: string): Promise<ReportFull | null> {
  // 1) Relatório base
  const { data: report, error: reportErr } = await sb
    .from("meeting_reports").select("*").eq("id", reportId).maybeSingle();
  if (reportErr || !report) return null;

  // 2) Life Group
  const { data: cell } = await sb
    .from("life_groups").select("*").eq("id", report.life_group_id).maybeSingle();

  // 3) Nome do líder do LG
  let leader_name: string | null = null;
  if (cell?.leader_id) {
    const { data: leaderProfile } = await sb
      .from("profiles").select("full_name").eq("id", cell.leader_id).maybeSingle();
    leader_name = leaderProfile?.full_name ?? null;
  }

  // 4) Nome de quem reportou
  let reporter_name: string | null = null;
  if (report.reported_by) {
    const { data: reporterProfile } = await sb
      .from("profiles").select("full_name").eq("id", report.reported_by).maybeSingle();
    reporter_name = reporterProfile?.full_name ?? null;
  }

  // 5) Lista de presença com nomes
  const { data: attRaw } = await sb
    .from("report_attendance").select("id, member_id, present, kind, absence_reason")
    .eq("report_id", reportId);
  const memberIds = (attRaw ?? []).map(a => a.member_id);
  const { data: members } = memberIds.length
    ? await sb.from("members").select("id, full_name").in("id", memberIds)
    : { data: [] };
  const nameById = new Map((members ?? []).map(m => [m.id, m.full_name]));
  const attendance: ReportAttendanceRow[] = (attRaw ?? []).map(a => ({
    id: a.id, member_id: a.member_id, member_name: nameById.get(a.member_id) ?? "—",
    present: a.present, kind: a.kind, absence_reason: a.absence_reason,
  }));

  // 6) Visitantes da reunião — tabela report_visits (se existir) ou subset de meeting_reports
  let visits: ReportVisitRow[] = [];
  try {
    const { data: visitsRaw } = await sb
      .from("report_visits").select("id, visitor_name, phone, notes").eq("report_id", reportId);
    visits = (visitsRaw ?? []).map(v => ({
      id: v.id, visitor_name: v.visitor_name, phone: v.phone, notes: v.notes,
    }));
  } catch { /* tabela pode não existir, ignora */ }

  return {
    report: report as MeetingReport,
    cell: (cell as Cell | null) ?? null,
    leader_name, reporter_name, attendance, visits,
  };
}
