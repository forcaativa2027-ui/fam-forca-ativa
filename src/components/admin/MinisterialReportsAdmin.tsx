"use client";
import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Map, Target, BarChart2, ChevronDown, ChevronRight,
  Plus, Trash2, CheckCircle2, AlertTriangle, TrendingUp, Pencil,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  useMonthlyConsolidation, useGrowthVariation, useChurches,
  useDistricts, useAreas, useSectors,
  useGoals, useGoalsVsActual,
} from "@/hooks/use-queries";
import * as Goals from "@/services/goals";
import { supabase } from "@/lib/supabase/client";
import type { GoalIndicator, GoalScope, GoalVsActual, MonthlyConsolidation } from "@/types/domain";

const MONTHS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const MONTHS_FULL = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

const INDICATOR_LABELS: Record<GoalIndicator, string> = {
  membros_ativos:      "👥 Membros Ativos",
  visitantes:          "👋 Visitantes",
  decisoes:            "✨ Decisões",
  batismos:            "💧 Batismos",
  multiplicacoes:      "🌱 Multiplicações",
  lgs_ativos:          "🔥 Life Groups Ativos",
  disc_ativos:         "📖 Discipulados Ativos",
  integrados:          "🤝 Integrados",
  relatorios_enviados: "📋 Relatórios Enviados",
  novos_membros:       "⭐ Novos Membros",
};

const STATUS_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
  atingido:    { color: "bg-green-100 text-green-800 border-green-300",  icon: "✅", label: "Atingido"    },
  no_caminho:  { color: "bg-blue-100 text-blue-800 border-blue-300",    icon: "🎯", label: "No caminho"  },
  atencao:     { color: "bg-red-100 text-red-800 border-red-300",       icon: "⚠️", label: "Atenção"     },
};

// ── helper ──────────────────────────────────────────────────
function fmt(n: number) { return n.toLocaleString("pt-BR"); }
function fmtPct(n: number | null) {
  if (n === null) return "—";
  return `${n > 0 ? "+" : ""}${n}%`;
}

