"use client";
import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  Briefcase, Home, Boxes, Plus, Pencil, Trash2, X, FileText, Upload, AlertTriangle,
  Building2, MapPin, DollarSign, Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useChurches, useProperties, useAssets, usePropertyDocs, useAssetDocs, usePatrimonySummary,
} from "@/hooks/use-queries";
import { supabase } from "@/lib/supabase/client";
import {
  createProperty, updateProperty, deleteProperty,
  createAsset, updateAsset, deleteAsset,
  uploadPatrimonyFile, getSignedUrl,
  createPropertyDoc, deletePropertyDoc,
  createAssetDoc, deleteAssetDoc,
} from "@/services/patrimony";
import { logAudit } from "@/services/audit";
import { propertySchema, type PropertyInput, assetSchema, type AssetInput } from "@/schemas";
import type {
  Property, Asset, OccupationType, AssetCategory, AssetCondition, AssetOrigin,
} from "@/types/domain";

// ============================================================
// LABELS
// ============================================================
const OCCUPATION_LABELS: Record<OccupationType, string> = {
  proprio: "Próprio", alugado: "Alugado", cedido: "Cedido",
  comodato: "Comodato", em_regularizacao: "Em Regularização",
};
const OCCUPATION_COLOR: Record<OccupationType, string> = {
  proprio: "bg-green-50 text-green-700 border-green-200",
  alugado: "bg-blue-50 text-blue-700 border-blue-200",
  cedido: "bg-purple-50 text-purple-700 border-purple-200",
  comodato: "bg-yellow-50 text-yellow-700 border-yellow-200",
  em_regularizacao: "bg-orange-50 text-orange-700 border-orange-200",
};
const CATEGORY_LABELS: Record<AssetCategory, string> = {
  mobiliario: "Mobiliário", equipamentos: "Equipamentos",
  som_multimidia: "Som e Multimídia", infraestrutura: "Infraestrutura",
  nao_duravel: "Não Durável",
};
const CONDITION_LABELS: Record<AssetCondition, string> = {
  novo: "Novo", otimo: "Ótimo", bom: "Bom", regular: "Regular",
  ruim: "Ruim", inutilizado: "Inutilizado", baixado: "Baixado",
};
const CONDITION_COLOR: Record<AssetCondition, string> = {
  novo: "bg-green-100 text-green-800 border-green-300",
  otimo: "bg-green-50 text-green-700 border-green-200",
  bom: "bg-blue-50 text-blue-700 border-blue-200",
  regular: "bg-yellow-50 text-yellow-700 border-yellow-200",
  ruim: "bg-orange-50 text-orange-700 border-orange-200",
  inutilizado: "bg-red-50 text-red-700 border-red-200",
  baixado: "bg-gray-100 text-gray-600 border-gray-300",
};
const ORIGIN_LABELS: Record<AssetOrigin, string> = {
  compra_nf: "Compra com NF", doacao: "Doação", sem_nf: "Sem NF",
  transferencia: "Transferência", comodato: "Comodato", outro: "Outro",
};

