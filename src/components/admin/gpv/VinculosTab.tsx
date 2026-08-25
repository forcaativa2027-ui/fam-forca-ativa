"use client";
import { useState, useCallback, useEffect } from "react";
import { Check, ChevronDown, ChevronRight, Plus, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/shared/DatePicker";
import { supabase } from "@/lib/supabase/client";
import { logAudit } from "@/services/audit";
import type {
  GpvPessoa, GpvTipoVinculo, GpvFormaRemuneracao, GpvVinculo, GpvRemuneracao,
  CategoriaVinculo, StatusVinculo, Periodicidade,
} from "./GpvTypes";
import { CATEGORIA_LABELS, STATUS_VINCULO_LABELS, STATUS_VINCULO_COLOR, PERIODICIDADE_LABELS, fmt } from "./GpvTypes";
import { Field } from "./GpvHelpers";

export function VinculosTab({ churches }: { churches: { id: string; name: string }[] }) {
  const [vinculos, setVinculos] = useState<GpvVinculo[]>([]);
  const [pessoas, setPessoas] = useState<GpvPessoa[]>([]);
  const [tipos, setTipos] = useState<GpvTipoVinculo[]>([]);
  const [formas, setFormas] = useState<GpvFormaRemuneracao[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [remuneracoes, setRemuneracoes] = useState<Record<string, GpvRemuneracao[]>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const [vRes, pRes, tRes, fRes] = await Promise.all([
      supabase.from("vw_gpv_vinculos_ativos").select("*"),
      supabase.from("gpv_pessoas").select("id, full_name").eq("is_active", true).order("full_name"),
      supabase.from("gpv_tipos_vinculo").select("*").eq("is_active", true).order("nome"),
      supabase.from("gpv_formas_remuneracao").select("*").eq("is_active", true).order("nome"),
    ]);
    setVinculos((vRes.data as GpvVinculo[]) ?? []);
    setPessoas((pRes.data as GpvPessoa[]) ?? []);
    setTipos((tRes.data as GpvTipoVinculo[]) ?? []);
    setFormas((fRes.data as GpvFormaRemuneracao[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function loadRemuneracoes(vinculoId: string) {
    if (remuneracoes[vinculoId]) return;
    const { data } = await supabase
      .from("gpv_remuneracoes")
      .select("*, forma:gpv_formas_remuneracao(nome)")
      .eq("vinculo_id", vinculoId);
    const rows = (data ?? []).map((r: unknown) => ({
      ...(r as GpvRemuneracao),
      forma_nome: ((r as { forma?: { nome?: string } | null }).forma)?.nome,
    }));
    setRemuneracoes((prev) => ({ ...prev, [vinculoId]: rows }));
  }

  function toggleExpand(id: string) {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    loadRemuneracoes(id);
  }

  async function encerrar(v: GpvVinculo) {
    if (!confirm(`Encerrar vínculo de ${v.pessoa_nome}?`)) return;
    await supabase.from("gpv_vinculos").update({ status: "encerrado", data_fim: new Date().toISOString().slice(0,10) }).eq("id", v.id);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{vinculos.length} vínculo(s) ativo(s)</p>
        <Button onClick={() => setForm(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Novo vínculo
        </Button>
      </div>

      {form && (
        <VinculoForm
          pessoas={pessoas} tipos={tipos} formas={formas} churches={churches}
          onClose={() => setForm(false)} onSaved={load}
        />
      )}

      {loading && <p className="text-sm text-muted italic">Carregando…</p>}

      <div className="space-y-2">
        {vinculos.map((v) => (
          <Card key={v.vinculo_id ?? v.id} className="border-l-4 border-l-gold">
            <CardContent className="pt-3 pb-3">
              <div className="flex items-center gap-3">
                <button onClick={() => toggleExpand(v.vinculo_id ?? v.id)} className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-navy">{v.pessoa_nome}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_VINCULO_COLOR[v.status]}`}>
                      {STATUS_VINCULO_LABELS[v.status]}
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-0.5">
                    {v.tipo_vinculo}{v.cargo ? ` · ${v.cargo}` : ""} · {v.church_name}
                  </p>
                  <p className="text-xs text-muted">
                    Desde {new Date(v.data_inicio).toLocaleDateString("pt-BR")}
                    {(v as unknown as { total_remuneracao: number }).total_remuneracao > 0 &&
                      ` · ${fmt((v as unknown as { total_remuneracao: number }).total_remuneracao)}/mês`}
                  </p>
                </button>
                <div className="flex gap-1 shrink-0">
                  {expanded === (v.vinculo_id ?? v.id)
                    ? <ChevronDown className="h-4 w-4 text-muted" />
                    : <ChevronRight className="h-4 w-4 text-muted" />}
                  <Button onClick={() => encerrar(v)} variant="outline" size="sm" className="h-7 px-2 text-xs">
                    Encerrar
                  </Button>
                </div>
              </div>

              {/* Remunerações expandidas */}
              {expanded === (v.vinculo_id ?? v.id) && (
                <div className="mt-3 border-t pt-3">
                  <p className="text-xs font-bold uppercase text-muted mb-2">Remunerações</p>
                  {(remuneracoes[v.vinculo_id ?? v.id] ?? []).length === 0
                    ? <p className="text-xs text-muted italic">Nenhuma remuneração cadastrada.</p>
                    : (remuneracoes[v.vinculo_id ?? v.id] ?? []).map((r) => (
                        <div key={r.id} className="flex items-center justify-between text-xs border-b py-1.5 last:border-0">
                          <span className="text-navy font-medium">{r.forma_nome}</span>
                          <span className="text-muted">{PERIODICIDADE_LABELS[r.periodicidade]}</span>
                          <span className="font-bold text-navy">{fmt(r.valor)}</span>
                        </div>
                      ))}
                  <AddRemuneracaoInline vinculoId={v.vinculo_id ?? v.id} formas={formas}
                    onSaved={() => {
                      setRemuneracoes((prev) => { const n = {...prev}; delete n[v.vinculo_id ?? v.id]; return n; });
                      loadRemuneracoes(v.vinculo_id ?? v.id);
                    }} />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {!loading && vinculos.length === 0 && (
          <p className="text-sm italic text-muted">Nenhum vínculo ativo.</p>
        )}
      </div>
    </div>
  );
}

function VinculoForm({ pessoas, tipos, formas, churches, onClose, onSaved }: {
  pessoas: GpvPessoa[]; tipos: GpvTipoVinculo[]; formas: GpvFormaRemuneracao[];
  churches: { id: string; name: string }[];
  onClose: () => void; onSaved: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [f, setF] = useState({
    pessoa_id: "", tipo_vinculo_id: "", church_id: churches[0]?.id ?? "",
    cargo: "", departamento: "", data_inicio: new Date().toISOString().slice(0,10),
    status: "ativo" as StatusVinculo, observacoes: "",
    // remuneração inicial (opcional)
    forma_id: "", valor: "", periodicidade: "mensal" as Periodicidade, dia_pagamento: "5",
  });

  function set(key: string, val: string) { setF((prev) => ({ ...prev, [key]: val })); }

  async function save() {
    if (!f.pessoa_id) { setErr("Selecione uma pessoa."); return; }
    if (!f.tipo_vinculo_id) { setErr("Selecione o tipo de vínculo."); return; }
    if (!f.data_inicio) { setErr("Data de início obrigatória."); return; }
    setBusy(true); setErr("");
    try {
      const { data: vData, error: vErr } = await supabase.from("gpv_vinculos").insert({
        pessoa_id: f.pessoa_id, tipo_vinculo_id: f.tipo_vinculo_id, church_id: f.church_id,
        cargo: f.cargo || null, departamento: f.departamento || null,
        data_inicio: f.data_inicio, status: f.status,
        observacoes: f.observacoes || null,
      }).select().single();
      if (vErr) throw vErr;
      const vinculoId = (vData as { id: string }).id;
      // Registrar no histórico
      await supabase.from("gpv_historico").insert({
        vinculo_id: vinculoId, tipo_evento: "nomeacao",
        descricao: `Vínculo iniciado em ${new Date(f.data_inicio).toLocaleDateString("pt-BR")}`,
        data_evento: f.data_inicio,
      });
      // Remuneração inicial (se preenchida)
      if (f.forma_id && f.valor) {
        await supabase.from("gpv_remuneracoes").insert({
          vinculo_id: vinculoId, forma_id: f.forma_id,
          valor: Number(f.valor), periodicidade: f.periodicidade,
          dia_pagamento: f.dia_pagamento ? Number(f.dia_pagamento) : null,
          vigente_desde: f.data_inicio,
        });
      }
      await logAudit(supabase, "insert", "gpv_vinculos", vinculoId, { pessoa_id: f.pessoa_id });
      onSaved(); onClose();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Erro ao salvar");
    } finally { setBusy(false); }
  }

  const tiposPorCategoria = Object.entries(
    tipos.reduce<Record<string, GpvTipoVinculo[]>>((acc, t) => {
      (acc[t.categoria] = acc[t.categoria] || []).push(t);
      return acc;
    }, {})
  );

  return (
    <Card className="border-2 border-dashed border-gold/40 bg-gold/5">
      <CardContent className="pt-4 space-y-4">
        <div className="flex items-center justify-between">
          <b className="text-navy">Novo vínculo</b>
          <Button type="button" onClick={onClose} variant="ghost" size="sm"><X className="h-3.5 w-3.5" /></Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Pessoa *">
            <select value={f.pessoa_id} onChange={(e) => set("pessoa_id", e.target.value)}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm">
              <option value="">— Selecione —</option>
              {pessoas.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select>
          </Field>
          <Field label="Comunidade *">
            <select value={f.church_id} onChange={(e) => set("church_id", e.target.value)}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm">
              {churches.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Tipo de vínculo *">
            <select value={f.tipo_vinculo_id} onChange={(e) => set("tipo_vinculo_id", e.target.value)}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm">
              <option value="">— Selecione —</option>
              {tiposPorCategoria.map(([cat, items]) => (
                <optgroup key={cat} label={CATEGORIA_LABELS[cat as CategoriaVinculo]}>
                  {items.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
                </optgroup>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select value={f.status} onChange={(e) => set("status", e.target.value)}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm">
              {Object.entries(STATUS_VINCULO_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Cargo / Função"><Input value={f.cargo} onChange={(e) => set("cargo", e.target.value)} /></Field>
          <Field label="Departamento"><Input value={f.departamento} onChange={(e) => set("departamento", e.target.value)} /></Field>
          <Field label="Data de início *"><DatePicker value={f.data_inicio} onChange={(v) => set("data_inicio", v)} /></Field>
        </div>

        <Field label="Observações">
          <Input value={f.observacoes} onChange={(e) => set("observacoes", e.target.value)} />
        </Field>

        {/* Remuneração inicial opcional */}
        <div className="rounded-md border bg-card p-3 space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-navy">Remuneração inicial (opcional)</Label>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Forma de pagamento">
              <select value={f.forma_id} onChange={(e) => set("forma_id", e.target.value)}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                <option value="">— Não informar agora —</option>
                {formas.map((fr) => <option key={fr.id} value={fr.id}>{fr.nome}</option>)}
              </select>
            </Field>
            <Field label="Valor (R$)">
              <Input type="number" step="0.01" min={0} value={f.valor}
                onChange={(e) => set("valor", e.target.value)} placeholder="0,00" />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Periodicidade">
              <select value={f.periodicidade} onChange={(e) => set("periodicidade", e.target.value)}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                {Object.entries(PERIODICIDADE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
            <Field label="Dia do pagamento">
              <Input type="number" min={1} max={31} value={f.dia_pagamento}
                onChange={(e) => set("dia_pagamento", e.target.value)} />
            </Field>
          </div>
        </div>

        {err && <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">{err}</p>}
        <Button onClick={save} disabled={busy} className="gap-2">
          {busy ? "Salvando…" : "Criar vínculo"}
        </Button>
      </CardContent>
    </Card>
  );
}

function AddRemuneracaoInline({ vinculoId, formas, onSaved }: {
  vinculoId: string; formas: GpvFormaRemuneracao[]; onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [forma_id, setFormaId] = useState("");
  const [valor, setValor] = useState("");
  const [periodicidade, setPeriodicidade] = useState<Periodicidade>("mensal");
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!forma_id || !valor) return;
    setBusy(true);
    await supabase.from("gpv_remuneracoes").insert({
      vinculo_id: vinculoId, forma_id, valor: Number(valor),
      periodicidade, vigente_desde: new Date().toISOString().slice(0,10),
    });
    setBusy(false); setOpen(false); setFormaId(""); setValor("");
    onSaved();
  }

  if (!open) return (
    <Button onClick={() => setOpen(true)} variant="outline" size="sm" className="mt-2 gap-1 text-xs h-7">
      <Plus className="h-3 w-3" /> Adicionar remuneração
    </Button>
  );

  return (
    <div className="mt-2 rounded-md border bg-background p-2 space-y-2">
      <div className="grid gap-2 sm:grid-cols-3">
        <select value={forma_id} onChange={(e) => setFormaId(e.target.value)}
          className="h-8 rounded-md border bg-background px-2 text-xs">
          <option value="">— Forma —</option>
          {formas.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
        </select>
        <Input type="number" step="0.01" min={0} value={valor}
          onChange={(e) => setValor(e.target.value)} placeholder="Valor R$"
          className="h-8 text-xs" />
        <select value={periodicidade} onChange={(e) => setPeriodicidade(e.target.value as Periodicidade)}
          className="h-8 rounded-md border bg-background px-2 text-xs">
          {Object.entries(PERIODICIDADE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div className="flex gap-1">
        <Button onClick={save} disabled={busy || !forma_id || !valor} size="sm" className="h-7 gap-1 text-xs">
          <Check className="h-3 w-3" />{busy ? "Salvando…" : "Salvar"}
        </Button>
        <Button onClick={() => setOpen(false)} variant="ghost" size="sm" className="h-7 text-xs">Cancelar</Button>
      </div>
    </div>
  );
}
