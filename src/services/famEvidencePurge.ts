import type { SupabaseClient } from "@supabase/supabase-js";
import { canFamAttachmentBePurged } from "./famFileGovernance";

export async function purgeExpiredFamEvidence(admin: SupabaseClient, actorUserId: string | null) {
  const cutoff = new Date().toISOString();
  const { data: expired, error } = await admin.from("fam_risk_attachments")
    .select("id, storage_path, case_id, conversation_id, retention_class, legal_hold, retention_expires_at, deleted_at")
    .eq("retention_class", "R1")
    .is("deleted_at", null)
    .eq("legal_hold", false)
    .lt("retention_expires_at", cutoff)
    .limit(100);
  if (error) throw error;

  let deleted = 0;
  let failed = 0;
  for (const attachment of expired ?? []) {
    if (!canFamAttachmentBePurged({
      deletedAt: attachment.deleted_at,
      legalHold: attachment.legal_hold,
      retentionExpiresAt: attachment.retention_expires_at,
    })) continue;
    const { error: storageError } = await admin.storage.from("fam-attachments").remove([attachment.storage_path]);
    if (storageError) { failed += 1; continue; }
    const { error: updateError } = await admin.from("fam_risk_attachments")
      .update({ deleted_at: new Date().toISOString(), deletion_reason: "retention_expired" })
      .eq("id", attachment.id).is("deleted_at", null);
    if (updateError) { failed += 1; continue; }
    await admin.from("fam_audit_events").insert({
      actor_user_id: actorUserId,
      risk_case_id: attachment.case_id ?? null,
      conversation_id: attachment.conversation_id ?? null,
      event_type: "attachment_retention_purged",
      metadata: { attachment_id: attachment.id, reason: "retention_expired" },
    });
    deleted += 1;
  }
  return { scanned: expired?.length ?? 0, deleted, failed, cutoff };
}
