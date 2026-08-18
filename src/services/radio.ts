import { supabase } from "@/lib/supabase/client";
import { radioProgramSchema } from "@/schemas/radioProgramSchema";

export interface RadioSettings {
  church_id: string;
  radio_enabled: boolean;
  radio_display_name: string | null;
  radio_short_name: string | null;
  radio_logo_url: string | null;
  radio_icon_url: string | null;
  radio_theme: Record<string, unknown>;
  radio_stream_url: string | null;
}

export interface RadioProgram {
  id: string;
  church_id: string;
  title: string;
  description: string | null;
  presenter: string | null;
  category: string;
  start_time: string;
  end_time: string | null;
  audio_url: string | null;
  media_object_id: string | null;
  thumbnail_url: string | null;
  is_live: boolean;
  is_active: boolean;
  order_index: number;
  created_at: string;
}

export interface RadioConfig {
  id: string;
  church_id: string | null;
  display_name: string;
  short_name: string | null;
  logo_url: string | null;
  icon_url: string | null;
  stream_url: string | null;
  theme: Record<string, unknown>;
  is_enabled: boolean;
  created_at: string;
}

export async function getRadioConfig(churchId?: string): Promise<RadioConfig | null> {
  let q = supabase.from("radio_config").select("*").eq("is_enabled", true);
  if (churchId) q = q.eq("church_id", churchId);
  else q = q.is("church_id", null);
  const { data, error } = await q.maybeSingle();
  if (error) return null;
  return data as RadioConfig | null;
}

export async function getRadioSettings(churchId: string): Promise<RadioSettings | null> {
  const { data, error } = await supabase
    .from("radio_settings")
    .select("*")
    .eq("church_id", churchId)
    .single();
  if (error) return null;
  return data as RadioSettings | null;
}

export async function getLiveProgram(churchId: string): Promise<RadioProgram | null> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("radio_programs")
    .select("*")
    .eq("church_id", churchId)
    .eq("is_active", true)
    .eq("is_live", true)
    .lte("start_time", now)
    .order("start_time", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return null;
  return data as RadioProgram | null;
}

export async function getUpcomingPrograms(churchId: string, limit = 10): Promise<RadioProgram[]> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("radio_programs")
    .select("*")
    .eq("church_id", churchId)
    .eq("is_active", true)
    .gt("start_time", now)
    .order("start_time", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data as RadioProgram[];
}

export async function getProgramsByCategory(churchId: string, category: string): Promise<RadioProgram[]> {
  const { data, error } = await supabase
    .from("radio_programs")
    .select("*")
    .eq("church_id", churchId)
    .eq("is_active", true)
    .eq("category", category)
    .order("start_time", { ascending: false });
  if (error) throw error;
  return data as RadioProgram[];
}

export async function getAllPrograms(churchId: string, limit = 50): Promise<RadioProgram[]> {
  const { data, error } = await supabase
    .from("radio_programs")
    .select("*")
    .eq("church_id", churchId)
    .eq("is_active", true)
    .order("start_time", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as RadioProgram[];
}

export async function shareRadio(churchId: string): Promise<void> {
  const url = `${window.location.origin}/radio?church=${churchId}`;
  if (navigator.share) {
    await navigator.share({
      title: "Rádio Web",
      text: "Ouça a rádio da nossa comunidade",
      url,
    });
  } else {
    await navigator.clipboard.writeText(url);
  }
}

// 2) create, update, delete — validados pelo schema

export async function createRadioProgram(churchId: string, data: z.infer<typeof radioProgramSchema>): Promise<RadioProgram> {
  // Validar usando o schema importado
  const validated = radioProgramSchema.safeParse(data);
  if (!validated.success) {
    const errors = validated.error.errors.map((e) => e.message).join(", ");
    throw new Error(`Dados inválidos: ${errors}`);
  }

  const payload = {
    ...validated.data,
    church_id: churchId,
    is_active: true,
    order_index: validated.data.sort_order ?? 0,
  } as Partial<RadioProgram>;

  const { data: created, error } = await supabase
    .from("radio_programs")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return created as RadioProgram;
}

export async function updateRadioProgram(id: string, data: z.infer<typeof radioProgramSchema>): Promise<RadioProgram> {
  // Validar usando o schema importado
  const validated = radioProgramSchema.safeParse(data);
  if (!validated.success) {
    const errors = validated.error.errors.map((e) => e.message).join(", ");
    throw new Error(`Dados inválidos: ${errors}`);
  }

  const payload = { ...validated.data } as Partial<RadioProgram>;

  const { data: updated, error } = await supabase
    .from("radio_programs")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return updated as RadioProgram;
}

export async function deleteRadioProgram(id: string): Promise<void> {
  const { error } = await supabase
    .from("radio_programs")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

export async function getProgramById(churchId: string, programId: string): Promise<RadioProgram | null> {
  const { data, error } = await supabase
    .from("radio_programs")
    .select("*")
    .eq("church_id", churchId)
    .eq("id", programId)
    .single();
  if (error) return null;
  return data as RadioProgram | null;
}
