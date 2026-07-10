import type { SupabaseClient } from "@supabase/supabase-js";
import type { Church, State, Nucleo, District, Area, Sector, Cell, MdaMinAlert } from "@/types/domain";

// ── Leitura existente ─────────────────────────────────────────
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

// ── Estados (MEO-001) ─────────────────────────────────────────
export async function listStates(sb: SupabaseClient): Promise<State[]> {
  const { data, error } = await sb.from("states").select("*").eq("is_active", true).order("name");
  if (error) throw error;
  return (data ?? []) as State[];
}
export async function createState(sb: SupabaseClient, input: Pick<State, "name" | "uf">): Promise<State> {
  const { data, error } = await sb.from("states").insert(input).select().single();
  if (error) throw error;
  return data as State;
}
export async function updateState(sb: SupabaseClient, id: string, input: Partial<State>): Promise<void> {
  const { error } = await sb.from("states").update(input).eq("id", id);
  if (error) throw error;
}
export async function deleteState(sb: SupabaseClient, id: string): Promise<void> {
  const { error } = await sb.from("states").update({ is_active: false }).eq("id", id);
  if (error) throw error;
}

// ── Núcleos (MEO-001) ─────────────────────────────────────────
export async function listNucleos(sb: SupabaseClient, stateId?: string): Promise<Nucleo[]> {
  let query = sb.from("nucleos").select("*").eq("is_active", true).order("name");
  if (stateId) query = query.eq("state_id", stateId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Nucleo[];
}
export async function createNucleo(sb: SupabaseClient, input: Omit<Nucleo, "id" | "created_at" | "is_active">): Promise<Nucleo> {
  const { data, error } = await sb.from("nucleos").insert(input).select().single();
  if (error) throw error;
  return data as Nucleo;
}
export async function updateNucleo(sb: SupabaseClient, id: string, input: Partial<Nucleo>): Promise<void> {
  const { error } = await sb.from("nucleos").update(input).eq("id", id);
  if (error) throw error;
}
export async function deleteNucleo(sb: SupabaseClient, id: string): Promise<void> {
  const { error } = await sb.from("nucleos").update({ is_active: false }).eq("id", id);
  if (error) throw error;
}

// ── Distritos ─────────────────────────────────────────────────
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
  const { error } = await sb.from("districts").update({ is_active: false }).eq("id", id);
  if (error) throw error;
}

// ── Setores ───────────────────────────────────────────────────
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
  const { error } = await sb.from("sectors").update({ is_active: false }).eq("id", id);
  if (error) throw error;
}
