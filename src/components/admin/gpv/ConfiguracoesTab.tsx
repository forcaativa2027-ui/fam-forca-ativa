"use client";
import { useState, useCallback, useEffect } from "react";
import { Plus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase/client";
import type { GpvTipoVinculo, GpvFormaRemuneracao, CategoriaVinculo } from "./GpvTypes";
import { CATEGORIA_LABELS } from "./GpvTypes";

export function ConfiguracoesTab({ churches }: { churches: { id: string; name: string }[] }) {
  const [tipos, setTipos] = useState<GpvTipoVinculo[]>([]);
  const [formas, setFormas] = useState<GpvFormaRemuneracao[]>([]);
  const [novoTipo, setNovoTipo] = useState({ nome: "", categoria: "outro" as CategoriaVinculo, church_id: "" });
  const [novaForma, setNovaForma] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [tRes, fRes] = await Promise.all([
      supabase.from("gpv_tipos_vinculo").select("*").eq("is_active", true).order("nome"),
      supabase.from("gpv_formas_remuneracao").select("*").eq("is_active", true).order("nome"),
    ]);
    setTipos((tRes.data as GpvTipoVinculo[]) ?? []);
    setFormas((fRes.data as GpvFormaRemuneracao[]) ?? []);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function addTipo() {
    if (!novoTipo.nome.trim()) return;
    setBusy(true);
    await supabase.from("gpv_tipos_vinculo").insert({
      nome: novoTipo.nome.trim(), categoria: novoTipo.categoria,
      church_id: novoTipo.church_id || null,
    });
    setNovoTipo({ nome: "", categoria: "outro", church_id: "" });
    setBusy(false); load();
  }

  async function addForma() {
    if (!novaForma.trim()) return;
    setBusy(true);
    await supabase.from("gpv_formas_remuneracao").insert({ nome: novaForma.trim() });
    setNovaForma(""); setBusy(false); load();
  }

  async function desativarTipo(id: string) {
    if (!confirm("Desativar este tipo de vínculo?")) return;
    await supabase.from("gpv_tipos_vinculo").update({ is_active: false }).eq("id", id);
    load();
  }

  async function desativarForma(id: string) {
    if (!confirm("Desativar esta forma de remuneração?")) return;
    await supabase.from("gpv_formas_remuneracao").update({ is_active: false }).eq("id", id);
    load();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Tipos de vínculo */}
      <div className="space-y-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tipos de Vínculo</CardTitle>
            <CardDescription>Parametrize os tipos disponíveis no sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Input value={novoTipo.nome} onChange={(e) => setNovoTipo((p) => ({ ...p, nome: e.target.value }))}
                placeholder="Nome do tipo (ex: Auxiliar de ministério)" />
              <div className="grid gap-2 sm:grid-cols-2">
                <select value={novoTipo.categoria}
                  onChange={(e) => setNovoTipo((p) => ({ ...p, categoria: e.target.value as CategoriaVinculo }))}
                  className="h-9 rounded-md border bg-background px-2 text-sm">
                  {Object.entries(CATEGORIA_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <select value={novoTipo.church_id}
                  onChange={(e) => setNovoTipo((p) => ({ ...p, church_id: e.target.value }))}
                  className="h-9 rounded-md border bg-background px-2 text-sm">
                  <option value="">Global (todas)</option>
                  {churches.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <Button onClick={addTipo} disabled={busy || !novoTipo.nome.trim()} size="sm" className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Adicionar tipo
              </Button>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-1">
              {tipos.map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-md border bg-card px-3 py-2">
                  <div>
                    <span className="text-sm font-medium text-navy">{t.nome}</span>
                    <span className="ml-2 rounded-full bg-gold/10 px-1.5 py-0.5 text-[10px] font-bold text-gold">
                      {CATEGORIA_LABELS[t.categoria]}
                    </span>
                    {!t.church_id && <span className="ml-1 text-[10px] text-muted">global</span>}
                  </div>
                  <Button onClick={() => desativarTipo(t.id)} variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted hover:text-destructive">
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Formas de remuneração */}
      <div className="space-y-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Formas de Remuneração</CardTitle>
            <CardDescription>Tipos de pagamento disponíveis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input value={novaForma} onChange={(e) => setNovaForma(e.target.value)}
                placeholder="Nova forma (ex: Ajuda missionária extra)" />
              <Button onClick={addForma} disabled={busy || !novaForma.trim()} size="sm" className="gap-1 shrink-0">
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {formas.map((f) => (
                <div key={f.id} className="flex items-center justify-between rounded-md border bg-card px-3 py-2">
                  <span className="text-sm text-navy">{f.nome}</span>
                  <Button onClick={() => desativarForma(f.id)} variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted hover:text-destructive">
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
