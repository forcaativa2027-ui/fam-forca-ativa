"use client";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Tag, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAssets, useProperties, useAssetDocs } from "@/hooks/use-queries";
import { supabase } from "@/lib/supabase/client";
import { createAsset, updateAsset, deleteAsset, uploadPatrimonyFile, createAssetDoc, deleteAssetDoc } from "@/services/patrimony";
import { logAudit, diffFields } from "@/services/audit";
import { assetSchema, type AssetInput } from "@/schemas";
import type { Asset, Property } from "@/types/domain";
import { CATEGORY_LABELS, CONDITION_LABELS, CONDITION_COLOR, ORIGIN_LABELS } from "./PatrimonyTypes";
import { Field, DocumentUploader, DocRow } from "./PatrimonyHelpers";

export function AssetsSection({ churches, initialChurchId = "" }: { churches: { id: string; name: string }[]; initialChurchId?: string }) {
  const [churchFilter, setChurchFilter] = useState<string>(initialChurchId || churches[0]?.id || "");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [editing, setEditing] = useState<Asset | null>(null);
  const [creating, setCreating] = useState(false);
  const [openAsset, setOpenAsset] = useState<Asset | null>(null);
  const { data: assets = [] } = useAssets({ churchId: churchFilter || null });
  const { data: properties = [] } = useProperties(churchFilter || null);
  const qc = useQueryClient();

  const filtered = useMemo(() =>
    categoryFilter ? assets.filter(a => a.category === categoryFilter) : assets,
    [assets, categoryFilter]
  );

  async function remove(a: Asset) {
    if (!confirm(`Remover bem "${a.name}"? Isso o desativa.`)) return;
    try {
      await deleteAsset(supabase, a.id);
      await logAudit(supabase, "delete", "assets", a.id, {}, { before: a as unknown as Record<string, unknown> });
      qc.invalidateQueries({ queryKey: ["assets"] });
      qc.invalidateQueries({ queryKey: ["patrimony-summary"] });
    } catch (e: unknown) { alert(e instanceof Error ? e.message : "Erro"); }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        {churches.length > 1 && (
          <div className="min-w-[180px]">
            <Label className="mb-1 block text-xs uppercase tracking-wider text-muted">Comunidade</Label>
            <select value={churchFilter} onChange={(e) => setChurchFilter(e.target.value)}
              className="h-9 w-full rounded-md border bg-background px-3 text-sm">
              {churches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}
        <div className="min-w-[180px]">
          <Label className="mb-1 block text-xs uppercase tracking-wider text-muted">Categoria</Label>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-9 w-full rounded-md border bg-background px-3 text-sm">
            <option value="">Todas</option>
            {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <Button onClick={() => setCreating(true)} className="gap-1.5"><Plus className="h-4 w-4" />Novo bem</Button>
      </div>

      {(editing || creating) && (
        <AssetForm churches={churches} properties={properties} editing={editing}
          defaultChurchId={churchFilter} onClose={() => { setEditing(null); setCreating(false); }} />
      )}

      {openAsset && (
        <AssetDetail asset={openAsset} onClose={() => setOpenAsset(null)} />
      )}

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 && <p className="col-span-full text-sm italic text-muted">Nenhum bem cadastrado.</p>}
        {filtered.map(a => <AssetCard key={a.id} asset={a}
          onEdit={() => { setEditing(a); setCreating(false); }}
          onOpen={() => setOpenAsset(a)}
          onRemove={() => remove(a)} />)}
      </div>
    </div>
  );
}

function AssetCard({ asset: a, onEdit, onOpen, onRemove }: { asset: Asset; onEdit: () => void; onOpen: () => void; onRemove: () => void }) {
  return (
    <Card className="border-l-4 border-l-gold">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-2">
          <button onClick={onOpen} className="min-w-0 flex-1 text-left">
            <b className="block truncate text-navy">{a.name}</b>
            <div className="mt-1 flex flex-wrap gap-1">
              <span className="rounded-md border border-gold/30 bg-gold/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-gold">
                {CATEGORY_LABELS[a.category]}
              </span>
              <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase ${CONDITION_COLOR[a.condition]}`}>
                {CONDITION_LABELS[a.condition]}
              </span>
            </div>
            {a.patrimony_code && (
              <p className="mt-1 flex items-center gap-1 text-[11px] text-muted"><Tag className="h-3 w-3" />{a.patrimony_code}</p>
            )}
            {a.acquisition_value !== null && a.acquisition_value > 0 && (
              <p className="mt-0.5 text-[11px] text-muted">R$ {Number(a.acquisition_value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
            )}
          </button>
          <div className="flex shrink-0 gap-1">
            <Button onClick={onEdit} variant="outline" size="sm" className="h-7 w-7 p-0"><Pencil className="h-3 w-3" /></Button>
            <Button onClick={onRemove} variant="destructive" size="sm" className="h-7 w-7 p-0"><Trash2 className="h-3 w-3" /></Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AssetForm({ churches, properties, editing, defaultChurchId, onClose }: {
  churches: { id: string; name: string }[];
  properties: Property[];
  editing: Asset | null;
  defaultChurchId: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [err, setErr] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<AssetInput>({
      resolver: zodResolver(assetSchema),
      defaultValues: editing ? {
        church_id: editing.church_id,
        property_id: editing.property_id ?? "",
        patrimony_code: editing.patrimony_code ?? "",
        tag_number: editing.tag_number ?? "",
        name: editing.name, category: editing.category,
        subcategory: editing.subcategory ?? "",
        description: editing.description ?? "",
        manufacturer: editing.manufacturer ?? "",
        model: editing.model ?? "",
        serial_number: editing.serial_number ?? "",
        location_text: editing.location_text ?? "",
        acquired_at: editing.acquired_at ?? "",
        acquisition_value: Number(editing.acquisition_value ?? 0),
        origin: editing.origin, condition: editing.condition,
        is_durable: editing.is_durable,
        observations: editing.observations ?? "",
      } : {
        church_id: defaultChurchId,
        category: "mobiliario", condition: "bom", origin: "outro",
        is_durable: true, acquisition_value: 0,
      },
    });

  async function onSubmit(v: AssetInput) {
    setErr("");
    try {
      const payload = {
        church_id: v.church_id, property_id: v.property_id || null,
        patrimony_code: v.patrimony_code || null, tag_number: v.tag_number || null,
        name: v.name, category: v.category, subcategory: v.subcategory || null,
        description: v.description || null, manufacturer: v.manufacturer || null,
        model: v.model || null, serial_number: v.serial_number || null,
        location_text: v.location_text || null,
        acquired_at: v.acquired_at || null,
        acquisition_value: v.acquisition_value || 0,
        origin: v.origin, condition: v.condition, is_durable: v.is_durable,
        observations: v.observations || null,
      };
      if (editing) {
        await updateAsset(supabase, editing.id, payload);
        const diff = diffFields(editing as unknown as Record<string, unknown>, payload);
        await logAudit(supabase, "update", "assets", editing.id, {}, diff ?? undefined);
      } else {
        const created = await createAsset(supabase, payload);
        await logAudit(supabase, "insert", "assets", created.id, {}, { after: created as unknown as Record<string, unknown> });
      }
      qc.invalidateQueries({ queryKey: ["assets"] });
      qc.invalidateQueries({ queryKey: ["patrimony-summary"] });
      onClose();
    } catch (e: unknown) {
      console.error("[AssetForm]", e);
      setErr(e instanceof Error ? e.message : "Erro");
    }
  }

  return (
    <Card className="border-2 border-dashed border-gold/40 bg-gold/5">
      <CardContent className="pt-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="flex items-center justify-between">
            <b className="text-navy">{editing ? "Editar bem" : "Novo bem"}</b>
            <Button type="button" onClick={onClose} variant="ghost" size="sm" className="gap-1"><X className="h-3.5 w-3.5" />Fechar</Button>
          </div>

          {churches.length > 1 && (
            <Field label="Comunidade"><select {...register("church_id")} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
              {churches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select></Field>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nome" error={errors.name?.message}>
              <Input {...register("name")} placeholder="Ex: Cadeira do altar" />
            </Field>
            <Field label="Localização (sala, prateleira...)">
              <Input {...register("location_text")} />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Categoria">
              <select {...register("category")} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </Field>
            <Field label="Subcategoria">
              <Input {...register("subcategory")} placeholder="Cadeira / Notebook / etc." />
            </Field>
            <Field label="Localizado em (imóvel)">
              <select {...register("property_id")} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                <option value="">— Não vinculado —</option>
                {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Código patrimonial"><Input {...register("patrimony_code")} placeholder="Ex: PAT-0001" /></Field>
            <Field label="Nº de tombamento"><Input {...register("tag_number")} /></Field>
            <Field label="Estado de conservação">
              <select {...register("condition")} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                {Object.entries(CONDITION_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Fabricante"><Input {...register("manufacturer")} /></Field>
            <Field label="Modelo"><Input {...register("model")} /></Field>
            <Field label="Número de série"><Input {...register("serial_number")} /></Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Origem do bem">
              <select {...register("origin")} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                {Object.entries(ORIGIN_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </Field>
            <Field label="Data de aquisição" error={errors.acquired_at?.message}>
              <Input type="date" {...register("acquired_at")} />
            </Field>
            <Field label="Valor de aquisição (R$)" error={errors.acquisition_value?.message}>
              <Input type="number" step="0.01" min={0} {...register("acquisition_value")} placeholder="0,00" />
            </Field>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("is_durable")} className="h-4 w-4 accent-gold" />
            Bem durável (se desmarcado: material de consumo / não-durável)
          </label>

          <Field label="Descrição">
            <textarea {...register("description")} rows={2} className="w-full rounded-md border bg-background p-2 text-sm" />
          </Field>

          <Field label="Observações">
            <textarea {...register("observations")} rows={2} className="w-full rounded-md border bg-background p-2 text-sm" />
          </Field>

          {err && <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">{err}</p>}
          <Button type="submit" disabled={isSubmitting} className="gap-2">
            {isSubmitting ? "Salvando…" : (editing ? "Salvar alterações" : "Cadastrar bem")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function AssetDetail({ asset: a, onClose }: { asset: Asset; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: docs = [] } = useAssetDocs(a.id);

  async function handleUpload(file: File, docType: string, title: string) {
    try {
      const up = await uploadPatrimonyFile(supabase, a.church_id, `assets/${a.id}`, file);
      await createAssetDoc(supabase, {
        asset_id: a.id, doc_type: docType, title: title || file.name,
        storage_path: up.path, size_bytes: up.size, mime_type: up.mime,
      });
      qc.invalidateQueries({ queryKey: ["asset-docs", a.id] });
    } catch (e: unknown) {
      console.error("[upload]", e);
      alert(e instanceof Error ? e.message : "Erro no upload");
    }
  }

  return (
    <Card className="border-2 border-navy/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{a.name}</CardTitle>
          <Button onClick={onClose} variant="ghost" size="sm"><X className="h-3.5 w-3.5" /></Button>
        </div>
        <CardDescription>Documentos vinculados (NF, manual, garantia, termo de doação...)</CardDescription>
      </CardHeader>
      <CardContent>
        <DocumentUploader
          docTypes={["nota_fiscal", "danfe", "xml_nfe", "manual", "garantia", "termo_doacao", "comprovante_pagamento", "outro"]}
          onUpload={handleUpload}
        />
        <div className="mt-3 space-y-1.5">
          {docs.length === 0 && <p className="text-sm italic text-muted">Nenhum documento anexado.</p>}
          {docs.map(d => (
            <DocRow key={d.id} doc={d}
              onDelete={async () => {
                if (!confirm("Apagar este documento?")) return;
                await deleteAssetDoc(supabase, d.id, d.storage_path);
                qc.invalidateQueries({ queryKey: ["asset-docs", a.id] });
              }} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
