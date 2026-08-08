"use client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  KnowledgeObject, KnowledgeObjectDetail, KnowledgeObjectRelated, KnowledgeObjectType,
  KnowledgeObjectStatus, KnowledgeObjectScope, CentralEstudosItem,
} from "@/types/domain";

export async function listKnowledgeObjects(sb: SupabaseClient, filters?: { type?: KnowledgeObjectType; status?: KnowledgeObjectStatus }): Promise<KnowledgeObject[]> {
  let q = sb.from("knowledge_objects").select("*").order("created_at", { ascending: false });
  if (filters?.type) q = q.eq("object_type", filters.type);
  if (filters?.status) q = q.eq("status", filters.status);
  const { data, error } = await q;
  if (error) { console.error("[library] listKnowledgeObjects", error); return []; }
  return (data ?? []) as KnowledgeObject[];
}

export async function searchKnowledgeObjects(sb: SupabaseClient, term: string): Promise<KnowledgeObject[]> {
  const { data, error } = await sb.from("knowledge_objects").select("*")
    .or(`title.ilike.%${term}%,description.ilike.%${term}%,cid.ilike.%${term}%,author.ilike.%${term}%`)
    .limit(30);
  if (error) return [];
  return (data ?? []) as KnowledgeObject[];
}

export async function getKnowledgeObjectDetail(sb: SupabaseClient, id: string): Promise<KnowledgeObjectDetail | null> {
  const { data, error } = await sb.rpc("get_knowledge_object_detail", { p_id: id });
  if (error || !data || data.length === 0) return null;
  const first = data[0];
  const related: KnowledgeObjectRelated[] = data
    .filter((r: { related_id: string | null }) => r.related_id)
    .map((r: { related_id: string; related_title: string; related_type: KnowledgeObjectType; related_label: string | null }) => ({
      related_id: r.related_id, related_title: r.related_title, related_type: r.related_type, related_label: r.related_label,
    }));
  return { ...(first as KnowledgeObject), related };
}

export interface KnowledgeObjectInput {
  title: string; description?: string; object_type: KnowledgeObjectType;
  language?: string; author?: string; institution?: string; publisher?: string; year?: number;
  storage_url?: string; external_url?: string; thumbnail_url?: string;
  escola_id?: string; jornada_id?: string; programa_id?: string;
  course_id?: string; module_id?: string; lesson_id?: string;
  education_level?: string; target_audience?: string; bible_refs?: string;
  license?: string; rights_origin?: string;
  download_allowed?: boolean; share_allowed?: boolean; print_allowed?: boolean;
  status?: KnowledgeObjectStatus; scope?: KnowledgeObjectScope;
  created_by?: string;
}
export async function createKnowledgeObject(sb: SupabaseClient, input: KnowledgeObjectInput): Promise<string> {
  const { data, error } = await sb.from("knowledge_objects").insert(input).select("id").single();
  if (error) throw error;
  return data.id as string;
}
export async function updateKnowledgeObject(sb: SupabaseClient, id: string, patch: Partial<KnowledgeObjectInput>, changedBy?: string, changeNotes?: string): Promise<void> {
  const { data: current } = await sb.from("knowledge_objects").select("version, storage_url, external_url").eq("id", id).maybeSingle();
  const nextVersion = (current?.version ?? 1) + 1;
  const { error } = await sb.from("knowledge_objects").update({ ...patch, version: nextVersion, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
  // Registra a versão anterior no histórico, antes da troca
  if (current) {
    await sb.from("knowledge_object_versions").insert({
      object_id: id, version_number: current.version, storage_url: current.storage_url,
      external_url: current.external_url, change_notes: changeNotes ?? null, changed_by: changedBy ?? null,
    });
  }
}
export async function deleteKnowledgeObject(sb: SupabaseClient, id: string): Promise<void> {
  const { error } = await sb.from("knowledge_objects").delete().eq("id", id);
  if (error) throw error;
}
export async function setKnowledgeObjectStatus(sb: SupabaseClient, id: string, status: KnowledgeObjectStatus, curatorId?: string, notes?: string): Promise<void> {
  const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (status === "em_curadoria" && curatorId) patch.curated_by = curatorId;
  if (notes) patch.curator_notes = notes;
  if (status === "publicado" || status === "atualizado") { patch.approved_by = curatorId ?? null; patch.approved_at = new Date().toISOString(); }
  const { error } = await sb.from("knowledge_objects").update(patch).eq("id", id);
  if (error) throw error;
}

export async function listVersionHistory(sb: SupabaseClient, objectId: string) {
  const { data, error } = await sb.from("knowledge_object_versions").select("*").eq("object_id", objectId).order("version_number", { ascending: false });
  if (error) return [];
  return data ?? [];
}

export async function relateKnowledgeObjects(sb: SupabaseClient, fromId: string, toId: string, label?: string): Promise<void> {
  const { error } = await sb.from("knowledge_object_relations").insert({ from_id: fromId, to_id: toId, label: label ?? null });
  if (error) throw error;
}
export async function unrelateKnowledgeObjects(sb: SupabaseClient, fromId: string, toId: string): Promise<void> {
  await sb.from("knowledge_object_relations").delete().eq("from_id", fromId).eq("to_id", toId);
  await sb.from("knowledge_object_relations").delete().eq("from_id", toId).eq("to_id", fromId);
}

export async function linkObjectToLesson(sb: SupabaseClient, lessonId: string, objectId: string): Promise<void> {
  const { error } = await sb.from("lesson_knowledge_objects").insert({ lesson_id: lessonId, object_id: objectId });
  if (error) throw error;
}
export async function unlinkObjectFromLesson(sb: SupabaseClient, lessonId: string, objectId: string): Promise<void> {
  await sb.from("lesson_knowledge_objects").delete().eq("lesson_id", lessonId).eq("object_id", objectId);
}
export async function listLessonObjects(sb: SupabaseClient, lessonId: string): Promise<KnowledgeObject[]> {
  const { data, error } = await sb.from("lesson_knowledge_objects").select("knowledge_objects(*)").eq("lesson_id", lessonId);
  if (error) return [];
  return (data ?? []).map((r: { knowledge_objects: unknown }) => r.knowledge_objects).filter(Boolean) as KnowledgeObject[];
}

/** Central de Estudos — tudo que já foi vinculado (objetos + pontos de conhecimento) a uma lição, automaticamente. */
export async function getCentralEstudos(sb: SupabaseClient, lessonId: string): Promise<CentralEstudosItem[]> {
  const { data, error } = await sb.rpc("get_central_estudos", { p_lesson_id: lessonId });
  if (error) { console.error("[library] getCentralEstudos", error); return []; }
  return (data ?? []) as CentralEstudosItem[];
}
