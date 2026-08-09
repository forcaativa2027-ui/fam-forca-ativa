"use client";
import { useEffect, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Bookmark as BookmarkIcon, NotebookPen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase/client";
import { useMyProfile, useBibleBooks, useBibleChapter, useBibleHighlights, useBibleAnnotations, useBibleBookmarks, useBibleReadingProgress } from "@/hooks/use-queries";
import { useQueryClient } from "@tanstack/react-query";
import * as Bible from "@/services/bibleReader";
import * as Journal from "@/services/formationJournal";
import { useTTS } from "@/hooks/useTTS";
import { BibleHome } from "./BibleHome";
import { BibleVerseActions, type VerseSelection } from "./BibleVerseActions";
import { BibleJournalAction } from "./BibleJournalAction";
import { BibleSavedVerses } from "./BibleSavedVerses";
import { BibleNotesList } from "./BibleNotesList";
import { BibleModeSelector } from "./BibleModeSelector";
import { BibleDevotionalPanel } from "./BibleDevotionalPanel";
import { AcademyTTSControls } from "./AcademyTTS";
import type { JournalEntryType } from "@/types/domain";

const HIGHLIGHT_COLORS: Record<string, string> = {
  gold: "bg-gold/30", green: "bg-green-200", blue: "bg-blue-200", pink: "bg-pink-200", purple: "bg-purple-200",
};

type Screen = "home" | "reader" | "saved" | "notes";

/**
 * CEC Academy — Bíblia Integrada. Orquestra Home, leitura de
 * capítulo com versículo interativo (seleção, destaque, anotação,
 * salvar, copiar, compartilhar, Diário, TTS), Salvos e Anotações.
 * ACA-BIB-04.
 */
export function BibleReader({ onBack, initialBook, initialChapter }: { onBack: () => void; initialBook?: string; initialChapter?: number }) {
  const { data: me } = useMyProfile();
  const qc = useQueryClient();
  const { data: books = [] } = useBibleBooks();
  const [version] = useState("acf");
  const [bookAbbrev, setBookAbbrev] = useState(initialBook ?? "");
  const [chapter, setChapter] = useState(initialChapter ?? 1);
  const [screen, setScreen] = useState<Screen>(initialBook ? "reader" : "home");
  const [selection, setSelection] = useState<VerseSelection | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [journalOpen, setJournalOpen] = useState(false);
  const [toast, setToast] = useState("");
  const tts = useTTS(me?.id ?? null);
  const { data: readingProgress } = useBibleReadingProgress(me?.id ?? null);
  const [mode, setModeState] = useState<import("@/types/domain").BibleReadingMode>("reading");
  const [devotionalBusy, setDevotionalBusy] = useState(false);

  const { data: chapterData, isLoading } = useBibleChapter(version, bookAbbrev || null, bookAbbrev ? chapter : null);
  const { data: highlights = [], refetch: refetchHighlights } = useBibleHighlights(me?.id ?? null, bookAbbrev || null, chapter, version);
  const { data: annotations = [], refetch: refetchAnnotations } = useBibleAnnotations(me?.id ?? null, bookAbbrev || null, chapter, version);
  const { data: bookmarks = [] } = useBibleBookmarks(me?.id ?? null);

  useEffect(() => {
    if (me?.id && bookAbbrev && screen === "reader") Bible.registerChapterOpen(supabase, me.id, version, bookAbbrev, chapter);
  }, [me?.id, bookAbbrev, chapter, version, screen]);

  useEffect(() => { setSelection(null); }, [bookAbbrev, chapter]);
  useEffect(() => { if (readingProgress?.reading_mode) setModeState(readingProgress.reading_mode); }, [readingProgress?.reading_mode]);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(""), 2000); return () => clearTimeout(t); } }, [toast]);

  function changeMode(m: import("@/types/domain").BibleReadingMode) {
    setModeState(m);
    setSelection(null);
    if (me?.id) Bible.setReadingMode(supabase, me.id, m);
  }

  function openReference(abbrev: string, ch: number, verseStart?: number) {
    setBookAbbrev(abbrev); setChapter(ch); setScreen("reader");
    if (verseStart) changeMode("study");
    setSelection(verseStart ? { start: verseStart, end: verseStart } : null);
  }

  function clickVerse(num: number) {
    if (mode !== "study") return;
    setSelection((prev) => {
      if (!prev) return { start: num, end: num };
      if (prev.start === num && prev.end === num) return null;
      return { start: Math.min(prev.start, num), end: Math.max(prev.end, num) };
    });
  }

  async function registerDevotional(answers: Record<string, string>) {
    if (!me?.id || !chapterData) return;
    setDevotionalBusy(true);
    try {
      const ref = `${currentBook?.name ?? bookAbbrev} ${chapter} — ${version.toUpperCase()}`;
      const body = Object.entries(answers).filter(([, v]) => v.trim())
        .map(([q, v]) => `${q}\n${v.trim()}`).join("\n\n");
      await Journal.createJournalEntry(supabase, { profile_id: me.id, entry_type: "reflexao", content: `${ref}\n\n${body}`, is_private: true });
      setToast("Registrado no Diário!");
    } finally { setDevotionalBusy(false); }
  }

  const currentBook = books.find((b) => b.abbrev.pt === bookAbbrev);
  const totalChapters = currentBook?.chapters ?? 1;

  function selectedText(): string {
    if (!selection || !chapterData) return "";
    return chapterData.verses.filter((v) => v.number >= selection.start && v.number <= selection.end).map((v) => v.text).join(" ");
  }
  function referenceLabel(sel: VerseSelection): string {
    return `${currentBook?.name ?? bookAbbrev} ${chapter}:${sel.start === sel.end ? sel.start : `${sel.start}-${sel.end}`} — ${version.toUpperCase()}`;
  }

  const isHighlighted = !!selection && highlights.some((h) => h.verse_start === selection.start && h.verse_end === selection.end);
  const isSaved = !!selection && bookmarks.some((b) => b.book_abbrev === bookAbbrev && b.chapter === chapter && b.verse_start === selection.start && b.verse_end === selection.end);

  async function handleHighlight(color: string) {
    if (!me?.id || !selection) return;
    await Bible.toggleHighlight(supabase, { profile_id: me.id, version, book_abbrev: bookAbbrev, chapter, verse_start: selection.start, verse_end: selection.end, color });
    refetchHighlights();
  }
  async function handleToggleSave() {
    if (!me?.id || !selection) return;
    const result = await Bible.toggleBookmark(supabase, { profile_id: me.id, version, book_abbrev: bookAbbrev, chapter, verse_start: selection.start, verse_end: selection.end });
    qc.invalidateQueries({ queryKey: ["bible-bookmarks", me.id] });
    setToast(result === "saved" ? "Salvo!" : "Removido dos salvos");
  }
  async function handleCopy() {
    if (!selection) return;
    await navigator.clipboard.writeText(`"${selectedText()}"\n\n${referenceLabel(selection)}`);
    setToast("Copiado!");
  }
  async function handleShare() {
    if (!selection) return;
    const text = `"${selectedText()}"\n\n${referenceLabel(selection)}`;
    if (navigator.share) { try { await navigator.share({ text }); } catch { /* cancelado */ } }
    else { await navigator.clipboard.writeText(text); setToast("Copiado! (compartilhamento não suportado aqui)"); }
  }
  function handleListen() {
    if (!selection) return;
    tts.read([{ id: "selection", label: "Trecho selecionado", text: selectedText() }]);
  }
  async function saveNote() {
    if (!me?.id || !selection || !noteText.trim()) return;
    await Bible.saveAnnotation(supabase, { profile_id: me.id, version, book_abbrev: bookAbbrev, chapter, verse_start: selection.start, verse_end: selection.end, note_text: noteText });
    setNoteText(""); setNoteOpen(false); refetchAnnotations();
  }
  async function saveToJournal(entryType: JournalEntryType, reflection: string) {
    if (!me?.id || !selection) return;
    const content = reflection.trim()
      ? `${referenceLabel(selection)}\n"${selectedText()}"\n\n${reflection}`
      : `${referenceLabel(selection)}\n"${selectedText()}"`;
    await Journal.createJournalEntry(supabase, { profile_id: me.id, entry_type: entryType, content, is_private: true });
    setToast("Adicionado ao Diário!");
  }

  if (screen === "home") return <BibleHome profileId={me?.id ?? null} onBack={onBack} onOpen={openReference} onOpenSaved={() => setScreen("saved")} onOpenNotes={() => setScreen("notes")} />;
  if (screen === "saved") return <BibleSavedVerses profileId={me?.id ?? null} onBack={() => setScreen("home")} onOpen={(a, c) => openReference(a, c)} />;
  if (screen === "notes") return <BibleNotesList profileId={me?.id ?? null} onBack={() => setScreen("home")} onOpen={(a, c) => openReference(a, c)} />;

  return (
    <div className="space-y-3 pb-4">
      <div className="flex items-center justify-between">
        <button onClick={() => setScreen("home")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-navy"><ArrowLeft className="h-4 w-4" />Bíblia</button>
        <div className="flex gap-3">
          {mode !== "reading" && (
            <>
              <button onClick={() => setScreen("saved")} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-navy"><BookmarkIcon className="h-3.5 w-3.5" />Salvos</button>
              <button onClick={() => setScreen("notes")} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-navy"><NotebookPen className="h-3.5 w-3.5" />Anotações</button>
            </>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="space-y-3 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button onClick={() => setChapter((c) => Math.max(1, c - 1))} disabled={chapter <= 1} className="rounded-md border p-1.5 disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
              <p className="font-display text-lg text-navy">{currentBook?.name} {chapter}</p>
              <button onClick={() => setChapter((c) => Math.min(totalChapters, c + 1))} disabled={chapter >= totalChapters} className="rounded-md border p-1.5 disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
            </div>
            <span className="rounded-md border bg-background px-2 py-1 text-xs">{version.toUpperCase()}</span>
          </div>

          <BibleModeSelector mode={mode} onChange={changeMode} />

          <AcademyTTSControls tts={tts} blocks={chapterData ? [{ id: "chapter", label: "Capítulo", text: chapterData.verses.map((v) => v.text).join(" ") }] : []} />

          {isLoading && <p className="py-6 text-center text-sm text-muted-foreground">Carregando texto…</p>}
          {!isLoading && !chapterData && <p className="py-6 text-center text-sm text-muted-foreground">Não foi possível carregar esse capítulo agora — tenta de novo em instantes.</p>}

          <div className="space-y-1">
            {chapterData?.verses.map((v) => {
              const highlighted = highlights.find((h) => v.number >= h.verse_start && v.number <= h.verse_end);
              const note = annotations.find((a) => v.number >= a.verse_start && v.number <= a.verse_end);
              const isSelected = !!selection && v.number >= selection.start && v.number <= selection.end;
              const verseSpan = (
                <span className={`flex-1 text-sm text-ink ${highlighted ? `rounded px-1 ${HIGHLIGHT_COLORS[highlighted.color]}` : ""}`}>
                  {v.text}
                  {note && <span className="ml-1.5 text-xs text-gold">📝</span>}
                </span>
              );
              if (mode !== "study") {
                return (
                  <div key={v.number} className="flex items-start gap-2 rounded-md p-1.5">
                    <span className="mt-0.5 shrink-0 text-[11px] font-bold text-gold">{v.number}</span>
                    {verseSpan}
                  </div>
                );
              }
              return (
                <button key={v.number} onClick={() => clickVerse(v.number)}
                  className={`flex w-full items-start gap-2 rounded-md p-1.5 text-left hover:bg-muted/20 ${isSelected ? "ring-2 ring-gold/60" : ""}`}>
                  <span className="mt-0.5 shrink-0 text-[11px] font-bold text-gold">{v.number}</span>
                  {verseSpan}
                </button>
              );
            })}
          </div>

          {mode === "devotional" && chapterData && (
            <BibleDevotionalPanel
              reference={`${currentBook?.name ?? bookAbbrev} ${chapter}`}
              busy={devotionalBusy}
              onRegister={registerDevotional}
            />
          )}
        </CardContent>
      </Card>

      {mode === "study" && selection && (
        <BibleVerseActions
          selection={selection} isSaved={isSaved} isHighlighted={isHighlighted}
          onHighlight={handleHighlight} onNote={() => { setNoteText(""); setNoteOpen(true); }}
          onToggleSave={handleToggleSave} onCopy={handleCopy} onShare={handleShare}
          onJournal={() => setJournalOpen(true)} onListen={handleListen}
          onClear={() => setSelection(null)}
        />
      )}

      {noteOpen && selection && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => setNoteOpen(false)}>
          <Card className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <CardContent className="space-y-2 pt-4">
              <p className="text-sm font-bold text-navy">Anotação — {referenceLabel(selection)}</p>
              <Textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={4} placeholder="Sua reflexão sobre esse trecho…" />
              <button onClick={saveNote} className="w-full rounded-md bg-navy py-2 text-sm font-bold text-white">Salvar anotação</button>
            </CardContent>
          </Card>
        </div>
      )}

      {journalOpen && selection && (
        <BibleJournalAction reference={referenceLabel(selection)} verseText={selectedText()} onClose={() => setJournalOpen(false)} onSave={saveToJournal} />
      )}

      {toast && (
        <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-full bg-navy px-4 py-2 text-xs font-semibold text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
