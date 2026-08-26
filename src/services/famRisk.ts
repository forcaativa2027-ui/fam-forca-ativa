import type { SupabaseClient } from "@supabase/supabase-js";
import { FAM_RISK_ENGINE_VERSION } from "@/services/famRiskEngine";

export interface FamRiskCase {
  id: string;
  public_reference: string;
  user_id: string | null;
  community_id: string | null;
  contact_name: string | null;
  consented_at: string;
  attention: 'immediate' | 'relevant' | 'specialized' | 'insufficient_information' | null;
  preliminary_summary: string | null;
  limitations_acknowledged_at: string | null;
  referred_conversation_id: string | null;
  created_at: string;
  updated_at: string;
  assessment_status?: string;
  current_step?: string | null;
  risk_engine_version?: string | null;
  special_flow_flags?: string[];
  triggered_indicators?: string[];
  assessment_state?: string | null;
  transition_reason_code?: string | null;
  transition_rule_code?: string | null;
}

export interface FamRiskAnswer {
  id: string;
  case_id: string;
  question_key: string;
  answer: string;
  created_at: string;
}

export interface FamRiskAttachment {
  id: string;
  case_id: string;
  storage_path: string;
  original_name: string | null;
  media_type: string;
  byte_size: number;
  malware_scan_status: string;
  created_at: string;
}

export async function createRiskCase(
  sb: SupabaseClient,
  data: { user_id: string; community_id?: string; contact_name?: string }
): Promise<FamRiskCase> {
  const { data: riskCase, error } = await sb
    .from("fam_risk_cases")
    .insert({
      user_id: data.user_id,
      community_id: data.community_id,
      contact_name: data.contact_name,
      consented_at: new Date().toISOString(),
    })
    .select("*")
    .single();
  if (error) throw error;
  return riskCase as FamRiskCase;
}

export async function saveRiskAnswers(
  sb: SupabaseClient,
  caseId: string,
  answers: Record<string, string>
): Promise<FamRiskAnswer[]> {
  const rows = Object.entries(answers).map(([question_key, answer]) => ({
    case_id: caseId,
    question_key,
    answer,
  }));
  const { data, error } = await sb
    .from("fam_risk_answers")
    .upsert(rows, { onConflict: "case_id,question_key" })
    .select("*");
  if (error) throw error;
  return (data ?? []) as FamRiskAnswer[];
}

export async function updateRiskCaseAssessment(
  sb: SupabaseClient,
  caseId: string,
  assessment: {
    attention: FamRiskCase["attention"];
    preliminary_summary: string;
    limitations_acknowledged_at: string;
    current_step?: string;
    special_flow_flags?: string[];
    triggered_indicators?: string[];
    assessment_state?: string;
    transition_reason_code?: string;
    transition_rule_code?: string;
    referred_conversation_id?: string;
  }
): Promise<FamRiskCase> {
  const { data: before, error: beforeError } = await sb
    .from("fam_risk_cases")
    .select("id, user_id, state")
    .eq("id", caseId)
    .single();
  if (beforeError) throw beforeError;

  const nextState = assessment.assessment_state ?? "RESULT";
  const now = new Date().toISOString();
  const { data, error } = await sb
    .from("fam_risk_cases")
    .update({
      attention: assessment.attention,
      preliminary_summary: assessment.preliminary_summary,
      limitations_acknowledged_at: assessment.limitations_acknowledged_at,
      state: nextState,
      triggered_rules: assessment.transition_rule_code ? [assessment.transition_rule_code] : [],
      signals: assessment.triggered_indicators ?? [],
      special_flows: assessment.special_flow_flags ?? [],
      emergency_flag: assessment.attention === "immediate",
      completed_at: now,
      referred_conversation_id: assessment.referred_conversation_id ?? null,
    })
    .eq("id", caseId)
    .select("*")
    .single();
  if (error) throw error;

  const previousState = before?.state ?? "INITIAL";
  if (previousState !== nextState) {
    const { error: historyError } = await sb.from("fam_assessment_state_history").insert({
      risk_case_id: caseId,
      from_state: previousState,
      to_state: nextState,
      reason_code: assessment.transition_reason_code ?? "ASSESSMENT_COMPLETED",
      rule_code: assessment.transition_rule_code ?? null,
      triggered_by: "system",
      metadata: { engine_version: FAM_RISK_ENGINE_VERSION },
    });
    if (historyError) throw historyError;
  }

  if (before?.user_id) {
    const { error: auditError } = await sb.from("fam_audit_events").insert({
      actor_user_id: before.user_id,
      case_id: caseId,
      event_type: "ASSESSMENT_COMPLETED",
      metadata: {
        from_state: previousState,
        to_state: nextState,
        engine_version: FAM_RISK_ENGINE_VERSION,
        rule_code: assessment.transition_rule_code ?? null,
      },
    });
    if (auditError) throw auditError;
  }

  return data as FamRiskCase;
}

export async function getRiskCase(
  sb: SupabaseClient,
  caseId: string
): Promise<FamRiskCase | null> {
  const { data, error } = await sb
    .from("fam_risk_cases")
    .select("*")
    .eq("id", caseId)
    .maybeSingle();
  if (error) throw error;
  return data as FamRiskCase | null;
}

export async function getRiskAnswers(
  sb: SupabaseClient,
  caseId: string
): Promise<FamRiskAnswer[]> {
  const { data, error } = await sb
    .from("fam_risk_answers")
    .select("*")
    .eq("case_id", caseId);
  if (error) throw error;
  return (data ?? []) as FamRiskAnswer[];
}
