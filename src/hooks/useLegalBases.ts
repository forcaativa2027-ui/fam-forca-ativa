"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  listLegalBases,
  listActiveLegalBases,
  getLegalBasisByPurpose,
  createLegalBasis,
  updateLegalBasis,
  createNewVersion,
  type LegalBasis,
  type DataCategory,
} from "@/services/legalBases";

export function useLegalBases() {
  const [bases, setBases] = useState<LegalBasis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listLegalBases(supabase as any);
      setBases(data);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao carregar bases");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async (payload: Parameters<typeof createLegalBasis>[0]) => {
    const created = await createLegalBasis(payload, supabase as any);
    await load();
    return created;
  };

  const update = async (id: string, patch: Parameters<typeof updateLegalBasis>[1]) => {
    const updated = await updateLegalBasis(id, patch, supabase as any);
    await load();
    return updated;
  };

  const newVersion = async (id: string, version: string, patch?: Parameters<typeof createNewVersion>[2]) => {
    const v = await createNewVersion(id, version, patch, supabase as any);
    await load();
    return v;
  };

  return { bases, loading, error, reload: load, create, update, newVersion };
}

export function useLegalBasisLookup() {
  const lookup = useCallback(async (purposeCode: string, dataCategory: DataCategory) => {
    return getLegalBasisByPurpose(purposeCode, dataCategory, supabase as any);
  }, []);
  return { lookup };
}

export function useActiveLegalBases() {
  const [bases, setBases] = useState<LegalBasis[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    listActiveLegalBases(supabase as any).then(setBases).finally(() => setLoading(false));
  }, []);
  return { bases, loading };
}
