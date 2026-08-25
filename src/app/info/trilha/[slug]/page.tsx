import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { getTrackWithItems } from "@/services/knowledge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, ArrowLeft, BookOpen } from "lucide-react";

export default async function TrackPage({ params }: { params: { slug: string } }) {
  const supabase = await createClient();
  const data = await getTrackWithItems(params.slug as any, supabase as any);
  if (!data) return notFound();
  const { track, items } = data as any;
  return (
    <div className="container py-8 space-y-6 max-w-3xl">
      <Link href="/info" className="inline-flex items-center gap-1 text-sm text-fam-muted hover:text-fam-plum"><ArrowLeft className="h-4 w-4" /> Voltar ao INFO</Link>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">Trilha</p>
        <h1 className="mt-2 font-display text-3xl text-fam-plum">{track.title}</h1>
        <p className="mt-2 text-fam-muted">{track.description}</p>
      </div>
      <div className="space-y-3">
        {items.map((it: any, idx: number) => (
          <Link key={it.id} href={`/info/conteudo/${it.content.slug}`} className="block">
            <Card className="hover:border-fam-magenta/30 hover:shadow-sm transition">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">{idx + 1} • {it.content.level}</Badge>
                  <span className="text-xs text-fam-muted flex items-center gap-1"><Clock className="h-3 w-3" />{it.content.estimated_minutes ?? "?"} min</span>
                </div>
                <CardTitle className="text-lg mt-2">{it.content.title}</CardTitle>
                <CardDescription>{it.content.summary}</CardDescription>
              </CardHeader>
              <CardContent>
                <span className="text-sm font-medium text-fam-magenta flex items-center gap-1"><BookOpen className="h-4 w-4" /> Ler</span>
              </CardContent>
            </Card>
          </Link>
        ))}
        {items.length === 0 && <p className="text-sm text-fam-muted">Nenhum conteúdo nesta trilha ainda.</p>}
      </div>
    </div>
  );
}
