import type { PipelineIntent } from "@/types/domain";
import {
  Users, Heart, MessageCircleHeart, Home as HomeIcon, Eye, Droplets, Hand, HelpCircle,
} from "lucide-react";

export const INTENT_LABELS: Record<PipelineIntent, { label: string; description: string; icon: React.ComponentType<{className?:string}> }> = {
  lifegroup:                { label: "Quero um Life Group",         description: "Participar de uma célula próxima de mim", icon: Users },
  discipulado:              { label: "Quero discipulado",            description: "Ser discipulado por um líder",            icon: Heart },
  acompanhamento_pastoral:  { label: "Acompanhamento pastoral",      description: "Conversar com um pastor",                 icon: MessageCircleHeart },
  visita:                   { label: "Quero ser visitado",           description: "Receber um líder em casa",                icon: HomeIcon },
  conhecer:                 { label: "Quero conhecer a igreja",      description: "Conhecer melhor a comunidade",            icon: Eye },
  batismo:                  { label: "Quero me batizar",             description: "Iniciar o processo de batismo",           icon: Droplets },
  servir:                   { label: "Quero servir",                 description: "Servir em algum ministério",              icon: Hand },
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
  // Comunidade
  community_id: string; life_group_id: string;
  // História de fé
  baptized: boolean | null; baptism_date: string; last_church: string;
  holy_spirit_baptized: boolean | null; holy_spirit_baptism_date: string;
  // Jornada (opcionais)
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
