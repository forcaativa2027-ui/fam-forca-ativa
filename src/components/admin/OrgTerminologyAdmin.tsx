"use client";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Tags } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase/client";
import { useMyProfile, useOrgTerminology } from "@/hooks/use-queries";
import { useTenant } from "@/contexts/TenantContext";
import * as OrgTerm from "@/services/orgTerminology";

const CONCEPT_LABELS: Record<string, string> = {
  nacional: "Nível Nacional", sede: "Nível Sede/Estado", area: "Nível Área",
  distrito: "Nível Distrito", setor: "Nível Setor", nucleo: "Nível Núcleo",
  igreja: "Nível Igreja/Comunidade", lg: "Grupo de Acompanhamento (Life Group)",
};

/**
 * Terminologia Organizacional — permite renomear os níveis
 * hierárquicos (Núcleo, Setor, Distrito…) usados em toda a
 * plataforma, sem mexer na estrutura de dados por trás.
 * Reaproveita o mesmo princípio do CORE-TERM-001 (já aplicado no
 * KIDS), agora pra plataforma toda.
 */
export function OrgTerminologyAdmin() {
  const { data: me } = useMyProfile();
  const tenantContext = useTenant();
  const tenantId = tenantContext.tenant?.id ?? null;
  const qc = useQueryClient();
  const { data: terms = {} } = useOrgTerminology(tenantId);
  const [edited, setEdited] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  async function save(key: string) {
    const value = (edited[key] ?? terms[key] ?? "").trim();
    if (!value) return;
    setBusy(key);
    try {
      await OrgTerm.setOrgTerm(supabase, key, value, me?.id, tenantId);
      qc.invalidateQueries({ queryKey: ["org-terminology"] });
      setEdited((prev) => { const n = { ...prev }; delete n[key]; return n; });
    } finally { setBusy(null); }
  }

  return (
    <div className="space-y-4 p-4">
      <div>
        <h2 className="flex items-center gap-2 font-display text-xl text-navy"><Tags className="h-5 w-5 text-gold" />Terminologia Organizacional</h2>
        <p className="text-sm text-muted-foreground">Renomeie os níveis usados em toda a plataforma (Núcleo, Setor, Distrito…) sem afetar a estrutura de dados.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Níveis hierárquicos</CardTitle>
          <CardDescription>Configuração da organização atual. A chave técnica continua estável e só o nome exibido é alterado.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {Object.entries(CONCEPT_LABELS).map(([key, description]) => (
            <div key={key} className="flex items-center gap-2 rounded-md border p-2">
              <div className="w-48 shrink-0">
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
              <Input
                value={edited[key] ?? terms[key] ?? ""}
                onChange={(e) => setEdited((prev) => ({ ...prev, [key]: e.target.value }))}
                className="h-8 text-sm"
              />
              <Button size="sm" onClick={() => save(key)} disabled={busy === key || edited[key] === undefined}>
                {busy === key ? "Salvando…" : "Salvar"}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
