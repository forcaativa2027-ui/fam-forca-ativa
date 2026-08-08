"use client";
import { useState } from "react";
import { FileText, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase/client";
import { getSignedUrl } from "@/services/patrimony";

export function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-l-4 border-l-gold bg-card p-3">
      <div className="flex items-center gap-2 text-navy-600">
        <span className="text-gold [&>svg]:h-4 [&>svg]:w-4">{icon}</span>
        <p className="text-[10px] uppercase tracking-wider">{label}</p>
      </div>
      <p className="mt-1 font-display text-xl text-navy">{value}</p>
    </div>
  );
}

export function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>{children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

/** Uploader genérico de documento (usado nos Bens — NF, manual, garantia...). */
export function DocumentUploader({ docTypes, onUpload }: {
  docTypes: string[];
  onUpload: (file: File, docType: string, title: string) => Promise<void>;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState(docTypes[0]);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);

  async function go() {
    if (!file) return;
    setBusy(true);
    try {
      await onUpload(file, docType, title);
      setFile(null); setTitle(""); setDocType(docTypes[0]);
    } finally { setBusy(false); }
  }

  return (
    <div className="rounded-md border-2 border-dashed border-gold/30 bg-gold/5 p-3 space-y-2">
      <Label className="block text-xs font-bold uppercase tracking-wider text-gold">Adicionar documento</Label>
      <div className="grid gap-2 sm:grid-cols-2">
        <select value={docType} onChange={(e) => setDocType(e.target.value)}
          className="h-9 rounded-md border bg-background px-2 text-sm">
          {docTypes.map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
        </select>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título (opcional)" />
      </div>
      <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        accept="image/*,application/pdf,application/xml,text/xml" />
      <Button onClick={go} disabled={!file || busy} size="sm" className="gap-1.5">
        <Upload className="h-3.5 w-3.5" />{busy ? "Enviando…" : "Enviar"}
      </Button>
      <p className="text-[10px] text-muted">Limite: 20 MB. Formatos: imagem, PDF, XML.</p>
    </div>
  );
}

export function DocRow({ doc, onDelete }: { doc: { id: string; title: string; doc_type: string; storage_path: string | null; mime_type: string | null }; onDelete: () => void }) {
  const [busy, setBusy] = useState(false);

  async function openDoc() {
    if (!doc.storage_path) return;
    setBusy(true);
    try {
      const url = await getSignedUrl(supabase, doc.storage_path, 600);
      if (url) window.open(url, "_blank", "noopener,noreferrer");
    } finally { setBusy(false); }
  }

  return (
    <div className="flex items-center gap-2 rounded-md border bg-card p-2">
      <FileText className="h-4 w-4 shrink-0 text-gold" />
      <div className="min-w-0 flex-1">
        <button onClick={openDoc} disabled={busy} className="block w-full truncate text-left text-sm text-navy hover:underline">
          {busy ? "Abrindo…" : doc.title}
        </button>
        <p className="text-[10px] uppercase tracking-wider text-muted">{doc.doc_type.replace(/_/g, " ")}</p>
      </div>
      <Button onClick={onDelete} variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive">
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}
