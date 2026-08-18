import type { SupabaseClient } from "@supabase/supabase-js";
import type { RadioConfig, RadioProgram, RadioEpisode } from "@/types/domain";
import { radioProgramSchema, type RadioProgramInput } from "@/schemas/radioProgramSchema";

export async function getRadioConfig(sb: SupabaseClient, churchId?: string | null): Promise<RadioConfig | null> {
  let q = sb.from("radio_config").select("*").eq("is_enabled", true);
  if (churchId) q = q.eq("church_id", churchId);
  else q = q.is("church_id", null);
  const { data, error } = await q.maybeSingle();
  if (error) return null;
  return data as RadioConfig | null;
}

export async function listRadioPrograms(sb: SupabaseClient, churchId?: string | null): Promise<RadioProgram[]> {
  let q = sb.from("radio_programs").select("*").eq("is_active", true).order("sort_order");
  if (churchId) q = q.or(`church_id.eq.${churchId},church_id.is.null`);
  const { data, error } = await q;
  if (error) return [];
  return (data ?? []) as RadioProgram[];
}

export async function listRadioEpisodes(
  sb: SupabaseClient,
  churchId?: string | null,
  category?: string,
  limit = 20
): Promise<RadioEpisode[]> {
  let q = sb.from("radio_episodes")
    .select("*")
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false })
    .limit(limit);
  if (churchId) q = q.or(`church_id.eq.${churchId},church_id.is.null`);
  if (category) q = q.eq("category", category);
  const { data, error } = await q;
  if (error) return [];
  return (data ?? []) as RadioEpisode[];
}

export async function getAllPrograms(sb: SupabaseClient, churchId?: string | null, limit = 50): Promise<RadioProgram[]> {
  let q = sb.from("radio_programs").select("*").order("sort_order").limit(limit);
  if (churchId) q = q.or(`church_id.eq.${churchId},church_id.is.null`);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as RadioProgram[];
}

export async function getProgramById(sb: SupabaseClient, programId: string): Promise<RadioProgram | null> {
  const { data, error } = await sb.from("radio_programs").select("*").eq("id", programId).maybeSingle();
  if (error) return null;
  return data as RadioProgram | null;
}

export async function createRadioProgram(
  sb: SupabaseClient,
  churchId: string,
  data: RadioProgramInput
): Promise<RadioProgram> {
  const validated = radioProgramSchema.safeParse(data);
  if (!validated.success) {
    const errors = validated.error.errors.map((e) => e.message).join(", ");
    throw new Error(`Dados inválidos: ${errors}`);
  }
  const { data: created, error } = await sb
    .from("radio_programs")
    .insert({ ...validated.data, church_id: churchId })
    .select()
    .single();
  if (error) throw error;
  return created as RadioProgram;
}

export async function updateRadioProgram(
  sb: SupabaseClient,
  id: string,
  data: RadioProgramInput
): Promise<RadioProgram> {
  const validated = radioProgramSchema.safeParse(data);
  if (!validated.success) {
    const errors = validated.error.errors.map((e) => e.message).join(", ");
    throw new Error(`Dados inválidos: ${errors}`);
  }
  const { data: updated, error } = await sb
    .from("radio_programs")
    .update(validated.data)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return updated as RadioProgram;
}

export async function deleteRadioProgram(sb: SupabaseClient, id: string): Promise<void> {
  const { error } = await sb.from("radio_programs").delete().eq("id", id);
  if (error) throw error;
}