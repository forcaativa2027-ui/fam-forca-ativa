import type { SupabaseClient } from "@supabase/supabase-js";
import type { PipelineIntent } from "@/types/domain";

export interface PipelineCreateInput {
  community_id: string;
  intent: PipelineIntent;
  full_name: string;
  phone: string;
  email?: string;
  state?: string;
  city?: string;
  cep?: string;
}

/** Cria entrada no pipeline. Requer usuario autenticado (apos signUp). */
export async function createPipelineEntry(sb: SupabaseClient, input: PipelineCreateInput): Promise<string> {
  const { data, error } = await sb.rpc("visitor_pipeline_create", {
    p_community_id: input.community_id,
    p_intent: input.intent,
    p_full_name: input.full_name,
    p_phone: input.phone,
    p_email: input.email ?? null,
    p_state: input.state ?? null,
    p_city: input.city ?? null,
    p_cep: input.cep ?? null,
  });
  if (error) throw error;
  return data as string;
}

// ---------- ViaCEP (API publica gratuita) ----------
export interface CepInfo {
  cep: string;
  logradouro?: string;
  bairro?: string;
  localidade?: string; // cidade
  uf?: string;         // estado
  erro?: boolean;
}

/** Busca dados de um CEP no ViaCEP. Aceita com ou sem mascara. */
export async function lookupCep(cep: string): Promise<CepInfo | null> {
  const clean = cep.replace(/\D/g, "");
  if (clean.length !== 8) return null;
  try {
    const r = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
    if (!r.ok) return null;
    const data = await r.json();
    if (data?.erro) return null;
    return data as CepInfo;
  } catch {
    return null;
  }
}

/** Aplica mascara basica em telefone brasileiro. */
export function maskPhone(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0,2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
}

/** Aplica mascara basica em CEP. */
export function maskCep(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0,5)}-${d.slice(5)}`;
}
