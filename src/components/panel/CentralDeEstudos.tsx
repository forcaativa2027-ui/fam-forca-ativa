"use client";
import { BookOpen, Compass } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useCentralEstudos } from "@/hooks/use-queries";

/**
 * CEC Academy Blocos 2/3 — Central de Estudos. Não guarda nada
 * própria — consulta o Conhecimento Integrado (Objetos + Pontos de
 * Conhecimento já vinculados pelo admin) e monta automaticamente o
 * que é relevante pra essa lição, sem o aluno precisar procurar.
 */
export function CentralDeEstudos({ lessonId }: { lessonId: string }) {
  const { data: items = [] } = useCentralEstudos(lessonId);
  if (items.length === 0) return null;

  return (
    <Card className="border-2 border-gold/30 bg-gold/5">
      <CardContent className="space-y-2 pt-4">
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-gold">
          <Compass className="h-3.5 w-3.5" />Central de Estudos — aprofunde este tema
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {items.map((item) => (
            <div key={`${item.kind}-${item.id}`} className="flex items-start gap-2 rounded-md border bg-card p-2.5">
              {item.image_url ? (
                <img src={item.image_url} alt="" className="h-10 w-10 shrink-0 rounded object-cover" />
              ) : (
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded bg-navy/10"><BookOpen className="h-4 w-4 text-navy" /></div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-navy">{item.title}</p>
                {item.subtitle && <p className="truncate text-xs text-gold">{item.subtitle}</p>}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
