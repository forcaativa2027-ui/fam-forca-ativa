"use client";

/**
 * CEC Academy Bloco 6 (ACA-B06-DB §5) — Estratégia Offline. Usa
 * IndexedDB nativo do navegador (sem biblioteca externa) pra
 * guardar cursos baixados e uma fila de ações pendentes de
 * sincronização (conclusão de lição feita offline).
 *
 * Estrutura do cache local (academy-cache-v1), conforme o documento:
 *   courses / lessons / knowledge-points / images / audio / metadata
 * Nesta primeira fase: courses + lessons + a fila de sincronização.
 */

const DB_NAME = "academy-cache-v1";
const DB_VERSION = 1;
const STORE_COURSES = "courses";
const STORE_PENDING_SYNC = "pendingSync";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") { reject(new Error("IndexedDB não suportado")); return; }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_COURSES)) db.createObjectStore(STORE_COURSES, { keyPath: "course_id" });
      if (!db.objectStoreNames.contains(STORE_PENDING_SYNC)) db.createObjectStore(STORE_PENDING_SYNC, { keyPath: "id", autoIncrement: true });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export interface OfflineLesson {
  id: string; module_id: string; module_name: string; title: string; objective: string | null;
  content_main: string | null; bible_reference: string | null; video_url: string | null;
  content_reflexao: string | null; content_oracao: string | null; content_pratica: string | null; content_compartilhar: string | null;
}
export interface OfflineCourse {
  course_id: string; course_name: string; course_description: string | null;
  lessons: OfflineLesson[]; downloaded_at: string;
}

export async function saveCourseOffline(course: OfflineCourse): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_COURSES, "readwrite");
    tx.objectStore(STORE_COURSES).put(course);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getCourseOffline(courseId: string): Promise<OfflineCourse | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_COURSES, "readonly");
    const req = tx.objectStore(STORE_COURSES).get(courseId);
    req.onsuccess = () => resolve((req.result as OfflineCourse) ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function listDownloadedCourseIds(): Promise<string[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_COURSES, "readonly");
    const req = tx.objectStore(STORE_COURSES).getAllKeys();
    req.onsuccess = () => resolve(req.result as string[]);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteCourseOffline(courseId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_COURSES, "readwrite");
    tx.objectStore(STORE_COURSES).delete(courseId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ---------- Fila de sincronização (ações feitas offline) ----------
export interface PendingSyncItem {
  id?: number; type: "complete_lesson"; lesson_id: string; profile_id: string; course_id: string; created_at: string;
}

export async function queuePendingSync(item: Omit<PendingSyncItem, "id">): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PENDING_SYNC, "readwrite");
    tx.objectStore(STORE_PENDING_SYNC).add(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPendingSyncQueue(): Promise<PendingSyncItem[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PENDING_SYNC, "readonly");
    const req = tx.objectStore(STORE_PENDING_SYNC).getAll();
    req.onsuccess = () => resolve(req.result as PendingSyncItem[]);
    req.onerror = () => reject(req.error);
  });
}

export async function clearPendingSyncItem(id: number): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PENDING_SYNC, "readwrite");
    tx.objectStore(STORE_PENDING_SYNC).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function isOfflineStorageSupported(): boolean {
  return typeof indexedDB !== "undefined";
}
