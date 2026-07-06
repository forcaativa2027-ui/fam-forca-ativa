"use client";
import {
  Activity, Building2, Users, Heart, MapPin, Sparkles, TrendingUp,
  FileText, Award, Calendar, Globe2, Split,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useOrgKpis, useGrowthMonthly } from "@/hooks/use-queries";

export function OrgDashboardAdmin() {
  const { data: kpis, isLoading } = useOrgKpis();
  const { data: growth = [] } = useGrowthMonthly();

  if (isLoading) {
    return <p className="py-8 text-center text-sm italic text-muted">Carregando dashboard…</p>;
  }
  if (!kpis) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <Activity className="mx-auto h-10 w-10 text-muted" />
          <p className="mt-3 text-sm text-muted">Sem dados consolidados ainda.</p>
        </CardContent>
      </Card>
    );
  }

  const maxMembers = Math.max(1, ...growth.map(g => g.new_members));
  const maxLgs = Math.max(1, ...growth.map(g => g.new_lgs));

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-gold" />Dashboard Organizacional</CardTitle>
          <CardDescription>Visão executiva consolidada da rede CEC Brasil</CardDescription>
        </CardHeader>
      </Card>

      {/* Bloco 1 — Rede CEC */}
      <section>
        <SectionTitle icon={<Globe2 />} title="Rede CEC Brasil" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard icon={<Building2 />} label="Comunidades" value={kpis.total_churches}
            sublabel={`${kpis.total_sedes} Sedes · ${kpis.total_nucleos} Núcleos · ${kpis.total_locais} Locais`} accent="gold" />
          <KpiCard icon={<MapPin />} label="Estados alcançados" value={kpis.estados_alcancados}
            sublabel={`${kpis.cidades_alcancadas} cidades`} accent="blue" />
          <KpiCard icon={<Users />} label="Membros ativos" value={kpis.total_membros_ativos.toLocaleString("pt-BR")}
            sublabel={`+${kpis.novos_membros_30d} nos últimos 30d`} accent="green" />
          <KpiCard icon={<Sparkles />} label="Novos convertidos" value={kpis.novos_convertidos}
            sublabel="ainda em consolidação" accent="purple" />
        </div>
      </section>

      {/* Bloco 2 — Estrutura celular */}
      <section>
        <SectionTitle icon={<Heart />} title="Estrutura Celular MDA" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard icon={<Heart />} label="Distritos" value={kpis.total_distritos} accent="navy" />
          <KpiCard icon={<Heart />} label="Áreas" value={kpis.total_areas} accent="navy" />
          <KpiCard icon={<Heart />} label="Setores" value={kpis.total_setores} accent="navy" />
          <KpiCard icon={<Heart />} label="Life Groups" value={kpis.total_lgs}
            sublabel={`${kpis.lgs_em_multiplicacao} em multiplicação`} accent="gold" />
        </div>
      </section>

      {/* Bloco 3 — Atividade */}
      <section>
        <SectionTitle icon={<TrendingUp />} title="Atividade Recente" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard icon={<FileText />} label="Relatórios" value={kpis.relatorios_ultima_semana}
            sublabel="esta semana" accent="green" />
          <KpiCard icon={<Calendar />} label="Relatórios" value={kpis.relatorios_ultimo_mes}
            sublabel="último mês" accent="green" />
          <KpiCard icon={<Split />} label="Multiplicações" value={kpis.multiplicacoes_ano}
            sublabel="no ano" accent="gold" />
          <KpiCard icon={<Award />} label="Ministérios" value={kpis.total_ministerios} accent="purple" />
        </div>
      </section>

      {/* Bloco 4 — Crescimento mensal (gráfico de barras simples) */}
      {growth.length > 0 && (
        <section>
          <SectionTitle icon={<TrendingUp />} title="Crescimento — últimos 12 meses" />
          <Card>
            <CardContent className="pt-4 space-y-4">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">Novos membros por mês</p>
                <div className="flex h-32 items-end gap-1.5">
                  {growth.map(g => {
                    const h = (g.new_members / maxMembers) * 100;
                    return (
                      <div key={g.month_label} className="group flex flex-1 flex-col items-center justify-end">
                        <div className="relative w-full rounded-t bg-gold/70 transition hover:bg-gold"
                          style={{ height: `${h}%`, minHeight: g.new_members > 0 ? "4px" : "0" }}>
                          <span className="invisible absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-navy px-1.5 py-0.5 text-[10px] text-white group-hover:visible">
                            {g.new_members}
                          </span>
                        </div>
                        <p className="mt-1 text-[9px] text-muted">{g.month_label.slice(5)}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">Novos Life Groups por mês</p>
                <div className="flex h-24 items-end gap-1.5">
                  {growth.map(g => {
                    const h = (g.new_lgs / maxLgs) * 100;
                    return (
                      <div key={g.month_label} className="group flex flex-1 flex-col items-center justify-end">
                        <div className="relative w-full rounded-t bg-green-500/70 transition hover:bg-green-500"
                          style={{ height: `${h}%`, minHeight: g.new_lgs > 0 ? "4px" : "0" }}>
                          <span className="invisible absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-navy px-1.5 py-0.5 text-[10px] text-white group-hover:visible">
                            {g.new_lgs}
                          </span>
                        </div>
                        <p className="mt-1 text-[9px] text-muted">{g.month_label.slice(5)}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-navy-600">
      <span className="text-gold [&>svg]:h-4 [&>svg]:w-4">{icon}</span>{title}
    </h2>
  );
}

const ACCENT: Record<string, string> = {
  gold: "border-l-gold bg-gold/5",
  blue: "border-l-blue-500 bg-blue-50/50",
  green: "border-l-green-500 bg-green-50/50",
  purple: "border-l-purple-500 bg-purple-50/50",
  navy: "border-l-navy bg-navy-50/30",
};

function KpiCard({ icon, label, value, sublabel, accent = "gold" }: {
  icon: React.ReactNode; label: string; value: string | number; sublabel?: string; accent?: string;
}) {
  return (
    <Card className={`border-l-4 ${ACCENT[accent] ?? ACCENT.gold}`}>
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 text-navy-600">
          <span className="text-gold [&>svg]:h-4 [&>svg]:w-4">{icon}</span>
          <p className="text-xs font-bold uppercase tracking-wider">{label}</p>
        </div>
        <p className="mt-1 font-display text-3xl text-navy">{value}</p>
        {sublabel && <p className="mt-1 text-[11px] text-muted">{sublabel}</p>}
      </CardContent>
    </Card>
  );
}
