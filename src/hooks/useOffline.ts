"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import * as Offline from "@/services/offlineStorage";
import * as Ac from "@/services/academyContent";

export type SyncStatus = "idle" | "sincronizando" | "erro";

/**
 * CEC Academy Bloco 6 — Hook de Modo Offline. Detecta conexão,
 * baixa cursos completos pra estudar sem internet, e sincroniza
 * automaticamente as conclusões de lição feitas offline assim que
 * a conexão voltar.
 */
export function useOffline(profileId: string | null) {
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [pendingCount, setPendingCount] = useState(0);
  const [downloadedIds, setDownloadedIds] = useState<string[]>([]);
  const [downloading, setDownloading] = useState<string | null>(null);
  const supported = Offline.isOfflineStorageSupported();

  const refreshDownloaded = useCallback(() => {
    if (!supported) return;
    Offline.listDownloadedCourseIds().then(setDownloadedIds).catch(() => {});
  }, [supported]);

  const refreshPendingCount = useCallback(() => {
    if (!supported) return;
    Offline.getPendingSyncQueue().then((q) => setPendingCount(q.length)).catch(() => {});
  }, [supported]);

  const syncPending = useCallback(async () => {
    if (!supported) return;
    const queue = await Offline.getPendingSyncQueue();
    if (queue.length === 0) return;
    setSyncStatus("sincronizando");
    try {
      for (const item of queue) {
        if (item.type === "complete_lesson") {
          await Ac.completeLesson(supabase, item.lesson_id, item.profile_id);
          await Ac.maybeIssueCertificate(supabase, item.course_id, item.profile_id);
        }
        if (item.id !== undefined) await Offline.clearPendingSyncItem(item.id);
      }
      setSyncStatus("idle");
    } catch {
      setSyncStatus("erro");
    } finally {
      refreshPendingCount();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supported]);

  useEffect(() => {
    refreshDownloaded();
    refreshPendingCount();
    function onOnline() { setIsOnline(true); syncPending(); }
    function onOffline() { setIsOnline(false); }
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => { window.removeEventListener("online", onOnline); window.removeEventListener("offline", onOffline); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function downloadCourse(courseId: string, courseName: string, courseDescription: string | null) {
    if (!supported) return;
    setDownloading(courseId);
    try {
      const content = await Ac.listCourseContent(supabase, courseId, profileId);
      const lessons: Offline.OfflineLesson[] = [];
      for (const item of content) {
        const { data } = await supabase.from("course_lessons").select("*").eq("id", item.lesson_id).maybeSingle();
        if (data) {
          lessons.push({
            id: data.id, module_id: item.module_id, module_name: item.module_name, title: data.title,
            objective: data.objective, content_main: data.content_main, bible_reference: data.bible_reference,
            video_url: data.video_url, content_reflexao: data.content_reflexao, content_oracao: data.content_oracao,
            content_pratica: data.content_pratica, content_compartilhar: data.content_compartilhar,
          });
        }
      }
      await Offline.saveCourseOffline({
        course_id: courseId, course_name: courseName, course_description: courseDescription,
        lessons, downloaded_at: new Date().toISOString(),
      });
      refreshDownloaded();
    } finally { setDownloading(null); }
  }

  async function deleteDownload(courseId: string) {
    if (!supported) return;
    await Offline.deleteCourseOffline(courseId);
    refreshDownloaded();
  }

  /** Marca uma lição como concluída — online, salva direto; offline, guarda na fila pra sincronizar depois. */
  async function completeLessonOfflineAware(lessonId: string, pid: string, courseId: string): Promise<"synced" | "queued"> {
    if (isOnline) {
      await Ac.completeLesson(supabase, lessonId, pid);
      return "synced";
    }
    await Offline.queuePendingSync({ type: "complete_lesson", lesson_id: lessonId, profile_id: pid, course_id: courseId, created_at: new Date().toISOString() });
    refreshPendingCount();
    return "queued";
  }

  return {
    supported, isOnline, syncStatus, pendingCount, downloadedIds, downloading,
    isCourseDownloaded: (courseId: string) => downloadedIds.includes(courseId),
    downloadCourse, deleteDownload, syncPending, completeLessonOfflineAware,
  };
}
