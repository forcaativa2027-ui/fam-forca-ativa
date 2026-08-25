import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase as sbDefault } from "@/lib/supabase/client";

export type LegalBasisType =
  | "consentimento"
  | "cumprimento_obrigacao_legal"
  | "execucao_politicas_publicas"
  | "estudos_por_orgao_pesquisa"
  | "execucao_contrato"
  | "exercicio_regular_direitos"
  | "protecao_vida_incolumidade"
  | "tutela_saude"
  | "legitimo_interesse"
  | "protecao_credito"
  | "garantia_prevencao_fraude";

export type DataCategory =
  | "contato"
  | "identificacao"
  | "respostas_risco"
  | "saude"
  | "vida_sexual"
  | "crianca_adolescente"
  | "pessoa_idosa"
  | "pessoa_com_deficiencia"
  | "documento"
  | "imagem"
  | "audio"
  | "video"
  | "localizacao"
  | "outro_sensivel";

export type RetentionClass = "R1" | "R2" | "R3" | "R4" | "R5";

export interface LegalBasis {
  id: string;
  code: string;
  version: string;
  purpose_code: string;
  purpose_description: string;
  data_category: DataCategory;
  legal_basis: LegalBasisType;
  legal_basis_description: string | null;
  recipient_type: string | null;
  retention_class: RetentionClass;
  is_active: boolean;
  approved_by: string | null;
  approved_at: string | null;
  effective_at: string;
  created_at: string;
  updated_at: string;
}

const sb = sbDefault as any;

export async function listLegalBases(client: SupabaseClient = sb): Promise<LegalBasis[]> {
  const c = (client as any);
  const { data, error } = await c.from("fam_legal_bases").select("*").order("purpose_code", { ascending: true }).order("version", { ascending: false });
  if (error) throw error;
  return (data ?? []) as LegalBasis[];
}

export async function listActiveLegalBases(client: SupabaseClient = sb): Promise<LegalBasis[]> {
  const c = (client as any);
  const { data, error } = await c.from("fam_legal_bases_active").select("*");
  if (error) {
    // fallback para tabela base
    const { data: d2, error: e2 } = await c.from("fam_legal_bases").select("*").eq("is_active", true).order("purpose_code", { ascending: true });
    if (e2) throw e2;
    return (d2 ?? []) as LegalBasis[];
  }
  return (data ?? []) as LegalBasis[];
}

export async function getLegalBasisByPurpose(
  purposeCode: string,
  dataCategory: DataCategory,
  client: SupabaseClient = sb
): Promise<LegalBasis | null> {
  const c = (client as any);
  const { data, error } = await c
    .from("fam_legal_bases")
    .select("*")
    .eq("purpose_code", purposeCode)
    .eq("data_category", dataCategory)
    .eq("is_active", true)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as LegalBasis) ?? null;
}

export async function createLegalBasis(
  payload: Omit<LegalBasis, "id" | "created_at" | "updated_at" | "approved_at"> & { approved_by?: string | null },
  client: SupabaseClient = sb
): Promise<LegalBasis> {
  const c = (client as any);
  const { data, error } = await c.from("fam_legal_bases").insert(payload).select("*").single();
  if (error) throw error;
  return data as LegalBasis;
}

export async function updateLegalBasis(
  id: string,
  patch: Partial<Omit<LegalBasis, "id" | "created_at">>,
  client: SupabaseClient = sb
): Promise<LegalBasis> {
  const c = (client as any);
  const { data, error } = await c.from("fam_legal_bases").update(patch).eq("id", id).select("*").single();
  if (error) throw error;
  return data as LegalBasis;
}

export async function createNewVersion(
  id: string,
  newVersion: string,
  patch: Partial<Omit<LegalBasis, "id" | "code" | "version" | "created_at" | "updated_at">> = {},
  client: SupabaseClient = sb
): Promise<LegalBasis> {
  const c = (client as any);
  const { data: base, error: e1 } = await c.from("fam_legal_bases").select("*").eq("id", id).single();
  if (e1) throw e1;
  const b = base as LegalBasis;
  const payload = {
    code: b.code,
    version: newVersion,
    purpose_code: b.purpose_code,
    purpose_description: b.purpose_description,
    data_category: b.data_category,
    legal_basis: b.legal_basis,
    legal_basis_description: b.legal_basis_description,
    recipient_type: b.recipient_type,
    retention_class: b.retention_class,
    is_active: false, // nova versão nasce inativa até aprovação
    approved_by: null,
    effective_at: new Date().toISOString(),
    ...patch,
  };
  const { data, error } = await c.from("fam_legal_bases").insert(payload).select("*").single();
  if (error) throw error;
  return data as LegalBasis;
}

export const LEGAL_BASIS_LABELS: Record<LegalBasisType, string> = {
  consentimento: "Consentimento (art. 7º, I / art. 11, I)",
  cumprimento_obrigacao_legal: "Cumprimento de obrigação legal (art. 7º, II / art. 11, II, a)",
  execucao_politicas_publicas: "Execução de políticas públicas (art. 7º, III)",
  estudos_por_orgao_pesquisa: "Estudos por órgão de pesquisa (art. 7º, IV / art. 11, II, c)",
  execucao_contrato: "Execução de contrato (art. 7º, V)",
  exercicio_regular_direitos: "Exercício regular de direitos (art. 7º, VI / art. 11, II, d)",
  protecao_vida_incolumidade: "Proteção da vida/incolumidade (art. 7º, VII / art. 11, II, e)",
  tutela_saude: "Tutela da saúde (art. 11, II, f)",
  legitimo_interesse: "Legítimo interesse (art. 7º, IX)",
  protecao_credito: "Proteção ao crédito (art. 7º, X)",
  garantia_prevencao_fraude: "Garantia/prevenção à fraude (art. 11, II, g)",
};

export const DATA_CATEGORY_LABELS: Record<DataCategory, string> = {
  contato: "Contato",
  identificacao: "Identificação",
  respostas_risco: "Respostas de risco (AR-01..)",
  saude: "Saúde",
  vida_sexual: "Vida sexual",
  crianca_adolescente: "Criança/Adolescente",
  pessoa_idosa: "Pessoa idosa",
  pessoa_com_deficiencia: "Pessoa com deficiência",
  documento: "Documento",
  imagem: "Imagem",
  audio: "Áudio",
  video: "Vídeo",
  localizacao: "Localização",
  outro_sensivel: "Outro sensível",
};

export const RETENTION_LABELS: Record<RetentionClass, string> = {
  R1: "R1 — Respostas orientação (até 30d)",
  R2: "R2 — Arquivos (finalidade específica)",
  R3: "R3 — Atendimento/encaminhamento",
  R4: "R4 — Auditoria/segurança",
  R5: "R5 — Incidentes",
};
