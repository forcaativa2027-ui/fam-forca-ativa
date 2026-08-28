"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, CheckCircle2, GraduationCap, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase/client";
import { useFamStudyAccess, useFamStudyContent, useFamStudyCourses } from "@/hooks/use-fam-study";
import { getFamStudyProgress, FAM_STUDY_LABELS, type FamStudyCourse } from "@/services/famStudy";

function CourseCard({ course }: { course: FamStudyCourse }) {
  const { data: items = [], isLoading } = useFamStudyContent(course.id);
  const progress = getFamStudyProgress(items);
  return (
    <Card className="group flex h-full flex-col overflow-hidden border-fam-pink/20 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg">
      <div className="h-2 bg-gradient-to-r from-fam-plum via-fam-purple to-fam-gold" />
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-fam-pink/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-fam-plum"><BookOpen className="h-3.5 w-3.5" aria-hidden="true" /> Curso EAD</span>
          {progress.percent === 100 && <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-label="Curso concluído" />}
        </div>
        <CardTitle className="mt-3 text-xl text-fam-plum">{FAM_STUDY_LABELS[course.course_code ?? ""] ?? course.name}</CardTitle>
        <CardDescription className="leading-6 text-fam-night/70">{course.description}</CardDescription>
      </CardHeader>
      <CardContent className="mt-auto space-y-4">
        <div aria-label={`${progress.percent}% concluído`}>
          <div className="mb-1 flex justify-between text-xs font-semibold text-fam-night/65"><span>{isLoading ? "Carregando progresso…" : `${progress.completed} de ${progress.total} lições`}</span><span>{progress.percent}%</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-fam-pink/10"><div className="h-full rounded-full bg-fam-purple transition-all" style={{ width: `${progress.percent}%` }} /></div>
        </div>
        <Button asChild className="w-full gap-2 bg-fam-plum font-bold hover:bg-fam-purple"><Link href={`/escola-direitos-e-deveres/${course.id}`}>{progress.percent > 0 ? "Continuar estudando" : "Começar curso"}<ArrowRight className="h-4 w-4" /></Link></Button>
      </CardContent>
    </Card>
  );
}

export default function EscolaDireitosDeveresPage() {
  const [checkingSession, setCheckingSession] = useState(true);
  const { data: access, isLoading: accessLoading, isError: accessError } = useFamStudyAccess();
  const { data: courses = [], isLoading: coursesLoading, isError: coursesError } = useFamStudyCourses();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) window.location.href = "/entrar?redirect=/escola-direitos-e-deveres";
      else setCheckingSession(false);
    });
  }, []);

  if (checkingSession || accessLoading) return <main className="grid min-h-screen place-items-center text-sm text-muted">Preparando seu ambiente de estudo…</main>;
  if (accessError || coursesError) return <main className="mx-auto max-w-2xl p-6"><Card className="border-fam-pink/30"><CardHeader><CardTitle className="text-fam-plum">Não foi possível carregar a Escola</CardTitle><CardDescription>Tente novamente. Seu acesso e seus dados de progresso não foram alterados.</CardDescription></CardHeader></Card></main>;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(216,180,254,0.22),transparent_34%),#fffafc] pb-16">
      <section className="bg-fam-plum px-4 py-12 text-white sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-fam-gold">Ambiente de estudo FAM</p><h1 className="mt-3 flex items-center gap-3 font-display text-3xl font-bold sm:text-4xl"><GraduationCap className="h-9 w-9 text-fam-gold" aria-hidden="true" /> Escola de Direitos e Deveres</h1><p className="mt-3 max-w-2xl text-white/85">Aprenda no seu ritmo sobre direitos, deveres, proteção, consumo, trabalho e caminhos seguros de orientação.</p></div>
            <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm"><p className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4 text-fam-gold" aria-hidden="true" /> Ambiente protegido</p><p className="mt-1 text-white/70">{access?.isActiveMember ? "Membro ativo" : access?.hasMemberRecord ? "Usuário cadastrado" : "Conta autenticada"}</p></div>
          </div>
        </div>
      </section>
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
        <div className="rounded-2xl border border-fam-gold/40 bg-fam-gold/10 p-5 text-sm leading-6 text-fam-night/80"><strong className="text-fam-plum">Como funciona:</strong> cada curso reúne módulos, lições, fontes oficiais e atividades. Você pode pausar e continuar depois. Não é necessário compartilhar relatos pessoais para estudar.</div>
        <section aria-labelledby="courses-title"><div className="mb-4"><h2 id="courses-title" className="font-display text-2xl text-fam-plum">Cursos disponíveis</h2><p className="mt-1 text-sm text-fam-night/70">Escolha uma trilha para começar ou continue de onde parou.</p></div>{coursesLoading ? <p role="status" className="text-sm text-muted">Carregando cursos…</p> : courses.length === 0 ? <p className="rounded-xl border border-dashed p-6 text-sm text-muted">Nenhum curso publicado para este ambiente ainda.</p> : <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{courses.map((course) => <CourseCard key={course.id} course={course} />)}</div>}</section>
        <div className="flex flex-wrap gap-3"><Button asChild variant="outline" className="border-fam-plum/30 text-fam-plum"><Link href="/jornada-conhecimento">Consultar biblioteca de direitos</Link></Button><Button asChild variant="ghost" className="text-fam-plum"><Link href="/painel">Voltar ao painel</Link></Button></div>
      </div>
    </main>
  );
}
