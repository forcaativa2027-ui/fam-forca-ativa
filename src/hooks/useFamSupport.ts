cat >> /home/paulo/Documentos/Default\ Project/cec-painel/src/hooks/useFamSupport.ts << 'EOF'

// ===== Attachments =====
import { uploadAttachment, getAttachmentUrl, listCaseAttachments } from "@/services/famAttachments";
import type { FamAttachment } from "@/services/famAttachments";

export function useFamAttachments() {
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File, userId: string, caseId?: string, conversationId?: string) => {
    setUploading(true);
    try {
      const att = await uploadAttachment(supabase, { file, userId, caseId, conversationId });
      return att;
    } finally {
      setUploading(false);
    }
  };

  const getUrl = async (storagePath: string) => {
    return getAttachmentUrl(supabase, storagePath);
  };

  const listForCase = async (caseId: string) => {
    return listCaseAttachments(supabase, caseId);
  };

  return { upload, getUrl, listForCase, uploading };
}
EOF

// ===== Attachments =====
import { uploadAttachment, getAttachmentUrl, listCaseAttachments } from "@/services/famAttachments";
import type { FamAttachment } from "@/services/famAttachments";

export function useFamAttachments() {
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File, userId: string, caseId?: string, conversationId?: string) => {
    setUploading(true);
    try {
      const att = await uploadAttachment(supabase, { file, userId, caseId, conversationId });
      return att;
    } finally {
      setUploading(false);
    }
  };

  const getUrl = async (storagePath: string) => {
    return getAttachmentUrl(supabase, storagePath);
  };

  const listForCase = async (caseId: string) => {
    return listCaseAttachments(supabase, caseId);
  };

  return { upload, getUrl, listForCase, uploading };
}
