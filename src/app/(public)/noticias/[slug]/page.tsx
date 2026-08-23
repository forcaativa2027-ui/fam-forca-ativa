import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Calendar, ExternalLink, Newspaper, User } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getPublicNewsBySlug } from "@/services/news";

interface PageProps {
  params: { slug: string };
}

function youtubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  return match?.[1] ?? null;
}

async function getArticle(slug: string) {
  const supabase = await createClient();
  return getPublicNewsBySlug(supabase, slug);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const article = await getArticle(params.slug);
  if (!article) return { title: "Informação não encontrada | FAM" };
  return {
    title: `${article.title} | FAM`,
    description: article.meta_description ?? article.summary ?? "Informação institucional da FAM — Força Ativa da Mulher.",
    openGraph: {
      title: article.title,
      description: article.summary ?? undefined,
      images: article.og_image_url || article.cover_url ? [{ url: article.og_image_url ?? article.cover_url! }] : undefined,
    },
  };
}

export default async function NewsDetailPage({ params }: PageProps) {
  const article = await getArticle(params.slug);
  if (!article) {
    return (
      <main className="min-h-screen bg-fam-background px-4 py-8">
        <div className="mx-auto max-w-3xl rounded-2xl border border-fam-border bg-white p-8 text-center shadow-sm">
          <h1 className="font-display text-2xl font-bold text-fam-plum">Informação não encontrada</h1>
          <Link href="/?tab=noticias" className="mt-5 inline-flex items-center gap-2 font-semibold text-fam-magenta underline">
            <ArrowLeft className="h-4 w-4" /> Voltar às notícias
          </Link>
        </div>
      </main>
    );
  }

  const video = youtubeId(article.video_url);
  const category = article.category === "cec_brasilia" ? "FAM — Brasília" : article.category === "geral" ? "Institucional" : "FAM — Nacional";
  const published = article.published_at ? new Date(article.published_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }) : null;

  return (
    <main className="min-h-screen bg-fam-background px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <header className="mb-5">
          <Link href="/?tab=noticias" className="inline-flex items-center gap-2 rounded-xl border border-fam-gold/40 bg-white px-4 py-2 text-sm font-semibold text-fam-plum shadow-sm transition hover:bg-fam-soft-pink">
            <ArrowLeft className="h-4 w-4" /> Voltar às notícias
          </Link>
        </header>

        <article className="overflow-hidden rounded-2xl border border-fam-gold/30 bg-white shadow-sm">
          {article.cover_url && <img src={article.cover_url} alt={article.title} className="aspect-[16/7] w-full object-cover" />}
          <div className="p-6 sm:p-9">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-fam-gold">
              <Newspaper className="h-4 w-4" /> {category}
            </div>
            <h1 className="mt-3 font-display text-3xl font-bold leading-tight text-fam-plum sm:text-4xl">{article.title}</h1>
            {article.subtitle && <p className="mt-3 text-lg leading-relaxed text-fam-magenta">{article.subtitle}</p>}
            {article.summary && <p className="mt-4 text-base leading-relaxed text-fam-muted">{article.summary}</p>}

            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-y border-fam-border py-3 text-xs text-fam-muted">
              {article.author_name && <span className="inline-flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-fam-magenta" /> Autor: {article.author_name}</span>}
              {published && <span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-fam-magenta" /> {published}</span>}
              {article.source && <span className="inline-flex items-center gap-1.5"><ExternalLink className="h-3.5 w-3.5 text-fam-magenta" /> Fonte: {article.source}</span>}
            </div>

            {video && (
              <div className="mt-6 overflow-hidden rounded-xl bg-fam-plum">
                <div className="aspect-video">
                  <iframe className="h-full w-full" src={`https://www.youtube.com/embed/${video}`} title={article.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                </div>
              </div>
            )}

            {article.body && <div className="prose prose-slate mt-7 max-w-none whitespace-pre-line text-[1.05rem] leading-8">{article.body}</div>}
            {!article.body && <p className="mt-7 text-base italic text-fam-muted">O conteúdo completo desta informação será publicado em breve.</p>}

            <footer className="mt-8 border-t border-fam-border pt-4 text-sm text-fam-muted">
              <p className="font-semibold text-fam-plum">Informação institucional FAM</p>
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
                {article.author_name && <span>Autor: {article.author_name}</span>}
                {published && <span>Data: {published}</span>}
                {article.source && <span>Fonte: {article.source}</span>}
              </div>
            </footer>
          </div>
        </article>
      </div>
    </main>
  );
}

export const dynamic = "force-dynamic";
