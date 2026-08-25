import Link from "next/link";
import { listTracks } from "@/services/knowledge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Clock } from "lucide-react";

export default async function TrilhasPage() {
  const tracks = await listTracks();
  return (
    <div className="container py-8 space-y-6 max-w-3xl">
      <Link href="/info" className="inline-flex items-center gap-1 text-sm text-fam-muted hover:text-fam-plum"><ArrowLeft className="h-4 w-4" /> Voltar ao INFO</Link>
      <div>
        <h1 className="font-display text-3xl text-fam-plum">Trilhas</h1>
        <p className="mt-2 text-fam-muted">Jornadas progressivas — progressão sugerida, nunca bloqueada.</p>
      </div>
      <div className="space-y-3">
        {tracks.map(t => (
          <Link key={t.id} href={`/info/trilha/${t.slug}`} className="block">
            <Card className="hover:border-fam-magenta/30">
              <CardHeader>
                <CardTitle>{t.title}</CardTitle>
                <CardDescription>{t.description}</CardDescription>
              </CardHeader>
              <CardContent><span className="text-xs text-fam-muted flex items-center gap-1"><Clock className="h-3 w-3" />{t.estimated_total_minutes ?? "?"} min estimado</span></CardContent>
            </Card>
          </Link>
        ))}
        {tracks.length === 0 && <p className="text-sm text-fam-muted">Nenhuma trilha ainda.</p>}
      </div>
    </div>
  );
}
