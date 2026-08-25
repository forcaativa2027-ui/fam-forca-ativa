"use client";
import { useEffect, useState } from "react";
import { useCaseShares } from "@/hooks/useCaseShares";
import { useActiveLegalBases } from "@/hooks/useLegalBases";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase/client";

export default function CompartilhamentosAdmin() {
  const [caseId, setCaseId] = useState("");
  const [conversationId, setConversationId] = useState("");
  const { shares, reload, create, updateStatus } = useCaseShares(caseId || null, conversationId || null);
  const { bases } = useActiveLegalBases();
  const [form, setForm] = useState({
    recipient_type: "CRAS",
    recipient_name: "",
    purpose_code: "encaminhamento_assistencia",
    legal_basis_id: "",
    retention_class: "R3",
    shared_fields: "contact_name, answers.AR-01",
    shared_files: "",
    reason: "",
  });
  const [creating, setCreating] = useState(false);
  const [testResult, setTestResult] = useState<boolean | null>(null);

  useEffect(() => {
    if (bases.length > 0 && !form.legal_basis_id) {
      setForm(f => ({ ...f, legal_basis_id: bases[0].id }));
    }
  }, [bases, form.legal_basis_id]);

  const handleCreate = async () => {
    if (!form.recipient_name || !form.reason) { alert("recipient_name e reason obrigatórios"); return; }
    if (!form.legal_basis_id) { alert("legal_basis_id obrigatório (JUR-02-TEC-08)"); return; }
    const fields = form.shared_fields.split(",").map(s => s.trim()).filter(Boolean);
    const files = form.shared_files.split(",").map(s => s.trim()).filter(Boolean);
    if (fields.length === 0 && files.length === 0) { alert("Selecione ao menos um campo ou arquivo (JUR-02-TEC-05/06)"); return; }
    if (fields.includes("*") || files.includes("*")) { alert("share_entire_case bloqueado: use seleção granular"); return; }
    setCreating(true);
    try {
      await create({
        case_id: caseId || null,
        conversation_id: conversationId || null,
        recipient_type: form.recipient_type,
        recipient_name: form.recipient_name.trim(),
        purpose_code: form.purpose_code.trim(),
        legal_basis_id: form.legal_basis_id,
        retention_class: form.retention_class,
        shared_fields: fields,
        shared_files: files,
        reason: form.reason.trim(),
      });
      setForm(f => ({ ...f, recipient_name: "", reason: "", shared_fields: "contact_name, answers.AR-01", shared_files: "" }));
    } catch (e: any) { alert(e.message); } finally { setCreating(false); }
  };

  const handleTestBlock = async () => {
    if (!caseId && !conversationId) { alert("Informe case_id ou conversation_id para testar"); return; }
    try {
      const { supabase: sb } = await import("@/lib/supabase/client");
      const { createCaseShare } = await import("@/services/caseShares");
      await createCaseShare({
        case_id: caseId || null,
        conversation_id: conversationId || null,
        recipient_type: "CRAS",
        recipient_name: "Teste",
        purpose_code: "encaminhamento_assistencia",
        legal_basis_id: form.legal_basis_id || bases[0]?.id,
        retention_class: "R3",
        shared_fields: ["*"],
        shared_files: [],
        reason: "teste bloqueio share_entire_case",
      }, sb as any);
      setTestResult(false);
    } catch (e: any) {
      setTestResult(e.message?.includes("share_entire_case bloqueado"));
    }
  };

  return (
    <div className="container py-6 space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">JUR-02 · REV-02 RC-06</p>
        <h1 className="mt-2 font-display text-3xl text-fam-plum">Compartilhamentos</h1>
        <p className="mt-2 text-sm text-fam-muted max-w-3xl">Granular, auditável, com base jurídica obrigatória. Rejeita <code>{"{ share_entire_case: true }"}</code> e <code>["*"]</code>. Cada share exige destinatário + finalidade + base + seleção mínima + responsável.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Filtro por caso/conversa</CardTitle><CardDescription>Informe ao menos um para listar e criar</CardDescription></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>case_id (uuid)</Label><Input value={caseId} onChange={e => setCaseId(e.target.value)} placeholder="fam_risk_cases.id" /></div>
          <div className="space-y-2"><Label>conversation_id (uuid)</Label><Input value={conversationId} onChange={e => setConversationId(e.target.value)} placeholder="fam_conversations.id" /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Novo compartilhamento</CardTitle><CardDescription>Seleção mínima obrigatória (JUR-02-TEC-05/06)</CardDescription></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>recipient_type *</Label><Input value={form.recipient_type} onChange={e => setForm(f => ({ ...f, recipient_type: e.target.value }))} placeholder="CRAS / conselho_tutelar / saude" /></div>
          <div className="space-y-2"><Label>recipient_name *</Label><Input value={form.recipient_name} onChange={e => setForm(f => ({ ...f, recipient_name: e.target.value }))} placeholder="CRAS Samambaia Norte" /></div>
          <div className="space-y-2"><Label>purpose_code *</Label><Input value={form.purpose_code} onChange={e => setForm(f => ({ ...f, purpose_code: e.target.value }))} placeholder="encaminhamento_assistencia" /></div>
          <div className="space-y-2"><Label>legal_basis_id * (catálogo JUR-02)</Label>
            <select className="w-full rounded-md border px-3 py-2 text-sm" value={form.legal_basis_id} onChange={e => setForm(f => ({ ...f, legal_basis_id: e.target.value }))}>
              <option value="">Selecione</option>
              {bases.map(b => <option key={b.id} value={b.id}>{b.code} v{b.version} — {b.purpose_code}/{b.data_category} — {b.legal_basis}</option>)}
            </select>
          </div>
          <div className="space-y-2"><Label>retention_class *</Label><select className="w-full rounded-md border px-3 py-2 text-sm" value={form.retention_class} onChange={e => setForm(f => ({ ...f, retention_class: e.target.value }))}><option value="R1">R1</option><option value="R2">R2</option><option value="R3">R3</option><option value="R4">R4</option><option value="R5">R5</option></select></div>
          <div className="space-y-2"><Label>reason *</Label><Input value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} placeholder="Atendimento socioassistencial - CRAS" /></div>
          <div className="space-y-2 md:col-span-2"><Label>shared_fields * (csv, ex: contact_name, answers.AR-01)</Label><Input value={form.shared_fields} onChange={e => setForm(f => ({ ...f, shared_fields: e.target.value }))} /></div>
          <div className="space-y-2 md:col-span-2"><Label>shared_files (csv de storage_path)</Label><Input value={form.shared_files} onChange={e => setForm(f => ({ ...f, shared_files: e.target.value }))} placeholder="fam-attachments/uid/file.pdf" /></div>
          <div className="md:col-span-2 flex gap-2">
            <Button onClick={handleCreate} disabled={creating || (!caseId && !conversationId)}>{creating ? "Criando..." : "Criar share"}</Button>
            <Button variant="outline" onClick={handleTestBlock}>Testar bloqueio share_entire_case</Button>
            {testResult !== null && <Badge className={testResult ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>{testResult ? "Bloqueio OK ✓" : "Falhou ✗"}</Badge>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Shares ({shares.length})</CardTitle><CardDescription>Auditoria em fam_share_audit</CardDescription></CardHeader>
        <CardContent className="space-y-2">
          {shares.map(s => (
            <div key={s.id} className="rounded-xl border p-3 flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="font-mono text-sm font-bold">{s.recipient_name} <span className="text-fam-muted">({s.recipient_type})</span> <Badge variant={s.status === "sent" ? "default" : "secondary"}>{s.status}</Badge></p>
                <p className="text-xs text-fam-muted">purpose {s.purpose_code} • base {s.legal_basis_id.slice(0,8)}… • retention {s.retention_class}</p>
                <p className="text-xs">fields [{s.shared_fields.join(", ")}] • files [{s.shared_files.join(", ")}]</p>
                <p className="text-xs text-fam-muted">{s.reason} • {new Date(s.created_at).toLocaleString("pt-BR")}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                {s.status === "pending" && <Button size="sm" onClick={() => updateStatus(s.id, "approved")}>Aprovar</Button>}
                {s.status === "approved" && <Button size="sm" onClick={() => updateStatus(s.id, "sent")}>Marcar enviado</Button>}
                {s.status !== "rejected" && s.status !== "cancelled" && <Button size="sm" variant="outline" onClick={() => updateStatus(s.id, "rejected")}>Rejeitar</Button>}
              </div>
            </div>
          ))}
          {shares.length === 0 && <p className="text-sm text-fam-muted">Nenhum share para este caso/conversa. Informe um UUID acima.</p>}
        </CardContent>
      </Card>

      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6 text-sm text-amber-900">
          <p className="font-semibold">Validação</p>
          <p className="mt-1">Tente criar um share com <code>shared_fields=["*"]</code> → deve falhar com <code>share_entire_case bloqueado</code>. O backend bloqueia via trigger <code>fam_case_shares_block_entire()</code> (JUR-02-TEC-04) e exige ao menos um campo/arquivo (JUR-02-TEC-05/06).</p>
        </CardContent>
      </Card>
    </div>
  );
}
