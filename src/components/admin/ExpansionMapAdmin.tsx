"use client";
import { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { Map as MapIcon, Users, Building2, Heart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useExpansionCities, useExpansionStates } from "@/hooks/use-queries";
import type { CityExpansion, StateExpansion } from "@/types/domain";

// ============================================================
// COORDENADAS APROXIMADAS DAS CAPITAIS BRASILEIRAS + CIDADES CEC
// (evita dependência de API de geocoding em runtime)
// ============================================================
const CITY_COORDS: Record<string, [number, number]> = {
  // CEC Manaus + Núcleos AM
  "Manaus|AM":              [-3.119,  -60.021],
  "Itacoatiara|AM":         [-3.143,  -58.444],
  "Sangaua|AM":             [-2.510,  -57.752],  // aprox.
  "Piorini|AM":             [-3.860,  -61.300],  // aprox.
  "Tefé|AM":                [-3.354,  -64.711],
  "Iranduba|AM":            [-3.275,  -60.186],
  // CEC Brasília + Núcleos DF
  "Brasília|DF":            [-15.793, -47.882],
  "Águas Claras|DF":        [-15.835, -48.029],
  "Taguatinga|DF":          [-15.840, -48.054],
  "Brazlândia|DF":          [-15.683, -48.205],
  // Outros estados
  "Cascavel|PR":            [-24.957, -53.459],
  "Joinville|SC":           [-26.304, -48.846],
  // Capitais úteis pra fallback
  "São Paulo|SP":           [-23.550, -46.633],
  "Rio de Janeiro|RJ":      [-22.907, -43.173],
  "Belo Horizonte|MG":      [-19.916, -43.934],
  "Salvador|BA":            [-12.971, -38.501],
  "Fortaleza|CE":           [-3.731,  -38.526],
  "Recife|PE":              [-8.047,  -34.876],
  "Porto Alegre|RS":        [-30.034, -51.217],
  "Curitiba|PR":            [-25.428, -49.273],
  "Belém|PA":               [-1.456,  -48.502],
  "Goiânia|GO":             [-16.679, -49.255],
};

// Coordenadas centrais por estado (fallback se cidade não tem coord)
const STATE_COORDS: Record<string, [number, number]> = {
  AM: [-4.0, -63.0], DF: [-15.78, -47.93], PR: [-25.0, -51.5], SC: [-27.5, -50.0],
  SP: [-23.5, -46.6], RJ: [-22.9, -43.2], MG: [-19.9, -43.9], BA: [-12.9, -38.5],
  CE: [-3.7, -38.5], PE: [-8.0, -34.9], RS: [-30.0, -51.2], PA: [-1.5, -48.5],
  GO: [-16.7, -49.3], MA: [-2.5, -44.3], MT: [-12.6, -55.4], MS: [-20.5, -54.6],
  TO: [-10.2, -48.3], PI: [-7.7, -42.7], AL: [-9.7, -35.7], SE: [-10.9, -37.1],
  RN: [-5.8, -35.2], PB: [-7.1, -34.8], ES: [-19.2, -40.3], AP: [0.0, -51.1],
  RR: [2.8, -60.7], AC: [-9.0, -70.0], RO: [-9.0, -63.0],
};

function getCoord(city: string, state: string): [number, number] | null {
  const key = `${city}|${state}`;
  if (CITY_COORDS[key]) return CITY_COORDS[key];
  if (STATE_COORDS[state]) return STATE_COORDS[state];
  return null;
}

// ============================================================
// COMPONENTE PRINCIPAL — só renderiza mapa no cliente
// ============================================================
const LeafletMap = dynamic(() => import("./ExpansionMapLeaflet"), { ssr: false });

export function ExpansionMapAdmin() {
  const { data: cities = [] } = useExpansionCities();
  const { data: states = [] } = useExpansionStates();

  // Filtra apenas cidades com coordenadas conhecidas
  const cityMarkers = useMemo(() =>
    cities.map(c => ({ ...c, coords: getCoord(c.city, c.state) })).filter(c => c.coords !== null),
    [cities]
  );

  const totalCities = cities.length;
  const withCoords = cityMarkers.length;
  const totalMembers = cities.reduce((sum, c) => sum + c.members_count, 0);
  const totalLgs = cities.reduce((sum, c) => sum + c.lgs_count, 0);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><MapIcon className="h-5 w-5 text-gold" />Mapa de Expansão</CardTitle>
          <CardDescription>
            Cidades alcançadas pela rede CEC. Tamanho do marcador é proporcional ao número de membros ativos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-4">
            <Stat icon={<Building2 />} label="Cidades" value={totalCities} sub={`${withCoords} no mapa`} />
            <Stat icon={<MapIcon />} label="Estados" value={states.length} />
            <Stat icon={<Heart />} label="Life Groups" value={totalLgs} />
            <Stat icon={<Users />} label="Membros ativos" value={totalMembers.toLocaleString("pt-BR")} />
          </div>
          {totalCities > withCoords && (
            <p className="rounded-md border-l-4 border-l-yellow-500 bg-yellow-50 p-2 text-[11px] text-yellow-800">
              ⚠️ {totalCities - withCoords} cidade(s) sem coordenadas conhecidas. Marcadores aparecem no centro do estado.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <LeafletMap markers={cityMarkers as { city: string; state: string; coords: [number, number]; churches_count: number; lgs_count: number; members_count: number; church_names: string[] }[]} />
        </CardContent>
      </Card>

      {/* Resumo por estado */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resumo por estado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {states.sort((a, b) => b.members_count - a.members_count).map(s => (
              <div key={s.state} className="rounded-md border bg-card p-3">
                <div className="flex items-center justify-between">
                  <b className="text-navy">{s.state}</b>
                  <span className="text-[10px] uppercase tracking-wider text-muted">{s.cities_count} cidade(s)</span>
                </div>
                <div className="mt-2 flex gap-3 text-xs text-muted">
                  <span>🏢 {s.churches_count}</span>
                  <span>❤️ {s.lgs_count} LGs</span>
                  <span>👥 {s.members_count} membros</span>
                </div>
              </div>
            ))}
            {states.length === 0 && (
              <p className="col-span-full text-sm italic text-muted">Sem dados de expansão ainda.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: number | string; sub?: string }) {
  return (
    <div className="rounded-md border bg-card p-3">
      <div className="flex items-center gap-2 text-navy-600">
        <span className="text-gold [&>svg]:h-4 [&>svg]:w-4">{icon}</span>
        <p className="text-[10px] uppercase tracking-wider">{label}</p>
      </div>
      <p className="mt-1 text-2xl font-bold text-navy">{value}</p>
      {sub && <p className="text-[10px] text-muted">{sub}</p>}
    </div>
  );
}
