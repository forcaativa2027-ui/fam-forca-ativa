"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuditLogs } from "@/hooks/use-queries";

/**
 * Extraído de AdminPanel.tsx (era a função interna `AuditView`) para poder
 * ser reutilizado tanto no painel legado (/admin) quanto no novo
 * workspace de Governança (/governanca). Nenhuma mudança de comportamento.
 */
export function AuditAdmin() {
  const { data: logs = [] } = useAuditLogs();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Logs de auditoria</CardTitle>
        <CardDescription>Ações registradas no sistema (últimos 50 eventos).</CardDescription>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-sm italic text-muted">Nenhum log registrado ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-muted">
                  <th className="p-2">Quando</th><th className="p-2">Quem</th><th className="p-2">Ação</th><th className="p-2">Entidade</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-b">
                    <td className="p-2 text-xs text-muted">{new Date(l.created_at).toLocaleString("pt-BR")}</td>
                    <td className="p-2">{l.actor_email ?? "—"}</td>
                    <td className="p-2"><span className="rounded bg-navy-50 px-2 py-0.5 text-xs font-bold text-navy">{l.action}</span></td>
                    <td className="p-2 text-navy">{l.entity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
