import type { SupabaseClient } from "@supabase/supabase-js";
import type { ContentWorkflowState, ContentWorkflowStatus, ContentPendingReview } from "@/types/domain";

export async function getContentWorkflowState(sb: SupabaseClient, entityType: string, entityId: string): Promise<ContentWorkflowState | null> {
  const { data, error } = await sb.rpc("get_content_workflow_state", { p_entity_type: entityType, p_entity_id: entityId }).maybeSingle();
  if (error) return null;
  return data as ContentWorkflowState | null;
}

export async function submitContentForReview(sb: SupabaseClient, entityType: string, entityId: string): Promise<void> {
  const { error } = await sb.rpc("submit_content_for_review", { p_entity_type: entityType, p_entity_id: entityId });
  if (error) throw error;
}

export async function reviewContent(sb: SupabaseClient, entityType: string, entityId: string, approved: boolean, note: string | null): Promise<void> {
  const { error } = await sb.rpc("review_content", { p_entity_type: entityType, p_entity_id: entityId, p_approved: approved, p_note: note });
  if (error) throw error;
}

export async function setContentWorkflowStatus(sb: SupabaseClient, entityType: string, entityId: string, status: ContentWorkflowStatus): Promise<void> {
  const { error } = await sb.rpc("set_content_workflow_status", { p_entity_type: entityType, p_entity_id: entityId, p_status: status });
  if (error) throw error;
}

export async function listContentPendingReview(sb: SupabaseClient): Promise<ContentPendingReview[]> {
  const { data, error } = await sb.rpc("list_content_pending_review");
  if (error) return [];
  return (data ?? []) as ContentPendingReview[];
}
