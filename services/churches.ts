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

// ── CRUD: Distrito ────────────────────────────────────────────
export async function createDistrict(sb: SupabaseClient, input: Partial<District>): Promise<District> {
  const { data, error } = await sb.from("districts").insert(input).select().single();
  if (error) throw error;
  return data as District;
}
export async function updateDistrict(sb: SupabaseClient, id: string, input: Partial<District>): Promise<void> {
  const { error } = await sb.from("districts").update(input).eq("id", id);
  if (error) throw error;
}
export async function deleteDistrict(sb: SupabaseClient, id: string): Promise<void> {
  const { error } = await sb.from("districts").delete().eq("id", id);
  if (error) throw error;
}

// ── CRUD: Área ─────────────────────────────────────────────────
export async function createArea(sb: SupabaseClient, input: Partial<Area>): Promise<Area> {
  const { data, error } = await sb.from("areas").insert(input).select().single();
  if (error) throw error;
  return data as Area;
}
export async function updateArea(sb: SupabaseClient, id: string, input: Partial<Area>): Promise<void> {
  const { error } = await sb.from("areas").update(input).eq("id", id);
  if (error) throw error;
}
export async function deleteArea(sb: SupabaseClient, id: string): Promise<void> {
  const { error } = await sb.from("areas").delete().eq("id", id);
  if (error) throw error;
}

// ── CRUD: Setor ────────────────────────────────────────────────
export async function createSector(sb: SupabaseClient, input: Partial<Sector>): Promise<Sector> {
  const { data, error } = await sb.from("sectors").insert(input).select().single();
  if (error) throw error;
  return data as Sector;
}
export async function updateSector(sb: SupabaseClient, id: string, input: Partial<Sector>): Promise<void> {
  const { error } = await sb.from("sectors").update(input).eq("id", id);
  if (error) throw error;
}
export async function deleteSector(sb: SupabaseClient, id: string): Promise<void> {
  const { error } = await sb.from("sectors").delete().eq("id", id);
  if (error) throw error;
}
