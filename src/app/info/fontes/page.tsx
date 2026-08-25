import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listSources } from "@/services/knowledge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, ArrowLeft } from "lucide-react";

export default async function FontesPage() {
  const supabase = await createClient();
  const sources = await listSources(supabase as any);
  return (
    <div className="container py-8 space-y-6 max-w-4xl">
      <Link href="/info" className="inline-flex items-center gap-1 text-sm text-fam-muted hover:text-fam-plum"><ArrowLeft className="h-4 w-4" /> Voltar ao INFO</Link>
      <div>
        <h1 className="font-display text-3xl text-fam-plum">Fontes oficiais</h1>
        <p className="mt-2 text-fam-muted">Biblioteca governada — cada fonte possui última verificação, status e versão. Conteúdos INFO exibem fontes rastreáveis.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {sources.map(s => (
          <Card key={s.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{s.title}</CardTitle>
              <p className="text-xs text-fam-muted">{s.organization} • {s.source_type} • v{s.version}</p>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex gap-2">
                <Badge variant={s.status === "current" ? "default" : s.status === "review_required" ? "secondary" : "outline"}>{s.status}</Badge>
                <span className="text-xs text-fam-muted">verificado {s.last_verified_at}</span>
              </div>
              {s.official_url && <a href={s.official_url} target="_blank" className="text-sm text-fam-magenta hover:underline flex items-center gap-1">Fonte oficial <ExternalLink className="h-3 w-3" /></a>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
