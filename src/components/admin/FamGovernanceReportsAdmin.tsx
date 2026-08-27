"use client";

import { useCallback, useEffect, useState } from "react";
import { FileBarChart, LockKeyhole, RefreshCw, ShieldCheck, ShieldX } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";
import {
  loadFamOperationalGovernanceReport,
  type FamOperationalGovernanceReport,
} from "@/services/famOperationalGovernanceReport";

const EVENT_LABELS: Record<string, string> = {
  LEGAL_HOLD_ENABLED: "Legal hold activado",
  LEGAL_HOLD_RELEASED: "Legal hold liberado",
  RETENTION_REVIEW: "Revisão de retenção",
  ACCESS: "Acesso registrado",
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("pt-BR");
}

export function FamGovernanceReportsAdmin() {
  const [report, setReport] = useState<FamOperationalGovernanceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setReport(await loadFamOperationalGovernanceReport(supabase));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível carregar o relatório operacional.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <div className="space-y-6">
      <Card className="border-fam-lavender">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-fam-plum"><FileBarChart className="h-5 w-5" />Relatório operacional FAM</CardTitle>
              <CardDescription>POL-ARQ-01 · {report?.policy_version ?? "carregando versão"}. Exibe somente metadados agregados de governança.</CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}><RefreshCw className="mr-2 h-4 w-4" />Actualizar</Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? <p className="text-sm text-fam-muted">Carregando relatório…</p> : error ? <div role="alert" className="rounded-md bg-fam-danger/10 p-3 text-sm text-fam-danger">Não foi possível carregar os dados protegidos. Verifique a credencial de gestor e as policies da POL-ARQ-01.</div> : report && (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
                <Metric label="Arquivos" value={report.totals.attachments} icon={<FileBarChart className="h-4 w-4" />} />
                <Metric label="Legal hold" value={report.totals.legal_hold} icon={<LockKeyhole className="h-4 w-4" />} />
                <Metric label="Expirados elegíveis" value={report.totals.expired} icon={<ShieldCheck className="h-4 w-4" />} />
                <Metric label="Eventos de arquivo" value={report.totals.governance_events} icon={<FileBarChart className="h-4 w-4" />} />
                <Metric label="Acessos negados" value={report.totals.denied_access} icon={<ShieldX className="h-4 w-4" />} />
                <Metric label="MFA requerido" value={report.totals.mfa_required} icon={<LockKeyhole className="h-4 w-4" />} />
              </div>
              <p className="mt-4 text-xs text-fam-muted">Gerado em {formatDate(report.generated_at)}. IDs e metadados completos não são exibidos neste resumo.</p>
            </>
          )}
        </CardContent>
      </Card>

      {report && !error && (
        <>
          <Card>
            <CardHeader><CardTitle>Mapa de retenção</CardTitle><CardDescription>Distribuição por classe, com destaque para legal hold e expiração. Nenhuma exclusão é executada pelo relatório.</CardDescription></CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm"><thead><tr className="border-b text-left text-xs uppercase text-muted-foreground"><th className="p-2">Classe</th><th className="p-2">Descrição</th><th className="p-2">Arquivos</th><th className="p-2">Legal hold</th><th className="p-2">Expirados</th></tr></thead><tbody>{report.retention.map((item) => <tr key={item.retention_class} className="border-b"><td className="p-2 font-semibold text-fam-plum">{item.retention_class}</td><td className="p-2">{item.label ?? "Não descrita"}</td><td className="p-2">{item.total_attachments}</td><td className="p-2">{item.legal_hold_attachments}</td><td className="p-2">{item.expired_attachments}</td></tr>)}</tbody></table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Eventos recentes de governança</CardTitle><CardDescription>Somente eventos de ciclo de vida; o conteúdo do anexo permanece fora do painel.</CardDescription></CardHeader>
            <CardContent>{report.governance_events.length === 0 ? <p className="text-sm text-fam-muted">Nenhum evento registado.</p> : <div className="space-y-2">{report.governance_events.map((event) => <div key={event.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-fam-lavender p-3 text-sm"><span className="font-medium">{EVENT_LABELS[event.event_type] ?? event.event_type}</span><span className="text-xs text-fam-muted">{event.retention_class ?? "—"} · {formatDate(event.created_at)}</span></div>)}</div>}</CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Decisões de acesso sensível</CardTitle><CardDescription>Contagem e decisão operacional, sem texto de caso, arquivo ou narrativa da usuária.</CardDescription></CardHeader>
            <CardContent>{report.access_events.length === 0 ? <p className="text-sm text-fam-muted">Nenhuma decisão registada.</p> : <div className="space-y-2">{report.access_events.map((event) => <div key={event.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-fam-lavender p-3 text-sm"><span className="font-medium">{event.decision}</span><span className="text-xs text-fam-muted">Finalidade: {event.purpose ?? "—"} · {formatDate(event.created_at)}</span></div>)}</div>}</CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function Metric({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return <div className="rounded-lg border border-fam-lavender bg-fam-cream/30 p-3"><div className="flex items-center gap-2 text-fam-muted">{icon}<span className="text-xs">{label}</span></div><p className="mt-2 text-2xl font-semibold text-fam-plum">{value}</p></div>;
}
