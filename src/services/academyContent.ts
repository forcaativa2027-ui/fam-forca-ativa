"use client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Escola, CourseModule, CourseLesson, CourseContentItem, JornadaFormacao, ProgramaFormacao, EscolaTreeItem, LessonAssessment, CourseCertificate, TutoringCourse } from "@/types/domain";

// ---------- Escolas ----------
export async function listEscolas(sb: SupabaseClient): Promise<Escola[]> {
  const { data, error } = await sb.from("escolas").select("*").eq("is_active", true).order("order_index");
  if (error) { console.error("[academy] listEscolas", error); return []; }
  return (data ?? []) as Escola[];
}
export async function createEscola(sb: SupabaseClient, input: { name: string; slug: string; description?: string; icon_key?: string; order_index?: number }): Promise<void> {
  const { error } = await sb.from("escolas").insert(input);
  if (error) throw error;
}
export async function updateEscola(sb: SupabaseClient, id: string, patch: Partial<Escola>): Promise<void> {
  const { error } = await sb.from("escolas").update(patch).eq("id", id);
  if (error) throw error;
}

// ---------- Módulos ----------
export async function listCourseModules(sb: SupabaseClient, courseId: string): Promise<CourseModule[]> {
  const { data, error } = await sb.from("course_modules").select("*").eq("course_id", courseId).order("order_index");
  if (error) { console.error("[academy] listCourseModules", error); return []; }
  return (data ?? []) as CourseModule[];
}
export async function createModule(sb: SupabaseClient, input: { course_id: string; name: string; description?: string; order_index?: number }): Promise<string> {
  const { data, error } = await sb.from("course_modules").insert(input).select("id").single();
  if (error) throw error;
  return data.id as string;
}
export async function deleteModule(sb: SupabaseClient, id: string): Promise<void> {
  const { error } = await sb.from("course_modules").delete().eq("id", id);
  if (error) throw error;
}

// ---------- Lições ----------
export async function listModuleLessons(sb: SupabaseClient, moduleId: string): Promise<CourseLesson[]> {
  const { data, error } = await sb.from("course_lessons").select("*").eq("module_id", moduleId).order("order_index");
  if (error) { console.error("[academy] listModuleLessons", error); return []; }
  return (data ?? []) as CourseLesson[];
}
export interface LessonInput {
  module_id: string; title: string; objective?: string; content_main?: string; bible_reference?: string;
  video_url?: string; audio_url?: string; content_reflexao?: string; content_oracao?: string;
  content_pratica?: string; content_compartilhar?: string; order_index?: number;
}
export async function createLesson(sb: SupabaseClient, input: LessonInput): Promise<string> {
  const { data, error } = await sb.from("course_lessons").insert(input).select("id").single();
  if (error) throw error;
  return data.id as string;
}
export async function updateLesson(sb: SupabaseClient, id: string, patch: Partial<LessonInput>): Promise<void> {
  const { error } = await sb.from("course_lessons").update(patch).eq("id", id);
  if (error) throw error;
}
export async function deleteLesson(sb: SupabaseClient, id: string): Promise<void> {
  const { error } = await sb.from("course_lessons").delete().eq("id", id);
  if (error) throw error;
}

// ---------- Conteúdo + progresso (visão do aluno) ----------
export async function listCourseContent(sb: SupabaseClient, courseId: string, profileId: string | null): Promise<CourseContentItem[]> {
  const { data, error } = await sb.rpc("list_course_content", { p_course_id: courseId, p_profile_id: profileId });
  if (error) { console.error("[academy] listCourseContent", error); return []; }
  return (data ?? []) as CourseContentItem[];
}

/** Marca uma lição como iniciada (se ainda não tiver registro) — usado ao abrir a lição pela 1ª vez. */
export async function startLesson(sb: SupabaseClient, lessonId: string, profileId: string): Promise<void> {
  const { error } = await sb.from("lesson_progress").upsert(
    { profile_id: profileId, lesson_id: lessonId, status: "em_andamento" },
    { onConflict: "profile_id,lesson_id", ignoreDuplicates: true },
  );
  if (error) throw error;
}

/** Marca uma lição como concluída — a tela chama isso e, em seguida, pode registrar no Diário de Formação. */
export async function completeLesson(sb: SupabaseClient, lessonId: string, profileId: string): Promise<void> {
  const { error } = await sb.from("lesson_progress").upsert(
    { profile_id: profileId, lesson_id: lessonId, status: "concluida", completed_at: new Date().toISOString() },
    { onConflict: "profile_id,lesson_id" },
  );
  if (error) throw error;
}

// ---------- Jornada de Formação e Programa (Escola → Jornada → Programa → Curso) ----------
export async function listJornadas(sb: SupabaseClient, escolaId: string): Promise<JornadaFormacao[]> {
  const { data, error } = await sb.from("jornadas_formacao").select("*").eq("escola_id", escolaId).eq("is_active", true).order("order_index");
  if (error) { console.error("[academy] listJornadas", error); return []; }
  return (data ?? []) as JornadaFormacao[];
}
export async function createJornada(sb: SupabaseClient, input: { escola_id: string; name: string; description?: string; order_index?: number }): Promise<void> {
  const { error } = await sb.from("jornadas_formacao").insert(input);
  if (error) throw error;
}
export async function deleteJornada(sb: SupabaseClient, id: string): Promise<void> {
  const { error } = await sb.from("jornadas_formacao").delete().eq("id", id);
  if (error) throw error;
}

