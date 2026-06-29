"use client";
import { useState, useMemo, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  Map as MapIcon, Users, Building2, Heart, X, Flame, DollarSign,
  BarChart3, Calendar, FileText, AlertTriangle, ChevronRight,
  TrendingUp, Package, Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useExpansionCities, useExpansionStates } from "@/hooks/use-queries";
import { supabase } from "@/lib/supabase/client";

// ─── Tipos ────────────────────────────────────────────────────
interface MarkerData {
  city: string; state: string; coords: [number, number];
  churches_count: number; lgs_count: number; members_count: number;
  church_names: string[]; church_ids: string[];
}
interface ChurchDetail {
  id: string; name: string; type: string; city?: string; state?: string;
  status_admin?: string; created_at?: string; pastor_name?: string;
}
interface LgSummary {
  id: string; name: string; status_lg?: string; members_count?: number;
}
interface FinanceSummary {
  total_entrada: number; total_saida: number; saldo: number;
}
interface PatrimonyInfo {
  properties_count: number; assets_count: number; total_value: number;
}
interface ReportStatus {
  total_lgs: number; lgs_with_weekly: number; lgs_with_monthly: number;
}

// ─── Coordenadas ──────────────────────────────────────────────
const CITY_COORDS: Record<string, [number, number]> = {
  "Manaus|AM": [-3.119, -60.021], "Itacoatiara|AM": [-3.143, -58.444],
  "Tefé|AM": [-3.354, -64.711], "Iranduba|AM": [-3.275, -60.186],
  "Brasília|DF": [-15.793, -47.882], "Águas Claras|DF": [-15.835, -48.029],
  "Taguatinga|DF": [-15.840, -48.054], "Brazlândia|DF": [-15.683, -48.205],
  "Cascavel|PR": [-24.957, -53.459], "Joinville|SC": [-26.304, -48.846],
  "São Paulo|SP": [-23.550, -46.633], "Rio de Janeiro|RJ": [-22.907, -43.173],
  "Belo Horizonte|MG": [-19.916, -43.934], "Salvador|BA": [-12.971, -38.501],
  "Fortaleza|CE": [-3.731, -38.526], "Recife|PE": [-8.047, -34.876],
  "Porto Alegre|RS": [-30.034, -51.217], "Curitiba|PR": [-25.428, -49.273],
  "Belém|PA": [-1.456, -48.502], "Goiânia|GO": [-16.679, -49.255],
};
const STATE_COORDS: Record<string, [number, number]> = {
  AM: [-4.0, -63.0], DF: [-15.78, -47.93], PR: [-25.0, -51.5], SC: [-27.5, -50.0],
  SP: [-23.5, -46.6], RJ: [-22.9, -43.2], MG: [-19.9, -43.9], BA: [-12.9, -38.5],
  CE: [-3.7, -38.5], PE: [-8.0, -34.9], RS: [-30.0, -51.2], PA: [-1.5, -48.5],
  GO: [-16.7, -49.3],
};
function getCoord(city: string, state: string): [number, number] | null {
  return CITY_COORDS[`${city}|${state}`] ?? STATE_COORDS[state] ?? null;
}

// ─── Leaflet dinâmico ─────────────────────────────────────────
const LeafletMapInteractive = dynamic(
  () => import("./ExpansionMapLeafletInteractive"),
  { ssr: false, loading: () => <div className="h-[500px] w-full rounded-md border bg-gray-50 grid place-items-center text-sm text-muted">Carregando mapa…</div> }
);

