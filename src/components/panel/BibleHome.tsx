"use client";
import { useState } from "react";
import { ArrowLeft, BookOpen, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useBibleBooks, useBibleReadingProgress, useBibleRecentReads } from "@/hooks/use-queries";
import { parseBibleReference } from "@/services/bibleReader";
import { BibleBookGroups } from "./BibleBookGroups";
import type { BibleBook } from "@/types/domain";

/**
 * CEC Academy — Bíblia Integrada. Tela inicial: busca por
 * referência, continuar lendo, últimos acessados, e os livros
 * organizados por grupo. ACA-BIB-01 §4 / ACA-BIB-04 §5.
 */
export function BibleHome({ profileId, onBack, onOpen, onOpenSaved, onOpenNotes }: {
  profileId: string | null; onBack: () => void;
  onOpen: (bookAbbrev: string, chapter: number, verseStart?: number) => void;
  onOpenSaved?: () => void; onOpenNotes?: () => void;
}) {
  const { data: books = [], isLoading: booksLoading, isError: booksError } = useBibleBooks();
  const { data: readingProgress } = useBibleReadingProgress(profileId);
  const { data: recentReads = [] } = useBibleRecentReads(profileId);
  const [search, setSearch] = useState("");
  const [searchErr, setSearchErr] = useState(false);

  function bookName(abbrev: string) { return books.find((b) => b.abbrev.pt === abbrev)?.name ?? abbrev; }

  function submitSearch() {
    if (!search.trim()) return;
    const ref = parseBibleReference(search);
    if (!ref) { setSearchErr(true); return; }
    setSearchErr(false);
    onOpen(ref.bookAbbrev, ref.chapter, ref.verseStart);
    setSearch("");
  }

  function openBook(b: BibleBook) { onOpen(b.abbrev.pt, 1); }

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-navy"><ArrowLeft className="h-4 w-4" />Voltar pra Academy</button>

      <Card>
        <CardContent className="space-y-4 pt-4">
          <p className="flex items-center gap-2 font-display text-lg text-navy"><BookOpen className="h-5 w-5 text-gold" />Bíblia Integrada</p>

          {(onOpenSaved || onOpenNotes) && (
            <div className="flex gap-2">
              {onOpenSaved && <button onClick={onOpenSaved} className="flex-1 rounded-md border p-2 text-center text-xs font-semibold text-navy hover:border-gold/50">Versículos Salvos</button>}
              {onOpenNotes && <button onClick={onOpenNotes} className="flex-1 rounded-md border p-2 text-center text-xs font-semibold text-navy hover:border-gold/50">Minhas Anotações</button>}
            </div>
          )}

          <div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(e) => { setSearch(e.target.value); setSearchErr(false); }}
                  onKeyDown={(e) => e.key === "Enter" && submitSearch()}
                  placeholder="Buscar livro, capítulo ou referência (ex: João 3:16)" className="pl-8" />
              </div>
            </div>
            {searchErr && <p className="mt-1 text-xs text-destructive">Não entendi essa referência — tenta algo como "João 3" ou "Salmo 23:1-4".</p>}
          </div>

          {readingProgress && (
            <button onClick={() => onOpen(readingProgress.book_abbrev, readingProgress.chapter)}
              className="flex w-full items-center justify-between rounded-lg border-2 border-gold/40 bg-gold/5 p-3 text-left hover:border-gold/60">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-gold">Continuar lendo</p>
                <p className="font-display text-base text-navy">{bookName(readingProgress.book_abbrev)} {readingProgress.chapter}</p>
              </div>
              <span className="text-xs font-semibold text-gold">Continuar →</span>
            </button>
          )}

          {recentReads.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">Últimos acessados</p>
              <div className="flex flex-wrap gap-1.5">
                {recentReads.map((r) => (
                  <button key={r.id} onClick={() => onOpen(r.book_abbrev, r.chapter)}
                    className="rounded-full border bg-card px-3 py-1.5 text-xs font-semibold text-navy hover:border-gold/50">
                    {bookName(r.book_abbrev)} {r.chapter}
                  </button>
                ))}
              </div>
            </div>
          )}

          {booksLoading && <p className="text-sm italic text-muted-foreground">Carregando lista de livros…</p>}
          {!booksLoading && (booksError || books.length === 0) && (
            <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Não conseguimos carregar a lista de livros agora. Tenta recarregar a página em alguns instantes.
            </p>
          )}
          {books.length > 0 && <BibleBookGroups books={books} onSelect={openBook} />}
        </CardContent>
      </Card>
    </div>
  );
}
