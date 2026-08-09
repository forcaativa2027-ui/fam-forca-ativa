"use client";
import { InviteLinksAdmin } from "../InviteLinksAdmin";
import { LeadershipAdmin } from "../LeadershipAdmin";
import { CECmaisOfertasAdmin } from "../CECmaisOfertasAdmin";
import { MdaStructureAdmin } from "../MdaStructureAdmin";
import { EvangelismGroupsAdmin } from "../EvangelismGroupsAdmin";
import { useMyProfile, useMyActiveModules, usePendingCounts } from "@/hooks/use-queries";
import { DELEGATION_TAB_MAP } from "@/services/delegations";
import { MembersAdmin } from "../MembersAdmin";
import { DiscipleshipAdmin } from "../DiscipleshipAdmin";
import { WeeklyReportsAdmin } from "../WeeklyReportsAdmin";
import { MonthlyReportAdmin } from "../MonthlyReportAdmin";
import { RelmdaSupervisorAdmin } from "../RelmdaSupervisorAdmin";
import { RelmdaConsolidacaoAdmin } from "../RelmdaConsolidacaoAdmin";
import { RelmdaDashboardAdmin } from "../RelmdaDashboardAdmin";
import { RelmdaDeadlineAdmin } from "../RelmdaDeadlineAdmin";
import { AreaConsolidadoAdmin } from "../AreaConsolidadoAdmin";
import { GivingAdmin } from "../GivingAdmin";
import { CecNewsVideosAdmin } from "../CecNewsVideosAdmin";
import { CecIdPortariaAdmin } from "../CecIdPortariaAdmin";
import { FinanceAdmin } from "../FinanceAdmin";
import { NewsAdmin } from "../NewsAdmin";
import { PublicPrayerRequestsAdmin, VisitRequestsAdmin } from "../ContactRequestsAdmin";
import { BannersAdmin } from "../BannersAdmin";
import { CommunitiesAdmin } from "../CommunitiesAdmin";
import { OrgStructureAdmin } from "../OrgStructureAdmin";
import { PermissionsAdmin } from "../PermissionsAdmin";
import { MdaHealthAdmin } from "../MdaHealthAdmin";
import { OrgDashboardAdmin } from "../OrgDashboardAdmin";
import { IntelligenceAdmin } from "../IntelligenceAdmin";
import { ControlTowerAdmin } from "../ControlTowerAdmin";
import { DelegationsAdmin } from "../DelegationsAdmin";
import { PendenciasAdmin } from "../PendenciasAdmin";
import { AgendaAdmin } from "../AgendaAdmin";
import { RegistrationEventsAdmin } from "../RegistrationEventsAdmin";
import { EditorialDashboardAdmin } from "../EditorialDashboardAdmin";
import { ContentLibraryAdmin } from "../ContentLibraryAdmin";
import { CategoriesTagsAdmin } from "../CategoriesTagsAdmin";
import { NotificacoesAdmin } from "../NotificacoesAdmin";
import { FormacaoAdmin } from "../FormacaoAdmin";
import { KnowledgePointsAdmin } from "../KnowledgePointsAdmin";
import { KnowledgeLibraryAdmin } from "../KnowledgeLibraryAdmin";
import { BibleCrossReferencesAdmin } from "../BibleCrossReferencesAdmin";
import { PainelUsuariosAdmin } from "../PainelUsuariosAdmin";
import { MinisterialReportsAdmin } from "../MinisterialReportsAdmin";
import { GenealogyAdmin } from "../GenealogyAdmin";
import { ExpansionMapAdmin } from "../ExpansionMapAdmin";
import { PatrimonyAdmin } from "../PatrimonyAdmin";
import { ExportAdmin } from "../ExportAdmin";
import { AdvancedSearchAdmin } from "../AdvancedSearchAdmin";
import { GpvAdmin } from "../GpvAdmin";
import { CellsAdmin } from "../CellsAdmin";
import { SupervisionDashboard } from "../SupervisionDashboard";
import { CrmPipelineAdmin } from "../CrmPipelineAdmin";
import { AcolhimentoAdmin } from "../AcolhimentoAdmin";
import { EvasionAdmin } from "../EvasionAdmin";
import { MinistriesAdmin } from "../MinistriesAdmin";
import { HealthAdmin } from "../HealthAdmin";
import type { TabKey } from "../AdminSidebar";
import { AuditAdmin } from "../AuditAdmin";
import { MetasPlaceholder } from "../Placeholders";
import { MemberScoreAdmin } from "../MemberScoreAdmin";
import { BirthdaysAdmin } from "../BirthdaysAdmin";
import { MeuPainel } from "./MeuPainel";
import { SermonsAdmin } from "./SermonsAdmin";
import { EventsAdmin } from "./EventsAdmin";
import { ServiceTimesAdmin } from "./ServiceTimesAdmin";
import { DailyWordsAdmin } from "./DailyWordsAdmin";

// AuditView foi extraído para AuditAdmin.tsx (reutilizado também em /governanca).
function AuditView() {
  return <AuditAdmin />;
}

