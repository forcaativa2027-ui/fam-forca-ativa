"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useDistricts, useAreas, useSectors, useCells } from "@/hooks/use-queries";

/**
 * Extraídos de AdminPanel.tsx (eram funções internas `MdaStructure` e
 * `MdaCount`) para reutilização em /organizacional. Nenhuma mudança de
 * comportamento.
 */
export function MdaStructure({ churchId }: { churchId?: string } = {}) {
  const { data: allDistricts = [] } = useDistricts();
  const { data: allAreas = [] } = useAreas();
  const { data: allSectors = [] } = useSectors();
  const { data: allCells = [] } = useCells();

  const districts = churchId ? allDistricts.filter((d) => d.church_id === churchId) : allDistricts;
  const districtIds = new Set(districts.map((d) => d.id));
  const areas = churchId ? allAreas.filter((a) => districtIds.has(a.district_id)) : allAreas;
  const areaIds = new Set(areas.map((a) => a.id));
  const sectors = churchId ? allSectors.filter((s) => areaIds.has(s.area_id)) : allSectors;
  const sectorIds = new Set(sectors.map((s) => s.id));
  const cells = churchId ? allCells.filter((c) => c.sector_id && sectorIds.has(c.sector_id)) : allCells;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Estrutura MDA (mínimo 3 por nível)</CardTitle>
          <CardDescription>Igreja → Distrito → Área → Setor → Célula. Multiplicação registrada via "mãe".</CardDescription>
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
      <Card>
        <CardHeader><CardTitle>Hierarquia</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {districts.length === 0 && <p className="text-sm italic text-muted">Nenhum distrito cadastrado.</p>}
          {districts.map((d) => {
            const dAreas = areas.filter((a) => a.district_id === d.id);
            return (
              <div key={d.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <b className="text-navy">{d.name}</b>
                  <span className="text-xs text-muted">{dAreas.length} área(s)</span>
                </div>
                <ul className="mt-2 space-y-1 pl-4 text-sm text-muted">
                  {dAreas.map((a) => {
                    const aSectors = sectors.filter((s) => s.area_id === a.id);
                    return (
                      <li key={a.id}>
                        <b className="text-navy-600">{a.name}</b> — {aSectors.length} setor(es)
                        <ul className="ml-4 mt-1 list-disc text-xs">
                          {aSectors.map((s) => {
                            const sCells = cells.filter((c) => c.sector_id === s.id);
                            return <li key={s.id}>{s.name}: {sCells.length} célula(s)</li>;
                          })}
                        </ul>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

export function MdaCount({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-card p-4 text-center">
      <p className="font-display text-2xl font-semibold text-gold">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
