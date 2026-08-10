"use client";
import { Baby, Users2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useChurches } from "@/hooks/use-queries";
import { useState } from "react";
import { KidsGroupsTab } from "./kids/KidsGroupsTab";
import { KidsDependentsTab } from "./kids/KidsDependentsTab";

/**
 * KIDS — Sistema de Custódia, Cuidado, Desenvolvimento e
 * Transferência Segura de Crianças. Fase 1 (Esqueleto Seguro
 * Mínimo), Rodada 1: Identidade (Crianças, Responsáveis, Pessoas
 * Autorizadas, Turmas). Fundamentos: CORE-TERM-001, KIDS-000/001/003.
 */
export function KidsAdmin() {
  const { data: churches = [] } = useChurches();
  const [churchId, setChurchId] = useState("");
  const activeChurchId = churchId || churches[0]?.id || "";

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Baby className="h-5 w-5 text-gold" />
            Ministério de Crianças (KIDS)
          </CardTitle>
          <CardDescription>
            Custódia, cuidado, desenvolvimento e transferência segura de crianças — Fase 1: Identidade
          </CardDescription>
        </CardHeader>
      </Card>

      {churches.length > 1 && (
        <select value={activeChurchId} onChange={(e) => setChurchId(e.target.value)}
          className="h-9 rounded-md border bg-background px-3 text-sm">
          {churches.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      )}

      {activeChurchId ? (
        <Tabs defaultValue="dependents">
          <TabsList>
            <TabsTrigger value="dependents" className="gap-1.5"><Baby className="h-3.5 w-3.5" />Crianças</TabsTrigger>
            <TabsTrigger value="groups" className="gap-1.5"><Users2 className="h-3.5 w-3.5" />Turmas</TabsTrigger>
          </TabsList>
          <div className="mt-4">
            <TabsContent value="dependents"><KidsDependentsTab churchId={activeChurchId} /></TabsContent>
            <TabsContent value="groups"><KidsGroupsTab churchId={activeChurchId} /></TabsContent>
          </div>
        </Tabs>
      ) : (
        <p className="text-sm text-muted-foreground">Nenhuma comunidade encontrada.</p>
      )}
    </div>
  );
}
