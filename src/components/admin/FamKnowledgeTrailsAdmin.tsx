"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateFamKnowledgeTrail, useCreateFamKnowledgeTrailStep, useFamKnowledgeTrailForCurator, useFamKnowledgeTrailsForCurator } from "@/hooks/use-fam-knowledge";

export function FamKnowledgeTrailsAdmin() {
  const { data: trails = [], isLoading, isError } = useFamKnowledgeTrailsForCurator();
  const [selectedTrailId, setSelectedTrailId] = useState<string | null>(null);
  const [trailKey, setTrailKey] = useState("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [stepTitle, setStepTitle] = useState("");
  const [stepObjective, setStepObjective] = useState("");
  const [stepContentId, setStepContentId] = useState("");
  const createTrail = useCreateFamKnowledgeTrail();
  const createStep = useCreateFamKnowledgeTrailStep();
  const { data: selected } = useFamKnowledgeTrailForCurator(selectedTrailId);

  async function createTrailForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!trailKey.trim() || !title.trim()) return;
    const trail = await createTrail.mutateAsync({ trail_key: trailKey.trim().toLowerCase().replace(/\s+/g, "-"), title: title.trim(), summary: summary.trim() });
    setSelectedTrailId(trail.id); setTrailKey(""); setTitle(""); setSummary("");
  }

  async function addStep(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedTrailId || !stepTitle.trim()) return;
    const position = (selected?.steps.length ?? 0) + 1;
    await createStep.mutateAsync({ trail_id: selectedTrailId, position, title: stepTitle.trim(), objective: stepObjective.trim(), content_id: stepContentId.trim() || null });
    setStepTitle(""); setStepObjective(""); setStepContentId("");
  }

  return <section className="space-y-4" aria-labelledby="trails-title"><div><h2 id="trails-title" className="font-display text-2xl text-navy">Trilhas e etapas</h2><p className="text-sm text-muted">Monte jornadas em rascunho e associe conteúdos publicados somente após a revisão editorial.</p></div><Card className="border-fam-pink/20"><CardHeader><CardTitle className="text-lg text-navy">Nova trilha</CardTitle></CardHeader><CardContent><form onSubmit={createTrailForm} className="grid gap-3 md:grid-cols-2"><input required aria-label="Chave da trilha" value={trailKey} onChange={(event) => setTrailKey(event.target.value)} placeholder="ex.: direitos-e-protecao" className="rounded-md border border-fam-plum/25 px-3 py-2 text-sm" /><input required aria-label="Título da trilha" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Título da trilha" className="rounded-md border border-fam-plum/25 px-3 py-2 text-sm" /><textarea aria-label="Resumo da trilha" value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Resumo educativo" className="min-h-20 rounded-md border border-fam-plum/25 px-3 py-2 text-sm md:col-span-2" /><div className="md:col-span-2"><Button type="submit" disabled={createTrail.isPending} className="bg-fam-plum hover:bg-fam-plum/90">{createTrail.isPending ? "Salvando…" : "Criar trilha em rascunho"}</Button></div></form></CardContent></Card><div className="grid gap-4 lg:grid-cols-[280px_1fr]"><Card className="border-fam-pink/20"><CardHeader><CardTitle className="text-lg text-navy">Trilhas cadastradas</CardTitle></CardHeader><CardContent className="space-y-2">{isLoading && <p role="status" className="text-sm">Carregando trilhas…</p>}{isError && <p role="alert" className="text-sm text-fam-plum">Não foi possível carregar as trilhas.</p>}{trails.map((trail) => <button type="button" key={trail.id} onClick={() => setSelectedTrailId(trail.id)} className={`w-full rounded-md border p-3 text-left text-sm ${selectedTrailId === trail.id ? "border-fam-plum bg-fam-gold/15" : "border-fam-plum/15"}`}><span className="font-semibold text-navy">{trail.title}</span><span className="block text-xs text-muted">{trail.status} · v{trail.version}</span></button>)}</CardContent></Card><Card className="border-fam-pink/20"><CardHeader><CardTitle className="text-lg text-navy">{selected?.trail.title ?? "Selecione uma trilha"}</CardTitle></CardHeader><CardContent>{selected ? <><ol className="space-y-2" aria-label="Etapas da trilha">{selected.steps.map((step) => <li key={step.id} className="rounded-md bg-fam-gold/10 p-3 text-sm"><strong className="text-navy">{step.position}. {step.title}</strong><p className="text-muted">{step.objective || "Sem objetivo informado"}</p><p className="text-xs text-muted">{step.content_id ? `Conteúdo: ${step.content_id}` : "Conteúdo em preparação editorial"}</p></li>)}</ol><form onSubmit={addStep} className="mt-4 grid gap-2"><input required aria-label="Título da etapa" value={stepTitle} onChange={(event) => setStepTitle(event.target.value)} placeholder="Título da nova etapa" className="rounded-md border border-fam-plum/25 px-3 py-2 text-sm" /><textarea aria-label="Objetivo da etapa" value={stepObjective} onChange={(event) => setStepObjective(event.target.value)} placeholder="Objetivo da etapa" className="min-h-20 rounded-md border border-fam-plum/25 px-3 py-2 text-sm" /><input aria-label="ID do conteúdo" value={stepContentId} onChange={(event) => setStepContentId(event.target.value)} placeholder="ID do conteúdo publicado (opcional)" className="rounded-md border border-fam-plum/25 px-3 py-2 text-sm" /><Button type="submit" disabled={createStep.isPending} className="w-fit bg-fam-plum hover:bg-fam-plum/90">{createStep.isPending ? "Salvando…" : "Adicionar etapa"}</Button></form></> : <p className="text-sm text-muted">Escolha uma trilha para editar suas etapas.</p>}</CardContent></Card></div></section>;
}
