"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Plus, Trash2, Pencil, X, Globe, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useChurches } from "@/hooks/use-queries";
import { supabase } from "@/lib/supabase/client";
import { logAudit } from "@/services/audit";
import type { Church } from "@/types/domain";

const communitySchema = z.object({
  name: z.string().trim().min(2, "Nome obrigatório"),
  slug: z.string().trim().min(2, "Slug obrigatório")
    .regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífen"),
  type: z.enum(["sede","nucleo","igreja_local"]).default("sede"),
  parent_id: z.string().uuid().optional().or(z.literal("")),
  state: z.string().trim().optional().or(z.literal("")),
  city: z.string().trim().optional().or(z.literal("")),
  address: z.string().trim().optional().or(z.literal("")),
  short_description: z.string().trim().optional().or(z.literal("")),
  logo_url: z.string().url("URL inválida").optional().or(z.literal("")),
  banner_url: z.string().url("URL inválida").optional().or(z.literal("")),
  primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor hex inválida").optional().or(z.literal("")),
  secondary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor hex inválida").optional().or(z.literal("")),
  site_url: z.string().url("URL inválida").optional().or(z.literal("")),
  whatsapp_phone: z.string().trim().optional().or(z.literal("")),
});
type CommunityInput = z.infer<typeof communitySchema>;

