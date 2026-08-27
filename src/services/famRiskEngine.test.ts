import { describe, expect, it } from "vitest";
import { evaluateFamRisk } from "./famRiskEngine";
import { canTransition, stateForEvaluation, transitionAssessment } from "./famAssessmentState";

describe("famRiskEngine", () => {
  it("identifica risco imediato sem decidir pela usuária", () => {
    const result = evaluateFamRisk({ danger_now: "YES" });

    expect(result.attention).toBe("immediate");
    expect(result.emergency).toBe(true);
    expect(result.triggeredIndicators).toEqual(["danger_now"]);
  });

  it("marca fluxos especiais para violência sexual e crianças", () => {
    const result = evaluateFamRisk({ sexual: "YES", children: "YES" });

    expect(result.attention).toBe("relevant");
    expect(result.emergency).toBe(false);
    expect(result.specialFlowFlags).toEqual(["sexual", "children"]);
  });

  it("preserva incerteza quando não há respostas afirmativas", () => {
    const result = evaluateFamRisk({
      danger_now: "PREFER_NOT_TO_ANSWER",
      injury: "NO",
      weapon: undefined,
    });

    expect(result.attention).toBe("insufficient_information");
    expect(result.triggeredIndicators).toEqual([]);
    expect(result.summary).toMatch(/não significa que esteja tudo bem/);
  });

  it("não converte resposta negativa em sinal positivo", () => {
    const result = evaluateFamRisk({
      danger_now: "NO",
      injury: "NO",
      weapon: "NO",
      sexual: "NO",
      children: "NO",
    });

    expect(result.emergency).toBe(false);
    expect(result.triggeredIndicators).toEqual([]);
    expect(result.attention).toBe("insufficient_information");
  });

  it("preserva preferência por não responder sem inferência", () => {
    const result = evaluateFamRisk({
      sexual: "PREFER_NOT_TO_ANSWER",
      children: "PREFER_NOT_TO_ANSWER",
    });

    expect(result.specialFlowFlags).toEqual([]);
    expect(result.triggeredIndicators).toEqual([]);
    expect(result.attention).toBe("insufficient_information");
  });

  it("ignora chaves desconhecidas e expõe a versão do motor", () => {
    const result = evaluateFamRisk({ unknown_signal: "YES" as never });

    expect(result.triggeredIndicators).toEqual([]);
    expect(result.engineVersion).toBe("FAM-RISK-1.0");
  });

  it("prioriza emergência quando há sinal imediato junto com fluxo especial", () => {
    const result = evaluateFamRisk({ danger_now: "YES", sexual: "YES", children: "YES" });

    expect(result.attention).toBe("immediate");
    expect(result.emergency).toBe(true);
    expect(result.specialFlowFlags).toEqual(["sexual", "children"]);
  });
});

describe("famAssessmentState", () => {
  it("seleciona o estado de emergência antes do fluxo especial", () => {
    expect(stateForEvaluation({ emergency: true, specialFlowFlags: ["sexual"] })).toEqual({
      state: "EMERGENCY",
      reasonCode: "POSSIBLE_URGENCY",
      ruleCode: "RULE-EMERGENCY-001",
    });
  });

  it("permite apenas transições documentadas", () => {
    expect(canTransition("IN_PROGRESS", "EMERGENCY")).toBe(true);
    expect(canTransition("CLOSED", "RESULT")).toBe(false);
    expect(() => transitionAssessment("CLOSED", "RESULT", { reasonCode: "invalid" })).toThrow(/não permitida/);
  });

  it("retorna metadados da transição válida", () => {
    expect(transitionAssessment("ORIENTATION", "RESULT", {
      reasonCode: "ORIENTATION_READY",
      ruleCode: "RULE-ORIENTATION-001",
    })).toEqual({
      from: "ORIENTATION",
      to: "RESULT",
      reasonCode: "ORIENTATION_READY",
      ruleCode: "RULE-ORIENTATION-001",
    });
  });
});


describe("famRiskSemantics e regras versionadas", () => {
  it("distingue ausência de resposta de não e de preferência por não responder", async () => {
    const { normalizeFamRiskAnswer } = await import("./famRiskSemantics");
    expect(normalizeFamRiskAnswer(undefined)).toBe("NO_ANSWER");
    expect(normalizeFamRiskAnswer("NO")).toBe("NO");
    expect(normalizeFamRiskAnswer("PREFIRO_NAO_RESPONDER")).toBe("PREFER_NOT_TO_ANSWER");
  });

  it("avalia regra composta e expõe metadados versionados", async () => {
    const { evaluateFamRiskRules } = await import("./famRiskRules");
    const matches = evaluateFamRiskRules({ danger_now: "YES", injury: "YES" });
    expect(matches.some((match) => match.ruleCode === "RULE-COMBINED-001")).toBe(true);
    expect(matches.every((match) => match.ruleVersion === "FAM-RULES-1.0")).toBe(true);
  });

  it("não trata SEM_RESPOSTA como sinal afirmativo", () => {
    const result = evaluateFamRisk({ danger_now: "SEM_RESPOSTA" });
    expect(result.triggeredIndicators).toEqual([]);
    expect(result.attention).toBe("insufficient_information");
  });
});

describe("famRiskStateMachine", () => {
  it("produz evento estruturado para transição válida", async () => {
    const { transitionRiskAssessment } = await import("./famRiskStateMachine");
    const result = transitionRiskAssessment({
      assessmentId: "assessment-1",
      actorUserId: "user-1",
      from: "IN_PROGRESS",
      to: "EMERGENCY",
      reasonCode: "POSSIBLE_URGENCY",
      ruleCode: "RULE-EMERGENCY-001",
      now: "2026-08-26T00:00:00.000Z",
    });
    expect(result.auditEvent.eventType).toBe("STATE_TRANSITIONED");
    expect(result.auditEvent.fromState).toBe("IN_PROGRESS");
    expect(result.auditEvent.toState).toBe("EMERGENCY");
    expect(result.auditEvent.metadata).toEqual({ reasonCode: "POSSIBLE_URGENCY" });
  });
});
