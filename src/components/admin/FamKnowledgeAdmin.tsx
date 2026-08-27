"use client";

import { useState, type FormEvent } from "react";
import { Archive, CheckCircle2, FileText, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateFamKnowledgeSource, useFamKnowledgeCurator, useFamKnowledgeSources, useTransitionFamKnowledgeContent } from "@/hooks/use-fam-knowledge";
import { useMyProfile } from "@/hooks/use-queries";
import type { FamKnowledgeStatus } from "@/services/famKnowledge";

const STATUS_LABELS: Record<FamKnowledgeStatus, string> = {
  draft: "Rascunho", curation: "Em curadoria", under_review: "Em revisão", approved: "Aprovado",
  published: "Publicado", superseded: "Substituído", archived: "Arquivado", rejected: "Rejeitado",
};

const NEXT_STATUS: Partial<Record<FamKnowledgeStatus, FamKnowledgeStatus>> = {
  draft: "curation", curation: "under_review", under_review: "approved", approved: "published",
};

const SOURCE_TYPES = [
  ["lei", "Lei"], ["decreto", "Decreto"], ["orgao_publico", "Órgão público"],
  ["servico_publico", "Serviço público"], ["documento", "Documento"], ["video", "Vídeo"],
  ["artigo", "Artigo"], ["outro", "Outro"],
] as const;

function SourceEditor({ contentId }: { contentId: string }) {
  const { data: sources = [], isLoading } = useFamKnowledgeSources(contentId);
  const createSource = useCreateFamKnowledgeSource();
  const [sourceType, setSourceType] = useState("lei");
  const [sourceTitle, setSourceTitle] = useState("");
  const [sourceReference, setSourceReference] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [authority, setAuthority] = useState("");
  const [publicationDate, setPublicationDate] = useState("");

  async function addSource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sourceTitle.trim() || !sourceReference.trim()) return;
    await createSource.mutateAsync({
      content_id: contentId,
      source_type: sourceType,
      source_title: sourceTitle.trim(),
      source_reference: sourceReference.trim(),
      source_url: sourceUrl.trim() || undefined,
      issuing_authority: authority.trim() || undefined,
      publication_date: publicationDate || undefined,
    });
    setSourceTitle(""); setSourceReference(""); setSourceUrl(""); setAuthority(""); setPublicationDate("");
  }

  return <details className="mt-4 rounded-lg border border-fam-plum/15 p-3"><summary className="cursor-pointer text-sm font-semibold text-fam-plum">Fontes e referências oficiais ({sources.length})</summary><div className="mt-3 space-y-3">{isLoading && <p className="text-xs text-muted">Carregando fontes…</p>}{sources.map((source) => <div key={source.id} className="rounded-md bg-fam-gold/10 p-3 text-xs text-navy"><p className="font-semibold">{source.source_title}</p><p>{source.source_reference}{source.issuing_authority ? ` · ${source.issuing_authority}` : ""}</p>{source.source_url && <a className="break-all text-fam-plum underline" href={source.source_url} target="_blank" rel="noreferrer">{source.source_url}</a>}</div>)}<form onSubmit={addSource} className="grid gap-2 md:grid-cols-2"><select aria-label="Tipo de fonte" value={sourceType} onChange={(event) => setSourceType(event.target.value)} className="rounded-md border border-fam-plum/25 bg-white px-3 py-2 text-sm">{SOURCE_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><input required aria-label="Título da fonte" value={sourceTitle} onChange={(event) => setSourceTitle(event.target.value)} placeholder="Título da fonte" className="rounded-md border border-fam-plum/25 bg-white px-3 py-2 text-sm" /><input required aria-label="Referência da fonte" value={sourceReference} onChange={(event) => setSourceReference(event.target.value)} placeholder="Referência oficial" className="rounded-md border border-fam-plum/25 bg-white px-3 py-2 text-sm" /><input aria-label="Órgão emissor" value={authority} onChange={(event) => setAuthority(event.target.value)} placeholder="Órgão emissor" className="rounded-md border border-fam-plum/25 bg-white px-3 py-2 text-sm" /><input type="url" aria-label="URL oficial" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://gov.br/..." className="rounded-md border border-fam-plum/25 bg-white px-3 py-2 text-sm" /><input type="date" aria-label="Data de publicação" value={publicationDate} onChange={(event) => setPublicationDate(event.target.value)} className="rounded-md border border-fam-plum/25 bg-white px-3 py-2 text-sm" /><div className="md:col-span-2"><Button type="submit" disabled={createSource.isPending} className="bg-fam-plum hover:bg-fam-plum/90">{createSource.isPending ? "Salvando…" : "Adicionar fonte"}</Button></div></form>{createSource.isError && <p role="alert" className="text-xs text-fam-plum">Não foi possível salvar a fonte. Verifique sua permissão de curadoria.</p>}</div></details>;
}

