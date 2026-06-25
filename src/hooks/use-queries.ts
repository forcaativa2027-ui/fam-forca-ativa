"use client";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import * as P from "@/services/profiles";
import * as Co from "@/services/content";
import * as C from "@/services/churches";
import * as A from "@/services/audit";
import * as D from "@/services/dashboard";
import * as I from "@/services/institutional";
import * as Me from "@/services/members";
import * as Di from "@/services/discipleship";
import * as Tl from "@/services/timeline";
import * as Pr from "@/services/prayer";

export const useMyProfile      = () => useQuery({ queryKey: ["my-profile"], queryFn: () => P.getMyProfile(supabase) });
export const useChurches       = () => useQuery({ queryKey: ["churches"],   queryFn: () => C.listChurches(supabase) });
export const useDistricts      = () => useQuery({ queryKey: ["districts"],  queryFn: () => C.listDistricts(supabase) });
export const useAreas          = () => useQuery({ queryKey: ["areas"],      queryFn: () => C.listAreas(supabase) });
export const useSectors        = () => useQuery({ queryKey: ["sectors"],    queryFn: () => C.listSectors(supabase) });
export const useCells          = () => useQuery({ queryKey: ["cells"],      queryFn: () => C.listCells(supabase) });
export const useMdaAlerts      = () => useQuery({ queryKey: ["mda-alerts"], queryFn: () => C.listMdaAlerts(supabase) });
export const usePublicSermons  = (churchId?: string|null) => useQuery({ queryKey: ["public-sermons", churchId ?? "all"], queryFn: () => Co.listPublicSermons(supabase, churchId) });
export const usePublicEvents   = (churchId?: string|null) => useQuery({ queryKey: ["public-events", churchId ?? "all"],  queryFn: () => Co.listPublicEvents(supabase, churchId) });
export const useSermons        = () => useQuery({ queryKey: ["sermons"], queryFn: () => Co.listSermons(supabase) });
export const useEvents         = () => useQuery({ queryKey: ["events"],  queryFn: () => Co.listEvents(supabase) });
export const useAuditLogs      = () => useQuery({ queryKey: ["audit-logs"], queryFn: () => A.listAuditLogs(supabase) });
export const useDashboard      = (churchId: string|null) => useQuery({ queryKey: ["dashboard", churchId ?? "all"], queryFn: () => D.getDashboardStats(supabase, churchId) });

// B2 — conteudo institucional
export const useServiceTimes   = (churchId: string|null) => useQuery({ queryKey: ["service-times", churchId ?? "none"], queryFn: () => I.listServiceTimes(supabase, churchId) });
export const useAllServiceTimes= () => useQuery({ queryKey: ["service-times-all"], queryFn: () => I.listAllServiceTimes(supabase) });
export const useTodaysWord     = (churchId?: string|null) => useQuery({ queryKey: ["todays-word", churchId ?? "all"], queryFn: () => I.getTodaysWord(supabase, churchId) });
export const useDailyWords     = () => useQuery({ queryKey: ["daily-words"], queryFn: () => I.listDailyWords(supabase) });

// B3 — Area do membro
export const useMyMember          = () => useQuery({ queryKey: ["my-member"], queryFn: () => Me.getMyMember(supabase) });
export const useCellMembers       = (cellId: string|null, excludeId?: string|null) =>
  useQuery({
    queryKey: ["cell-members", cellId ?? "none", excludeId ?? "none"],
    queryFn: () => cellId ? Me.listCellMembers(supabase, cellId, excludeId ?? undefined) : Promise.resolve([]),
    enabled: !!cellId,
  });
export const useMyActiveDiscipleship = (myMemberId: string|null) =>
  useQuery({
    queryKey: ["my-active-discipleship", myMemberId ?? "none"],
    queryFn: () => Di.getMyActiveDiscipleship(supabase, myMemberId),
    enabled: !!myMemberId,
  });
export const useMyDisciples = (myMemberId: string|null) =>
  useQuery({
    queryKey: ["my-disciples", myMemberId ?? "none"],
    queryFn: () => Di.listMyDisciples(supabase, myMemberId),
    enabled: !!myMemberId,
  });
