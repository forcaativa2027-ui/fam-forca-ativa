import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import * as Knowledge from "@/services/famKnowledge";

export function useFamKnowledgeReviewAlerts(daysAhead = 30) {
  return useQuery({
    queryKey: ["fam-knowledge-review-alerts", daysAhead],
    queryFn: () => Knowledge.listKnowledgeReviewAlerts(supabase, daysAhead),
    staleTime: 1000 * 60 * 5,
  });
}

export function useFamKnowledgeAuditEvents(limit = 50) {
  return useQuery({
    queryKey: ["fam-knowledge-audit-events", limit],
    queryFn: () => Knowledge.listKnowledgeAuditEvents(supabase, limit),
    staleTime: 1000 * 60,
  });
}

export function useFamKnowledgeContents(filters?: Knowledge.FamKnowledgeFilters) {
  return useQuery({
    queryKey: ["fam-knowledge-contents", filters ?? {}],
    queryFn: () => Knowledge.listPublishedKnowledgeContents(supabase, filters),
    staleTime: 1000 * 60 * 5,
  });
}

export function useFamKnowledgeSearch(term: string) {
  return useQuery({
    queryKey: ["fam-knowledge-search", term],
    queryFn: () => Knowledge.searchPublishedKnowledgeContents(supabase, term),
    enabled: term.trim().length > 0,
    staleTime: 1000 * 60 * 2,
  });
}

export function useFamKnowledgeContent(contentKey: string | null) {
  return useQuery({
    queryKey: ["fam-knowledge-content", contentKey],
    queryFn: () => Knowledge.getPublishedKnowledgeContent(supabase, contentKey as string),
    enabled: !!contentKey,
  });
}

export function useFamKnowledgeSources(contentId: string | null) {
  return useQuery({
    queryKey: ["fam-knowledge-sources", contentId],
    queryFn: () => Knowledge.listKnowledgeSources(supabase, contentId as string),
    enabled: !!contentId,
  });
}

export function useCreateFamKnowledgeSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Knowledge.FamKnowledgeSourceInput) => Knowledge.createKnowledgeSource(supabase, input),
    onSuccess: (_, variables) => queryClient.invalidateQueries({ queryKey: ["fam-knowledge-sources", variables.content_id] }),
  });
}

export function useUpdateFamKnowledgeSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, contentId, patch }: { id: string; contentId: string; patch: Parameters<typeof Knowledge.updateKnowledgeSource>[2] }) => Knowledge.updateKnowledgeSource(supabase, id, patch),
    onSuccess: (_, variables) => queryClient.invalidateQueries({ queryKey: ["fam-knowledge-sources", variables.contentId] }),
  });
}

export function useFamKnowledgeTerms(status?: "active" | "proposed" | "retired") {
  return useQuery({
    queryKey: ["fam-knowledge-terms", status ?? "all"],
    queryFn: () => Knowledge.listKnowledgeTerms(supabase, status),
  });
}

export function useCreateFamKnowledgeTerm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof Knowledge.createKnowledgeTerm>[1]) => Knowledge.createKnowledgeTerm(supabase, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["fam-knowledge-terms"] }),
  });
}

export function useUpdateFamKnowledgeTerm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Parameters<typeof Knowledge.updateKnowledgeTerm>[2] }) => Knowledge.updateKnowledgeTerm(supabase, id, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["fam-knowledge-terms"] }),
  });
}

export function useFamKnowledgeTrailsForCurator(status?: Knowledge.FamKnowledgeStatus) {
  return useQuery({
    queryKey: ["fam-knowledge-trails-curator", status ?? "all"],
    queryFn: () => Knowledge.listKnowledgeTrailsForCurator(supabase, status),
  });
}

export function useFamKnowledgeTrailForCurator(trailId: string | null) {
  return useQuery({
    queryKey: ["fam-knowledge-trail-curator", trailId],
    queryFn: () => Knowledge.getKnowledgeTrailForCurator(supabase, trailId as string),
    enabled: !!trailId,
  });
}

export function useCreateFamKnowledgeTrail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof Knowledge.createKnowledgeTrail>[1]) => Knowledge.createKnowledgeTrail(supabase, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["fam-knowledge-trails-curator"] }),
  });
}

export function useCreateFamKnowledgeTrailStep() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof Knowledge.createKnowledgeTrailStep>[1]) => Knowledge.createKnowledgeTrailStep(supabase, input),
    onSuccess: (_, variables) => queryClient.invalidateQueries({ queryKey: ["fam-knowledge-trail-curator", variables.trail_id] }),
  });
}

export function useUpdateFamKnowledgeTrailStep() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, trailId, patch }: { id: string; trailId: string; patch: Parameters<typeof Knowledge.updateKnowledgeTrailStep>[2] }) => Knowledge.updateKnowledgeTrailStep(supabase, id, patch),
    onSuccess: (_, variables) => queryClient.invalidateQueries({ queryKey: ["fam-knowledge-trail-curator", variables.trailId] }),
  });
}

export function useFamKnowledgeTrails() {
  return useQuery({
    queryKey: ["fam-knowledge-trails"],
    queryFn: () => Knowledge.listPublishedKnowledgeTrails(supabase),
    staleTime: 1000 * 60 * 5,
  });
}

export function useFamKnowledgeTrail(trailKey: string | null) {
  return useQuery({
    queryKey: ["fam-knowledge-trail", trailKey],
    queryFn: () => Knowledge.getPublishedKnowledgeTrail(supabase, trailKey as string),
    enabled: !!trailKey,
  });
}

export function useFamKnowledgeCurator(status?: Knowledge.FamKnowledgeStatus) {
  return useQuery({
    queryKey: ["fam-knowledge-curator", status ?? "all"],
    queryFn: () => Knowledge.listKnowledgeContentsForCurator(supabase, status),
  });
}

export function useCreateFamKnowledgeContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof Knowledge.createKnowledgeContent>[1]) => Knowledge.createKnowledgeContent(supabase, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["fam-knowledge-curator"] }),
  });
}

export function useUpdateFamKnowledgeContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Knowledge.FamKnowledgeContent> }) => Knowledge.updateKnowledgeContent(supabase, id, patch),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["fam-knowledge-curator"] });
      queryClient.invalidateQueries({ queryKey: ["fam-knowledge-content", variables.id] });
    },
  });
}

export function useTransitionFamKnowledgeContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, actorProfileId, notes, approvalReference, reviewDate }: {
      id: string;
      status: Knowledge.FamKnowledgeStatus;
      actorProfileId: string;
      notes?: string;
      approvalReference?: string;
      reviewDate?: string;
    }) => Knowledge.transitionKnowledgeContent(supabase, id, status, actorProfileId, {
      notes,
      approvalReference,
      reviewDate,
    }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["fam-knowledge-curator"] });
      queryClient.invalidateQueries({ queryKey: ["fam-knowledge-content", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["fam-knowledge-contents"] });
    },
  });
}
