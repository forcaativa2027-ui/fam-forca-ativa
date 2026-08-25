import type { GuardianRelationship, AuthorizationScope, AuthorizationStatus } from "@/types/domain";

export const RELATIONSHIP_LABELS: Record<GuardianRelationship, string> = {
  mae: "Mãe", pai: "Pai", avo: "Avô", ava: "Avó", tio: "Tio", tia: "Tia",
  tutor_legal: "Tutor Legal", outro: "Outro",
};
export const SCOPE_LABELS: Record<AuthorizationScope, string> = {
  permanent: "Permanente", temporary: "Temporária", single_use: "Uso único",
};
export const STATUS_LABELS: Record<AuthorizationStatus, string> = {
  draft: "Rascunho", pending: "Pendente", active: "Ativa", revoked: "Revogada",
  expired: "Expirada", used: "Usada", cancelled: "Cancelada",
};
export const STATUS_COLOR: Record<AuthorizationStatus, string> = {
  draft: "bg-gray-100 text-gray-600", pending: "bg-amber-100 text-amber-700",
  active: "bg-green-100 text-green-700", revoked: "bg-red-100 text-red-700",
  expired: "bg-gray-100 text-gray-500", used: "bg-blue-100 text-blue-700",
  cancelled: "bg-gray-100 text-gray-500",
};

export function calcAge(birthDate: string | null): string {
  if (!birthDate) return "—";
  const b = new Date(birthDate);
  const today = new Date();
  let years = today.getFullYear() - b.getFullYear();
  let months = today.getMonth() - b.getMonth();
  if (months < 0) { years--; months += 12; }
  if (today.getDate() < b.getDate()) { months--; if (months < 0) { years--; months += 12; } }
  if (years < 1) return `${months} ${months === 1 ? "mês" : "meses"}`;
  return `${years} ${years === 1 ? "ano" : "anos"}`;
}