// ─── Painel lateral da localidade ─────────────────────────────
function LocationPanel({ marker, onClose }: { marker: MarkerData; onClose: () => void }) {
  const [churches,  setChurches]  = useState<ChurchDetail[]>([]);
  const [lgs,       setLgs]       = useState<LgSummary[]>([]);
  const [finance,   setFinance]   = useState<FinanceSummary | null>(null);
  const [patrimony, setPatrimony] = useState<PatrimonyInfo | null>(null);
  const [reports,   setReports]   = useState<ReportStatus | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [activeSection, setActiveSection] = useState<string>("overview");

  const load = useCallback(async () => {
    setLoading(true);
    const churchIds = marker.church_ids ?? [];
    if (churchIds.length === 0) { setLoading(false); return; }

    await Promise.all([
      // Comunidades detalhadas
      supabase.from("churches").select("id, name, type, city, state, status_admin, created_at")
        .in("id", churchIds)
        .then(({ data }) => setChurches((data as ChurchDetail[]) ?? [])),

      // Life Groups
      supabase.from("life_groups").select("id, name, status_lg")
        .in("church_id", churchIds).eq("is_active", true).order("name")
        .then(({ data }) => setLgs((data as LgSummary[]) ?? [])),

      // Financeiro — últimos 12 meses
      supabase.from("finances").select("direction, amount")
        .in("church_id", churchIds)
        .then(({ data }) => {
          const rows = data ?? [];
          const entrada = rows.filter((r: { direction: string }) => r.direction === "entrada").reduce((s: number, r: { amount: number }) => s + Number(r.amount), 0);
          const saida   = rows.filter((r: { direction: string }) => r.direction === "saida").reduce((s: number, r: { amount: number }) => s + Number(r.amount), 0);
          setFinance({ total_entrada: entrada, total_saida: saida, saldo: entrada - saida });
        }),

      // Patrimônio
      supabase.from("assets").select("id, acquisition_value").in("church_id", churchIds).eq("is_active", true)
        .then(async ({ data: assets }) => {
          const { data: props } = await supabase.from("properties").select("id").in("church_id", churchIds).eq("is_active", true);
          const totalValue = (assets ?? []).reduce((s: number, a: { acquisition_value: number }) => s + Number(a.acquisition_value ?? 0), 0);
          setPatrimony({ properties_count: (props ?? []).length, assets_count: (assets ?? []).length, total_value: totalValue });
        }),
    ]);

    setLoading(false);
  }, [marker]);

  useEffect(() => { load(); }, [load]);

  // Status de relatórios
  useEffect(() => {
    if (lgs.length === 0) return;
    const lgIds = lgs.map(lg => lg.id);
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    Promise.all([
      supabase.from("meeting_reports").select("life_group_id").in("life_group_id", lgIds),
      supabase.from("monthly_reports").select("life_group_id").in("life_group_id", lgIds).eq("year", year).eq("month", month),
    ]).then(([weekly, monthly]) => {
      const withWeekly  = new Set((weekly.data ?? []).map((r: { life_group_id: string }) => r.life_group_id)).size;
      const withMonthly = new Set((monthly.data ?? []).map((r: { life_group_id: string }) => r.life_group_id)).size;
      setReports({ total_lgs: lgIds.length, lgs_with_weekly: withWeekly, lgs_with_monthly: withMonthly });
    });
  }, [lgs]);

  const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
  const pct = (n: number, total: number) => total > 0 ? Math.round((n / total) * 100) : 0;

  const SECTIONS = [
    { id: "overview",   label: "Visão Geral",   icon: <MapIcon size={14} /> },
    { id: "lgs",        label: "Life Groups",   icon: <Flame size={14} /> },
    { id: "financial",  label: "Financeiro",    icon: <DollarSign size={14} /> },
    { id: "patrimony",  label: "Patrimônio",    icon: <Package size={14} /> },
    { id: "reports",    label: "Relatórios",    icon: <FileText size={14} /> },
  ];

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-navy px-4 py-4 text-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold">{marker.city}, {marker.state}</h2>
            <p className="text-xs text-white/60 mt-0.5">
              {marker.churches_count} comunidade{marker.churches_count !== 1 ? "s" : ""} · {marker.lgs_count} LG{marker.lgs_count !== 1 ? "s" : ""} · {marker.members_count} membros
            </p>
          </div>
          <Button onClick={onClose} variant="ghost" size="sm" className="text-white hover:bg-white/10 shrink-0">
            <X size={16} />
          </Button>
        </div>

        {/* KPIs rápidos */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-md bg-white/10 p-2 text-center">
            <p className="text-lg font-bold text-gold">{marker.churches_count}</p>
            <p className="text-[10px] text-white/60">Comunidades</p>
          </div>
          <div className="rounded-md bg-white/10 p-2 text-center">
            <p className="text-lg font-bold text-gold">{marker.lgs_count}</p>
            <p className="text-[10px] text-white/60">Life Groups</p>
          </div>
          <div className="rounded-md bg-white/10 p-2 text-center">
            <p className="text-lg font-bold text-gold">{marker.members_count}</p>
            <p className="text-[10px] text-white/60">Membros</p>
          </div>
        </div>

        {/* Navegação por seções */}
        <div className="mt-3 flex gap-1 overflow-x-auto pb-1 scrollbar-none">
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setActiveSection(s.id)}
              className={[
                "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                activeSection === s.id ? "bg-gold text-navy" : "bg-white/10 text-white/70 hover:bg-white/20",
              ].join(" ")}>
              {s.icon}{s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading && <p className="text-sm text-muted italic text-center py-8">Carregando dados…</p>}

        {!loading && (
          <>
            {/* VISÃO GERAL */}
            {activeSection === "overview" && (
              <div className="space-y-3">
                <h3 className="font-semibold text-navy text-sm">Comunidades</h3>
                {churches.map(c => (
                  <div key={c.id} className="rounded-md border bg-card p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-navy text-sm">{c.name}</p>
                        <p className="text-[11px] text-muted mt-0.5">
                          {c.type === "sede" ? "Sede" : c.type === "nucleo" ? "Núcleo" : "Igreja Local"}
                          {c.status_admin && ` · ${c.status_admin}`}
                        </p>
                        {c.created_at && (
                          <p className="text-[10px] text-muted mt-0.5">
                            Desde {new Date(c.created_at).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}
                          </p>
                        )}
                      </div>
                      <span className={[
                        "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase border",
                        c.type === "sede" ? "bg-gold/10 text-gold border-gold/30" :
                        c.type === "nucleo" ? "bg-blue-50 text-blue-700 border-blue-200" :
                        "bg-green-50 text-green-700 border-green-200",
                      ].join(" ")}>
                        {c.type === "sede" ? "Sede" : c.type === "nucleo" ? "Núcleo" : "Igreja"}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Indicadores operacionais rápidos */}
                {reports && (
                  <div className="rounded-md border bg-card p-3 space-y-2">
                    <p className="text-xs font-bold uppercase text-muted">Indicadores Operacionais</p>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted">Relatórios semanais</span>
                        <span className={`font-bold ${pct(reports.lgs_with_weekly, reports.total_lgs) >= 80 ? "text-green-600" : "text-yellow-600"}`}>
                          {reports.lgs_with_weekly}/{reports.total_lgs} LGs ({pct(reports.lgs_with_weekly, reports.total_lgs)}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-gray-100">
                        <div className="h-1.5 rounded-full bg-green-500 transition-all"
                          style={{ width: `${pct(reports.lgs_with_weekly, reports.total_lgs)}%` }} />
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted">Relatórios mensais (mês atual)</span>
                        <span className={`font-bold ${pct(reports.lgs_with_monthly, reports.total_lgs) >= 80 ? "text-green-600" : "text-yellow-600"}`}>
                          {reports.lgs_with_monthly}/{reports.total_lgs} LGs ({pct(reports.lgs_with_monthly, reports.total_lgs)}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-gray-100">
                        <div className="h-1.5 rounded-full bg-blue-500 transition-all"
                          style={{ width: `${pct(reports.lgs_with_monthly, reports.total_lgs)}%` }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* LIFE GROUPS */}
            {activeSection === "lgs" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-navy text-sm">{lgs.length} Life Group{lgs.length !== 1 ? "s" : ""}</h3>
                </div>
                {lgs.length === 0 && <p className="text-sm italic text-muted">Nenhum Life Group ativo.</p>}
                {lgs.map(lg => (
                  <div key={lg.id} className="flex items-center gap-3 rounded-md border bg-card p-2.5">
                    <Flame className="h-4 w-4 shrink-0 text-orange-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-navy truncate">{lg.name}</p>
                    </div>
                    {lg.status_lg && (
                      <span className={[
                        "rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0",
                        lg.status_lg === "muito_saudavel" ? "bg-green-100 text-green-700" :
                        lg.status_lg === "saudavel" ? "bg-green-50 text-green-600" :
                        lg.status_lg === "atencao" ? "bg-yellow-100 text-yellow-700" :
                        "bg-red-100 text-red-700",
                      ].join(" ")}>
                        {lg.status_lg.replace(/_/g, " ")}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* FINANCEIRO */}
            {activeSection === "financial" && (
              <div className="space-y-3">
                <h3 className="font-semibold text-navy text-sm">Financeiro — Acumulado</h3>
                {finance ? (
                  <>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-md border-l-4 border-l-green-500 bg-card p-3">
                        <p className="text-[10px] text-muted uppercase">Entradas</p>
                        <p className="font-bold text-green-700 text-sm mt-1">{fmt(finance.total_entrada)}</p>
                      </div>
                      <div className="rounded-md border-l-4 border-l-red-400 bg-card p-3">
                        <p className="text-[10px] text-muted uppercase">Saídas</p>
                        <p className="font-bold text-red-600 text-sm mt-1">{fmt(finance.total_saida)}</p>
                      </div>
                      <div className={`rounded-md border-l-4 ${finance.saldo >= 0 ? "border-l-blue-500" : "border-l-orange-500"} bg-card p-3`}>
                        <p className="text-[10px] text-muted uppercase">Saldo</p>
                        <p className={`font-bold text-sm mt-1 ${finance.saldo >= 0 ? "text-blue-700" : "text-orange-600"}`}>{fmt(finance.saldo)}</p>
                      </div>
                    </div>
                    {finance.total_entrada === 0 && finance.total_saida === 0 && (
                      <p className="text-xs italic text-muted">Sem lançamentos financeiros registrados.</p>
                    )}
                  </>
                ) : (
                  <p className="text-sm italic text-muted">Sem dados financeiros.</p>
                )}
              </div>
            )}

            {/* PATRIMÔNIO */}
            {activeSection === "patrimony" && (
              <div className="space-y-3">
                <h3 className="font-semibold text-navy text-sm">Patrimônio</h3>
                {patrimony ? (
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-md border bg-card p-3 text-center">
                      <p className="font-display text-2xl font-bold text-navy">{patrimony.properties_count}</p>
                      <p className="text-[10px] text-muted">Imóveis</p>
                    </div>
                    <div className="rounded-md border bg-card p-3 text-center">
                      <p className="font-display text-2xl font-bold text-navy">{patrimony.assets_count}</p>
                      <p className="text-[10px] text-muted">Bens</p>
                    </div>
                    <div className="rounded-md border bg-card p-3 text-center">
                      <p className="font-display text-lg font-bold text-gold">{fmt(patrimony.total_value)}</p>
                      <p className="text-[10px] text-muted">Valor total</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm italic text-muted">Sem dados patrimoniais.</p>
                )}
              </div>
            )}

            {/* RELATÓRIOS */}
            {activeSection === "reports" && (
              <div className="space-y-3">
                <h3 className="font-semibold text-navy text-sm">Status de Relatórios</h3>
                {reports ? (
                  <div className="space-y-3">
                    <div className="rounded-md border bg-card p-3 space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-medium text-navy">Relatórios Semanais</span>
                          <span className="font-bold text-green-600">{pct(reports.lgs_with_weekly, reports.total_lgs)}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-gray-100">
                          <div className="h-2 rounded-full bg-green-500"
                            style={{ width: `${pct(reports.lgs_with_weekly, reports.total_lgs)}%` }} />
                        </div>
                        <p className="text-[10px] text-muted mt-1">{reports.lgs_with_weekly} de {reports.total_lgs} LGs enviaram</p>
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-medium text-navy">Relatórios Mensais</span>
                          <span className="font-bold text-blue-600">{pct(reports.lgs_with_monthly, reports.total_lgs)}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-gray-100">
                          <div className="h-2 rounded-full bg-blue-500"
                            style={{ width: `${pct(reports.lgs_with_monthly, reports.total_lgs)}%` }} />
                        </div>
                        <p className="text-[10px] text-muted mt-1">{reports.lgs_with_monthly} de {reports.total_lgs} LGs (mês atual)</p>
                      </div>
                    </div>

                    {pct(reports.lgs_with_weekly, reports.total_lgs) < 80 && (
                      <div className="flex items-start gap-2 rounded-md border-l-4 border-l-yellow-400 bg-yellow-50 p-3">
                        <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-yellow-800">
                          {reports.total_lgs - reports.lgs_with_weekly} Life Group{reports.total_lgs - reports.lgs_with_weekly !== 1 ? "s" : ""} sem relatório semanal recente.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm italic text-muted">Carregando status…</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Componente principal ──────────────────────────────────────
export function ExpansionMapAdmin() {
  const { data: cities = [] } = useExpansionCities();
  const { data: states = [] } = useExpansionStates();
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);

  const cityMarkers = useMemo(() =>
    cities.map(c => ({
      ...c,
      coords: getCoord(c.city, c.state),
      church_ids: (c as { church_ids?: string[] }).church_ids ?? [],
    })).filter(c => c.coords !== null) as MarkerData[],
    [cities]
  );

  const totalMembers = cities.reduce((s, c) => s + c.members_count, 0);
  const totalLgs     = cities.reduce((s, c) => s + c.lgs_count, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapIcon className="h-5 w-5 text-gold" />Mapa de Expansão
          </CardTitle>
          <CardDescription>
            Painel Executivo Territorial — clique em qualquer marcador para ver o painel completo da localidade
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-4">
            <StatCard icon={<Building2 />} label="Cidades" value={cities.length} />
            <StatCard icon={<MapIcon />} label="Estados" value={states.length} />
            <StatCard icon={<Flame />} label="Life Groups" value={totalLgs} />
            <StatCard icon={<Users />} label="Membros ativos" value={totalMembers.toLocaleString("pt-BR")} />
          </div>
        </CardContent>
      </Card>

      {/* Mapa */}
      <Card>
        <CardContent className="pt-4">
          <LeafletMapInteractive
            markers={cityMarkers}
            onMarkerClick={setSelectedMarker}
          />
          <p className="mt-2 text-[11px] text-muted text-center">
            Clique em um marcador para abrir o Painel da Localidade
          </p>
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
                  <span>🔥 {s.lgs_count} LGs</span>
                  <span>👥 {s.members_count}</span>
                </div>
              </div>
            ))}
            {states.length === 0 && <p className="col-span-full text-sm italic text-muted">Sem dados ainda.</p>}
          </div>
        </CardContent>
      </Card>

      {/* Painel lateral */}
      {selectedMarker && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={() => setSelectedMarker(null)} />
          <LocationPanel marker={selectedMarker} onClose={() => setSelectedMarker(null)} />
        </>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="rounded-md border bg-card p-3">
      <div className="flex items-center gap-2 text-navy">
        <span className="text-gold [&>svg]:h-4 [&>svg]:w-4">{icon}</span>
        <p className="text-[10px] uppercase tracking-wider text-muted">{label}</p>
      </div>
      <p className="mt-1 text-2xl font-bold text-navy">{value}</p>
    </div>
  );
}