export const useMyTimeline = (memberId: string|null) =>
  useQuery({
    queryKey: ["my-timeline", memberId ?? "none"],
    queryFn: () => Tl.listMemberTimeline(supabase, memberId),
    enabled: !!memberId,
  });
export const useCellPrayers = (cellId: string|null) =>
  useQuery({
    queryKey: ["cell-prayers", cellId ?? "none"],
    queryFn: () => Pr.listCellPrayers(supabase, cellId),
    enabled: !!cellId,
  });

// B4a — Gestão da rede
export const useAllMembers = () => useQuery({
  queryKey: ["all-members"],
  queryFn: () => Me.listAllMembers(supabase),
});
export const useAllDiscipleships = () => useQuery({
  queryKey: ["all-discipleships"],
  queryFn: () => Di.listAllDiscipleships(supabase),
});

// B4b — Operação semanal
import * as Wr from "@/services/weeklyReports";
import * as Mr from "@/services/monthlyReports";
import * as Fn from "@/services/finance";

export const useWeeklyReports = (cellId: string | null) =>
  useQuery({
    queryKey: ["weekly-reports", cellId ?? "none"],
    queryFn: () => Wr.listWeeklyReports(supabase, cellId),
    enabled: !!cellId,
  });

export const useMonthlyReports = (cellId: string | null) =>
  useQuery({
    queryKey: ["monthly-reports", cellId ?? "none"],
    queryFn: () => Mr.listMonthlyReports(supabase, cellId),
    enabled: !!cellId,
  });

export const useMonthlyReportFull = (reportId: string | null) =>
  useQuery({
    queryKey: ["monthly-report-full", reportId ?? "none"],
    queryFn: () => reportId ? Mr.getMonthlyReportFull(supabase, reportId) : Promise.resolve(null),
    enabled: !!reportId,
  });

export const useFinances = (churchId: string | null, year: number, month: number) =>
  useQuery({
    queryKey: ["finances", churchId ?? "none", year, month],
    queryFn: () => Fn.listFinances(supabase, churchId, year, month),
    enabled: !!churchId,
  });

// M1a — Conteudo publico e formularios
import * as N from "@/services/news";
import * as Pf from "@/services/publicForms";

export const usePublicNews = (category?: import("@/types/domain").NewsCategory, churchId?: string|null) =>
  useQuery({
    queryKey: ["public-news", category ?? "all", churchId ?? "all"],
    queryFn: () => N.listPublicNews(supabase, category, churchId),
  });
export const useAllNews = () => useQuery({
  queryKey: ["all-news"], queryFn: () => N.listAllNews(supabase),
});
export const usePrayerRequests = (status?: import("@/types/domain").ContactStatus) =>
  useQuery({
    queryKey: ["prayer-requests", status ?? "all"],
    queryFn: () => Pf.listPrayerRequests(supabase, status),
  });
export const useVisitRequests = (status?: import("@/types/domain").ContactStatus) =>
  useQuery({
    queryKey: ["visit-requests", status ?? "all"],
    queryFn: () => Pf.listVisitRequests(supabase, status),
  });
export const usePendingCounts = () => useQuery({
  queryKey: ["pending-counts"],
  queryFn: () => Pf.getPendingCounts(supabase),
  refetchInterval: 60_000, // atualiza a cada minuto
});

// M1b — Banners
import * as Bn from "@/services/banners";
export const useActiveBanners = (churchId?: string|null) => useQuery({
  queryKey: ["active-banners", churchId ?? "all"],
  queryFn: () => Bn.listActiveBanners(supabase, churchId),
  refetchInterval: 60_000,
});
export const useAllBanners = () => useQuery({
  queryKey: ["all-banners"],
  queryFn: () => Bn.listAllBanners(supabase),
});

