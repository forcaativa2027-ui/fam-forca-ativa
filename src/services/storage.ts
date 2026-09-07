import { supabase } from "@/lib/supabase/client";

const BUCKET = "content-library";

export async function uploadContentLibraryFile(
  file: File,
  folder: string
): Promise<{ url: string; path: string } | { error: string }> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  const fileName = `${timestamp}-${random}.${ext}`;
  const path = `${folder}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false });

  if (uploadError) return { error: uploadError.message };

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

export async function deleteContentLibraryFile(path: string): Promise<void> {
  await supabase.storage.from(BUCKET).remove([path]);
}

export function getContentLibraryPublicUrl(path: string): string {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export function validateFile(file: File): string | null {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return `Tipo de arquivo não permitido: ${file.type}. Permitidos: imagens, vídeos (MP4/WebM), PDF, DOC/DOCX.`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `Arquivo muito grande (máx. 100MB).`;
  }
  return null;
}

export function getFolderForType(type: string): string {
  switch (type) {
    case "imagem":
    case "logo":
      return "imagens";
    case "video_youtube":
    case "arquivo":
      return "videos";
    case "documento":
      return "documentos";
    default:
      return "outros";
  }
}