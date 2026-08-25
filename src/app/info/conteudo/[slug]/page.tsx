import Link from "next/link";
import { notFound } from "next/navigation";
import { getContentBySlug } from "@/services/knowledge";
import { supabase } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink } from "lucide-react";

export default async function ContentPage({ params }: { params: { slug: string } }) {
  const content = await getContentBySlug(params.slug as any);
  if (!content) return notFound();
  // fontes vinculadas
  const { data: links } = await (supabase as any).from("knowledge_content_sources").select("source:knowledge_sources(*)").eq("content_id", content.id);
  const sources = (links ?? []).map((l: any) => l.source).filter(Boolean);
  return (
    <div className="container py-8 space-y-6 max-w-3xl">
      <Link href="/info" className="inline-flex items-center gap-1 text-sm text-fam-muted hover:text-fam-plum"><ArrowLeft className="h-4 w-4" /> Voltar</Link>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">{content.level}</p>
        <h1 className="mt-2 font-display text-3xl text-fam-plum">{content.title}</h1>
        <p className="mt-2 text-fam-muted">{content.summary}</p>
      </div>
      <Card>
        <CardContent className="pt-6 prose prose-sm max-w-none">
          <p className="whitespace-pre-wrap leading-relaxed">{content.content}</p>
        </CardContent>
      </Card>
      {sources.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Fonte oficial</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {sources.map((s: any) => (
              <div key={s.id} className="rounded-lg border p-3">
                <p className="font-medium text-fam-plum">{s.title}</p>
                <p className="text-xs text-fam-muted">{s.organization} • {s.source_type} • v{s.version} • verificado {s.last_verified_at}</p>
                {s.official_url && <a href={s.official_url} target="_blank" className="text-sm text-fam-magenta hover:underline flex items-center gap-1 mt-1">Consultar fonte oficial <ExternalLink className="h-3 w-3" /></a>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      <div className="flex gap-2">
        <Button asChild><Link href="/analise-risco">Fazer Mapa de Risco</Link></Button>
        <Button variant="outline" asChild><Link href="/info">Voltar ao INFO</Link></Button>
      </div>
    </div>
  );
}
