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
  const ext = data.file.name.split('.').pop()?.toLowerCase() || 'bin';
  const path = `${data.userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error: uploadError } = await sb.storage
    .from('fam-attachments')
    .upload(path, data.file, { contentType: data.file.type });
  if (uploadError) throw uploadError;

  const { data: attachment, error } = await sb
    .from('fam_risk_attachments')
    .insert({
      case_id: data.caseId,
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
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as FamAttachment[];
}

export async function listConversationAttachments(
  sb: SupabaseClient,
  conversationId: string
): Promise<FamAttachment[]> {
  return [];
}
