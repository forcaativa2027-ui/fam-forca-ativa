"use client";
import { useState } from "react";
import Link from "next/link";
import { useKnowledgeSearch } from "@/hooks/useKnowledge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Search } from "lucide-react";

export default function BuscaPage() {
  const [q, setQ] = useState("");
  const { results, loading } = useKnowledgeSearch(q);
  return (
    <div className="container py-8 space-y-6 max-w-3xl">
      <h1 className="font-display text-3xl text-fam-plum">Busca no INFO</h1>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-fam-muted" />
        <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Busque por título, resumo, palavra-chave (ex: medida protetiva)" className="pl-9" autoFocus />
      </div>
      {loading && <p className="text-sm text-fam-muted">Buscando...</p>}
      <div className="space-y-3">
        {results.map(r => (
          <Link key={r.id} href={`/info/conteudo/${r.slug}`} className="block">
            <Card className="hover:border-fam-magenta/30">
              <CardHeader className="pb-2"><CardTitle className="text-base">{r.title}</CardTitle><CardDescription>{r.summary}</CardDescription></CardHeader>
              <CardContent><span className="text-xs text-fam-muted">{r.level} • {r.estimated_minutes ?? "?"} min</span></CardContent>
            </Card>
          </Link>
        ))}
        {q.length >= 2 && !loading && results.length === 0 && <p className="text-sm text-fam-muted">Nenhum resultado para “{q}”.</p>}
        {q.length < 2 && <p className="text-sm text-fam-muted">Digite ao menos 2 caracteres. Busca inicial usa ilike em title/summary/content.</p>}
      </div>
    </div>
  );
}
