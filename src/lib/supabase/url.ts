/**
 * O cliente Supabase recebe a origem do projeto, não um endpoint de recurso.
 * Corrige configurações antigas que tenham sido cadastradas com /rest/v1,
 * /auth/v1, /storage/v1 ou /realtime/v1.
 */
export function normalizeSupabaseUrl(rawUrl: string): string {
  let url = rawUrl.trim().replace(/\/+$/, "");
  url = url.replace(/\/(?:rest\/v1|auth\/v1|storage\/v1|realtime\/v1)$/i, "");
  return url;
}