// M2a — Multicomunidade
import * as Com from "@/services/community";
export const useActiveCommunity = () => useQuery({
  queryKey: ["active-community"],
  queryFn: () => Com.resolveCommunity(supabase),
  staleTime: 5 * 60 * 1000, // 5min — muda raramente
});

// M4 — CRM Pastoral
import * as Pp from "@/services/pipeline";
export const usePipeline = (opts?: { stage?: import("@/types/domain").PipelineStage; communityId?: string|null }) =>
  useQuery({
    queryKey: ["pipeline", opts?.stage ?? "all", opts?.communityId ?? "all"],
    queryFn: () => Pp.listPipeline(supabase, opts),
  });

// M5 — Central de Acolhimento
export const useAcolhimento = (key: string) =>
  useQuery({
    queryKey: ["acolhimento", key],
    queryFn: () => Pp.listAcolhimento(supabase, key as Parameters<typeof Pp.listAcolhimento>[1]),
  });

// Engajamento — evasão, badges, multiplicação
import * as Eg from "@/services/engagement";
export const useMembersAtRisk = (opts?: { churchId?: string|null; lgId?: string|null }) =>
  useQuery({
    queryKey: ["members-at-risk", opts?.churchId ?? "all", opts?.lgId ?? "all"],
    queryFn: () => Eg.listMembersAtRisk(supabase, opts),
  });
export const useLgBadges = (lgId: string | null) =>
  useQuery({
    queryKey: ["lg-badges", lgId],
    queryFn: () => lgId ? Eg.getLgBadges(supabase, lgId) : Promise.resolve([]),
    enabled: !!lgId,
  });
export const useLgMultiplicationProgress = (lgId: string | null) =>
  useQuery({
    queryKey: ["lg-progress", lgId],
    queryFn: () => lgId ? Eg.getLgMultiplicationProgress(supabase, lgId) : Promise.resolve(null),
    enabled: !!lgId,
  });

// IA-1 — Indicadores objetivos
export const useLgIndicators = (lgId: string | null) => useQuery({
  queryKey: ["lg-indicators", lgId],
  queryFn: () => lgId ? Eg.getLgIndicators(supabase, lgId) : Promise.resolve(null),
  enabled: !!lgId,
});
export const useAllLgIndicators = (communityId?: string | null) => useQuery({
  queryKey: ["all-lg-indicators", communityId ?? "all"],
  queryFn: () => Eg.getAllLgIndicators(supabase, communityId),
});
export const useAggregateIndicators = (level: import("@/types/domain").AggregateLevel | null, scopeId: string | null) =>
  useQuery({
    queryKey: ["aggregate-indicators", level, scopeId],
    queryFn: () => (level && scopeId) ? Eg.getAggregateIndicators(supabase, level, scopeId) : Promise.resolve(null),
    enabled: !!level && !!scopeId,
  });

// Ministérios
import * as Mn from "@/services/ministries";
export const useMinistries = (churchId?: string|null) =>
  useQuery({
    queryKey: ["ministries", churchId ?? "all"],
    queryFn: () => Mn.listMinistries(supabase, churchId),
  });
export const useMyMinistries = () =>
  useQuery({
    queryKey: ["my-ministries"],
    queryFn: () => Mn.listMyMinistries(supabase),
  });
export const useMinistryMembers = (ministryId: string | null) =>
  useQuery({
    queryKey: ["ministry-members", ministryId],
    queryFn: () => ministryId ? Mn.listMinistryMembers(supabase, ministryId) : Promise.resolve([]),
    enabled: !!ministryId,
  });
export const useMinistryPosts = (ministryId?: string|null) =>
  useQuery({
    queryKey: ["ministry-posts", ministryId ?? "all"],
    queryFn: () => Mn.listMinistryPosts(supabase, ministryId),
  });

// M6 — Sugestão de LG
export const useLgSuggestions = (pipelineId: string | null) =>
  useQuery({
    queryKey: ["lg-suggestions", pipelineId],
    queryFn: () => pipelineId ? Pp.suggestLifeGroups(supabase, pipelineId) : Promise.resolve([]),
    enabled: !!pipelineId,
  });

