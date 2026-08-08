"use client";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Check, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAssets, useMaintenanceUpcoming, useMaintenanceHistory } from "@/hooks/use-queries";
import { supabase } from "@/lib/supabase/client";
import * as PA from "@/services/patrimonyAdvanced";
import type { MaintenanceType, MaintenanceStatus } from "@/types/domain";
import { MAINTENANCE_TYPE_LABELS, MAINTENANCE_STATUS_LABELS, MAINTENANCE_STATUS_COLOR, fmtMoney } from "./PatrimonyTypes";

export function ManutencaoTab({ churchFilter }: { churchFilter: string }) {
  const qc = useQueryClient();
  const { data: upcoming = [], isLoading: loadingUp } = useMaintenanceUpcoming(churchFilter || undefined);
  const { data: history  = [], isLoading: loadingHist } = useMaintenanceHistory(churchFilter || undefined);
  const { data: assets   = [] } = useAssets({ churchId: churchFilter || undefined });
  const [showForm, setShowForm] = useState(false);
  const [tab2, setTab2] = useState<"upcoming"|"history">("upcoming");
  const [form, setForm] = useState({
    asset_id: "", type: "preventiva" as MaintenanceType,
    status: "agendada" as MaintenanceStatus,
    scheduled_at: new Date().toISOString().slice(0,10),
    description: "", provider_name: "", cost: "", next_maintenance: "",
  });
  const [busy, setBusy] = useState(false);

  async function handleSave() {
    if (!form.asset_id || !form.description) return;
    setBusy(true);
    try {
      await PA.createMaintenance(supabase, {
        ...form,
        cost: form.cost ? Number(form.cost) : null,
        next_maintenance: form.next_maintenance || null,
        provider_name: form.provider_name || null,
      });
      qc.invalidateQueries({ queryKey: ["maintenance-upcoming"] });
      qc.invalidateQueries({ queryKey: ["maintenance-history"] });
      setShowForm(false);
    } finally { setBusy(false); }
  }

  async function concluir(id: string) {
    await PA.updateMaintenance(supabase, id, { status: "concluida", completed_at: new Date().toISOString().slice(0,10) });
    qc.invalidateQueries({ queryKey: ["maintenance-upcoming"] });
    qc.invalidateQueries({ queryKey: ["maintenance-history"] });
  }

  async function excluir(id: string) {
    if (!confirm("Excluir esta manutenção?")) return;
    await PA.deleteMaintenance(supabase, id);
    qc.invalidateQueries({ queryKey: ["maintenance-upcoming"] });
    qc.invalidateQueries({ queryKey: ["maintenance-history"] });
  }

  const vencidas = upcoming.filter(m => m.dias_para_manutencao < 0).length;

  return (
    <div className="space-y-4">
      {vencidas > 0 && (
        <div className="flex items-center gap-3 rounded-lg bg-red-50 border border-red-200 p-3">
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0"/>
          <p className="text-sm text-red-800"><strong>{vencidas} manutenção(ões) vencida(s)</strong> — intervenção necessária.</p>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button size="sm" variant={tab2==="upcoming"?"default":"outline"} onClick={() => setTab2("upcoming")}>
            Pendentes ({upcoming.length})
          </Button>
          <Button size="sm" variant={tab2==="history"?"default":"outline"} onClick={() => setTab2("history")}>
            Histórico ({history.length})
          </Button>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-1"/>Agendar</Button>
      </div>

      {tab2 === "upcoming" && (
        <div className="space-y-2">
          {loadingUp && <p className="text-sm text-center text-muted-foreground py-6">Carregando…</p>}
          {!loadingUp && upcoming.length === 0 && <p className="text-sm text-center text-muted-foreground py-6">Nenhuma manutenção pendente.</p>}
          {upcoming.map(m => (
            <Card key={m.id} className={`border-l-4 ${m.dias_para_manutencao < 0 ? "border-l-red-500" : m.dias_para_manutencao <= 7 ? "border-l-yellow-400" : "border-l-blue-400"}`}>
              <CardContent className="pt-3 pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-[#0E2A47]">{m.asset_name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${MAINTENANCE_STATUS_COLOR[m.status]}`}>
                        {MAINTENANCE_STATUS_LABELS[m.status as MaintenanceStatus]}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                        {MAINTENANCE_TYPE_LABELS[m.type as MaintenanceType]}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{m.description}</p>
                    <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                      <span>📅 {new Date(m.scheduled_at).toLocaleDateString("pt-BR")}</span>
                      {m.dias_para_manutencao < 0
                        ? <span className="text-red-600 font-semibold">⚠️ Vencida há {Math.abs(m.dias_para_manutencao)} dias</span>
                        : <span>Em {m.dias_para_manutencao} dias</span>}
                      {m.cost && <span>💰 {fmtMoney(m.cost)}</span>}
                      {m.provider_name && <span>🔧 {m.provider_name}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" variant="ghost" className="text-green-600" onClick={() => concluir(m.id)}>
                      <Check className="h-3.5 w-3.5"/>
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-500" onClick={() => excluir(m.id)}>
                      <Trash2 className="h-3.5 w-3.5"/>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {tab2 === "history" && (
        <div className="space-y-2">
          {loadingHist && <p className="text-sm text-center text-muted-foreground py-6">Carregando…</p>}
          {!loadingHist && history.length === 0 && <p className="text-sm text-center text-muted-foreground py-6">Nenhuma manutenção registrada.</p>}
          {history.map(m => (
            <div key={m.id} className={`flex items-start gap-3 rounded-lg border p-3 ${m.status === "concluida" ? "bg-green-50/50" : m.status === "cancelada" ? "bg-gray-50" : "bg-white"}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-[#0E2A47] text-sm">{m.asset_name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${MAINTENANCE_STATUS_COLOR[m.status]}`}>
                    {MAINTENANCE_STATUS_LABELS[m.status as MaintenanceStatus]}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{m.description}</p>
                <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                  <span>{new Date(m.scheduled_at).toLocaleDateString("pt-BR")}</span>
                  {m.cost && <span>{fmtMoney(m.cost)}</span>}
                  {m.provider_name && <span>{m.provider_name}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <Dialog open onOpenChange={() => setShowForm(false)}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Agendar Manutenção</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label className="text-xs">Bem *</Label>
                <Select value={form.asset_id} onValueChange={v => setForm(f => ({...f, asset_id:v}))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione…"/></SelectTrigger>
                  <SelectContent>{assets.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Tipo *</Label>
                  <Select value={form.type} onValueChange={v => setForm(f => ({...f, type:v as MaintenanceType}))}>
                    <SelectTrigger className="mt-1"><SelectValue/></SelectTrigger>
                    <SelectContent>{Object.entries(MAINTENANCE_TYPE_LABELS).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs">Status</Label>
                  <Select value={form.status} onValueChange={v => setForm(f => ({...f, status:v as MaintenanceStatus}))}>
                    <SelectTrigger className="mt-1"><SelectValue/></SelectTrigger>
                    <SelectContent>{Object.entries(MAINTENANCE_STATUS_LABELS).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label className="text-xs">Descrição *</Label>
                <Input value={form.description} onChange={e => setForm(f => ({...f, description:e.target.value}))} className="mt-1"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Data agendada *</Label>
                  <Input type="date" value={form.scheduled_at} onChange={e => setForm(f => ({...f, scheduled_at:e.target.value}))} className="mt-1"/>
                </div>
                <div><Label className="text-xs">Custo (R$)</Label>
                  <Input type="number" step="0.01" value={form.cost} onChange={e => setForm(f => ({...f, cost:e.target.value}))} className="mt-1"/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Fornecedor/Técnico</Label>
                  <Input value={form.provider_name} onChange={e => setForm(f => ({...f, provider_name:e.target.value}))} className="mt-1"/>
                </div>
                <div><Label className="text-xs">Próxima manutenção</Label>
                  <Input type="date" value={form.next_maintenance} onChange={e => setForm(f => ({...f, next_maintenance:e.target.value}))} className="mt-1"/>
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                <Button onClick={handleSave} disabled={busy || !form.asset_id || !form.description}>{busy?"Salvando…":"Salvar"}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
