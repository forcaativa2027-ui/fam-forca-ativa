"use client";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Clock, ClipboardList, Crown, Shield, Heart } from "lucide-react";
import { useCells, useCellMembers } from "@/hooks/use-queries";
import type { Cell, Member, UserRole } from "@/types/domain";

const WEEKDAYS: Record<string, string> = {
  domingo: "Domingo", segunda: "Segunda", terca: "Terça",
  quarta: "Quarta", quinta: "Quinta", sexta: "Sexta", sabado: "Sábado",
};
const STAGE_LABELS: Record<string, string> = {
  visitante: "Visitante", novo_convertido: "Novo convertido", consolidacao: "Consolidação",
  discipulado: "Discipulado", batismo: "Batismo", membro_ativo: "Membro ativo",
  servo: "Servo", lider_formacao: "Líder em formação", lider: "Líder",
  supervisor: "Supervisor", missionario: "Missionário",
};

/**
 * CT-019 — Dashboard do Life Group.
 *
 * O Life Group não pertence ao líder: pertence a todos os seus membros.
 * Por isso existe UM único ambiente compartilhado por todo integrante do
 * LG; o que muda de pessoa pra pessoa são os recursos habilitados,
 * conforme a matriz de permissões do caderno (§7):
 *
 *   Membro    → vê tudo o que é da vida do grupo (programação, membros,
 *               endereço, horário) e participa (pedidos de oração etc.)
 *   Colíder   → tudo do Membro + gestão operacional (relatório, presença)
 *   Líder     → acesso completo de gestão e cuidado pastoral do LG
 *   Supervisor/Pastor/Admin → mesmos dados + ferramentas de conferência,
 *               que já existem em telas próprias de supervisão/auditoria
 *               (não duplicadas aqui nesta Fase 1).
 */
export type LgRole = "membro" | "colider" | "lider" | "supervisor" | "elevado";

const LG_ROLE_LABELS: Record<LgRole, string> = {
  membro: "Membro do Life Group",
  colider: "Colíder do Life Group",
  lider: "Líder do Life Group",
  supervisor: "Supervisor deste Life Group",
  elevado: "Acesso pastoral/administrativo",
};

function deriveLgRole(cell: Cell, profileId: string | null, profileRole: UserRole | undefined, isElevated: boolean): LgRole {
  if (isElevated) return "elevado";
  if (profileRole === "supervisor" || (!!profileId && cell.supervisor_id === profileId)) return "supervisor";
  if (!!profileId && cell.leader_id === profileId) return "lider";
  if (!!profileId && cell.coleader_id === profileId) return "colider";
  return "membro";
}

