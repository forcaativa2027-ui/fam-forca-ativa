import type { OccupationType, AssetCategory, AssetCondition, AssetOrigin } from "@/types/domain";

export const OCCUPATION_LABELS: Record<OccupationType, string> = {
  proprio: "Próprio", alugado: "Alugado", cedido: "Cedido",
  comodato: "Comodato", em_regularizacao: "Em Regularização",
};
export const OCCUPATION_COLOR: Record<OccupationType, string> = {
  proprio: "bg-green-50 text-green-700 border-green-200",
  alugado: "bg-blue-50 text-blue-700 border-blue-200",
  cedido: "bg-purple-50 text-purple-700 border-purple-200",
  comodato: "bg-yellow-50 text-yellow-700 border-yellow-200",
  em_regularizacao: "bg-orange-50 text-orange-700 border-orange-200",
};
export const CATEGORY_LABELS: Record<AssetCategory, string> = {
  mobiliario: "Mobiliário", equipamentos: "Equipamentos",
  som_multimidia: "Som e Multimídia", infraestrutura: "Infraestrutura",
  nao_duravel: "Não Durável",
};
export const CONDITION_LABELS: Record<AssetCondition, string> = {
  novo: "Novo", otimo: "Ótimo", bom: "Bom", regular: "Regular",
  ruim: "Ruim", inutilizado: "Inutilizado", baixado: "Baixado",
};
export const CONDITION_COLOR: Record<AssetCondition, string> = {
  novo: "bg-green-100 text-green-800 border-green-300",
  otimo: "bg-green-50 text-green-700 border-green-200",
  bom: "bg-blue-50 text-blue-700 border-blue-200",
  regular: "bg-yellow-50 text-yellow-700 border-yellow-200",
  ruim: "bg-orange-50 text-orange-700 border-orange-200",
  inutilizado: "bg-red-50 text-red-700 border-red-200",
  baixado: "bg-gray-100 text-gray-600 border-gray-300",
};
export const ORIGIN_LABELS: Record<AssetOrigin, string> = {
  compra_nf: "Compra com NF", doacao: "Doação", sem_nf: "Sem NF",
  transferencia: "Transferência", comodato: "Comodato", outro: "Outro",
};

export const DEPRECIATION_LABELS: Record<string, string> = {
  linear: "Linear", acelerado: "Acelerado", soma_digitos: "Soma dos Dígitos",
};
export const MAINTENANCE_TYPE_LABELS: Record<string, string> = {
  preventiva: "Preventiva", corretiva: "Corretiva", emergencial: "Emergencial", revisao: "Revisão",
};
export const MAINTENANCE_STATUS_LABELS: Record<string, string> = {
  agendada: "Agendada", em_andamento: "Em Andamento", concluida: "Concluída", cancelada: "Cancelada",
};
export const MAINTENANCE_STATUS_COLOR: Record<string, string> = {
  agendada: "bg-blue-100 text-blue-700", em_andamento: "bg-yellow-100 text-yellow-700",
  concluida: "bg-green-100 text-green-700", cancelada: "bg-gray-100 text-gray-500",
};
export const INVENTORY_STATUS_LABELS: Record<string, string> = {
  encontrado: "✅ Encontrado", nao_encontrado: "❌ Não encontrado",
  divergente: "⚠️ Divergente", baixado: "🗑️ Baixado",
};

export const PROPERTY_DOC_TYPES = [
  ["escritura", "Escritura"], ["cessao_direitos", "Cessão de Direitos"],
  ["procuracao", "Procuração"], ["contrato_compra_venda", "Contrato de Compra e Venda"],
  ["matricula", "Matrícula Atualizada"], ["certidao_onus", "Certidão de Ônus Reais"],
  ["habite_se", "Habite-se"], ["iptu", "IPTU"], ["planta", "Planta do Imóvel"],
  ["memorial_descritivo", "Memorial Descritivo"], ["laudo_tecnico", "Laudo Técnico"],
  ["contrato_locacao", "Contrato de Locação"], ["comodato", "Comodato"],
  ["alvara", "Alvará"], ["outro", "Outro"],
] as const;

export function fmtMoney(v: number | null | undefined) {
  if (v == null) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}
