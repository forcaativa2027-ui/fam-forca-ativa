"use client";
import { Link2 } from "lucide-react";
import { useCrossReferences } from "@/hooks/use-queries";

/**
 * CEC Academy — Bíblia Integrada, Fase 2. Mostra as referências
 * cruzadas de um versículo específico, se houver alguma cadastrada.
 */
export function BibleCrossReferencesPanel({ bookAbbrev, chapter, verse, onOpen }: {
  bookAbbrev: string; chapter: number; verse: number;
  onOpen: (bookAbbrev: string, chapter: number, verse: number) => void;
}) {
  const { data: refs = [] } = useCrossReferences(bookAbbrev, chapter, verse);
  if (refs.length === 0) return null;

  return (
    <div className="rounded-lg border border-dashed border-gold/40 bg-gold/5 p-2.5">
      <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-gold">
        <Link2 className="h-3.5 w-3.5" />Referências relacionadas
      </p>
      <div className="flex flex-wrap gap-1.5">
        {refs.map((r) => (
          <button key={r.id} onClick={() => onOpen(r.other_book, r.other_chapter, r.other_verse_start)}
            className="rounded-full border bg-card px-2.5 py-1 text-xs font-semibold text-navy hover:border-gold/50"
            title={r.description ?? undefined}>
            {r.other_book_name} {r.other_chapter}:{r.other_verse_start === r.other_verse_end ? r.other_verse_start : `${r.other_verse_start}-${r.other_verse_end}`}
          </button>
        ))}
      </div>
    </div>
  );
}
