"use client";
import { useState, useEffect } from "react";
import { FileText, FolderOpen, Trash2, Upload } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase/client";
import type { GpvPessoa, GpvVinculo, GpvDocumento, TipoDoc } from "./GpvTypes";
import { TIPO_DOC_LABELS } from "./GpvTypes";
import { Field } from "./GpvHelpers";

export function DocumentosTab() {
  const [pessoas, setPessoas] = useState<GpvPessoa[]>([]);
  const [vinculos, setVinculos] = useState<GpvVinculo[]>([]);
  const [documentos, setDocumentos] = useState<GpvDocumento[]>([]);
  const [pessoaId, setPessoaId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [tipoDoc, setTipoDoc] = useState<TipoDoc>("contrato");
  const [titulo, setTitulo] = useState("");
  const [vinculoIdDoc, setVinculoIdDoc] = useState("");

  useEffect(() => {
    supabase.from("gpv_pessoas").select("id, full_name").eq("is_active", true).order("full_name")
      .then(({ data }) => setPessoas((data as GpvPessoa[]) ?? []));
  }, []);

  useEffect(() => {
    if (!pessoaId) return;
    supabase.from("gpv_vinculos").select("id, cargo, tipo_vinculo_id, gpv_tipos_vinculo(nome)")
      .eq("pessoa_id", pessoaId).eq("status", "ativo")
      .then(({ data }) => setVinculos((data as unknown as GpvVinculo[]) ?? []));
    loadDocs(pessoaId);
  }, [pessoaId]);

  async function loadDocs(id: string) {
    const { data } = await supabase.from("gpv_documentos").select("*").eq("pessoa_id", id).order("created_at", { ascending: false });
    setDocumentos((data as GpvDocumento[]) ?? []);
  }

  async function upload() {
    if (!file || !pessoaId || !titulo) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `pessoas/${pessoaId}/docs/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("gpv").upload(path, file);
      if (upErr) throw upErr;
      await supabase.from("gpv_documentos").insert({
        pessoa_id: pessoaId, vinculo_id: vinculoIdDoc || null,
        tipo_doc: tipoDoc, titulo, storage_path: path,
        size_bytes: file.size, mime_type: file.type,
      });
      setFile(null); setTitulo("");
      loadDocs(pessoaId);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Erro no upload");
    } finally { setUploading(false); }
  }

  async function openDoc(path: string) {
    const { data } = await supabase.storage.from("gpv").createSignedUrl(path, 600);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function removeDoc(doc: GpvDocumento) {
    if (!confirm("Apagar este documento?")) return;
    await supabase.storage.from("gpv").remove([doc.storage_path]);
    await supabase.from("gpv_documentos").delete().eq("id", doc.id);
    loadDocs(pessoaId);
  }

  return (
    <div className="space-y-4">
      <Field label="Selecionar pessoa">
        <select value={pessoaId} onChange={(e) => setPessoaId(e.target.value)}
          className="h-9 rounded-md border bg-background px-3 text-sm max-w-xs">
          <option value="">— Selecione —</option>
          {pessoas.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
        </select>
      </Field>

      {pessoaId && (
        <>
          {/* Uploader */}
          <Card className="border-2 border-dashed border-gold/30 bg-gold/5">
            <CardContent className="pt-4 space-y-3">
              <Label className="text-xs font-bold uppercase tracking-wider text-gold">Adicionar documento</Label>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Tipo de documento">
                  <select value={tipoDoc} onChange={(e) => setTipoDoc(e.target.value as TipoDoc)}
                    className="h-9 w-full rounded-md border bg-background px-2 text-sm">
                    {Object.entries(TIPO_DOC_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </Field>
                <Field label="Vínculo (opcional)">
                  <select value={vinculoIdDoc} onChange={(e) => setVinculoIdDoc(e.target.value)}
                    className="h-9 w-full rounded-md border bg-background px-2 text-sm">
                    <option value="">— Sem vínculo específico —</option>
                    {vinculos.map((v) => (
                      <option key={v.id} value={v.id}>{v.cargo ?? "Sem cargo"}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Título *">
                <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Contrato de prestação de serviços" />
              </Field>
              <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.xml" />
              <Button onClick={upload} disabled={!file || !titulo || uploading} size="sm" className="gap-1.5">
                <Upload className="h-3.5 w-3.5" />{uploading ? "Enviando…" : "Enviar documento"}
              </Button>
            </CardContent>
          </Card>

          {/* Lista de documentos */}
          <div className="space-y-1.5">
            {documentos.length === 0 && <p className="text-sm italic text-muted">Nenhum documento cadastrado.</p>}
            {documentos.map((d) => (
              <div key={d.id} className="flex items-center gap-2 rounded-md border bg-card p-2.5">
                <FileText className="h-4 w-4 shrink-0 text-gold" />
                <div className="flex-1 min-w-0">
                  <button onClick={() => openDoc(d.storage_path)}
                    className="block w-full truncate text-left text-sm text-navy hover:underline font-medium">
                    {d.titulo}
                  </button>
                  <p className="text-[10px] uppercase tracking-wider text-muted">
                    {TIPO_DOC_LABELS[d.tipo_doc]} · {new Date(d.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <Button onClick={() => removeDoc(d)} variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </>
      )}

      {!pessoaId && (
        <Card>
          <CardContent className="pt-8 pb-8 text-center">
            <FolderOpen className="h-8 w-8 text-muted mx-auto mb-2" />
            <p className="text-sm text-muted">Selecione uma pessoa para gerenciar documentos.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
