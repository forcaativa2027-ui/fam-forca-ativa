import type { SupabaseClient } from "@supabase/supabase-js";

export type FamKnowledgeStatus =
  | "draft" | "curation" | "under_review" | "approved"
  | "published" | "superseded" | "archived" | "rejected";

export type FamKnowledgeContentType =
  | "guia" | "explicacao" | "faq" | "procedimento" | "politica"
  | "protocolo" | "referencia" | "formulario_servico" | "video" | "documento";

export interface FamKnowledgeContent {
  id: string;
  tenant_key: "FAM";
  content_key: string;
  content_type: FamKnowledgeContentType;
  title: string;
  summary: string;
  body: string;
  language: string;
  audience: string[];
  classification: "publico" | "interno" | "restrito" | "sensivel";
  purpose: string[];
  stage: string[];
  status: FamKnowledgeStatus;
  version: string;
  owner_profile_id: string | null;
  author_profile_id: string | null;
  reviewer_profile_id: string | null;
  approved_by: string | null;
  approval_reference: string | null;
  approved_at: string | null;
  effective_from: string | null;
  effective_until: string | null;
  review_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface FamKnowledgeSource {
  id: string;
  tenant_key: "FAM";
  content_id: string;
  source_type: string;
  source_title: string;
  source_reference: string;
  source_url: string | null;
  issuing_authority: string | null;
  publication_date: string | null;
  verified_at: string | null;
  verified_by: string | null;
  created_at: string;
}

export interface FamKnowledgeTrail {
  id: string;
  tenant_key: "FAM";
  trail_key: string;
  title: string;
  summary: string;
  audience: string[];
  purpose: string[];
  difficulty: "basico" | "intermediario" | "avancado";
  estimated_minutes: number | null;
  status: FamKnowledgeStatus;
  version: string;
  owner_profile_id: string | null;
  approved_by: string | null;
  approval_reference: string | null;
  review_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface FamKnowledgeTrailStep {
  id: string;
  trail_id: string;
  position: number;
  title: string;
  objective: string;
  content_id: string | null;
  action_label: string | null;
  action_url: string | null;
  is_optional: boolean;
}

export interface FamKnowledgeFilters {
  contentType?: FamKnowledgeContentType;
  topic?: string;
  audience?: string;
  stage?: string;
}

export interface FamKnowledgeTransitionOptions {
  notes?: string;
  approvalReference?: string;
  reviewDate?: string;
}

export function validateKnowledgeTransition(
  status: FamKnowledgeStatus,
  options: FamKnowledgeTransitionOptions = {},
): { ok: true } | { ok: false; message: string } {
  if (status === "published") {
    if (!options.approvalReference?.trim()) {
      return { ok: false, message: "A publicação exige a referência do parecer ou ata de aprovação." };
    }
    if (!options.reviewDate?.trim()) {
      return { ok: false, message: "A publicação exige a data da próxima revisão." };
    }
  }
  return { ok: true };
}

function publishedQuery(sb: SupabaseClient) {
  const now = new Date().toISOString();
  return sb
    .from("fam_knowledge_contents")
    .select("*")
    .eq("tenant_key", "FAM")
    .eq("status", "published")
    .eq("classification", "publico")
    .or(`effective_from.is.null,effective_from.lte.${now}`)
    .or(`effective_until.is.null,effective_until.gte.${now}`);
}

export async function listPublishedKnowledgeContents(
  sb: SupabaseClient,
  filters: FamKnowledgeFilters = {},
): Promise<FamKnowledgeContent[]> {
  let query = publishedQuery(sb).order("updated_at", { ascending: false });
  if (filters.contentType) query = query.eq("content_type", filters.contentType);
  if (filters.audience) query = query.contains("audience", [filters.audience]);
  if (filters.topic) query = query.contains("purpose", [filters.topic]);
  if (filters.stage) query = query.contains("stage", [filters.stage]);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as FamKnowledgeContent[];
}

export async function searchPublishedKnowledgeContents(
  sb: SupabaseClient,
  term: string,
): Promise<FamKnowledgeContent[]> {
  const normalized = term.trim().replace(/[%_]/g, " ");
  if (!normalized) return listPublishedKnowledgeContents(sb);
  const { data, error } = await publishedQuery(sb)
    .or(`title.ilike.%${normalized}%,summary.ilike.%${normalized}%,body.ilike.%${normalized}%`)
    .order("updated_at", { ascending: false })
    .limit(30);
  if (error) throw error;
  return (data ?? []) as FamKnowledgeContent[];
}

export async function getPublishedKnowledgeContent(
  sb: SupabaseClient,
  contentKey: string,
): Promise<FamKnowledgeContent | null> {
  const { data, error } = await publishedQuery(sb)
    .eq("content_key", contentKey)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as FamKnowledgeContent | null) ?? null;
}

export async function listKnowledgeSources(sb: SupabaseClient, contentId: string): Promise<FamKnowledgeSource[]> {
  const { data, error } = await sb.from("fam_knowledge_sources").select("*").eq("content_id", contentId).order("publication_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as FamKnowledgeSource[];
}

export async function listPublishedKnowledgeTrails(sb: SupabaseClient): Promise<FamKnowledgeTrail[]> {
  const { data, error } = await sb.from("fam_knowledge_trails").select("*").eq("tenant_key", "FAM").eq("status", "published").order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as FamKnowledgeTrail[];
}

export async function getPublishedKnowledgeTrail(sb: SupabaseClient, trailKey: string) {
  const { data: trail, error: trailError } = await sb.from("fam_knowledge_trails").select("*").eq("tenant_key", "FAM").eq("trail_key", trailKey).eq("status", "published").maybeSingle();
  if (trailError) throw trailError;
  if (!trail) return null;
  const { data: steps, error: stepsError } = await sb.from("fam_knowledge_trail_steps").select("*").eq("trail_id", trail.id).order("position");
  if (stepsError) throw stepsError;
  return { trail: trail as FamKnowledgeTrail, steps: (steps ?? []) as FamKnowledgeTrailStep[] };
}

export async function listKnowledgeContentsForCurator(sb: SupabaseClient, status?: FamKnowledgeStatus) {
  let query = sb.from("fam_knowledge_contents").select("*").eq("tenant_key", "FAM").order("updated_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as FamKnowledgeContent[];
}

export async function createKnowledgeContent(sb: SupabaseClient, input: Partial<FamKnowledgeContent> & Pick<FamKnowledgeContent, "content_key" | "content_type" | "title">) {
  const { data, error } = await sb.from("fam_knowledge_contents").insert({
    tenant_key: "FAM", status: "draft", summary: "", body: "", version: "1.0",
    ...input,
  }).select("*").single();
  if (error) throw error;
  return data as FamKnowledgeContent;
}

export async function updateKnowledgeContent(sb: SupabaseClient, id: string, patch: Partial<FamKnowledgeContent>) {
  const { data: current, error: currentError } = await sb.from("fam_knowledge_contents").select("version").eq("id", id).single();
  if (currentError) throw currentError;
  const nextVersion = Number.parseFloat(current.version ?? "1.0") + 0.1;
  const { data, error } = await sb.from("fam_knowledge_contents").update({ ...patch, version: nextVersion.toFixed(1), updated_at: new Date().toISOString() }).eq("id", id).select("*").single();
  if (error) throw error;
  return data as FamKnowledgeContent;
}

export async function transitionKnowledgeContent(
  sb: SupabaseClient,
  id: string,
  status: FamKnowledgeStatus,
  actorProfileId: string,
  options: FamKnowledgeTransitionOptions = {},
) {
  const validation = validateKnowledgeTransition(status, options);
  if (!validation.ok) throw new Error(validation.message);

  const { data: current, error: currentError } = await sb.from("fam_knowledge_contents").select("status, version").eq("id", id).single();
  if (currentError) throw currentError;
  const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (status === "approved" || status === "published") {
    patch.approved_by = actorProfileId;
    patch.approved_at = new Date().toISOString();
  }
  if (options.approvalReference) patch.approval_reference = options.approvalReference.trim();
  if (options.reviewDate) patch.review_date = options.reviewDate;
  const { error } = await sb.from("fam_knowledge_contents").update(patch).eq("id", id);
  if (error) throw error;
  const { error: auditError } = await sb.from("fam_knowledge_audit_events").insert({
    tenant_key: "FAM", content_id: id, actor_profile_id: actorProfileId,
    event_type: status === "under_review" ? "submitted" : status,
    from_status: current.status, to_status: status, version: current.version, notes: options.notes ?? null,
  });
  if (auditError) throw auditError;
}
