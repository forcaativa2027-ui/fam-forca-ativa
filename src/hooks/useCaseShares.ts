"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { listCaseShares, createCaseShare, updateShareStatus, type CaseShare } from "@/services/caseShares";

export function useCaseShares(caseId?: string | null, conversationId?: string | null) {
  const [shares, setShares] = useState<CaseShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!caseId && !conversationId) { setShares([]); setLoading(false); return; }
    setLoading(true);
    try {
      const data = await listCaseShares(caseId ?? null, conversationId ?? null, supabase as any);
      setShares(data);
    } catch (e: any) { setError(e.message ?? String(e)); } finally { setLoading(false); }
  }, [caseId, conversationId]);

  useEffect(() => { load(); }, [load]);

  const create = async (payload: Parameters<typeof createCaseShare>[0]) => {
    const created = await createCaseShare(payload, supabase as any);
    await load();
    return created;
  };

  const updateStatus = async (id: string, status: CaseShare["status"]) => {
    const updated = await updateShareStatus(id, status, supabase as any);
    await load();
    return updated;
  };

  // Teste de bloqueio share_entire_case
  const testBlockEntire = async () => {
    try {
      await createCaseShare({
        case_id: caseId ?? undefined,
        conversation_id: conversationId ?? undefined,
        recipient_type: "CRAS",
        recipient_name: "Teste",
        purpose_code: "encaminhamento_assistencia",
        legal_basis_id: "00000000-0000-0000-0000-000000000000",
        retention_class: "R3",
        shared_fields: ["*"],
        shared_files: [],
        reason: "teste bloqueio",
      }, supabase as any);
      return false;
    } catch (e: any) {
      return e.message?.includes("share_entire_case bloqueado");
    }
  };

  return { shares, loading, error, reload: load, create, updateStatus, testBlockEntire };
}
