"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Building2, Check, ChevronRight, Globe2, LayoutGrid, Palette, Plus, Save, Shield,
  Tags, UserPlus, Users, X,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import {
  DEFAULT_PLATFORM_MODULES,
  DEFAULT_TENANT_LABELS,
  ORGANIZATION_TEMPLATES,
  PLATFORM_CONFIG,
  type TenantBranding,
  type TenantRecord,
} from "@/config/modules";
import {
  createTenant,
  getTenantSnapshot,
  listTenantAdmins,
  listTenants,
  setTenantModule,
  templateForOrganization,
  updateTenant,
  upsertTenantAdmin,
  upsertTenantBranding,
  upsertTenantMenuItem,
  upsertTenantLabel,
} from "@/services/tenantConfig";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const TYPE_LABELS: Record<string, string> = {
  church: "Igreja",
  community: "Comunidade",
  institute: "Instituto",
  association: "Associação",
  osc: "OSC",
  oscip: "OSCIP",
  foundation: "Fundação",
  social_project: "Projeto social",
  other: "Outro",
};

type ConsoleTab = "identity" | "modules" | "labels" | "menus" | "admins";

export default function PlatformAdmin() {
  const { platform } = useTenant();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<ConsoleTab>("identity");
  const [notice, setNotice] = useState("");
  const [showNew, setShowNew] = useState(false);

  const adminQuery = useQuery({
    queryKey: ["platform-admin-access"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("is_platform_admin");
      if (error) return false;
      return Boolean(data);
    },
    staleTime: 5 * 60 * 1000,
  });
  const profileQuery = useQuery({
    queryKey: ["platform-admin-profile"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return null;
      const { data } = await supabase.from("profiles").select("id, role, full_name, email").eq("id", auth.user.id).maybeSingle();
      return data as { id: string; role?: string; full_name?: string; email?: string } | null;
    },
    staleTime: 5 * 60 * 1000,
  });
  const accessGranted = adminQuery.data || profileQuery.data?.role === "apostolo";
  const tenantsQuery = useQuery({
    queryKey: ["platform-tenants"],
    queryFn: () => listTenants(supabase),
    enabled: Boolean(accessGranted),
  });
  const selected = (tenantsQuery.data ?? []).find((tenant) => tenant.id === selectedId) ?? null;
  const snapshotQuery = useQuery({
    queryKey: ["platform-tenant-snapshot", selected?.id],
    queryFn: () => getTenantSnapshot(supabase, selected?.id),
    enabled: Boolean(selected?.id),
  });
  const adminsQuery = useQuery({
    queryKey: ["platform-tenant-admins", selected?.id],
    queryFn: () => listTenantAdmins(supabase, selected!.id),
    enabled: Boolean(selected?.id) && tab === "admins",
  });

  if (adminQuery.isLoading || profileQuery.isLoading) {
    return <div className="grid min-h-[60vh] place-items-center text-sm text-muted-foreground">Validando acesso da plataforma…</div>;
  }

  if (!accessGranted) {
    return (
      <Card className="mx-auto mt-12 max-w-lg text-center">
        <CardContent className="space-y-3 py-10">
          <Shield className="mx-auto h-10 w-10 text-gold" />
          <h1 className="font-display text-xl text-navy">Acesso restrito</h1>
          <p className="text-sm text-muted-foreground">Esta área é exclusiva do Administrador Geral da plataforma.</p>
        </CardContent>
      </Card>
    );
  }

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["platform-tenants"] });
    if (selected?.id) await queryClient.invalidateQueries({ queryKey: ["platform-tenant-snapshot", selected.id] });
  }

  function chooseTenant(tenant: TenantRecord) {
    setSelectedId(tenant.id);
    setTab("identity");
    setShowNew(false);
    setNotice("");
  }

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-gold/30 bg-gradient-to-br from-navy to-[#163e63] p-6 text-white shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">{platform.name} · Governança de plataforma</p>
        <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="font-display text-3xl font-bold">Administrador Geral</h1>
            <p className="mt-1 max-w-2xl text-sm text-white/70">Crie e configure organizações sem duplicar o código. Cada tenant possui sua identidade, módulos, menus e nomenclaturas.</p>
          </div>
          <Button onClick={() => { setShowNew(true); setSelectedId(null); }} className="gap-2 bg-gold text-navy hover:bg-gold/90">
            <Plus className="h-4 w-4" /> Nova organização
          </Button>
        </div>
      </header>

      {notice && <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"><span>{notice}</span><button onClick={() => setNotice("")} aria-label="Fechar aviso"><X className="h-4 w-4" /></button></div>}

      {showNew ? (
        <NewTenantForm onCancel={() => setShowNew(false)} onCreated={async (tenant) => { setShowNew(false); setSelectedId(tenant.id); setNotice("Organização criada e configurada com o template inicial."); await refresh(); }} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          <TenantList tenants={tenantsQuery.data ?? []} selectedId={selectedId} loading={tenantsQuery.isLoading} onSelect={chooseTenant} />
          {selected ? (
            <TenantWorkspace
              tenant={selected}
              snapshot={snapshotQuery.data}
              snapshotLoading={snapshotQuery.isLoading}
              admins={adminsQuery.data ?? []}
              adminsLoading={adminsQuery.isLoading}
              tab={tab}
              onTabChange={setTab}
              onSaved={async (message) => { setNotice(message); await refresh(); }}
            />
          ) : (
            <EmptyState hasTenants={(tenantsQuery.data ?? []).length > 0} onCreate={() => setShowNew(true)} />
          )}
        </div>
      )}
    </div>
  );
}

