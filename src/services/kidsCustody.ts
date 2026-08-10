"use client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { KidsCustodySession, KidsDependentStatus, CustodySessionStatus } from "@/types/domain";

// ---------- Sessões de Custódia ----------
export async function listSessions(sb: SupabaseClient, churchId: string): Promise<KidsCustodySession[]> {
  const { data, error } = await sb.from("kids_custody_sessions").select("*").eq("church_id", churchId).order("starts_at", { ascending: false });
  if (error) { console.error("[kids] listSessions", error); return []; }
  return (data ?? []) as KidsCustodySession[];
}
export async function listOpenSessions(sb: SupabaseClient, churchId: string): Promise<KidsCustodySession[]> {
  const { data, error } = await sb.from("kids_custody_sessions").select("*").eq("church_id", churchId).eq("status", "open").order("starts_at");
  if (error) return [];
  return (data ?? []) as KidsCustodySession[];
}
export interface SessionInput {
  church_id: string; group_id?: string; name: string; starts_at: string; ends_at?: string; capacity?: number; created_by?: string;
}
export async function createSession(sb: SupabaseClient, input: SessionInput): Promise<string> {
  const { data, error } = await sb.from("kids_custody_sessions").insert(input).select("id").single();
  if (error) throw error;
  return data.id as string;
}
export async function setSessionStatus(sb: SupabaseClient, id: string, status: CustodySessionStatus): Promise<void> {
  const { error } = await sb.from("kids_custody_sessions").update({ status }).eq("id", id);
  if (error) throw error;
}

// ---------- Check-in ----------
export async function checkIn(sb: SupabaseClient, dependentId: string, sessionId: string, deliveredBy?: string, entryNotes?: string): Promise<string> {
  const { data, error } = await sb.rpc("kids_check_in", {
    p_dependent_id: dependentId, p_session_id: sessionId, p_delivered_by: deliveredBy ?? null, p_entry_notes: entryNotes ?? null,
  });
  if (error) throw error;
  return data as string;
}

/** Todos os registros de custódia de uma sessão (visão do operador, tela de check-in). */
export async function listSessionCustody(sb: SupabaseClient, sessionId: string) {
  const { data, error } = await sb.from("kids_custody_records").select("*, kids_dependents(full_name, preferred_name, photo_url, health_notes, special_needs)").eq("session_id", sessionId);
  if (error) { console.error("[kids] listSessionCustody", error); return []; }
  return data ?? [];
}

// ---------- Solicitar retirada ----------
export async function requestPickup(sb: SupabaseClient, custodyRecordId: string): Promise<void> {
  const { error } = await sb.rpc("kids_request_pickup", { p_custody_record_id: custodyRecordId });
  if (error) throw error;
}

// ---------- Estado das crianças do responsável (Superfície Família) ----------
export async function getMyDependentsStatus(sb: SupabaseClient, profileId: string): Promise<KidsDependentStatus[]> {
  const { data, error } = await sb.rpc("get_my_dependents_status", { p_profile_id: profileId });
  if (error) { console.error("[kids] getMyDependentsStatus", error); return []; }
  return (data ?? []) as KidsDependentStatus[];
}

// ---------- Handoff (retirada, com conferência humana obrigatória) ----------
export interface HandoffInput {
  custody_record_id: string;
  pickup_authorized_person_id?: string;  // ou isso...
  pickup_guardian_id?: string;           // ...ou isso (nunca os dois)
  claim_code?: string;
  notes?: string;
}
export async function handoff(sb: SupabaseClient, input: HandoffInput): Promise<string> {
  const { data, error } = await sb.rpc("kids_handoff", {
    p_custody_record_id: input.custody_record_id,
    p_pickup_authorized_person_id: input.pickup_authorized_person_id ?? null,
    p_pickup_guardian_id: input.pickup_guardian_id ?? null,
    p_claim_code: input.claim_code ?? null,
    p_notes: input.notes ?? null,
  });
  if (error) throw error;
  return data as string;
}
