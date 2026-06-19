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
