"use client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  KidsGroup, KidsDependent, KidsGuardian, KidsAuthorizedPerson, KidsTerminology,
  GuardianRelationship, AuthorizationScope,
} from "@/types/domain";

// ---------- Turmas ----------
export async function listGroups(sb: SupabaseClient, churchId: string): Promise<KidsGroup[]> {
  const { data, error } = await sb.from("kids_groups").select("*").eq("church_id", churchId).eq("is_active", true).order("min_age");
  if (error) { console.error("[kids] listGroups", error); return []; }
  return (data ?? []) as KidsGroup[];
}
export async function createGroup(sb: SupabaseClient, input: { church_id: string; name: string; min_age?: number; max_age?: number; description?: string }): Promise<string> {
  const { data, error } = await sb.from("kids_groups").insert(input).select("id").single();
  if (error) throw error;
  return data.id as string;
}
export async function updateGroup(sb: SupabaseClient, id: string, patch: Partial<KidsGroup>): Promise<void> {
  const { error } = await sb.from("kids_groups").update(patch).eq("id", id);
  if (error) throw error;
}
export async function deleteGroup(sb: SupabaseClient, id: string): Promise<void> {
  await sb.from("kids_groups").update({ is_active: false }).eq("id", id);
}

// ---------- Dependentes (Crianças) ----------
export async function listDependents(sb: SupabaseClient, churchId: string): Promise<KidsDependent[]> {
  const { data, error } = await sb.from("kids_dependents").select("*").eq("church_id", churchId).eq("is_active", true).order("full_name");
  if (error) { console.error("[kids] listDependents", error); return []; }
  return (data ?? []) as KidsDependent[];
}
/** Crianças das quais o usuário logado é responsável (guardian). */
export async function listMyDependents(sb: SupabaseClient, profileId: string): Promise<KidsDependent[]> {
  const { data, error } = await sb.from("kids_guardians").select("kids_dependents(*)").eq("profile_id", profileId);
  if (error) { console.error("[kids] listMyDependents", error); return []; }
  return (data ?? []).map((r: { kids_dependents: unknown }) => r.kids_dependents).filter(Boolean) as KidsDependent[];
}
export async function getDependent(sb: SupabaseClient, id: string): Promise<KidsDependent | null> {
  const { data } = await sb.from("kids_dependents").select("*").eq("id", id).maybeSingle();
  return data as KidsDependent | null;
}
export interface DependentInput {
  church_id: string; full_name: string; preferred_name?: string; birth_date?: string;
  photo_url?: string; default_group_id?: string; health_notes?: string; special_needs?: string; created_by?: string;
}
export async function createDependent(sb: SupabaseClient, input: DependentInput): Promise<string> {
  const { data, error } = await sb.from("kids_dependents").insert(input).select("id").single();
  if (error) throw error;
  return data.id as string;
}
export async function updateDependent(sb: SupabaseClient, id: string, patch: Partial<DependentInput>): Promise<void> {
  const { error } = await sb.from("kids_dependents").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}
export async function deactivateDependent(sb: SupabaseClient, id: string): Promise<void> {
  await sb.from("kids_dependents").update({ is_active: false }).eq("id", id);
}

// ---------- Responsáveis (Guardian) ----------
export async function listGuardians(sb: SupabaseClient, dependentId: string): Promise<(KidsGuardian & { profile_name?: string })[]> {
  const { data, error } = await sb.from("kids_guardians").select("*, profiles(full_name)").eq("dependent_id", dependentId);
  if (error) { console.error("[kids] listGuardians", error); return []; }
  return (data ?? []).map((r: unknown) => {
    const row = r as KidsGuardian & { profiles?: { full_name?: string } | null };
    return { ...row, profile_name: row.profiles?.full_name };
  });
}
export async function addGuardian(sb: SupabaseClient, input: { dependent_id: string; profile_id: string; relationship: GuardianRelationship; is_primary?: boolean }): Promise<void> {
  const { error } = await sb.from("kids_guardians").insert(input);
  if (error) throw error;
}
export async function removeGuardian(sb: SupabaseClient, id: string): Promise<void> {
  await sb.from("kids_guardians").delete().eq("id", id);
}

// ---------- Pessoas Autorizadas (retirada — separado de Guardian) ----------
export async function listAuthorizedPersons(sb: SupabaseClient, dependentId: string): Promise<KidsAuthorizedPerson[]> {
  const { data, error } = await sb.from("kids_authorized_persons").select("*").eq("dependent_id", dependentId).order("created_at", { ascending: false });
  if (error) { console.error("[kids] listAuthorizedPersons", error); return []; }
  return (data ?? []) as KidsAuthorizedPerson[];
}
export interface AuthorizedPersonInput {
  dependent_id: string; authorized_by: string; authorized_profile_id?: string;
  full_name: string; document_number?: string; phone?: string; photo_url?: string;
  relationship_label?: string; scope?: AuthorizationScope; valid_until?: string;
}
export async function addAuthorizedPerson(sb: SupabaseClient, input: AuthorizedPersonInput): Promise<void> {
  const { error } = await sb.from("kids_authorized_persons").insert(input);
  if (error) throw error;
}
export async function revokeAuthorizedPerson(sb: SupabaseClient, id: string, revokedBy: string): Promise<void> {
  const { error } = await sb.from("kids_authorized_persons").update({
    status: "revoked", revoked_by: revokedBy, revoked_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) throw error;
}

// ---------- Terminologia (leve — conceito → termo escolhido pela igreja) ----------
export async function getTerminology(sb: SupabaseClient, churchId: string): Promise<Record<string, KidsTerminology>> {
  const { data, error } = await sb.from("kids_terminology").select("*").eq("church_id", churchId);
  if (error) return {};
  const map: Record<string, KidsTerminology> = {};
  for (const row of (data ?? []) as KidsTerminology[]) map[row.concept_key] = row;
  return map;
}
export async function setTerminology(sb: SupabaseClient, input: KidsTerminology): Promise<void> {
  const { error } = await sb.from("kids_terminology").upsert(input, { onConflict: "church_id,concept_key" });
  if (error) throw error;
}

// ---------- Superfície Família — autocadastro (membro ou visitante logado) ----------
export interface SelfRegisterDependentInput {
  church_id: string; full_name: string; preferred_name?: string; birth_date?: string;
  health_notes?: string; special_needs?: string; relationship?: GuardianRelationship;
}
export async function selfRegisterDependent(sb: SupabaseClient, input: SelfRegisterDependentInput): Promise<string> {
  const { data, error } = await sb.rpc("kids_self_register_dependent", {
    p_church_id: input.church_id, p_full_name: input.full_name, p_preferred_name: input.preferred_name ?? null,
    p_birth_date: input.birth_date ?? null, p_health_notes: input.health_notes ?? null,
    p_special_needs: input.special_needs ?? null, p_relationship: input.relationship ?? "outro",
  });
  if (error) throw error;
  return data as string;
}
export async function selfAuthorizePerson(sb: SupabaseClient, input: {
  dependent_id: string; full_name: string; phone?: string; document_number?: string;
  relationship_label?: string; scope?: AuthorizationScope;
}): Promise<string> {
  const { data, error } = await sb.rpc("kids_self_authorize_person", {
    p_dependent_id: input.dependent_id, p_full_name: input.full_name, p_phone: input.phone ?? null,
    p_document_number: input.document_number ?? null, p_relationship_label: input.relationship_label ?? null,
    p_scope: input.scope ?? "permanent",
  });
  if (error) throw error;
  return data as string;
}
