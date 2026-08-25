"use client";
import { useState } from "react";
import { useLegalBases } from "@/hooks/useLegalBases";
import { LEGAL_BASIS_LABELS, DATA_CATEGORY_LABELS, RETENTION_LABELS, type LegalBasis } from "@/services/legalBases";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase/client";

export default function LegalBasesAdmin() {
  const { bases, loading, error, create, update, newVersion } = useLegalBases();
  const [form, setForm] = useState<Partial<LegalBasis>>({
    code: "",
    version: "1.0",
    purpose_code: "orientacao_inicial",
    purpose_description: "",
    data_category: "respostas_risco",
    legal_basis: "legitimo_interesse",
    legal_basis_description: "",
    recipient_type: "",
    retention_class: "R1",
    is_active: true,
  });
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!form.code || !form.purpose_code || !form.data_category || !form.legal_basis) {
      alert("Preencha code, purpose_code, data_category e legal_basis");
      return;
    }
    setCreating(true);
    try {
      const { data: { user } } = await (supabase as any).auth.getUser();
      await create({
        code: form.code!.trim(),
        version: (form.version || "1.0").trim(),
        purpose_code: form.purpose_code!.trim(),
        purpose_description: form.purpose_description || "",
        data_category: form.data_category as any,
        legal_basis: form.legal_basis as any,
        legal_basis_description: form.legal_basis_description || null,
        recipient_type: form.recipient_type?.trim() || null,
        retention_class: (form.retention_class as any) || "R1",
        is_active: !!form.is_active,
        approved_by: (user as any)?.id ?? null,
        effective_at: new Date().toISOString(),
      } as any);
      setForm({ code: "", version: "1.0", purpose_code: "orientacao_inicial", purpose_description: "", data_category: "respostas_risco", legal_basis: "legitimo_interesse", legal_basis_description: "", recipient_type: "", retention_class: "R1", is_active: true });
    } catch (e: any) {
      alert(e.message ?? String(e));
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (b: LegalBasis) => {
    try {
      await update(b.id, { is_active: !b.is_active } as any);
    } catch (e: any) { alert(e.message); }
  };

  const handleNewVersion = async (b: LegalBasis) => {
    const v = prompt(`Nova versão para ${b.code} (atual ${b.version}):`, String(Number(b.version) + 1 + ".0"));
    if (!v) return;
    try {
      await newVersion(b.id, v.trim());
    } catch (e: any) { alert(e.message); }
  };

  if (loading) return <div className="p-6">Carregando bases...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="container py-6 space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">JUR-02 · REV-02 RC-02</p>
        <h1 className="mt-2 font-display text-3xl text-fam-plum">Catálogo de Bases Jurídicas</h1>
        <p className="mt-2 text-sm text-fam-muted max-w-3xl">Sem base padrão. Cada operação (purpose_code + data_category) exige config aprovada, versionada e com retenção R1..R5. Alterações geram nova versão.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nova base</CardTitle>
          <CardDescription>Cadastre com aprovação da governança. Campos com * são obrigatórios.</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>code *</Label>
            <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="JUR02-ORIENT-INICIAL-R1" />
          </div>
          <div className="space-y-2">
            <Label>version *</Label>
            <Input value={form.version} onChange={e => setForm(f => ({ ...f, version: e.target.value }))} placeholder="1.0" />
          </div>
          <div className="space-y-2">
            <Label>purpose_code *</Label>
            <Input value={form.purpose_code} onChange={e => setForm(f => ({ ...f, purpose_code: e.target.value }))} placeholder="orientacao_inicial" />
          </div>
          <div className="space-y-2">
            <Label>purpose_description</Label>
            <Input value={form.purpose_description} onChange={e => setForm(f => ({ ...f, purpose_description: e.target.value }))} placeholder="Oferecer orientação inicial" />
          </div>
          <div className="space-y-2">
            <Label>data_category *</Label>
            <select className="w-full rounded-md border px-3 py-2 text-sm" value={form.data_category} onChange={e => setForm(f => ({ ...f, data_category: e.target.value as any }))}>
              {Object.entries(DATA_CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{k} — {v}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label>legal_basis *</Label>
            <select className="w-full rounded-md border px-3 py-2 text-sm" value={form.legal_basis} onChange={e => setForm(f => ({ ...f, legal_basis: e.target.value as any }))}>
              {Object.entries(LEGAL_BASIS_LABELS).map(([k, v]) => <option key={k} value={k}>{k} — {v}</option>)}
            </select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>legal_basis_description</Label>
            <Input value={form.legal_basis_description as string} onChange={e => setForm(f => ({ ...f, legal_basis_description: e.target.value }))} placeholder="Art. 11, I ... quando consentimento" />
          </div>
          <div className="space-y-2">
            <Label>recipient_type</Label>
            <Input value={form.recipient_type as string} onChange={e => setForm(f => ({ ...f, recipient_type: e.target.value }))} placeholder="CRAS / conselho_tutelar / saude / null" />
          </div>
          <div className="space-y-2">
            <Label>retention_class *</Label>
            <select className="w-full rounded-md border px-3 py-2 text-sm" value={form.retention_class} onChange={e => setForm(f => ({ ...f, retention_class: e.target.value as any }))}>
              {Object.entries(RETENTION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 md:col-span-2">
            <input type="checkbox" checked={!!form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} id="active" />
            <Label htmlFor="active">is_active (somente ativas aparecem para compartilhamento)</Label>
          </div>
          <div className="md:col-span-2">
            <Button onClick={handleCreate} disabled={creating}>{creating ? "Salvando..." : "Cadastrar base"}</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Catálogo ({bases.length})</CardTitle>
          <CardDescription>Versionado por (purpose_code, data_category, version). Inativa nasce como rascunho até aprovação.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {bases.map(b => (
            <div key={b.id} className="rounded-xl border border-fam-lavender p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono text-sm font-bold text-fam-plum">{b.code} <span className="text-fam-muted">v{b.version}</span> {b.is_active ? <Badge className="ml-2 bg-green-100 text-green-800">ativa</Badge> : <Badge variant="secondary">inativa</Badge>}</p>
                <p className="text-sm"><span className="font-semibold">{b.purpose_code}</span> — {b.purpose_description || "—"} • <span className="text-fam-muted">{b.data_category}</span> → <span className="font-medium">{b.legal_basis}</span></p>
                <p className="text-xs text-fam-muted">retention {b.retention_class} • recipient {b.recipient_type ?? "—"} • effective {new Date(b.effective_at).toLocaleDateString("pt-BR")}</p>
                {b.legal_basis_description && <p className="text-xs text-fam-muted">{b.legal_basis_description}</p>}
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" variant="outline" onClick={() => toggleActive(b)}>{b.is_active ? "Desativar" : "Ativar"}</Button>
                <Button size="sm" variant="outline" onClick={() => handleNewVersion(b)}>Nova versão</Button>
              </div>
            </div>
          ))}
          {bases.length === 0 && <p className="text-sm text-fam-muted">Nenhuma base cadastrada.</p>}
        </CardContent>
      </Card>

      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6 text-sm text-amber-900">
          <p className="font-semibold">Governança</p>
          <p className="mt-1">Alterar finalidade, base, destinatário, retenção ou permissão gera nova versão. Bases concretas dependem de aprovação jurídica (JUR-02). O app rejeita payload <code>{"{ share_entire_case: true }"}</code> sem seleção granular.</p>
        </CardContent>
      </Card>
    </div>
  );
}
