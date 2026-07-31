"use client";
import { BookOpenText, PlayCircle, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePublicSermons } from "@/hooks/use-queries";
import { youtubeId } from "@/services/content";

/**
 * CT-019 §5 — Palavra do Life Group.
 * Reaproveita o módulo de Preguações já existente (decisão tomada:
 * "reaproveitar é mais rápido") em vez de criar um tipo de conteúdo
 * novo. Mostra a pregação mais recente publicada pela igreja do LG —
 * o mesmo conteúdo que a Sede distribui pra toda a igreja já chega
 * automaticamente aqui, sem duplicar cadastro.
 */
export function LgWordOfWeek({ churchId }: { churchId: string | null }) {
  const { data: sermons = [], isLoading } = usePublicSermons(churchId);
  const word = sermons[0] ?? null;

  return (
    <Card className="border-l-4 border-l-navy">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><BookOpenText className="h-5 w-5 text-gold" />Palavra do Life Group</CardTitle>
        <CardDescription>Mensagem disponibilizada pela Igreja Sede</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm italic text-muted">Carregando...</p>
        ) : !word ? (
          <p className="text-sm italic text-muted">Nenhuma palavra publicada ainda esta semana.</p>
        ) : (
          <div className="space-y-3">
            <div>
              <b className="text-navy">{word.title}</b>
              {word.reference && <p className="text-xs text-muted">{word.reference}</p>}
              {word.speaker && <p className="text-xs text-muted">{word.speaker}</p>}
            </div>
            {word.description && <p className="text-sm text-ink">{word.description}</p>}
            <div className="flex flex-wrap gap-2">
              {word.youtube_url && youtubeId(word.youtube_url) && (
                <Button asChild size="sm" variant="outline" className="gap-1.5">
                  <a href={word.youtube_url} target="_blank" rel="noreferrer"><PlayCircle className="h-4 w-4" />Assistir</a>
                </Button>
              )}
              {word.pdf_url && (
                <Button asChild size="sm" variant="outline" className="gap-1.5">
                  <a href={word.pdf_url} target="_blank" rel="noreferrer"><FileText className="h-4 w-4" />Roteiro (PDF)</a>
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
