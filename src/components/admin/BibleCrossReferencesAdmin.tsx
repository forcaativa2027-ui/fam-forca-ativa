"use client";
import { useState } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Link2, Plus, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase/client";
import { useMyProfile } from "@/hooks/use-queries";
import * as Bible from "@/services/bibleReader";

/**
 * CEC Academy — Bíblia Integrada, Fase 2. Gestão de Referências
 * Cruzadas — começou com um conjunto inicial (~60 conexões bem
 * conhecidas), e cresce aos poucos por aqui.
 */
export function BibleCrossReferencesAdmin() {
  const { data: me } = useMyProfile();
  const qc = useQueryClient();
  const { data: refs = [] } = useQuery({ queryKey: ["cross-references-all"], queryFn: () => Bible.listAllCrossReferences(supabase) });
  const [fromRef, setFromRef] = useState("");
  const [toRef, setToRef] = useState("");
  const [description, setDescription] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function add() {
    setErr("");
    const from = Bible.parseBibleReference(fromRef);
    const to = Bible.parseBibleReference(toRef);
    if (!from || from.verseStart === undefined) { setErr("Referência de origem inválida — use o formato \"João 3:16\" (com o versículo)."); return; }
    if (!to || to.verseStart === undefined) { setErr("Referência de destino inválida — use o formato \"Romanos 5:8\" (com o versículo)."); return; }
    setBusy(true);
    try {
      await Bible.addCrossReference(supabase, {
        from_book: from.bookAbbrev, from_chapter: from.chapter, from_verse_start: from.verseStart, from_verse_end: from.verseEnd ?? from.verseStart,
        to_book: to.bookAbbrev, to_chapter: to.chapter, to_verse_start: to.verseStart, to_verse_end: to.verseEnd ?? to.verseStart,
        description: description || undefined, created_by: me?.id,
      });
      setFromRef(""); setToRef(""); setDescription("");
      qc.invalidateQueries({ queryKey: ["cross-references-all"] });
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Erro ao salvar — talvez essa conexão já exista.");
    } finally { setBusy(false); }
  }

  async function remove(id: string) {
    if (!confirm("Remover essa referência cruzada?")) return;
    await Bible.deleteCrossReference(supabase, id);
    qc.invalidateQueries({ queryKey: ["cross-references-all"] });
  }

  return (
    <div className="space-y-4 p-4">
      <div>
        <h2 className="flex items-center gap-2 font-display text-xl text-navy"><Link2 className="h-5 w-5 text-gold" />Referências Cruzadas</h2>
        <p className="text-sm text-muted-foreground">Conexões temáticas entre versículos, exibidas durante a leitura no Modo Estudo. {refs.length} cadastradas.</p>
      </div>

      <Card>
        <CardContent className="space-y-2 pt-4">
          <p className="text-sm font-bold text-navy">Nova referência</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <Input value={fromRef} onChange={(e) => setFromRef(e.target.value)} placeholder="De (ex: João 3:16)" />
            <Input value={toRef} onChange={(e) => setToRef(e.target.value)} placeholder="Para (ex: Romanos 5:8)" />
          </div>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição curta (opcional)" />
          {err && <p className="text-xs text-destructive">{err}</p>}
          <Button size="sm" onClick={add} disabled={busy || !fromRef || !toRef} className="gap-1.5"><Plus className="h-4 w-4" />Adicionar</Button>
        </CardContent>
      </Card>

      <div className="space-y-1.5">
        {refs.map((r) => (
          <div key={r.id} className="flex items-center justify-between rounded-md border bg-card px-3 py-2 text-sm">
            <span className="text-navy">
              {r.from_book.toUpperCase()} {r.from_chapter}:{r.from_verse_start} ↔ {r.other_book_name} {r.other_chapter}:{r.other_verse_start}
              {r.description && <span className="ml-2 text-xs italic text-muted-foreground">— {r.description}</span>}
            </span>
            <button onClick={() => remove(r.id)}><Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-red-500" /></button>
          </div>
        ))}
        {refs.length === 0 && <p className="text-sm italic text-muted-foreground">Nenhuma referência cadastrada.</p>}
      </div>
    </div>
  );
}
