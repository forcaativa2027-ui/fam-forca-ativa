"use client";
import { useMemo, useState } from "react";
import { ChevronRight, Building2, Network, Users, Flame, ArrowLeft, Landmark, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useMdaHealth } from "@/hooks/use-queries";
import type { MdaHealthRow, MdaStatus } from "@/types/domain";

type Level = "nacional" | "estado" | "nucleo" | "distrito" | "setor" | "igreja" | "lg";

interface PathStep { level: Level; id: string | null; name: string; }

interface NodeCard {
  id: string;
  name: string;
  health: MdaStatus | null;
  childrenCount: number;
  membersCount: number;
  extra?: string;
}

const HEALTH_STYLE: Record<MdaStatus, { emoji: string; bg: string; border: string; text: string; label: string }> = {
  saudavel:  { emoji: "🟢", bg: "bg-green-50",  border: "border-green-300",  text: "text-green-700",  label: "Saudável" },
  atencao:   { emoji: "🟡", bg: "bg-yellow-50", border: "border-yellow-300", text: "text-yellow-700", label: "Atenção" },
  necessita: { emoji: "🔴", bg: "bg-red-50",    border: "border-red-300",    text: "text-red-700",    label: "Necessita apoio" },
};

const LEVEL_CHILD_LABEL: Record<Level, string> = {
  nacional: "estado(s)", estado: "núcleo(s)", nucleo: "distrito(s)", distrito: "setor(es)",
  setor: "igreja(s) local(is)", igreja: "life group(s)", lg: "",
};
const LEVEL_ICON: Record<Level, React.ReactNode> = {
  nacional: <MapPin size={16} />, estado: <MapPin size={16} />, nucleo: <Network size={16} />,
  distrito: <Network size={16} />, setor: <Network size={16} />, igreja: <Landmark size={16} />, lg: <Flame size={16} />,
};

