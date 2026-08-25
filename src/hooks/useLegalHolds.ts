"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { listLegalHolds, listRetentionPolicies, listRetentionReview, createLegalHold, releaseLegalHold, type LegalHold, type RetentionPolicy } from "@/services/legalHolds";

export function useLegalHolds(status?: string) {
  const [holds, setHolds] = useState<LegalHold[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listLegalHolds(supabase as any, status as any);
      setHolds(data);
    } catch (e: any) { setError(e.message ?? String(e)); } finally { setLoading(false); }
  }, [status]);
  useEffect(() => { load(); }, [load]);
  return { holds, loading, error, reload: load, create: createLegalHold, release: releaseLegalHold };
}

export function useRetention() {
  const [policies, setPolicies] = useState<RetentionPolicy[]>([]);
  const [review, setReview] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      const [p, r] = await Promise.all([listRetentionPolicies(supabase as any), listRetentionReview(supabase as any)]);
      setPolicies(p); setReview(r); setLoading(false);
    })();
  }, []);
  return { policies, review, loading };
}
