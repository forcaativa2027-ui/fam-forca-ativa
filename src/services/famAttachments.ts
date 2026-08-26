import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export interface FamAttachment {
  id: string;
  case_id: string | null;
  conversation_id: string | null;
  storage_path: string;
  original_name: string;
  media_type: string;
  byte_size: number;
  malware_scan_status: 'pending' | 'clean' | 'infected' | 'error';
  uploaded_by: string | null;
  created_at: string;
  scan_engine?: string | null;
  scan_attempted_at?: string | null;
  scanned_at?: string | null;
  quarantined_at?: string | null;
  sha256?: string | null;
  retention_expires_at?: string | null;
  legal_hold?: boolean;
  deleted_at?: string | null;
  deletion_reason?: string | null;
}

export async function uploadAttachment(
  sb: SupabaseClient,
  data: {
    file: File;
    userId: string;
    caseId?: string;
    conversationId?: string;
  }
): Promise<FamAttachment> {
  const MAX_BYTES = 50 * 1024 * 1024;
  const allowedType = /^(image\/(jpeg|png|webp|gif)|application\/pdf|audio\/(mpeg|wav|ogg|webm)|video\/(mp4|webm|quicktime)|text\/plain)$/.test(data.file.type);
  if (data.file.size <= 0 || data.file.size > MAX_BYTES) {
    throw new Error("O arquivo deve ter entre 1 byte e 50 MB.");
  }
  if (!allowedType) {
    throw new Error("Tipo de arquivo não permitido. Use PDF, imagem, áudio ou vídeo compatível.");
  }
  const ext = data.file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
  const path = `${data.userId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await sb.storage
    .from('fam-attachments')
    .upload(path, data.file, { contentType: data.file.type });
  if (uploadError) throw uploadError;

  const { data: attachment, error } = await sb
    .from('fam_risk_attachments')
    .insert({
      case_id: data.caseId ?? null,
      conversation_id: data.conversationId ?? null,
      uploaded_by: data.userId,
      storage_path: path,
      original_name: data.file.name,
      media_type: data.file.type,
      byte_size: data.file.size,
      malware_scan_status: 'pending',
    })
    .select('*')
    .single();
  if (error) throw error;
  return attachment as FamAttachment;
}

export async function getAttachmentUrl(
  sb: SupabaseClient,
  storagePath: string
): Promise<string> {
  const { data: attachment, error: metadataError } = await sb
    .from('fam_risk_attachments')
    .select('malware_scan_status, deleted_at')
    .eq('storage_path', storagePath)
    .maybeSingle();
  if (metadataError || !attachment || attachment.deleted_at || attachment.malware_scan_status !== 'clean') return '';
  const { data } = await sb.storage
    .from('fam-attachments')
    .createSignedUrl(storagePath, 3600);
  return data?.signedUrl ?? '';
}

export async function listCaseAttachments(
  sb: SupabaseClient,
  caseId: string
): Promise<FamAttachment[]> {
  const { data, error } = await sb
    .from('fam_risk_attachments')
    .select('*')
    .eq('case_id', caseId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as FamAttachment[];
}

export async function listConversationAttachments(
  sb: SupabaseClient,
  conversationId: string
): Promise<FamAttachment[]> {
  const { data, error } = await sb
    .from("fam_risk_attachments")
    .select("*")
    .eq("conversation_id", conversationId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as FamAttachment[];
}