function TenantList({ tenants, selectedId, loading, onSelect }: { tenants: TenantRecord[]; selectedId: string | null; loading: boolean; onSelect: (tenant: TenantRecord) => void }) {
  return (
    <Card className="h-fit">
      <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><Building2 className="h-4 w-4 text-gold" /> Organizações</CardTitle><CardDescription>{loading ? "Carregando…" : `${tenants.length} tenant${tenants.length === 1 ? "" : "s"} cadastrado${tenants.length === 1 ? "" : "s"}`}</CardDescription></CardHeader>
      <CardContent className="space-y-2">
        {tenants.map((tenant) => <button key={tenant.id} onClick={() => onSelect(tenant)} className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition ${selectedId === tenant.id ? "border-gold bg-gold/10" : "border-transparent bg-muted/40 hover:border-gold/40"}`}>
          <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-navy text-xs font-bold text-gold">{tenant.logo_url ? <img src={tenant.logo_url} alt="" className="h-full w-full object-cover" /> : (tenant.short_name ?? tenant.name).slice(0, 2).toUpperCase()}</div>
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-navy">{tenant.display_name ?? tenant.name}</p><p className="truncate text-[11px] text-muted-foreground">{TYPE_LABELS[String(tenant.type ?? "other")] ?? "Organização"} · /{tenant.slug ?? "sem-slug"}</p></div><ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>)}
        {tenants.length === 0 && !loading && <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma organização disponível.</p>}
      </CardContent>
    </Card>
  );
}

function EmptyState({ hasTenants, onCreate }: { hasTenants: boolean; onCreate: () => void }) {
  return <Card className="grid min-h-[360px] place-items-center"><CardContent className="max-w-md text-center"><LayoutGrid className="mx-auto h-10 w-10 text-gold" /><h2 className="mt-3 font-display text-xl text-navy">{hasTenants ? "Selecione uma organização" : "Comece pelo primeiro tenant"}</h2><p className="mt-2 text-sm text-muted-foreground">Escolha uma organização na lista para editar identidade, módulos, nomenclaturas e administradores.</p><Button onClick={onCreate} className="mt-5 gap-2"><Plus className="h-4 w-4" /> Criar organização</Button></CardContent></Card>;
}

function NewTenantForm({ onCancel, onCreated }: { onCancel: () => void; onCreated: (tenant: TenantRecord) => Promise<void> }) {
  const [form, setForm] = useState({ name: "", display_name: "", short_name: "", legal_name: "", slug: "", organization_type: "church", template_key: "CHURCH_DEFAULT", primary_color: "#0E2A47", secondary_color: "#C9A227", logo_primary: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  return <Card><CardHeader><CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5 text-gold" /> Nova organização</CardTitle><CardDescription>O tipo só sugere o template inicial. A organização pode ser personalizada depois.</CardDescription></CardHeader><CardContent><form className="space-y-4" onSubmit={async (event) => { event.preventDefault(); setBusy(true); setError(""); try { const tenant = await createTenant(supabase, form); await onCreated(tenant); } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível criar a organização."); } finally { setBusy(false); } }}>
    <div className="grid gap-4 md:grid-cols-2"><TextField label="Nome legal" value={form.legal_name} placeholder="Instituto Esperança" onChange={(value) => update("legal_name", value)} required /><TextField label="Nome exibido" value={form.display_name} placeholder="Esperança" onChange={(value) => update("display_name", value)} required /><TextField label="Nome curto" value={form.short_name} placeholder="ESP" onChange={(value) => update("short_name", value)} /><TextField label="Slug" value={form.slug} placeholder="esperanca" onChange={(value) => update("slug", value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} required /></div>
    <div className="grid gap-4 md:grid-cols-2"><div className="space-y-1.5"><Label>Tipo de organização</Label><select value={form.organization_type} onChange={(event) => { const type = event.target.value; update("organization_type", type); update("template_key", templateForOrganization(type)?.key ?? "CUSTOM"); }} className="h-10 w-full rounded-md border bg-background px-3 text-sm">{Object.entries(TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div><div className="space-y-1.5"><Label>Template inicial</Label><select value={form.template_key} onChange={(event) => update("template_key", event.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm">{ORGANIZATION_TEMPLATES.map((template) => <option key={template.key} value={template.key}>{template.label}</option>)}</select></div></div>
    <div className="grid gap-4 md:grid-cols-3"><TextField label="Cor primária" value={form.primary_color} placeholder="#0E2A47" onChange={(value) => update("primary_color", value)} /><TextField label="Cor secundária" value={form.secondary_color} placeholder="#C9A227" onChange={(value) => update("secondary_color", value)} /><TextField label="Logo (URL)" value={form.logo_primary} placeholder="https://…" onChange={(value) => update("logo_primary", value)} /></div>
    {error && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}<div className="flex gap-2"><Button type="submit" disabled={busy} className="gap-2"><Check className="h-4 w-4" />{busy ? "Criando…" : "Criar organização"}</Button><Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button></div>
  </form></CardContent></Card>;
}

function TenantWorkspace({ tenant, snapshot, snapshotLoading, admins, adminsLoading, tab, onTabChange, onSaved }: { tenant: TenantRecord; snapshot?: ReturnType<typeof getTenantSnapshot> extends Promise<infer T> ? T : never; snapshotLoading: boolean; admins: Array<Record<string, unknown>>; adminsLoading: boolean; tab: ConsoleTab; onTabChange: (tab: ConsoleTab) => void; onSaved: (message: string) => Promise<void> }) {
  const tabs: Array<{ key: ConsoleTab; label: string; icon: typeof Palette }> = [{ key: "identity", label: "Identidade", icon: Palette }, { key: "modules", label: "Módulos", icon: LayoutGrid }, { key: "labels", label: "Nomenclaturas", icon: Tags }, { key: "menus", label: "Menus", icon: LayoutGrid }, { key: "admins", label: "Administradores", icon: Users }];
  return <Card><CardHeader className="border-b"><div className="flex flex-col justify-between gap-4 md:flex-row md:items-start"><div><CardTitle className="flex items-center gap-2"><Globe2 className="h-5 w-5 text-gold" />{tenant.display_name ?? tenant.name}</CardTitle><CardDescription>/{tenant.slug ?? "sem-slug"} · {TYPE_LABELS[String(tenant.type ?? "other")] ?? "Organização"} · chaves técnicas preservadas</CardDescription></div><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${tenant.is_active === false ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>{tenant.is_active === false ? "Inativa" : "Ativa"}</span></div><div className="flex gap-1 overflow-x-auto pt-2">{tabs.map(({ key, label, icon: Icon }) => <button key={key} onClick={() => onTabChange(key)} className={`flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition ${tab === key ? "bg-navy text-white" : "text-muted-foreground hover:bg-muted"}`}><Icon className="h-4 w-4" />{label}</button>)}</div></CardHeader><CardContent className="pt-6">{snapshotLoading || !snapshot ? <p className="py-10 text-center text-sm text-muted-foreground">Carregando configuração do tenant…</p> : tab === "identity" ? <IdentityTab tenant={tenant} branding={snapshot.branding} onSaved={onSaved} /> : tab === "modules" ? <ModulesTab tenantId={tenant.id} snapshot={snapshot} onSaved={onSaved} /> : tab === "labels" ? <LabelsTab tenantId={tenant.id} snapshot={snapshot} onSaved={onSaved} /> : tab === "menus" ? <MenusTab tenantId={tenant.id} snapshot={snapshot} onSaved={onSaved} /> : <AdminsTab tenantId={tenant.id} admins={admins} loading={adminsLoading} onSaved={onSaved} />}</CardContent></Card>;
}

function IdentityTab({ tenant, branding, onSaved }: { tenant: TenantRecord; branding: TenantBranding; onSaved: (message: string) => Promise<void> }) {
  const [form, setForm] = useState({ name: tenant.name, display_name: tenant.display_name ?? branding.display_name ?? tenant.name, short_name: tenant.short_name ?? branding.short_name ?? "", slug: tenant.slug ?? "", legal_name: tenant.legal_name ?? branding.legal_name ?? "", primary_color: branding.primary_color ?? "#0E2A47", secondary_color: branding.secondary_color ?? "#C9A227", logo_primary: branding.logo_primary ?? "" });
  const [busy, setBusy] = useState(false);
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  return <form className="space-y-4" onSubmit={async (event) => { event.preventDefault(); setBusy(true); try { await updateTenant(supabase, tenant.id, form); await upsertTenantBranding(supabase, tenant.id, { tenant_id: tenant.id, display_name: form.display_name, short_name: form.short_name || null, legal_name: form.legal_name || null, logo_primary: form.logo_primary || null, primary_color: form.primary_color, secondary_color: form.secondary_color, accent_color: form.secondary_color }); await onSaved("Identidade do tenant atualizada."); } catch (err) { alert(err instanceof Error ? err.message : "Não foi possível salvar a identidade."); } finally { setBusy(false); } }}><div className="grid gap-4 md:grid-cols-2"><TextField label="Nome legal" value={form.legal_name} onChange={(value) => update("legal_name", value)} required /><TextField label="Nome exibido" value={form.display_name} onChange={(value) => update("display_name", value)} required /><TextField label="Nome curto" value={form.short_name} onChange={(value) => update("short_name", value)} /><TextField label="Slug público" value={form.slug} onChange={(value) => update("slug", value)} required /></div><div className="grid gap-4 md:grid-cols-3"><TextField label="Cor primária" value={form.primary_color} onChange={(value) => update("primary_color", value)} /><TextField label="Cor secundária" value={form.secondary_color} onChange={(value) => update("secondary_color", value)} /><TextField label="Logo principal (URL)" value={form.logo_primary} onChange={(value) => update("logo_primary", value)} /></div><div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-4"><div className="grid h-12 w-12 place-items-center overflow-hidden rounded-full bg-navy text-gold">{form.logo_primary ? <img src={form.logo_primary} alt="Prévia da logo" className="h-full w-full object-cover" /> : form.short_name.slice(0, 2).toUpperCase()}</div><div><p className="text-sm font-semibold text-navy">Prévia do fallback</p><p className="text-xs text-muted-foreground">Sem logo do tenant, a plataforma usa o asset padrão Servo360.</p></div></div><Button type="submit" disabled={busy} className="gap-2"><Save className="h-4 w-4" />{busy ? "Salvando…" : "Salvar identidade"}</Button></form>;
}

function ModulesTab({ tenantId, snapshot, onSaved }: { tenantId: string; snapshot: NonNullable<Awaited<ReturnType<typeof getTenantSnapshot>>>; onSaved: (message: string) => Promise<void> }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [labels, setLabels] = useState<Record<string, string>>({});
  const configured = new Map(snapshot.tenantModules.map((item) => [item.module_key, item]));
  return <div className="space-y-4"><div><h3 className="font-display text-lg text-navy">Catálogo de módulos</h3><p className="text-sm text-muted-foreground">Desabilitar um módulo apenas remove sua experiência da navegação; os dados permanecem preservados.</p></div><div className="grid gap-3 md:grid-cols-2">{snapshot.modules.map((item) => { const config = configured.get(item.module_key); const enabled = config?.enabled ?? item.is_core; const value = labels[item.module_key] ?? config?.label_override ?? ""; return <div key={item.module_key} className={`rounded-xl border p-4 ${enabled ? "border-gold/40 bg-gold/5" : "border-border bg-muted/20"}`}><div className="flex items-start gap-3"><button type="button" onClick={async () => { setBusy(item.module_key); try { await setTenantModule(supabase, tenantId, item.module_key, !enabled, { label_override: value || null, sort_order: config?.sort_order ?? 0 }); await onSaved(`${item.default_label}: ${!enabled ? "ativado" : "desativado"}.`); } catch (err) { alert(err instanceof Error ? err.message : "Não foi possível alterar o módulo."); } finally { setBusy(null); } }} disabled={busy === item.module_key || (item.is_core && enabled)} className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded border ${enabled ? "border-gold bg-gold text-navy" : "border-muted-foreground"}`} aria-label={`${enabled ? "Desativar" : "Ativar"} ${item.default_label}`}>{enabled && <Check className="h-3.5 w-3.5" />}</button><div className="min-w-0 flex-1"><p className="font-semibold text-navy">{item.default_label}</p><p className="font-mono text-[10px] text-muted-foreground">{item.module_key}</p><div className="mt-2 flex gap-2"><Input value={value} onChange={(event) => setLabels((current) => ({ ...current, [item.module_key]: event.target.value }))} placeholder={item.default_label} className="h-8 text-xs" /><Button type="button" size="sm" variant="outline" disabled={!value.trim() || busy === item.module_key} onClick={async () => { setBusy(item.module_key); try { await setTenantModule(supabase, tenantId, item.module_key, enabled, { label_override: value.trim(), sort_order: config?.sort_order ?? 0 }); await onSaved(`Nome exibido de ${item.module_key} atualizado.`); } catch (err) { alert(err instanceof Error ? err.message : "Não foi possível salvar o label."); } finally { setBusy(null); } }} className="h-8 shrink-0 px-2"><Save className="h-3.5 w-3.5" /></Button></div></div></div></div>; })}</div></div>;
}

