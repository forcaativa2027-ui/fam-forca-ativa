"use client";
import { useState } from "react";
import { BookHeart, Plus, Lock, Globe, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase/client";
import { useMyProfile, useMyJournalEntries } from "@/hooks/use-queries";
import * as Journal from "@/services/formationJournal";
import type { JournalEntryType } from "@/types/domain";

const TYPE_CONFIG: Record<JournalEntryType, { label: string; icon: string }> = {
  versiculo: { label: "Versículo", icon: "📖" },
  oracao: { label: "Oração", icon: "🙏" },
  reflexao: { label: "Reflexão", icon: "💭" },
  testemunho: { label: "Testemunho", icon: "✨" },
  aprendizado: { label: "Aprendizado", icon: "💡" },
  duvida: { label: "Dúvida", icon: "❓" },
  missao_cumprida: { label: "Missão cumprida", icon: "✅" },
};

/**
 * CEC Academy — Diário de Formação. Espaço pessoal do membro:
 * versículos, orações, reflexões, testemunhos, aprendizados,
 * dúvidas e missões cumpridas. Privado por padrão — só o próprio
 * membro (e o discipulador dele, se marcado como não-privado) vê.
 */
export function DiarioFormacao() {
  const { data: me } = useMyProfile();
  const { data: entries = [], refetch } = useMyJournalEntries(me?.id ?? null);
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<JournalEntryType>("reflexao");
  const [content, setContent] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!me?.id || !content.trim()) return;
    setBusy(true);
    try {
      await Journal.createJournalEntry(supabase, { profile_id: me.id, entry_type: type, content, is_private: isPrivate });
      setContent(""); setShowForm(false);
      refetch();
    } finally { setBusy(false); }
  }

  async function remove(id: string) {
    if (!confirm("Apagar essa anotação do diário?")) return;
    await Journal.deleteJournalEntry(supabase, id);
    refetch();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><BookHeart className="h-5 w-5 text-gold" />Diário de Formação</CardTitle>
        <CardDescription>Versículos, orações, reflexões, testemunhos, aprendizados, dúvidas e missões cumpridas — seu espaço pessoal.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!showForm ? (
          <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5"><Plus className="h-4 w-4" />Nova anotação</Button>
        ) : (
          <div className="space-y-2 rounded-lg border p-3">
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(TYPE_CONFIG) as JournalEntryType[]).map((t) => (
                <button key={t} onClick={() => setType(t)}
                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition ${type === t ? "border-gold bg-gold/10 text-navy" : "border-border text-muted-foreground"}`}>
                  {TYPE_CONFIG[t].icon} {TYPE_CONFIG[t].label}
                </button>
              ))}
            </div>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={3} placeholder="Escreva aqui…" />
            <button onClick={() => setIsPrivate((v) => !v)} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {isPrivate ? <Lock className="h-3.5 w-3.5" /> : <Globe className="h-3.5 w-3.5" />}
              {isPrivate ? "Privado (só eu vejo)" : "Visível pro meu discipulador"}
            </button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { setShowForm(false); setContent(""); }}>Cancelar</Button>
              <Button size="sm" onClick={save} disabled={busy || !content.trim()}>{busy ? "Salvando…" : "Salvar"}</Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {entries.map((e) => (
            <div key={e.id} className="group flex items-start justify-between gap-2 rounded-lg border p-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs">{TYPE_CONFIG[e.entry_type].icon}</span>
                  <span className="text-xs font-bold uppercase tracking-wide text-gold">{TYPE_CONFIG[e.entry_type].label}</span>
                  {e.is_private && <Lock className="h-3 w-3 text-muted-foreground" />}
                  <span className="text-xs text-muted-foreground">· {new Date(e.created_at).toLocaleDateString("pt-BR")}</span>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-ink">{e.content}</p>
              </div>
              <button onClick={() => remove(e.id)} className="opacity-0 transition group-hover:opacity-100"><Trash2 className="h-3.5 w-3.5 text-red-400" /></button>
            </div>
          ))}
          {entries.length === 0 && !showForm && <p className="py-4 text-center text-sm italic text-muted-foreground">Nenhuma anotação ainda.</p>}
        </div>
      </CardContent>
    </Card>
  );
}
