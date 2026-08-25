"use client";
import { Heart, Map, Award, ClipboardList, Newspaper, Video, Church as ChurchIcon,
  CalendarDays, MapPin, UserPlus, MessageCircle, HeartHandshake, Sparkles, Play,
  Users, UserCog, ClipboardList as ReportsIcon, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePublicSermons, useMyActiveModules } from "@/hooks/use-queries";
import { youtubeThumb } from "@/services/content";
import type { Profile } from "@/types/domain";

/**
 * Dashboard do Membro — Visão Geral (Etapa 1 da melhoria de usabilidade).
 * Ordem deliberada (§5.2 do documento): acolhimento e vida da igreja
 * primeiro, ferramentas administrativas por último e só quando o
 * usuário tiver delegação ativa de verdade — nunca por cargo isolado.
 */
export function MemberOverviewTab({
  profile, churchName, isAdmin, goTab,
}: {
  profile: Profile | null;
  churchName: string | null;
  isAdmin: boolean;
  goTab: (t: string) => void;
}) {
  const { data: sermons = [] } = usePublicSermons(profile?.church_id ?? null);
  const { data: activeModules = [] } = useMyActiveModules();

  // §7.3 — mapeamento dos módulos reais de delegação (GOV-002) pras
  // ferramentas que o documento pede. "Batismos" fica de fora por ora:
  // não existe uma tela própria pra isso ainda no sistema.
  const canMembers   = isAdmin || activeModules.includes("usuarios");
  const canVisitors  = isAdmin || activeModules.includes("usuarios");
  const canLifeGroups = isAdmin || activeModules.includes("administrativo");
  const canReports   = isAdmin || activeModules.includes("supervisao");
  const hasAnyLeadershipTool = canMembers || canVisitors || canLifeGroups || canReports || isAdmin;

  return (
    <div className="space-y-8">
      <LatestSermonsSection sermons={sermons} churchName={churchName} />
      <MemberJourneyGrid goTab={goTab} />
      <CommunityLinksGrid />
      <ParticipationGrid />
      {hasAnyLeadershipTool && (
        <LeadershipToolsSection
          canMembers={canMembers} canVisitors={canVisitors}
          canLifeGroups={canLifeGroups} canReports={canReports} isAdmin={isAdmin}
        />
      )}
    </div>
  );
}

