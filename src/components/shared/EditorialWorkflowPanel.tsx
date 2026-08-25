"use client";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ClipboardCheck, Send, CheckCircle2, XCircle, CalendarClock, Rocket, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useContentWorkflowState, useMyProfile } from "@/hooks/use-queries";
import { supabase } from "@/lib/supabase/client";
import { submitContentForReview, reviewContent, setContentWorkflowStatus } from "@/services/editorialWorkflow";
import type { ContentWorkflowStatus } from "@/types/domain";

const STATUS_LABELS: Record<ContentWorkflowStatus, string> = {
  rascunho: "Rascunho", em_revisao: "Em revisão", aprovado: "Aprovado",
  agendado: "Agendado", publicado: "Publicado", arquivado: "Arquivado",
};
const STATUS_COLORS: Record<ContentWorkflowStatus, string> = {
  rascunho: "bg-slate-100 text-slate-600", em_revisao: "bg-amber-100 text-amber-700",
  aprovado: "bg-sky-100 text-sky-700", agendado: "bg-purple-100 text-purple-700",
  publicado: "bg-emerald-100 text-emerald-700", arquivado: "bg-slate-200 text-slate-500",
};

/**
 * Uso: <EditorialWorkflowPanel entityType="news" entityId={news?.id ?? null} />
 * Não aparece se a entidade ainda não foi salva (entityId nulo).
 * Lembrete: isso rastreia o PROCESSO — publicar/despublicar de verdade
 * continua sendo o campo "Publicado" que já existe no formulário.
 */
export function EditorialWorkflowPanel({ entityType, entityId }: { entityType: string; entityId: string | null }) {
  const qc = useQueryClient();
  const { data: profile } = useMyProfile();
  const { data: state } = useContentWorkflowState(entityType, entityId);
  const [note, setNote] = useState("");
  const [showRejectNote, setShowRejectNote] = useState(false);
  const [busy, setBusy] = useState(false);

  const canReview = profile?.role === "apostolo" || profile?.role === "pastor";

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["content-workflow-state", entityType, entityId] });
    qc.invalidateQueries({ queryKey: ["content-pending-review"] });
  }

  async function run(action: () => Promise<void>) {
    setBusy(true);
    try { await action(); invalidate(); } catch (e) { alert((e as { message?: string })?.message ?? "Erro"); }
    finally { setBusy(false); }
  }

  if (!entityId) return null;
  const status = state?.status ?? "rascunho";

  return (
    <div className="rounded-md border p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <ClipboardCheck className="h-3.5 w-3.5" /> Fluxo editorial
        </p>
        <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_COLORS[status]}`}>{STATUS_LABELS[status]}</span>
      </div>

      {state?.review_note && status === "rascunho" && (
        <p className="mb-2 rounded border border-red-200 bg-red-50 p-2 text-xs text-red-700">
          Reprovado{state.reviewer_name ? ` por ${state.reviewer_name}` : ""}: {state.review_note}
        </p>
      )}

      <div className="flex flex-wrap gap-1.5">
        {status === "rascunho" && (
          <Button type="button" size="sm" variant="outline" disabled={busy} className="gap-1.5"
            onClick={() => run(() => submitContentForReview(supabase, entityType, entityId))}>
            <Send className="h-3.5 w-3.5" /> Enviar pra revisão
          </Button>
        )}

        {status === "em_revisao" && canReview && !showRejectNote && (
          <>
            <Button type="button" size="sm" className="gap-1.5" disabled={busy}
              onClick={() => run(() => reviewContent(supabase, entityType, entityId, true, null))}>
              <CheckCircle2 className="h-3.5 w-3.5" /> Aprovar
            </Button>
            <Button type="button" size="sm" variant="destructive" className="gap-1.5" disabled={busy}
              onClick={() => setShowRejectNote(true)}>
              <XCircle className="h-3.5 w-3.5" /> Reprovar
            </Button>
          </>
        )}
        {status === "em_revisao" && !canReview && (
          <p className="text-xs text-muted-foreground">Aguardando aprovação de um pastor ou apóstolo.</p>
        )}

        {status === "aprovado" && (
          <>
            <Button type="button" size="sm" variant="outline" className="gap-1.5" disabled={busy}
              onClick={() => run(() => setContentWorkflowStatus(supabase, entityType, entityId, "agendado"))}>
              <CalendarClock className="h-3.5 w-3.5" /> Marcar agendado
            </Button>
            <Button type="button" size="sm" className="gap-1.5" disabled={busy}
              onClick={() => run(() => setContentWorkflowStatus(supabase, entityType, entityId, "publicado"))}>
              <Rocket className="h-3.5 w-3.5" /> Marcar publicado
            </Button>
          </>
        )}

        {status === "agendado" && (
          <Button type="button" size="sm" className="gap-1.5" disabled={busy}
            onClick={() => run(() => setContentWorkflowStatus(supabase, entityType, entityId, "publicado"))}>
            <Rocket className="h-3.5 w-3.5" /> Marcar publicado
          </Button>
        )}

        {status === "publicado" && (
          <Button type="button" size="sm" variant="outline" className="gap-1.5" disabled={busy}
            onClick={() => run(() => setContentWorkflowStatus(supabase, entityType, entityId, "arquivado"))}>
            <Archive className="h-3.5 w-3.5" /> Arquivar
          </Button>
        )}
      </div>

      {showRejectNote && (
        <div className="mt-2 space-y-1.5">
          <textarea
            value={note} onChange={(e) => setNote(e.target.value)} rows={2}
            placeholder="Motivo da reprovação (o autor vai ver isso)"
            className="w-full rounded-md border bg-background px-2.5 py-1.5 text-xs"
          />
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="destructive" disabled={busy || !note.trim()}
              onClick={() => run(async () => { await reviewContent(supabase, entityType, entityId, false, note.trim()); setShowRejectNote(false); setNote(""); })}>
              Confirmar reprovação
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setShowRejectNote(false)}>Cancelar</Button>
          </div>
        </div>
      )}

      <p className="mt-2 text-[10px] text-muted-foreground">
        Isso acompanha o processo — o campo "Publicado" do formulário continua sendo o que decide se aparece pro público.
      </p>
    </div>
  );
}
