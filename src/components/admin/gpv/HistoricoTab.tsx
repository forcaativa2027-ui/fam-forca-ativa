"use client";
import { useState, useEffect } from "react";
import { Clock, Plus, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/shared/DatePicker";
import { supabase } from "@/lib/supabase/client";
import type { GpvVinculo, GpvHistorico, TipoEvento } from "./GpvTypes";
import { TIPO_EVENTO_LABELS } from "./GpvTypes";
import { Field } from "./GpvHelpers";

const EVENTO_ICON: Record<TipoEvento, string> = {
  nomeacao: "🏅", promocao: "📈", transferencia: "🔄", mudanca_salario: "💰",
  suspensao: "⚠️", licenca: "🏖️", afastamento: "🏥", ferias: "🌴",
  rescisao: "📋", reativacao: "✅", advertencia: "⚡", curso: "📚",
  treinamento: "🎯", ocorrencia: "📝",
};

export function HistoricoTab() {
  const [vinculos, setVinculos] = useState<GpvVinculo[]>([]);
  const [historico, setHistorico] = useState<GpvHistorico[]>([]);
  const [vinculoId, setVinculoId] = useState("");
  const [form, setForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fEvento, setFEvento] = useState({ tipo_evento: "nomeacao" as TipoEvento, descricao: "", data_evento: new Date().toISOString().slice(0,10) });

  useEffect(() => {
    supabase.from("vw_gpv_vinculos_ativos").select("vinculo_id, pessoa_nome, tipo_vinculo")
      .then(({ data }) => setVinculos((data as GpvVinculo[]) ?? []));
  }, []);

  async function loadHistorico(id: string) {
    const { data } = await supabase.from("gpv_historico").select("*").eq("vinculo_id", id).order("data_evento", { ascending: false });
    setHistorico((data as GpvHistorico[]) ?? []);
  }

  useEffect(() => { if (vinculoId) loadHistorico(vinculoId); }, [vinculoId]);

  async function saveEvento() {
    if (!vinculoId || !fEvento.descricao) return;
    setBusy(true);
    await supabase.from("gpv_historico").insert({ vinculo_id: vinculoId, ...fEvento });
    setBusy(false); setForm(false);
    setFEvento({ tipo_evento: "nomeacao", descricao: "", data_evento: new Date().toISOString().slice(0,10) });
    loadHistorico(vinculoId);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select value={vinculoId} onChange={(e) => setVinculoId(e.target.value)}
          className="h-9 rounded-md border bg-background px-3 text-sm">
          <option value="">— Selecione o vínculo —</option>
          {vinculos.map((v) => (
            <option key={v.vinculo_id ?? v.id} value={v.vinculo_id ?? v.id}>
              {v.pessoa_nome} · {v.tipo_vinculo}
            </option>
          ))}
        </select>
        {vinculoId && (
          <Button onClick={() => setForm(true)} variant="outline" size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" /> Registrar evento
          </Button>
        )}
      </div>

      {form && vinculoId && (
        <Card className="border-2 border-dashed border-gold/40 bg-gold/5">
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <b className="text-navy">Novo evento</b>
              <Button type="button" onClick={() => setForm(false)} variant="ghost" size="sm"><X className="h-3.5 w-3.5" /></Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Tipo de evento">
                <select value={fEvento.tipo_evento}
                  onChange={(e) => setFEvento((prev) => ({ ...prev, tipo_evento: e.target.value as TipoEvento }))}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                  {Object.entries(TIPO_EVENTO_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </Field>
              <Field label="Data do evento">
                <DatePicker value={fEvento.data_evento} onChange={(v) => setFEvento((prev) => ({ ...prev, data_evento: v }))} />
              </Field>
            </div>
            <Field label="Descrição *">
              <Input value={fEvento.descricao}
                onChange={(e) => setFEvento((prev) => ({ ...prev, descricao: e.target.value }))}
                placeholder="Descreva o evento em detalhes…" />
            </Field>
            <Button onClick={saveEvento} disabled={busy || !fEvento.descricao} className="gap-2">
              {busy ? "Salvando…" : "Registrar evento"}
            </Button>
          </CardContent>
        </Card>
      )}

      {vinculoId && (
        <div className="relative pl-4">
          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gold/30" />
          {historico.length === 0 && <p className="text-sm italic text-muted">Nenhum evento registrado.</p>}
          {historico.map((h) => (
            <div key={h.id} className="relative mb-4 pl-6">
              <div className="absolute left-[-5px] top-1.5 h-2.5 w-2.5 rounded-full bg-gold border-2 border-white" />
              <p className="text-[11px] text-muted font-bold uppercase tracking-wide">
                {EVENTO_ICON[h.tipo_evento]} {TIPO_EVENTO_LABELS[h.tipo_evento]} · {new Date(h.data_evento).toLocaleDateString("pt-BR")}
              </p>
              <p className="text-sm text-navy mt-0.5">{h.descricao}</p>
            </div>
          ))}
        </div>
      )}

      {!vinculoId && (
        <Card>
          <CardContent className="pt-8 pb-8 text-center">
            <Clock className="h-8 w-8 text-muted mx-auto mb-2" />
            <p className="text-sm text-muted">Selecione um vínculo para ver o histórico.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
