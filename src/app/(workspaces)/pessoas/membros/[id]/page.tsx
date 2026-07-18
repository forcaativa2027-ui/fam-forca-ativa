import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyProfile } from "@/services/profiles";
import type { Member } from "@/types/domain";
import { WorkspaceShell } from "../../../WorkspaceShell";
import { MembroPanelTabs } from "./MembroPanelTabs";
import { requireWorkspaceAccess } from "../../../requireWorkspaceAccess";

const STAGE_LABELS: Record<string, string> = {
  visitante: "Visitante", novo_convertido: "Novo convertido", consolidacao: "Consolidação",
  discipulado: "Discipulado", batismo: "Batismo", membro_ativo: "Membro ativo",
  servo: "Servo", lider_formacao: "Líder em formação", lider: "Líder",
  supervisor: "Supervisor", missionario: "Missionário",
};

export default async function MembroPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const profile = await getMyProfile(supabase);
  await requireWorkspaceAccess(supabase, profile);

  const { data: member } = await supabase
    .from("members")
    .select("*")
    .eq("id", id)
    .single<Member>();

  if (!member) notFound();

  return (
    <WorkspaceShell title={`Membro · ${member.full_name}`} userName={profile?.full_name ?? undefined}>
      <div className="container py-8">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border bg-navy-50 font-display text-xl text-navy">
            {member.full_name.slice(0, 1)}
          </div>
          <div>
            <h1 className="font-display text-2xl text-navy">{member.full_name}</h1>
            <p className="text-sm text-muted">
              {STAGE_LABELS[member.journey_stage] ?? member.journey_stage}
              {member.phone ? ` · ${member.phone}` : ""}
              {member.email ? ` · ${member.email}` : ""}
            </p>
          </div>
        </div>
        <MembroPanelTabs memberId={member.id} />
      </div>
    </WorkspaceShell>
  );
}
