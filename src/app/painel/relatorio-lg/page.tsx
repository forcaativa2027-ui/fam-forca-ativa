"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useMyProfile, useMyMember, useCells, useRelmdaDraftId } from "@/hooks/use-queries";

const RelmdaLiderForm = dynamic(
  () => import("@/components/panel/RelmdaLiderForm").then((m) => m.RelmdaLiderForm),
  { ssr: false, loading: () => <p className="p-6 text-sm text-muted-foreground">Carregando…</p> }
);

function weekNumberOfMonth(date: Date): number {
  return Math.min(5, Math.ceil(date.getDate() / 7));
}

export default function RelatorioLgPage() {
  const { data: profile, isLoading: loadingProfile } = useMyProfile();
  const { data: member, isLoading: loadingMember } = useMyMember();
  const { data: cells = [], isLoading: loadingCells } = useCells();

  if (loadingProfile || loadingMember || loadingCells) {
    return <main className="grid min-h-screen place-items-center text-sm text-muted-foreground">Carregando…</main>;
  }

  const myCell = member?.life_group_id ? cells.find((c) => c.id === member.life_group_id) ?? null : null;
  const isResponsible = !!myCell && !!profile && (
    myCell.leader_id === profile.id || myCell.coleader_id === profile.id || myCell.supervisor_id === profile.id
  );

  if (!myCell) {
    return (
      <main className="grid min-h-screen place-items-center p-5 text-center">
        <div>
          <p className="text-sm text-muted-foreground">Você ainda não está vinculado a um Life Group.</p>
          <Link href="/painel" className="mt-3 inline-flex items-center gap-1 text-sm text-navy underline"><ArrowLeft className="h-3.5 w-3.5" />Voltar ao painel</Link>
        </div>
      </main>
    );
  }

  if (!isResponsible) {
    return (
      <main className="grid min-h-screen place-items-center p-5 text-center">
        <div>
          <p className="text-sm text-muted-foreground">Você não possui permissão para preencher o relatório deste Life Group.</p>
          <Link href="/painel" className="mt-3 inline-flex items-center gap-1 text-sm text-navy underline"><ArrowLeft className="h-3.5 w-3.5" />Voltar ao painel</Link>
        </div>
      </main>
    );
  }

  const today = new Date();
  const week = weekNumberOfMonth(today);
  const month = today.getMonth() + 1;
  const year = today.getFullYear();

  return <DraftLoader lifeGroupId={myCell.id} cellName={myCell.name} week={week} month={month} year={year} />;
}

function DraftLoader({ lifeGroupId, cellName, week, month, year }: { lifeGroupId: string; cellName: string; week: number; month: number; year: number }) {
  const { data: reportId, isLoading, error } = useRelmdaDraftId(lifeGroupId, week, month, year);

  if (isLoading) return <main className="grid min-h-screen place-items-center text-sm text-muted-foreground">Preparando relatório da semana…</main>;
  if (error || !reportId) return <main className="grid min-h-screen place-items-center text-sm text-red-600">Não foi possível abrir o relatório. Tente novamente.</main>;

  return <RelmdaLiderForm reportId={reportId} cellName={cellName} />;
}
