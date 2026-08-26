"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabase/client";
import { listPublishedFamInfo, type FamInfoArticle } from "@/services/famInfo";

export default function InfoPage() {
  const [articles, setArticles] = useState<FamInfoArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    listPublishedFamInfo(supabase).then(setArticles).catch(() => setError(true)).finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 p-4">
      <div className="mx-auto max-w-5xl space-y-6 py-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-navy"><ArrowLeft className="h-4 w-4" /> Voltar</Link>
        <header className="rounded-2xl bg-navy p-6 text-white">
          <div className="flex items-center gap-3"><BookOpen className="h-7 w-7 text-gold" /><h1 className="font-display text-3xl font-bold">INFO FAM</h1></div>
          <p className="mt-2 max-w-2xl text-white/80">Informações orientativas, revisadas e acompanhadas de suas fontes. O conteúdo publicado não substitui atendimento profissional ou serviços de emergência.</p>
        </header>
        {loading && <p className="text-sm text-muted-foreground">Carregando informações...</p>}
        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">Não foi possível carregar a base INFO. Tente novamente mais tarde.</p>}
        {!loading && !error && articles.length === 0 && <Card><CardContent className="p-6"><h2 className="font-display text-xl font-bold text-navy">Conteúdo em revisão</h2><p className="mt-2 text-sm text-muted-foreground">A equipe FAM ainda não publicou artigos nesta base. Quando um conteúdo for revisado e aprovado, ele aparecerá aqui com sua versão e suas fontes.</p></CardContent></Card>}
        <div className="grid gap-4 md:grid-cols-2">
          {articles.map((article) => article.version && <Card key={article.id}><CardContent className="space-y-3 p-5"><p className="text-xs font-bold uppercase tracking-wide text-gold">{article.category}</p><h2 className="font-display text-xl font-bold text-navy">{article.version.title}</h2>{article.version.summary && <p className="text-sm text-muted-foreground">{article.version.summary}</p>}<p className="line-clamp-5 whitespace-pre-line text-sm text-ink">{article.version.body}</p><p className="text-xs text-muted-foreground">Versão {article.version.version} · {article.version.language}</p>{article.version.sources?.length ? <div className="space-y-1 border-t pt-3"><p className="text-xs font-semibold text-navy">Fontes</p>{article.version.sources.map((source) => source.url ? <a key={source.id} href={source.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-blue-700 hover:underline">{source.title}<ExternalLink className="h-3 w-3" /></a> : <p key={source.id} className="text-xs text-muted-foreground">{source.title}</p>)}</div> : null}</CardContent></Card>)}
        </div>
      </div>
    </main>
  );
}
