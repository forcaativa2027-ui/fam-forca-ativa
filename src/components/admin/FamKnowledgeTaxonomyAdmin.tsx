"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateFamKnowledgeTerm, useFamKnowledgeTerms, useUpdateFamKnowledgeTerm } from "@/hooks/use-fam-knowledge";

type TermStatus = "active" | "proposed" | "retired";
const STATUS_LABELS: Record<TermStatus, string> = { active: "Ativo", proposed: "Proposto", retired: "Aposentado" };

export function FamKnowledgeTaxonomyAdmin() {
  const { data: terms = [], isLoading, isError } = useFamKnowledgeTerms();
  const createTerm = useCreateFamKnowledgeTerm();
  const updateTerm = useUpdateFamKnowledgeTerm();
  const [termKey, setTermKey] = useState("");
  const [label, setLabel] = useState("");
  const [definition, setDefinition] = useState("");
  const [alternatives, setAlternatives] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!termKey.trim() || !label.trim() || !definition.trim()) return;
    await createTerm.mutateAsync({
      term_key: termKey.trim().toLowerCase().replace(/\s+/g, "-"),
      preferred_label: label.trim(),
      definition: definition.trim(),
      alternative_labels: alternatives.split(",").map((value) => value.trim()).filter(Boolean),
      status: "proposed",
    });
    setTermKey(""); setLabel(""); setDefinition(""); setAlternatives("");
  }

  return <section className="space-y-4" aria-labelledby="taxonomy-title"><div><h2 id="taxonomy-title" className="font-display text-2xl text-navy">Taxonomia e temas</h2><p className="text-sm text-muted">Crie termos controlados para classificar conteúdos, filtros e trilhas. Aposentar um termo preserva o histórico.</p></div><Card className="border-fam-pink/20"><CardHeader><CardTitle className="text-lg text-navy">Novo termo</CardTitle></CardHeader><CardContent><form onSubmit={submit} className="grid gap-3 md:grid-cols-2"><input required aria-label="Chave do termo" value={termKey} onChange={(event) => setTermKey(event.target.value)} placeholder="ex.: medidas-protetivas" className="rounded-md border border-fam-plum/25 px-3 py-2 text-sm" /><input required aria-label="Rótulo preferencial" value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Rótulo preferencial" className="rounded-md border border-fam-plum/25 px-3 py-2 text-sm" /><input aria-label="Rótulos alternativos" value={alternatives} onChange={(event) => setAlternatives(event.target.value)} placeholder="Sinônimos separados por vírgula" className="rounded-md border border-fam-plum/25 px-3 py-2 text-sm" /><textarea required aria-label="Definição" value={definition} onChange={(event) => setDefinition(event.target.value)} placeholder="Definição em linguagem clara" className="min-h-20 rounded-md border border-fam-plum/25 px-3 py-2 text-sm" /><div className="md:col-span-2"><Button type="submit" disabled={createTerm.isPending} className="bg-fam-plum hover:bg-fam-plum/90">{createTerm.isPending ? "Salvando…" : "Criar termo proposto"}</Button></div></form>{createTerm.isError && <p role="alert" className="mt-2 text-sm text-fam-plum">Não foi possível criar o termo. Verifique sua permissão de curadoria.</p>}</CardContent></Card><Card className="border-fam-pink/20"><CardContent className="pt-6">{isLoading && <p role="status">Carregando termos…</p>}{isError && <p role="alert">Não foi possível carregar a taxonomia.</p>}{!isLoading && !isError && terms.length === 0 && <p className="text-sm text-muted">Nenhum termo cadastrado.</p>}<div className="space-y-2">{terms.map((term) => <div key={term.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-fam-plum/10 p-3"><div><p className="font-semibold text-navy">{term.preferred_label} <span className="text-xs font-normal text-muted">({term.term_key})</span></p><p className="text-sm text-muted">{term.definition}</p>{term.alternative_labels?.length > 0 && <p className="text-xs text-muted">Também: {term.alternative_labels.join(", ")}</p>}</div><Button variant="outline" disabled={updateTerm.isPending} onClick={() => updateTerm.mutate({ id: term.id, patch: { status: term.status === "retired" ? "active" : "retired" } })} className="border-fam-plum/30 text-fam-plum">{STATUS_LABELS[term.status as TermStatus]} · {term.status === "retired" ? "Reativar" : "Aposentar"}</Button></div>)}</div></CardContent></Card></section>;
}
