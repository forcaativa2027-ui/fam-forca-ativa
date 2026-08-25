"use client";
import { useState, useMemo } from "react";
import { ArrowLeft, ListOrdered, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useBibleSearch } from "@/hooks/use-queries";

/**
 * CEC Academy — Bíblia Integrada, Fase 4. Concordância — reaproveita
 * a busca de texto completo (Fase 2), só que sem limite de 50 e
 * organizada por livro, com contagem.
 */
export function BibleConcordanceView({ onBack, onOpen }: {
  onBack: () => void; onOpen: (bookAbbrev: string, chapter: number, verse: number) => void;
}) {
  const [word, setWord] = useState("");
  const { data: results = [], isLoading } = useBibleSearch(word, "acf", 500);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof results>();
    for (const r of results) {
      const list = map.get(r.book_name) ?? [];
      list.push(r);
      map.set(r.book_name, list);
    }
    return Array.from(map.entries());
  }, [results]);

  return (
    <div className="space-y-3">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-navy"><ArrowLeft className="h-4 w-4" />Bíblia</button>
      <Card>
        <CardContent className="space-y-3 pt-4">
          <p className="flex items-center gap-2 font-display text-lg text-navy"><ListOrdered className="h-5 w-5 text-gold" />Concordância</p>
          <p className="text-xs text-muted-foreground">Todas as ocorrências de uma palavra na Bíblia (versão ACF), organizadas por livro.</p>

          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={word} onChange={(e) => setWord(e.target.value)} placeholder="Digite uma palavra…" className="pl-8" />
          </div>

          {isLoading && <p className="py-6 text-center text-sm text-muted-foreground">Buscando…</p>}
          {!isLoading && word.trim().length >= 2 && results.length > 0 && (
            <p className="text-xs font-semibold text-gold">{results.length} ocorrência(s) em {grouped.length} livro(s)</p>
          )}
          {!isLoading && word.trim().length >= 2 && results.length === 0 && (
            <p className="py-6 text-center text-sm italic text-muted-foreground">Nenhuma ocorrência encontrada.</p>
          )}

          <div className="space-y-3">
            {grouped.map(([bookName, verses]) => (
              <div key={bookName}>
                <p className="mb-1 text-xs font-bold uppercase tracking-wide text-navy">{bookName} <span className="text-muted-foreground">({verses.length})</span></p>
                <div className="flex flex-wrap gap-1.5">
                  {verses.map((v, i) => (
                    <button key={i} onClick={() => onOpen(v.book_abbrev, v.chapter, v.verse)}
                      className="rounded-full border bg-card px-2.5 py-1 text-xs font-semibold text-navy hover:border-gold/50">
                      {v.chapter}:{v.verse}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
