"use client";
import { useState } from "react";
import { Star, TrendingUp, Users, Target, BookOpen, Church, ChevronRight, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMemberScores, useChurches, useCells, useAllMembers } from "@/hooks/use-queries";
import type { MemberScore, EngagementBand } from "@/types/domain";
import { TEMPLATE_ENCORAJAMENTO, buildWhatsAppLink } from "@/lib/whatsapp-templates";

// ── Config visual ─────────────────────────────────────────────
const BAND_CONFIG: Record<EngagementBand, { color: string; bg: string; border: string; icon: string; label: string }> = {
  engajado: { color: "text-green-800", bg: "bg-green-100",  border: "border-l-green-500", icon: "🌟", label: "Engajado"  },
  ativo:    { color: "text-blue-800",  bg: "bg-blue-100",   border: "border-l-blue-400",  icon: "✅", label: "Ativo"     },
  em_risco: { color: "text-red-800",   bg: "bg-red-100",    border: "border-l-red-500",   icon: "⚠️", label: "Em Risco"  },
};

const STAGE_LABELS: Record<string, string> = {
  visitante:       "👋 Visitante",
  novo_convertido: "✨ Novo Convertido",
  consolidacao:    "🤝 Consolidação",
  discipulado:     "📖 Discipulado",
  batismo:         "💧 Batismo",
  membro_ativo:    "⭐ Membro Ativo",
  servo:           "🙌 Servo",
  lider_formacao:  "🌱 Líder em Formação",
  lider:           "👑 Líder",
  supervisor:      "🏛️ Supervisor",
  missionario:     "🌍 Missionário",
};

