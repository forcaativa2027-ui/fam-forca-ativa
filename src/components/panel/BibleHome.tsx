"use client";
import { useState } from "react";
import { ArrowLeft, Search, Bookmark, NotebookPen, Map as MapIcon, Languages, ListOrdered } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useBibleBooks, useBibleReadingProgress, useBibleRecentReads } from "@/hooks/use-queries";
import { parseBibleReference } from "@/services/bibleReader";
import { BibleBookGroups } from "./BibleBookGroups";
import { BibleHeader, RecentPassageChip } from "./academy/Headers";
import { ContinueCard } from "./academy/ContinueCard";
import { BibleToolCard, type BibleToolViewModel } from "./academy/BibleToolCard";
import { SectionHeader } from "@/components/shared/ui/SectionHeader";
import type { BibleBook } from "@/types/domain";

/**
 * CEC Academy — Bíblia Integrada. Tela inicial, reorganizada
 * conforme ACA-UX-001 §14: Cabeçalho → Busca → Continuar leitura →
 * Ferramentas de estudo → Últimos acessados → Testamentos.
 */
export function BibleHome({ profileId, onBack, onOpen, onOpenSaved, onOpenNotes, onSearch, onOpenMap, onOpenLexicon, onOpenConcordance }: {
  profileId: string | null; onBack: () => void;
  onOpen: (bookAbbrev: string, chapter: number, verseStart?: number) => void;
  onOpenSaved?: () => void; onOpenNotes?: () => void;
  onSearch?: (query: string) => void; onOpenMap?: () => void;
  onOpenLexicon?: () => void; onOpenConcordance?: () => void;
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
    if (ref) {
      setSearchErr(false);
      onOpen(ref.bookAbbrev, ref.chapter, ref.verseStart);
      setSearch("");
      return;
    }
    if (onSearch) { onSearch(search.trim()); setSearch(""); }
    else setSearchErr(true);
  }

  function openBook(b: BibleBook) { onOpen(b.abbrev.pt, 1); }

  // §17 — só aparecem ferramentas com tela de verdade (nada simulado, UX-009)
  const tools: { vm: BibleToolViewModel; onClick?: () => void }[] = [
    ...(onOpenSaved ? [{ vm: { id: "saved", label: "Favoritos", icon: Bookmark, available: true }, onClick: onOpenSaved }] : []),
    ...(onOpenNotes ? [{ vm: { id: "notes", label: "Anotações", icon: NotebookPen, available: true }, onClick: onOpenNotes }] : []),
    ...(onOpenMap ? [{ vm: { id: "map", label: "Mapas", icon: MapIcon, available: true }, onClick: onOpenMap }] : []),
    ...(onOpenLexicon ? [{ vm: { id: "lexicon", label: "Léxico", icon: Languages, available: true }, onClick: onOpenLexicon }] : []),
    ...(onOpenConcordance ? [{ vm: { id: "concordance", label: "Concordância", icon: ListOrdered, available: true }, onClick: onOpenConcordance }] : []),
  ];

  return (
    <div className="space-y-5">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-navy"><ArrowLeft className="h-4 w-4" />Voltar pra Academy</button>

      <BibleHeader />

      <div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => { setSearch(e.target.value); setSearchErr(false); }}
            onKeyDown={(e) => e.key === "Enter" && submitSearch()}
            placeholder="Buscar livro, referência ou palavra…" className="pl-8" />
        </div>
        {searchErr && <p className="mt-1 text-xs text-destructive">Não entendi essa referência — tenta algo como "João 3" ou "Salmo 23:1-4".</p>}
      </div>

      {readingProgress && (
        <div>
          <SectionHeader title="Continue sua leitura" />
          <ContinueCard
            vm={{ title: `${bookName(readingProgress.book_abbrev)} ${readingProgress.chapter}`, actionLabel: "Continuar" }}
            onClick={() => onOpen(readingProgress.book_abbrev, readingProgress.chapter)}
          />
        </div>
      )}

      {tools.length > 0 && (
        <div>
          <SectionHeader title="Ferramentas de estudo" />
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {tools.map((t) => <BibleToolCard key={t.vm.id} vm={t.vm} onClick={t.onClick ?? (() => {})} />)}
          </div>
        </div>
      )}

      {recentReads.length > 0 && (
        <div>
          <SectionHeader title="Últimos acessados" />
          <div className="flex flex-wrap gap-1.5">
            {recentReads.map((r) => (
              <RecentPassageChip key={r.id} label={`${bookName(r.book_abbrev)} ${r.chapter}`} onClick={() => onOpen(r.book_abbrev, r.chapter)} />
            ))}
          </div>
        </div>
      )}

      <div>
        {booksLoading && <p className="text-sm italic text-muted-foreground">Carregando lista de livros…</p>}
        {!booksLoading && (booksError || books.length === 0) && (
          <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Não conseguimos carregar a lista de livros agora. Tenta recarregar a página em alguns instantes.
          </p>
        )}
        {books.length > 0 && <BibleBookGroups books={books} onSelect={openBook} />}
      </div>
    </div>
  );
}
