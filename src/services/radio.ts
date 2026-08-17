import type { SupabaseClient } from "@supabase/supabase-js";
import type { RadioConfig, RadioProgram, RadioEpisode } from "@/types/domain";

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