"use client";
import { useState, useEffect } from "react";
import { GraduationCap, Map, ChevronDown, ChevronRight, ArrowLeft, CheckCircle2, Circle, PlayCircle, BookOpen as BibleIcon, UserCheck, Award, Compass, Settings2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";
import { useCourses, useCourseModules, useCourseContent, useMyProfile, useEscolas, useEscolaTree, useMyTutoringCourses, useMyCertificates } from "@/hooks/use-queries";
import { ESCOLAS, escolaKeyOf } from "@/components/admin/FormacaoAdmin";
import * as Ac from "@/services/academyContent";
import * as Journal from "@/services/formationJournal";
import { KnowledgeExplorer } from "./KnowledgeExplorer";
import { AcademyModeBanner, AcademyModeSelector } from "./AcademyModeSelector";
import { AcademyTTSControls, AcademyHighlightedText, AcademyVoiceButton } from "./AcademyTTS";
import { useTTS } from "@/hooks/useTTS";
import { useOffline } from "@/hooks/useOffline";
import { AcademyOfflineIndicator, AcademyDownloadButton } from "./AcademyOffline";
import type { Member, Course, CourseContentItem } from "@/types/domain";

/**
 * CEC Academy — aba própria do membro (Reestruturação Arquitetural):
 * "Todo aprendizado acontece na Academy. Toda transformação é
 * registrada na Jornada." Aqui o membro navega pelas Escolas,
 * cursos, módulos e lições; o histórico/diário continua na aba Jornada.
 */
export function AcademyTab({ member, onGoToJourney }: { member: Member | null; onGoToJourney: () => void }) {
  const { data: courses = [] } = useCourses();
  const { data: dbEscolas = [] } = useEscolas();
  const { data: me } = useMyProfile();
  const offline = useOffline(me?.id ?? null);
  const { data: tutoring = [] } = useMyTutoringCourses(me?.id ?? null);
  const { data: certificates = [] } = useMyCertificates(me?.id ?? null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [openCourse, setOpenCourse] = useState<Course | null>(null);
  const [showExplorer, setShowExplorer] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false);

  const active = courses.filter((c) => c.is_active);
  const groups = ESCOLAS.map((escola) => ({
    ...escola,
    dbId: dbEscolas.find((e) => e.slug === escola.key)?.id ?? null,
    // "avulsos" = cursos dessa escola que ainda não foram organizados numa Jornada/Programa
    courses: active.filter((c) => escolaKeyOf(c.category) === escola.key && !c.programa_id),
  })).filter((g) => g.courses.length > 0 || g.dbId);

  if (openCourse) return <CourseContentViewer course={openCourse} offline={offline} onBack={() => setOpenCourse(null)} />;
  if (showExplorer) return <KnowledgeExplorer onBack={() => setShowExplorer(false)} />;

  return (
    <div className="space-y-4">
      <AcademyOfflineIndicator offline={offline} />
      <AcademyModeBanner profileId={me?.id ?? null} onOpenSelector={() => setShowModeSelector(true)} />
      <button onClick={() => setShowModeSelector(true)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-navy">
        <Settings2 className="h-3.5 w-3.5" />Ajustar modo educacional (Individual, Família, Life Group…)
      </button>
      {showModeSelector && <AcademyModeSelector profileId={me?.id ?? null} onClose={() => setShowModeSelector(false)} />}

      {tutoring.length > 0 && (
        <Card className="border-2 border-gold/40">
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><UserCheck className="h-4 w-4 text-gold" />Minhas Tutorias</CardTitle></CardHeader>
          <CardContent className="space-y-1.5 pt-0">
            {tutoring.map((t) => (
              <div key={t.course_id} className="flex items-center justify-between rounded-md border p-2 text-sm">
                <span className="text-navy">{t.course_name}</span>
                <span className="text-xs text-muted-foreground">{t.alunos_concluidos}/{t.total_alunos} concluíram</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {certificates.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Award className="h-4 w-4 text-gold" />Meus Certificados</CardTitle></CardHeader>
          <CardContent className="space-y-1.5 pt-0">
            {certificates.map((c) => {
              const courseName = courses.find((co) => co.id === c.course_id)?.name ?? "Curso";
              return (
                <div key={c.id} className="flex items-center justify-between rounded-md border bg-gold/5 p-2 text-sm">
                  <span className="text-navy">{courseName}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">{c.certificate_code}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <button onClick={() => setShowExplorer(true)}
        className="flex w-full items-center justify-between rounded-xl border-2 border-gold/40 bg-gold/5 p-3.5 text-left transition hover:border-gold/60">
        <span className="flex items-center gap-2 text-sm font-bold text-navy"><Compass className="h-5 w-5 text-gold" />Explorar o Conhecimento Bíblico</span>
        <span className="text-xs text-muted-foreground">Lugares, personagens, linha do tempo, arqueologia…</span>
      </button>

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
                    {g.dbId && <EscolaTreeView escolaId={g.dbId} onOpenCourse={setOpenCourse} />}
                    {g.courses.length > 0 && (
                      <div className="space-y-1.5">
                        {g.dbId && <p className="pt-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Outros cursos</p>}
                        {g.courses.map((c) => (
                          <button key={c.id} onClick={() => setOpenCourse(c)} className="block w-full rounded-lg border p-2.5 text-left transition hover:border-gold/50 hover:shadow-sm">
                            <p className="text-sm font-semibold text-navy">{c.name}</p>
                            {c.description && <p className="text-xs text-muted-foreground">{c.description}</p>}
                          </button>
                        ))}
                      </div>
                    )}
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

/** Mostra a árvore Jornada de Formação → Programa → Curso de uma Escola. */
function EscolaTreeView({ escolaId, onOpenCourse }: { escolaId: string; onOpenCourse: (c: Course) => void }) {
  const { data: tree = [] } = useEscolaTree(escolaId);
  const { data: allCourses = [] } = useCourses();
  const [openJornada, setOpenJornada] = useState<string | null>(null);

  const jornadaIds = Array.from(new Set(tree.map((t) => t.jornada_id)));
  if (jornadaIds.length === 0) return null;

  return (
    <div className="space-y-1.5">
      {jornadaIds.map((jid) => {
        const jRows = tree.filter((t) => t.jornada_id === jid);
        const jName = jRows[0]?.jornada_name ?? "";
        const programaIds = Array.from(new Set(jRows.filter((r) => r.programa_id).map((r) => r.programa_id as string)));
        const isOpen = openJornada === jid;
        return (
          <div key={jid} className="rounded-lg border border-gold/30 bg-gold/5">
            <button onClick={() => setOpenJornada(isOpen ? null : jid)} className="flex w-full items-center justify-between p-2.5 text-left">
              <span className="text-sm font-bold text-navy">🧭 {jName}</span>
              {isOpen ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
            </button>
            {isOpen && (
              <div className="space-y-1.5 border-t p-2.5">
                {programaIds.map((pid) => {
                  const pRows = jRows.filter((r) => r.programa_id === pid);
                  const pName = pRows[0]?.programa_name ?? "";
                  const cursos = allCourses.filter((c) => c.programa_id === pid && c.is_active);
                  return (
                    <div key={pid} className="rounded-md border bg-card p-2">
                      <p className="text-xs font-bold uppercase tracking-wide text-gold">{pName}</p>
                      <div className="mt-1 space-y-1">
                        {cursos.map((c) => (
                          <button key={c.id} onClick={() => onOpenCourse(c)} className="block w-full rounded border p-2 text-left text-xs hover:border-gold/50">
                            {c.name}
                          </button>
                        ))}
                        {cursos.length === 0 && <p className="text-[11px] italic text-muted-foreground">Nenhum curso ainda neste programa.</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Módulos → Lições de um curso, com progresso e continuidade de onde o aluno parou. */
function CourseContentViewer({ course, offline, onBack }: { course: Course; offline: ReturnType<typeof useOffline>; onBack: () => void }) {
  const { data: me } = useMyProfile();
  const { data: onlineContent = [], refetch } = useCourseContent(course.id, me?.id ?? null);
  const [openLesson, setOpenLesson] = useState<CourseContentItem | null>(null);
  const [offlineCourse, setOfflineCourse] = useState<import("@/services/offlineStorage").OfflineCourse | null>(null);

  const usingOffline = !offline.isOnline && offline.isCourseDownloaded(course.id);

  useEffect(() => {
    if (usingOffline) {
      import("@/services/offlineStorage").then((m) => m.getCourseOffline(course.id)).then(setOfflineCourse);
    }
  }, [usingOffline, course.id]);

  // Modo offline: monta a lista a partir do que foi baixado (sem status de progresso, que exige o servidor)
  const content: CourseContentItem[] = usingOffline && offlineCourse
    ? offlineCourse.lessons.map((l) => ({
        module_id: l.module_id, module_name: l.module_name, module_order: 0,
        lesson_id: l.id, lesson_title: l.title, lesson_order: 0, status: "nao_iniciada", completed_at: null,
      }))
    : onlineContent;

  // Agrupa por módulo, mantendo a ordem
  const moduleIds = Array.from(new Set(content.map((c) => c.module_id)));
  const modules = moduleIds.map((id) => ({
    id, name: content.find((c) => c.module_id === id)?.module_name ?? "",
    lessons: content.filter((c) => c.module_id === id),
  }));

  // Próxima lição não concluída — "continuar de onde parei"
  const nextLesson = content.find((c) => c.status !== "concluida");

  if (openLesson) {
    return <LessonViewer item={openLesson} profileId={me?.id ?? null} courseId={course.id} offline={offline} onBack={() => { setOpenLesson(null); refetch(); }} />;
  }

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-navy"><ArrowLeft className="h-4 w-4" />Voltar pra Academy</button>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="text-lg text-navy">{course.name}</CardTitle>
              {course.description && <CardDescription>{course.description}</CardDescription>}
            </div>
            <AcademyDownloadButton offline={offline} courseId={course.id} courseName={course.name} courseDescription={course.description} />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {usingOffline && !offlineCourse && <p className="text-sm text-muted-foreground">Carregando conteúdo baixado…</p>}

          {nextLesson && (
            <Button onClick={() => setOpenLesson(nextLesson)} className="w-full gap-1.5">
              <PlayCircle className="h-4 w-4" />
              {content.every((c) => c.status === "nao_iniciada") ? "Começar" : "Continuar de onde parei"} — {nextLesson.lesson_title}
            </Button>
          )}

          {modules.length === 0 && !usingOffline && <p className="py-6 text-center text-sm italic text-muted-foreground">Esse curso ainda não tem conteúdo cadastrado.</p>}

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

function LessonViewer({ item, profileId, courseId, offline, onBack }: { item: CourseContentItem; profileId: string | null; courseId: string; offline: ReturnType<typeof useOffline>; onBack: () => void }) {
  const [lesson, setLesson] = useState<import("@/types/domain").CourseLesson | null>(null);
  const [assessments, setAssessments] = useState<import("@/types/domain").LessonAssessment[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [journaled, setJournaled] = useState(false);
  const [queuedOffline, setQueuedOffline] = useState(false);
  const [certificateCode, setCertificateCode] = useState<string | null>(null);
  const tts = useTTS(profileId);

  useEffect(() => {
    (async () => {
      if (!offline.isOnline) {
        const { getCourseOffline } = await import("@/services/offlineStorage");
        const cached = await getCourseOffline(courseId);
        const found = cached?.lessons.find((l) => l.id === item.lesson_id);
        if (found) {
          setLesson({ ...found, module_id: found.module_id, order_index: 0, created_at: "", audio_url: null } as import("@/types/domain").CourseLesson);
          setAssessments([]); // avaliações não ficam disponíveis offline nessa primeira fase
          return;
        }
      }
      const { data } = await supabase.from("course_lessons").select("*").eq("id", item.lesson_id).maybeSingle();
      setLesson(data as import("@/types/domain").CourseLesson | null);
      const qs = await Ac.listLessonAssessments(supabase, item.lesson_id);
      setAssessments(qs);
      if (profileId) Ac.startLesson(supabase, item.lesson_id, profileId).catch(() => {});
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.lesson_id]);

  const pendingAnswers = assessments.some((a) => answers[a.id] === undefined);

  const ttsBlocks = lesson ? [
    lesson.content_main && { id: "content_main", label: "Conteúdo", text: lesson.content_main },
    lesson.content_reflexao && { id: "content_reflexao", label: "Refletir", text: lesson.content_reflexao },
    lesson.content_oracao && { id: "content_oracao", label: "Orar", text: lesson.content_oracao },
    lesson.content_pratica && { id: "content_pratica", label: "Praticar", text: lesson.content_pratica },
    lesson.content_compartilhar && { id: "content_compartilhar", label: "Compartilhar", text: lesson.content_compartilhar },
  ].filter(Boolean) as { id: string; label: string; text: string }[] : [];

  function handleVoiceCommand(action: string) {
    if (action === "ler") tts.read(ttsBlocks);
    else if (action === "pausar") tts.pause();
    else if (action === "continuar") tts.resume();
    else if (action === "parar") tts.stop();
    else if (action === "voltar") onBack();
    else if (action === "concluir" && !pendingAnswers) markComplete();
  }

  async function markComplete() {
    if (!profileId) return;
    setBusy(true);
    try {
      // Registra as respostas da avaliação, se houver (só disponível online)
      for (const a of assessments) {
        const selected = answers[a.id];
        if (selected === undefined) continue;
        await Ac.submitAttempt(supabase, { profile_id: profileId, assessment_id: a.id, selected_index: selected, is_correct: selected === a.correct_index });
      }
      const result = await offline.completeLessonOfflineAware(item.lesson_id, profileId, courseId);
      if (result === "synced") {
        // Consolida automaticamente no Diário de Formação (Bloco 1 §1.3 — fluxo Academy → Jornada)
        await Journal.createJournalEntry(supabase, {
          profile_id: profileId, entry_type: "aprendizado",
          content: `Concluí a lição "${item.lesson_title}".`, is_private: true,
        });
        // Bloco 7 — emite certificado automaticamente se o curso todo já foi concluído
        const code = await Ac.maybeIssueCertificate(supabase, courseId, profileId);
        if (code) setCertificateCode(code);
        setJournaled(true);
      } else {
        setQueuedOffline(true);
      }
      setTimeout(onBack, certificateCode ? 2500 : 1200);
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
          <div className="flex flex-wrap items-center justify-between gap-2">
            <AcademyTTSControls tts={tts} blocks={ttsBlocks} />
            <AcademyVoiceButton onCommand={handleVoiceCommand} />
          </div>

          {lesson.bible_reference && (
            <div className="flex items-center gap-2 rounded-md bg-gold/10 px-3 py-2 text-sm font-semibold text-navy"><BibleIcon className="h-4 w-4 text-gold" />{lesson.bible_reference}</div>
          )}
          {lesson.content_main && <AcademyHighlightedText text={lesson.content_main} blockId="content_main" tts={tts} className="whitespace-pre-wrap text-sm text-ink" />}
          {lesson.video_url && (
            <a href={lesson.video_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm font-semibold text-navy underline"><PlayCircle className="h-4 w-4 text-gold" />Assistir vídeo</a>
          )}
          {lesson.content_reflexao && <LessonBlock icon="💭" label="Refletir" text={lesson.content_reflexao} blockId="content_reflexao" tts={tts} />}
          {lesson.content_oracao && <LessonBlock icon="🙏" label="Orar" text={lesson.content_oracao} blockId="content_oracao" tts={tts} />}
          {lesson.content_pratica && <LessonBlock icon="🙌" label="Praticar" text={lesson.content_pratica} blockId="content_pratica" tts={tts} />}
          {lesson.content_compartilhar && <LessonBlock icon="🤝" label="Compartilhar" text={lesson.content_compartilhar} blockId="content_compartilhar" tts={tts} />}

          {assessments.length > 0 && (
            <div className="space-y-3 rounded-lg border border-gold/40 bg-gold/5 p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-gold">✏️ Avaliação</p>
              {assessments.map((a) => (
                <div key={a.id}>
                  <p className="text-sm font-semibold text-navy">{a.question}</p>
                  <div className="mt-1.5 space-y-1">
                    {a.options.map((opt, i) => (
                      <button key={i} onClick={() => setAnswers((v) => ({ ...v, [a.id]: i }))}
                        className={`block w-full rounded-md border px-2.5 py-1.5 text-left text-sm transition ${answers[a.id] === i ? "border-gold bg-gold/20 font-semibold text-navy" : "border-border text-ink hover:border-gold/40"}`}>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {certificateCode && (
            <div className="rounded-lg border-2 border-gold bg-gold/10 p-4 text-center">
              <p className="text-2xl">🏆</p>
              <p className="mt-1 font-display text-lg text-navy">Certificado emitido!</p>
              <p className="text-xs text-muted-foreground">Você concluiu 100% do curso. Código: <span className="font-mono font-bold">{certificateCode}</span></p>
            </div>
          )}

          {journaled ? (
            <p className="text-sm font-semibold text-green-700">✓ Lição concluída — registrado no seu Diário de Formação!</p>
          ) : queuedOffline ? (
            <p className="text-sm font-semibold text-amber-700">✓ Concluída! Vamos sincronizar assim que você ficar online de novo.</p>
          ) : (
            <Button onClick={markComplete} disabled={busy || pendingAnswers} className="w-full gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              {busy ? "Salvando…" : pendingAnswers ? "Responda a avaliação pra continuar" : "Concluir lição"}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function LessonBlock({ icon, label, text, blockId, tts }: { icon: string; label: string; text: string; blockId?: string; tts?: ReturnType<typeof useTTS> }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-gold">{icon} {label}</p>
      {blockId && tts ? (
        <AcademyHighlightedText text={text} blockId={blockId} tts={tts} className="mt-1 text-sm text-ink" />
      ) : (
        <p className="mt-1 text-sm text-ink">{text}</p>
      )}
    </div>
  );
}
