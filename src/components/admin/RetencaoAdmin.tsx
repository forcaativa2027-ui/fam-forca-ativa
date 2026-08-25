"use client";
import { useState } from "react";
import { useLegalHolds, useRetention } from "@/hooks/useLegalHolds";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default function RetencaoAdmin() {
  const { holds, reload } = useLegalHolds();
  const { policies, review } = useRetention();
  const [scopeType, setScopeType] = useState("fam_risk_case");
  const [scopeId, setScopeId] = useState("");
  const [reason, setReason] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!scopeId || !reason) { alert("Informe scope_id e motivo"); return; }
    setCreating(true);
    try {
      const { createLegalHold } = await import("@/services/legalHolds");
      const { supabase } = await import("@/lib/supabase/client");
      await createLegalHold(scopeType, scopeId.trim(), reason.trim(), null, supabase as any);
      setScopeId(""); setReason("");
      reload();
    } catch (e: any) { alert(e.message); } finally { setCreating(false); }
  };

  const handleRelease = async (id: string) => {
    if (!confirm("Liberar legal_hold? A exclusão automática voltará a ser permitida para este escopo.")) return;
    const { releaseLegalHold } = await import("@/services/legalHolds");
    const { supabase } = await import("@/lib/supabase/client");
    await releaseLegalHold(id, supabase as any);
    reload();
  };

  return (
    <div className="container py-6 space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">POL-ARQ-01 · DEC-01</p>
        <h1 className="mt-2 font-display text-3xl text-fam-plum">Retenção & Legal Hold</h1>
        <p className="mt-2 text-sm text-fam-muted max-w-3xl">Sem prazo universal. R1..R5 com revisão periódica. Enquanto <code>legal_hold = active</code>, rotinas não removem o escopo.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Políticas R1..R5</CardTitle><CardDescription>Duração, revisão, estratégia de exclusão</CardDescription></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-3">
          {policies.map(p => (
            <div key={p.retention_class} className="rounded-xl border border-fam-lavender p-3">
              <p className="font-mono font-bold text-fam-plum">{p.retention_class} <Badge variant="secondary">{p.deletion_strategy}</Badge></p>
              <p className="text-sm">{p.description}</p>
              <p className="text-xs text-fam-muted mt-1">duração {p.duration_days ?? "enquanto durar finalidade"} dias • revisão a cada {p.review_interval_days}d • legal_hold {p.legal_hold_allowed ? "permitido" : "não"}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Criar Legal Hold</CardTitle><CardDescription>Preservação controlada — suspende exclusão automática</CardDescription></CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>scope_type</Label>
            <select className="w-full rounded-md border px-3 py-2 text-sm" value={scopeType} onChange={e => setScopeType(e.target.value)}>
              <option value="fam_risk_case">fam_risk_case</option>
              <option value="fam_conversation">fam_conversation</option>
              <option value="fam_attachment">fam_attachment</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>scope_id (uuid)</Label>
            <Input value={scopeId} onChange={e => setScopeId(e.target.value)} placeholder="uuid do caso/anexo" />
          </div>
          <div className="space-y-2">
            <Label>motivo</Label>
            <Input value={reason} onChange={e => setReason(e.target.value)} placeholder="investigação / obrigação legal / defesa" />
          </div>
          <div className="md:col-span-3">
            <Button onClick={handleCreate} disabled={creating}>{creating ? "Criando..." : "Ativar preservação"}</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Legal Holds ({holds.length})</CardTitle><CardDescription>ACTIVE = preservação vigente; RELEASED = liberado</CardDescription></CardHeader>
        <CardContent className="space-y-2">
          {holds.map(h => (
            <div key={h.id} className="rounded-xl border p-3 flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="font-mono text-sm font-bold">{h.scope_type} <span className="text-fam-muted">{h.scope_id.slice(0,8)}…</span> <Badge className={h.status === "active" ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-600"}>{h.status}</Badge></p>
                <p className="text-sm">{h.reason}</p>
                <p className="text-xs text-fam-muted">criado {new Date(h.created_at).toLocaleString("pt-BR")} • {h.expires_at ? `expira ${new Date(h.expires_at).toLocaleDateString()}` : "sem expiração"}</p>
              </div>
              {h.status === "active" && <Button size="sm" variant="outline" onClick={() => handleRelease(h.id)}>Liberar</Button>}
            </div>
          ))}
          {holds.length === 0 && <p className="text-sm text-fam-muted">Nenhum hold.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Revisão de retenção ({review.length})</CardTitle><CardDescription>Vencidos sem legal_hold — candidatos a exclusão revisada</CardDescription></CardHeader>
        <CardContent className="space-y-2">
          {review.map((r: any) => (
            <div key={r.scope_type + r.scope_id} className="rounded border p-2 text-xs flex justify-between">
              <span>{r.scope_type} {r.scope_id.slice(0,8)}… • {r.retention_class} • venceu {new Date(r.retention_due_at).toLocaleDateString("pt-BR")}</span>
              <Badge variant="secondary">revisar</Badge>
            </div>
          ))}
          {review.length === 0 && <p className="text-sm text-fam-muted">Nenhum item vencido.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
