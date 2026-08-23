"use client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { KnowledgeCategory, KnowledgePoint, KnowledgePointDetail, KnowledgePointRelated, RelationType } from "@/types/domain";

export async function listKnowledgePoints(sb: SupabaseClient, category?: KnowledgeCategory): Promise<KnowledgePoint[]> {
  let q = sb.from("knowledge_points").select("*").eq("is_active", true).order("order_index").order("title");
  if (category) q = q.eq("category", category);
  const { data, error } = await q;
  if (error) { console.error("[academy] listKnowledgePoints", error); return []; }
  return (data ?? []) as KnowledgePoint[];
}

export async function searchKnowledgePoints(sb: SupabaseClient, term: string): Promise<KnowledgePoint[]> {
  const { data, error } = await sb.from("knowledge_points").select("*").eq("is_active", true)
    .or(`title.ilike.%${term}%,subtitle.ilike.%${term}%,description.ilike.%${term}%`).limit(30);
  if (error) return [];
  return (data ?? []) as KnowledgePoint[];
}

export async function getKnowledgePointDetail(sb: SupabaseClient, id: string): Promise<KnowledgePointDetail | null> {
  const { data, error } = await sb.rpc("get_knowledge_point_detail", { p_id: id });
  if (error || !data || data.length === 0) return null;
  const first = data[0];
  const related: KnowledgePointRelated[] = data
    .filter((r: { related_id: string | null }) => r.related_id)
    .map((r: { related_id: string; related_category: KnowledgeCategory; related_title: string; related_image_url: string | null; relation_type: RelationType | null; relation_direction: "saida" | "entrada" | null }) => ({
      related_id: r.related_id, related_category: r.related_category, related_title: r.related_title, related_image_url: r.related_image_url,
      relation_type: r.relation_type, relation_direction: r.relation_direction,
    }));
  return {
    id: first.id, category: first.category, title: first.title, subtitle: first.subtitle, description: first.description,
    image_url: first.image_url, period_label: first.period_label, latitude: first.latitude, longitude: first.longitude,
    bible_refs: first.bible_refs, order_index: 0, is_active: true, created_at: "", related,
  };
}

export interface KnowledgePointInput {
  category: KnowledgeCategory; title: string; subtitle?: string; description?: string; image_url?: string;
  period_label?: string; latitude?: number; longitude?: number; bible_refs?: string; order_index?: number;
}
export async function createKnowledgePoint(sb: SupabaseClient, input: KnowledgePointInput): Promise<string> {
  const { data, error } = await sb.from("knowledge_points").insert(input).select("id").single();
  if (error) throw error;
  return data.id as string;
}
export async function updateKnowledgePoint(sb: SupabaseClient, id: string, patch: Partial<KnowledgePointInput>): Promise<void> {
  const { error } = await sb.from("knowledge_points").update(patch).eq("id", id);
  if (error) throw error;
}
export async function deleteKnowledgePoint(sb: SupabaseClient, id: string): Promise<void> {
  const { error } = await sb.from("knowledge_points").delete().eq("id", id);
  if (error) throw error;
}

export async function relateKnowledgePoints(sb: SupabaseClient, fromId: string, toId: string, relationType?: RelationType): Promise<void> {
  const { error } = await sb.from("knowledge_point_relations").insert({ from_id: fromId, to_id: toId, relation_type: relationType ?? null });
  if (error) throw error;
}
export async function unrelateKnowledgePoints(sb: SupabaseClient, fromId: string, toId: string): Promise<void> {
  await sb.from("knowledge_point_relations").delete().eq("from_id", fromId).eq("to_id", toId);
  await sb.from("knowledge_point_relations").delete().eq("from_id", toId).eq("to_id", fromId);
}

export async function linkKnowledgePointToLesson(sb: SupabaseClient, lessonId: string, knowledgePointId: string): Promise<void> {
  const { error } = await sb.from("lesson_knowledge_points").insert({ lesson_id: lessonId, knowledge_point_id: knowledgePointId });
  if (error) throw error;
}
export async function unlinkKnowledgePointFromLesson(sb: SupabaseClient, lessonId: string, knowledgePointId: string): Promise<void> {
  await sb.from("lesson_knowledge_points").delete().eq("lesson_id", lessonId).eq("knowledge_point_id", knowledgePointId);
}
export async function listLessonKnowledgePoints(sb: SupabaseClient, lessonId: string): Promise<KnowledgePoint[]> {
  const { data, error } = await sb.from("lesson_knowledge_points").select("knowledge_points(*)").eq("lesson_id", lessonId);
  if (error) return [];
  return (data ?? []).map((r: { knowledge_points: unknown }) => r.knowledge_points).filter(Boolean) as KnowledgePoint[];
}

/** Registra que o aluno abriu esse Ponto de Conhecimento (histórico de navegação). */
export async function logKnowledgePointView(sb: SupabaseClient, knowledgePointId: string, profileId: string): Promise<void> {
  try {
    await sb.from("knowledge_point_views").insert({ profile_id: profileId, knowledge_point_id: knowledgePointId });
  } catch { /* histórico é best-effort, não deve travar a navegação */ }
}

export async function listMyRecentViews(sb: SupabaseClient, profileId: string, limit = 10): Promise<KnowledgePoint[]> {
  const { data, error } = await sb
    .from("knowledge_point_views")
    .select("viewed_at, knowledge_points(*)")
    .eq("profile_id", profileId)
    .order("viewed_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []).map((r: { knowledge_points: unknown }) => r.knowledge_points).filter(Boolean) as KnowledgePoint[];
}

// ---------- Verificação pública de certificado ----------
export interface CertificateVerification {
  certificate_code: string; member_name: string; course_name: string; issued_at: string; valid: boolean;
}
export async function verifyCertificate(sb: SupabaseClient, code: string): Promise<CertificateVerification | null> {
  const { data, error } = await sb.rpc("verify_certificate", { p_code: code });
  if (error || !data || data.length === 0) return null;
  return data[0] as CertificateVerification;
}
