"use client";
import { AlertTriangle, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePatrimonyAccounting, usePatrimonyNationalSummary, usePatrimonyAlerts } from "@/hooks/use-queries";
import { fmtMoney } from "./PatrimonyTypes";

export function DashboardContabilTab({ churchFilter }: { churchFilter: string }) {
  const { data: accounting = [], isLoading } = usePatrimonyAccounting(churchFilter || undefined);
  const { data: national } = usePatrimonyNationalSummary();
  const { data: alerts = [] } = usePatrimonyAlerts(churchFilter || undefined);

  const criticos = alerts.filter(a => a.severity === "critico").length;
  const atencao  = alerts.filter(a => a.severity === "atencao").length;

  if (isLoading) return <p className="py-8 text-center text-sm text-muted-foreground">Calculando…</p>;

  return (
    <div className="space-y-5">
      {/* KPIs nacionais */}
      {national && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="border-l-4 border-l-[#C9A227]"><CardContent className="pt-4">
            <p className="text-xs text-muted-foreground uppercase font-bold">Total Bens</p>
            <p className="font-display text-2xl font-bold text-[#0E2A47] mt-1">{national.total_bens}</p>
          </CardContent></Card>
          <Card className="border-l-4 border-l-blue-500"><CardContent className="pt-4">
            <p className="text-xs text-muted-foreground uppercase font-bold">Imóveis</p>
            <p className="font-display text-2xl font-bold text-[#0E2A47] mt-1">{national.total_imoveis}</p>
          </CardContent></Card>
          <Card className="border-l-4 border-l-green-500"><CardContent className="pt-4">
            <p className="text-xs text-muted-foreground uppercase font-bold">Valor Líquido</p>
            <p className="font-display text-xl font-bold text-green-700 mt-1">{fmtMoney(national.valor_liquido_total)}</p>
          </CardContent></Card>
          <Card className="border-l-4 border-l-red-400"><CardContent className="pt-4">
            <p className="text-xs text-muted-foreground uppercase font-bold">Depreciação Total</p>
            <p className="font-display text-xl font-bold text-red-600 mt-1">{fmtMoney(national.depreciacao_total)}</p>
          </CardContent></Card>
        </div>
      )}

      {/* Alertas */}
      {alerts.length > 0 && (
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500"/>
              Alertas Patrimoniais
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">{criticos} críticos</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">{atencao} atenção</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.slice(0,10).map((a, i) => (
                <div key={i} className={`flex items-start gap-3 rounded-lg border p-2.5 ${a.severity==="critico"?"bg-red-50 border-red-200":"bg-yellow-50 border-yellow-200"}`}>
                  <AlertTriangle className={`h-4 w-4 shrink-0 mt-0.5 ${a.severity==="critico"?"text-red-500":"text-yellow-500"}`}/>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0E2A47]">{a.asset_name}</p>
                    <p className="text-xs text-muted-foreground">{a.detail}</p>
                    {a.church_name && <p className="text-[11px] text-muted-foreground">{a.church_name}</p>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabela por categoria */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-[#C9A227]"/>
            Patrimônio por Categoria e Igreja
          </CardTitle>
        </CardHeader>
        <CardContent>
          {accounting.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhum dado patrimonial encontrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-[#0E2A47] text-white">
                  <tr>
                    <th className="px-3 py-2 text-left">Categoria</th>
                    <th className="px-3 py-2 text-left">Igreja</th>
                    <th className="px-2 py-2 text-center">Bens</th>
                    <th className="px-3 py-2 text-right">Aquisição</th>
                    <th className="px-3 py-2 text-right">Depreciação</th>
                    <th className="px-3 py-2 text-right">Valor Líquido</th>
                  </tr>
                </thead>
                <tbody>
                  {accounting.map((row, i) => (
                    <tr key={i} className={`border-t ${i%2===0?"bg-gray-50/50":""}`}>
                      <td className="px-3 py-2 font-medium text-[#0E2A47] capitalize">{row.category}</td>
                      <td className="px-3 py-2 text-muted-foreground">{row.church_name ?? "—"}</td>
                      <td className="px-2 py-2 text-center">{row.total_bens}</td>
                      <td className="px-3 py-2 text-right">{fmtMoney(row.valor_aquisicao_total)}</td>
                      <td className="px-3 py-2 text-right text-red-600">{fmtMoney(row.depreciacao_acumulada_total)}</td>
                      <td className="px-3 py-2 text-right font-bold text-green-700">{fmtMoney(row.valor_atual_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