// ============================================================
// §5.4 — Últimas Pregações
// ============================================================
function LatestSermonsSection({ sermons, churchName }: { sermons: import("@/types/domain").Sermon[]; churchName: string | null }) {
  const items = sermons.slice(0, 5);
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg text-navy">Últimas pregações</h2>
        {items.length > 0 && (
          <button onClick={() => { window.location.href = "/?tab=videos"; }} className="text-xs font-semibold text-gold hover:underline">
            Ver mais vídeos
          </button>
        )}
      </div>
      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-card p-6 text-center text-sm italic text-muted">
          Ainda não há pregações publicadas {churchName ? `para ${churchName}` : "para esta comunidade"}.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {items.map((s) => (
            <a
              key={s.id}
              href={s.youtube_url}
              target="_blank"
              rel="noreferrer"
              className="group overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md"
            >
              <div className="relative">
                <img src={s.thumbnail_url || youtubeThumb(s.youtube_url) || ""} alt={s.title} className="aspect-video w-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-navy/85 text-white"><Play className="h-4 w-4" /></span>
                </div>
              </div>
              <div className="p-2.5">
                <b className="block text-xs leading-tight text-ink line-clamp-2">{s.title}</b>
                <p className="mt-1 text-[11px] text-muted">
                  {[s.speaker, s.published_at ? new Date(s.published_at).toLocaleDateString("pt-BR") : null].filter(Boolean).join(" · ")}
                </p>
              </div>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}

// ============================================================
// §6.1 — Meu Caminho
// ============================================================
function MemberJourneyGrid({ goTab }: { goTab: (t: string) => void }) {
  const items = [
    { key: "discipulado", label: "Discipulado", icon: <Heart className="h-5 w-5" />, onClick: () => goTab("discipulado") },
    { key: "jornada", label: "Jornada", icon: <Map className="h-5 w-5" />, onClick: () => goTab("jornada") },
    { key: "ministerio", label: "Ministério", icon: <Award className="h-5 w-5" />, onClick: () => goTab("ministerio") },
    { key: "carteira", label: "Carteira", icon: <ClipboardList className="h-5 w-5" />, onClick: () => { window.location.href = "/painel/carteira"; } },
  ];
  return <LinkGridSection title="Meu Caminho" items={items} />;
}

// ============================================================
// §6.2 — Comunidade
// ============================================================
function CommunityLinksGrid() {
  const items = [
    { key: "noticias", label: "Notícias", icon: <Newspaper className="h-5 w-5" />, onClick: () => { window.location.href = "/?tab=noticias"; } },
    { key: "videos", label: "Vídeos", icon: <Video className="h-5 w-5" />, onClick: () => { window.location.href = "/?tab=videos"; } },
    { key: "cultos", label: "Cultos", icon: <ChurchIcon className="h-5 w-5" />, onClick: () => { window.location.href = "/?tab=cultos"; } },
    { key: "agenda", label: "Agenda", icon: <CalendarDays className="h-5 w-5" />, onClick: () => { window.location.href = "/?tab=agenda"; } },
    { key: "igrejas", label: "Igrejas", icon: <MapPin className="h-5 w-5" />, onClick: () => { window.location.href = "/?tab=igrejas"; } },
  ];
  return <LinkGridSection title="Comunidade" items={items} />;
}

// ============================================================
// §6.3 — Participação
// ============================================================
function ParticipationGrid() {
  const items = [
    { key: "participar", label: "Convidar", icon: <UserPlus className="h-5 w-5" />, onClick: () => { window.location.href = "/?tab=participar"; } },
    { key: "contato", label: "Falar com alguém", icon: <MessageCircle className="h-5 w-5" />, onClick: () => { window.location.href = "/?tab=contato"; } },
    { key: "ofertar", label: "Doação", icon: <HeartHandshake className="h-5 w-5" />, onClick: () => { window.location.href = "/?tab=ofertar"; } },
    { key: "site", label: "Site", icon: <Sparkles className="h-5 w-5" />, onClick: () => { window.location.href = "/"; } },
  ];
  return <LinkGridSection title="Participação" items={items} />;
}

function LinkGridSection({ title, items }: { title: string; items: { key: string; label: string; icon: React.ReactNode; onClick: () => void }[] }) {
  return (
    <section>
      <h2 className="mb-3 font-display text-lg text-navy">{title}</h2>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
        {items.map((item) => (
          <button
            key={item.key}
            onClick={item.onClick}
            className="flex flex-col items-center gap-1.5 rounded-xl border-2 border-border bg-card p-3 text-center transition hover:border-gold/50 hover:bg-gold/5"
          >
            <span className="text-gold">{item.icon}</span>
            <span className="text-xs font-medium text-navy">{item.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

// ============================================================
// §7 — Ferramentas de Liderança (só com delegação ativa real)
// ============================================================
function LeadershipToolsSection({
  canMembers, canVisitors, canLifeGroups, canReports, isAdmin,
}: { canMembers: boolean; canVisitors: boolean; canLifeGroups: boolean; canReports: boolean; isAdmin: boolean }) {
  const items = [
    canMembers   && { key: "members",    label: "Membros",    icon: <Users className="h-5 w-5" />,    href: "/admin" },
    canVisitors  && { key: "visitors",   label: "Visitantes",  icon: <UserCog className="h-5 w-5" />,  href: "/admin" },
    canLifeGroups && { key: "lifeGroups", label: "Life Groups", icon: <ShieldCheck className="h-5 w-5" />, href: "/admin" },
    canReports   && { key: "reports",    label: "Relatórios",  icon: <ReportsIcon className="h-5 w-5" />, href: "/admin" },
  ].filter(Boolean) as { key: string; label: string; icon: React.ReactNode; href: string }[];

  if (items.length === 0 && !isAdmin) return null;

  return (
    <section className="rounded-2xl border-2 border-navy/10 bg-navy/[0.03] p-4">
      <p className="mb-1 text-xs font-bold uppercase tracking-widest text-navy/70">Ferramentas de Liderança</p>
      <p className="mb-3 text-xs text-muted">Visível só porque você tem delegação ativa nessas áreas.</p>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
        {items.map((item) => (
          <a
            key={item.key}
            href={item.href}
            className="flex flex-col items-center gap-1.5 rounded-xl border-2 border-navy/15 bg-white p-3 text-center transition hover:border-navy/40"
          >
            <span className="text-navy">{item.icon}</span>
            <span className="text-xs font-medium text-navy">{item.label}</span>
          </a>
        ))}
        {isAdmin && (
          <a
            href="/admin"
            className="flex flex-col items-center gap-1.5 rounded-xl border-2 border-dashed border-navy/25 bg-white p-3 text-center transition hover:border-navy/50"
          >
            <span className="text-navy"><Sparkles className="h-5 w-5" /></span>
            <span className="text-xs font-medium text-navy">Painel completo</span>
          </a>
        )}
      </div>
    </section>
  );
}
