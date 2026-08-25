"use client";
import { BookOpen, Compass, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useCentralEstudos, useKnowledgeObjectDetail } from "@/hooks/use-queries";
import { UnifiedMediaPlayer } from "./UnifiedMediaPlayer";
import { useState } from "react";

/**
 * CEC Academy Blocos 2/3 — Central de Estudos. Não guarda nada
 * própria — consulta o Conhecimento Integrado (Objetos + Pontos de
 * Conhecimento já vinculados pelo admin) e monta automaticamente o
 * que é relevante pra essa lição, sem o aluno precisar procurar.
 */
export function CentralDeEstudos({ lessonId }: { lessonId: string }) {
  const { data: items = [] } = useCentralEstudos(lessonId);
  const [openObjectId, setOpenObjectId] = useState<string | null>(null);
  if (items.length === 0) return null;

  return (
    <Card className="border-2 border-gold/30 bg-gold/5">
      <CardContent className="space-y-2 pt-4">
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-gold">
          <Compass className="h-3.5 w-3.5" />Central de Estudos — aprofunde este tema
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {items.map((item) => (
            <button
              key={`${item.kind}-${item.id}`}
              onClick={() => item.kind === "objeto" && setOpenObjectId(item.id)}
              className="flex items-start gap-2 rounded-md border bg-card p-2.5 text-left hover:border-gold/50"
            >
              {item.image_url ? (
                <img src={item.image_url} alt="" className="h-10 w-10 shrink-0 rounded object-cover" />
              ) : (
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded bg-navy/10"><BookOpen className="h-4 w-4 text-navy" /></div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-navy">{item.title}</p>
                {item.subtitle && <p className="truncate text-xs text-gold">{item.subtitle}</p>}
              </div>
            </button>
          ))}
        </div>
      </CardContent>

      {openObjectId && <ObjectPlayerModal objectId={openObjectId} onClose={() => setOpenObjectId(null)} />}
    </Card>
  );
}

function ObjectPlayerModal({ objectId, onClose }: { objectId: string; onClose: () => void }) {
  const { data: detail } = useKnowledgeObjectDetail(objectId);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl bg-card p-4" onClick={(e) => e.stopPropagation()}>
        <div className="mb-2 flex items-center justify-between">
          <p className="font-display text-base text-navy">{detail?.title ?? "Carregando…"}</p>
          <button onClick={onClose}><X className="h-4 w-4 text-muted-foreground" /></button>
        </div>
        {detail?.description && <p className="mb-2 text-sm text-muted-foreground">{detail.description}</p>}
        {detail && <UnifiedMediaPlayer object={detail} />}
      </div>
    </div>
  );
}
