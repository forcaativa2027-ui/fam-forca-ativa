import type { PipelineIntent } from "@/types/domain";
import {
  Users, Heart, MessageCircleHeart, Home as HomeIcon, Eye, Droplets, Hand, HelpCircle,
} from "lucide-react";

export const INTENT_LABELS: Record<PipelineIntent, { label: string; description: string; icon: React.ComponentType<{className?:string}> }> = {
  lifegroup:                { label: "Quero ser voluntária",          description: "Participar de ações e projetos da FAM",     icon: Users },
  discipulado:              { label: "Quero participar de projetos",  description: "Conhecer oportunidades de atuação social",  icon: Heart },
  acompanhamento_pastoral:  { label: "Quero compartilhar minha experiência", description: "Apresentar conhecimentos e experiências sociais", icon: MessageCircleHeart },
  visita:                   { label: "Quero receber um contato",      description: "Solicitar retorno da equipe FAM",             icon: HomeIcon },
  conhecer:                 { label: "Quero conhecer a FAM",           description: "Conhecer melhor o Instituto e seus projetos", icon: Eye },
  batismo:                  { label: "Preciso de orientação",          description: "Conversar com a equipe sobre uma necessidade", icon: Droplets },
  servir:                   { label: "Quero apoiar a FAM",             description: "Contribuir como voluntária ou apoiadora",   icon: Hand },
  outro:                    { label: "Outro",                        description: "Conte-nos como podemos ajudar",           icon: HelpCircle },
};

export const EMAIL_DOMAINS = ["gmail.com", "hotmail.com", "outlook.com", "yahoo.com.br", "icloud.com"];

export interface RegisterState {
  step: number;
  flow: "completo" | "basico" | null;
  // Conta
  full_name: string; cpf: string; email: string; phone: string;
  verify_method: "whatsapp" | "sms";
  password: string;
  // Dados pessoais
  marital_status: string; birth_date: string; gender: string;
  // Localização
  country: string; cep: string; state: string; city: string; address: string; number: string; complemento: string; neighborhood: string;
  // Vínculo institucional e participação
  community_id: string; life_group_id: string;
  // Histórico social (campos legados preservados para compatibilidade)
  baptized: boolean | null; baptism_date: string; last_church: string;
  holy_spirit_baptized: boolean | null; holy_spirit_baptism_date: string;
  // Jornada, contexto e participação (opcionais)
  seeking_reason: string; life_before_church: string; testimony: string;
  belongs_to_group: boolean | null; group_name: string;
  intent: PipelineIntent;
}

export const INITIAL_STATE: RegisterState = {
  step: 1,
  flow: null,
  full_name: "", cpf: "", email: "", phone: "", verify_method: "whatsapp", password: "",
  marital_status: "", birth_date: "", gender: "",
  country: "Brasil", cep: "", state: "", city: "", address: "", number: "", complemento: "", neighborhood: "",
  community_id: "", life_group_id: "",
  baptized: null, baptism_date: "", last_church: "",
  holy_spirit_baptized: null, holy_spirit_baptism_date: "",
  seeking_reason: "", life_before_church: "", testimony: "",
  belongs_to_group: null, group_name: "",
  intent: "conhecer",
};

export const TOTAL_STEPS = 10;
export const BASICO_STEP = 90; // sentinel: fluxo curto (Cadastro Básico) não segue a numeração 1-10

export type UpdateFn = <K extends keyof RegisterState>(k: K, v: RegisterState[K]) => void;

export function maskCpf(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`;
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
}
