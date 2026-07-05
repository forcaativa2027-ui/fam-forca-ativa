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
                  </div>
                </>
              )}
            </div>

            <AreasSubsection
              districtId={d.id}
              areas={areas.filter((a) => a.district_id === d.id)}
              sectors={sectors} cells={cells}
              onError={onError} onChange={onChange}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function AreasSubsection({
  districtId, areas, sectors, cells, onError, onChange,
}: {
  districtId: string; areas: Area[]; sectors: Sector[]; cells: { sector_id: string | null }[];
  onError: (msg: string) => void; onChange: () => void;
}) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  async function handleCreate() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await createArea(supabase, { district_id: districtId, name: name.trim() });
      setName(""); setCreating(false); onChange();
    } catch (e) {
      onError((e as { message?: string })?.message ?? "Erro ao criar área");
    } finally { setBusy(false); }
  }
  async function handleSaveEdit(id: string) {
    if (!editName.trim()) return;
    try {
      await updateArea(supabase, id, { name: editName.trim() });
      setEditingId(null); onChange();
    } catch (e) {
      onError((e as { message?: string })?.message ?? "Erro ao editar área");
    }
  }
  async function handleDelete(id: string, name: string) {
    const hasChildren = sectors.some((s) => s.area_id === id);
    if (hasChildren) { onError(`"${name}" tem setores vinculados — remova os setores primeiro.`); return; }
    if (!confirm(`Excluir a área "${name}"?`)) return;
    try {
      await deleteArea(supabase, id);
      onChange();
    } catch (e) {
      onError((e as { message?: string })?.message ?? "Erro ao excluir área");
    }
  }

  return (
    <ul className="mt-2 space-y-2 pl-4 border-l">
      {areas.map((a) => (
        <li key={a.id} className="text-sm">
          <div className="flex items-center justify-between gap-2">
            {editingId === a.id ? (
              <div className="flex flex-1 items-center gap-2">
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-7 text-xs" />
                <Button size="icon" variant="ghost" onClick={() => handleSaveEdit(a.id)}><Check size={12} /></Button>
                <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}><X size={12} /></Button>
              </div>
            ) : (
              <>
                <b className="text-navy-600">{a.name}</b>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted mr-1">
                    {sectors.filter((s) => s.area_id === a.id).length} setor(es)
                  </span>
                  <Button size="icon" variant="ghost" onClick={() => { setEditingId(a.id); setEditName(a.name); }}>
                    <Pencil size={12} />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(a.id, a.name)}>
                    <Trash2 size={12} className="text-destructive" />
                  </Button>
                </div>
              </>
            )}
          </div>

          <SectorsSubsection
            areaId={a.id}
            sectors={sectors.filter((s) => s.area_id === a.id)}
            cells={cells}
            onError={onError} onChange={onChange}
          />
        </li>
      ))}

      {creating ? (
        <li className="flex items-center gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da área" className="h-7 text-xs" />
          <Button size="icon" variant="ghost" onClick={handleCreate} disabled={busy}>
            {busy ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
          </Button>
          <Button size="icon" variant="ghost" onClick={() => setCreating(false)}><X size={12} /></Button>
        </li>
      ) : (
        <li>
          <button onClick={() => setCreating(true)} className="flex items-center gap-1 text-xs text-gold hover:underline">
            <Plus size={12} /> Nova área
          </button>
        </li>
      )}
    </ul>
  );
}

function SectorsSubsection({
  areaId, sectors, cells, onError, onChange,
}: {
  areaId: string; sectors: Sector[]; cells: { sector_id: string | null }[];
  onError: (msg: string) => void; onChange: () => void;
}) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  async function handleCreate() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await createSector(supabase, { area_id: areaId, name: name.trim() });
      setName(""); setCreating(false); onChange();
    } catch (e) {
      onError((e as { message?: string })?.message ?? "Erro ao criar setor");
    } finally { setBusy(false); }
  }
  async function handleSaveEdit(id: string) {
    if (!editName.trim()) return;
    try {
      await updateSector(supabase, id, { name: editName.trim() });
      setEditingId(null); onChange();
    } catch (e) {
      onError((e as { message?: string })?.message ?? "Erro ao editar setor");
    }
  }
  async function handleDelete(id: string, name: string) {
    const hasChildren = cells.some((c) => c.sector_id === id);
    if (hasChildren) { onError(`"${name}" tem células vinculadas — mova ou remova as células primeiro.`); return; }
    if (!confirm(`Excluir o setor "${name}"?`)) return;
    try {
      await deleteSector(supabase, id);
      onChange();
    } catch (e) {
      onError((e as { message?: string })?.message ?? "Erro ao excluir setor");
    }
  }

  return (
    <ul className="ml-4 mt-1 space-y-1 border-l pl-3 text-xs">
      {sectors.map((s) => (
        <li key={s.id} className="flex items-center justify-between gap-2">
          {editingId === s.id ? (
            <div className="flex flex-1 items-center gap-2">
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-6 text-xs" />
              <Button size="icon" variant="ghost" onClick={() => handleSaveEdit(s.id)}><Check size={11} /></Button>
              <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}><X size={11} /></Button>
            </div>
          ) : (
            <>
              <span>{s.name} — {cells.filter((c) => c.sector_id === s.id).length} célula(s)</span>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" onClick={() => { setEditingId(s.id); setEditName(s.name); }}>
                  <Pencil size={11} />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => handleDelete(s.id, s.name)}>
                  <Trash2 size={11} className="text-destructive" />
                </Button>
              </div>
            </>
          )}
        </li>
      ))}

      {creating ? (
        <li className="flex items-center gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do setor" className="h-6 text-xs" />
          <Button size="icon" variant="ghost" onClick={handleCreate} disabled={busy}>
            {busy ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
          </Button>
          <Button size="icon" variant="ghost" onClick={() => setCreating(false)}><X size={11} /></Button>
        </li>
      ) : (
        <li>
          <button onClick={() => setCreating(true)} className="flex items-center gap-1 text-gold hover:underline">
            <Plus size={11} /> Novo setor
          </button>
        </li>
      )}
    </ul>
  );
}