function LabelsTab({ tenantId, snapshot, onSaved }: { tenantId: string; snapshot: NonNullable<Awaited<ReturnType<typeof getTenantSnapshot>>>; onSaved: (message: string) => Promise<void> }) {
  const keys = useMemo(() => Object.keys(DEFAULT_TENANT_LABELS).filter((key) => !["platform", "tenant"].includes(key)), []);
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  return <div className="space-y-4"><div><h3 className="font-display text-lg text-navy">Nomenclaturas do tenant</h3><p className="text-sm text-muted-foreground">A chave técnica permanece estável. Altere apenas o nome exibido na experiência desta organização.</p></div><div className="grid gap-3 md:grid-cols-2">{keys.map((key) => { const value = values[key] ?? snapshot.labels[key] ?? DEFAULT_TENANT_LABELS[key]; return <div key={key} className="flex items-end gap-2 rounded-lg border p-3"><div className="min-w-0 flex-1"><Label className="text-xs text-muted-foreground">{key}</Label><Input value={value} onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))} className="mt-1 h-9" /></div><Button type="button" size="sm" disabled={busy === key || !value.trim()} onClick={async () => { setBusy(key); try { await upsertTenantLabel(supabase, tenantId, key, value); await onSaved(`Nomenclatura “${key}” atualizada.`); } catch (err) { alert(err instanceof Error ? err.message : "Não foi possível salvar a nomenclatura."); } finally { setBusy(null); } }}><Save className="mr-1 h-3.5 w-3.5" />Salvar</Button></div>; })}</div></div>;
}

