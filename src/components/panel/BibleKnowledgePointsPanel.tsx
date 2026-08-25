"use client";
import { useState } from "react";
import { Users, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useVerseKnowledgePoints, useKnowledgePointDetail } from "@/hooks/use-queries";

/**
 * CEC Academy — Bíblia Integrada, Fase 3. Mostra Personagens,
 * Lugares e outros Pontos de Conhecimento vinculados a um
 * versículo específico (ponte com o Bloco 4).
 */
export function BibleKnowledgePointsPanel({ bookAbbrev, chapter, verse }: {
  bookAbbrev: string; chapter: number; verse: number;
}) {
  const { data: points = [] } = useVerseKnowledgePoints(bookAbbrev, chapter, verse);
  const [openId, setOpenId] = useState<string | null>(null);
  if (points.length === 0) return null;

  return (
    <div className="rounded-lg border border-dashed border-navy/20 bg-navy/5 p-2.5">
      <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-navy">
        <Users className="h-3.5 w-3.5" />Personagens e Lugares
      </p>
      <div className="flex flex-wrap gap-1.5">
        {points.map((p) => (
          <button key={p.id} onClick={() => setOpenId(p.knowledge_point_id)}
            className="rounded-full border bg-card px-2.5 py-1 text-xs font-semibold text-navy hover:border-gold/50">
            {p.title}
          </button>
        ))}
      </div>
      {openId && <KnowledgePointQuickView id={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}

function KnowledgePointQuickView({ id, onClose }: { id: string; onClose: () => void }) {
  const { data: detail } = useKnowledgePointDetail(id);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <Card className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <CardContent className="space-y-2 pt-4">
          <div className="flex items-center justify-between">
            <p className="font-display text-base text-navy">{detail?.title ?? "Carregando…"}</p>
            <button onClick={onClose}><X className="h-4 w-4 text-muted-foreground" /></button>
          </div>
          {detail?.image_url && <img src={detail.image_url} alt="" className="h-32 w-full rounded-md object-cover" />}
          {detail?.subtitle && <p className="text-sm font-semibold text-gold">{detail.subtitle}</p>}
          {detail?.period_label && <p className="text-xs text-muted-foreground">🕐 {detail.period_label}</p>}
          {detail?.description && <p className="text-sm text-ink">{detail.description}</p>}
          {detail?.bible_refs && <p className="rounded-md bg-gold/10 px-2 py-1 text-xs font-semibold text-navy">📖 {detail.bible_refs}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
