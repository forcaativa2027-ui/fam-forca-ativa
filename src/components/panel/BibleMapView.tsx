"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { ArrowLeft, Map as MapIcon, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useBiblePlaces, useKnowledgePointDetail } from "@/hooks/use-queries";

const LeafletMap = dynamic(() => import("./BibleMapLeaflet"), {
  ssr: false,
  loading: () => <div className="grid h-[480px] w-full place-items-center rounded-md border bg-muted/10 text-sm text-muted-foreground">Carregando mapa…</div>,
});

/**
 * CEC Academy — Bíblia Integrada, Fase 3. Mapa interativo dos
 * Lugares Bíblicos cadastrados no Bloco 4.
 */
export function BibleMapView({ onBack }: { onBack: () => void }) {
  const { data: places = [] } = useBiblePlaces();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-navy"><ArrowLeft className="h-4 w-4" />Bíblia</button>
      <Card>
        <CardContent className="space-y-3 pt-4">
          <p className="flex items-center gap-2 font-display text-lg text-navy"><MapIcon className="h-5 w-5 text-gold" />Mapa dos Lugares Bíblicos</p>
          {places.length === 0 ? (
            <p className="py-6 text-center text-sm italic text-muted-foreground">Nenhum lugar com coordenadas cadastradas ainda.</p>
          ) : (
            <LeafletMap places={places} onSelect={setSelectedId} />
          )}
        </CardContent>
      </Card>

      {selectedId && <PlaceQuickView id={selectedId} onClose={() => setSelectedId(null)} />}
    </div>
  );
}

function PlaceQuickView({ id, onClose }: { id: string; onClose: () => void }) {
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
          {detail?.description && <p className="text-sm text-ink">{detail.description}</p>}
          {detail?.bible_refs && <p className="rounded-md bg-gold/10 px-2 py-1 text-xs font-semibold text-navy">📖 {detail.bible_refs}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
