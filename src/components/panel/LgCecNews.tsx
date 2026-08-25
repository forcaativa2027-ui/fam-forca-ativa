"use client";
import { Megaphone } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePublicNews } from "@/hooks/use-queries";

/**
 * CT-019 §6 — CEC News.
 * Reaproveita o módulo de Notícias já existente (mesma decisão do
 * §5 — mais rápido que criar um tipo de conteúdo dedicado). Mostra os
 * avisos mais recentes publicados pela igreja do Life Group.
 *
 * Pendente pra uma fase futura, se fizer falta: segmentação por
 * prioridade/tipo (urgente, evento, campanha) e confirmação de
 * leitura — o módulo de Notícias hoje não tem esses campos.
 */
export function LgCecNews({ churchId }: { churchId: string | null }) {
  const { data: news = [], isLoading } = usePublicNews(undefined, churchId);
  const latest = news.slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Megaphone className="h-5 w-5 text-gold" />CEC News</CardTitle>
        <CardDescription>Avisos e comunicados da liderança</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm italic text-muted">Carregando...</p>
        ) : latest.length === 0 ? (
          <p className="text-sm italic text-muted">Nenhum aviso publicado no momento.</p>
        ) : (
          <ul className="divide-y">
            {latest.map((n) => (
              <li key={n.id} className="py-3">
                <b className="text-navy">{n.title}</b>
                {n.summary && <p className="mt-0.5 text-sm text-ink">{n.summary}</p>}
                {n.published_at && (
                  <p className="mt-1 text-xs text-muted">{new Date(n.published_at).toLocaleDateString("pt-BR")}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
