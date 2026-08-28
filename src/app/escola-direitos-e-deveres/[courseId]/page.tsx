"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Circle, Headphones, PlayCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase/client";
import { useFamStudyAccess, useFamStudyContent, useFamStudyCourses, useFamStudyLesson, useUpdateFamStudyProgress } from "@/hooks/use-fam-study";
import { getFamStudyProgress, FAM_STUDY_LABELS } from "@/services/famStudy";

export default function FamStudyCoursePage({ params }: { params: { courseId: string } }) {
  const [sessionReady, setSessionReady] = useState(false);
  const [selectedLessonId, setSelectedLessonId] = useState<string>();
  const { data: access, isLoading: accessLoading } = useFamStudyAccess();
  const { data: courses = [], isLoading: coursesLoading } = useFamStudyCourses();
  const course = courses.find((item) => item.id === params.courseId);
  const { data: items = [], isLoading: contentLoading } = useFamStudyContent(params.courseId);
  const progress = getFamStudyProgress(items);
  const activeId = selectedLessonId ?? progress.nextLessonId ?? items[0]?.lesson_id;
  const currentItem = items.find((item) => item.lesson_id === activeId);
  const { data: lesson, isLoading: lessonLoading } = useFamStudyLesson(activeId);
  const updateProgress = useUpdateFamStudyProgress(params.courseId);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) window.location.href = `/entrar?redirect=/escola-direitos-e-deveres/${params.courseId}`;
      else setSessionReady(true);
    });
  }, [params.courseId]);

  const grouped = useMemo(() => items.reduce<Record<string, typeof items>>((acc, item) => {
    (acc[item.module_name] ??= []).push(item);
    return acc;
  }, {}), [items]);

  if (!sessionReady || accessLoading || coursesLoading || contentLoading) return <main className="grid min-h-screen place-items-center text-sm text-muted">Carregando ambiente de estudo…</main>;
  if (!course) return <main className="mx-auto max-w-2xl p-6"><Card><CardHeader><CardTitle className="text-fam-plum">Curso não encontrado</CardTitle></CardHeader><CardContent><Button asChild><Link href="/escola-direitos-e-deveres">Voltar para a Escola</Link></Button></CardContent></Card></main>;

  return (
    <main className="min-h-screen bg-[#fffafc] pb-16">
      <header className="border-b border-fam-pink/15 bg-white px-4 py-4 sm:px-6"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4"><Button asChild variant="ghost" className="gap-2 text-fam-plum"><Link href="/escola-direitos-e-deveres"><ArrowLeft className="h-4 w-4" /> Escola</Link></Button><div className="hidden text-right text-xs text-fam-night/60 sm:block"><p>{access?.isActiveMember ? "Membro ativo" : "Ambiente protegido"}</p><p>{progress.completed}/{progress.total} lições concluídas</p></div></div></header>
      <section className="bg-fam-plum px-4 py-8 text-white sm:px-6"><div className="mx-auto max-w-7xl"><p className="text-xs font-bold uppercase tracking-[0.18em] text-fam-gold">Curso EAD</p><h1 className="mt-2 font-display text-3xl font-bold">{FAM_STUDY_LABELS[course.course_code ?? ""] ?? course.name}</h1><p className="mt-2 max-w-3xl text-white/80">{course.description}</p><div className="mt-5 flex items-center gap-3"><div className="h-3 w-full max-w-md overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-fam-gold" style={{ width: `${progress.percent}%` }} /></div><span className="text-sm font-bold">{progress.percent}%</span></div></div></section>
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[300px_1fr]">
        <aside className="space-y-4"><Card className="border-fam-pink/20"><CardHeader><CardTitle className="text-base text-fam-plum">Roteiro do curso</CardTitle></CardHeader><CardContent className="space-y-4">{Object.entries(grouped).map(([moduleName, moduleItems]) => <div key={moduleName}><p className="mb-2 text-xs font-bold uppercase tracking-wide text-fam-magenta">{moduleName}</p><div className="space-y-1">{moduleItems.map((item) => <button key={item.lesson_id} type="button" onClick={() => setSelectedLessonId(item.lesson_id)} className={`flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors ${activeId === item.lesson_id ? "bg-fam-pink/10 font-semibold text-fam-plum" : "text-fam-night/70 hover:bg-fam-pink/5"}`}>{item.status === "concluida" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" /> : item.status === "em_andamento" ? <PlayCircle className="mt-0.5 h-4 w-4 shrink-0 text-fam-purple" aria-hidden="true" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-fam-night/30" aria-hidden="true" />}{item.lesson_title}</button>)}</div></div>)}</CardContent></Card><div className="rounded-xl border border-fam-gold/40 bg-fam-gold/10 p-4 text-xs leading-5 text-fam-night/75"><ShieldCheck className="mb-2 h-5 w-5 text-fam-plum" aria-hidden="true" />Você pode pausar e retomar quando quiser. O progresso é privado e não exige relato pessoal.</div></aside>
        <section aria-live="polite">{lessonLoading && <p role="status" className="text-sm text-muted">Carregando lição…</p>}{lesson && <Card className="border-fam-pink/20 shadow-sm"><CardHeader><p className="text-xs font-bold uppercase tracking-[0.18em] text-fam-magenta">Lição</p><CardTitle className="font-display text-2xl text-fam-plum">{lesson.title}</CardTitle>{lesson.objective && <p className="text-sm leading-6 text-fam-night/70"><strong>Objetivo:</strong> {lesson.objective}</p>}</CardHeader><CardContent className="space-y-6"><div className="prose prose-sm max-w-none whitespace-pre-line leading-7 text-fam-night/85">{lesson.content_main}</div>{lesson.audio_url && <div className="rounded-xl bg-fam-pink/5 p-4"><p className="mb-2 flex items-center gap-2 text-sm font-semibold text-fam-plum"><Headphones className="h-4 w-4" />Ouvir esta lição</p><audio controls className="w-full" src={lesson.audio_url}>Seu navegador não suporta áudio.</audio></div>}{lesson.video_url && <div className="aspect-video overflow-hidden rounded-xl bg-fam-night/10"><iframe title={`Vídeo: ${lesson.title}`} src={lesson.video_url} className="h-full w-full" allowFullScreen /></div>}{(lesson.content_pratica || lesson.content_reflexao) && <div className="grid gap-4 sm:grid-cols-2">{lesson.content_pratica && <div className="rounded-xl border border-fam-gold/40 bg-fam-gold/10 p-4"><h2 className="font-semibold text-fam-plum">Prática</h2><p className="mt-2 whitespace-pre-line text-sm leading-6 text-fam-night/75">{lesson.content_pratica}</p></div>}{lesson.content_reflexao && <div className="rounded-xl border border-fam-purple/20 bg-fam-purple/5 p-4"><h2 className="font-semibold text-fam-plum">Para revisar</h2><p className="mt-2 whitespace-pre-line text-sm leading-6 text-fam-night/75">{lesson.content_reflexao}</p></div>}</div>}<div className="flex flex-wrap items-center justify-between gap-3 border-t border-fam-plum/10 pt-5"><p className="text-xs text-fam-night/55">Aula {items.findIndex((item) => item.lesson_id === activeId) + 1} de {items.length}</p><Button disabled={updateProgress.isPending || currentItem?.status === "concluida"} onClick={() => updateProgress.mutate({ lessonId: lesson.id, status: "concluida" })} className="gap-2 bg-fam-plum hover:bg-fam-purple">{currentItem?.status === "concluida" ? <><CheckCircle2 className="h-4 w-4" />Concluída</> : "Marcar como concluída"}</Button></div></CardContent></Card>}</section>
      </div>
    </main>
  );
}
