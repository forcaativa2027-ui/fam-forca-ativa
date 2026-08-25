"use client";
import { Users, Link2, CreditCard, Clock, FolderOpen, Settings, User } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useChurches } from "@/hooks/use-queries";
import { PessoasTab } from "./gpv/PessoasTab";
import { VinculosTab } from "./gpv/VinculosTab";
import { PagamentosTab } from "./gpv/PagamentosTab";
import { HistoricoTab } from "./gpv/HistoricoTab";
import { DocumentosTab } from "./gpv/DocumentosTab";
import { ConfiguracoesTab } from "./gpv/ConfiguracoesTab";

export function GpvAdmin() {
  const { data: churches = [] } = useChurches();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-gold" />
            Gestão de Pessoas e Vínculos
          </CardTitle>
          <CardDescription>
            Cadastro único de pessoas · Vínculos e remunerações · Pagamentos · Histórico · GED
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="pessoas">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="pessoas" className="gap-1.5"><Users className="h-3.5 w-3.5" />Pessoas</TabsTrigger>
          <TabsTrigger value="vinculos" className="gap-1.5"><Link2 className="h-3.5 w-3.5" />Vínculos</TabsTrigger>
          <TabsTrigger value="pagamentos" className="gap-1.5"><CreditCard className="h-3.5 w-3.5" />Pagamentos</TabsTrigger>
          <TabsTrigger value="historico" className="gap-1.5"><Clock className="h-3.5 w-3.5" />Histórico</TabsTrigger>
          <TabsTrigger value="documentos" className="gap-1.5"><FolderOpen className="h-3.5 w-3.5" />Documentos</TabsTrigger>
          <TabsTrigger value="configuracoes" className="gap-1.5"><Settings className="h-3.5 w-3.5" />Configurações</TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <TabsContent value="pessoas"><PessoasTab churches={churches} /></TabsContent>
          <TabsContent value="vinculos"><VinculosTab churches={churches} /></TabsContent>
          <TabsContent value="pagamentos"><PagamentosTab /></TabsContent>
          <TabsContent value="historico"><HistoricoTab /></TabsContent>
          <TabsContent value="documentos"><DocumentosTab /></TabsContent>
          <TabsContent value="configuracoes"><ConfiguracoesTab churches={churches} /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