// Tela detalhada do relatório semanal
import { getReportFull } from "@/services/weeklyReports";
export const useReportFull = (reportId: string | null) =>
  useQuery({
    queryKey: ["report-full", reportId],
    queryFn: () => reportId ? getReportFull(supabase, reportId) : Promise.resolve(null),
    enabled: !!reportId,
  });

// Permissões hierárquicas — escopo dos pastores
import * as Ps from "@/services/pastorScope";
export const usePastors = () =>
  useQuery({
    queryKey: ["pastors"],
    queryFn: () => Ps.listPastors(supabase),
  });
export const usePastorsWithoutScopeCount = () =>
  useQuery({
    queryKey: ["pastors-without-scope-count"],
    queryFn: () => Ps.countPastorsWithoutScope(supabase),
  });

// Supervisão hierárquica
import * as Sv from "@/services/supervision";
type SupLevel = "national" | "church_tree" | "church" | "district" | "area" | "sector";
export const useScopeMetrics = (level: SupLevel, id?: string | null) =>
  useQuery({
    queryKey: ["scope-metrics", level, id ?? "self"],
    queryFn: () => Sv.getScopeMetrics(supabase, level, id),
  });
export const useLgsWithHealth = (churchId?: string | null) =>
  useQuery({
    queryKey: ["lgs-with-health", churchId ?? "all"],
    queryFn: () => Sv.listLgsWithHealth(supabase, churchId),
  });

// MDA Health (Caderno 11-B)
import { getMdaHealthDashboard } from "@/services/mdaHealth";
export const useMdaHealth = () =>
  useQuery({
    queryKey: ["mda-health"],
    queryFn: () => getMdaHealthDashboard(supabase),
  });

// Caderno 13 — Visualizações grandes
import * as Vz from "@/services/visualizations";
export const useLgGenealogy = () =>
  useQuery({ queryKey: ["lg-genealogy"], queryFn: () => Vz.getLgGenealogy(supabase) });
export const useOrgKpis = () =>
  useQuery({ queryKey: ["org-kpis"], queryFn: () => Vz.getOrgKpis(supabase) });
export const useGrowthMonthly = () =>
  useQuery({ queryKey: ["growth-monthly"], queryFn: () => Vz.getGrowthMonthly(supabase) });
export const useExpansionCities = () =>
  useQuery({ queryKey: ["expansion-cities"], queryFn: () => Vz.getExpansionCities(supabase) });
export const useExpansionStates = () =>
  useQuery({ queryKey: ["expansion-states"], queryFn: () => Vz.getExpansionStates(supabase) });

// Caderno 12 — Patrimônio
import * as Pt from "@/services/patrimony";
export const useProperties = (churchId?: string | null) =>
  useQuery({ queryKey: ["properties", churchId ?? "all"], queryFn: () => Pt.listProperties(supabase, churchId) });
export const useAssets = (opts?: { churchId?: string | null; propertyId?: string | null }) =>
  useQuery({ queryKey: ["assets", opts?.churchId ?? "all", opts?.propertyId ?? "all"], queryFn: () => Pt.listAssets(supabase, opts) });
export const usePropertyDocs = (propertyId: string | null) =>
  useQuery({
    queryKey: ["property-docs", propertyId],
    queryFn: () => propertyId ? Pt.listPropertyDocs(supabase, propertyId) : Promise.resolve([]),
    enabled: !!propertyId,
  });
export const useAssetDocs = (assetId: string | null) =>
  useQuery({
    queryKey: ["asset-docs", assetId],
    queryFn: () => assetId ? Pt.listAssetDocs(supabase, assetId) : Promise.resolve([]),
    enabled: !!assetId,
  });
export const useAssetPhotos = (assetId: string | null) =>
  useQuery({
    queryKey: ["asset-photos", assetId],
    queryFn: () => assetId ? Pt.listAssetPhotos(supabase, assetId) : Promise.resolve([]),
    enabled: !!assetId,
  });
export const usePatrimonySummary = () =>
  useQuery({ queryKey: ["patrimony-summary"], queryFn: () => Pt.getPatrimonySummary(supabase) });