export function LifeGroupDashboard({
  member, profileId, profileRole, isElevated, churchName,
}: {
  member: Member | null;
  profileId: string | null;
  profileRole: UserRole | undefined;
  isElevated: boolean;
  churchName: string | null;
}) {
  const { data: cells = [] } = useCells();
  const myCell: Cell | null = member?.life_group_id ? (cells.find((c) => c.id === member.life_group_id) ?? null) : null;
  const { data: allMembers = [] } = useCellMembers(myCell?.id ?? null, null);

  if (!member) return <NotLinkedMessage subject="a um Life Group" />;
  if (!myCell) return <AwaitingLgMessage />;

  const lgRole = deriveLgRole(myCell, profileId, profileRole, isElevated);
  // §6/§7 — só Líder e Colíder gerenciam presença, escala e relatório MDA.
  const canManage = lgRole === "lider" || lgRole === "colider";

  const leader = allMembers.find((m) => m.profile_id && m.profile_id === myCell.leader_id) ?? null;
  const coleader = allMembers.find((m) => m.profile_id && m.profile_id === myCell.coleader_id) ?? null;
  const others = allMembers.filter((m) => m.id !== member.id);
  const mapsUrl = myCell.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(myCell.address)}` : null;

  return (
    <div className="space-y-4">
      {lgRole !== "membro" && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-navy/10 px-3 py-1 text-xs font-semibold text-navy">
          {lgRole === "lider" ? <Crown className="h-3.5 w-3.5" /> : <Shield className="h-3.5 w-3.5" />}
          {LG_ROLE_LABELS[lgRole]}
        </span>
      )}

      {/* §6 — Relatório Semanal MDA: exclusivo Líder/Colíder. */}
      {canManage && (
        <Card className="border-l-4 border-l-gold bg-gold/5">
          <CardContent className="flex items-center justify-between gap-3 py-4">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-gold" />
              <div>
                <p className="text-sm font-semibold text-navy">Relatório Semanal do Life Group</p>
                <p className="text-xs text-muted-foreground">Preencha o relatório desta semana pelo celular.</p>
              </div>
            </div>
            <Button asChild size="sm"><Link href="/painel/relatorio-lg">Preencher</Link></Button>
          </CardContent>
        </Card>
      )}

      {/* §3 — Cabeçalho: identificação do Life Group, visível a todos. */}
      <Card className="border-l-4 border-l-gold">
        <CardHeader>
          <CardTitle>{myCell.name}</CardTitle>
          <CardDescription className="space-y-1">
            {churchName && <span className="block">{churchName}</span>}
            {myCell.meeting_weekday && myCell.meeting_time && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />{WEEKDAYS[myCell.meeting_weekday]} às {myCell.meeting_time.slice(0, 5)}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {myCell.address ? (
            <div>
              <p className="text-sm text-ink">{myCell.address}</p>
              {mapsUrl && <Button asChild variant="link" size="sm" className="mt-1 h-auto p-0 text-xs"><a href={mapsUrl} target="_blank" rel="noreferrer">Como chegar →</a></Button>}
            </div>
          ) : (
            <p className="text-sm italic text-muted">Endereço não informado</p>
          )}
          <div className="flex flex-wrap gap-x-6 gap-y-1 border-t pt-3 text-sm">
            <span><b className="text-navy">Líder:</b> {leader?.full_name ?? "—"}</span>
            <span><b className="text-navy">Colíder:</b> {coleader?.full_name ?? "—"}</span>
            <span><b className="text-navy">Membros:</b> {allMembers.length}</span>
          </div>
        </CardContent>
      </Card>

      {/* §5 — Membros do Life Group: visível a todos os integrantes. */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-gold" />Membros do Life Group</CardTitle>
          <CardDescription>{others.length} pessoa(s) além de você</CardDescription>
        </CardHeader>
        <CardContent>
          {others.length === 0 ? (
            <p className="text-sm italic text-muted">Ainda não há outros membros cadastrados nesta célula.</p>
          ) : (
            <ul className="divide-y">
              {others.map((c) => {
                const isLeader = c.profile_id && c.profile_id === myCell.leader_id;
                const isColeader = c.profile_id && c.profile_id === myCell.coleader_id;
                return (
                  <li key={c.id} className="flex items-center justify-between py-3">
                    <div>
                      <span className="flex items-center gap-1.5">
                        <b className="text-navy">{c.full_name}</b>
                        {isLeader && <Crown className="h-3.5 w-3.5 text-gold" aria-label="Líder" />}
                        {isColeader && <Shield className="h-3.5 w-3.5 text-gold" aria-label="Colíder" />}
                      </span>
                      <p className="text-xs text-muted">{STAGE_LABELS[c.journey_stage] ?? c.journey_stage}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Placeholder das próximas fases (§4-§13), já sinalizando o que vem por aí. */}
      <Card className="border-dashed">
        <CardContent className="flex items-center gap-3 py-5 text-sm text-muted-foreground">
          <Heart className="h-5 w-5 shrink-0 text-gold/70" />
          Programação da reunião, Palavra do Life Group, escala e CEC News chegam nas próximas atualizações deste painel.
        </CardContent>
      </Card>
    </div>
  );
}

function NotLinkedMessage({ subject }: { subject: string }) {
  return (
    <Card>
      <CardContent className="pt-8 pb-8 text-center">
        <p className="text-sm text-muted">Você ainda não está vinculado {subject}.</p>
        <p className="mt-1 text-xs text-muted">Fale com a liderança da sua célula para ser cadastrado.</p>
      </CardContent>
    </Card>
  );
}

function AwaitingLgMessage() {
  return (
    <Card className="border-2 border-dashed border-gold/40 bg-gradient-to-br from-gold/5 to-card">
      <CardContent className="pt-8 pb-8 text-center">
        <Heart className="mx-auto h-10 w-10 text-gold" />
        <p className="mt-3 font-display text-lg text-navy">Aguardando indicação do seu Life Group</p>
        <p className="mt-2 text-sm text-muted max-w-md mx-auto">
          A liderança pastoral está cuidando de te indicar para o Life Group mais alinhado com o seu perfil e localização.
          Em breve um pastor(a) entrará em contato.
        </p>
      </CardContent>
    </Card>
  );
}
