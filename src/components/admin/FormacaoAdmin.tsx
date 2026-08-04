"use client";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { GraduationCap, Plus, Users, Award, Trash2, BookOpen, Landmark, Briefcase, Heart, Globe2, Sparkles, ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase/client";
import { useCourses, useCourseClasses, useEnrollments, useAllMembers } from "@/hooks/use-queries";
import * as Fo from "@/services/formacao";
import { CLASS_STATUS_LABELS, ENROLLMENT_STATUS_LABELS } from "@/services/formacao";
import type { Course, CourseClass, EnrollmentStatus } from "@/types/domain";

/**
 * CEC Academy — Escolas (estrutura organizacional dos cursos).
 * Reaproveita o campo `category` que já existia em Course — só
 * demos uma taxonomia própria e passamos a agrupar por ela, em vez
 * de deixar tudo numa lista única. Mantém as categorias antigas
 * ("lideranca"/"ministerial" soltos) funcionando, sem quebrar cursos
 * já cadastrados.
 */
const ESCOLAS: { key: string; label: string; icon: typeof BookOpen }[] = [
  { key: "formacao_inicial", label: "Formação Inicial", icon: Sparkles },
  { key: "escola_biblica", label: "Escola Bíblica", icon: BookOpen },
  { key: "escola_teologica", label: "Escola Teológica", icon: Landmark },
  { key: "escola_ministerial", label: "Escola Ministerial", icon: Briefcase },
  { key: "escola_familia", label: "Escola da Família", icon: Heart },
  { key: "escola_missoes", label: "Escola de Missões", icon: Globe2 },
  { key: "outros", label: "Outros", icon: GraduationCap },
];
const CATEGORY_LABELS: Record<string, string> = {
  formacao_inicial: "Formação Inicial", escola_biblica: "Escola Bíblica", escola_teologica: "Escola Teológica",
  escola_ministerial: "Escola Ministerial", escola_familia: "Escola da Família", escola_missoes: "Escola de Missões",
  // categorias antigas — mantidas só pra continuar exibindo cursos já cadastrados corretamente
  formacao_basica: "Formação Inicial", lideranca: "Escola Ministerial", ministerial: "Escola Ministerial",
};
/** Agrupa um curso já cadastrado (categoria antiga ou nova) na Escola certa pra exibição. */
function escolaKeyOf(category: string | null): string {
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
