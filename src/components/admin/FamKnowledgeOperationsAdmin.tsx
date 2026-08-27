import { AlertTriangle, Clock3, History, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFamKnowledgeAuditEvents, useFamKnowledgeReviewAlerts } from "@/hooks/use-fam-knowledge";

const URGENCY_LABELS = {
  vencida: "Revisão vencida",
  proxima: "Revisão próxima",
  sem_data: "Sem data de revisão",
} as const;

const STATUS_LABELS: Record<string, string> = {
  draft: "Rascunho",
  curation: "Em curadoria",
  under_review: "Em revisão",
  approved: "Aprovado",
  published: "Publicado",
  superseded: "Substituído",
  archived: "Arquivado",
  rejected: "Rejeitado",
};

function formatDate(value: string | null) {
  if (!value) return "Não informada";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(`${value}T00:00:00`));
}

export function FamKnowledgeOperationsAdmin() {
  const alerts = useFamKnowledgeReviewAlerts(30);
  const audit = useFamKnowledgeAuditEvents(50);

  const refresh = () => {
    void alerts.refetch();
    void audit.refetch();
  };

  return (
    <section className="space-y-6" aria-labelledby="fam-knowledge-operations-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-fam-magenta">P9 — Operação</p>
          <h2 id="fam-knowledge-operations-title" className="mt-1 font-display text-xl text-navy">Pendências e auditoria</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted">Acompanhe revisões, validade e transições editoriais do tenant FAM. Esta área não altera status automaticamente.</p>
        </div>
        <Button type="button" variant="outline" onClick={refresh} disabled={alerts.isFetching || audit.isFetching} className="gap-2 border-fam-plum/30 text-fam-plum">
          <RefreshCw className={`h-4 w-4 ${alerts.isFetching || audit.isFetching ? "animate-spin" : ""}`} aria-hidden="true" />
          Atualizar
        </Button>
      </div>

      <Card className="border-fam-gold/40 bg-fam-gold/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-navy"><AlertTriangle className="h-5 w-5 text-fam-plum" aria-hidden="true" /> Alertas de revisão</CardTitle>
          <CardDescription>Itens vencidos, próximos da revisão ou sem data registrada.</CardDescription>
        </CardHeader>
        <CardContent>
          {alerts.isLoading && <p role="status" className="text-sm text-muted">Carregando alertas…</p>}
          {alerts.isError && <p role="alert" className="rounded-md bg-fam-pink/10 p-3 text-sm text-fam-plum">Não foi possível carregar os alertas. Confirme se a função de revisão foi criada no Supabase e se sua sessão possui acesso de curadoria.</p>}
          {!alerts.isLoading && !alerts.isError && alerts.data?.length === 0 && <p className="rounded-md border border-dashed border-fam-plum/20 p-4 text-sm text-muted">Nenhuma pendência de revisão encontrada nos próximos 30 dias.</p>}
          <div className="grid gap-3 lg:grid-cols-2">
            {alerts.data?.map((item) => (
              <div key={`${item.item_kind}-${item.item_id}`} className="rounded-lg border border-fam-plum/15 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-fam-magenta">{item.item_kind === "content" ? "Conteúdo" : "Trilha"}</p>
                    <h3 className="mt-1 font-semibold text-navy">{item.item_title}</h3>
                    <p className="mt-1 break-all text-xs text-muted">{item.item_key}</p>
                  </div>
                  <span className="rounded-full bg-fam-pink/15 px-2 py-1 text-xs font-semibold text-fam-plum">{URGENCY_LABELS[item.urgency]}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted"><span>Status: {STATUS_LABELS[item.item_status] ?? item.item_status}</span><span>Revisão: {formatDate(item.review_date)}</span>{item.days_until_review !== null && <span>{item.days_until_review < 0 ? `${Math.abs(item.days_until_review)} dia(s) em atraso` : `em ${item.days_until_review} dia(s)`}</span>}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-fam-pink/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-navy"><History className="h-5 w-5 text-fam-plum" aria-hidden="true" /> Histórico editorial</CardTitle>
          <CardDescription>Últimas transições registradas para o tenant FAM.</CardDescription>
        </CardHeader>
        <CardContent>
          {audit.isLoading && <p role="status" className="text-sm text-muted">Carregando histórico…</p>}
          {audit.isError && <p role="alert" className="rounded-md bg-fam-pink/10 p-3 text-sm text-fam-plum">Não foi possível carregar o histórico de auditoria. Verifique a policy da tabela `fam_knowledge_audit_events`.</p>}
          {!audit.isLoading && !audit.isError && audit.data?.length === 0 && <p className="rounded-md border border-dashed border-fam-plum/20 p-4 text-sm text-muted">Nenhum evento editorial registrado.</p>}
          <div className="space-y-3">
            {audit.data?.map((event) => (
              <article key={event.id} className="rounded-lg border border-fam-plum/10 bg-fam-gold/5 p-3">
                <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-navy"><Clock3 className="h-4 w-4 text-fam-plum" aria-hidden="true" />{event.event_type}<span className="text-muted">{event.from_status ?? "—"} → {event.to_status ?? "—"}</span><time className="ml-auto text-xs font-normal text-muted date" dateTime={event.created_at}>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(event.created_at))}</time></div>
                {event.notes && <p className="mt-2 text-sm text-muted">{event.notes}</p>}
                <p className="mt-1 break-all text-xs text-muted">Ator: {event.actor_profile_id ?? "não identificado"} · Versão: {event.version ?? "—"}</p>
              </article>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