export function TabContent({ activeTab, onNavigate, prefillEventId }: { activeTab: TabKey; onNavigate: (tab: TabKey) => void; prefillEventId?: string | null }) {
  const { data: profile } = useMyProfile();
  const { data: activeModules = [] } = useMyActiveModules();
  const { data: counts } = usePendingCounts();
  const isApostolo = profile?.role === "apostolo";

  if (!isApostolo) {
    const allowedTabKeys = new Set(activeModules.flatMap((m) => DELEGATION_TAB_MAP[m] ?? []));
    if (!allowedTabKeys.has(activeTab)) {
      return <MeuPainel profile={profile} allowedTabKeys={allowedTabKeys} counts={counts} onNavigate={onNavigate} />;
    }
  }

  switch (activeTab) {
    case "usuarios-painel":      return <PainelUsuariosAdmin onNavigate={onNavigate} />;
    case "formacao":             return <FormacaoAdmin />;
    case "conhecimento-biblico": return <KnowledgePointsAdmin />;
    case "biblioteca-conhecimento": return <KnowledgeLibraryAdmin />;
    case "biblia-referencias": return <BibleCrossReferencesAdmin />;
    case "notificacoes":         return <NotificacoesAdmin />;
    case "agenda":               return <AgendaAdmin onNavigate={onNavigate} />;
    case "pendencias":          return <PendenciasAdmin onNavigate={onNavigate} />;
    case "delegations":         return <DelegationsAdmin />;
    case "invites":             return <InviteLinksAdmin />;
    case "audit":               return <AuditView />;
    case "org-dashboard":       return <OrgDashboardAdmin onNavigate={onNavigate} />;
    case "supervision":         return <SupervisionDashboard />;
    case "control-tower":       return <ControlTowerAdmin onNavigate={onNavigate} />;
    case "intelligence":        return <IntelligenceAdmin />;
    case "ministerial-reports": return <MinisterialReportsAdmin />;
    case "metas":               return <MetasPlaceholder />;
    case "members":             return <MembersAdmin />;
    case "leadership":          return <LeadershipAdmin />;
    case "cecmais-ofertas":     return <CECmaisOfertasAdmin />;
    case "score":                return <MemberScoreAdmin />;
    case "birthdays":            return <BirthdaysAdmin />;
    case "discipleship":        return <DiscipleshipAdmin />;
    case "acolhimento":         return <AcolhimentoAdmin />;
    case "evasao":              return <EvasionAdmin />;
    case "crm":                 return <CrmPipelineAdmin />;
    case "prayer-requests":     return <PublicPrayerRequestsAdmin />;
    case "visit-requests":      return <VisitRequestsAdmin />;
    case "communities":         return <CommunitiesAdmin />;
    case "structure":           return <OrgStructureAdmin />;
    case "genealogy":           return <GenealogyAdmin />;
    case "expansion-map":       return <ExpansionMapAdmin />;
    case "ministerios":         return <MinistriesAdmin />;
    case "life-groups":         return <CellsAdmin />;
    case "mda-health":          return <MdaHealthAdmin />;
    case "saude":               return <HealthAdmin />;
    case "mda":                 return <MdaStructureAdmin />;
    case "evangelism-groups":   return <EvangelismGroupsAdmin />;
    case "permissions":         return <PermissionsAdmin />;
    case "weekly":              return <WeeklyReportsAdmin />;
    case "monthly":             return <MonthlyReportAdmin />;
    case "relmda-supervisao":   return <RelmdaSupervisorAdmin />;
    case "relmda-consolidacao": return <RelmdaConsolidacaoAdmin />;
    case "relmda-dashboard":    return <RelmdaDashboardAdmin />;
    case "relmda-prazos":       return <RelmdaDeadlineAdmin />;
    case "relmda-area":         return <AreaConsolidadoAdmin />;
    case "cec-id-portaria":     return <CecIdPortariaAdmin />;
    case "news":                return <NewsAdmin />;
    case "banners":             return <BannersAdmin />;
    case "sermons":             return <SermonsAdmin />;
    case "giving":               return <GivingAdmin />;
    case "news-videos":          return <CecNewsVideosAdmin prefillEventId={prefillEventId} />;
    case "events":              return <EventsAdmin />;
    case "registration-events": return <RegistrationEventsAdmin />;
    case "editorial-dashboard": return <EditorialDashboardAdmin onNavigate={onNavigate} />;
    case "content-library":     return <ContentLibraryAdmin />;
    case "categories-tags":     return <CategoriesTagsAdmin />;
    case "services":            return <ServiceTimesAdmin />;
    case "word":                return <DailyWordsAdmin />;
    case "finance":             return <FinanceAdmin />;
    case "patrimony":           return <PatrimonyAdmin />;
    case "gpv":                 return <GpvAdmin />;
    case "export":              return <ExportAdmin />;
    case "pesquisa-avancada":   return <AdvancedSearchAdmin />;
    default:                    return null;
  }
}
