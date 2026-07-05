"use client";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Pencil, X, Check, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useDistricts, useAreas, useSectors, useCells, useChurches } from "@/hooks/use-queries";
import {
  createDistrict, updateDistrict, deleteDistrict,
  createArea, updateArea, deleteArea,
  createSector, updateSector, deleteSector,
} from "@/services/churches";
import type { District, Area, Sector } from "@/types/domain";

export function MdaStructureAdmin({ churchId }: { churchId?: string } = {}) {
  const qc = useQueryClient();
  const { data: allChurches = [] } = useChurches();
  const { data: allDistricts = [] } = useDistricts();
  const { data: allAreas = [] } = useAreas();
  const { data: allSectors = [] } = useSectors();
  const { data: allCells = [] } = useCells();
  const [err, setErr] = useState("");

  const districts = churchId ? allDistricts.filter((d) => d.church_id === churchId) : allDistricts;
  const districtIds = new Set(districts.map((d) => d.id));
  const areas = churchId ? allAreas.filter((a) => districtIds.has(a.district_id)) : allAreas;
  const areaIds = new Set(areas.map((a) => a.id));
  const sectors = churchId ? allSectors.filter((s) => areaIds.has(s.area_id)) : allSectors;
  const sectorIds = new Set(sectors.map((s) => s.id));
  const cells = churchId ? allCells.filter((c) => c.sector_id && sectorIds.has(c.sector_id)) : allCells;
  const churches = churchId ? allChurches.filter((c) => c.id === churchId) : allChurches;

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["districts"] });
    qc.invalidateQueries({ queryKey: ["areas"] });
    qc.invalidateQueries({ queryKey: ["sectors"] });
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Estrutura MDA</CardTitle>
          <CardDescription>Igreja → Distrito → Área → Setor → Célula. Crie, edite ou remova cada nível.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-4">
            <MdaCount label="Distritos" value={districts.length} />
            <MdaCount label="Áreas" value={areas.length} />
            <MdaCount label="Setores" value={sectors.length} />
            <MdaCount label="Células" value={cells.length} />
          </div>
        </CardContent>
      </Card>

      {err && <p className="text-sm text-destructive">{err}</p>}

      <DistrictsSection
        churches={churches} districts={districts} areas={areas} sectors={sectors} cells={cells}
        fixedChurchId={churchId}
        onError={setErr} onChange={invalidate}
      />
    </div>
  );
}

function MdaCount({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-card p-4 text-center">
      <p className="font-display text-2xl font-semibold text-gold">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}

function DistrictsSection({
  churches, districts, areas, sectors, cells, fixedChurchId, onError, onChange,
}: {
  churches: { id: string; name: string }[]; districts: District[]; areas: Area[]; sectors: Sector[]; cells: { sector_id: string | null }[];
  fixedChurchId?: string; onError: (msg: string) => void; onChange: () => void;
}) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [churchId, setChurchId] = useState(fixedChurchId ?? churches[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  async function handleCreate() {
    if (!name.trim() || !churchId) { onError("Preencha o nome e a igreja do distrito"); return; }
    setBusy(true); onError("");
    try {
      await createDistrict(supabase, { church_id: churchId, name: name.trim() });
      setName(""); setCreating(false); onChange();
    } catch (e) {
      onError((e as { message?: string })?.message ?? "Erro ao criar distrito");
    } finally { setBusy(false); }
  }

  async function handleSaveEdit(id: string) {
    if (!editName.trim()) return;
    try {
      await updateDistrict(supabase, id, { name: editName.trim() });
      setEditingId(null); onChange();
    } catch (e) {
      onError((e as { message?: string })?.message ?? "Erro ao editar distrito");
    }
  }

  async function handleDelete(id: string, name: string) {
    const hasChildren = areas.some((a) => a.district_id === id);
    if (hasChildren) { onError(`"${name}" tem áreas vinculadas — remova as áreas primeiro.`); return; }
    if (!confirm(`Excluir o distrito "${name}"?`)) return;
    try {
      await deleteDistrict(supabase, id);
      onChange();
    } catch (e) {
      onError((e as { message?: string })?.message ?? "Erro ao excluir distrito");
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Distritos</CardTitle>
        <Button size="sm" variant="outline" onClick={() => setCreating((v) => !v)} className="gap-1.5">
          {creating ? <X size={14} /> : <Plus size={14} />} {creating ? "Cancelar" : "Novo distrito"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {creating && (
          <div className="flex flex-col sm:flex-row gap-2 rounded-md border p-3 bg-muted/30">
            {!fixedChurchId && (
              <div className="flex-1">
                <Label>Igreja</Label>
                <select value={churchId} onChange={(e) => setChurchId(e.target.value)}
                  className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                  {churches.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
            <div className="flex-1">
              <Label>Nome do distrito</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Distrito Norte" />
            </div>
            <div className="flex items-end">
              <Button size="sm" onClick={handleCreate} disabled={busy} className="gap-1.5">
                {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Salvar
              </Button>
            </div>
          </div>
        )}

        {districts.length === 0 && <p className="text-sm italic text-muted">Nenhum distrito cadastrado.</p>}

        {districts.map((d) => (
          <div key={d.id} className="rounded-md border p-3">
            <div className="flex items-center justify-between gap-2">
              {editingId === d.id ? (
                <div className="flex flex-1 items-center gap-2">
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8" />
                  <Button size="icon" variant="ghost" onClick={() => handleSaveEdit(d.id)}><Check size={14} /></Button>
                  <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}><X size={14} /></Button>
                </div>
              ) : (
                <>
                  <b className="text-navy">{d.name}</b>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted mr-2">
                      {areas.filter((a) => a.district_id === d.id).length} área(s)
                    </span>
                    <Button size="icon" variant="ghost" onClick={() => { setEditingId(d.id); setEditName(d.name); }}>
                      <Pencil size={14} />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(d.id, d.name)}>
                      <Trash2 size={14} className="text-destructive" />
                    </Button>
