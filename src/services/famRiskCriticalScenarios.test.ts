import { describe, expect, it } from "vitest";
import { evaluateFamRisk } from "./famRiskEngine";
import { createRiskAuditEvent, transitionRiskAssessment } from "./famRiskStateMachine";
import { adaptRemoteRiskRule } from "./famRiskRemoteCatalog";

function eventFor(result: ReturnType<typeof evaluateFamRisk>, assessmentId: string, actorUserId: string) {
  const nextState = result.emergency ? "EMERGENCY" : result.specialFlowFlags.length > 0 ? "PROTECTION_SPECIAL" : "ORIENTATION";
  const transition = transitionRiskAssessment({
    assessmentId,
    actorUserId,
    from: "IN_PROGRESS",
    to: nextState,
    reasonCode: result.emergency ? "IMMEDIATE_DANGER" : "SPECIAL_FLOW_TRIGGERED",
    ruleCode: result.triggeredRules[0],
    now: "2026-08-27T00:00:00.000Z",
  });
  return { result, transition, ruleEvents: result.triggeredRules.map((ruleCode) => createRiskAuditEvent({
    eventType: "RULE_TRIGGERED",
    assessmentId,
    actorUserId,
    state: nextState,
    ruleCode,
    now: "2026-08-27T00:00:00.000Z",
  })) };
}

describe("cenários críticos do Mapa de Risco", () => {
  it("perigo actual gera regra imediata e transição de emergência", () => {
    const scenario = eventFor(evaluateFamRisk({ danger_now: "YES" }), "case-danger", "user-1");
    expect(scenario.result.triggeredRules).toContain("RULE-EMERGENCY-001");
    expect(scenario.result.attention).toBe("immediate");
    expect(scenario.transition.transition.to).toBe("EMERGENCY");
    expect(scenario.transition.auditEvent.eventType).toBe("STATE_TRANSITIONED");
  });

  it("arma isolada gera atenção relevante, sem prioridade imediata", () => {
    const scenario = eventFor(evaluateFamRisk({ weapon: "YES" }), "case-weapon", "user-1");
    expect(scenario.result.triggeredRules).toContain("RULE-WEAPON-001");
    expect(scenario.result.attention).toBe("relevant");
    expect(scenario.result.priorities).toContain("relevant");
    expect(scenario.result.priorities).not.toContain("immediate");
    expect(scenario.ruleEvents.some((event) => event.ruleCode === "RULE-WEAPON-001")).toBe(true);
  });

  it("ameaça de morte é avaliada pela regra remota legada versionada", () => {
    const deathThreatRule = adaptRemoteRiskRule({
      id: "rule-death-threat",
      code: "RULE-DEATH-THREAT-001",
      name: "Ameaça de Morte",
      description: null,
      priority: 20,
      condition: { kind: "condition", question_key: "death_threat", operator: "equals", value: "YES" },
      actions: { orientation_code: "ORIENT-URGENT-001" },
      signals: ["death_threat"],
      signal_priority: 20,
      special_flows: null,
      is_active: true,
      rule_version: "FAM-LEGACY-1.0",
    });
    const scenario = eventFor(evaluateFamRisk({ death_threat: "YES" }, [deathThreatRule]), "case-death-threat", "user-1");
    expect(scenario.result.triggeredRules).toContain("RULE-DEATH-THREAT-001");
    expect(scenario.result.attention).toBe("relevant");
    expect(scenario.ruleEvents.every((event) => event.assessmentId === "case-death-threat")).toBe(true);
  });

  it("crianças em risco gera fluxo especializado e auditoria de regra", () => {
    const scenario = eventFor(evaluateFamRisk({ children: "YES" }), "case-children", "user-1");
    expect(scenario.result.triggeredRules).toContain("RULE-SPECIAL-CHILDREN-001");
    expect(scenario.result.specialFlowFlags).toContain("children");
    expect(scenario.result.attention).toBe("relevant");
    expect(scenario.transition.auditEvent.toState).toBe("PROTECTION_SPECIAL");
    expect(scenario.ruleEvents[0]?.eventType).toBe("RULE_TRIGGERED");
  });
});