export function HierarchyExplorer() {
  const { data: rows = [], isLoading } = useMdaHealth();
  const [path, setPath] = useState<PathStep[]>([{ level: "nacional", id: null, name: "Comunidade Evangélica Cristã" }]);
  const current = path[path.length - 1];

  const cards = useMemo(() => buildCards(rows, current), [rows, current]);
  const currentLg = current.level === "lg" ? rows.find((r) => r.lg_id === current.id) : null;

  function drillInto(card: NodeCard) {
    setPath((p) => [...p, { level: nextLevelOf(current.level), id: card.id, name: card.name }]);
  }
  function jumpTo(index: number) {
    setPath((p) => p.slice(0, index + 1));
  }

  if (isLoading) {
    return <p className="py-6 text-center text-sm italic text-muted">Carregando estrutura…</p>;
  }
  if (rows.length === 0) {
    return <p className="py-6 text-center text-sm italic text-muted">Sem dados de estrutura territorial ainda.</p>;
  }

  return (
    <div className="space-y-3">
      {/* Breadcrumb */}
      <nav className="flex flex-wrap items-center gap-1 text-xs text-muted">
        {path.length > 1 && (
          <button onClick={() => jumpTo(path.length - 2)} className="mr-1 flex items-center gap-1 rounded border px-1.5 py-0.5 hover:bg-muted/30">
            <ArrowLeft size={11} /> Voltar
          </button>
        )}
        {path.map((step, i) => (
          <span key={`${step.level}-${step.id ?? "root"}`} className="flex items-center gap-1">
            <button
              onClick={() => jumpTo(i)}
              disabled={i === path.length - 1}
              className={i === path.length - 1 ? "font-semibold text-navy" : "hover:underline"}
            >
              {step.name}
            </button>
            {i < path.length - 1 && <ChevronRight size={11} />}
          </span>
        ))}
      </nav>

      {/* Detalhe de LG (folha) */}
      {current.level === "lg" && currentLg ? (
        <Card>
          <CardContent className="pt-4 space-y-2">
            <div className="flex items-center gap-2">
              <Flame size={16} className="text-gold" />
              <b className="text-navy">{currentLg.lg_name}</b>
              {currentLg.lg_health && (
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${HEALTH_STYLE[currentLg.lg_health].bg} ${HEALTH_STYLE[currentLg.lg_health].border} ${HEALTH_STYLE[currentLg.lg_health].text}`}>
                  {HEALTH_STYLE[currentLg.lg_health].emoji} {HEALTH_STYLE[currentLg.lg_health].label}
                </span>
              )}
            </div>
            <p className="text-xs text-muted">Status: {currentLg.lg_status_lg ?? "—"}</p>
            <p className="text-xs text-muted">Membros: {currentLg.lg_members_count ?? 0}</p>
            <p className="text-xs text-muted">
              Último relatório: {currentLg.lg_last_report_date ? new Date(currentLg.lg_last_report_date).toLocaleDateString("pt-BR") : "nunca"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <button key={c.id} onClick={() => drillInto(c)} className="text-left">
              <Card className={`h-full transition hover:shadow-md hover:-translate-y-0.5 ${c.health ? `border-l-4 ${HEALTH_STYLE[c.health].border}` : ""}`}>
                <CardContent className="pt-3 pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-navy-600">
                      {LEVEL_ICON[nextLevelOf(current.level)]}
                      <b className="text-sm text-navy">{c.name}</b>
                    </div>
                    {c.health && <span className="text-sm">{HEALTH_STYLE[c.health].emoji}</span>}
                  </div>
                  <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted">
                    {current.level !== "igreja" && (
                      <span>{c.childrenCount} {LEVEL_CHILD_LABEL[current.level]}</span>
                    )}
                    <span className="flex items-center gap-0.5"><Users size={11} /> {c.membersCount}</span>
                  </div>
                  {c.extra && <p className="mt-1 text-[10px] text-muted">{c.extra}</p>}
                </CardContent>
              </Card>
            </button>
          ))}
          {cards.length === 0 && (
            <p className="col-span-full py-4 text-center text-xs italic text-muted">Nada cadastrado neste nível ainda.</p>
          )}
        </div>
      )}
    </div>
  );
}

function nextLevelOf(level: Level): Level {
  if (level === "nacional") return "estado";
  if (level === "estado") return "nucleo";
  if (level === "nucleo") return "distrito";
  if (level === "distrito") return "setor";
  if (level === "setor") return "igreja";
  return "lg";
}

function buildCards(rows: MdaHealthRow[], current: PathStep): NodeCard[] {
  const level = current.level;
  const scoped =
    level === "nacional" ? rows :
    level === "estado" ? rows.filter((r) => r.state_id === current.id) :
    level === "nucleo" ? rows.filter((r) => r.nucleo_id === current.id) :
    level === "distrito" ? rows.filter((r) => r.district_id === current.id) :
    level === "setor" ? rows.filter((r) => r.sector_id === current.id) :
    rows.filter((r) => r.church_id === current.id); // "igreja" -> lista LGs (folhas)

  if (level === "igreja") {
    return scoped
      .filter((r) => r.lg_id)
      .map((r) => ({
        id: r.lg_id as string, name: r.lg_name ?? "Life Group", health: r.lg_health,
        childrenCount: 0, membersCount: r.lg_members_count ?? 0,
        extra: r.lg_status_lg ? `Status: ${r.lg_status_lg}` : undefined,
      }));
  }

  const groupKey: keyof MdaHealthRow =
    level === "nacional" ? "state_id" :
    level === "estado" ? "nucleo_id" :
    level === "nucleo" ? "district_id" :
    level === "distrito" ? "sector_id" : "church_id";
  const nameKey: keyof MdaHealthRow =
    level === "nacional" ? "state_name" :
    level === "estado" ? "nucleo_name" :
    level === "nucleo" ? "district_name" :
    level === "distrito" ? "sector_name" : "church_name";
  const healthKey: keyof MdaHealthRow =
    level === "nacional" ? "state_health" :
    level === "estado" ? "nucleo_health" :
    level === "nucleo" ? "district_health" :
    level === "distrito" ? "sector_health" : "church_health";

  const groups = new Map<string, MdaHealthRow[]>();
  for (const r of scoped) {
    const id = r[groupKey] as string | null;
    if (!id) continue;
    if (!groups.has(id)) groups.set(id, []);
    groups.get(id)!.push(r);
  }

  const cards: NodeCard[] = [];
  for (const [id, group] of groups) {
    const first = group[0];
    const childIds = new Set(
      group.map((r) => {
        if (level === "nacional") return r.nucleo_id;
        if (level === "estado") return r.district_id;
        if (level === "nucleo") return r.sector_id;
        if (level === "distrito") return r.church_id;
        return r.lg_id;
      }).filter(Boolean)
    );
    cards.push({
      id,
      name: (first[nameKey] as string) ?? "—",
      health: (first[healthKey] as MdaStatus) ?? null,
      childrenCount: childIds.size,
      membersCount: group.reduce((s, r) => s + (r.lg_members_count ?? 0), 0),
    });
  }
  return cards.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}
