"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase/client";

type Article = { id: string; slug: string; category: string; status: string; current_version: number; fam_info_article_versions?: { title: string; version: number }[] };

export default function FamInfoAdminPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [slug, setSlug] = useState(""); const [category, setCategory] = useState(""); const [title, setTitle] = useState(""); const [summary, setSummary] = useState(""); const [body, setBody] = useState(""); const [sourceTitle, setSourceTitle] = useState(""); const [sourceUrl, setSourceUrl] = useState(""); const [sourcePublisher, setSourcePublisher] = useState("");
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState(""); const [error, setError] = useState("");

  async function request(path: string, init?: RequestInit) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error("Sessão expirada. Faça login novamente.");
    const response = await fetch(path, { ...init, headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}`, ...(init?.headers ?? {}) } });
    const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "Operação não concluída."); return data;
  }
  async function load() { try { const data = await request("/api/admin/fam-info"); setArticles(data.articles ?? []); } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível carregar os artigos."); } }
  useEffect(() => { void load(); }, []);
  async function save() { setBusy(true); setError(""); setMessage(""); try { await request("/api/admin/fam-info", { method: "POST", body: JSON.stringify({ slug, category, title, summary, body, source: { title: sourceTitle, url: sourceUrl, publisher: sourcePublisher } }) }); setMessage("Versão salva e enviada para revisão."); setSlug(""); setCategory(""); setTitle(""); setSummary(""); setBody(""); setSourceTitle(""); setSourceUrl(""); setSourcePublisher(""); await load(); } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível salvar."); } finally { setBusy(false); } }
  async function changeStatus(id: string, status: string) { setBusy(true); setError(""); try { await request("/api/admin/fam-info", { method: "PATCH", body: JSON.stringify({ article_id: id, status }) }); await load(); } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível atualizar."); } finally { setBusy(false); } }

  return <main className="min-h-screen bg-slate-50 p-4"><div className="mx-auto max-w-5xl space-y-5 py-8"><Link href="/info" className="inline-flex items-center gap-2 text-sm font-semibold text-navy"><ArrowLeft className="h-4 w-4" /> Ver INFO público</Link><header className="rounded-2xl bg-navy p-6 text-white"><div className="flex items-center gap-3"><BookOpen className="h-6 w-6 text-gold" /><h1 className="font-display text-2xl font-bold">Editor INFO FAM</h1></div><p className="mt-2 text-sm text-white/75">Crie conteúdo aprovado pela equipe, mantenha versões e publique somente após revisão.</p></header>
    {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}{message && <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p>}
    <Card><CardHeader><CardTitle>Nova versão</CardTitle></CardHeader><CardContent className="grid gap-3 md:grid-cols-2"><Input value={slug} onChange={e => setSlug(e.target.value)} placeholder="slug-do-artigo" /><Input value={category} onChange={e => setCategory(e.target.value)} placeholder="Categoria" /><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título" className="md:col-span-2" /><Input value={summary} onChange={e => setSummary(e.target.value)} placeholder="Resumo opcional" className="md:col-span-2" /><Textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Conteúdo aprovado..." rows={10} className="md:col-span-2" /><Input value={sourceTitle} onChange={e => setSourceTitle(e.target.value)} placeholder="Título da fonte" /><Input value={sourcePublisher} onChange={e => setSourcePublisher(e.target.value)} placeholder="Instituição/publicador" /><Input value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} placeholder="URL da fonte (opcional)" className="md:col-span-2" /><Button onClick={save} disabled={busy} className="gap-2 md:w-fit"><Save className="h-4 w-4" />{busy ? "Salvando..." : "Salvar para revisão"}</Button></CardContent></Card>
    <Card><CardHeader><CardTitle>Artigos e versões</CardTitle></CardHeader><CardContent className="space-y-3">{articles.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum artigo cadastrado.</p> : articles.map(article => <div key={article.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"><div><p className="font-semibold text-navy">{article.slug}</p><p className="text-xs text-muted-foreground">{article.category} · versão {article.current_version} · {article.status}</p></div><div className="flex gap-2">{article.status !== "published" && <Button size="sm" variant="outline" disabled={busy} onClick={() => changeStatus(article.id, "published")}>Publicar</Button>}{article.status === "published" && <Button size="sm" variant="outline" disabled={busy} onClick={() => changeStatus(article.id, "archived")}>Arquivar</Button>}</div></div>)}</CardContent></Card>
  </div></main>;
}
