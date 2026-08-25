"use client";
import { ArrowLeft, Bookmark, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabase/client";
import { useBibleBookmarks, useBibleBooks } from "@/hooks/use-queries";
import { useQueryClient } from "@tanstack/react-query";

/**
 * CEC Academy — Bíblia Integrada. Lista de versículos salvos.
 * ACA-BIB-04 §28.
 */
export function BibleSavedVerses({ profileId, onBack, onOpen }: {
  profileId: string | null; onBack: () => void; onOpen: (bookAbbrev: string, chapter: number) => void;
}) {
  const qc = useQueryClient();
  const { data: bookmarks = [] } = useBibleBookmarks(profileId);
  const { data: books = [] } = useBibleBooks();

  function bookName(abbrev: string) { return books.find((b) => b.abbrev.pt === abbrev)?.name ?? abbrev; }

  async function remove(id: string) {
    await supabase.from("bible_bookmarks").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["bible-bookmarks", profileId] });
  }

  return (
    <div className="space-y-3">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-navy"><ArrowLeft className="h-4 w-4" />Bíblia</button>
      <Card>
        <CardContent className="space-y-2 pt-4">
          <p className="flex items-center gap-2 font-display text-lg text-navy"><Bookmark className="h-5 w-5 text-gold" />Versículos Salvos</p>
          {bookmarks.length === 0 && <p className="py-6 text-center text-sm italic text-muted-foreground">Você ainda não salvou nenhum versículo.</p>}
          {bookmarks.map((b) => (
            <div key={b.id} className="flex items-center justify-between rounded-md border bg-card p-2.5">
              <button onClick={() => onOpen(b.book_abbrev, b.chapter)} className="text-left text-sm font-semibold text-navy hover:underline">
                {bookName(b.book_abbrev)} {b.chapter}:{b.verse_start === b.verse_end ? b.verse_start : `${b.verse_start}-${b.verse_end}`}
              </button>
              <button onClick={() => remove(b.id)}><Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-red-500" /></button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