// C16 — Inteligência Ministerial
import * as Intel from "@/services/intelligence";
export const useLgScores = (churchId?: string) =>
  useQuery({ queryKey: ["lg-scores", churchId], queryFn: () => Intel.getLgScores(supabase, churchId) });
export const useLgRankings = (churchId?: string) =>
  useQuery({ queryKey: ["lg-rankings", churchId], queryFn: () => Intel.getLgRankings(supabase, churchId) });
export const useRetentionFunnel = () =>
  useQuery({ queryKey: ["retention-funnel"], queryFn: () => Intel.getRetentionFunnel(supabase) });
export const useRetentionFunnelByChurch = () =>
  useQuery({ queryKey: ["retention-funnel-church"], queryFn: () => Intel.getRetentionFunnelByChurch(supabase) });
export const useLgReliability = (churchId?: string) =>
  useQuery({ queryKey: ["lg-reliability", churchId], queryFn: () => Intel.getLgReliability(supabase, churchId) });
export const useReliabilitySummary = () =>
  useQuery({ queryKey: ["reliability-summary"], queryFn: () => Intel.getReliabilitySummary(supabase) });
export const useMonthlyConsolidation = (churchId?: string, mes?: string) =>
  useQuery({ queryKey: ["monthly-consolidation", churchId, mes], queryFn: () => Intel.getMonthlyConsolidation(supabase, { churchId, mes }) });
export const useGrowthVariation = () =>
  useQuery({ queryKey: ["growth-variation"], queryFn: () => Intel.getGrowthVariation(supabase) });

// C17 — Central de Metas
import * as Goals from "@/services/goals";
export const useGoals = (year?: number) =>
  useQuery({ queryKey: ["goals", year], queryFn: () => Goals.listGoals(supabase, year) });
export const useGoalsVsActual = (year?: number) =>
  useQuery({ queryKey: ["goals-vs-actual", year], queryFn: () => Goals.listGoalsVsActual(supabase, year) });

// C18 — Torre de Controle
import * as CT from "@/services/controlTower";
import type { AlertType, AlertSeverity } from "@/types/domain";
export const useControlTowerAlerts = (opts?: { severity?: AlertSeverity; alertType?: AlertType; churchId?: string }) =>
  useQuery({ queryKey: ["control-tower-alerts", opts], queryFn: () => CT.getControlTowerAlerts(supabase, opts), refetchInterval: 60000 });
export const useControlTowerSummary = () =>
  useQuery({ queryKey: ["control-tower-summary"], queryFn: () => CT.getControlTowerSummary(supabase), refetchInterval: 60000 });

// C19 — Governança por Delegação
import * as Del from "@/services/delegations";
import type { DelegationModule } from "@/types/domain";
export const useCouncilMembers = () =>
  useQuery({ queryKey: ["council-members"], queryFn: () => Del.listCouncilMembers(supabase) });
export const useDelegations = (opts?: { status?: string; module?: DelegationModule; profile_id?: string }) =>
  useQuery({ queryKey: ["delegations", opts], queryFn: () => Del.listDelegations(supabase, opts) });
export const useRoleDelegations = () =>
  useQuery({ queryKey: ["role-delegations"], queryFn: () => Del.listRoleDelegations(supabase) });
export const useEmergencyAccess = () =>
  useQuery({ queryKey: ["emergency-access"], queryFn: () => Del.listEmergencyAccess(supabase) });
export const useComplianceDashboard = () =>
  useQuery({ queryKey: ["compliance-dashboard"], queryFn: () => Del.getComplianceDashboard(supabase), refetchInterval: 60000 });
export const useModuleRanking = () =>
  useQuery({ queryKey: ["module-ranking"], queryFn: () => Del.getModuleRanking(supabase) });
export const useModuleAccess = (module: DelegationModule) =>
  useQuery({ queryKey: ["module-access", module], queryFn: () => Del.checkModuleAccess(supabase, module), staleTime: 60000 });
