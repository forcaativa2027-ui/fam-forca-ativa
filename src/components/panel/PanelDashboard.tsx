"use client";
import { useState } from "react";
import Link from "next/link";
import { LogOut, Sparkles, AlertTriangle, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase/client";
import { useMyProfile, useDashboard, useChurches, useMdaAlerts } from "@/hooks/use-queries";
import { logAudit } from "@/services/audit";

const ROLE_LABELS: Record<string, string> = {
  apostolo: "Apóstolo", pastor: "Pastor", supervisor: "Supervisor",
  lider: "Líder", anfitriao: "Anfitrião", discipulador: "Discipulador",
  membro: "Membro", visitante: "Visitante",
};

export default function PanelDashboard() {
  const [scope, setScope] = useState("");
  const { data: profile } = useMyProfile();
  const { data: churches = [] } = useChurches();
  const { data: stats } = useDashboard(scope || null);
  const { data: alerts = [] } = useMdaAlerts();

  const isAdmin = profile?.role === "apostolo" || profile?.role === "pastor";
  const multi = churches.length > 1;
  const scopeName = scope ? (churches.find((c) => c.id === scope)?.name ?? "Igreja") : "Toda a rede";

  async function signOut() {
    if (profile) await logAudit(supabase, "logout", "auth", profile.id);
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b-[3px] border-gold bg-navy">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Sparkles className="h-5 w-5 text-gold" />
            <span className="font-display text-lg font-bold tracking-wide">CEC FAMILY</span>
            <span className="ml-2 hidden border-l border-white/20 pl-3 text-xs font-semibold text-white/70 sm:inline">Painel Apostólico</span>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button asChild variant="outline" size="sm" className="border-gold/80 bg-transparent text-gold hover:bg-gold/10 hover:text-gold">
                <Link href="/admin">Administração ✦</Link>
              </Button>
            )}
            <Button onClick={signOut} variant="outline" size="sm" className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white">
              <LogOut className="mr-1 h-3.5 w-3.5" /> Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container space-y-8 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">{scopeName}</p>
            <h1 className="mt-1 font-display text-3xl text-navy">{profile ? `Paz, ${profile.full_name.split(" ")[0]}.` : "Governo pastoral"}</h1>
            {profile && <p className="mt-1 text-sm font-bold text-gold">{ROLE_LABELS[profile.role] ?? profile.role}</p>}
          </div>
          {multi && (
            <div className="rounded-xl border bg-card px-4 py-3">
              <Label htmlFor="scope" className="block text-[11px] uppercase tracking-wider text-muted">Visão</Label>
              <select id="scope" value={scope} onChange={(e) => setScope(e.target.value)}
                className="mt-1 h-9 rounded-md border bg-background px-3 text-sm font-bold text-navy">
                <option value="">Toda a rede</option>
                {churches.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
        </div>

        {isAdmin && alerts.length > 0 && (
          <Card className="border-yellow-300 bg-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-800"><AlertTriangle className="h-5 w-5" /> Estrutura MDA — alertas</CardTitle>
              <CardDescription className="text-yellow-700/80">A regra de multiplicação recomenda 3+ filhos por nível. Os itens abaixo estão abaixo do mínimo:</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-yellow-900">
                {alerts.map((a) => (
                  <li key={`${a.nivel}-${a.id}`}>
                    <b className="capitalize">{a.nivel}</b> — {a.nome}: <b>{a.filhos}</b> de 3 recomendados
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Kpi label="Membros" value={stats?.total_members ?? 0} hero />
          <Kpi label="Visitantes" value={stats?.total_visitors ?? 0} />
          <Kpi label="Células" value={stats?.total_groups ?? 0} />
          <Kpi label="Relatórios" value={stats?.total_reports ?? 0} />
          <Kpi label="Batismos" value={stats?.baptisms ?? 0} />
        </section>

        {stats && Object.keys(stats.by_stage).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-gold" /> Jornada espiritual</CardTitle>
              <CardDescription>Distribuição dos membros por etapa</CardDescription>
            </CardHeader>
            <CardContent><JourneyBars byStage={stats.by_stage} /></CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

function Kpi({ label, value, hero }: { label: string; value: number; hero?: boolean }) {
  return (
    <Card className={hero ? "bg-navy text-white" : ""}>
      <CardContent className="pt-6">
        <p className={`font-display text-3xl font-semibold ${hero ? "text-gold" : "text-navy"}`}>{value}</p>
        <p className={`mt-1 text-xs font-semibold uppercase ${hero ? "text-white/70" : "text-muted"}`}>{label}</p>
      </CardContent>
    </Card>
  );
}

function JourneyBars({ byStage }: { byStage: Record<string, number> }) {
  const entries = Object.entries(byStage).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...entries.map(([, n]) => n));
  return (
    <div className="space-y-2.5">
      {entries.map(([k, n]) => (
        <div key={k} className="flex items-center gap-3">
          <span className="w-32 text-right text-xs font-semibold capitalize text-navy-600">{k.replace(/_/g, " ")}</span>
          <div className="h-5 flex-1 overflow-hidden rounded bg-navy-50">
            <div className="h-full rounded bg-gradient-to-r from-navy to-gold" style={{ width: `${(n / max) * 100}%` }} />
          </div>
          <span className="w-8 text-sm font-extrabold text-navy">{n}</span>
        </div>
      ))}
    </div>
  );
}
