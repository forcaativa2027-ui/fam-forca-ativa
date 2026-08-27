"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useFamKnowledgeTrail } from "@/hooks/use-fam-knowledge";

export default function KnowledgeTrailPage() {
  const params = useParams<{ trailKey: string }>();
  const trailKey = params?.trailKey ? decodeURIComponent(params.trailKey) : null;
  const { data, isLoading, isError } = useFamKnowledgeTrail(trailKey);

  if (isLoading) return <main className="mx-auto max-w-4xl p-6" role="status">Carregando trilha…</main>;
  if (isError) return <main className="mx-auto max-w-4xl p-6" role="alert">Não foi possível carregar esta trilha.</main>;
  if (!data) return <main className="mx-auto max-w-4xl space-y-4 p-6"><p role="alert">Trilha não encontrada ou ainda não publicada.</p><Link className="text-fam-plum underline" href="/jornada-conhecimento">Voltar para a Jornada</Link></main>;

  const { trail, steps } = data;
  return <main className="min-h-screen bg-background pb-16"><header className="bg-fam-plum px-4 py-8 text-white sm:px-6"><div className="mx-auto max-w-4xl"><Link href="/jornada-conhecimento" className="inline-flex items-center gap-2 text-sm text-white underline"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Voltar para a Jornada</Link><p className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-fam-gold">Jornada do Conhecimento</p><h1 className="mt-2 font-display text-3xl font-bold">{trail.title}</h1><p className="mt-3 max-w-3xl text-white/85">{trail.summary}</p><p className="mt-3 text-sm text-white/75">Nível {trail.difficulty}{trail.estimated_minutes ? ` · aproximadamente ${trail.estimated_minutes} minutos` : ""}</p></div></header><div className="mx-auto max-w-4xl px-4 py-8 sm:px-6"><ol className="space-y-4" aria-label="Etapas da trilha">{steps.map((step) => <li key={step.id} className="rounded-xl border border-fam-pink/20 bg-white p-5 shadow-sm"><div className="flex gap-4"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-fam-gold/25 text-fam-plum"><CheckCircle2 className="h-5 w-5" aria-hidden="true" /></div><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wide text-fam-magenta">Etapa {step.position}{step.is_optional ? " · opcional" : ""}</p><h2 className="mt-1 font-display text-xl text-navy">{step.title}</h2><p className="mt-2 text-sm leading-6 text-muted">{step.objective}</p>{step.content_key ? <Link href={`/jornada-conhecimento/conteudo/${encodeURIComponent(step.content_key)}`} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-fam-plum underline">Abrir conteúdo <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link> : <p className="mt-4 text-xs text-muted">Conteúdo em preparação editorial.</p>}</div></div></li>)}</ol></div></main>;
}
