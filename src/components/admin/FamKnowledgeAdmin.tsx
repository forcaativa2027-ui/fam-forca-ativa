"use client";

import { useState } from "react";
import { CheckCircle2, FileText, Send, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFamKnowledgeCurator, useTransitionFamKnowledgeContent } from "@/hooks/use-fam-knowledge";
import { useMyProfile } from "@/hooks/use-queries";
import type { FamKnowledgeStatus } from "@/services/famKnowledge";

const STATUS_LABELS: Record<FamKnowledgeStatus, string> = {
  draft: "Rascunho", curation: "Em curadoria", under_review: "Em revisão", approved: "Aprovado",
  published: "Publicado", superseded: "Substituído", archived: "Arquivado", rejected: "Rejeitado",
};

const NEXT_STATUS: Partial<Record<FamKnowledgeStatus, FamKnowledgeStatus>> = {
  draft: "curation", curation: "under_review", under_review: "approved", approved: "published",
};

export function FamKnowledgeAdmin() {
  const { data: profile } = useMyProfile();
  const [statusFilter, setStatusFilter] = useState<FamKnowledgeStatus | undefined>();
  const { data: contents = [], isLoading, isError } = useFamKnowledgeCurator(statusFilter);
  const transition = useTransitionFamKnowledgeContent();

  async function move(item: { id: string; status: FamKnowledgeStatus }) {
    const next = NEXT_STATUS[item.status];
    if (!next || !profile?.id) return;
    await transition.mutateAsync({ id: item.id, status: next, actorProfileId: profile.id });
  }

  return (
    <main className="space-y-6 p-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-fam-magenta">Jornada do Conhecimento</p>
        <h1 className="mt-1 font-display text-2xl text-navy">Curadoria e publicação</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">Organize conteúdos, fontes e versões. Salvar uma alteração não publica o conteúdo automaticamente.</p>
      </div>

      <div className="flex flex-wrap gap-2" aria-label="Filtrar por status">
        <Button variant={!statusFilter ? "default" : "outline"} className={!statusFilter ? "bg-fam-plum hover:bg-fam-plum/90" : "border-fam-plum/30 text-fam-plum"} onClick={() => setStatusFilter(undefined)}>Todos</Button>
        {(Object.keys(STATUS_LABELS) as FamKnowledgeStatus[]).map((status) => <Button key={status} variant={statusFilter === status ? "default" : "outline"} className={statusFilter === status ? "bg-fam-plum hover:bg-fam-plum/90" : "border-fam-plum/30 text-fam-plum"} onClick={() => setStatusFilter(status)}>{STATUS_LABELS[status]}</Button>)}
      </div>

      {isLoading && <p role="status" className="text-sm text-muted">Estamos carregando os conteúdos…</p>}
      {isError && <p role="alert" className="rounded-lg bg-fam-pink/10 p-4 text-sm text-fam-plum">Não foi possível carregar a curadoria. Verifique seu acesso e tente novamente.</p>}
      {!isLoading && !isError && contents.length === 0 && <p className="rounded-lg border border-dashed p-6 text-sm text-muted">Nenhum conteúdo encontrado neste status.</p>}

      <div className="grid gap-4 lg:grid-cols-2">
        {contents.map((item) => {
          const next = NEXT_STATUS[item.status];
          return <Card key={item.id} className="border-fam-pink/20"><CardHeader><div className="flex items-start justify-between gap-3"><div><CardTitle className="text-lg text-navy">{item.title}</CardTitle><CardDescription>{item.content_key} · versão {item.version}</CardDescription></div><span className="rounded-full bg-fam-gold/20 px-2 py-1 text-xs font-semibold text-fam-plum">{STATUS_LABELS[item.status]}</span></div></CardHeader><CardContent><div className="flex flex-wrap items-center gap-2 text-xs text-muted"><FileText className="h-4 w-4" aria-hidden="true" />{item.content_type}<span>•</span>{item.review_date ? `Revisão ${item.review_date}` : "Sem data de revisão"}</div><div className="mt-4 flex flex-wrap gap-2">{next && <Button disabled={transition.isPending} onClick={() => move(item)} className="gap-2 bg-fam-plum hover:bg-fam-plum/90">{next === "published" ? <CheckCircle2 className="h-4 w-4" /> : <Send className="h-4 w-4" />} {next === "published" ? "Publicar" : `Mover para ${STATUS_LABELS[next]}`}</Button>}{item.status === "published" && <Button variant="outline" disabled={transition.isPending} onClick={() => transition.mutate({ id: item.id, status: "archived", actorProfileId: profile?.id ?? "" })} className="gap-2 border-fam-plum/30 text-fam-plum"><Archive className="h-4 w-4" /> Arquivar</Button>}</div></CardContent></Card>;
        })}
      </div>
    </main>
  );
}