export async function listProgramas(sb: SupabaseClient, jornadaId: string): Promise<ProgramaFormacao[]> {
  const { data, error } = await sb.from("programas_formacao").select("*").eq("jornada_id", jornadaId).eq("is_active", true).order("order_index");
  if (error) { console.error("[academy] listProgramas", error); return []; }
  return (data ?? []) as ProgramaFormacao[];
}
export async function createPrograma(sb: SupabaseClient, input: { jornada_id: string; name: string; description?: string; order_index?: number }): Promise<void> {
  const { error } = await sb.from("programas_formacao").insert(input);
  if (error) throw error;
}
export async function deletePrograma(sb: SupabaseClient, id: string): Promise<void> {
  const { error } = await sb.from("programas_formacao").delete().eq("id", id);
  if (error) throw error;
}

export async function getEscolaTree(sb: SupabaseClient, escolaId: string): Promise<EscolaTreeItem[]> {
  const { data, error } = await sb.rpc("get_escola_tree", { p_escola_id: escolaId });
  if (error) { console.error("[academy] getEscolaTree", error); return []; }
  return (data ?? []) as EscolaTreeItem[];
}

/** Vincula um curso já existente a um Programa (opcional — cursos sem programa continuam soltos direto na Escola). */
export async function linkCourseToPrograma(sb: SupabaseClient, courseId: string, programaId: string | null): Promise<void> {
  const { error } = await sb.from("courses").update({ programa_id: programaId }).eq("id", courseId);
  if (error) throw error;
}

// ---------- Bloco 7 — Tutor ----------
export async function setCourseTutor(sb: SupabaseClient, courseId: string, tutorId: string | null): Promise<void> {
  const { error } = await sb.from("courses").update({ tutor_id: tutorId }).eq("id", courseId);
  if (error) throw error;
}
export async function listMyTutoringCourses(sb: SupabaseClient, profileId: string): Promise<TutoringCourse[]> {
  const { data, error } = await sb.rpc("list_my_tutoring_courses", { p_profile_id: profileId });
  if (error) { console.error("[academy] listMyTutoringCourses", error); return []; }
  return (data ?? []) as TutoringCourse[];
}

// ---------- Bloco 7 — Avaliações ----------
export async function listLessonAssessments(sb: SupabaseClient, lessonId: string): Promise<LessonAssessment[]> {
  const { data, error } = await sb.from("lesson_assessments").select("*").eq("lesson_id", lessonId).order("order_index");
  if (error) { console.error("[academy] listLessonAssessments", error); return []; }
  return (data ?? []) as LessonAssessment[];
}
export async function createAssessment(sb: SupabaseClient, input: { lesson_id: string; question: string; options: string[]; correct_index: number; order_index?: number }): Promise<void> {
  const { error } = await sb.from("lesson_assessments").insert(input);
  if (error) throw error;
}
export async function deleteAssessment(sb: SupabaseClient, id: string): Promise<void> {
  const { error } = await sb.from("lesson_assessments").delete().eq("id", id);
  if (error) throw error;
}
export async function submitAttempt(sb: SupabaseClient, input: { profile_id: string; assessment_id: string; selected_index: number; is_correct: boolean }): Promise<void> {
  const { error } = await sb.from("assessment_attempts").upsert(input, { onConflict: "profile_id,assessment_id" });
  if (error) throw error;
}
export async function listMyAttempts(sb: SupabaseClient, profileId: string, assessmentIds: string[]): Promise<Record<string, number>> {
  if (assessmentIds.length === 0) return {};
  const { data, error } = await sb.from("assessment_attempts").select("assessment_id, selected_index").eq("profile_id", profileId).in("assessment_id", assessmentIds);
  if (error) return {};
  return Object.fromEntries((data ?? []).map((a) => [a.assessment_id, a.selected_index]));
}

// ---------- Bloco 7 — Certificações ----------
/** Confere se o aluno já concluiu 100% do curso e, se sim, emite (ou devolve) o certificado. */
export async function maybeIssueCertificate(sb: SupabaseClient, courseId: string, profileId: string): Promise<string | null> {
  const { data, error } = await sb.rpc("maybe_issue_certificate", { p_course_id: courseId, p_profile_id: profileId });
  if (error) { console.error("[academy] maybeIssueCertificate", error); return null; }
  return data as string | null;
}
export async function getMyCertificate(sb: SupabaseClient, courseId: string, profileId: string): Promise<CourseCertificate | null> {
  const { data, error } = await sb.from("course_certificates").select("*").eq("course_id", courseId).eq("profile_id", profileId).maybeSingle();
  if (error) return null;
  return data as CourseCertificate | null;
}
export async function listMyCertificates(sb: SupabaseClient, profileId: string): Promise<CourseCertificate[]> {
  const { data, error } = await sb.from("course_certificates").select("*").eq("profile_id", profileId).order("issued_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as CourseCertificate[];
}
