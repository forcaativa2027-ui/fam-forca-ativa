"use client";
import { useState, useCallback, useEffect } from "react";
import { Check, Plus, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/shared/DatePicker";
import { supabase } from "@/lib/supabase/client";
import { logAudit } from "@/services/audit";
import type { GpvVinculo, GpvFormaRemuneracao, GpvPagamento, StatusPagamento } from "./GpvTypes";
import { STATUS_PAG_LABELS, STATUS_PAG_COLOR, MESES, fmt } from "./GpvTypes";
import { Field } from "./GpvHelpers";

export function PagamentosTab() {
  const [pagamentos, setPagamentos] = useState<GpvPagamento[]>([]);
  const [vinculos, setVinculos] = useState<GpvVinculo[]>([]);
  const [formas, setFormas] = useState<GpvFormaRemuneracao[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState<StatusPagamento | "">("");

  const load = useCallback(async () => {
    setLoading(true);
    const [, vRes, fRes] = await Promise.all([
      supabase.from("vw_gpv_pagamentos_pendentes").select("*").order("data_vencimento"),
      supabase.from("vw_gpv_vinculos_ativos").select("vinculo_id, pessoa_nome, tipo_vinculo"),
      supabase.from("gpv_formas_remuneracao").select("*").eq("is_active", true).order("nome"),
    ]);
    // Também pegar pagamentos já realizados (pago/cancelado/estornado)
    const { data: todos } = await supabase
      .from("gpv_pagamentos")
      .select(`
        *,
        vinculo:gpv_vinculos(
          pessoa:gpv_pessoas(full_name),
          tipo:gpv_tipos_vinculo(nome),
          church:churches(name)
        ),
        forma:gpv_formas_remuneracao(nome)
      `)
      .order("created_at", { ascending: false })
      .limit(100);

    const mapped = (todos ?? []).map((p: unknown) => ({
      ...(p as GpvPagamento),
      pessoa_nome: ((p as { vinculo?: { pessoa?: { full_name?: string } } | null }).vinculo?.pessoa?.full_name),
      tipo_vinculo: ((p as { vinculo?: { tipo?: { nome?: string } } | null }).vinculo?.tipo?.nome),
      church_name: ((p as { vinculo?: { church?: { name?: string } } | null }).vinculo?.church?.name),
      forma_nome: ((p as { forma?: { nome?: string } | null }).forma?.nome),
    }));

    setPagamentos(mapped);
    setVinculos((vRes.data as GpvVinculo[]) ?? []);
    setFormas((fRes.data as GpvFormaRemuneracao[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filtroStatus ? pagamentos.filter(p => p.status === filtroStatus) : pagamentos;
  const totalPendente = pagamentos.filter(p => p.status === "pendente").reduce((s, p) => s + p.valor_liquido, 0);

  async function marcarPago(p: GpvPagamento) {
    await supabase.from("gpv_pagamentos").update({
      status: "pago", data_pagamento: new Date().toISOString().slice(0,10),
    }).eq("id", p.id);
    load();
  }

  async function cancelar(p: GpvPagamento) {
    if (!confirm("Cancelar este pagamento?")) return;
    await supabase.from("gpv_pagamentos").update({ status: "cancelado" }).eq("id", p.id);
    load();
  }

  return (
    <div className="space-y-4">
      {totalPendente > 0 && (
        <Card className="border-l-4 border-l-yellow-400 bg-yellow-50/50">
          <CardContent className="pt-3 pb-3">
            <p className="text-sm font-semibold text-yellow-800">
              Total pendente: <span className="text-lg">{fmt(totalPendente)}</span>
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value as StatusPagamento | "")}
          className="h-9 rounded-md border bg-background px-3 text-sm">
          <option value="">Todos os status</option>
          {Object.entries(STATUS_PAG_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <Button onClick={() => setForm(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Registrar pagamento
        </Button>
      </div>

      {form && (
        <PagamentoForm vinculos={vinculos} formas={formas}
          onClose={() => setForm(false)} onSaved={load} />
      )}

      {loading && <p className="text-sm text-muted italic">Carregando…</p>}

      <div className="space-y-2">
        {filtered.map((p) => (
          <Card key={p.id} className={`border-l-4 ${p.status === "pago" ? "border-l-green-500" : p.status === "pendente" ? "border-l-yellow-400" : "border-l-gray-300"}`}>
            <CardContent className="pt-3 pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-navy">{p.pessoa_nome ?? "—"}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_PAG_COLOR[p.status]}`}>
                      {STATUS_PAG_LABELS[p.status]}
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-0.5">
                    {p.tipo_vinculo} · {p.forma_nome} · Competência {MESES[(p.competencia_mes ?? 1) - 1]}/{p.competencia_ano}
                  </p>
                  <div className="flex gap-4 mt-0.5 text-xs text-muted">
                    <span>Bruto: {fmt(p.valor_bruto)}</span>
                    <span className="font-bold text-navy">Líquido: {fmt(p.valor_liquido)}</span>
                    {p.data_vencimento && <span>Vence: {new Date(p.data_vencimento).toLocaleDateString("pt-BR")}</span>}
                    {p.data_pagamento && <span>Pago em: {new Date(p.data_pagamento).toLocaleDateString("pt-BR")}</span>}
                  </div>
                </div>
                {p.status === "pendente" && (
                  <div className="flex gap-1 shrink-0">
                    <Button onClick={() => marcarPago(p)} size="sm" className="h-7 gap-1 text-xs bg-green-600 hover:bg-green-700">
                      <Check className="h-3 w-3" /> Pago
                    </Button>
                    <Button onClick={() => cancelar(p)} variant="outline" size="sm" className="h-7 text-xs">
                      Cancelar
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {!loading && filtered.length === 0 && (
          <p className="text-sm italic text-muted">Nenhum pagamento encontrado.</p>
        )}
      </div>
    </div>
  );
}

function PagamentoForm({ vinculos, formas, onClose, onSaved }: {
  vinculos: GpvVinculo[]; formas: GpvFormaRemuneracao[];
  onClose: () => void; onSaved: () => void;
}) {
  const today = new Date();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [f, setF] = useState({
    vinculo_id: "", forma_id: "",
    competencia_mes: String(today.getMonth() + 1),
    competencia_ano: String(today.getFullYear()),
    valor_bruto: "", valor_liquido: "",
    data_vencimento: "", data_pagamento: "",
    status: "pendente" as StatusPagamento,
    observacoes: "",
  });

  function set(key: string, val: string) { setF((prev) => ({ ...prev, [key]: val })); }

  async function save() {
    if (!f.vinculo_id) { setErr("Selecione o vínculo."); return; }
    if (!f.valor_bruto) { setErr("Valor bruto obrigatório."); return; }
    setBusy(true); setErr("");
    try {
      const { data, error } = await supabase.from("gpv_pagamentos").insert({
        vinculo_id: f.vinculo_id, forma_id: f.forma_id || null,
        competencia_mes: Number(f.competencia_mes),
        competencia_ano: Number(f.competencia_ano),
        valor_bruto: Number(f.valor_bruto),
        valor_liquido: Number(f.valor_liquido || f.valor_bruto),
        data_vencimento: f.data_vencimento || null,
        data_pagamento: f.data_pagamento || null,
        status: f.status, observacoes: f.observacoes || null,
      }).select().single();
      if (error) throw error;
      await logAudit(supabase, "insert", "gpv_pagamentos", (data as { id: string }).id, {});
      onSaved(); onClose();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Erro ao salvar");
    } finally { setBusy(false); }
  }

  return (
    <Card className="border-2 border-dashed border-gold/40 bg-gold/5">
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <b className="text-navy">Registrar pagamento</b>
          <Button type="button" onClick={onClose} variant="ghost" size="sm"><X className="h-3.5 w-3.5" /></Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Vínculo *">
            <select value={f.vinculo_id} onChange={(e) => set("vinculo_id", e.target.value)}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm">
              <option value="">— Selecione —</option>
              {vinculos.map((v) => (
                <option key={v.vinculo_id ?? v.id} value={v.vinculo_id ?? v.id}>
                  {v.pessoa_nome} · {v.tipo_vinculo}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Forma de remuneração">
            <select value={f.forma_id} onChange={(e) => set("forma_id", e.target.value)}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm">
              <option value="">— Não especificada —</option>
              {formas.map((fr) => <option key={fr.id} value={fr.id}>{fr.nome}</option>)}
            </select>
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Mês de competência">
            <select value={f.competencia_mes} onChange={(e) => set("competencia_mes", e.target.value)}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm">
              {MESES.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
            </select>
          </Field>
          <Field label="Ano">
            <Input type="number" min="2020" max="2100" value={f.competencia_ano}
              onChange={(e) => set("competencia_ano", e.target.value)} />
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Valor bruto (R$) *">
            <Input type="number" step="0.01" min={0} value={f.valor_bruto}
              onChange={(e) => { set("valor_bruto", e.target.value); if (!f.valor_liquido) set("valor_liquido", e.target.value); }} />
          </Field>
          <Field label="Valor líquido (R$)">
            <Input type="number" step="0.01" min={0} value={f.valor_liquido}
              onChange={(e) => set("valor_liquido", e.target.value)}
              placeholder="Igual ao bruto se não informado" />
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Data de vencimento">
            <DatePicker value={f.data_vencimento} onChange={(v) => set("data_vencimento", v)} />
          </Field>
          <Field label="Data de pagamento">
            <DatePicker value={f.data_pagamento} onChange={(v) => set("data_pagamento", v)} />
          </Field>
          <Field label="Status">
            <select value={f.status} onChange={(e) => set("status", e.target.value as StatusPagamento)}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm">
              {Object.entries(STATUS_PAG_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Observações">
          <Input value={f.observacoes} onChange={(e) => set("observacoes", e.target.value)} />
        </Field>

        {err && <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">{err}</p>}
        <Button onClick={save} disabled={busy} className="gap-2">
          {busy ? "Salvando…" : "Registrar pagamento"}
        </Button>
      </CardContent>
    </Card>
  );
}
