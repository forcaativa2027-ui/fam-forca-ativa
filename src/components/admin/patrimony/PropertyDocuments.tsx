"use client";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, FileText, Trash2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { usePropertyDocs } from "@/hooks/use-queries";
import { supabase } from "@/lib/supabase/client";
import { uploadPatrimonyFile, getSignedUrl, createPropertyDoc, createPropertyDocVersion, deletePropertyDoc } from "@/services/patrimony";
import type { Property } from "@/types/domain";
import { PROPERTY_DOC_TYPES } from "./PatrimonyTypes";
import { Field } from "./PatrimonyHelpers";

export function PropertyDetail({ property: p, onClose }: { property: Property; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: docs = [] } = usePropertyDocs(p.id);
  const [newVersionFor, setNewVersionFor] = useState<import("@/types/domain").PropertyDocument | null>(null);

  function refresh() {
    qc.invalidateQueries({ queryKey: ["property-docs", p.id] });
  }

  return (
    <Card className="border-2 border-navy/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{p.name}</CardTitle>
          <Button onClick={onClose} variant="ghost" size="sm"><X className="h-3.5 w-3.5" /></Button>
        </div>
        <CardDescription>Acervo Patrimonial Digital — documentação jurídica e administrativa do imóvel</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <PropertyDocUploaderForm propertyId={p.id} churchId={p.church_id} onSaved={refresh} />

        <div className="space-y-2">
          {docs.length === 0 && <p className="text-sm italic text-muted">Nenhum documento no acervo ainda.</p>}
          {docs.map(d => (
            <PropertyDocRow key={d.id} doc={d}
              onDelete={async () => {
                if (!confirm("Apagar este documento do acervo?")) return;
                await deletePropertyDoc(supabase, d.id, d.storage_path);
                refresh();
              }}
              onNewVersion={() => setNewVersionFor(d)}
            />
          ))}
        </div>

        {newVersionFor && (
          <NewVersionDialog doc={newVersionFor} propertyId={p.id} churchId={p.church_id}
            onClose={() => setNewVersionFor(null)}
            onSaved={() => { setNewVersionFor(null); refresh(); }} />
        )}
      </CardContent>
    </Card>
  );
}

