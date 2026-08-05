"use client";
import { useState, useEffect } from "react";
import { Compass, MapPin, Landmark, Clock, Pickaxe, Users, ArrowLeft, History, Link2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase/client";
import { useKnowledgePoints, useKnowledgePointDetail, useMyRecentKnowledgeViews, useMyProfile } from "@/hooks/use-queries";
import * as Kp from "@/services/knowledgePoints";
import { RELATION_LABELS } from "@/components/admin/KnowledgePointsAdmin";
import type { KnowledgeCategory, KnowledgePoint } from "@/types/domain";

const CATEGORIES: { key: KnowledgeCategory; label: string; icon: typeof MapPin; question: string }[] = [
  { key: "lugar", label: "Lugares", icon: MapPin, question: "Onde aconteceu?" },
  { key: "historia_cultura", label: "História e Cultura", icon: Landmark, question: "Como era aquele mundo?" },
  { key: "linha_tempo", label: "Linha do Tempo", icon: Clock, question: "Quando aconteceu?" },
  { key: "arqueologia", label: "Arqueologia", icon: Pickaxe, question: "Quais evidências existem?" },
  { key: "personagem", label: "Personagens", icon: Users, question: "Quem participou?" },
];

/**
 * CEC Academy Bloco 4 — Exploração Inteligente do Conhecimento
 * Bíblico. O aluno navega entre Pontos de Conhecimento (lugares,
 * personagens, linha do tempo, arqueologia, história e cultura),
 * seguindo os relacionamentos entre eles.
 */
export function KnowledgeExplorer({ onBack }: { onBack: () => void }) {
  const { data: me } = useMyProfile();
  const [category, setCategory] = useState<KnowledgeCategory>("lugar");
  const { data: points = [] } = useKnowledgePoints(category);
  const { data: recent = [] } = useMyRecentKnowledgeViews(me?.id ?? null);
  const [openPoint, setOpenPoint] = useState<KnowledgePoint | null>(null);

  if (openPoint) {
    return <PointExplorerView point={openPoint} profileId={me?.id ?? null} onOpenRelated={setOpenPoint} onBack={() => setOpenPoint(null)} />;
  }

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-navy"><ArrowLeft className="h-4 w-4" />Voltar pra Academy</button>

      <Card>
        <CardContent className="space-y-3 pt-4">
          <p className="flex items-center gap-2 font-display text-lg text-navy"><Compass className="h-5 w-5 text-gold" />Explorar o Conhecimento Bíblico</p>

          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => {
              const Icon = c.icon;
              return (
                <button key={c.key} onClick={() => setCategory(c.key)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${category === c.key ? "border-gold bg-gold/10 text-navy" : "border-border text-muted-foreground"}`}>
                  <Icon className="h-3.5 w-3.5" />{c.label}
                </button>
              );
            })}
          </div>
          <p className="text-xs italic text-muted-foreground">{CATEGORIES.find((c) => c.key === category)?.question}</p>

          {recent.length > 0 && (
            <div className="rounded-lg border border-dashed p-2.5">
              <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground"><History className="h-3 w-3" />Visitados recentemente</p>
              <div className="flex flex-wrap gap-1.5">
                {recent.slice(0, 6).map((r) => (
                  <button key={r.id} onClick={() => setOpenPoint(r)} className="rounded-full border bg-card px-2 py-1 text-[11px] hover:border-gold/50">{r.title}</button>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-2 sm:grid-cols-2">
            {points.map((p) => (
              <button key={p.id} onClick={() => setOpenPoint(p)} className="text-left">
                <Card className="h-full transition hover:shadow-md">
                  <CardContent className="pt-3">
                    {p.image_url && <img src={p.image_url} alt="" className="mb-2 h-20 w-full rounded-md object-cover" />}
                    <p className="text-sm font-semibold text-navy">{p.title}</p>
                    {p.subtitle && <p className="text-xs text-gold">{p.subtitle}</p>}
                  </CardContent>
                </Card>
              </button>
            ))}
            {points.length === 0 && <p className="col-span-full py-6 text-center text-sm italic text-muted-foreground">Nada cadastrado nessa categoria ainda.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PointExplorerView({ point, profileId, onOpenRelated, onBack }: {
  point: KnowledgePoint; profileId: string | null; onOpenRelated: (p: KnowledgePoint) => void; onBack: () => void;
}) {
  const { data: detail } = useKnowledgePointDetail(point.id);
  const { data: allInCategory = [] } = useKnowledgePoints();

  useEffect(() => {
    if (profileId) Kp.logKnowledgePointView(supabase, point.id, profileId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [point.id, profileId]);

  function openRelatedById(id: string) {
    const found = allInCategory.find((p) => p.id === id);
    if (found) onOpenRelated(found);
  }

  return (
    <div className="space-y-3">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-navy"><ArrowLeft className="h-4 w-4" />Voltar pra exploração</button>
      <Card>
        <CardContent className="space-y-3 pt-4">
          {point.image_url && <img src={point.image_url} alt="" className="h-44 w-full rounded-lg object-cover" />}
          <div>
            <h3 className="font-display text-xl text-navy">{point.title}</h3>
            {point.subtitle && <p className="text-sm font-semibold text-gold">{point.subtitle}</p>}
            {point.period_label && <p className="text-xs text-muted-foreground">🕐 {point.period_label}</p>}
          </div>
          {point.description && <p className="text-sm text-ink">{point.description}</p>}
          {point.bible_refs && <p className="rounded-md bg-gold/10 px-3 py-1.5 text-sm font-semibold text-navy">📖 {point.bible_refs}</p>}

          {(detail?.related?.length ?? 0) > 0 && (
            <div className="border-t pt-3">
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground"><Link2 className="h-3.5 w-3.5" />Continue explorando</p>
              <div className="flex flex-wrap gap-1.5">
                {detail?.related.map((r) => (
                  <button key={r.related_id} onClick={() => openRelatedById(r.related_id)} className="rounded-full border bg-card px-3 py-1.5 text-xs font-semibold text-navy hover:border-gold/50">
                    {r.relation_type && r.relation_direction && (
                      <span className="text-gold">{RELATION_LABELS[r.relation_type][r.relation_direction]} </span>
                    )}
                    {r.related_title}
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
