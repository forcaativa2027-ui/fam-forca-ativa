import type { Banner, BannerCtaKind } from "@/types/domain";

export const FAM_TENANT_KEY = "FAM" as const;
/** Domínios oficiais permitidos para CTAs externos; ampliar somente por aprovação FAM. */
export const FAM_ALLOWED_EXTERNAL_HOSTS = new Set(["gov.br", "www.gov.br"]);

export type BannerCtaValidation =
  | { ok: true; normalizedUrl: string }
  | { ok: false; reason: string };

/** Retorna true somente para banners públicos elegíveis do tenant FAM. */
export function isEligibleFamBanner(banner: Banner, now = Date.now()): boolean {
  if (banner.tenant_key !== FAM_TENANT_KEY) return false;
  if (banner.is_active !== true) return false;
  if (!banner.workflow_status || !["publicado", "agendado"].includes(banner.workflow_status)) return false;
  if (banner.audience !== "publico_geral") return false;

  const startsAt = banner.starts_at ? Date.parse(banner.starts_at) : null;
  const endsAt = banner.ends_at ? Date.parse(banner.ends_at) : null;
  if (startsAt !== null && (!Number.isFinite(startsAt) || startsAt > now)) return false;
  if (endsAt !== null && (!Number.isFinite(endsAt) || endsAt < now)) return false;

  return validateFamBannerCta(banner.cta_kind, banner.cta_label, banner.cta_url).ok;
}

/** Valida o par label/URL e o formato compatível com cada tipo de CTA. */
export function validateFamBannerCta(
  kind: BannerCtaKind | undefined,
  label: string | null,
  rawUrl: string | null,
): BannerCtaValidation {
  const ctaLabel = label?.trim() ?? "";
  const url = rawUrl?.trim() ?? "";

  if (!ctaLabel && !url) return { ok: true, normalizedUrl: "" };
  if (!ctaLabel || !url) {
    return { ok: false, reason: "O texto e o destino do CTA devem ser informados juntos." };
  }
  if (/^(javascript|data|vbscript):/i.test(url) || url.startsWith("//")) {
    return { ok: false, reason: "Esse tipo de URL não é permitido." };
  }

  switch (kind ?? "internal") {
    case "internal":
    case "formulario":
      if (!url.startsWith("/") || url.startsWith("//")) {
        return { ok: false, reason: "O CTA deve apontar para uma rota interna." };
      }
      break;
    case "ancora":
      if (!/^#[A-Za-z][A-Za-z0-9_-]*$/.test(url)) {
        return { ok: false, reason: "A âncora deve ser local e válida." };
      }
      break;
    case "telefone":
    case "emergencia": {
      const phonePattern = kind === "emergencia"
        ? /^tel:\+?[0-9 ()-]{3,20}$/
        : /^tel:\+?[0-9 ()-]{8,20}$/;
      if (!phonePattern.test(url)) {
        return { ok: false, reason: "Número de telefone inválido." };
      }
      if (kind === "emergencia") {
        const digits = url.replace(/\D/g, "");
        if (!["190", "180", "192", "193"].includes(digits)) {
          return { ok: false, reason: "Canal de emergência não aprovado pela FAM." };
        }
      }
      break;
    }
    case "externo":
      try {
        const parsed = new URL(url);
        if (parsed.protocol !== "https:" || !parsed.hostname || parsed.username || parsed.password) {
          return { ok: false, reason: "Links externos devem usar HTTPS sem credenciais." };
        }
        if (!FAM_ALLOWED_EXTERNAL_HOSTS.has(parsed.hostname.toLowerCase())) {
          return { ok: false, reason: "Domínio externo não autorizado pela FAM." };
        }
      } catch {
        return { ok: false, reason: "URL externa inválida." };
      }
      // A RPC aplica a allowlist institucional de domínios antes da publicação.
      break;
    default:
      return { ok: false, reason: "Tipo de CTA inválido." };
  }

  return { ok: true, normalizedUrl: url };
}

export function assertFamBannerCta(
  kind: BannerCtaKind | undefined,
  label: string | null,
  url: string | null,
): void {
  const result = validateFamBannerCta(kind, label, url);
  if (!result.ok) throw new Error(result.reason);
}
