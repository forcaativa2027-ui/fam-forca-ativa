"use client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { MinistryGoal, GoalVsActual, GoalIndicator, GoalScope } from "@/types/domain";

export async function listGoals(sb: SupabaseClient, year?: number): Promise<MinistryGoal[]> {
  let q = sb.from("ministry_goals").select("*").order("scope").order("indicator");
  if (year) q = q.eq("year", year);
  const { data, error } = await q;
  if (error) { console.error("[goals]", error); return []; }
  return (data ?? []) as MinistryGoal[];
}

export async function listGoalsVsActual(sb: SupabaseClient, year?: number): Promise<GoalVsActual[]> {
  let q = sb.from("goals_vs_actual").select("*").order("indicator");
  if (year) q = q.eq("year", year);
  const { data, error } = await q;
  if (error) { console.error("[goals_vs_actual]", error); return []; }
  return (data ?? []) as GoalVsActual[];
}

export async function upsertGoal(sb: SupabaseClient, payload: {
  scope: GoalScope;
  scope_id?: string | null;
  scope_name: string;
  year: number;
  month?: number | null;
  indicator: GoalIndicator;
  target_value: number;
  notes?: string | null;
  id?: string;
}): Promise<MinistryGoal> {
  const { data, error } = await sb
    .from("ministry_goals")
    .upsert(payload, { onConflict: "scope,scope_id,year,month,indicator" })
    .select()
    .single();
  if (error) throw error;
  return data as MinistryGoal;
}

export async function deleteGoal(sb: SupabaseClient, id: string): Promise<void> {
  const { error } = await sb.from("ministry_goals").delete().eq("id", id);
  if (error) throw error;
}
