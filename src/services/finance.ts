import type { SupabaseClient } from "@supabase/supabase-js";
import type { Finance, FinanceKind, FinanceDirection } from "@/types/domain";

export interface FinanceInput {
  church_id: string; kind: FinanceKind; direction: FinanceDirection;
  amount: number; description?: string; occurred_on: string; payer_name?: string;
}

export async function listFinances(sb: SupabaseClient, churchId: string | null, year: number, month: number): Promise<Finance[]> {
  if (!churchId) return [];
  const start = `${year}-${String(month).padStart(2,"0")}-01`;
  const next = month === 12 ? `${year+1}-01-01` : `${year}-${String(month+1).padStart(2,"0")}-01`;
  const { data, error } = await sb.from("finances").select("*")
    .eq("church_id", churchId)
    .gte("occurred_on", start).lt("occurred_on", next)
    .order("occurred_on", { ascending: false });
  if (error) return [];
  return (data ?? []) as Finance[];
}

export async function createFinance(sb: SupabaseClient, input: FinanceInput): Promise<Finance> {
  const { data, error } = await sb.from("finances").insert({
    ...input,
    description: input.description || null,
    payer_name: input.payer_name || null,
  }).select().single();
  if (error) throw error;
  return data as Finance;
}

export async function deleteFinance(sb: SupabaseClient, id: string): Promise<void> {
  const { error } = await sb.from("finances").delete().eq("id", id);
  if (error) throw error;
}
