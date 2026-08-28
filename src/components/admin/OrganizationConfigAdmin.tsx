"use client";

import { useEffect, useState } from "react";
import { Building2, CheckCircle2, Globe2, Loader2, MapPin, Phone, Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useMyProfile, useOrganizationConfig } from "@/hooks/use-queries";
import { saveOrganizationConfig, type OrganizationConfig } from "@/services/organizationConfig";
import { supabase } from "@/lib/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

type FormState = {
  official_name: string;
  display_name: string;
  short_name: string;
  document: string;
  address: {
    cep: string;
    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    estado: string;
  };
  contacts: {
    email: string;
    phone: string;
    mobile: string;
    whatsapp: string;
  };
  social: {
    site: string;
    instagram: string;
    facebook: string;
    youtube: string;
    tiktok: string;
    linkedin: string;
    other_name: string;
    other_url: string;
  };
};

const EMPTY_FORM: FormState = {
  official_name: "",
  display_name: "",
  short_name: "",
  document: "",
  address: { cep: "", logradouro: "", numero: "", complemento: "", bairro: "", cidade: "", estado: "" },
  contacts: { email: "", phone: "", mobile: "", whatsapp: "" },
  social: { site: "", instagram: "", facebook: "", youtube: "", tiktok: "", linkedin: "", other_name: "", other_url: "" },
};

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function formFromConfig(config: OrganizationConfig | null | undefined): FormState {
  if (!config) return EMPTY_FORM;
  const address = config.address ?? {};
  const contacts = config.contacts ?? {};
  const social = config.social ?? {};
  return {
    official_name: text(config.official_name),
    display_name: text(config.display_name),
    short_name: text(config.short_name),
    document: text(config.document),
    address: {
      cep: text(address.cep), logradouro: text(address.logradouro), numero: text(address.numero),
      complemento: text(address.complemento), bairro: text(address.bairro), cidade: text(address.cidade), estado: text(address.estado),
    },
    contacts: {
      email: text(contacts.email), phone: text(contacts.phone), mobile: text(contacts.mobile), whatsapp: text(contacts.whatsapp),
    },
    social: {
      site: text(social.site), instagram: text(social.instagram), facebook: text(social.facebook),
      youtube: text(social.youtube), tiktok: text(social.tiktok), linkedin: text(social.linkedin),
      other_name: text(social.other_name), other_url: text(social.other_url),
    },
  };
}

