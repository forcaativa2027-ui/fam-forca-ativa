import type { SupabaseClient } from "@supabase/supabase-js";
import type { DashboardStats } from "@/types/domain";

const EMPTY: DashboardStats = {
  total_members: 0, total_visitors: 0, total_groups: 0,
  total_reports: 0, baptisms: 0, by_stage: {}, reports_trend: [],
};

export async function getDashboardStats(sb: SupabaseClient, churchId: string|null): Promise<DashboardStats> {
  try {
    const { data, error } = await sb.rpc("dashboard_stats_scoped", { p_church_id: churchId });
    if (error) throw error;
    return (data as unknown as DashboardStats) ?? EMPTY;
  } catch {
    return EMPTY;
  }
}
