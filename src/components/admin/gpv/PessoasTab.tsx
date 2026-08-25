"use client";
import { useState, useCallback, useEffect } from "react";
import { Mail, MapPin, Pencil, Phone, Plus, Trash2, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/shared/DatePicker";
import { supabase } from "@/lib/supabase/client";
import { logAudit, diffFields } from "@/services/audit";
import type { GpvPessoa } from "./GpvTypes";
import { Field } from "./GpvHelpers";

export function PessoasTab({ churches }: { churches: { id: string; name: string }[] }) {
  const [pessoas, setPessoas] = useState<GpvPessoa[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(false);
  const [editing, setEditing] = useState<GpvPessoa | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("gpv_pessoas").select("*").eq("is_active", true).order("full_name");
    setPessoas((data as GpvPessoa[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = pessoas.filter(p =>
    p.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (p.cpf ?? "").includes(search) ||
    (p.email ?? "").toLowerCase().includes(search.toLowerCase())
  );

  async function remove(p: GpvPessoa) {
    if (!confirm(`Desativar ${p.full_name}?`)) return;
    await supabase.from("gpv_pessoas").update({ is_active: false }).eq("id", p.id);
    await logAudit(supabase, "update", "gpv_pessoas", p.id, {}, { before: { is_active: true }, after: { is_active: false } });
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input placeholder="Buscar por nome, CPF ou e-mail…" value={search}
          onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <Button onClick={() => { setEditing(null); setForm(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Nova pessoa
        </Button>
      </div>

      {(form || editing) && (
        <PessoaForm
          churches={churches}
          editing={editing}
          onClose={() => { setForm(false); setEditing(null); }}
          onSaved={load}
        />
      )}

      {loading && <p className="text-sm text-muted italic">Carregando…</p>}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => (
          <Card key={p.id} className="border-l-4 border-l-gold">
            <CardContent className="pt-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-navy truncate">{p.full_name}</p>
                  {p.cpf && <p className="text-[11px] text-muted">CPF: {p.cpf}</p>}
                  {p.email && (
                    <p className="flex items-center gap-1 text-[11px] text-muted truncate">
                      <Mail className="h-3 w-3 shrink-0" />{p.email}
                    </p>
                  )}
                  {p.phone && (
                    <p className="flex items-center gap-1 text-[11px] text-muted">
                      <Phone className="h-3 w-3" />{p.phone}
                    </p>
                  )}
                  {(p.cidade || p.estado) && (
                    <p className="flex items-center gap-1 text-[11px] text-muted">
                      <MapPin className="h-3 w-3" />{[p.cidade, p.estado].filter(Boolean).join("/")}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button onClick={() => { setEditing(p); setForm(false); }} variant="outline" size="sm" className="h-7 w-7 p-0">
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button onClick={() => remove(p)} variant="destructive" size="sm" className="h-7 w-7 p-0">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {!loading && filtered.length === 0 && (
          <p className="col-span-full text-sm italic text-muted">Nenhuma pessoa cadastrada.</p>
        )}
      </div>
    </div>
  );
}

function PessoaForm({ churches, editing, onClose, onSaved }: {
  churches: { id: string; name: string }[];
  editing: GpvPessoa | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [f, setF] = useState({
    church_id: editing?.church_id ?? churches[0]?.id ?? "",
    full_name: editing?.full_name ?? "",
    cpf: editing?.cpf ?? "", rg: editing?.rg ?? "",
    data_nascimento: editing?.data_nascimento ?? "",
    email: editing?.email ?? "", phone: editing?.phone ?? "", whatsapp: editing?.whatsapp ?? "",
    cep: editing?.cep ?? "", logradouro: editing?.logradouro ?? "",
    numero: editing?.numero ?? "", complemento: editing?.complemento ?? "",
    bairro: editing?.bairro ?? "", cidade: editing?.cidade ?? "", estado: editing?.estado ?? "",
    pix_key: editing?.pix_key ?? "", banco: editing?.banco ?? "",
    agencia: editing?.agencia ?? "", conta: editing?.conta ?? "",
  });

  function set(key: string, val: string) { setF((prev) => ({ ...prev, [key]: val })); }

  async function save() {
    if (!f.full_name.trim()) { setErr("Nome obrigatório."); return; }
    if (!f.church_id) { setErr("Selecione uma comunidade."); return; }
    setBusy(true); setErr("");
    const payload = {
      church_id: f.church_id, full_name: f.full_name.trim(),
      cpf: f.cpf || null, rg: f.rg || null,
      data_nascimento: f.data_nascimento || null,
      email: f.email || null, phone: f.phone || null, whatsapp: f.whatsapp || null,
      cep: f.cep || null, logradouro: f.logradouro || null,
      numero: f.numero || null, complemento: f.complemento || null,
      bairro: f.bairro || null, cidade: f.cidade || null, estado: f.estado || null,
      pix_key: f.pix_key || null, banco: f.banco || null,
      agencia: f.agencia || null, conta: f.conta || null,
    };
    try {
      if (editing) {
        const { error } = await supabase.from("gpv_pessoas").update(payload).eq("id", editing.id);
        if (error) throw error;
        const diff = diffFields(editing as unknown as Record<string, unknown>, payload as unknown as Record<string, unknown>);
        await logAudit(supabase, "update", "gpv_pessoas", editing.id, {}, diff ?? undefined);
      } else {
        const { data, error } = await supabase.from("gpv_pessoas").insert(payload).select().single();
        if (error) throw error;
        await logAudit(supabase, "insert", "gpv_pessoas", (data as GpvPessoa).id, {}, { after: data as unknown as Record<string, unknown> });
      }
      onSaved(); onClose();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Erro ao salvar");
    } finally { setBusy(false); }
  }

  const SI = (key: string) => ({
    value: f[key as keyof typeof f] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(key, e.target.value),
    className: "h-10 w-full rounded-md border bg-background px-3 text-sm",
  });

  return (
    <Card className="border-2 border-dashed border-gold/40 bg-gold/5">
      <CardContent className="pt-4 space-y-4">
        <div className="flex items-center justify-between">
          <b className="text-navy">{editing ? "Editar pessoa" : "Nova pessoa"}</b>
          <Button type="button" onClick={onClose} variant="ghost" size="sm"><X className="h-3.5 w-3.5" /></Button>
        </div>

        {/* Dados básicos */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nome completo *">
            <Input {...SI("full_name")} placeholder="João da Silva" />
          </Field>
          <Field label="Comunidade *">
            <select value={f.church_id} onChange={(e) => set("church_id", e.target.value)}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm">
              {churches.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="CPF"><Input {...SI("cpf")} placeholder="000.000.000-00" /></Field>
          <Field label="RG"><Input {...SI("rg")} /></Field>
          <Field label="Data de nascimento"><DatePicker value={f.data_nascimento as string} onChange={(v) => set("data_nascimento", v)} disableFuture /></Field>
        </div>

        {/* Contato */}
        <div className="rounded-md border bg-card p-3 space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-navy">Contato</Label>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="E-mail"><Input type="email" {...SI("email")} /></Field>
            <Field label="Telefone"><Input {...SI("phone")} placeholder="(00) 00000-0000" /></Field>
            <Field label="WhatsApp"><Input {...SI("whatsapp")} placeholder="(00) 00000-0000" /></Field>
          </div>
        </div>

        {/* Endereço */}
        <div className="rounded-md border bg-card p-3 space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-navy">Endereço</Label>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="CEP"><Input {...SI("cep")} placeholder="00000-000" /></Field>
            <Field label="Estado"><Input {...SI("estado")} placeholder="AM" maxLength={3} /></Field>
            <Field label="Cidade"><Input {...SI("cidade")} /></Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Bairro"><Input {...SI("bairro")} /></Field>
            <Field label="Logradouro"><Input {...SI("logradouro")} placeholder="Rua, Av..." /></Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Número"><Input {...SI("numero")} /></Field>
            <Field label="Complemento"><Input {...SI("complemento")} /></Field>
          </div>
        </div>

        {/* Dados bancários */}
        <div className="rounded-md border bg-card p-3 space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-navy">Dados bancários / PIX</Label>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Chave PIX"><Input {...SI("pix_key")} placeholder="CPF, e-mail, telefone ou chave aleatória" /></Field>
            <Field label="Banco"><Input {...SI("banco")} /></Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Agência"><Input {...SI("agencia")} /></Field>
            <Field label="Conta"><Input {...SI("conta")} /></Field>
          </div>
        </div>

        {err && <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">{err}</p>}
        <Button onClick={save} disabled={busy} className="gap-2">
          {busy ? "Salvando…" : (editing ? "Salvar alterações" : "Cadastrar pessoa")}
        </Button>
      </CardContent>
    </Card>
  );
}
