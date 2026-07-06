"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, History, BookOpen, GraduationCap } from "lucide-react";
import { VisaoGeralMembro } from "./VisaoGeralMembro";
import { LinhaDoTempoMembro } from "./LinhaDoTempoMembro";
import { DiscipuladoMembro } from "./DiscipuladoMembro";
import { TrilhaMaturidadeMembro } from "./TrilhaMaturidadeMembro";

export function MembroPanelTabs({ memberId }: { memberId: string }) {
  return (
    <Tabs defaultValue="visao-geral" className="space-y-4">
      <TabsList>
        <TabsTrigger value="visao-geral" className="gap-1.5"><LayoutDashboard size={14} /> Visão Geral</TabsTrigger>
        <TabsTrigger value="maturidade" className="gap-1.5"><GraduationCap size={14} /> Maturidade</TabsTrigger>
        <TabsTrigger value="timeline" className="gap-1.5"><History size={14} /> Linha do Tempo</TabsTrigger>
        <TabsTrigger value="discipulado" className="gap-1.5"><BookOpen size={14} /> Discipulado</TabsTrigger>
      </TabsList>
      <TabsContent value="visao-geral"><VisaoGeralMembro memberId={memberId} /></TabsContent>
      <TabsContent value="maturidade"><TrilhaMaturidadeMembro memberId={memberId} /></TabsContent>
      <TabsContent value="timeline"><LinhaDoTempoMembro memberId={memberId} /></TabsContent>
      <TabsContent value="discipulado"><DiscipuladoMembro memberId={memberId} /></TabsContent>
    </Tabs>
  );
}
