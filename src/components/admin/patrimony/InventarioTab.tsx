"use client";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAssets, useChurches, useInventoryCampaigns, useLastInventory } from "@/hooks/use-queries";
import { supabase } from "@/lib/supabase/client";
import * as PA from "@/services/patrimonyAdvanced";
import type { InventoryStatus } from "@/types/domain";
import { INVENTORY_STATUS_LABELS } from "./PatrimonyTypes";

export function InventarioTab({ churchFilter }: { churchFilter: string }) {
  const qc = useQueryClient();
  const { data: campaigns = [], isLoading: loadingCamp } = useInventoryCampaigns(churchFilter || undefined);
  const { data: lastInv   = [], isLoading: loadingInv  } = useLastInventory(churchFilter || undefined);
  const { data: assets    = [] } = useAssets({ churchId: churchFilter || undefined });
  const { data: churches  = [] } = useChurches();
  const [tab3, setTab3] = useState<"campaigns"|"items">("campaigns");
  const [showForm, setShowForm] = useState(false);
  const [campaign, setCampaign] = useState("");
  const [churchId, setChurchId] = useState(churchFilter || "");
  const [invDate, setInvDate] = useState(new Date().toISOString().slice(0,10));
  const [assetId, setAssetId] = useState("");
  const [status, setStatus] = useState<InventoryStatus>("encontrado");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSave() {
    if (!campaign || !assetId || !churchId) return;
    setBusy(true);
    try {
      await PA.registerInventoryItem(supabase, { campaign_name: campaign, church_id: churchId, inventory_date: invDate, asset_id: assetId, status, notes: notes || null });
      qc.invalidateQueries({ queryKey: ["inventory-campaigns"] });
      qc.invalidateQueries({ queryKey: ["last-inventory"] });
      setAssetId(""); setNotes("");
    } finally { setBusy(false); }
  }

  const naoEncontrados = lastInv.filter(i => i.last_status === "nao_encontrado").length;

  return (
    <div className="space-y-4">
      {naoEncontrados > 0 && (
        <div className="flex items-center gap-3 rounded-lg bg-red-50 border border-red-200 p-3">
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0"/>
          <p className="text-sm text-red-800"><strong>{naoEncontrados} bem(ns) não encontrado(s)</strong> no último inventário.</p>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button size="sm" variant={tab3==="campaigns"?"default":"outline"} onClick={() => setTab3("campaigns")}>Campanhas</Button>
          <Button size="sm" variant={tab3==="items"?"default":"outline"} onClick={() => setTab3("items")}>Último Status</Button>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-1"/>Registrar Item</Button>
      </div>

      {tab3 === "campaigns" && (
        <div className="space-y-2">
          {loadingCamp && <p className="text-sm text-center text-muted-foreground py-6">Carregando…</p>}
          {!loadingCamp && campaigns.length === 0 && <p className="text-sm text-center text-muted-foreground py-6">Nenhuma campanha de inventário.</p>}
          {campaigns.map((c, i) => (
            <Card key={i}>
              <CardContent className="pt-3 pb-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[#0E2A47]">{c.campaign_name}</p>
                    <p className="text-xs text-muted-foreground">{new Date(c.inventory_date).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <div className="flex gap-4 text-xs text-center">
                    <div><p className="font-bold text-green-600">{c.encontrados}</p><p className="text-muted-foreground">Encontrados</p></div>
                    <div><p className="font-bold text-red-600">{c.nao_encontrados}</p><p className="text-muted-foreground">Não enc.</p></div>
                    <div><p className="font-bold text-yellow-600">{c.divergentes}</p><p className="text-muted-foreground">Divergentes</p></div>
                    <div><p className="font-bold text-[#0E2A47]">{c.pct_encontrados}%</p><p className="text-muted-foreground">Conformidade</p></div>
                  </div>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-gray-100">
                  <div className="h-1.5 rounded-full bg-green-500" style={{ width: `${c.pct_encontrados}%` }}/>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {tab3 === "items" && (
        <div className="space-y-2">
          {loadingInv && <p className="text-sm text-center text-muted-foreground py-6">Carregando…</p>}
          {!loadingInv && lastInv.length === 0 && <p className="text-sm text-center text-muted-foreground py-6">Nenhum inventário registrado.</p>}
          {lastInv.map(item => (
            <div key={item.asset_id} className={`flex items-center gap-3 rounded-lg border p-3 ${item.last_status==="encontrado"?"bg-green-50/50":item.last_status==="nao_encontrado"?"bg-red-50":"bg-yellow-50/50"}`}>
              <div className="flex-1">
                <p className="font-medium text-[#0E2A47] text-sm">{item.asset_name}</p>
                <p className="text-xs text-muted-foreground">{item.category} · {new Date(item.inventory_date).toLocaleDateString("pt-BR")}</p>
              </div>
              <span className="text-xs font-medium">{INVENTORY_STATUS_LABELS[item.last_status as InventoryStatus]}</span>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <Dialog open onOpenChange={() => setShowForm(false)}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Registrar Item de Inventário</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label className="text-xs">Nome da campanha *</Label>
                <Input value={campaign} onChange={e => setCampaign(e.target.value)} placeholder="Ex: Inventário 2025 - Sede AM" className="mt-1"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Comunidade *</Label>
                  <Select value={churchId} onValueChange={setChurchId}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione…"/></SelectTrigger>
                    <SelectContent>{churches.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs">Data</Label>
                  <Input type="date" value={invDate} onChange={e => setInvDate(e.target.value)} className="mt-1"/>
                </div>
              </div>
              <div><Label className="text-xs">Bem *</Label>
                <Select value={assetId} onValueChange={setAssetId}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione…"/></SelectTrigger>
                  <SelectContent>{assets.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Status *</Label>
                <Select value={status} onValueChange={v => setStatus(v as InventoryStatus)}>
                  <SelectTrigger className="mt-1"><SelectValue/></SelectTrigger>
                  <SelectContent>{Object.entries(INVENTORY_STATUS_LABELS).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Observações</Label>
                <Input value={notes} onChange={e => setNotes(e.target.value)} className="mt-1"/>
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                <Button onClick={handleSave} disabled={busy || !campaign || !assetId || !churchId}>{busy?"Salvando…":"Registrar"}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