// ══════════════════════════════════════════════════════════════
// ABA 1 — RELATÓRIO MENSAL HIERÁRQUICO
// ══════════════════════════════════════════════════════════════
function HierarchicalReportTab() {
  const today = new Date();
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [churchFilter, setChurchFilter] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const { data: churches  = [] } = useChurches();
  const { data: districts = [] } = useDistricts();
  const { data: areas     = [] } = useAreas();
  const { data: sectors   = [] } = useSectors();
  const { data: rows      = [], isLoading } = useMonthlyConsolidation(
    churchFilter || undefined,
    `${year}-${String(month).padStart(2, "0")}`
  );

  // Agrupar por distrito → área → setor → igreja
  const grouped = useMemo(() => {
    const map: Record<string, MonthlyConsolidation[]> = {};
    rows.forEach(r => {
      const key = r.district_name ?? "Sem Distrito";
      if (!map[key]) map[key] = [];
      map[key].push(r);
    });
    return map as Record<string, MonthlyConsolidation[]>;
  }, [rows]);

  // Totais nacionais do mês
  const totals = useMemo(() => rows.reduce((acc, r) => ({
    presentes:     acc.presentes     + r.total_presentes,
    visitantes:    acc.visitantes    + r.total_visitantes,
    decisoes:      acc.decisoes      + r.total_decisoes,
    disc_ativos:   acc.disc_ativos   + r.total_disc_ativos,
    integrados:    acc.integrados    + r.total_integrados,
    lgs:           acc.lgs           + r.lgs_reportaram,
    ge:            acc.ge            + r.total_ge,
    oferta:        acc.oferta        + Number(r.total_oferta),
    oracao:        acc.oracao        + r.total_oracao_urgente,
  }), { presentes:0, visitantes:0, decisoes:0, disc_ativos:0, integrados:0, lgs:0, ge:0, oferta:0, oracao:0 }), [rows]);

  const toggle = (k: string) => setExpanded(e => {
    const n = new Set(e);
    n.has(k) ? n.delete(k) : n.add(k);
    return n;
  });

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <Label className="text-xs">Mês</Label>
          <Select value={String(month)} onValueChange={v => setMonth(Number(v))}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MONTHS_FULL.map((m, i) => <SelectItem key={i+1} value={String(i+1)}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Ano</Label>
          <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[2024,2025,2026,2027].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Comunidade</Label>
          <Select value={churchFilter} onValueChange={setChurchFilter}>
            <SelectTrigger className="w-52"><SelectValue placeholder="Todas" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas</SelectItem>
              {churches.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading && <p className="py-8 text-center text-sm text-muted-foreground">Consolidando dados…</p>}

      {!isLoading && rows.length === 0 && (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">
          Nenhum relatório encontrado para {MONTHS_FULL[month-1]}/{year}.
        </CardContent></Card>
      )}

      {/* Totais do mês */}
      {rows.length > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {[
              { label: "Presentes",    value: fmt(totals.presentes),    icon: "👥" },
              { label: "Visitantes",   value: fmt(totals.visitantes),   icon: "👋" },
              { label: "Decisões",     value: fmt(totals.decisoes),     icon: "✨" },
              { label: "Integrados",   value: fmt(totals.integrados),   icon: "🤝" },
              { label: "Discip. Ativos",value: fmt(totals.disc_ativos), icon: "📖" },
              { label: "LGs Reportaram",value: fmt(totals.lgs),         icon: "📋" },
              { label: "GEs Realizados",value: fmt(totals.ge),          icon: "🌍" },
              { label: "Oferta Total", value: `R$ ${fmt(totals.oferta)}`,icon: "💰" },
            ].map(k => (
              <Card key={k.label} className="border-l-4 border-l-[#C9A227]">
                <CardContent className="pt-3 pb-3">
                  <p className="text-xs text-muted-foreground">{k.icon} {k.label}</p>
                  <p className="font-display text-xl font-bold text-[#0E2A47]">{k.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Árvore hierárquica */}
          <div className="space-y-2">
            {Object.entries(grouped).map(([districtName, distRows]) => {
              const distKey = `d:${districtName}`;
              const distOpen = expanded.has(distKey);
              const distTotal = distRows.reduce((a,r) => a + r.total_presentes, 0);

              // Agrupar por área dentro do distrito
              const byArea: Record<string, MonthlyConsolidation[]> = {};
              distRows.forEach(r => {
                const k = r.area_name ?? "Sem Área";
                if (!byArea[k]) byArea[k] = [];
                byArea[k].push(r);
              });

              return (
                <div key={districtName} className="rounded-lg border overflow-hidden">
                  {/* Cabeçalho Distrito */}
                  <button onClick={() => toggle(distKey)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-[#0E2A47] text-white hover:bg-[#16345A] transition-colors">
                    <div className="flex items-center gap-2">
                      {distOpen ? <ChevronDown className="h-4 w-4"/> : <ChevronRight className="h-4 w-4"/>}
                      <span className="font-semibold">🏛️ Distrito: {districtName}</span>
                    </div>
                    <span className="text-sm opacity-80">{fmt(distTotal)} presentes · {distRows.length} registros</span>
                  </button>

                  {distOpen && (
                    <div className="divide-y">
                      {Object.entries(byArea).map(([areaName, areaRows]) => {
                        const areaKey = `a:${districtName}:${areaName}`;
                        const areaOpen = expanded.has(areaKey);
                        const areaTotal = areaRows.reduce((a,r) => a + r.total_presentes, 0);

                        return (
                          <div key={areaName}>
                            <button onClick={() => toggle(areaKey)}
                              className="w-full flex items-center justify-between px-6 py-2.5 bg-[#0E2A47]/10 hover:bg-[#0E2A47]/15 transition-colors">
                              <div className="flex items-center gap-2">
                                {areaOpen ? <ChevronDown className="h-3.5 w-3.5"/> : <ChevronRight className="h-3.5 w-3.5"/>}
                                <span className="font-semibold text-sm text-[#0E2A47]">📍 Área: {areaName}</span>
                              </div>
                              <span className="text-xs text-muted-foreground">{fmt(areaTotal)} presentes</span>
                            </button>

                            {areaOpen && (
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                  <thead className="bg-gray-50 text-muted-foreground">
                                    <tr>
                                      <th className="px-4 py-2 text-left">Setor / Igreja</th>
                                      <th className="px-2 py-2 text-center">LGs</th>
                                      <th className="px-2 py-2 text-center">Presentes</th>
                                      <th className="px-2 py-2 text-center">Visitantes</th>
                                      <th className="px-2 py-2 text-center">Decisões</th>
                                      <th className="px-2 py-2 text-center">Discip.</th>
                                      <th className="px-2 py-2 text-center">Integrados</th>
                                      <th className="px-2 py-2 text-center">GE</th>
                                      <th className="px-2 py-2 text-center">⚠️</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {areaRows.map((r, i) => (
                                      <tr key={i} className={`border-t ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                                        <td className="px-4 py-2">
                                          <div className="font-medium text-[#0E2A47]">{r.sector_name ?? r.church_name ?? "—"}</div>
                                          {r.sector_name && r.church_name && <div className="text-[10px] text-muted-foreground">{r.church_name}</div>}
                                        </td>
                                        <td className="px-2 py-2 text-center">{r.lgs_reportaram}</td>
                                        <td className="px-2 py-2 text-center font-semibold">{fmt(r.total_presentes)}</td>
                                        <td className="px-2 py-2 text-center">{r.total_visitantes}</td>
                                        <td className="px-2 py-2 text-center">{r.total_decisoes}</td>
                                        <td className="px-2 py-2 text-center">{r.total_disc_ativos}</td>
                                        <td className="px-2 py-2 text-center">{r.total_integrados}</td>
                                        <td className="px-2 py-2 text-center">{r.total_ge}</td>
                                        <td className="px-2 py-2 text-center">
                                          {r.total_oracao_urgente > 0 && <span className="text-red-500">🆘{r.total_oracao_urgente}</span>}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// ABA 2 — MAPA DE CALOR POR ESTADO
// ══════════════════════════════════════════════════════════════
const HEAT_STATES: Record<string, { name: string; x: number; y: number }> = {
  AC:{ name:"Acre",             x:8,  y:42 }, AL:{ name:"Alagoas",         x:72, y:35 },
  AM:{ name:"Amazonas",         x:17, y:33 }, AP:{ name:"Amapá",            x:38, y:14 },
  BA:{ name:"Bahia",            x:65, y:43 }, CE:{ name:"Ceará",            x:68, y:24 },
  DF:{ name:"Brasília",         x:55, y:52 }, ES:{ name:"Esp. Santo",       x:68, y:57 },
  GO:{ name:"Goiás",            x:53, y:52 }, MA:{ name:"Maranhão",         x:57, y:26 },
  MG:{ name:"Minas Gerais",     x:61, y:56 }, MS:{ name:"Mato Grosso Sul",  x:46, y:60 },
  MT:{ name:"Mato Grosso",      x:40, y:46 }, PA:{ name:"Pará",             x:38, y:26 },
  PB:{ name:"Paraíba",          x:73, y:28 }, PE:{ name:"Pernambuco",       x:69, y:31 },
  PI:{ name:"Piauí",            x:61, y:29 }, PR:{ name:"Paraná",           x:52, y:68 },
  RJ:{ name:"Rio de Janeiro",   x:67, y:60 }, RN:{ name:"Rio Gde Norte",    x:74, y:24 },
  RO:{ name:"Rondônia",         x:22, y:45 }, RR:{ name:"Roraima",          x:24, y:16 },
  RS:{ name:"Rio Gde Sul",      x:50, y:78 }, SC:{ name:"Santa Catarina",   x:53, y:73 },
  SE:{ name:"Sergipe",          x:71, y:38 }, SP:{ name:"São Paulo",        x:58, y:64 },
  TO:{ name:"Tocantins",        x:51, y:41 },
};

function HeatMapTab() {
  const { data: growth = [] } = useGrowthVariation();
  const { data: churches = [] } = useChurches();
  const [metric, setMetric] = useState<"presentes"|"visitantes"|"lgs_reportaram">("presentes");

  // Agrupar churches por estado
  const byState = useMemo(() => {
    const m: Record<string, number> = {};
    churches.forEach(c => {
      if (!c.state) return;
      const uf = c.state.toUpperCase().trim();
      m[uf] = (m[uf] ?? 0) + 1;
    });
    return m as Record<string, number>;
  }, [churches]);

  const maxVal = Math.max(1, ...Object.values(byState));

  // Últimos dados de crescimento para variação
  const lastMonth = growth[growth.length - 1];

  return (
    <div className="space-y-5">
      {/* Painel de variação do último mês */}
      {lastMonth && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Presentes",    val: lastMonth.presentes,    var: lastMonth.var_pct_presentes },
            { label: "Visitantes",   val: lastMonth.visitantes,   var: lastMonth.var_pct_visitantes },
            { label: "LGs Ativos",   val: lastMonth.lgs_reportaram, var: lastMonth.var_pct_lgs_reportaram },
          ].map(m => (
            <Card key={m.label} className="border-l-4 border-l-[#C9A227]">
              <CardContent className="pt-3 pb-3">
                <p className="text-xs text-muted-foreground">{m.label} — {lastMonth.mes_label}</p>
                <p className="font-display text-2xl font-bold text-[#0E2A47]">{fmt(m.val)}</p>
                <span className={`text-xs font-semibold ${(m.var ?? 0) >= 0 ? "text-green-600" : "text-red-500"}`}>
                  {fmtPct(m.var ?? null)} vs. mês anterior
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Mapa de calor */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Map className="h-4 w-4 text-[#C9A227]" /> Presença por Estado
          </CardTitle>
          <CardDescription>Intensidade = número de comunidades ativas por estado</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative w-full" style={{ paddingBottom: "60%" }}>
            <div className="absolute inset-0">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {/* Fundo do Brasil simplificado */}
                <rect x="5" y="10" width="80" height="80" rx="4" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.3"/>

                {Object.entries(HEAT_STATES).map(([uf, pos]) => {
                  const val = byState[uf] ?? 0;
                  const intensity = val / maxVal;
                  const baseR = 60;
                  const g = Math.round(baseR + (200 - baseR) * (1 - intensity));
                  const b = Math.round(baseR + (200 - baseR) * (1 - intensity));
                  const fill = val === 0 ? "#f1f5f9" : `rgb(14,${g},${b})`;

                  return (
                    <g key={uf}>
                      <circle
                        cx={pos.x} cy={pos.y} r={val > 0 ? 4 : 3}
                        fill={fill} stroke="white" strokeWidth="0.3"
                        opacity={val > 0 ? 0.9 : 0.4}
                      />
                      <text x={pos.x} y={pos.y + 0.8} textAnchor="middle"
                        fontSize="1.8" fill="white" fontWeight="bold">
                        {uf}
                      </text>
                      {val > 0 && (
                        <text x={pos.x} y={pos.y + 5.5} textAnchor="middle"
                          fontSize="1.5" fill="#0E2A47">
                          {val}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Legenda */}
          <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-gray-200"/> 0 comunidades
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-[#0E2A47]/40"/> 1–2
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-[#0E2A47]/70"/> 3–5
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-[#0E2A47]"/> 6+
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela por estado */}
      {Object.keys(byState).length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Comunidades por Estado</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#0E2A47] text-white text-xs">
                  <tr>
                    <th className="px-3 py-2 text-left">Estado</th>
                    <th className="px-3 py-2 text-center">Comunidades</th>
                    <th className="px-3 py-2 text-left">Intensidade</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(byState)
                    .sort((a,b) => b[1] - a[1])
                    .map(([uf, count], i) => (
                    <tr key={uf} className={`border-t ${i % 2 === 0 ? "bg-gray-50/50" : ""}`}>
                      <td className="px-3 py-2 font-medium text-[#0E2A47]">
                        {HEAT_STATES[uf]?.name ?? uf} <span className="text-muted-foreground text-xs">({uf})</span>
                      </td>
                      <td className="px-3 py-2 text-center font-bold">{count}</td>
                      <td className="px-3 py-2">
                        <div className="h-2 rounded-full bg-gray-100 w-full max-w-[120px]">
                          <div className="h-2 rounded-full bg-[#0E2A47]"
                            style={{ width: `${Math.round(count/maxVal*100)}%` }}/>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// ABA 3 — CENTRAL DE METAS
// ══════════════════════════════════════════════════════════════
const INDICATORS = Object.entries(INDICATOR_LABELS) as [GoalIndicator, string][];
const today = new Date();

function GoalsTab() {
  const qc = useQueryClient();
  const [year, setYear] = useState(today.getFullYear());
  const { data: goals = [] }  = useGoalsVsActual(year);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<GoalVsActual | null>(null);

  const atingidas   = goals.filter(g => g.status_meta === "atingido").length;
  const noCaminho   = goals.filter(g => g.status_meta === "no_caminho").length;
  const atencao     = goals.filter(g => g.status_meta === "atencao").length;

  async function handleDelete(id: string) {
    if (!confirm("Excluir esta meta?")) return;
    await Goals.deleteGoal(supabase, id);
    qc.invalidateQueries({ queryKey: ["goals-vs-actual", year] });
    qc.invalidateQueries({ queryKey: ["goals", year] });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[2024,2025,2026,2027].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">{goals.length} meta(s) definida(s)</span>
        </div>
        <Button size="sm" onClick={() => { setEditing(null); setShowForm(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Nova Meta
        </Button>
      </div>

      {/* Resumo */}
      {goals.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="pt-3 pb-3 text-center">
              <p className="text-2xl font-bold text-green-700">{atingidas}</p>
              <p className="text-xs text-muted-foreground">✅ Atingidas</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-400">
            <CardContent className="pt-3 pb-3 text-center">
              <p className="text-2xl font-bold text-blue-700">{noCaminho}</p>
              <p className="text-xs text-muted-foreground">🎯 No caminho</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="pt-3 pb-3 text-center">
              <p className="text-2xl font-bold text-red-700">{atencao}</p>
              <p className="text-xs text-muted-foreground">⚠️ Atenção</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista de metas */}
      <div className="space-y-3">
        {goals.length === 0 && (
          <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">
            Nenhuma meta definida para {year}. Clique em "Nova Meta" para começar.
          </CardContent></Card>
        )}
        {goals.map(g => {
          const cfg = STATUS_CONFIG[g.status_meta] ?? STATUS_CONFIG.atencao;
          const barPct = Math.min(100, g.pct_atingido ?? 0);
          return (
            <Card key={g.id} className={`border-l-4 ${g.status_meta === "atingido" ? "border-l-green-400" : g.status_meta === "no_caminho" ? "border-l-blue-400" : "border-l-red-400"}`}>
              <CardContent className="pt-3 pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-[#0E2A47]">
                        {INDICATOR_LABELS[g.indicator]}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cfg.color}`}>
                        {cfg.icon} {cfg.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {g.scope_name} · {g.month ? MONTHS_FULL[g.month-1] + "/" : ""}{g.year}
                      </span>
                    </div>
                    {/* Barra de progresso */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2.5 rounded-full bg-gray-100">
                        <div
                          className={`h-2.5 rounded-full transition-all ${g.status_meta === "atingido" ? "bg-green-500" : g.status_meta === "no_caminho" ? "bg-blue-400" : "bg-red-400"}`}
                          style={{ width: `${barPct}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-[#0E2A47] whitespace-nowrap">
                        {fmt(g.actual_value)} / {fmt(g.target_value)}
                      </span>
                      <span className={`text-sm font-bold whitespace-nowrap ${g.status_meta === "atingido" ? "text-green-600" : g.status_meta === "no_caminho" ? "text-blue-600" : "text-red-500"}`}>
                        {g.pct_atingido}%
                      </span>
                    </div>
                    {g.notes && <p className="text-xs text-muted-foreground italic">{g.notes}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" variant="ghost"
                      onClick={() => { setEditing(g as GoalVsActual); setShowForm(true); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-500"
                      onClick={() => handleDelete(g.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {showForm && (
        <GoalForm
          initial={editing}
          defaultYear={year}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            qc.invalidateQueries({ queryKey: ["goals-vs-actual", year] });
            qc.invalidateQueries({ queryKey: ["goals", year] });
          }}
        />
      )}
    </div>
  );
}

function GoalForm({ initial, defaultYear, onClose, onSaved }: {
  initial: GoalVsActual | null;
  defaultYear: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [indicator, setIndicator]   = useState<GoalIndicator>(initial?.indicator ?? "membros_ativos");
  const [target, setTarget]         = useState(String(initial?.target_value ?? ""));
  const [year, setYear]             = useState(String(initial?.year ?? defaultYear));
  const [month, setMonth]           = useState(String(initial?.month ?? ""));
  const [notes, setNotes]           = useState(initial?.notes ?? "");
  const [busy, setBusy]             = useState(false);
  const [err, setErr]               = useState("");

  async function handleSave() {
    const t = Number(target);
    if (!t || t <= 0) { setErr("Informe um valor alvo válido."); return; }
    setBusy(true); setErr("");
    try {
      await Goals.upsertGoal(supabase, {
        ...(initial?.id ? { id: initial.id } : {}),
        scope: "nacional",
        scope_id: null,
        scope_name: "Nacional",
        year: Number(year),
        month: month ? Number(month) : null,
        indicator,
        target_value: t,
        notes: notes || null,
      });
      onSaved();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Erro ao salvar meta");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar Meta" : "Nova Meta"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Indicador *</Label>
            <Select value={indicator} onValueChange={v => setIndicator(v as GoalIndicator)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {INDICATORS.map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Ano *</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[2024,2025,2026,2027].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Mês (opcional)</Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger><SelectValue placeholder="Anual" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Anual</SelectItem>
                  {MONTHS_FULL.map((m, i) => <SelectItem key={i+1} value={String(i+1)}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">Valor alvo *</Label>
            <Input type="number" min="1" value={target} onChange={e => setTarget(e.target.value)} placeholder="Ex: 500" />
          </div>
          <div>
            <Label className="text-xs">Observações</Label>
            <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Opcional…" />
          </div>
          {err && <p className="text-xs text-destructive">{err}</p>}
          <div className="flex gap-2 justify-end pt-1">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSave} disabled={busy}>{busy ? "Salvando…" : "Salvar Meta"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ══════════════════════════════════════════════════════════════
// MASTER — MinisterialReportsAdmin
// ══════════════════════════════════════════════════════════════
export function MinisterialReportsAdmin() {
  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <BarChart2 className="h-6 w-6 text-[#C9A227]" />
        <div>
          <h2 className="text-xl font-bold text-[#0E2A47]">Relatórios Ministeriais</h2>
          <p className="text-xs text-muted-foreground">Consolidação hierárquica · Mapa de Expansão · Central de Metas</p>
        </div>
      </div>

      <Tabs defaultValue="hierarchical">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="hierarchical" className="gap-1.5">
            <BarChart2 className="h-3.5 w-3.5" /> Consolidação Mensal
          </TabsTrigger>
          <TabsTrigger value="heatmap" className="gap-1.5">
            <Map className="h-3.5 w-3.5" /> Mapa de Calor
          </TabsTrigger>
          <TabsTrigger value="goals" className="gap-1.5">
            <Target className="h-3.5 w-3.5" /> Central de Metas
          </TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <TabsContent value="hierarchical"><HierarchicalReportTab /></TabsContent>
          <TabsContent value="heatmap"><HeatMapTab /></TabsContent>
          <TabsContent value="goals"><GoalsTab /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
