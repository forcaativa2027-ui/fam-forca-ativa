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
