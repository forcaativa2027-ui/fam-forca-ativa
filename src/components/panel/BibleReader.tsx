"use client";
import { useEffect, useState } from "react";
import { ArrowLeft, BookOpen, ChevronLeft, ChevronRight, MessageSquarePlus, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase/client";
import {
  useMyProfile, useBibleBooks, useBibleChapter, useBibleHighlights, useBibleAnnotations, useBibleReadingProgress,
} from "@/hooks/use-queries";
import * as Bible from "@/services/bibleReader";
import { BIBLE_VERSIONS } from "@/services/bibleReader";
import type { BibleBook } from "@/types/domain";

const HIGHLIGHT_COLORS: Record<string, string> = {
  gold: "bg-gold/30", green: "bg-green-200", blue: "bg-blue-200", pink: "bg-pink-200", purple: "bg-purple-200",
};

/**
 * CEC Academy — Bíblia Integrada. Texto vem de uma API pública
 * gratuita; grifos e anotações ficam salvos aqui, por membro.
 */
export function BibleReader({ onBack, initialBook, initialChapter }: { onBack: () => void; initialBook?: string; initialChapter?: number }) {
  const { data: me } = useMyProfile();
  const { data: books = [], isLoading: booksLoading, isError: booksError } = useBibleBooks();
  const { data: readingProgress } = useBibleReadingProgress(me?.id ?? null);
  const [version, setVersion] = useState("nvi");
  const [bookAbbrev, setBookAbbrev] = useState(initialBook ?? "");
  const [chapter, setChapter] = useState(initialChapter ?? 1);
  const [showBookPicker, setShowBookPicker] = useState(!initialBook);
  const [annotatingVerse, setAnnotatingVerse] = useState<number | null>(null);
  const [noteText, setNoteText] = useState("");

  const { data: chapterData, isLoading } = useBibleChapter(version, bookAbbrev || null, bookAbbrev ? chapter : null);
  const { data: highlights = [], refetch: refetchHighlights } = useBibleHighlights(me?.id ?? null, bookAbbrev || null, chapter, version);
  const { data: annotations = [], refetch: refetchAnnotations } = useBibleAnnotations(me?.id ?? null, bookAbbrev || null, chapter, version);

  useEffect(() => {
    if (!initialBook && readingProgress && !bookAbbrev) {
      setBookAbbrev(readingProgress.book_abbrev); setChapter(readingProgress.chapter); setShowBookPicker(false);
    }
  }, [readingProgress, initialBook, bookAbbrev]);

  useEffect(() => {
    if (me?.id && bookAbbrev) Bible.saveReadingProgress(supabase, me.id, version, bookAbbrev, chapter);
  }, [me?.id, bookAbbrev, chapter, version]);

  function openBook(b: BibleBook) { setBookAbbrev(b.abbrev.pt); setChapter(1); setShowBookPicker(false); }

  async function toggleHighlight(verse: number) {
    if (!me?.id || !bookAbbrev) return;
    await Bible.toggleHighlight(supabase, { profile_id: me.id, version, book_abbrev: bookAbbrev, chapter, verse, color: "gold" });
    refetchHighlights();
  }
  async function saveNote(verse: number) {
    if (!me?.id || !bookAbbrev || !noteText.trim()) return;
    await Bible.saveAnnotation(supabase, { profile_id: me.id, version, book_abbrev: bookAbbrev, chapter, verse, note_text: noteText });
    setNoteText(""); setAnnotatingVerse(null); refetchAnnotations();
  }

  if (showBookPicker) {
    const vt = books.filter((b) => b.testament === "VT");
    const nt = books.filter((b) => b.testament === "NT");
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-navy"><ArrowLeft className="h-4 w-4" />Voltar pra Academy</button>
        <Card>
          <CardContent className="space-y-4 pt-4">
            <p className="flex items-center gap-2 font-display text-lg text-navy"><BookOpen className="h-5 w-5 text-gold" />Bíblia Integrada</p>
            <div>
              <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">Antigo Testamento</p>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                {vt.map((b) => <button key={b.abbrev.pt} onClick={() => openBook(b)} className="rounded-md border p-2 text-left text-sm hover:border-gold/50">{b.name}</button>)}
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">Novo Testamento</p>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                {nt.map((b) => <button key={b.abbrev.pt} onClick={() => openBook(b)} className="rounded-md border p-2 text-left text-sm hover:border-gold/50">{b.name}</button>)}
              </div>
            </div>
            {booksLoading && <p className="text-sm italic text-muted-foreground">Carregando lista de livros…</p>}
            {!booksLoading && (booksError || books.length === 0) && (
              <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Não conseguimos carregar a lista de livros agora. Isso pode ser instabilidade temporária da fonte do texto bíblico — tenta recarregar a página em alguns instantes.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentBook = books.find((b) => b.abbrev.pt === bookAbbrev);
  const totalChapters = currentBook?.chapters ?? 1;

  return (
    <div className="space-y-3">
      <button onClick={() => setShowBookPicker(true)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-navy"><ArrowLeft className="h-4 w-4" />Escolher outro livro</button>
      <Card>
        <CardContent className="space-y-3 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button onClick={() => setChapter((c) => Math.max(1, c - 1))} disabled={chapter <= 1} className="rounded-md border p-1.5 disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
              <p className="font-display text-lg text-navy">{currentBook?.name} {chapter}</p>
              <button onClick={() => setChapter((c) => Math.min(totalChapters, c + 1))} disabled={chapter >= totalChapters} className="rounded-md border p-1.5 disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
            </div>
            <select value={version} onChange={(e) => setVersion(e.target.value)} className="h-8 rounded-md border bg-background px-2 text-xs">
              {BIBLE_VERSIONS.map((v) => <option key={v.value} value={v.value}>{v.value.toUpperCase()}</option>)}
            </select>
          </div>

          {isLoading && <p className="py-6 text-center text-sm text-muted-foreground">Carregando texto…</p>}
          {!isLoading && !chapterData && <p className="py-6 text-center text-sm text-muted-foreground">Não foi possível carregar esse capítulo agora — tenta de novo em instantes.</p>}

          <div className="space-y-1">
            {chapterData?.verses.map((v) => {
              const highlighted = highlights.find((h) => h.verse === v.number);
              const note = annotations.find((a) => a.verse === v.number);
              return (
                <div key={v.number} className="group flex items-start gap-2 rounded-md p-1.5 hover:bg-muted/20">
                  <button onClick={() => toggleHighlight(v.number)} className="mt-0.5 shrink-0 text-[11px] font-bold text-gold">{v.number}</button>
                  <p className={`flex-1 text-sm text-ink ${highlighted ? `rounded px-1 ${HIGHLIGHT_COLORS[highlighted.color]}` : ""}`}>
                    {v.text}
                    {note && <span className="ml-1.5 text-xs text-gold">📝</span>}
                  </p>
                  <button onClick={() => { setAnnotatingVerse(v.number); setNoteText(note?.note_text ?? ""); }} className="shrink-0 opacity-0 group-hover:opacity-100">
                    <MessageSquarePlus className="h-3.5 w-3.5 text-muted-foreground hover:text-navy" />
                  </button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {annotatingVerse !== null && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => setAnnotatingVerse(null)}>
          <Card className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <CardContent className="space-y-2 pt-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-navy">Anotação — versículo {annotatingVerse}</p>
                <button onClick={() => setAnnotatingVerse(null)}><X className="h-4 w-4 text-muted-foreground" /></button>
              </div>
              <Textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={4} placeholder="Sua reflexão sobre esse versículo…" />
              <button onClick={() => saveNote(annotatingVerse)} className="w-full rounded-md bg-navy py-2 text-sm font-bold text-white">Salvar anotação</button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