function clean(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function OrganizationConfigAdmin() {
  const queryClient = useQueryClient();
  const { data: profile } = useMyProfile();
  const churchId = profile?.church_id ?? null;
  const { data: config, isLoading } = useOrganizationConfig(churchId);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (config) setForm(formFromConfig(config));
  }, [config]);

  function setRoot(field: keyof Pick<FormState, "official_name" | "display_name" | "short_name" | "document">, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setFeedback(null);
  }

  function setNested(section: "address" | "contacts" | "social", field: string, value: string) {
    setForm((current) => ({ ...current, [section]: { ...current[section], [field]: value } }));
    setFeedback(null);
  }

  async function save() {
    if (!churchId) {
      setFeedback({ kind: "error", message: "Não foi possível identificar a organização do administrador." });
      return;
    }
    if (!form.display_name.trim() && !form.official_name.trim()) {
      setFeedback({ kind: "error", message: "Informe pelo menos o nome de exibição ou o nome oficial." });
      return;
    }

    setSaving(true);
    setFeedback(null);
    try {
      const saved = await saveOrganizationConfig(supabase, {
        church_id: churchId,
        organization_type: config?.organization_type ?? "association",
        setup_status: config?.setup_status ?? "setup_in_progress",
        official_name: clean(form.official_name),
        display_name: clean(form.display_name),
        short_name: clean(form.short_name),
        document: clean(form.document),
        address: Object.fromEntries(Object.entries(form.address).map(([key, value]) => [key, clean(value)])),
        contacts: Object.fromEntries(Object.entries(form.contacts).map(([key, value]) => [key, clean(value)])),
        social: Object.fromEntries(Object.entries(form.social).map(([key, value]) => [key, clean(value)])),
        features: config?.features ?? {},
        navigation: config?.navigation ?? {},
        is_public: config?.is_public ?? false,
      });
      queryClient.setQueryData(["organization-config", churchId], saved);
      await queryClient.invalidateQueries({ queryKey: ["org-terminology", churchId] });
      setFeedback({ kind: "success", message: "Dados institucionais salvos com sucesso." });
    } catch (error) {
      setFeedback({ kind: "error", message: error instanceof Error ? error.message : "Não foi possível salvar a configuração." });
    } finally {
      setSaving(false);
    }
  }

  if (!churchId) return null;
  if (isLoading) return <Card><CardContent className="flex items-center gap-2 py-6 text-sm text-muted"><Loader2 className="h-4 w-4 animate-spin" />Carregando configuração institucional…</CardContent></Card>;

  return (
    <Card className="border-gold/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-navy"><Building2 className="h-5 w-5 text-gold" />Configuração institucional</CardTitle>
        <CardDescription>Cadastre os dados oficiais que poderão alimentar a experiência pública da FAM.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-navy-600"><Building2 className="h-4 w-4 text-gold" />Identidade</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nome oficial" value={form.official_name} onChange={(value) => setRoot("official_name", value)} placeholder="Força Ativa da Mulher" />
            <Field label="Nome de exibição" value={form.display_name} onChange={(value) => setRoot("display_name", value)} placeholder="FAM" />
            <Field label="Nome curto" value={form.short_name} onChange={(value) => setRoot("short_name", value)} placeholder="FAM" />
            <Field label="CNPJ" value={form.document} onChange={(value) => setRoot("document", value)} placeholder="00.000.000/0000-00" />
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-navy-600"><MapPin className="h-4 w-4 text-gold" />Endereço</div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="CEP" value={form.address.cep} onChange={(value) => setNested("address", "cep", value)} placeholder="00000-000" />
            <div className="sm:col-span-2"><Field label="Logradouro" value={form.address.logradouro} onChange={(value) => setNested("address", "logradouro", value)} placeholder="Rua, avenida ou praça" /></div>
            <Field label="Número" value={form.address.numero} onChange={(value) => setNested("address", "numero", value)} placeholder="Número" />
            <Field label="Complemento" value={form.address.complemento} onChange={(value) => setNested("address", "complemento", value)} placeholder="Sala, bloco…" />
            <Field label="Bairro" value={form.address.bairro} onChange={(value) => setNested("address", "bairro", value)} placeholder="Bairro" />
            <Field label="Cidade" value={form.address.cidade} onChange={(value) => setNested("address", "cidade", value)} placeholder="Cidade" />
            <Field label="Estado/UF" value={form.address.estado} onChange={(value) => setNested("address", "estado", value.toUpperCase().slice(0, 2))} placeholder="UF" maxLength={2} />
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-navy-600"><Phone className="h-4 w-4 text-gold" />Contatos</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="E-mail institucional" type="email" value={form.contacts.email} onChange={(value) => setNested("contacts", "email", value)} placeholder="contato@instituicao.org.br" />
            <Field label="Telefone fixo" value={form.contacts.phone} onChange={(value) => setNested("contacts", "phone", value)} placeholder="(00) 0000-0000" />
            <Field label="Telefone celular" value={form.contacts.mobile} onChange={(value) => setNested("contacts", "mobile", value)} placeholder="(00) 00000-0000" />
            <Field label="WhatsApp" value={form.contacts.whatsapp} onChange={(value) => setNested("contacts", "whatsapp", value)} placeholder="(00) 00000-0000" />
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-navy-600"><Globe2 className="h-4 w-4 text-gold" />Redes sociais e links</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Site" type="url" value={form.social.site} onChange={(value) => setNested("social", "site", value)} placeholder="https://..." />
            <Field label="Instagram" type="url" value={form.social.instagram} onChange={(value) => setNested("social", "instagram", value)} placeholder="https://instagram.com/..." />
            <Field label="Facebook" type="url" value={form.social.facebook} onChange={(value) => setNested("social", "facebook", value)} placeholder="https://facebook.com/..." />
            <Field label="YouTube" type="url" value={form.social.youtube} onChange={(value) => setNested("social", "youtube", value)} placeholder="https://youtube.com/@..." />
            <Field label="TikTok" type="url" value={form.social.tiktok} onChange={(value) => setNested("social", "tiktok", value)} placeholder="https://tiktok.com/@..." />
            <Field label="LinkedIn" type="url" value={form.social.linkedin} onChange={(value) => setNested("social", "linkedin", value)} placeholder="https://linkedin.com/company/..." />
            <Field label="Outra mídia — nome" value={form.social.other_name} onChange={(value) => setNested("social", "other_name", value)} placeholder="Nome da rede" />
            <Field label="Outra mídia — URL" type="url" value={form.social.other_url} onChange={(value) => setNested("social", "other_url", value)} placeholder="https://..." />
          </div>
        </section>

        <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted">O salvamento altera somente a configuração institucional do tenant FAM. A publicação pública permanece sob controle do workflow.</p>
          <Button type="button" onClick={save} disabled={saving} className="gap-2 bg-fam-plum hover:bg-fam-plum/90">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Salvando…" : "Salvar dados institucionais"}
          </Button>
        </div>
        {feedback && (
          <p className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${feedback.kind === "success" ? "bg-emerald-50 text-emerald-800" : "bg-destructive/10 text-destructive"}`} role="status">
            {feedback.kind === "success" && <CheckCircle2 className="h-4 w-4" />}
            {feedback.message}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", maxLength }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  maxLength?: number;
}) {
  const id = `org-config-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} maxLength={maxLength} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}
