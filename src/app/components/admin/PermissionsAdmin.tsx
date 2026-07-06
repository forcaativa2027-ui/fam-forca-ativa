"use client";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Shield, AlertCircle, Users, Building2, Save, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { usePastors, useChurches } from "@/hooks/use-queries";
import { supabase } from "@/lib/supabase/client";
import { setPastorScope } from "@/services/pastorScope";
import { logAudit } from "@/services/audit";

const TYPE_LABELS: Record<string, string> = {
  sede: "Sede", nucleo: "Núcleo", igreja_local: "Igreja Local",
};

export function PermissionsAdmin() {
  const qc = useQueryClient();
  const { data: pastors = [] } = usePastors();
  const { data: churches = [] } = useChurches();
  const [busy, setBusy] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [pending, setPending] = useState<Record<string, string>>({});

  const churchMap = new Map(churches.map(c => [c.id, c]));
  const sortedChurches = [...churches].sort((a, b) => {
    const order = (t: string) => t === "sede" ? 0 : t === "nucleo" ? 1 : 2;
    return order(a.type) - order(b.type) || a.name.localeCompare(b.name);
  });

  const withoutScope = pastors.filter(p => !p.church_id);
  const withScope = pastors.filter(p => p.church_id);

  async function save(profileId: string) {
    const target = pending[profileId] ?? "";
    setBusy(profileId); setSaved(null);
    try {
      await setPastorScope(supabase, profileId, target || null);
      await logAudit(supabase, "update", "profiles", profileId, { church_id: target || null });
      setSaved(profileId);
      setTimeout(() => setSaved(null), 2500);
      qc.invalidateQueries({ queryKey: ["pastors"] });
      qc.invalidateQueries({ queryKey: ["pastors-without-scope-count"] });
      // Não limpa o pending — fica como valor escolhido
    } catch (e: unknown) {
      console.error("[PermissionsAdmin] save error:", e);
      alert(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-gold" />Permissões hierárquicas</CardTitle>
          <CardDescription>
            Atribua a comunidade que cada pastor administra. Pastor de Sede vê toda a árvore subordinada (Sede → Núcleos → Locais).
            Pastor sem escopo definido vê tudo (modo legado).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="rounded-md border-l-4 border-l-blue-500 bg-blue-50 p-3 text-xs text-blue-900">
            <b>Regras:</b> Apóstolo sempre vê tudo. Pastor com escopo vê apenas a comunidade dele e descendentes na árvore organizacional.
            Líder de LG vê apenas seu Life Group. Membro vê apenas suas próprias informações.
          </div>
        </CardContent>
      </Card>

      {/* Pastores sem escopo — destaque vermelho */}
      {withoutScope.length > 0 && (
        <Card className="border-l-4 border-l-red-400">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-red-700">
              <AlertCircle className="h-4 w-4" />
              {withoutScope.length} pastor(es) sem escopo definido
            </CardTitle>
            <CardDescription>Esses pastores estão em modo legado e veem TODOS os dados. Atribua escopo pra restringir.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {withoutScope.map(p => (
              <PastorRow key={p.id} pastor={p} churches={sortedChurches} churchMap={churchMap}
                pending={pending[p.id] ?? ""}
                onChange={(v) => setPending(prev => ({ ...prev, [p.id]: v }))}
                busy={busy === p.id} saved={saved === p.id}
                onSave={() => save(p.id)} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Pastores com escopo definido */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Users className="h-4 w-4 text-gold" />Pastores com escopo definido ({withScope.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {withScope.length === 0 ? (
            <p className="text-sm italic text-muted">Nenhum pastor com escopo definido ainda.</p>
          ) : withScope.map(p => (
            <PastorRow key={p.id} pastor={p} churches={sortedChurches} churchMap={churchMap}
              pending={pending[p.id] ?? p.church_id ?? ""}
              onChange={(v) => setPending(prev => ({ ...prev, [p.id]: v }))}
              busy={busy === p.id} saved={saved === p.id}
              onSave={() => save(p.id)} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function PastorRow({ pastor, churches, churchMap, pending, onChange, onSave, busy, saved }: {
  pastor: { id: string; full_name: string; email: string | null; church_id: string | null };
  churches: { id: string; name: string; type: string }[];
  churchMap: Map<string, { name: string; type: string }>;
  pending: string;
  onChange: (v: string) => void;
  onSave: () => void;
  busy: boolean;
  saved: boolean;
}) {
  const currentChurch = pastor.church_id ? churchMap.get(pastor.church_id) : null;
  const isDirty = pending !== (pastor.church_id ?? "");

  return (
    <div className="rounded-md border bg-card p-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <b className="text-sm text-navy">{pastor.full_name}</b>
          {pastor.email && <p className="text-[11px] text-muted">{pastor.email}</p>}
          {currentChurch && (
            <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-gold">
              <Building2 className="h-3 w-3" />Escopo atual: {currentChurch.name} ({TYPE_LABELS[currentChurch.type]})
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="min-w-[200px]">
            <Label className="mb-1 block text-[10px] uppercase tracking-wider text-muted">Comunidade administrada</Label>
            <select value={pending} onChange={(e) => onChange(e.target.value)}
              className="h-9 w-full rounded-md border bg-background px-2 text-xs">
              <option value="">— Sem escopo (vê tudo) —</option>
              {churches.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({TYPE_LABELS[c.type]})</option>
              ))}
            </select>
          </div>
          <Button onClick={onSave} disabled={!isDirty || busy} size="sm" className="gap-1 self-end">
            {busy ? <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
              : saved ? <CheckCircle2 className="h-3 w-3" />
              : <Save className="h-3 w-3" />}
            {busy ? "..." : saved ? "Salvo!" : "Salvar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
