import type { SupabaseClient } from "@supabase/supabase-js";
import type { Church, District, Area, Sector, Cell, MdaMinAlert } from "@/types/domain";

export async function listChurches(sb: SupabaseClient): Promise<Church[]> {
  const { data, error } = await sb.from("churches").select("*").order("name");
  if (error) throw error;
  return (data ?? []) as Church[];
}
export async function listDistricts(sb: SupabaseClient): Promise<District[]> {
  const { data, error } = await sb.from("districts").select("*").order("name");
  if (error) throw error;
  return (data ?? []) as District[];
}
export async function listAreas(sb: SupabaseClient): Promise<Area[]> {
  const { data, error } = await sb.from("areas").select("*").order("name");
  if (error) throw error;
  return (data ?? []) as Area[];
}
export async function listSectors(sb: SupabaseClient): Promise<Sector[]> {
  const { data, error } = await sb.from("sectors").select("*").order("name");
  if (error) throw error;
  return (data ?? []) as Sector[];
}
export async function listCells(sb: SupabaseClient): Promise<Cell[]> {
  const { data, error } = await sb.from("life_groups").select("*").order("name");
  if (error) throw error;
  return (data ?? []) as Cell[];
}
export async function listMdaAlerts(sb: SupabaseClient): Promise<MdaMinAlert[]> {
  const { data, error } = await sb.from("mda_min_alerts").select("*");
  if (error) return [];
  return (data ?? []) as MdaMinAlert[];
}