export function CommunitiesAdmin() {
  const { data: churches = [] } = useChurches();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Church | null>(null);
  const [err, setErr] = useState("");

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } =
    useForm<CommunityInput>({
      resolver: zodResolver(communitySchema),
      defaultValues: { type: "sede", primary_color: "#0E2A47", secondary_color: "#C9A227" },
    });
  const slugWatch = watch("slug");

  function startEdit(c: Church) {
    setEditing(c); setErr("");
    reset({
      name: c.name,
      slug: c.slug ?? "",
      type: c.type,
      parent_id: c.parent_id ?? "",
      state: c.state ?? "",
      city: c.city ?? "",
      address: c.address ?? "",
      short_description: c.short_description ?? "",
      logo_url: c.logo_url ?? "",
      banner_url: c.banner_url ?? "",
      primary_color: c.primary_color ?? "#0E2A47",
      secondary_color: c.secondary_color ?? "#C9A227",
      site_url: c.site_url ?? "",
      whatsapp_phone: c.whatsapp_phone ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function cancelEdit() {
    setEditing(null);
    reset({ type: "sede", primary_color: "#0E2A47", secondary_color: "#C9A227" });
  }

  async function onSubmit(v: CommunityInput) {
    setErr("");
    try {
      const payload = {
        name: v.name, slug: v.slug, type: v.type,
        parent_id: v.parent_id || null,
        state: v.state || null, city: v.city || null, address: v.address || null,
        short_description: v.short_description || null,
        logo_url: v.logo_url || null, banner_url: v.banner_url || null,
        primary_color: v.primary_color || null, secondary_color: v.secondary_color || null,
        site_url: v.site_url || null, whatsapp_phone: v.whatsapp_phone || null,
        is_active: true,
      };
      if (editing) {
        const { error } = await supabase.from("churches").update(payload).eq("id", editing.id);
        if (error) throw error;
        await logAudit(supabase, "update", "churches", editing.id, { name: v.name });
      } else {
        const { data, error } = await supabase.from("churches").insert(payload).select().single();
        if (error) throw error;
        await logAudit(supabase, "insert", "churches", data.id, { name: v.name });
      }
      cancelEdit();
      qc.invalidateQueries({ queryKey: ["churches"] });
      qc.invalidateQueries({ queryKey: ["active-community"] });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro";
      setErr(msg.includes("duplicate") && msg.includes("slug") ? "Já existe uma comunidade com esse slug. Escolha outro." : msg);
    }
  }

  async function remove(c: Church) {
    if (!confirm(`Apagar comunidade "${c.name}"?\n\nIsso pode quebrar referências em conteúdos vinculados a ela.`)) return;
    try {
      const { error } = await supabase.from("churches").delete().eq("id", c.id);
      if (error) throw error;
      await logAudit(supabase, "delete", "churches", c.id, { name: c.name });
      qc.invalidateQueries({ queryKey: ["churches"] });
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Erro");
    }
  }

  // Filtra sedes para serem possíveis "pais" no select
  const possibleParents = churches.filter((c) => c.type === "sede" && c.id !== editing?.id);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{editing ? "Editar comunidade" : "Nova comunidade"}</CardTitle>
              <CardDescription>{editing ? `Alterando: ${editing.name}` : "Sede, núcleo ou igreja local"}</CardDescription>
            </div>
            {editing && <Button onClick={cancelEdit} variant="ghost" size="sm" className="gap-1"><X className="h-3.5 w-3.5" />Cancelar</Button>}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nome" error={errors.name?.message}>
                <Input {...register("name")} placeholder="CEC Brasília" />
              </Field>
              <Field label="Slug (subdomínio)" error={errors.slug?.message}>
                <Input {...register("slug")} placeholder="brasilia" />
              </Field>
            </div>
            {slugWatch && (
              <p className="text-xs text-muted">URL pública: <code className="rounded bg-navy-50 px-1 py-0.5">{slugWatch}.cecfamily.com.br</code></p>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Tipo">
                <select {...register("type")} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                  <option value="sede">Sede</option>
                  <option value="nucleo">Núcleo</option>
                  <option value="igreja_local">Igreja Local</option>
                </select>
              </Field>
              <Field label="Comunidade pai (vincula a uma sede)">
                <select {...register("parent_id")} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                  <option value="">— Nenhuma —</option>
                  {possibleParents.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </Field>
            </div>

            <Field label="Descrição curta" error={errors.short_description?.message}>
              <Input {...register("short_description")} placeholder="Frase que aparece no footer e meta tags" />
            </Field>

            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Estado"><Input {...register("state")} placeholder="DF" maxLength={3} /></Field>
              <Field label="Cidade"><Input {...register("city")} placeholder="Brasília" /></Field>
              <Field label="Endereço"><Input {...register("address")} /></Field>
            </div>

            <details className="rounded-md border bg-navy-50/50 p-3" open>
              <summary className="cursor-pointer text-xs font-bold uppercase tracking-wider text-navy-600">Identidade visual</summary>
              <div className="mt-3 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Logo (URL)" error={errors.logo_url?.message}>
                    <Input {...register("logo_url")} placeholder="https://..." />
                  </Field>
                  <Field label="Banner (URL)" error={errors.banner_url?.message}>
                    <Input {...register("banner_url")} placeholder="https://..." />
                  </Field>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Cor primária (hex)" error={errors.primary_color?.message}>
                    <Input {...register("primary_color")} placeholder="#0E2A47" />
                  </Field>
                  <Field label="Cor secundária (hex)" error={errors.secondary_color?.message}>
                    <Input {...register("secondary_color")} placeholder="#C9A227" />
                  </Field>
                </div>
              </div>
            </details>

            <details className="rounded-md border bg-navy-50/50 p-3">
              <summary className="cursor-pointer text-xs font-bold uppercase tracking-wider text-navy-600">Contato</summary>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Site externo" error={errors.site_url?.message}>
                  <Input {...register("site_url")} placeholder="https://..." />
                </Field>
                <Field label="WhatsApp" error={errors.whatsapp_phone?.message}>
                  <Input {...register("whatsapp_phone")} placeholder="(61) 90000-0000" />
                </Field>
              </div>
            </details>

            {err && <p className="text-sm text-destructive">{err}</p>}
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              <Plus className="h-4 w-4" />{editing ? "Salvar alterações" : "Criar comunidade"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <h3 className="font-display text-lg text-navy">Comunidades ({churches.length})</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {churches.map((c) => (
          <Card key={c.id} className="overflow-hidden">
            {c.banner_url && <img src={c.banner_url} alt="" className="aspect-[3/1] w-full object-cover" />}
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                {c.logo_url && <img src={c.logo_url} alt="" className="h-12 w-12 rounded-full object-cover" />}
                <div className="min-w-0 flex-1">
                  <b className="block truncate text-navy">{c.name}</b>
                  <p className="text-[11px] text-muted">
                    <span className="font-bold uppercase">{c.type}</span>
                    {c.slug && <> · <code className="rounded bg-navy-50 px-1">{c.slug}</code></>}
                    {(c.city || c.state) && <> · {[c.city, c.state].filter(Boolean).join(", ")}</>}
                  </p>
                  {c.short_description && <p className="mt-1 text-xs text-muted line-clamp-2">{c.short_description}</p>}
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                    {c.site_url && <a href={c.site_url} target="_blank" rel="noreferrer" className="flex items-center gap-0.5 text-gold hover:underline"><Globe className="h-3 w-3" />Site</a>}
                    {c.whatsapp_phone && <span className="flex items-center gap-0.5 text-muted"><MessageCircle className="h-3 w-3" />{c.whatsapp_phone}</span>}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <Button onClick={() => startEdit(c)} variant="outline" size="sm"><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button onClick={() => remove(c)} variant="destructive" size="sm"><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
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
