import { describe, expect, it } from "vitest";
import { evaluateFamRisk, type FamRiskEvaluation } from "./famRiskEngine";
import { decideFamProtection } from "./famProtectionFlow";

function evaluation(answers: Record<string, "YES" | "NO" | "PREFER_NOT_TO_ANSWER">): FamRiskEvaluation {
  return evaluateFamRisk(answers);
}

describe("decideFamProtection", () => {
  it("prioriza emergência, 190 e 180 quando há perigo atual", () => {
    const result = decideFamProtection({ evaluation: evaluation({ danger_now: "YES" }) });
    expect(result.scenario).toBe("EMERGENCY");
    expect(result.actions).toContain("CONTACT_EMERGENCY_190");
    expect(result.actions).toContain("CONTACT_LIGUE_180");
    expect(result.referralAllowed).toBe(false);
  });

  it("mantém encaminhamento bloqueado sem confirmação explícita", () => {
    const result = decideFamProtection({ evaluation: evaluation({ sexual: "YES" }) });
    expect(result.scenario).toBe("SPECIALIZED_PROTECTION");
    expect(result.actions).toContain("REVIEW_SPECIAL_FLOW");
    expect(result.referralAllowed).toBe(false);
    expect(result.sharingRequiresConfirmation).toBe(true);
  });

  it("permite oferecer encaminhamento somente após confirmação", () => {
    const result = decideFamProtection({ evaluation: evaluation({ injury: "YES" }), referralConfirmed: true });
    expect(result.scenario).toBe("RELEVANT_RISK");
    expect(result.referralAllowed).toBe(true);
  });

  it("preserva o fluxo especializado para crianças e adolescentes", () => {
    const result = decideFamProtection({ evaluation: evaluation({ children: "YES" }) });
    expect(result.scenario).toBe("SPECIALIZED_PROTECTION");
    expect(result.specialFlows).toEqual(["children"]);
    expect(result.actions).toContain("OPEN_FAM_ATTENDANT");
  });

  it("não transforma ausência de sinais em declaração de segurança", () => {
    const result = decideFamProtection({ evaluation: evaluation({ danger_now: "NO", injury: "PREFER_NOT_TO_ANSWER", weapon: "NO", sexual: "NO", children: "NO" }) });
    expect(result.scenario).toBe("INSUFFICIENT_INFORMATION");
    expect(result.guidance).toContain("não significa que esteja tudo bem");
    expect(result.actions).not.toContain("OFFER_REFERRAL");
  });

  it("exige confirmação mesmo quando a decisão oferece encaminhamento", () => {
    const withoutConfirmation = decideFamProtection({ evaluation: evaluation({ sexual: "YES" }) });
    const withConfirmation = decideFamProtection({ evaluation: evaluation({ sexual: "YES" }), referralConfirmed: true });

    expect(withoutConfirmation.referralAllowed).toBe(false);
    expect(withConfirmation.referralAllowed).toBe(true);
    expect(withConfirmation.sharingRequiresConfirmation).toBe(true);
  });

  it("mantém linguagem orientativa e não diagnóstica em todos os cenários", () => {
    const results = [
      decideFamProtection({ evaluation: evaluation({ danger_now: "YES" }) }),
      decideFamProtection({ evaluation: evaluation({ injury: "YES" }) }),
      decideFamProtection({ evaluation: evaluation({ children: "YES" }) }),
      decideFamProtection({ evaluation: evaluation({ danger_now: "PREFER_NOT_TO_ANSWER" }) }),
    ];

    for (const result of results) {
      expect(result.disclaimer).toMatch(/orientativo/);
      expect(result.disclaimer).toMatch(/não (confirma nem descarta crime|produz laudo)|não substitui/);
    }
  });
});
