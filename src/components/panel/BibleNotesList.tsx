"use client";
import { useState } from "react";
import { ArrowLeft, NotebookPen, Pencil, Trash2, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase/client";
import { useAllBibleAnnotations, useBibleBooks } from "@/hooks/use-queries";
import * as Bible from "@/services/bibleReader";
import { useQueryClient } from "@tanstack/react-query";
import type { BibleAnnotation } from "@/types/domain";

/**
 * CEC Academy — Bíblia Integrada. Lista de anotações pessoais.
 * ACA-BIB-04 §29.
 */
export function BibleNotesList({ profileId, onBack, onOpen }: {
  profileId: string | null; onBack: () => void; onOpen: (bookAbbrev: string, chapter: number) => void;
}) {
  const qc = useQueryClient();
  const { data: annotations = [] } = useAllBibleAnnotations(profileId);
  const { data: books = [] } = useBibleBooks();
  const [editing, setEditing] = useState<BibleAnnotation | null>(null);
  const [text, setText] = useState("");

  function bookName(abbrev: string) { return books.find((b) => b.abbrev.pt === abbrev)?.name ?? abbrev; }
  function refresh() { qc.invalidateQueries({ queryKey: ["bible-annotations-all", profileId] }); }

  async function remove(id: string) {
    if (!confirm("Apagar essa anotação?")) return;
    await Bible.deleteAnnotation(supabase, id);
    refresh();
  }
  async function save() {
    if (!editing) return;
    await Bible.updateAnnotation(supabase, editing.id, text);
    setEditing(null); refresh();
  }

  return (
    <div className="space-y-3">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-navy"><ArrowLeft className="h-4 w-4" />Bíblia</button>
      <Card>
        <CardContent className="space-y-2 pt-4">
          <p className="flex items-center gap-2 font-display text-lg text-navy"><NotebookPen className="h-5 w-5 text-gold" />Minhas Anotações</p>
          {annotations.length === 0 && <p className="py-6 text-center text-sm italic text-muted-foreground">Nenhuma anotação encontrada.</p>}
          {annotations.map((a) => (
            <div key={a.id} className="rounded-md border bg-card p-2.5">
              <div className="flex items-start justify-between gap-2">
                <button onClick={() => onOpen(a.book_abbrev, a.chapter)} className="text-left text-xs font-bold text-gold hover:underline">
                  {bookName(a.book_abbrev)} {a.chapter}:{a.verse_start === a.verse_end ? a.verse_start : `${a.verse_start}-${a.verse_end}`}
                </button>
                <div className="flex shrink-0 gap-1">
                  <button onClick={() => { setEditing(a); setText(a.note_text); }}><Pencil className="h-3.5 w-3.5 text-muted-foreground hover:text-navy" /></button>
                  <button onClick={() => remove(a.id)}><Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-red-500" /></button>
                </div>
              </div>
              <p className="mt-1 text-sm text-ink">{a.note_text}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">{new Date(a.updated_at).toLocaleDateString("pt-BR")}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => setEditing(null)}>
          <Card className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <CardContent className="space-y-2 pt-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-navy">Editar anotação</p>
                <button onClick={() => setEditing(null)}><X className="h-4 w-4 text-muted-foreground" /></button>
              </div>
              <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} />
              <button onClick={save} className="w-full rounded-md bg-navy py-2 text-sm font-bold text-white">Salvar</button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
