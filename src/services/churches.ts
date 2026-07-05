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

// ── CRUD de Distrito/Área/Setor (estrutura MDA) ─────────────────────

export async function createDistrict(sb: SupabaseClient, input: { church_id: string; name: string; mother_id?: string | null }): Promise<District> {
  const { data, error } = await sb.from("districts").insert({
    church_id: input.church_id, name: input.name, mother_id: input.mother_id ?? null, is_active: true,
  }).select().single();
  if (error) throw error;
  return data as District;
}
export async function updateDistrict(sb: SupabaseClient, id: string, input: Partial<Pick<District, "name" | "mother_id" | "is_active">>): Promise<void> {
  const { error } = await sb.from("districts").update(input).eq("id", id);
  if (error) throw error;
}
export async function deleteDistrict(sb: SupabaseClient, id: string): Promise<void> {
  const { error } = await sb.from("districts").delete().eq("id", id);
  if (error) throw error;
}

export async function createArea(sb: SupabaseClient, input: { district_id: string; name: string; mother_id?: string | null }): Promise<Area> {
  const { data, error } = await sb.from("areas").insert({
    district_id: input.district_id, name: input.name, mother_id: input.mother_id ?? null, is_active: true,
  }).select().single();
  if (error) throw error;
  return data as Area;
}
export async function updateArea(sb: SupabaseClient, id: string, input: Partial<Pick<Area, "name" | "mother_id" | "is_active">>): Promise<void> {
  const { error } = await sb.from("areas").update(input).eq("id", id);
  if (error) throw error;
}
export async function deleteArea(sb: SupabaseClient, id: string): Promise<void> {
  const { error } = await sb.from("areas").delete().eq("id", id);
  if (error) throw error;
}

export async function createSector(sb: SupabaseClient, input: { area_id: string; name: string; mother_id?: string | null }): Promise<Sector> {
  const { data, error } = await sb.from("sectors").insert({
    area_id: input.area_id, name: input.name, mother_id: input.mother_id ?? null, is_active: true,
  }).select().single();
  if (error) throw error;
  return data as Sector;
}
export async function updateSector(sb: SupabaseClient, id: string, input: Partial<Pick<Sector, "name" | "mother_id" | "is_active">>): Promise<void> {
  const { error } = await sb.from("sectors").update(input).eq("id", id);
  if (error) throw error;
}
export async function deleteSector(sb: SupabaseClient, id: string): Promise<void> {
  const { error } = await sb.from("sectors").delete().eq("id", id);
  if (error) throw error;
}
