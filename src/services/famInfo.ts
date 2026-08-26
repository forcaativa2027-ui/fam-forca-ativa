import type { SupabaseClient } from "@supabase/supabase-js";

export interface FamInfoArticle {
  id: string;
  slug: string;
  category: string;
  status: "draft" | "in_review" | "published" | "archived";
  current_version: number;
  published_at: string | null;
  version?: FamInfoArticleVersion | null;
}

export interface FamInfoArticleVersion {
  id: string;
  article_id: string;
  version: number;
  title: string;
  summary: string | null;
  body: string;
  language: string;
  created_at: string;
  sources?: FamInfoSource[];
}

export interface FamInfoSource {
  id: string;
  title: string;
  url: string | null;
  publisher: string | null;
  accessed_at: string | null;
}

export async function listPublishedFamInfo(sb: SupabaseClient): Promise<FamInfoArticle[]> {
  const { data, error } = await sb.from("fam_info_articles")
    .select("id, slug, category, status, current_version, published_at, fam_info_article_versions!inner(id, article_id, version, title, summary, body, language, created_at)")
    .eq("status", "published")
    .order("category")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row: any) => ({ ...row, version: row.fam_info_article_versions?.[0] ?? null })) as FamInfoArticle[];
}

export async function getPublishedFamInfo(sb: SupabaseClient, slug: string): Promise<FamInfoArticle | null> {
  const { data, error } = await sb.from("fam_info_articles")
    .select("id, slug, category, status, current_version, published_at, fam_info_article_versions!inner(id, article_id, version, title, summary, body, language, created_at, fam_info_sources(id, title, url, publisher, accessed_at))")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error || !data) return null;
  const row: any = data;
  return { ...row, version: row.fam_info_article_versions?.[0] ?? null } as FamInfoArticle;
}
