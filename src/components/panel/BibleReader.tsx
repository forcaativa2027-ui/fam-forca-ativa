"use client";
import { useEffect, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, MessageSquarePlus, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase/client";
import { useMyProfile, useBibleBooks, useBibleChapter, useBibleHighlights, useBibleAnnotations } from "@/hooks/use-queries";
import * as Bible from "@/services/bibleReader";
import { BIBLE_VERSIONS } from "@/services/bibleReader";
import { BibleHome } from "./BibleHome";

const HIGHLIGHT_COLORS: Record<string, string> = {
  gold: "bg-gold/30", green: "bg-green-200", blue: "bg-blue-200", pink: "bg-pink-200", purple: "bg-purple-200",
};

/**
 * CEC Academy — Bíblia Integrada. Orquestra a Home (busca,
 * continuar lendo, livros por grupo) e a leitura de capítulo.
 * Grifos/anotações usam intervalo de versículos (verse_start/
 * verse_end) — nesta fase, clicar num número grifa/anota só ele
 * mesmo (verse_start = verse_end); seleção de intervalo vem numa
 * próxima rodada (ACA-BIB-04 §14).
 */
export function BibleReader({ onBack, initialBook, initialChapter }: { onBack: () => void; initialBook?: string; initialChapter?: number }) {
  const { data: me } = useMyProfile();
  const { data: books = [] } = useBibleBooks();
  const [version] = useState("acf");
  const [bookAbbrev, setBookAbbrev] = useState(initialBook ?? "");
  const [chapter, setChapter] = useState(initialChapter ?? 1);
  const [showHome, setShowHome] = useState(!initialBook);
  const [annotatingVerse, setAnnotatingVerse] = useState<number | null>(null);
  const [noteText, setNoteText] = useState("");

  const { data: chapterData, isLoading } = useBibleChapter(version, bookAbbrev || null, bookAbbrev ? chapter : null);
  const { data: highlights = [], refetch: refetchHighlights } = useBibleHighlights(me?.id ?? null, bookAbbrev || null, chapter, version);
  const { data: annotations = [], refetch: refetchAnnotations } = useBibleAnnotations(me?.id ?? null, bookAbbrev || null, chapter, version);

  useEffect(() => {
    if (me?.id && bookAbbrev) Bible.registerChapterOpen(supabase, me.id, version, bookAbbrev, chapter);
  }, [me?.id, bookAbbrev, chapter, version]);

  function openReference(abbrev: string, ch: number) { setBookAbbrev(abbrev); setChapter(ch); setShowHome(false); }

  async function toggleHighlight(verse: number) {
    if (!me?.id || !bookAbbrev) return;
    await Bible.toggleHighlight(supabase, { profile_id: me.id, version, book_abbrev: bookAbbrev, chapter, verse_start: verse, verse_end: verse, color: "gold" });
    refetchHighlights();
  }
  async function saveNote(verse: number) {
    if (!me?.id || !bookAbbrev || !noteText.trim()) return;
    await Bible.saveAnnotation(supabase, { profile_id: me.id, version, book_abbrev: bookAbbrev, chapter, verse_start: verse, verse_end: verse, note_text: noteText });
    setNoteText(""); setAnnotatingVerse(null); refetchAnnotations();
  }

  if (showHome) {
    return <BibleHome profileId={me?.id ?? null} onBack={onBack} onOpen={openReference} />;
  }

  const currentBook = books.find((b) => b.abbrev.pt === bookAbbrev);
  const totalChapters = currentBook?.chapters ?? 1;

  return (
    <div className="space-y-3">
      <button onClick={() => setShowHome(true)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-navy"><ArrowLeft className="h-4 w-4" />Bíblia</button>
      <Card>
        <CardContent className="space-y-3 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button onClick={() => setChapter((c) => Math.max(1, c - 1))} disabled={chapter <= 1} className="rounded-md border p-1.5 disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
              <p className="font-display text-lg text-navy">{currentBook?.name} {chapter}</p>
              <button onClick={() => setChapter((c) => Math.min(totalChapters, c + 1))} disabled={chapter >= totalChapters} className="rounded-md border p-1.5 disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
            </div>
            <select value={version} className="h-8 rounded-md border bg-background px-2 text-xs" disabled>
              {BIBLE_VERSIONS.map((v) => <option key={v.value} value={v.value}>{v.value.toUpperCase()}</option>)}
            </select>
          </div>

          {isLoading && <p className="py-6 text-center text-sm text-muted-foreground">Carregando texto…</p>}
          {!isLoading && !chapterData && <p className="py-6 text-center text-sm text-muted-foreground">Não foi possível carregar esse capítulo agora — tenta de novo em instantes.</p>}

          <div className="space-y-1">
            {chapterData?.verses.map((v) => {
              const highlighted = highlights.find((h) => v.number >= h.verse_start && v.number <= h.verse_end);
              const note = annotations.find((a) => v.number >= a.verse_start && v.number <= a.verse_end);
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
