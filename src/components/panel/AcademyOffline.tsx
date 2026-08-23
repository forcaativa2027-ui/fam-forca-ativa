"use client";
import { Wifi, WifiOff, RefreshCw, Download, Trash2, CheckCircle2, Loader2 } from "lucide-react";
import { useOffline } from "@/hooks/useOffline";

/**
 * CEC Academy Bloco 6 (ACA-B06-UI §6) — Indicador de status
 * offline/online, com contagem de itens pendentes de sincronização.
 */
export function AcademyOfflineIndicator({ offline }: { offline: ReturnType<typeof useOffline> }) {
  if (!offline.supported) return null;
  if (offline.isOnline && offline.pendingCount === 0) return null; // não polui a tela quando está tudo normal

  return (
    <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold ${
      !offline.isOnline ? "border-amber-300 bg-amber-50 text-amber-800" :
      offline.syncStatus === "sincronizando" ? "border-blue-300 bg-blue-50 text-blue-800" :
      offline.syncStatus === "erro" ? "border-red-300 bg-red-50 text-red-800" :
      "border-green-300 bg-green-50 text-green-800"
    }`}>
      {!offline.isOnline ? (
        <><WifiOff className="h-3.5 w-3.5" />Você está offline — estudando com o conteúdo baixado{offline.pendingCount > 0 && ` (${offline.pendingCount} pendente${offline.pendingCount > 1 ? "s" : ""} pra sincronizar)`}</>
      ) : offline.syncStatus === "sincronizando" ? (
        <><RefreshCw className="h-3.5 w-3.5 animate-spin" />Sincronizando {offline.pendingCount} item(ns)…</>
      ) : offline.syncStatus === "erro" ? (
        <><WifiOff className="h-3.5 w-3.5" />Erro ao sincronizar — vamos tentar de novo automaticamente</>
      ) : (
        <><Wifi className="h-3.5 w-3.5" />Conectado</>
      )}
    </div>
  );
}

/**
 * CEC Academy Bloco 6 (ACA-B06-UI §6) — Botão de Download, pra
 * estudar o curso offline. Disponível na tela de curso.
 */
export function AcademyDownloadButton({ offline, courseId, courseName, courseDescription }: {
  offline: ReturnType<typeof useOffline>; courseId: string; courseName: string; courseDescription: string | null;
}) {
  if (!offline.supported) return null;
  const downloaded = offline.isCourseDownloaded(courseId);
  const isDownloading = offline.downloading === courseId;

  if (isDownloading) {
    return <span className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" />Baixando…</span>;
  }
  if (downloaded) {
    return (
      <button onClick={() => offline.deleteDownload(courseId)} className="flex items-center gap-1.5 rounded-md border border-green-300 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
        <CheckCircle2 className="h-3.5 w-3.5" />Disponível offline <Trash2 className="ml-1 h-3 w-3" />
      </button>
    );
  }
  return (
    <button onClick={() => offline.downloadCourse(courseId, courseName, courseDescription)} disabled={!offline.isOnline}
      className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold text-navy hover:border-gold/50 disabled:opacity-40">
      <Download className="h-3.5 w-3.5" />Baixar pra estudar offline
    </button>
  );
}
