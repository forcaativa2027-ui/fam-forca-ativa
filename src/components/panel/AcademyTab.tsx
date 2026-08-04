"use client";
import { useState } from "react";
import { GraduationCap, Map, ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useCourses } from "@/hooks/use-queries";
import { ESCOLAS, escolaKeyOf } from "@/components/admin/FormacaoAdmin";
import type { Member } from "@/types/domain";

/**
 * CEC Academy — aba própria do membro (Reestruturação Arquitetural):
 * "Todo aprendizado acontece na Academy. Toda transformação é
 * registrada na Jornada." Aqui o membro navega pelas Escolas e
 * cursos disponíveis; o histórico/diário continua na aba Jornada.
 */
export function AcademyTab({ member, onGoToJourney }: { member: Member | null; onGoToJourney: () => void }) {
  const { data: courses = [] } = useCourses();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const active = courses.filter((c) => c.is_active);
  const groups = ESCOLAS.map((escola) => ({
    ...escola,
    courses: active.filter((c) => escolaKeyOf(c.category) === escola.key),
  })).filter((g) => g.courses.length > 0);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5 text-gold" />CEC Academy</CardTitle>
          <CardDescription>Trilhas, escolas e cursos disponíveis pra sua formação contínua.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {groups.length === 0 && <p className="py-6 text-center text-sm italic text-muted-foreground">Nenhum curso disponível no momento.</p>}
          {groups.map((g) => {
            const Icon = g.icon;
            const isCollapsed = collapsed[g.key];
            return (
              <div key={g.key} className="rounded-xl border">
                <button onClick={() => setCollapsed((c) => ({ ...c, [g.key]: !c[g.key] }))} className="flex w-full items-center justify-between p-3">
                  <span className="flex items-center gap-2 font-display text-base text-navy">
                    <Icon className="h-4 w-4 text-gold" />{g.label}
                    <span className="rounded-full bg-navy/10 px-2 py-0.5 text-[11px] font-bold text-navy">{g.courses.length}</span>
                  </span>
                  {isCollapsed ? <ChevronRight className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>
                {!isCollapsed && (
                  <div className="space-y-1.5 border-t p-3">
                    {g.courses.map((c) => (
                      <div key={c.id} className="rounded-lg border p-2.5">
                        <p className="text-sm font-semibold text-navy">{c.name}</p>
                        {c.description && <p className="text-xs text-muted-foreground">{c.description}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <button onClick={onGoToJourney}
        className="flex w-full items-center justify-between rounded-xl border bg-card p-3 text-sm text-navy hover:bg-accent">
        <span className="flex items-center gap-2"><Map className="h-4 w-4 text-gold" />Ver meu histórico e Diário de Formação na Jornada</span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  );
}
