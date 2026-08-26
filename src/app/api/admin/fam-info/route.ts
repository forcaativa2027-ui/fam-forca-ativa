import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { adminClient } from "@/lib/supabase/admin";

async function caller(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token || !url || !anon) return null;
  const verifier = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: { user } } = await verifier.auth.getUser();
  if (!user) return null;
  const admin = adminClient();
  const { data } = await admin.from("fam_attendants").select("id").eq("profile_id", user.id).eq("status", "active").maybeSingle();
  return data ? { user, admin } : null;
}

export async function GET(req: Request) {
  const auth = await caller(req);
  if (!auth) return NextResponse.json({ error: "Acesso restrito a atendentes FAM ativos." }, { status: 403 });
  const { data, error } = await auth.admin.from("fam_info_articles").select("*, fam_info_article_versions(*)").order("updated_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ articles: data ?? [] });
}

export async function POST(req: Request) {
  const auth = await caller(req);
  if (!auth) return NextResponse.json({ error: "Acesso restrito a atendentes FAM ativos." }, { status: 403 });
  let body: { slug?: unknown; category?: unknown; title?: unknown; summary?: unknown; body?: unknown; source?: { title?: unknown; url?: unknown; publisher?: unknown } };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "JSON inválido." }, { status: 400 }); }
  const slug = String(body.slug ?? "").trim().toLowerCase();
  const category = String(body.category ?? "").trim();
  const title = String(body.title ?? "").trim();
  const articleBody = String(body.body ?? "").trim();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || !category || title.length < 3 || articleBody.length < 20) return NextResponse.json({ error: "Informe slug válido, categoria, título e conteúdo com pelo menos 20 caracteres." }, { status: 400 });
  const { data: existing } = await auth.admin.from("fam_info_articles").select("id, current_version").eq("slug", slug).maybeSingle();
  let articleId: string;
  let version: number;
  if (existing) { articleId = existing.id; version = Number(existing.current_version ?? 0) + 1; }
  else {
    const { data: created, error } = await auth.admin.from("fam_info_articles").insert({ slug, category, created_by: auth.user.id }).select("id").single();
    if (error || !created) return NextResponse.json({ error: error?.message ?? "Não foi possível criar o artigo." }, { status: 500 });
    articleId = created.id; version = 1;
  }
  const { data: createdVersion, error: versionError } = await auth.admin.from("fam_info_article_versions").insert({ article_id: articleId, version, title, summary: body.summary ? String(body.summary) : null, body: articleBody, created_by: auth.user.id }).select("id").single();
  if (versionError || !createdVersion) return NextResponse.json({ error: versionError?.message ?? "Não foi possível criar a versão." }, { status: 500 });
  await auth.admin.from("fam_info_articles").update({ current_version: version, status: "in_review", updated_at: new Date().toISOString() }).eq("id", articleId);
  if (body.source?.title) await auth.admin.from("fam_info_sources").insert({ article_version_id: createdVersion.id, title: String(body.source.title), url: body.source.url ? String(body.source.url) : null, publisher: body.source.publisher ? String(body.source.publisher) : null, accessed_at: new Date().toISOString().slice(0, 10) });
  return NextResponse.json({ ok: true, article_id: articleId, version, status: "in_review" });
}

export async function PATCH(req: Request) {
  const auth = await caller(req);
  if (!auth) return NextResponse.json({ error: "Acesso restrito a atendentes FAM ativos." }, { status: 403 });
  let body: { article_id?: unknown; status?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "JSON inválido." }, { status: 400 }); }
  const articleId = String(body.article_id ?? "");
  const status = String(body.status ?? "");
  if (!articleId || !["in_review", "published", "archived"].includes(status)) return NextResponse.json({ error: "article_id e status editorial válido são obrigatórios." }, { status: 400 });
  const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (status === "published") { patch.published_at = new Date().toISOString(); patch.published_by = auth.user.id; }
  const { error } = await auth.admin.from("fam_info_articles").update(patch).eq("id", articleId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, article_id: articleId, status });
}
