"use client";
import { useState, useEffect } from "react";
import { GraduationCap, Map, ChevronDown, ChevronRight, ArrowLeft, CheckCircle2, Circle, PlayCircle, BookOpen as BibleIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";
import { useCourses, useCourseModules, useCourseContent, useMyProfile } from "@/hooks/use-queries";
import { ESCOLAS, escolaKeyOf } from "@/components/admin/FormacaoAdmin";
import * as Ac from "@/services/academyContent";
import * as Journal from "@/services/formationJournal";
import type { Member, Course, CourseContentItem } from "@/types/domain";

/**
 * CEC Academy — aba própria do membro (Reestruturação Arquitetural):
 * "Todo aprendizado acontece na Academy. Toda transformação é
 * registrada na Jornada." Aqui o membro navega pelas Escolas,
 * cursos, módulos e lições; o histórico/diário continua na aba Jornada.
 */
export function AcademyTab({ member, onGoToJourney }: { member: Member | null; onGoToJourney: () => void }) {
  const { data: courses = [] } = useCourses();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [openCourse, setOpenCourse] = useState<Course | null>(null);

  const active = courses.filter((c) => c.is_active);
  const groups = ESCOLAS.map((escola) => ({
    ...escola,
    courses: active.filter((c) => escolaKeyOf(c.category) === escola.key),
  })).filter((g) => g.courses.length > 0);

  if (openCourse) return <CourseContentViewer course={openCourse} onBack={() => setOpenCourse(null)} />;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5 text-gold" />CEC Academy</CardTitle>
          <CardDescription>Trilhas, escolas e cursos disponíveis pra sua formação contínua.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {groups.length === 0 && <p className="py-6 text-center text-sm italic text-muted-foreground">Nenhum curso disponível no momento.</p>}
          {groups.map((g) => {
            const Icon = g.icon;
            const isCollapsed = collapsed[g.key];
            return (
              <div key={g.key} className="rounded-xl border">
                <button onClick={() => setCollapsed((c) => ({ ...c, [g.key]: !c[g.key] }))} className="flex w-full items-center justify-between p-3">
                  <span className="flex items-center gap-2 font-display text-base text-navy">
                    <Icon className="h-4 w-4 text-gold" />{g.label}
                    <span className="rounded-full bg-navy/10 px-2 py-0.5 text-[11px] font-bold text-navy">{g.courses.length}</span>
                  </span>
                  {isCollapsed ? <ChevronRight className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>
                {!isCollapsed && (
                  <div className="space-y-1.5 border-t p-3">
                    {g.courses.map((c) => (
                      <button key={c.id} onClick={() => setOpenCourse(c)} className="block w-full rounded-lg border p-2.5 text-left transition hover:border-gold/50 hover:shadow-sm">
                        <p className="text-sm font-semibold text-navy">{c.name}</p>
                        {c.description && <p className="text-xs text-muted-foreground">{c.description}</p>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <button onClick={onGoToJourney}
        className="flex w-full items-center justify-between rounded-xl border bg-card p-3 text-sm text-navy hover:bg-accent">
        <span className="flex items-center gap-2"><Map className="h-4 w-4 text-gold" />Ver meu histórico e Diário de Formação na Jornada</span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  );
}

/** Módulos → Lições de um curso, com progresso e continuidade de onde o aluno parou. */
function CourseContentViewer({ course, onBack }: { course: Course; onBack: () => void }) {
  const { data: me } = useMyProfile();
  const { data: content = [], refetch } = useCourseContent(course.id, me?.id ?? null);
  const [openLesson, setOpenLesson] = useState<CourseContentItem | null>(null);

  // Agrupa por módulo, mantendo a ordem
  const moduleIds = Array.from(new Set(content.map((c) => c.module_id)));
  const modules = moduleIds.map((id) => ({
    id, name: content.find((c) => c.module_id === id)?.module_name ?? "",
    lessons: content.filter((c) => c.module_id === id),
  }));

  // Próxima lição não concluída — "continuar de onde parei"
  const nextLesson = content.find((c) => c.status !== "concluida");

  if (openLesson) {
    return <LessonViewer item={openLesson} profileId={me?.id ?? null} onBack={() => { setOpenLesson(null); refetch(); }} />;
  }

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-navy"><ArrowLeft className="h-4 w-4" />Voltar pra Academy</button>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-navy">{course.name}</CardTitle>
          {course.description && <CardDescription>{course.description}</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-3">
          {nextLesson && (
            <Button onClick={() => setOpenLesson(nextLesson)} className="w-full gap-1.5">
              <PlayCircle className="h-4 w-4" />
              {content.every((c) => c.status === "nao_iniciada") ? "Começar" : "Continuar de onde parei"} — {nextLesson.lesson_title}
            </Button>
          )}

          {modules.length === 0 && <p className="py-6 text-center text-sm italic text-muted-foreground">Esse curso ainda não tem conteúdo cadastrado.</p>}

          {modules.map((m) => (
            <div key={m.id} className="rounded-lg border">
              <p className="border-b bg-muted/20 px-3 py-2 text-sm font-bold text-navy">{m.name}</p>
              <div className="divide-y">
                {m.lessons.map((l) => (
                  <button key={l.lesson_id} onClick={() => setOpenLesson(l)} className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left hover:bg-accent">
                    {l.status === "concluida" ? <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" /> : <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />}
                    <span className={`text-sm ${l.status === "concluida" ? "text-muted-foreground line-through" : "text-ink"}`}>{l.lesson_title}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function LessonViewer({ item, profileId, onBack }: { item: CourseContentItem; profileId: string | null; onBack: () => void }) {
  const [lesson, setLesson] = useState<import("@/types/domain").CourseLesson | null>(null);
  const [busy, setBusy] = useState(false);
  const [journaled, setJournaled] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("course_lessons").select("*").eq("id", item.lesson_id).maybeSingle();
      setLesson(data as import("@/types/domain").CourseLesson | null);
      if (profileId) Ac.startLesson(supabase, item.lesson_id, profileId).catch(() => {});
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.lesson_id]);

  async function markComplete() {
    if (!profileId) return;
    setBusy(true);
    try {
      await Ac.completeLesson(supabase, item.lesson_id, profileId);
      // Consolida automaticamente no Diário de Formação (Bloco 1 §1.3 — fluxo Academy → Jornada)
      await Journal.createJournalEntry(supabase, {
        profile_id: profileId, entry_type: "aprendizado",
        content: `Concluí a lição "${item.lesson_title}".`, is_private: true,
      });
      setJournaled(true);
      setTimeout(onBack, 1200);
    } finally { setBusy(false); }
  }

  if (!lesson) return <p className="py-8 text-center text-sm text-muted-foreground">Carregando lição…</p>;

  return (
    <div className="space-y-3">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-navy"><ArrowLeft className="h-4 w-4" />Voltar pro curso</button>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-navy">{lesson.title}</CardTitle>
          {lesson.objective && <CardDescription>🎯 {lesson.objective}</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-4">
          {lesson.bible_reference && (
            <div className="flex items-center gap-2 rounded-md bg-gold/10 px-3 py-2 text-sm font-semibold text-navy"><BibleIcon className="h-4 w-4 text-gold" />{lesson.bible_reference}</div>
          )}
          {lesson.content_main && <p className="whitespace-pre-wrap text-sm text-ink">{lesson.content_main}</p>}
          {lesson.video_url && (
            <a href={lesson.video_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm font-semibold text-navy underline"><PlayCircle className="h-4 w-4 text-gold" />Assistir vídeo</a>
          )}
          {lesson.content_reflexao && <LessonBlock icon="💭" label="Refletir" text={lesson.content_reflexao} />}
          {lesson.content_oracao && <LessonBlock icon="🙏" label="Orar" text={lesson.content_oracao} />}
          {lesson.content_pratica && <LessonBlock icon="🙌" label="Praticar" text={lesson.content_pratica} />}
          {lesson.content_compartilhar && <LessonBlock icon="🤝" label="Compartilhar" text={lesson.content_compartilhar} />}

          {journaled ? (
            <p className="text-sm font-semibold text-green-700">✓ Lição concluída — registrado no seu Diário de Formação!</p>
          ) : (
            <Button onClick={markComplete} disabled={busy} className="w-full gap-1.5"><CheckCircle2 className="h-4 w-4" />{busy ? "Salvando…" : "Concluir lição"}</Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function LessonBlock({ icon, label, text }: { icon: string; label: string; text: string }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-gold">{icon} {label}</p>
      <p className="mt-1 text-sm text-ink">{text}</p>
    </div>
  );
}
