"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gavel, ClipboardList } from "lucide-react";
import { DelegationsAdmin } from "@/components/admin/DelegationsAdmin";
import { AuditAdmin } from "@/components/admin/AuditAdmin";

export function GovernanceTabs() {
  return (
    <Tabs defaultValue="delegations" className="space-y-4">
      <TabsList>
        <TabsTrigger value="delegations" className="gap-1.5">
          <Gavel size={14} /> Delegações
        </TabsTrigger>
        <TabsTrigger value="audit" className="gap-1.5">
          <ClipboardList size={14} /> Auditoria
        </TabsTrigger>
      </TabsList>
      <TabsContent value="delegations"><DelegationsAdmin /></TabsContent>
      <TabsContent value="audit"><AuditAdmin /></TabsContent>
    </Tabs>
  );
}
