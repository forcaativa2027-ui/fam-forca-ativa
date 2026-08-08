"use client";
import { useState } from "react";
import { Briefcase, Home, Boxes, AlertTriangle, Building2, DollarSign, TrendingDown, Wrench, ClipboardList, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useChurches, usePatrimonySummary } from "@/hooks/use-queries";
import { Kpi } from "./patrimony/PatrimonyHelpers";
import { PropertiesSection } from "./patrimony/PropertiesSection";
import { AssetsSection } from "./patrimony/AssetsSection";
import { DepreciacaoTab } from "./patrimony/DepreciacaoTab";
import { ManutencaoTab } from "./patrimony/ManutencaoTab";
import { InventarioTab } from "./patrimony/InventarioTab";
import { DashboardContabilTab } from "./patrimony/DashboardContabilTab";

export function PatrimonyAdmin({ initialChurchId = "" }: { initialChurchId?: string } = {}) {
  const { data: churches = [] } = useChurches();
  const { data: summary = [] } = usePatrimonySummary();
  const [churchFilter, setChurchFilter] = useState(initialChurchId);

  const totalProperties = summary.reduce((s, x) => s + x.properties_count, 0);
  const totalAssets = summary.reduce((s, x) => s + x.assets_count, 0);
  const totalValue = summary.reduce((s, x) => s + Number(x.total_acquisition_value || 0), 0);
  const expiringSoon = summary.reduce((s, x) => s + x.contracts_expiring_90d, 0);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-gold" />Patrimônio
              </CardTitle>
              <CardDescription>Imóveis · Bens · Depreciação · Manutenção · Inventário · Dashboard Contábil</CardDescription>
            </div>
            <Select value={churchFilter} onValueChange={setChurchFilter}>
              <SelectTrigger className="w-52"><SelectValue placeholder="Todas as comunidades" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas as comunidades</SelectItem>
                {churches.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {expiringSoon > 0 && (
            <div className="mb-3 rounded-md border-l-4 border-l-red-500 bg-red-50 p-3 text-sm text-red-800">
              <b className="flex items-center gap-1"><AlertTriangle className="h-4 w-4" />{expiringSoon} contrato(s) vencendo nos próximos 90 dias.</b>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-4">
            <Kpi icon={<Home />} label="Imóveis" value={totalProperties} />
            <Kpi icon={<Boxes />} label="Bens" value={totalAssets} />
            <Kpi icon={<DollarSign />} label="Valor patrimonial" value={`R$ ${totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} />
            <Kpi icon={<Building2 />} label="Comunidades cobertas" value={summary.filter(s => s.properties_count > 0 || s.assets_count > 0).length} />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="properties">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="properties"><Home className="mr-1 h-4 w-4" />Imóveis</TabsTrigger>
          <TabsTrigger value="assets"><Boxes className="mr-1 h-4 w-4" />Bens</TabsTrigger>
          <TabsTrigger value="depreciacao"><TrendingDown className="mr-1 h-4 w-4" />Depreciação</TabsTrigger>
          <TabsTrigger value="manutencao"><Wrench className="mr-1 h-4 w-4" />Manutenção</TabsTrigger>
          <TabsTrigger value="inventario"><ClipboardList className="mr-1 h-4 w-4" />Inventário</TabsTrigger>
          <TabsTrigger value="dashboard"><BarChart3 className="mr-1 h-4 w-4" />Dashboard Contábil</TabsTrigger>
        </TabsList>
        <div className="mt-4">
          <TabsContent value="properties"><PropertiesSection churches={churches} initialChurchId={initialChurchId} /></TabsContent>
          <TabsContent value="assets"><AssetsSection churches={churches} initialChurchId={initialChurchId} /></TabsContent>
          <TabsContent value="depreciacao"><DepreciacaoTab churchFilter={churchFilter} /></TabsContent>
          <TabsContent value="manutencao"><ManutencaoTab churchFilter={churchFilter} /></TabsContent>
          <TabsContent value="inventario"><InventarioTab churchFilter={churchFilter} /></TabsContent>
          <TabsContent value="dashboard"><DashboardContabilTab churchFilter={churchFilter} /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
