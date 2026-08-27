"use client";

import Link from "next/link";
import { ArrowLeft, ExternalLink, FileText } from "lucide-react";
import { useParams } from "next/navigation";
import { useFamKnowledgeContent, useFamKnowledgeSources } from "@/hooks/use-fam-knowledge";

export default function KnowledgeContentPage() {
  const params = useParams<{ contentKey: string }>();
  const contentKey = params?.contentKey ? decodeURIComponent(params.contentKey) : null;
  const { data: content, isLoading, isError } = useFamKnowledgeContent(contentKey);
  const { data: sources = [] } = useFamKnowledgeSources(content?.id ?? null);

  if (isLoading) return <main className="mx-auto max-w-4xl p-6" role="status">Carregando orientação…</main>;
  if (isError) return <main className="mx-auto max-w-4xl p-6" role="alert">Não foi possível carregar esta orientação.</main>;
  if (!content) return <main className="mx-auto max-w-4xl space-y-4 p-6"><p role="alert">Orientação não encontrada ou ainda não publicada.</p><Link className="text-fam-plum underline" href="/jornada-conhecimento">Voltar para a Jornada</Link></main>;

  return <main className="min-h-screen bg-background pb-16"><header className="bg-fam-plum px-4 py-8 text-white sm:px-6"><div className="mx-auto max-w-4xl"><Link href="/jornada-conhecimento" className="inline-flex items-center gap-2 text-sm text-white underline"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Voltar para a Jornada</Link><p className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-fam-gold">{content.content_type}</p><h1 className="mt-2 font-display text-3xl font-bold">{content.title}</h1><p className="mt-3 max-w-3xl text-white/85">{content.summary}</p></div></header><div className="mx-auto grid max-w-4xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_280px]"><article className="prose prose-slate max-w-none"><div className="whitespace-pre-wrap text-base leading-8 text-ink">{content.body}</div></article><aside className="h-fit rounded-xl border border-fam-gold/40 bg-fam-gold/10 p-4" aria-labelledby="sources-title"><h2 id="sources-title" className="font-display text-lg text-navy">Fontes oficiais</h2>{sources.length === 0 ? <p className="mt-2 text-sm text-muted">Fonte em preparação editorial.</p> : <ul className="mt-3 space-y-3">{sources.map((source) => <li key={source.id} className="text-sm"><div className="flex gap-2 font-semibold text-navy"><FileText className="mt-0.5 h-4 w-4 shrink-0 text-fam-magenta" aria-hidden="true" />{source.source_title}</div><p className="mt-1 text-muted">{source.source_reference}</p>{source.issuing_authority && <p className="text-xs text-muted">{source.issuing_authority}</p>}{source.source_url && <a href={source.source_url} target="_blank" rel="noreferrer" className="mt-1 inline-flex max-w-full items-center gap-1 break-all text-fam-plum underline">Abrir fonte <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" /></a>}</li>)}</ul>}</aside></div></main>;
}