function AdminsTab({ tenantId, admins, loading, onSaved }: { tenantId: string; admins: Array<Record<string, unknown>>; loading: boolean; onSaved: (message: string) => Promise<void> }) {
  const [form, setForm] = useState({ display_name: "", email: "", can_change_branding: true, can_change_menu: true, can_change_labels: true, can_configure_modules: false, can_create_admins: false });
  const [busy, setBusy] = useState(false);
  return <div className="space-y-5"><div><h3 className="font-display text-lg text-navy">Administradores do tenant</h3><p className="text-sm text-muted-foreground">Registre o administrador local. O convite de acesso pode ser enviado pelo fluxo de convites existente.</p></div><div className="rounded-xl border bg-muted/20 p-4"><div className="grid gap-3 md:grid-cols-2"><TextField label="Nome" value={form.display_name} onChange={(value) => setForm((current) => ({ ...current, display_name: value }))} required /><TextField label="E-mail" type="email" value={form.email} onChange={(value) => setForm((current) => ({ ...current, email: value }))} required /></div><div className="mt-3 flex flex-wrap gap-3">{(["can_change_branding", "can_change_menu", "can_change_labels", "can_configure_modules", "can_create_admins"] as const).map((key) => <label key={key} className="flex items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={form[key]} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.checked }))} />{({ can_change_branding: "Branding", can_change_menu: "Menus", can_change_labels: "Labels", can_configure_modules: "Módulos", can_create_admins: "Criar admins" } as Record<string, string>)[key]}</label>)}</div><Button disabled={busy} className="mt-4 gap-2" onClick={async () => { setBusy(true); try { await upsertTenantAdmin(supabase, { tenant_id: tenantId, ...form }); await onSaved("Administrador local registrado. Use Convites para enviar o acesso."); setForm({ display_name: "", email: "", can_change_branding: true, can_change_menu: true, can_change_labels: true, can_configure_modules: false, can_create_admins: false }); } catch (err) { alert(err instanceof Error ? err.message : "Não foi possível registrar o administrador."); } finally { setBusy(false); } }}><UserPlus className="h-4 w-4" />{busy ? "Registrando…" : "Registrar administrador"}</Button></div><div className="space-y-2">{loading ? <p className="text-sm text-muted-foreground">Carregando administradores…</p> : admins.length === 0 ? <p className="rounded-lg border border-dashed p-5 text-center text-sm text-muted-foreground">Nenhum administrador local registrado.</p> : admins.map((admin) => <div key={String(admin.id)} className="flex items-center justify-between rounded-lg border p-3"><div><p className="text-sm font-semibold text-navy">{String(admin.display_name ?? "Administrador")}</p><p className="text-xs text-muted-foreground">{String(admin.email ?? "sem e-mail")} · {String(admin.status ?? "invited")}</p></div><span className="rounded-full bg-gold/15 px-2 py-1 text-[10px] font-bold text-gold">{String(admin.role_key ?? "tenant_admin")}</span></div>)}</div></div>;
}

function TextField({ label, value, placeholder, onChange, required = false, type = "text" }: { label: string; value: string; placeholder?: string; onChange: (value: string) => void; required?: boolean; type?: string }) {
  return <div className="space-y-1.5"><Label>{label}</Label><Input value={value} placeholder={placeholder} required={required} type={type} onChange={(event) => onChange(event.target.value)} /></div>;
}

function MenusTab({ tenantId, snapshot, onSaved }: { tenantId: string; snapshot: NonNullable<Awaited<ReturnType<typeof getTenantSnapshot>>>; onSaved: (message: string) => Promise<void> }) {
  const [draft, setDraft] = useState<Record<string, { label: string; position: number; is_visible: boolean; audience: "public" | "member" | "admin" | "all" }>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const menuItems = snapshot.menus.length > 0 ? snapshot.menus : DEFAULT_PLATFORM_MODULES.map((item, position) => ({ tenant_id: tenantId, module_key: item.module_key, label_override: null, icon_override: null, route_override: null, position, is_visible: true, audience: "public" as const, parent_id: null, section: item.category }));
  return <div className="space-y-4"><div><h3 className="font-display text-lg text-navy">Menu Builder</h3><p className="text-sm text-muted-foreground">As rotas permanecem técnicas e estáveis. Aqui você controla apenas a experiência: nome exibido, ordem, visibilidade e público.</p></div><div className="space-y-2">{menuItems.map((item) => { const moduleItem = snapshot.modules.find((candidate) => candidate.module_key === item.module_key); if (!moduleItem) return null; const current = draft[item.module_key] ?? { label: item.label_override ?? snapshot.labels[item.module_key] ?? moduleItem.default_label, position: item.position, is_visible: item.is_visible, audience: item.audience }; return <div key={item.module_key} className={`grid gap-3 rounded-xl border p-3 md:grid-cols-[1fr_110px_130px_auto] md:items-end ${current.is_visible ? "border-border" : "border-dashed bg-muted/30 opacity-75"}`}><div className="min-w-0"><p className="truncate text-sm font-semibold text-navy">{moduleItem.default_label}</p><p className="font-mono text-[10px] text-muted-foreground">{moduleItem.module_key}</p><Input value={current.label} onChange={(event) => setDraft((prev) => ({ ...prev, [item.module_key]: { ...current, label: event.target.value } }))} className="mt-2 h-8 text-xs" /></div><div className="space-y-1"><Label className="text-xs">Posição</Label><Input type="number" min={0} value={current.position} onChange={(event) => setDraft((prev) => ({ ...prev, [item.module_key]: { ...current, position: Number(event.target.value) } }))} className="h-8" /></div><div className="space-y-1"><Label className="text-xs">Público</Label><select value={current.audience} onChange={(event) => setDraft((prev) => ({ ...prev, [item.module_key]: { ...current, audience: event.target.value as typeof current.audience } }))} className="h-8 w-full rounded-md border bg-background px-2 text-xs"><option value="public">Público</option><option value="member">Membro</option><option value="admin">Admin</option><option value="all">Todos</option></select></div><div className="flex gap-2"><Button type="button" variant="outline" size="sm" onClick={() => setDraft((prev) => ({ ...prev, [item.module_key]: { ...current, is_visible: !current.is_visible } }))}>{current.is_visible ? "Ocultar" : "Exibir"}</Button><Button type="button" size="sm" disabled={busy === item.module_key} onClick={async () => { setBusy(item.module_key); try { await upsertTenantMenuItem(supabase, tenantId, { ...item, ...current }); await onSaved(`Menu de ${moduleItem.default_label} atualizado.`); } catch (err) { alert(err instanceof Error ? err.message : "Não foi possível salvar o menu."); } finally { setBusy(null); } }}><Save className="mr-1 h-3.5 w-3.5" />Salvar</Button></div></div>; })}</div></div>;
}
