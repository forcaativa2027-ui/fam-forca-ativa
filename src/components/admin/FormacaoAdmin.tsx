"use client";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { GraduationCap, Plus, Users, Award, Trash2, BookOpen, Landmark, Briefcase, Heart, Globe2, Sparkles, ChevronDown, ChevronRight, Layers, FileText, X, UserCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase/client";
import { useCourses, useCourseClasses, useEnrollments, useAllMembers, useCourseModules, useModuleLessons, useEscolas, useJornadas, useProgramas, useLessonAssessments } from "@/hooks/use-queries";
import * as Fo from "@/services/formacao";
import * as Ac from "@/services/academyContent";
import { CLASS_STATUS_LABELS, ENROLLMENT_STATUS_LABELS } from "@/services/formacao";
import type { Course, CourseClass, EnrollmentStatus, CourseModule, JornadaFormacao, CourseLesson } from "@/types/domain";

/**
 * CEC Academy — Escolas (estrutura organizacional dos cursos).
 * Reaproveita o campo `category` que já existia em Course — só
 * demos uma taxonomia própria e passamos a agrupar por ela, em vez
 * de deixar tudo numa lista única. Mantém as categorias antigas
 * ("lideranca"/"ministerial" soltos) funcionando, sem quebrar cursos
 * já cadastrados.
 */
export const ESCOLAS: { key: string; label: string; icon: typeof BookOpen }[] = [
  { key: "formacao_inicial", label: "Formação Inicial", icon: Sparkles },
  { key: "escola_biblica", label: "Escola Bíblica", icon: BookOpen },
  { key: "escola_teologica", label: "Escola Teológica", icon: Landmark },
  { key: "escola_ministerial", label: "Escola Ministerial", icon: Briefcase },
  { key: "escola_familia", label: "Escola da Família", icon: Heart },
  { key: "escola_missoes", label: "Escola de Missões", icon: Globe2 },
  { key: "outros", label: "Outros", icon: GraduationCap },
];
export const CATEGORY_LABELS: Record<string, string> = {
  formacao_inicial: "Formação Inicial", escola_biblica: "Escola Bíblica", escola_teologica: "Escola Teológica",
  escola_ministerial: "Escola Ministerial", escola_familia: "Escola da Família", escola_missoes: "Escola de Missões",
  // categorias antigas — mantidas só pra continuar exibindo cursos já cadastrados corretamente
  formacao_basica: "Formação Inicial", lideranca: "Escola Ministerial", ministerial: "Escola Ministerial",
};
/** Agrupa um curso já cadastrado (categoria antiga ou nova) na Escola certa pra exibição. */
export function escolaKeyOf(category: string | null): string {
  if (!category) return "outros";
  if (["formacao_inicial", "formacao_basica"].includes(category)) return "formacao_inicial";
  if (["escola_ministerial", "lideranca", "ministerial"].includes(category)) return "escola_ministerial";
  if (ESCOLAS.some((e) => e.key === category)) return category;
  return "outros";
}

export function FormacaoAdmin() {
  const { data: courses = [] } = useCourses();
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedClass, setSelectedClass] = useState<CourseClass | null>(null);
  const [showNewCourse, setShowNewCourse] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  if (selectedClass) return <ClassDetail cls={selectedClass} onBack={() => setSelectedClass(null)} />;
  if (selectedCourse) return <CourseDetail course={selectedCourse} onBack={() => setSelectedCourse(null)} onOpenClass={setSelectedClass} />;

  const groups = ESCOLAS.map((escola) => ({
    ...escola,
    courses: courses.filter((c) => escolaKeyOf(c.category) === escola.key),
  })).filter((g) => g.courses.length > 0);

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl text-navy flex items-center gap-2"><GraduationCap className="h-5 w-5 text-gold" />CEC Academy — Formação</h2>
          <p className="text-sm text-muted-foreground">Cursos organizados por Escola — Encontro com Deus, CTL, Escola de Líderes, TADEL, etc.</p>
        </div>
        <Button size="sm" onClick={() => setShowNewCourse(true)} className="gap-1.5"><Plus className="h-4 w-4" />Novo curso</Button>
      </div>

      {showNewCourse && <NewCourseForm onClose={() => setShowNewCourse(false)} />}

      <EscolaStructureManager />

      {groups.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Nenhum curso cadastrado ainda.</p>}

      <div className="space-y-3">
        {groups.map((g) => {
          const Icon = g.icon;
          const isCollapsed = collapsed[g.key];
          return (
            <div key={g.key} className="rounded-xl border bg-card">
              <button
                onClick={() => setCollapsed((c) => ({ ...c, [g.key]: !c[g.key] }))}
                className="flex w-full items-center justify-between p-3"
              >
                <span className="flex items-center gap-2 font-display text-base text-navy">
                  <Icon className="h-4 w-4 text-gold" />{g.label}
                  <span className="rounded-full bg-navy/10 px-2 py-0.5 text-[11px] font-bold text-navy">{g.courses.length}</span>
                </span>
                {isCollapsed ? <ChevronRight className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>
              {!isCollapsed && (
                <div className="grid gap-3 border-t p-3 sm:grid-cols-2 lg:grid-cols-3">
                  {g.courses.map((c) => (
                    <button key={c.id} onClick={() => setSelectedCourse(c)} className="text-left">
                      <Card className="h-full transition hover:shadow-md">
                        <CardContent className="pt-4">
                          <p className="font-semibold text-navy">{c.name}</p>
                          {c.description && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{c.description}</p>}
                          {!c.is_active && <span className="mt-1 inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">Inativo</span>}
                        </CardContent>
                      </Card>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NewCourseForm({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("formacao_inicial");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await Fo.createCourse(supabase, { name, category, description });
      qc.invalidateQueries({ queryKey: ["courses"] });
      onClose();
    } finally { setBusy(false); }
  }

  return (
    <Card><CardContent className="space-y-3 pt-4">
      <div><Label className="text-xs">Nome do curso</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Encontro com Deus" /></div>
      <div><Label className="text-xs">Escola</Label>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
          {ESCOLAS.filter((e) => e.key !== "outros").map((e) => <option key={e.key} value={e.key}>{e.label}</option>)}
        </select>
      </div>
      <div><Label className="text-xs">Descrição (opcional)</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} /></div>
      <div className="flex gap-2"><Button onClick={save} disabled={busy}>{busy ? "Salvando…" : "Criar curso"}</Button><Button variant="outline" onClick={onClose}>Cancelar</Button></div>
    </CardContent></Card>
  );
}

function CourseDetail({ course, onBack, onOpenClass }: { course: Course; onBack: () => void; onOpenClass: (c: CourseClass) => void }) {
  const qc = useQueryClient();
  const { data: classes = [] } = useCourseClasses(course.id);
  const [showNewClass, setShowNewClass] = useState(false);
  const [name, setName] = useState(""); const [startDate, setStartDate] = useState(""); const [endDate, setEndDate] = useState("");
  const [busy, setBusy] = useState(false);

  async function saveClass() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await Fo.createClass(supabase, { course_id: course.id, name, start_date: startDate || undefined, end_date: endDate || undefined });
      qc.invalidateQueries({ queryKey: ["course-classes", course.id] });
      setShowNewClass(false); setName(""); setStartDate(""); setEndDate("");
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-4 p-4">
      <button onClick={onBack} className="text-sm text-muted-foreground hover:text-navy">← Voltar pra Formação</button>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl text-navy">{course.name}</h2>
          {course.category && <p className="text-xs font-semibold text-gold">{CATEGORY_LABELS[course.category] ?? course.category}</p>}
        </div>
        <Button size="sm" onClick={() => setShowNewClass(true)} className="gap-1.5"><Plus className="h-4 w-4" />Nova turma</Button>
      </div>

      <CourseContentEditor course={course} />
      <CourseTutorPicker course={course} />
      <ModulesLessonsManager courseId={course.id} />

      {showNewClass && (
        <Card><CardContent className="space-y-3 pt-4">
          <div><Label className="text-xs">Nome da turma</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Turma Jan/2026" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Início</Label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
            <div><Label className="text-xs">Fim</Label><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
          </div>
          <div className="flex gap-2"><Button onClick={saveClass} disabled={busy}>{busy ? "Salvando…" : "Criar turma"}</Button><Button variant="outline" onClick={() => setShowNewClass(false)}>Cancelar</Button></div>
        </CardContent></Card>
      )}

      <div className="space-y-2">
        {classes.map((c) => (
          <button key={c.id} onClick={() => onOpenClass(c)} className="flex w-full items-center justify-between rounded-lg border bg-card p-3 text-left shadow-sm hover:shadow-md">
            <div>
              <p className="font-semibold text-navy">{c.name}</p>
              <p className="text-xs text-muted-foreground">{c.start_date ? new Date(c.start_date).toLocaleDateString("pt-BR") : "Sem data"}</p>
            </div>
            <span className="rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">{CLASS_STATUS_LABELS[c.status]}</span>
          </button>
        ))}
        {classes.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma turma criada ainda.</p>}
      </div>
    </div>
  );
}

function ClassDetail({ cls, onBack }: { cls: CourseClass; onBack: () => void }) {
  const qc = useQueryClient();
  const { data: enrollments = [] } = useEnrollments(cls.id);
  const { data: members = [] } = useAllMembers();
  const [query, setQuery] = useState("");
  const enrolledIds = new Set(enrollments.map((e) => e.member_id));
  const results = query.trim().length >= 2 ? members.filter((m) => !enrolledIds.has(m.id) && m.full_name.toLowerCase().includes(query.toLowerCase())).slice(0, 6) : [];

  async function addMember(memberId: string) {
    await Fo.enrollMember(supabase, cls.id, memberId);
    qc.invalidateQueries({ queryKey: ["enrollments", cls.id] });
    setQuery("");
  }

  async function setStatus(id: string, status: EnrollmentStatus) {
    await Fo.updateEnrollmentStatus(supabase, id, status);
    qc.invalidateQueries({ queryKey: ["enrollments", cls.id] });
  }

  async function setGrowth(id: string, field: "knowledge_level" | "practice_level" | "sharing_level", value: number) {
    await Fo.updateEnrollmentGrowth(supabase, id, { [field]: value });
    qc.invalidateQueries({ queryKey: ["enrollments", cls.id] });
  }

  async function remove(id: string) {
    await Fo.removeEnrollment(supabase, id);
    qc.invalidateQueries({ queryKey: ["enrollments", cls.id] });
  }

  return (
    <div className="space-y-4 p-4">
      <button onClick={onBack} className="text-sm text-muted-foreground hover:text-navy">← Voltar</button>
      <h2 className="font-display text-xl text-navy">{cls.name}</h2>

      <Card><CardContent className="pt-4">
        <Label className="text-xs">Adicionar participante</Label>
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nome…" />
        {results.length > 0 && (
          <div className="mt-1 space-y-1 rounded-md border p-1">
            {results.map((m) => (
              <button key={m.id} onClick={() => addMember(m.id)} className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-muted">{m.full_name}</button>
            ))}
          </div>
        )}
      </CardContent></Card>

      <div className="space-y-1.5">
        {enrollments.map((e) => (
          <div key={e.id} className="space-y-1.5 rounded-lg border bg-card p-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium text-navy">{e.member_name}</p>
                {e.certificate_issued && <Award className="h-3.5 w-3.5 text-gold" />}
              </div>
              <div className="flex items-center gap-1.5">
                <select value={e.status} onChange={(ev) => setStatus(e.id, ev.target.value as EnrollmentStatus)} className="h-8 rounded-md border bg-background px-2 text-xs">
                  {Object.entries(ENROLLMENT_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <Button size="sm" variant="ghost" className="text-red-500" onClick={() => remove(e.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 border-t pt-1.5 text-[11px] text-muted-foreground">
              <GrowthDots label="Conhecimento" value={e.knowledge_level} onChange={(v) => setGrowth(e.id, "knowledge_level", v)} />
              <GrowthDots label="Vivência" value={e.practice_level} onChange={(v) => setGrowth(e.id, "practice_level", v)} />
              <GrowthDots label="Compartilhamento" value={e.sharing_level} onChange={(v) => setGrowth(e.id, "sharing_level", v)} />
            </div>
          </div>
        ))}
        {enrollments.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Nenhum participante matriculado ainda.</p>}
      </div>
    </div>
  );
}

/** CEC Academy — metodologia de 5 dimensões (Conhecer/Refletir/Orar/Praticar/Compartilhar). */
function CourseContentEditor({ course }: { course: Course }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [conhecer, setConhecer] = useState(course.content_conhecer ?? "");
  const [refletir, setRefletir] = useState(course.content_refletir ?? "");
  const [orar, setOrar] = useState(course.content_orar ?? "");
  const [praticar, setPraticar] = useState(course.content_praticar ?? "");
  const [compartilhar, setCompartilhar] = useState(course.content_compartilhar ?? "");
  const [busy, setBusy] = useState(false);

  const filled = [course.content_conhecer, course.content_refletir, course.content_orar, course.content_praticar, course.content_compartilhar].filter(Boolean).length;

  async function save() {
    setBusy(true);
    try {
      await Fo.updateCourse(supabase, course.id, {
        content_conhecer: conhecer || null, content_refletir: refletir || null, content_orar: orar || null,
        content_praticar: praticar || null, content_compartilhar: compartilhar || null,
      });
      qc.invalidateQueries({ queryKey: ["courses"] });
      setOpen(false);
    } finally { setBusy(false); }
  }

  return (
    <Card>
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between p-3">
        <span className="font-display text-base text-navy">Conteúdo do curso — 5 dimensões</span>
        <span className="text-xs font-semibold text-muted-foreground">{filled}/5 preenchidas</span>
      </button>
      {open && (
        <CardContent className="space-y-3 border-t pt-3">
          <div><Label className="text-xs">📖 Conhecer — conteúdo principal</Label><Input value={conhecer} onChange={(e) => setConhecer(e.target.value)} placeholder="O que o aluno vai aprender…" /></div>
          <div><Label className="text-xs">💭 Refletir — perguntas abertas</Label><Input value={refletir} onChange={(e) => setRefletir(e.target.value)} placeholder="Perguntas pra reflexão…" /></div>
          <div><Label className="text-xs">🙏 Orar — momento de oração</Label><Input value={orar} onChange={(e) => setOrar(e.target.value)} placeholder="Sugestão de oração relacionada ao tema…" /></div>
          <div><Label className="text-xs">🙌 Praticar — missão da semana</Label><Input value={praticar} onChange={(e) => setPraticar(e.target.value)} placeholder="Uma ação prática pra colocar em prática…" /></div>
          <div><Label className="text-xs">🤝 Compartilhar — discussão em grupo</Label><Input value={compartilhar} onChange={(e) => setCompartilhar(e.target.value)} placeholder="O que discutir com o discipulador/grupo…" /></div>
          <Button size="sm" onClick={save} disabled={busy}>{busy ? "Salvando…" : "Salvar conteúdo"}</Button>
        </CardContent>
      )}
    </Card>
  );
}

/** CEC Academy Bloco 7 — Tutor do curso (acompanha dúvidas e progresso, diferente do Discipulador geral). */
function CourseTutorPicker({ course }: { course: Course }) {
  const qc = useQueryClient();
  const { data: members = [] } = useAllMembers();
  const [tutorId, setTutorId] = useState(course.tutor_id ?? "");
  const [busy, setBusy] = useState(false);
  const withProfile = members.filter((m) => m.profile_id);

  async function save(id: string) {
    setTutorId(id); setBusy(true);
    try {
      await Ac.setCourseTutor(supabase, course.id, id || null);
      qc.invalidateQueries({ queryKey: ["courses"] });
    } finally { setBusy(false); }
  }

  return (
    <Card>
      <CardContent className="flex items-center gap-3 pt-4">
        <UserCheck className="h-4 w-4 shrink-0 text-gold" />
        <div className="flex-1">
          <Label className="text-xs">Tutor do curso <span className="font-normal text-muted-foreground">(acompanha dúvidas e progresso — diferente do discipulador geral)</span></Label>
          <select value={tutorId} onChange={(e) => save(e.target.value)} disabled={busy} className="mt-1 h-9 w-full rounded-md border bg-background px-2 text-sm">
            <option value="">Nenhum tutor atribuído</option>
            {withProfile.map((m) => <option key={m.profile_id!} value={m.profile_id!}>{m.full_name}</option>)}
          </select>
        </div>
      </CardContent>
    </Card>
  );
}
function ModulesLessonsManager({ courseId }: { courseId: string }) {
  const qc = useQueryClient();
  const { data: modules = [] } = useCourseModules(courseId);
  const [newModuleName, setNewModuleName] = useState("");
  const [openModule, setOpenModule] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function addModule() {
    if (!newModuleName.trim()) return;
    setBusy(true);
    try {
      await Ac.createModule(supabase, { course_id: courseId, name: newModuleName, order_index: modules.length });
      setNewModuleName("");
      qc.invalidateQueries({ queryKey: ["course-modules", courseId] });
    } finally { setBusy(false); }
  }

  async function removeModule(id: string) {
    if (!confirm("Remover este módulo e todas as lições dele?")) return;
    await Ac.deleteModule(supabase, id);
    qc.invalidateQueries({ queryKey: ["course-modules", courseId] });
  }

  return (
    <Card>
      <CardContent className="space-y-3 pt-4">
        <p className="flex items-center gap-2 font-display text-base text-navy"><Layers className="h-4 w-4 text-gold" />Módulos e Lições</p>

        <div className="flex gap-2">
          <Input value={newModuleName} onChange={(e) => setNewModuleName(e.target.value)} placeholder="Nome do novo módulo…" onKeyDown={(e) => e.key === "Enter" && addModule()} />
          <Button size="sm" onClick={addModule} disabled={busy || !newModuleName.trim()} className="shrink-0 gap-1.5"><Plus className="h-4 w-4" />Módulo</Button>
        </div>

        <div className="space-y-2">
          {modules.map((m) => (
            <div key={m.id} className="rounded-lg border">
              <div className="flex items-center justify-between p-2.5">
                <button onClick={() => setOpenModule(openModule === m.id ? null : m.id)} className="flex flex-1 items-center gap-1.5 text-left text-sm font-semibold text-navy">
                  {openModule === m.id ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                  {m.name}
                </button>
                <Button size="sm" variant="ghost" className="text-red-500" onClick={() => removeModule(m.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
              {openModule === m.id && <LessonsManager module={m} />}
            </div>
          ))}
          {modules.length === 0 && <p className="py-4 text-center text-sm italic text-muted-foreground">Nenhum módulo ainda — crie o primeiro acima.</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function LessonsManager({ module: mod }: { module: CourseModule }) {
  const qc = useQueryClient();
  const { data: lessons = [] } = useModuleLessons(mod.id);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [objective, setObjective] = useState("");
  const [contentMain, setContentMain] = useState("");
  const [bibleRef, setBibleRef] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [reflexao, setReflexao] = useState("");
  const [oracao, setOracao] = useState("");
  const [pratica, setPratica] = useState("");
  const [compartilhar, setCompartilhar] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!title.trim()) return;
    setBusy(true);
    try {
      await Ac.createLesson(supabase, {
        module_id: mod.id, title, objective, content_main: contentMain, bible_reference: bibleRef,
        video_url: videoUrl, content_reflexao: reflexao, content_oracao: oracao,
        content_pratica: pratica, content_compartilhar: compartilhar, order_index: lessons.length,
      });
      setTitle(""); setObjective(""); setContentMain(""); setBibleRef(""); setVideoUrl("");
      setReflexao(""); setOracao(""); setPratica(""); setCompartilhar(""); setShowForm(false);
      qc.invalidateQueries({ queryKey: ["module-lessons", mod.id] });
    } finally { setBusy(false); }
  }

  async function removeLesson(id: string) {
    if (!confirm("Remover esta lição?")) return;
    await Ac.deleteLesson(supabase, id);
    qc.invalidateQueries({ queryKey: ["module-lessons", mod.id] });
  }

  return (
    <div className="space-y-2 border-t bg-muted/10 p-2.5">
      {lessons.map((l) => <LessonRow key={l.id} lesson={l} onRemove={() => removeLesson(l.id)} />)}

      {!showForm ? (
        <Button size="sm" variant="outline" onClick={() => setShowForm(true)} className="gap-1.5"><Plus className="h-3.5 w-3.5" />Nova lição</Button>
      ) : (
        <div className="space-y-2 rounded-lg border bg-card p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-gold">Nova lição</p>
            <button onClick={() => setShowForm(false)}><X className="h-4 w-4 text-muted-foreground" /></button>
          </div>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título da lição" />
          <Input value={objective} onChange={(e) => setObjective(e.target.value)} placeholder="🎯 Objetivo" />
          <Textarea value={contentMain} onChange={(e) => setContentMain(e.target.value)} placeholder="📖 Conteúdo principal" rows={3} />
          <Input value={bibleRef} onChange={(e) => setBibleRef(e.target.value)} placeholder="Texto bíblico-base (ex: João 3:16)" />
          <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="Link de vídeo (opcional)" />
          <Input value={reflexao} onChange={(e) => setReflexao(e.target.value)} placeholder="💭 Refletir — pergunta aberta" />
          <Input value={oracao} onChange={(e) => setOracao(e.target.value)} placeholder="🙏 Orar" />
          <Input value={pratica} onChange={(e) => setPratica(e.target.value)} placeholder="🙌 Praticar — missão da semana" />
          <Input value={compartilhar} onChange={(e) => setCompartilhar(e.target.value)} placeholder="🤝 Compartilhar" />
          <Button size="sm" onClick={save} disabled={busy || !title.trim()}>{busy ? "Salvando…" : "Salvar lição"}</Button>
        </div>
      )}
    </div>
  );
}

/** CEC Academy — gestão da hierarquia Escola → Jornada de Formação → Programa (opcional, avançado). */
function EscolaStructureManager() {
  const { data: escolas = [] } = useEscolas();
  const [open, setOpen] = useState(false);
  const [openEscola, setOpenEscola] = useState<string | null>(null);

  return (
    <Card>
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between p-3">
        <span className="font-display text-base text-navy">Estrutura avançada — Jornadas e Programas</span>
        {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && (
        <CardContent className="space-y-2 border-t pt-3">
          <p className="text-xs text-muted-foreground">Opcional — organize os cursos de uma Escola em Jornadas de Formação (ex: "Formação Bíblica Fundamental") e Programas (ex: "Novo Testamento") antes de criar os cursos. Cursos sem essa organização continuam funcionando normalmente, soltos direto na Escola.</p>
          {escolas.map((e) => (
            <div key={e.id} className="rounded-lg border">
              <button onClick={() => setOpenEscola(openEscola === e.id ? null : e.id)} className="flex w-full items-center gap-1.5 p-2.5 text-left text-sm font-semibold text-navy">
                {openEscola === e.id ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                {e.name}
              </button>
              {openEscola === e.id && <JornadasManager escolaId={e.id} />}
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
}

function JornadasManager({ escolaId }: { escolaId: string }) {
  const qc = useQueryClient();
  const { data: jornadas = [] } = useJornadas(escolaId);
  const [name, setName] = useState("");
  const [openJornada, setOpenJornada] = useState<string | null>(null);

  async function add() {
    if (!name.trim()) return;
    await Ac.createJornada(supabase, { escola_id: escolaId, name, order_index: jornadas.length });
    setName("");
    qc.invalidateQueries({ queryKey: ["jornadas", escolaId] });
  }
  async function remove(id: string) {
    if (!confirm("Remover esta Jornada e todos os Programas dela?")) return;
    await Ac.deleteJornada(supabase, id);
    qc.invalidateQueries({ queryKey: ["jornadas", escolaId] });
  }

  return (
    <div className="space-y-2 border-t bg-muted/10 p-2.5">
      <div className="flex gap-2">
        <Input value={name} onChange={(ev) => setName(ev.target.value)} placeholder="Nova Jornada de Formação…" onKeyDown={(ev) => ev.key === "Enter" && add()} />
        <Button size="sm" onClick={add} disabled={!name.trim()} className="shrink-0">Adicionar</Button>
      </div>
      {jornadas.map((j) => (
        <div key={j.id} className="rounded-md border bg-card">
          <div className="flex items-center justify-between p-2">
            <button onClick={() => setOpenJornada(openJornada === j.id ? null : j.id)} className="flex flex-1 items-center gap-1.5 text-left text-sm text-ink">
              {openJornada === j.id ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}{j.name}
            </button>
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-500" onClick={() => remove(j.id)}><Trash2 className="h-3 w-3" /></Button>
          </div>
          {openJornada === j.id && <ProgramasManager jornada={j} />}
        </div>
      ))}
    </div>
  );
}

function ProgramasManager({ jornada }: { jornada: JornadaFormacao }) {
  const qc = useQueryClient();
  const { data: programas = [] } = useProgramas(jornada.id);
  const { data: allCourses = [] } = useCourses();
  const [name, setName] = useState("");

  async function add() {
    if (!name.trim()) return;
    await Ac.createPrograma(supabase, { jornada_id: jornada.id, name, order_index: programas.length });
    setName("");
    qc.invalidateQueries({ queryKey: ["programas", jornada.id] });
  }
  async function remove(id: string) {
    if (!confirm("Remover este Programa?")) return;
    await Ac.deletePrograma(supabase, id);
    qc.invalidateQueries({ queryKey: ["programas", jornada.id] });
  }
  async function linkCourse(programaId: string, courseId: string) {
    if (!courseId) return;
    await Ac.linkCourseToPrograma(supabase, courseId, programaId);
    qc.invalidateQueries({ queryKey: ["courses"] });
  }

  return (
    <div className="space-y-2 border-t bg-muted/20 p-2">
      <div className="flex gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Novo Programa…" onKeyDown={(e) => e.key === "Enter" && add()} className="h-8 text-xs" />
        <Button size="sm" onClick={add} disabled={!name.trim()} className="h-8 shrink-0 text-xs">Adicionar</Button>
      </div>
      {programas.map((p) => (
        <div key={p.id} className="rounded border bg-card p-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-navy">{p.name}</span>
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-500" onClick={() => remove(p.id)}><Trash2 className="h-3 w-3" /></Button>
          </div>
          <select
            defaultValue=""
            onChange={(e) => linkCourse(p.id, e.target.value)}
            className="mt-1.5 h-7 w-full rounded border bg-background px-1.5 text-[11px]"
          >
            <option value="" disabled>+ Vincular curso existente…</option>
            {allCourses.filter((c) => c.programa_id !== p.id).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <ul className="mt-1 space-y-0.5">
            {allCourses.filter((c) => c.programa_id === p.id).map((c) => (
              <li key={c.id} className="text-[11px] text-muted-foreground">• {c.name}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/** CEC Academy Bloco 7 — linha de uma lição, com gestão de Avaliação (pergunta de múltipla escolha) expansível. */
function LessonRow({ lesson, onRemove }: { lesson: CourseLesson; onRemove: () => void }) {
  const qc = useQueryClient();
  const { data: assessments = [] } = useLessonAssessments(lesson.id);
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", "", ""]);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [busy, setBusy] = useState(false);

  async function addQuestion() {
    const cleaned = options.map((o) => o.trim()).filter(Boolean);
    if (!question.trim() || cleaned.length < 2) return;
    setBusy(true);
    try {
      await Ac.createAssessment(supabase, { lesson_id: lesson.id, question, options: cleaned, correct_index: correctIndex, order_index: assessments.length });
      setQuestion(""); setOptions(["", "", ""]); setCorrectIndex(0);
      qc.invalidateQueries({ queryKey: ["lesson-assessments", lesson.id] });
    } finally { setBusy(false); }
  }
  async function removeQuestion(id: string) {
    await Ac.deleteAssessment(supabase, id);
    qc.invalidateQueries({ queryKey: ["lesson-assessments", lesson.id] });
  }

  return (
    <div className="rounded-md border bg-card">
      <div className="flex items-center justify-between px-2.5 py-1.5">
        <button onClick={() => setOpen((v) => !v)} className="flex flex-1 items-center gap-1.5 text-left text-sm text-ink">
          <FileText className="h-3.5 w-3.5 text-muted-foreground" />{lesson.title}
          {assessments.length > 0 && <span className="rounded-full bg-gold/20 px-1.5 py-0.5 text-[10px] font-bold text-navy">{assessments.length} pergunta(s)</span>}
        </button>
        <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-500" onClick={onRemove}><Trash2 className="h-3 w-3" /></Button>
      </div>
      {open && (
        <div className="space-y-2 border-t bg-muted/20 p-2.5">
          {assessments.map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded border bg-background p-2 text-xs">
              <span>{a.question}</span>
              <button onClick={() => removeQuestion(a.id)}><Trash2 className="h-3 w-3 text-red-400" /></button>
            </div>
          ))}
          <div className="space-y-1.5 rounded border p-2">
            <p className="text-[11px] font-bold uppercase text-gold">Nova pergunta de avaliação</p>
            <Input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Pergunta…" className="h-8 text-xs" />
            {options.map((o, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <input type="radio" checked={correctIndex === i} onChange={() => setCorrectIndex(i)} title="Marcar como resposta certa" />
                <Input value={o} onChange={(e) => { const next = [...options]; next[i] = e.target.value; setOptions(next); }} placeholder={`Opção ${i + 1}`} className="h-8 text-xs" />
              </div>
            ))}
            <Button size="sm" onClick={addQuestion} disabled={busy} className="h-7 text-xs">Adicionar pergunta</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function GrowthDots({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <span className="flex items-center gap-1">
      {label}:
      {[1, 2, 3].map((n) => (
        <button key={n} onClick={() => onChange(value === n ? n - 1 : n)} title={`${label}: ${n}/3`}
          className={`h-2.5 w-2.5 rounded-full transition ${n <= value ? "bg-gold" : "bg-border"}`} />
      ))}
    </span>
  );
}