// ============================================================
// MASTER
// ============================================================
export function PatrimonyAdmin() {
  const { data: churches = [] } = useChurches();
  const { data: summary = [] } = usePatrimonySummary();

  const totalProperties = summary.reduce((s, x) => s + x.properties_count, 0);
  const totalAssets = summary.reduce((s, x) => s + x.assets_count, 0);
  const totalValue = summary.reduce((s, x) => s + Number(x.total_acquisition_value || 0), 0);
  const expiringSoon = summary.reduce((s, x) => s + x.contracts_expiring_90d, 0);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5 text-gold" />Patrimônio</CardTitle>
          <CardDescription>Imóveis, bens, documentação e fotos da rede CEC</CardDescription>
        </CardHeader>
        <CardContent>
          {expiringSoon > 0 && (
            <div className="mb-3 rounded-md border-l-4 border-l-red-500 bg-red-50 p-3 text-sm text-red-800">
              <b className="flex items-center gap-1"><AlertTriangle className="h-4 w-4" />{expiringSoon} contrato(s) vencendo nos próximos 90 dias.</b>
              <p className="mt-1 text-xs">Verifique aluguéis, comodatos e licenças nas comunidades.</p>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-4">
            <Kpi icon={<Home />} label="Imóveis" value={totalProperties} />
            <Kpi icon={<Boxes />} label="Bens" value={totalAssets} />
            <Kpi icon={<DollarSign />} label="Valor patrimonial" value={`R$ ${totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
            <Kpi icon={<Building2 />} label="Comunidades cobertas" value={summary.filter(s => s.properties_count > 0 || s.assets_count > 0).length} />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="properties">
        <TabsList>
          <TabsTrigger value="properties"><Home className="mr-1 h-4 w-4" />Imóveis</TabsTrigger>
          <TabsTrigger value="assets"><Boxes className="mr-1 h-4 w-4" />Bens</TabsTrigger>
        </TabsList>
        <TabsContent value="properties"><PropertiesSection churches={churches} /></TabsContent>
        <TabsContent value="assets"><AssetsSection churches={churches} /></TabsContent>
      </Tabs>
    </div>
  );
}

function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
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

// ============================================================
// SEÇÃO: IMÓVEIS
// ============================================================
function PropertiesSection({ churches }: { churches: { id: string; name: string }[] }) {
  const [churchFilter, setChurchFilter] = useState<string>(churches[0]?.id ?? "");
  const [editing, setEditing] = useState<Property | null>(null);
  const [creating, setCreating] = useState(false);
  const [openProperty, setOpenProperty] = useState<Property | null>(null);
  const { data: properties = [] } = useProperties(churchFilter || null);
  const qc = useQueryClient();

  async function remove(p: Property) {
    if (!confirm(`Remover imóvel "${p.name}"? Isso o desativa (não apaga o histórico).`)) return;
    try {
      await deleteProperty(supabase, p.id);
      await logAudit(supabase, "delete", "properties", p.id, { name: p.name });
      qc.invalidateQueries({ queryKey: ["properties"] });
      qc.invalidateQueries({ queryKey: ["patrimony-summary"] });
    } catch (e: unknown) { alert(e instanceof Error ? e.message : "Erro"); }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        {churches.length > 1 && (
          <div className="min-w-[200px]">
            <Label className="mb-1 block text-xs uppercase tracking-wider text-muted">Comunidade</Label>
            <select value={churchFilter} onChange={(e) => setChurchFilter(e.target.value)}
              className="h-9 w-full rounded-md border bg-background px-3 text-sm">
              {churches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}
        <Button onClick={() => setCreating(true)} className="gap-1.5"><Plus className="h-4 w-4" />Novo imóvel</Button>
      </div>

      {(editing || creating) && (
        <PropertyForm churches={churches} editing={editing} defaultChurchId={churchFilter}
          onClose={() => { setEditing(null); setCreating(false); }} />
      )}

      {openProperty && (
        <PropertyDetail property={openProperty} onClose={() => setOpenProperty(null)} />
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        {properties.length === 0 && (
          <p className="col-span-full text-sm italic text-muted">Nenhum imóvel cadastrado.</p>
        )}
        {properties.map(p => <PropertyCard key={p.id} property={p}
          onEdit={() => { setEditing(p); setCreating(false); }}
          onOpen={() => setOpenProperty(p)}
          onRemove={() => remove(p)} />)}
      </div>
    </div>
  );
}

function PropertyCard({ property: p, onEdit, onOpen, onRemove }: { property: Property; onEdit: () => void; onOpen: () => void; onRemove: () => void }) {
  const daysUntilEnd = p.contract_end_at
    ? Math.floor((new Date(p.contract_end_at).getTime() - Date.now()) / 86400000)
    : null;
  const isExpiringSoon = daysUntilEnd !== null && daysUntilEnd >= 0 && daysUntilEnd <= 90;

  return (
    <Card className={isExpiringSoon ? "border-l-4 border-l-red-400" : "border-l-4 border-l-gold"}>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-2">
          <button onClick={onOpen} className="min-w-0 flex-1 text-left">
            <b className="block truncate text-navy">{p.name}</b>
            <span className={`mt-1 inline-block rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase ${OCCUPATION_COLOR[p.occupation_type]}`}>
              {OCCUPATION_LABELS[p.occupation_type]}
            </span>
            {(p.city || p.state) && (
              <p className="mt-1.5 flex items-center gap-1 text-[11px] text-muted">
                <MapPin className="h-3 w-3" />{[p.city, p.state].filter(Boolean).join(", ")}
              </p>
            )}
            {isExpiringSoon && (
              <p className="mt-1 flex items-center gap-1 text-[11px] font-bold text-red-700">
                <AlertTriangle className="h-3 w-3" />Contrato vence em {daysUntilEnd} dia(s)
              </p>
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

function PropertyForm({ churches, editing, defaultChurchId, onClose }: {
  churches: { id: string; name: string }[];
  editing: Property | null;
  defaultChurchId: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [err, setErr] = useState("");
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } =
    useForm<PropertyInput>({
      resolver: zodResolver(propertySchema),
      defaultValues: editing ? {
        church_id: editing.church_id, name: editing.name,
        occupation_type: editing.occupation_type,
        cep: editing.cep ?? "", state: editing.state ?? "", city: editing.city ?? "",
        neighborhood: editing.neighborhood ?? "", address: editing.address ?? "",
        numero: editing.numero ?? "", complemento: editing.complemento ?? "",
        acquired_at: editing.acquired_at ?? "", contract_end_at: editing.contract_end_at ?? "",
        iptu_due_at: editing.iptu_due_at ?? "",
        owner_name: editing.owner_name ?? "", owner_document: editing.owner_document ?? "",
        owner_phone: editing.owner_phone ?? "",
        observations: editing.observations ?? "",
      } : { church_id: defaultChurchId, occupation_type: "proprio" },
    });

  const occupation = watch("occupation_type");
  const isRentedOrLent = occupation === "alugado" || occupation === "comodato" || occupation === "cedido";

  async function onSubmit(v: PropertyInput) {
    setErr("");
    try {
      const payload = {
        church_id: v.church_id, name: v.name, occupation_type: v.occupation_type,
        cep: v.cep || null, state: v.state || null, city: v.city || null,
        neighborhood: v.neighborhood || null, address: v.address || null,
        numero: v.numero || null, complemento: v.complemento || null,
        acquired_at: v.acquired_at || null,
        contract_end_at: v.contract_end_at || null,
        iptu_due_at: v.iptu_due_at || null,
        owner_name: v.owner_name || null, owner_document: v.owner_document || null,
        owner_phone: v.owner_phone || null,
        observations: v.observations || null,
      };
      if (editing) {
        await updateProperty(supabase, editing.id, payload);
        await logAudit(supabase, "update", "properties", editing.id, { name: v.name });
      } else {
        const created = await createProperty(supabase, payload);
        await logAudit(supabase, "insert", "properties", created.id, { name: v.name });
      }
      qc.invalidateQueries({ queryKey: ["properties"] });
      qc.invalidateQueries({ queryKey: ["patrimony-summary"] });
      onClose();
    } catch (e: unknown) {
      console.error("[PropertyForm]", e);
      setErr(e instanceof Error ? e.message : "Erro ao salvar");
    }
  }

  return (
    <Card className="border-2 border-dashed border-gold/40 bg-gold/5">
      <CardContent className="pt-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="flex items-center justify-between">
            <b className="text-navy">{editing ? "Editar imóvel" : "Novo imóvel"}</b>
            <Button type="button" onClick={onClose} variant="ghost" size="sm" className="gap-1"><X className="h-3.5 w-3.5" />Fechar</Button>
          </div>

          {churches.length > 1 && (
            <Field label="Comunidade"><select {...register("church_id")} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
              {churches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select></Field>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nome / identificação" error={errors.name?.message}>
              <Input {...register("name")} placeholder="Ex: Templo Central CEC Manaus" />
            </Field>
            <Field label="Tipo de ocupação">
              <select {...register("occupation_type")} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                {Object.entries(OCCUPATION_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </Field>
          </div>

          <div className="rounded-md border bg-card p-3 space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-navy-600">Endereço</Label>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="CEP" error={errors.cep?.message}>
                <Input {...register("cep")} placeholder="00000-000" maxLength={9} />
              </Field>
              <Field label="Estado"><Input {...register("state")} placeholder="AM" maxLength={3} /></Field>
              <Field label="Cidade"><Input {...register("city")} /></Field>
            </div>
            <Field label="Bairro"><Input {...register("neighborhood")} /></Field>
            <Field label="Logradouro"><Input {...register("address")} placeholder="Rua, Av..." /></Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Número"><Input {...register("numero")} /></Field>
              <Field label="Complemento"><Input {...register("complemento")} /></Field>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Data de aquisição/ocupação" error={errors.acquired_at?.message}>
              <Input type="date" {...register("acquired_at")} />
            </Field>
            <Field label="Vencimento de contrato" error={errors.contract_end_at?.message}>
              <Input type="date" {...register("contract_end_at")} />
            </Field>
            <Field label="Vencimento do IPTU" error={errors.iptu_due_at?.message}>
              <Input type="date" {...register("iptu_due_at")} />
            </Field>
          </div>

          {isRentedOrLent && (
            <div className="rounded-md border bg-card p-3 space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-navy-600">Dados do proprietário</Label>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Nome"><Input {...register("owner_name")} /></Field>
                <Field label="CPF/CNPJ"><Input {...register("owner_document")} /></Field>
              </div>
              <Field label="Telefone"><Input {...register("owner_phone")} placeholder="(00) 00000-0000" /></Field>
            </div>
          )}

          <Field label="Observações">
            <textarea {...register("observations")} rows={2} className="w-full rounded-md border bg-background p-2 text-sm" />
          </Field>

          {err && <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">{err}</p>}
          <Button type="submit" disabled={isSubmitting} className="gap-2">
            {isSubmitting ? "Salvando…" : (editing ? "Salvar alterações" : "Criar imóvel")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function PropertyDetail({ property: p, onClose }: { property: Property; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: docs = [] } = usePropertyDocs(p.id);

  async function handleUpload(file: File, docType: string, title: string) {
    try {
      const up = await uploadPatrimonyFile(supabase, p.church_id, `properties/${p.id}`, file);
      await createPropertyDoc(supabase, {
        property_id: p.id, doc_type: docType, title: title || file.name,
        storage_path: up.path, size_bytes: up.size, mime_type: up.mime,
      });
      qc.invalidateQueries({ queryKey: ["property-docs", p.id] });
    } catch (e: unknown) {
      console.error("[upload]", e);
      alert(e instanceof Error ? e.message : "Erro no upload");
    }
  }

  return (
    <Card className="border-2 border-navy/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{p.name}</CardTitle>
          <Button onClick={onClose} variant="ghost" size="sm"><X className="h-3.5 w-3.5" /></Button>
        </div>
        <CardDescription>Documentos vinculados ao imóvel</CardDescription>
      </CardHeader>
      <CardContent>
        <DocumentUploader
          docTypes={["escritura", "iptu", "planta", "habite_se", "contrato_locacao", "comodato", "certidao", "alvara", "outro"]}
          onUpload={handleUpload}
        />
        <div className="mt-3 space-y-1.5">
          {docs.length === 0 && <p className="text-sm italic text-muted">Nenhum documento anexado.</p>}
          {docs.map(d => (
            <DocRow key={d.id} doc={d}
              onDelete={async () => {
                if (!confirm("Apagar este documento?")) return;
                await deletePropertyDoc(supabase, d.id, d.storage_path);
                qc.invalidateQueries({ queryKey: ["property-docs", p.id] });
              }} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// SEÇÃO: BENS
// ============================================================
function AssetsSection({ churches }: { churches: { id: string; name: string }[] }) {
  const [churchFilter, setChurchFilter] = useState<string>(churches[0]?.id ?? "");
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
      await logAudit(supabase, "delete", "assets", a.id, { name: a.name });
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
        await logAudit(supabase, "update", "assets", editing.id, { name: v.name });
      } else {
        const created = await createAsset(supabase, payload);
        await logAudit(supabase, "insert", "assets", created.id, { name: v.name });
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

// ============================================================
// COMPONENTES REUTILIZÁVEIS
// ============================================================
function DocumentUploader({ docTypes, onUpload }: {
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

function DocRow({ doc, onDelete }: { doc: { id: string; title: string; doc_type: string; storage_path: string | null; mime_type: string | null }; onDelete: () => void }) {
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

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>{children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
