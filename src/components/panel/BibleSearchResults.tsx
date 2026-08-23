"use client";
import { ArrowLeft, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useBibleSearch } from "@/hooks/use-queries";

/**
 * CEC Academy — Bíblia Integrada, Fase 2. Resultados da busca de
 * texto completo, com trecho destacado.
 */
export function BibleSearchResults({ query, onBack, onOpen }: {
  query: string; onBack: () => void; onOpen: (bookAbbrev: string, chapter: number, verse: number) => void;
}) {
  const { data: results = [], isLoading } = useBibleSearch(query);

  return (
    <div className="space-y-3">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-navy"><ArrowLeft className="h-4 w-4" />Bíblia</button>
      <Card>
        <CardContent className="space-y-2 pt-4">
          <p className="flex items-center gap-2 font-display text-lg text-navy"><Search className="h-5 w-5 text-gold" />Resultados pra "{query}"</p>

          {isLoading && <p className="py-6 text-center text-sm text-muted-foreground">Buscando…</p>}
          {!isLoading && results.length === 0 && (
            <p className="py-6 text-center text-sm italic text-muted-foreground">Nenhum versículo encontrado com esse termo.</p>
          )}
          {!isLoading && results.length > 0 && (
            <p className="text-xs text-muted-foreground">{results.length} resultado(s)</p>
          )}

          <div className="space-y-1.5">
            {results.map((r, i) => (
              <button key={i} onClick={() => onOpen(r.book_abbrev, r.chapter, r.verse)}
                className="block w-full rounded-md border bg-card p-2.5 text-left hover:border-gold/50">
                <p className="text-xs font-bold text-gold">{r.book_name} {r.chapter}:{r.verse}</p>
                <p className="mt-0.5 text-sm text-ink" dangerouslySetInnerHTML={{ __html: r.headline.replace(/\*\*(.+?)\*\*/g, '<mark class="bg-gold/30 rounded px-0.5">$1</mark>') }} />
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
