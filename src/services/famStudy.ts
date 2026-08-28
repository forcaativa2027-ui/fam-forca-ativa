import type { SupabaseClient } from "@supabase/supabase-js";

export type FamStudyCourse = {
  id: string;
  course_code: string | null;
  name: string;
  description: string | null;
  category: string | null;
  escola_id: string | null;
  is_active: boolean;
};

export type FamStudyItem = {
  module_id: string;
  module_name: string;
  module_order: number;
  lesson_id: string;
  lesson_title: string;
  lesson_order: number;
  status: "nao_iniciada" | "em_andamento" | "concluida";
  completed_at: string | null;
};

export type FamStudyMemberAccess = {
  hasMemberRecord: boolean;
  status: string | null;
  journeyStage: string | null;
  isActiveMember: boolean;
};

export async function listFamStudyCourses(sb: SupabaseClient): Promise<FamStudyCourse[]> {
  const { data, error } = await sb
    .from("courses")
    .select("id, course_code, name, description, category, escola_id, is_active")
    .eq("is_active", true)
    .in("course_code", ["FAM-DIR-TRAB", "FAM-VDF-LMP", "FAM-CON-SUP"])
    .order("name");
  if (error) throw error;
  return (data ?? []) as FamStudyCourse[];
}

export async function listFamStudyContent(sb: SupabaseClient, courseId: string): Promise<FamStudyItem[]> {
  const { data, error } = await sb.rpc("fam_list_course_content", {
    p_course_id: courseId,
  });
  if (error) throw error;
  return (data ?? []) as FamStudyItem[];
}

export type FamStudyLesson = {
  id: string;
  module_id: string;
  title: string;
  objective: string | null;
  content_main: string | null;
  content_reflexao: string | null;
  content_pratica: string | null;
  content_compartilhar: string | null;
  video_url: string | null;
  audio_url: string | null;
};

export async function getFamStudyLesson(sb: SupabaseClient, lessonId: string): Promise<FamStudyLesson | null> {
  const { data, error } = await sb.rpc("fam_get_course_lesson", {
    p_lesson_id: lessonId,
  });
  if (error) throw error;
  return ((data ?? [])[0] ?? null) as FamStudyLesson | null;
}

export async function updateFamStudyProgress(
  sb: SupabaseClient,
  lessonId: string,
  status: "em_andamento" | "concluida",
): Promise<void> {
  const { data: userResult } = await sb.auth.getUser();
  const profileId = userResult.user?.id;
  if (!profileId) throw new Error("Sessão necessária para salvar o progresso.");

  const { error } = await sb.from("lesson_progress").upsert(
    {
      profile_id: profileId,
      lesson_id: lessonId,
      status,
      completed_at: status === "concluida" ? new Date().toISOString() : null,
    },
    { onConflict: "profile_id,lesson_id" },
  );
  if (error) throw error;
}

export async function getFamStudyMemberAccess(sb: SupabaseClient): Promise<FamStudyMemberAccess> {
  const { data: userResult } = await sb.auth.getUser();
  const profileId = userResult.user?.id;
  if (!profileId) return { hasMemberRecord: false, status: null, journeyStage: null, isActiveMember: false };

  const { data, error } = await sb
    .from("members")
    .select("status, journey_stage")
    .eq("profile_id", profileId)
    .maybeSingle();
  if (error) throw error;
  return {
    hasMemberRecord: Boolean(data),
    status: data?.status ?? null,
    journeyStage: data?.journey_stage ?? null,
    isActiveMember: data?.status === "ativo" && ["membro_ativo", "membro_efetivo"].includes(data?.journey_stage ?? ""),
  };
}

export function getFamStudyProgress(items: FamStudyItem[]) {
  const total = items.length;
  const completed = items.filter((item) => item.status === "concluida").length;
  const inProgress = items.find((item) => item.status === "em_andamento") ?? items.find((item) => item.status === "nao_iniciada");
  return { total, completed, percent: total ? Math.round((completed / total) * 100) : 0, nextLessonId: inProgress?.lesson_id ?? null };
}

export const FAM_STUDY_LABELS: Record<string, string> = {
  "FAM-DIR-TRAB": "Direitos Trabalhistas",
  "FAM-VDF-LMP": "Violência Doméstica e Familiar",
  "FAM-CON-SUP": "Direitos do Consumidor e Superendividamento",
};