// ── Barra de progresso ────────────────────────────────────────
function ScoreBar({ value, max = 100, color = "bg-[#C9A227]" }: { value: number; max?: number; color?: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="h-1.5 w-full rounded-full bg-gray-100">
      <div className={`h-1.5 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

// ── Card de membro ────────────────────────────────────────────
function MemberScoreCard({ m, phone }: { m: MemberScore; phone?: string | null }) {
  const [open, setOpen] = useState(false);
  const cfg = BAND_CONFIG[m.engagement_band];

  return (
    <Card className={`border-l-4 ${cfg.border}`}>
      <CardContent className="pt-3 pb-3">
        <button className="w-full text-left" onClick={() => setOpen(o => !o)}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-[#0E2A47] truncate">{m.full_name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.color}`}>
                  {cfg.icon} {cfg.label}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {STAGE_LABELS[m.journey_stage] ?? m.journey_stage}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <p className="font-display text-2xl font-bold text-[#0E2A47]">{m.score_total}</p>
                <p className="text-xs text-muted-foreground">/ 100</p>
              </div>
              <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`} />
            </div>
          </div>
          <div className="mt-2"><ScoreBar value={m.score_total} /></div>
        </button>

        {m.engagement_band === "em_risco" && phone && (
          <a
            href={buildWhatsAppLink(phone, TEMPLATE_ENCORAJAMENTO(m.full_name))}
            target="_blank" rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="mt-3 flex items-center justify-center gap-1.5 rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-800 hover:bg-red-100"
          >
            <MessageCircle className="h-3.5 w-3.5" /> Enviar mensagem de encorajamento
          </a>
        )}

        {/* Detalhes expandidos */}
        {open && (
          <div className="mt-4 space-y-3 border-t pt-3">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {[
                { label: "Estágio",       pts: m.pts_estagio,     max: 25 },
                { label: "Progressão",    pts: m.pts_progressao,  max: 20 },
                { label: "Discipulado",   pts: m.pts_discipulado, max: 20 },
                { label: "Presença",      pts: m.pts_presenca,    max: 20 },
                { label: "Ministérios",   pts: m.pts_ministerio,  max: 15 },
              ].map(d => (
                <div key={d.label} className="text-center">
                  <p className="text-[10px] text-muted-foreground">{d.label}</p>
                  <p className="text-sm font-bold text-[#0E2A47]">
                    {d.pts}<span className="font-normal text-muted-foreground text-xs">/{d.max}</span>
                  </p>
                  <ScoreBar value={d.pts} max={d.max}
                    color={d.pts/d.max >= 0.7 ? "bg-green-500" : d.pts/d.max >= 0.4 ? "bg-yellow-400" : "bg-red-400"} />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
              <span>📋 {m.reunioes_presente_90d}/{m.reunioes_total_90d} presenças (90d)</span>
              <span>📖 {m.disc_ativos} discip. ativo(s)</span>
              <span>🙌 {m.total_ministerios} ministério(s)</span>
            </div>

            {m.proximo_estagio && (
              <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 text-xs text-blue-800 flex items-center gap-2">
                <Target className="h-3.5 w-3.5 shrink-0" />
                <span>Próximo passo sugerido: <strong>{STAGE_LABELS[m.proximo_estagio] ?? m.proximo_estagio}</strong></span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Aba de ranking ────────────────────────────────────────────
function RankingTab({ scores }: { scores: MemberScore[] }) {
  const top = [...scores].sort((a, b) => b.score_total - a.score_total).slice(0, 20);
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-[#0E2A47] text-white text-xs uppercase tracking-wider">
          <tr>
            <th className="px-3 py-2 text-left w-8">#</th>
            <th className="px-3 py-2 text-left">Membro</th>
            <th className="px-3 py-2 text-center">Score</th>
            <th className="px-3 py-2 text-center">Estágio</th>
            <th className="px-3 py-2 text-center">Presença</th>
            <th className="px-3 py-2 text-center">Discip.</th>
            <th className="px-3 py-2 text-center">Ministérios</th>
          </tr>
        </thead>
        <tbody>
          {top.map((m, i) => {
            const cfg = BAND_CONFIG[m.engagement_band];
            return (
              <tr key={m.id} className={`border-t ${i < 3 ? "bg-[#C9A227]/5" : i % 2 === 0 ? "bg-gray-50/50" : ""}`}>
                <td className="px-3 py-2 font-bold text-[#0E2A47]">
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                </td>
                <td className="px-3 py-2">
                  <div className="font-medium text-[#0E2A47]">{m.full_name}</div>
                  <div className="text-[11px] text-muted-foreground">{STAGE_LABELS[m.journey_stage] ?? m.journey_stage}</div>
                </td>
                <td className="px-3 py-2 text-center">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${cfg.bg} ${cfg.color}`}>
                    {cfg.icon} {m.score_total}
                  </span>
                </td>
                <td className="px-3 py-2 text-center">{m.pts_estagio}/25</td>
                <td className="px-3 py-2 text-center">{m.reunioes_presente_90d}/{m.reunioes_total_90d}</td>
                <td className="px-3 py-2 text-center">{m.disc_ativos}</td>
                <td className="px-3 py-2 text-center">{m.total_ministerios}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MASTER — MemberScoreAdmin
// ══════════════════════════════════════════════════════════════
export function MemberScoreAdmin() {
  const { data: churches = [] } = useChurches();
  const { data: allMembers = [] } = useAllMembers();
  const [churchFilter, setChurchFilter] = useState("");
  const [lgFilter,     setLgFilter]     = useState("");
  const [bandFilter,   setBandFilter]   = useState("");

  const { data: scores = [], isLoading } = useMemberScores({
    churchId: churchFilter || undefined,
    lgId:     lgFilter     || undefined,
    band:     bandFilter   || undefined,
  });

  const phoneById = new Map(allMembers.map((m) => [m.id, m.phone]));

  const engajados  = scores.filter(s => s.engagement_band === "engajado").length;
  const ativos     = scores.filter(s => s.engagement_band === "ativo").length;
  const emRisco    = scores.filter(s => s.engagement_band === "em_risco").length;
  const avgScore   = scores.length ? Math.round(scores.reduce((a, s) => a + s.score_total, 0) / scores.length) : 0;

  return (
    <div className="space-y-5 p-4">
      <div className="flex items-center gap-2">
        <Star className="h-6 w-6 text-[#C9A227]" />
        <div>
          <h2 className="text-xl font-bold text-[#0E2A47]">Score do Membro</h2>
          <p className="text-xs text-muted-foreground">Jornada individual · Engajamento · Próximo passo</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <Select value={churchFilter || "todas"} onValueChange={v => { const val = v === "todas" ? "" : v; setChurchFilter(val); setLgFilter(""); }}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Todas as comunidades" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            {churches.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={bandFilter || "todos"} onValueChange={v => setBandFilter(v === "todos" ? "" : v)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Todos" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="engajado">🌟 Engajados</SelectItem>
            <SelectItem value="ativo">✅ Ativos</SelectItem>
            <SelectItem value="em_risco">⚠️ Em Risco</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Score médio",   value: avgScore,   color: "border-l-[#C9A227]" },
          { label: "🌟 Engajados",  value: engajados,  color: "border-l-green-500" },
          { label: "✅ Ativos",     value: ativos,     color: "border-l-blue-400"  },
          { label: "⚠️ Em Risco",   value: emRisco,    color: "border-l-red-500"   },
        ].map(k => (
          <Card key={k.label} className={`border-l-4 ${k.color}`}>
            <CardContent className="pt-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{k.label}</p>
              <p className="mt-1 font-display text-3xl font-bold text-[#0E2A47]">{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">📋 Lista</TabsTrigger>
          <TabsTrigger value="ranking">🏆 Ranking</TabsTrigger>
        </TabsList>
        <div className="mt-4">
          <TabsContent value="list">
            {isLoading && <p className="py-8 text-center text-sm text-muted-foreground">Calculando scores…</p>}
            <div className="space-y-2">
              {scores.map(m => <MemberScoreCard key={m.id} m={m} phone={phoneById.get(m.id)} />)}
              {!isLoading && scores.length === 0 && (
                <p className="py-10 text-center text-sm text-muted-foreground">Nenhum membro encontrado.</p>
              )}
            </div>
          </TabsContent>
          <TabsContent value="ranking">
            <RankingTab scores={scores} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
