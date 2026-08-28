"use client";

import Link from "next/link";
import { Search, BookOpen, ShieldCheck, ArrowRight, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFamKnowledgeContents, useFamKnowledgeSearch, useFamKnowledgeTrails } from "@/hooks/use-fam-knowledge";
import type { FamKnowledgeContent } from "@/services/famKnowledge";

const TOPICS = [
  { key: "direitos", label: "Direitos" },
  { key: "protecao", label: "Proteção" },
  { key: "atendimento", label: "Atendimento" },
  { key: "seguranca", label: "Segurança" },
  { key: "privacidade", label: "Privacidade" },
  { key: "servicos", label: "Serviços" },
];

function ContentCard({ item }: { item: FamKnowledgeContent }) {
  return (
    <Card className="h-full border-fam-pink/20 transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-fam-magenta">
          <BookOpen className="h-4 w-4" aria-hidden="true" />
          {item.content_type}
        </div>
        <CardTitle className="text-lg text-fam-plum">{item.title}</CardTitle>
        <CardDescription className="text-fam-night/70">{item.summary}</CardDescription>
      </CardHeader>
      <CardContent className="flex h-full flex-col">
        <p className="text-sm leading-6 text-fam-night/75">Informação educativa com fonte identificada e revisão controlada.</p>
        <Button asChild variant="ghost" className="mt-4 justify-start gap-2 px-0 font-semibold text-fam-purple hover:bg-fam-pink/10 hover:text-fam-plum">
          <Link href={`/jornada-conhecimento/conteudo/${encodeURIComponent(item.content_key)}`}>
            Ver orientação <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export function FamKnowledgeJourney() {
  const [term, setTerm] = useState("");
  const [topic, setTopic] = useState<string | undefined>();
  const { data: contents = [], isLoading: loadingContents, isError: contentsError } = useFamKnowledgeContents(topic ? { topic } : undefined);
  const { data: searchResults = [], isLoading: loadingSearch } = useFamKnowledgeSearch(term);
  const { data: trails = [] } = useFamKnowledgeTrails();
  const items = term.trim() ? searchResults : contents;

  return (
    <main className="min-h-screen bg-background pb-16">
      <section className="bg-fam-plum px-4 py-12 text-white sm:px-6">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-fam-gold">Força Ativa da Mulher</p>
          <h1 className="mt-3 max-w-3xl font-display text-3xl font-bold sm:text-4xl">Conheça seus direitos</h1>
          <p className="mt-3 max-w-2xl text-white/85">Informações claras sobre proteção, atendimento, serviços e direitos. Você escolhe o que deseja conhecer e qual será o próximo passo.</p>
          <form className="mt-6 flex max-w-2xl gap-2" onSubmit={(event) => event.preventDefault()} role="search">
            <label className="sr-only" htmlFor="knowledge-search">O que você precisa saber?</label>
            <input id="knowledge-search" value={term} onChange={(event) => setTerm(event.target.value)} placeholder="O que você precisa saber?" className="min-w-0 flex-1 rounded-lg border border-white/30 bg-white px-4 py-3 text-fam-night placeholder:text-fam-plum/60 outline-none ring-fam-gold focus:ring-2" />
            <Button type="submit" className="border border-fam-gold bg-fam-gold font-bold text-fam-night hover:bg-fam-gold/90"><Search className="h-4 w-4" aria-hidden="true" /><span className="sr-only sm:not-sr-only sm:ml-2">Buscar</span></Button>
          </form>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-10 px-4 py-8 sm:px-6">
        <section aria-labelledby="topics-title">
          <div className="mb-4 flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-fam-magenta" aria-hidden="true" /><h2 id="topics-title" className="font-display text-2xl text-navy">Encontre por tema</h2></div>
          <div className="flex flex-wrap gap-2">
            <Button variant={!topic ? "default" : "outline"} onClick={() => setTopic(undefined)} className={!topic ? "border-fam-purple bg-fam-purple font-bold text-white hover:bg-fam-plum" : "border-fam-purple/40 text-fam-purple hover:bg-fam-pink/10 hover:text-fam-plum"}>Todos</Button>
            {TOPICS.map((item) => <Button key={item.key} variant={topic === item.key ? "default" : "outline"} onClick={() => setTopic(item.key)} className={topic === item.key ? "border-fam-purple bg-fam-purple font-bold text-white hover:bg-fam-plum" : "border-fam-purple/40 text-fam-purple hover:bg-fam-pink/10 hover:text-fam-plum"}>{item.label}</Button>)}
          </div>
        </section>

        <section aria-labelledby="contents-title">
          <div className="mb-4 flex items-end justify-between gap-4"><div><h2 id="contents-title" className="font-display text-2xl text-fam-plum">Orientações disponíveis</h2><p className="mt-1 text-sm text-fam-night/70">Conteúdos publicados, revisados e com fonte identificada.</p></div></div>
          {(loadingContents || loadingSearch) && <p role="status" className="text-sm text-fam-purple">Estamos carregando as informações…</p>}
          {contentsError && <p role="alert" className="rounded-lg border border-fam-pink/30 bg-fam-pink/10 p-4 text-sm text-fam-plum">Não foi possível carregar as orientações. Tente novamente mais tarde.</p>}
          {!loadingContents && !loadingSearch && !contentsError && items.length === 0 && <p className="rounded-lg border border-dashed border-fam-gold/50 bg-fam-gold/5 p-6 text-sm text-fam-plum/80">Não encontramos um conteúdo correspondente. Tente usar outras palavras ou escolha um dos temas abaixo.</p>}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map((item) => <ContentCard key={item.id} item={item} />)}</div>
        </section>

        {trails.length > 0 && <section aria-labelledby="trails-title"><h2 id="trails-title" className="font-display text-2xl text-fam-plum">Jornadas para aprender no seu ritmo</h2><div className="mt-4 grid gap-4 sm:grid-cols-2">{trails.map((trail) => <Card key={trail.id} className="border-fam-gold/30 bg-white"><CardHeader><CardTitle className="text-lg text-fam-plum">{trail.title}</CardTitle><CardDescription className="text-fam-night/70">{trail.summary}</CardDescription></CardHeader><CardContent><Button asChild variant="outline" className="gap-2 border-fam-purple text-fam-purple hover:bg-fam-purple hover:text-white"><Link href={`/jornada-conhecimento/trilhas/${encodeURIComponent(trail.trail_key)}`}>Começar trilha <ArrowRight className="h-4 w-4" /></Link></Button></CardContent></Card>)}</div></section>}

        <section className="rounded-2xl border border-fam-gold/40 bg-fam-gold/10 p-5" aria-labelledby="sources-note"><h2 id="sources-note" className="font-display text-lg text-fam-plum">Sobre estas informações</h2><p className="mt-2 text-sm leading-6 text-fam-night/75">Os conteúdos apresentam fontes oficiais, resumos educativos e próximos passos. Eles não substituem a análise de um caso concreto nem obrigam você a tomar uma decisão.</p><Link href="/analise-risco" className="mt-3 inline-flex items-center gap-2 rounded-lg bg-fam-plum px-3 py-2 text-sm font-semibold text-white hover:bg-fam-purple">Precisa de orientação de proteção? <ExternalLink className="h-4 w-4" /></Link></section>
      </div>
    </main>
  );
}
