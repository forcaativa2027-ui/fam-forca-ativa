"use client";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAssets, useDepreciationSummary } from "@/hooks/use-queries";
import { supabase } from "@/lib/supabase/client";
import * as PA from "@/services/patrimonyAdvanced";
import type { DepreciationMethod } from "@/types/domain";
import { DEPRECIATION_LABELS, fmtMoney } from "./PatrimonyTypes";

export function DepreciacaoTab({ churchFilter }: { churchFilter: string }) {
  const qc = useQueryClient();
  const { data: summary = [], isLoading } = useDepreciationSummary(churchFilter || undefined);
  const { data: assets = [] } = useAssets({ churchId: churchFilter || undefined });
  const [showForm, setShowForm] = useState(false);
  const [assetId, setAssetId] = useState("");
  const [method, setMethod] = useState<DepreciationMethod>("linear");
  const [lifeYears, setLifeYears] = useState("");
  const [residual, setResidual] = useState("0");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0,10));
  const [busy, setBusy] = useState(false);

  const totalValor = summary.reduce((s, d) => s + (d.valor_atual_liquido ?? 0), 0);
  const totalDeprec = summary.reduce((s, d) => s + (d.depreciacao_acumulada ?? 0), 0);
  const totalAquisicao = summary.reduce((s, d) => s + (d.acquisition_value ?? 0), 0);

  async function handleSave() {
    if (!assetId || !lifeYears) return;
    setBusy(true);
    try {
      await PA.upsertDepreciation(supabase, {
        asset_id: assetId, method, useful_life_years: Number(lifeYears),
        residual_value: Number(residual), start_date: startDate,
      });
      qc.invalidateQueries({ queryKey: ["depreciation-summary"] });
      setShowForm(false); setAssetId(""); setLifeYears(""); setResidual("0");
    } finally { setBusy(false); }
  }

  if (isLoading) return <p className="py-8 text-center text-sm text-muted-foreground">Calculando depreciações…</p>;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-l-4 border-l-[#C9A227]"><CardContent className="pt-4">
          <p className="text-xs text-muted-foreground uppercase font-bold">Valor de Aquisição</p>
          <p className="font-display text-2xl font-bold text-[#0E2A47] mt-1">{fmtMoney(totalAquisicao)}</p>
        </CardContent></Card>
        <Card className="border-l-4 border-l-red-400"><CardContent className="pt-4">
          <p className="text-xs text-muted-foreground uppercase font-bold">Depreciação Acumulada</p>
          <p className="font-display text-2xl font-bold text-red-600 mt-1">{fmtMoney(totalDeprec)}</p>
        </CardContent></Card>
        <Card className="border-l-4 border-l-green-500"><CardContent className="pt-4">
          <p className="text-xs text-muted-foreground uppercase font-bold">Valor Líquido Atual</p>
          <p className="font-display text-2xl font-bold text-green-700 mt-1">{fmtMoney(totalValor)}</p>
        </CardContent></Card>
      </div>

      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-1"/>Registrar Depreciação</Button>
      </div>

      {summary.length === 0 && (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">
          Nenhuma depreciação registrada. Clique em "Registrar Depreciação" para começar.
        </CardContent></Card>
      )}

      <div className="space-y-2">
        {summary.map(d => {
          const pct = d.pct_depreciado ?? 0;
          const color = pct >= 100 ? "bg-red-500" : pct >= 75 ? "bg-orange-400" : pct >= 50 ? "bg-yellow-400" : "bg-green-500";
          return (
            <Card key={d.asset_id} className={`border-l-4 ${pct >= 100 ? "border-l-red-500" : pct >= 75 ? "border-l-orange-400" : "border-l-[#C9A227]"}`}>
              <CardContent className="pt-3 pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-[#0E2A47]">{d.asset_name}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">{d.category}</span>
                      {d.status_depreciacao === "totalmente_depreciado" && (
                        <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700 font-medium">Totalmente depreciado</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-gray-100">
                        <div className={`h-2 rounded-full ${color}`} style={{ width: `${Math.min(100, pct)}%` }} />
                      </div>
                      <span className="text-xs font-bold text-[#0E2A47] w-12 text-right">{pct}%</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
                      <span>📅 Início: {new Date(d.start_date).toLocaleDateString("pt-BR")}</span>
                      <span>⏱️ {d.anos_decorridos}/{d.useful_life_years} anos</span>
                      <span>💰 Aquisição: {fmtMoney(d.acquisition_value)}</span>
                      <span>📊 Líquido: {fmtMoney(d.valor_atual_liquido)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {showForm && (
        <Dialog open onOpenChange={() => setShowForm(false)}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Registrar Depreciação</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label className="text-xs">Bem *</Label>
                <Select value={assetId} onValueChange={setAssetId}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione o bem…"/></SelectTrigger>
                  <SelectContent>{assets.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Método *</Label>
                <Select value={method} onValueChange={v => setMethod(v as DepreciationMethod)}>
                  <SelectTrigger className="mt-1"><SelectValue/></SelectTrigger>
                  <SelectContent>{Object.entries(DEPRECIATION_LABELS).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Vida útil (anos) *</Label>
                  <Input type="number" min="1" value={lifeYears} onChange={e => setLifeYears(e.target.value)} className="mt-1"/>
                </div>
                <div><Label className="text-xs">Valor residual (R$)</Label>
                  <Input type="number" min="0" step="0.01" value={residual} onChange={e => setResidual(e.target.value)} className="mt-1"/>
                </div>
              </div>
              <div><Label className="text-xs">Data de início *</Label>
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1"/>
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                <Button onClick={handleSave} disabled={busy || !assetId || !lifeYears}>{busy ? "Salvando…" : "Salvar"}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
