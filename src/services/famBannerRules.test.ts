import { describe, expect, it } from "vitest";
import type { Banner } from "@/types/domain";
import { isEligibleFamBanner, validateFamBannerCta } from "./famBannerRules";

const NOW = Date.parse("2026-08-27T12:00:00.000Z");

function banner(overrides: Partial<Banner> = {}): Banner {
  return {
    id: "banner-1",
    title: "Acolhimento FAM",
    subtitle: null,
    image_url: null,
    cta_label: null,
    cta_url: null,
    sort_order: 1,
    is_active: true,
    starts_at: null,
    ends_at: null,
    created_at: "2026-08-01T00:00:00.000Z",
    tenant_key: "FAM",
    workflow_status: "publicado",
    audience: "publico_geral",
    ...overrides,
  };
}

describe("famBannerRules — elegibilidade", () => {
  it("aceita banner FAM publicado, ativo, público e sem datas", () => {
    expect(isEligibleFamBanner(banner(), NOW)).toBe(true);
  });

  it("aceita banner agendado quando o período já começou", () => {
    expect(isEligibleFamBanner(banner({
      workflow_status: "agendado",
      starts_at: "2026-08-27T10:00:00.000Z",
      ends_at: "2026-08-27T18:00:00.000Z",
    }), NOW)).toBe(true);
  });

  it.each([
    ["outro tenant", { tenant_key: "CEC" }],
    ["tenant ausente", { tenant_key: undefined }],
    ["inativo", { is_active: false }],
    ["rascunho", { workflow_status: "rascunho" }],
    ["em revisão", { workflow_status: "em_revisao" }],
    ["pausado", { workflow_status: "pausado" }],
    ["audiência de equipe", { audience: "equipe" }],
  ] as const)("rejeita banner %s", (_label, overrides) => {
    expect(isEligibleFamBanner(banner(overrides as Partial<Banner>), NOW)).toBe(false);
  });

  it("rejeita início futuro", () => {
    expect(isEligibleFamBanner(banner({ starts_at: "2026-08-27T12:00:01.000Z" }), NOW)).toBe(false);
  });

  it("aceita início exactamente no momento actual", () => {
    expect(isEligibleFamBanner(banner({ starts_at: "2026-08-27T12:00:00.000Z" }), NOW)).toBe(true);
  });

  it("rejeita fim no passado", () => {
    expect(isEligibleFamBanner(banner({ ends_at: "2026-08-27T11:59:59.000Z" }), NOW)).toBe(false);
  });

  it("aceita fim exactamente no momento actual", () => {
    expect(isEligibleFamBanner(banner({ ends_at: "2026-08-27T12:00:00.000Z" }), NOW)).toBe(true);
  });

  it.each([
    ["início inválido", { starts_at: "não-é-data" }],
    ["fim inválido", { ends_at: "não-é-data" }],
  ])("rejeita %s", (_label, overrides) => {
    expect(isEligibleFamBanner(banner(overrides), NOW)).toBe(false);
  });
});

describe("famBannerRules — CTA", () => {
  it("aceita banner sem CTA", () => {
    expect(validateFamBannerCta(undefined, null, null).ok).toBe(true);
  });

  it("aceita rota interna", () => {
    expect(validateFamBannerCta("internal", "Fale Conosco", "/fale-conosco").ok).toBe(true);
  });

  it("rejeita rota interna protocol-relative", () => {
    expect(validateFamBannerCta("internal", "Abrir", "//outro-site.example").ok).toBe(false);
  });

  it("aceita formulário interno", () => {
    expect(validateFamBannerCta("formulario", "Conversar", "/fale-conosco?origem=banner").ok).toBe(true);
  });

  it("aceita âncora local", () => {
    expect(validateFamBannerCta("ancora", "Conhecer", "#projetos-fam").ok).toBe(true);
  });

  it("rejeita âncora com URL externa ou formato inválido", () => {
    expect(validateFamBannerCta("ancora", "Abrir", "https://gov.br").ok).toBe(false);
    expect(validateFamBannerCta("ancora", "Abrir", "#não permitido").ok).toBe(false);
  });

  it("aceita telefone válido", () => {
    expect(validateFamBannerCta("telefone", "Ligar", "tel:+5561999999999").ok).toBe(true);
  });

  it("aceita somente canais de emergência aprovados", () => {
    expect(validateFamBannerCta("emergencia", "Polícia", "tel:190").ok).toBe(true);
    expect(validateFamBannerCta("emergencia", "Orientação", "tel:180").ok).toBe(true);
    expect(validateFamBannerCta("emergencia", "Número não aprovado", "tel:191").ok).toBe(false);
  });

  it("aceita domínio externo HTTPS autorizado", () => {
    expect(validateFamBannerCta("externo", "Ligue 180", "https://www.gov.br/mulheres").ok).toBe(true);
  });

  it.each([
    "http://www.gov.br",
    "https://example.com",
    "javascript:alert(1)",
    "data:text/html,alert(1)",
    "//example.com/path",
    "https://user:pass@www.gov.br",
  ])("rejeita URL externa insegura: %s", (url) => {
    expect(validateFamBannerCta("externo", "Abrir", url).ok).toBe(false);
  });

  it("exige label e URL juntos", () => {
    expect(validateFamBannerCta("internal", "Abrir", null).ok).toBe(false);
    expect(validateFamBannerCta("internal", null, "/fale-conosco").ok).toBe(false);
  });
});
