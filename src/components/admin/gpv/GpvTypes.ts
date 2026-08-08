export type CategoriaVinculo = "eclesiastico" | "trabalhista" | "autonomo" | "voluntario" | "outro";
export type StatusVinculo    = "ativo" | "suspenso" | "licenca" | "encerrado";
export type Periodicidade    = "mensal" | "quinzenal" | "semanal" | "por_evento" | "unico";
export type TipoEvento       = "nomeacao" | "promocao" | "transferencia" | "mudanca_salario" |
                        "suspensao" | "licenca" | "afastamento" | "ferias" | "rescisao" |
                        "reativacao" | "advertencia" | "curso" | "treinamento" | "ocorrencia";
export type StatusPagamento  = "pendente" | "pago" | "cancelado" | "estornado";
export type TipoDoc          = "contrato" | "termo_voluntariado" | "portaria" | "ata" | "nomeacao" |
                        "certificado" | "diploma" | "doc_pessoal" | "comprovante_bancario" |
                        "recibo" | "nota_fiscal" | "comprovante_pagamento" | "outro";

export interface GpvPessoa {
  id: string; church_id: string; full_name: string; cpf?: string; rg?: string;
  data_nascimento?: string; email?: string; phone?: string; whatsapp?: string;
  cep?: string; logradouro?: string; numero?: string; complemento?: string;
  bairro?: string; cidade?: string; estado?: string;
  pix_key?: string; banco?: string; agencia?: string; conta?: string;
  foto_url?: string; is_active: boolean; created_at: string;
}
export interface GpvTipoVinculo {
  id: string; nome: string; categoria: CategoriaVinculo; church_id?: string; is_active: boolean;
}
export interface GpvFormaRemuneracao { id: string; nome: string; is_active: boolean; }
export interface GpvVinculo {
  id: string; vinculo_id?: string; pessoa_id: string; tipo_vinculo_id: string; church_id: string;
  cargo?: string; departamento?: string; data_inicio: string; data_fim?: string;
  status: StatusVinculo; observacoes?: string;
  // joined
  pessoa_nome?: string; tipo_vinculo?: string; church_name?: string;
}
export interface GpvRemuneracao {
  id: string; vinculo_id: string; forma_id: string; valor: number;
  periodicidade: Periodicidade; dia_pagamento?: number;
  vigente_desde: string; vigente_ate?: string; observacoes?: string;
  forma_nome?: string;
}
export interface GpvHistorico {
  id: string; vinculo_id: string; tipo_evento: TipoEvento;
  descricao: string; data_evento: string; created_at: string;
}
export interface GpvPagamento {
  id: string; vinculo_id: string; forma_id?: string;
  competencia_mes: number; competencia_ano: number;
  valor_bruto: number; valor_liquido: number;
  data_vencimento?: string; data_pagamento?: string;
  status: StatusPagamento; comprovante_path?: string; observacoes?: string;
  // joined
  pessoa_nome?: string; tipo_vinculo?: string; forma_nome?: string; church_name?: string;
}
export interface GpvDocumento {
  id: string; pessoa_id: string; vinculo_id?: string; tipo_doc: TipoDoc;
  titulo: string; descricao?: string; storage_path: string;
  size_bytes?: number; mime_type?: string; created_at: string;
}

export const CATEGORIA_LABELS: Record<CategoriaVinculo, string> = {
  eclesiastico: "Eclesiástico", trabalhista: "Trabalhista",
  autonomo: "Autônomo/Prestador", voluntario: "Voluntário", outro: "Outro",
};
export const STATUS_VINCULO_LABELS: Record<StatusVinculo, string> = {
  ativo: "Ativo", suspenso: "Suspenso", licenca: "Licença", encerrado: "Encerrado",
};
export const STATUS_VINCULO_COLOR: Record<StatusVinculo, string> = {
  ativo: "bg-green-100 text-green-800",
  suspenso: "bg-yellow-100 text-yellow-800",
  licenca: "bg-blue-100 text-blue-800",
  encerrado: "bg-gray-100 text-gray-600",
};
export const PERIODICIDADE_LABELS: Record<Periodicidade, string> = {
  mensal: "Mensal", quinzenal: "Quinzenal", semanal: "Semanal",
  por_evento: "Por evento", unico: "Pagamento único",
};
export const TIPO_EVENTO_LABELS: Record<TipoEvento, string> = {
  nomeacao: "Nomeação", promocao: "Promoção", transferencia: "Transferência",
  mudanca_salario: "Mudança salarial", suspensao: "Suspensão", licenca: "Licença",
  afastamento: "Afastamento", ferias: "Férias", rescisao: "Rescisão",
  reativacao: "Reativação", advertencia: "Advertência", curso: "Curso",
  treinamento: "Treinamento", ocorrencia: "Ocorrência",
};
export const STATUS_PAG_LABELS: Record<StatusPagamento, string> = {
  pendente: "Pendente", pago: "Pago", cancelado: "Cancelado", estornado: "Estornado",
};
export const STATUS_PAG_COLOR: Record<StatusPagamento, string> = {
  pendente: "bg-yellow-100 text-yellow-800",
  pago: "bg-green-100 text-green-800",
  cancelado: "bg-red-100 text-red-700",
  estornado: "bg-gray-100 text-gray-600",
};
export const TIPO_DOC_LABELS: Record<TipoDoc, string> = {
  contrato: "Contrato", termo_voluntariado: "Termo de voluntariado",
  portaria: "Portaria", ata: "Ata", nomeacao: "Nomeação",
  certificado: "Certificado", diploma: "Diploma", doc_pessoal: "Documento pessoal",
  comprovante_bancario: "Comprovante bancário", recibo: "Recibo",
  nota_fiscal: "Nota fiscal", comprovante_pagamento: "Comprovante de pagamento",
  outro: "Outro",
};
export const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

export function fmt(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}