export function FamKnowledgeAdmin() {
  const { data: profile } = useMyProfile();
  const [statusFilter, setStatusFilter] = useState<FamKnowledgeStatus | undefined>();
  const [approvalReference, setApprovalReference] = useState("");
  const [reviewDate, setReviewDate] = useState("");
  const [notes, setNotes] = useState("");
  const { data: contents = [], isLoading, isError } = useFamKnowledgeCurator(statusFilter);
  const transition = useTransitionFamKnowledgeContent();

  async function move(item: { id: string; status: FamKnowledgeStatus }) {
    const next = NEXT_STATUS[item.status];
    if (!next || !profile?.id) return;
    await transition.mutateAsync({
      id: item.id,
      status: next,
      actorProfileId: profile.id,
      notes: notes.trim() || undefined,
      approvalReference: next === "published" ? approvalReference.trim() : undefined,
      reviewDate: next === "published" ? reviewDate : undefined,
    });
  }

  const canPublish = approvalReference.trim().length > 0 && reviewDate.trim().length > 0;

  return (
    <main className="space-y-6 p-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-fam-magenta">Jornada do Conhecimento</p>
        <h1 className="mt-1 font-display text-2xl text-navy">Curadoria e publicação</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">Organize conteúdos, fontes e versões. Salvar uma alteração não publica o conteúdo automaticamente.</p>
      </div>

      <Card className="border-fam-gold/40 bg-fam-gold/10">
        <CardHeader>
          <CardTitle className="text-lg text-navy">Dados da aprovação editorial</CardTitle>
          <CardDescription>Preencha estes campos antes de publicar qualquer conteúdo. Eles serão registrados no histórico de auditoria.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <label className="text-sm font-medium text-navy">Referência do parecer ou ata
            <input value={approvalReference} onChange={(event) => setApprovalReference(event.target.value)} placeholder="Ex.: ATA-FAM-2026-001" className="mt-1 w-full rounded-md border border-fam-plum/25 bg-white px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-fam-gold" />
          </label>
          <label className="text-sm font-medium text-navy">Próxima revisão
            <input type="date" value={reviewDate} onChange={(event) => setReviewDate(event.target.value)} className="mt-1 w-full rounded-md border border-fam-plum/25 bg-white px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-fam-gold" />
          </label>
          <label className="text-sm font-medium text-navy">Nota da transição
            <input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Motivo ou observação editorial" className="mt-1 w-full rounded-md border border-fam-plum/25 bg-white px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-fam-gold" />
          </label>
        </CardContent>
      </Card>

      {transition.isError && <p role="alert" className="rounded-lg bg-fam-pink/10 p-4 text-sm text-fam-plum">{transition.error instanceof Error ? transition.error.message : "Não foi possível concluir a transição editorial."}</p>}
      {!canPublish && <p className="text-xs text-muted">A publicação ficará bloqueada até que a referência de aprovação e a próxima data de revisão sejam preenchidas.</p>}

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
          const publishing = next === "published";
          return <Card key={item.id} className="border-fam-pink/20"><CardHeader><div className="flex items-start justify-between gap-3"><div><CardTitle className="text-lg text-navy">{item.title}</CardTitle><CardDescription>{item.content_key} · versão {item.version}</CardDescription></div><span className="rounded-full bg-fam-gold/20 px-2 py-1 text-xs font-semibold text-fam-plum">{STATUS_LABELS[item.status]}</span></div></CardHeader><CardContent><div className="flex flex-wrap items-center gap-2 text-xs text-muted"><FileText className="h-4 w-4" aria-hidden="true" />{item.content_type}<span>•</span>{item.review_date ? `Revisão ${item.review_date}` : "Sem data de revisão"}</div><SourceEditor contentId={item.id} /><div className="mt-4 flex flex-wrap gap-2">{next && <Button disabled={transition.isPending || (publishing && !canPublish)} onClick={() => move(item)} className="gap-2 bg-fam-plum hover:bg-fam-plum/90">{publishing ? <CheckCircle2 className="h-4 w-4" /> : <Send className="h-4 w-4" />} {publishing ? "Publicar" : `Mover para ${STATUS_LABELS[next]}`}</Button>}{item.status === "published" && <Button variant="outline" disabled={transition.isPending} onClick={() => transition.mutate({ id: item.id, status: "archived", actorProfileId: profile?.id ?? "", notes: notes.trim() || undefined })} className="gap-2 border-fam-plum/30 text-fam-plum"><Archive className="h-4 w-4" /> Arquivar</Button>}</div></CardContent></Card>;
        })}
      </div>
    </main>
  );
}
