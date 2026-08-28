"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import {
  getFamStudyLesson,
  getFamStudyMemberAccess,
  listFamStudyContent,
  listFamStudyCourses,
  updateFamStudyProgress,
} from "@/services/famStudy";

export function useFamStudyCourses() {
  return useQuery({
    queryKey: ["fam-study-courses"],
    queryFn: () => listFamStudyCourses(supabase),
    staleTime: 60_000,
  });
}

export function useFamStudyAccess() {
  return useQuery({
    queryKey: ["fam-study-access"],
    queryFn: () => getFamStudyMemberAccess(supabase),
    staleTime: 5 * 60_000,
  });
}

export function useFamStudyLesson(lessonId?: string) {
  return useQuery({
    queryKey: ["fam-study-lesson", lessonId],
    queryFn: () => getFamStudyLesson(supabase, lessonId as string),
    enabled: Boolean(lessonId),
    staleTime: 60_000,
  });
}

export function useFamStudyContent(courseId?: string) {
  return useQuery({
    queryKey: ["fam-study-content", courseId],
    queryFn: () => listFamStudyContent(supabase, courseId as string),
    enabled: Boolean(courseId),
    staleTime: 30_000,
  });
}

export function useUpdateFamStudyProgress(courseId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ lessonId, status }: { lessonId: string; status: "em_andamento" | "concluida" }) =>
      updateFamStudyProgress(supabase, lessonId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fam-study-content", courseId] });
    },
  });
}