function PropertyDocUploaderForm({ propertyId, churchId, onSaved }: {
  propertyId: string; churchId: string; onSaved: () => void;
}) {
  const [docType, setDocType] = useState<string>(PROPERTY_DOC_TYPES[0][0]);
  const [title, setTitle] = useState("");
  const [docNumber, setDocNumber] = useState("");
  const [issuedAt, setIssuedAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [issuingBody, setIssuingBody] = useState("");
  const [observations, setObservations] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function go() {
    if (!file) { setErr("Selecione um arquivo PDF."); return; }
    if (!title.trim()) { setErr("Informe um título."); return; }
    setBusy(true); setErr("");
    try {
      const up = await uploadPatrimonyFile(supabase, churchId, `properties/${propertyId}`, file);
      await createPropertyDoc(supabase, {
        property_id: propertyId, doc_type: docType, title: title.trim(),
        storage_path: up.path, size_bytes: up.size, mime_type: up.mime,
        doc_number: docNumber || null,
        issued_at: issuedAt || null,
        expires_at: expiresAt || null,
        issuing_body: issuingBody || null,
        observations: observations || null,
      });
      setFile(null); setTitle(""); setDocNumber(""); setIssuedAt("");
      setExpiresAt(""); setIssuingBody(""); setObservations("");
      setDocType(PROPERTY_DOC_TYPES[0][0]);
      onSaved();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Erro no upload");
    } finally { setBusy(false); }
  }

  return (
    <div className="rounded-md border-2 border-dashed border-gold/30 bg-gold/5 p-3 space-y-3">
      <Label className="block text-xs font-bold uppercase tracking-wider text-gold">Adicionar ao Acervo Documental</Label>

      <div className="grid gap-2 sm:grid-cols-2">
        <Field label="Tipo de documento">
          <select value={docType} onChange={(e) => setDocType(e.target.value)}
            className="h-9 w-full rounded-md border bg-background px-2 text-sm">
            {PROPERTY_DOC_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
        <Field label="Título *">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Escritura do Templo Sede" />
        </Field>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <Field label="Número do documento">
          <Input value={docNumber} onChange={(e) => setDocNumber(e.target.value)} placeholder="Ex: 12345/2020" />
        </Field>
        <Field label="Data de emissão">
          <Input type="date" value={issuedAt} onChange={(e) => setIssuedAt(e.target.value)} />
        </Field>
        <Field label="Data de validade">
          <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
        </Field>
      </div>

      <Field label="Órgão emissor">
        <Input value={issuingBody} onChange={(e) => setIssuingBody(e.target.value)} placeholder="Ex: Cartório do 3º Ofício, Prefeitura Municipal..." />
      </Field>

      <Field label="Observações">
        <Input value={observations} onChange={(e) => setObservations(e.target.value)} placeholder="Notas adicionais (opcional)" />
      </Field>

      <Field label="Arquivo (PDF) *">
        <Input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      </Field>

      {err && <p className="text-xs text-destructive">{err}</p>}
      <Button onClick={go} disabled={busy} size="sm" className="gap-1.5">
        <Upload className="h-3.5 w-3.5" />{busy ? "Enviando…" : "Salvar no Acervo"}
      </Button>
      <p className="text-[10px] text-muted">Apenas PDF. Limite 20 MB.</p>
    </div>
  );
}

function PropertyDocRow({ doc, onDelete, onNewVersion }: {
  doc: import("@/types/domain").PropertyDocument;
  onDelete: () => void;
  onNewVersion: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const today = new Date();
  const expiresAt = doc.expires_at ? new Date(doc.expires_at) : null;
  const daysLeft = expiresAt ? Math.floor((expiresAt.getTime() - today.getTime()) / 86400000) : null;
  const isExpiringSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 90;
  const isExpired = daysLeft !== null && daysLeft < 0;

  async function openDoc() {
    if (!doc.storage_path) return;
    setBusy(true);
    try {
      const url = await getSignedUrl(supabase, doc.storage_path, 600);
      if (url) window.open(url, "_blank", "noopener,noreferrer");
    } finally { setBusy(false); }
  }

  const docTypeLabel = PROPERTY_DOC_TYPES.find(([v]) => v === doc.doc_type)?.[1] ?? doc.doc_type;

  return (
    <div className={`rounded-md border p-3 ${isExpired ? "border-l-4 border-l-red-500 bg-red-50/30" : isExpiringSoon ? "border-l-4 border-l-yellow-400 bg-yellow-50/30" : "bg-card"}`}>
      <div className="flex items-start gap-2">
        <FileText className="h-4 w-4 shrink-0 text-gold mt-0.5" />
        <div className="min-w-0 flex-1">
          <button onClick={openDoc} disabled={busy} className="block text-left text-sm font-semibold text-navy hover:underline">
            {busy ? "Abrindo…" : doc.title}
          </button>
          <p className="text-[10px] uppercase tracking-wider text-muted mt-0.5">
            {docTypeLabel}{doc.doc_number ? ` · Nº ${doc.doc_number}` : ""}{doc.version > 1 ? ` · v${doc.version}` : ""}
          </p>
          <div className="flex flex-wrap gap-3 mt-1 text-[11px] text-muted">
            {doc.issued_at && <span>Emitido: {new Date(doc.issued_at).toLocaleDateString("pt-BR")}</span>}
            {doc.issuing_body && <span>{doc.issuing_body}</span>}
          </div>
          {expiresAt && (
            <p className={`mt-1 text-[11px] font-bold flex items-center gap-1 ${isExpired ? "text-red-700" : isExpiringSoon ? "text-yellow-700" : "text-muted"}`}>
              {(isExpired || isExpiringSoon) && <AlertTriangle className="h-3 w-3" />}
              {isExpired
                ? `Venceu há ${Math.abs(daysLeft!)} dia(s)`
                : isExpiringSoon
                  ? `Vence em ${daysLeft} dia(s)`
                  : `Válido até ${expiresAt.toLocaleDateString("pt-BR")}`}
            </p>
          )}
          {doc.observations && <p className="mt-1 text-[11px] italic text-muted">{doc.observations}</p>}
        </div>
        <div className="flex shrink-0 gap-1">
          <Button onClick={onNewVersion} variant="outline" size="sm" className="h-7 px-2 text-[10px]" title="Nova versão">
            v+
          </Button>
          <Button onClick={onDelete} variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive">
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function NewVersionDialog({ doc, propertyId, churchId, onClose, onSaved }: {
  doc: import("@/types/domain").PropertyDocument;
  propertyId: string; churchId: string;
  onClose: () => void; onSaved: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [expiresAt, setExpiresAt] = useState(doc.expires_at ?? "");
  const [issuedAt, setIssuedAt] = useState(new Date().toISOString().slice(0,10));

  async function go() {
    if (!file) { setErr("Selecione o novo arquivo."); return; }
    setBusy(true); setErr("");
    try {
      const up = await uploadPatrimonyFile(supabase, churchId, `properties/${propertyId}`, file);
      await createPropertyDocVersion(supabase, doc.id, {
        property_id: propertyId, doc_type: doc.doc_type, title: doc.title,
        storage_path: up.path, size_bytes: up.size, mime_type: up.mime,
        doc_number: doc.doc_number, issuing_body: doc.issuing_body,
        issued_at: issuedAt || null, expires_at: expiresAt || null,
      });
      onSaved();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Erro ao criar nova versão");
    } finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-5">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-base">Nova versão — {doc.title}</CardTitle>
          <CardDescription>A versão atual (v{doc.version}) será mantida no histórico</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Field label="Novo arquivo (PDF) *">
            <Input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </Field>
          <div className="grid gap-2 sm:grid-cols-2">
            <Field label="Nova data de emissão">
              <Input type="date" value={issuedAt} onChange={(e) => setIssuedAt(e.target.value)} />
            </Field>
            <Field label="Nova validade">
              <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
            </Field>
          </div>
          {err && <p className="text-xs text-destructive">{err}</p>}
          <div className="flex justify-end gap-2">
            <Button onClick={onClose} variant="outline" size="sm">Cancelar</Button>
            <Button onClick={go} disabled={busy} size="sm">{busy ? "Salvando…" : "Criar nova versão"}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
