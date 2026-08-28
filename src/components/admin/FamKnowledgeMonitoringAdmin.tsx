"use client";

import { useEffect, useState } from "react";
import { Activity, BookOpen, CheckCircle2, Clock3, RefreshCw, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase/client";

interface Overview {
  total_courses: number;
  total_modules: number;
  total_lessons: number;
  active_learners: number;
  lessons_started: number;
  lessons_completed: number;
  completion_rate: number;
}

interface CourseRow {
  course_id: string;
  course_code: string | null;
  course_name: string;
  total_lessons: number;
  active_learners: number;
  lessons_started: number;
  lessons_completed: number;
}

const EMPTY: Overview = { total_courses: 0, total_modules: 0, total_lessons: 0, active_learners: 0, lessons_started: 0, lessons_completed: 0, completion_rate: 0 };

function MetricCard({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return <Card className="border-fam-pink/20 bg-white"><CardContent className="flex items-center justify-between gap-4 p-5"><div><p className="text-xs font-semibold uppercase tracking-wide text-fam-night/55">{label}</p><p className="mt-2 font-display text-3xl font-bold text-fam-plum">{value}</p></div><div className="rounded-xl bg-fam-pink/10 p-3 text-fam-magenta">{icon}</div></CardContent></Card>;
}

export function FamKnowledgeMonitoringAdmin() {
  const [overview, setOverview] = useState<Overview>(EMPTY);
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const [overviewResult, coursesResult] = await Promise.all([
      supabase.rpc("fam_school_monitoring_overview", { p_since: since }).maybeSingle(),
      supabase.rpc("fam_school_monitoring_by_course", { p_since: since }),
    ]);
    if (overviewResult.error || coursesResult.error) {
      setError("Não foi possível carregar o monitoramento. Confirme se a migration FAM040 foi aplicada e se sua conta possui acesso administrativo.");
    } else {
      setOverview((overviewResult.data ?? EMPTY) as Overview);
      setCourses((coursesResult.data ?? []) as CourseRow[]);
      setUpdatedAt(new Date());
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  return <main className="space-y-6 p-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-fam-magenta">Escola de Direitos e Deveres</p><h1 className="mt-1 font-display text-2xl text-navy">Monitoramento da aprendizagem</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Indicadores agregados dos últimos 30 dias para melhorar cursos, fontes, acessibilidade e experiência.</p></div><Button variant="outline" onClick={() => void load()} disabled={loading} className="gap-2 border-fam-plum/30 text-fam-plum"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />Atualizar</Button></div>
    <div className="flex items-center gap-2 text-xs text-muted"><span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />{updatedAt ? `Atualizado às ${updatedAt.toLocaleTimeString("pt-BR")}` : "Carregando indicadores…"}<span>·</span><Clock3 className="h-3.5 w-3.5" aria-hidden="true" />Atualização automática a cada 60 segundos</div>
    {error && <p role="alert" className="rounded-xl border border-fam-pink/30 bg-fam-pink/10 p-4 text-sm text-fam-plum">{error}</p>}
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><MetricCard label="Cursos ativos" value={overview.total_courses} icon={<BookOpen className="h-5 w-5" />} /><MetricCard label="Lições disponíveis" value={overview.total_lessons} icon={<Activity className="h-5 w-5" />} /><MetricCard label="Aprendizes no período" value={overview.active_learners} icon={<Users className="h-5 w-5" />} /><MetricCard label="Lições concluídas" value={`${overview.lessons_completed} · ${overview.completion_rate}%`} icon={<CheckCircle2 className="h-5 w-5" />} /></div>
    <Card className="border-fam-gold/40 bg-fam-gold/10"><CardHeader><CardTitle className="text-lg text-fam-plum">Como interpretar</CardTitle><CardDescription>O painel mostra aprendizagem agregada. Não exibe nomes, relatos, renda, CPF, valores de dívida, dados bancários ou situação individual de risco.</CardDescription></CardHeader><CardContent className="text-sm leading-6 text-fam-night/75">A quantidade de cliques em fontes ou serviços não indica, por si só, que uma pessoa esteja em situação de violência, endividamento ou vulnerabilidade. Use os dados para melhorar conteúdo, acessibilidade e caminhos de apoio.</CardContent></Card>
    <Card className="border-fam-pink/20"><CardHeader><CardTitle className="text-lg text-fam-plum">Desempenho por curso</CardTitle><CardDescription>Atividade agregada nos últimos 30 dias.</CardDescription></CardHeader><CardContent><div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm"><thead className="border-b border-fam-plum/10 text-xs uppercase tracking-wide text-muted"><tr><th className="pb-3 pr-4">Curso</th><th className="pb-3 pr-4">Lições</th><th className="pb-3 pr-4">Aprendizes</th><th className="pb-3 pr-4">Inícios</th><th className="pb-3">Conclusões</th></tr></thead><tbody>{courses.map((course) => <tr key={course.course_id} className="border-b border-fam-plum/5"><td className="py-3 pr-4 font-semibold text-fam-plum">{course.course_name}</td><td className="py-3 pr-4">{course.total_lessons}</td><td className="py-3 pr-4">{course.active_learners}</td><td className="py-3 pr-4">{course.lessons_started}</td><td className="py-3">{course.lessons_completed}</td></tr>)}</tbody></table>{!loading && courses.length === 0 && <p className="py-6 text-sm text-muted">Nenhum curso com atividade no período.</p>}</div></CardContent></Card>
  </main>;
}
