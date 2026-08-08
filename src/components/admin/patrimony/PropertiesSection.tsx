"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, MapPin, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useProperties } from "@/hooks/use-queries";
import { supabase } from "@/lib/supabase/client";
import { createProperty, updateProperty, deleteProperty } from "@/services/patrimony";
import { logAudit, diffFields } from "@/services/audit";
import { propertySchema, type PropertyInput } from "@/schemas";
import type { Property } from "@/types/domain";
import { OCCUPATION_LABELS, OCCUPATION_COLOR } from "./PatrimonyTypes";
import { Field } from "./PatrimonyHelpers";
import { PropertyDetail } from "./PropertyDocuments";

export function PropertiesSection({ churches, initialChurchId = "" }: { churches: { id: string; name: string }[]; initialChurchId?: string }) {
  const [churchFilter, setChurchFilter] = useState<string>(initialChurchId || churches[0]?.id || "");
  const [editing, setEditing] = useState<Property | null>(null);
  const [creating, setCreating] = useState(false);
  const [openProperty, setOpenProperty] = useState<Property | null>(null);
  const { data: properties = [] } = useProperties(churchFilter || null);
  const qc = useQueryClient();

  async function remove(p: Property) {
    if (!confirm(`Remover imóvel "${p.name}"? Isso o desativa (não apaga o histórico).`)) return;
    try {
      await deleteProperty(supabase, p.id);
      await logAudit(supabase, "delete", "properties", p.id, {}, { before: p as unknown as Record<string, unknown> });
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
        const diff = diffFields(editing as unknown as Record<string, unknown>, payload);
        await logAudit(supabase, "update", "properties", editing.id, {}, diff ?? undefined);
      } else {
        const created = await createProperty(supabase, payload);
        await logAudit(supabase, "insert", "properties", created.id, {}, { after: created as unknown as Record<string, unknown> });
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
