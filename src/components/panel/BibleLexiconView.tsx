"use client";
import { useState } from "react";
import { ArrowLeft, BookMarked, Search, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLexiconSearch, useLexiconEntry } from "@/hooks/use-queries";

/**
 * CEC Academy — Bíblia Integrada, Fase 4. Léxico (Dicionário de
 * Hebraico e Grego de Strong, 1890, domínio público). As
 * definições são em inglês — única fonte confiável disponível.
 */
export function BibleLexiconView({ onBack }: { onBack: () => void }) {
  const [query, setQuery] = useState("");
  const { data: results = [], isLoading } = useLexiconSearch(query);
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-navy"><ArrowLeft className="h-4 w-4" />Bíblia</button>
      <Card>
        <CardContent className="space-y-3 pt-4">
          <p className="flex items-center gap-2 font-display text-lg text-navy"><BookMarked className="h-5 w-5 text-gold" />Léxico — Hebraico e Grego</p>
          <p className="text-xs text-muted-foreground">Dicionário de Strong (1890, domínio público). Definições em inglês — busque por um número (ex: "H1" ou "G25") ou por uma palavra em inglês.</p>

          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ex: H1, G25, love, father…" className="pl-8" />
          </div>

          {isLoading && <p className="py-6 text-center text-sm text-muted-foreground">Buscando…</p>}
          {!isLoading && query.trim().length >= 2 && results.length === 0 && (
            <p className="py-6 text-center text-sm italic text-muted-foreground">Nenhuma entrada encontrada.</p>
          )}

          <div className="space-y-1.5">
            {results.map((r) => (
              <button key={r.id} onClick={() => setOpenId(r.id)}
                className="block w-full rounded-md border bg-card p-2.5 text-left hover:border-gold/50">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-navy/10 px-2 py-0.5 text-[10px] font-bold text-navy">{r.id}</span>
                  <span className="font-semibold text-navy" lang={r.language === "hebrew" ? "he" : "el"}>{r.lemma}</span>
                  <span className="text-xs italic text-gold">{r.transliteration}</span>
                </div>
                {r.short_definition && <p className="mt-0.5 text-xs text-muted-foreground">{r.short_definition}</p>}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {openId && <LexiconEntryModal id={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}

function LexiconEntryModal({ id, onClose }: { id: string; onClose: () => void }) {
  const { data: entry } = useLexiconEntry(id);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <Card className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <CardContent className="space-y-2 pt-4">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-navy/10 px-2 py-0.5 text-xs font-bold text-navy">{id}</span>
            <button onClick={onClose}><X className="h-4 w-4 text-muted-foreground" /></button>
          </div>
          <p className="font-display text-2xl text-navy" lang={entry?.language === "hebrew" ? "he" : "el"}>{entry?.lemma}</p>
          <p className="text-sm italic text-gold">{entry?.transliteration}</p>
          {entry?.definition && <p className="whitespace-pre-line text-sm text-ink">{entry.definition}</p>}
          {entry?.kjv_usage && <p className="rounded-md bg-gold/10 px-2 py-1.5 text-xs text-muted-foreground"><b className="text-navy">Uso na KJV:</b> {entry.kjv_usage}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
