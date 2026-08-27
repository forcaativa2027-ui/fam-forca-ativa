import { describe, expect, it } from "vitest";
import { adaptRemoteRiskRule, adaptRemoteRiskRules } from "./famRiskRemoteCatalog";

describe("famRiskRemoteCatalog", () => {
  it("adapta regra legada ao contrato do engine", () => {
    const rule = adaptRemoteRiskRule({
      id: "rule-1",
      code: "RULE-DIGITAL-001",
      name: "Violência Digital",
      description: null,
      priority: 40,
      condition: { kind: "condition", question_key: "digital", operator: "equals", value: "YES" },
      actions: { orientation_code: "ORIENT-DIGITAL-001" },
      signals: ["digital"],
      signal_priority: 40,
      special_flows: null,
      is_active: true,
    });
    expect(rule.version).toBe("LEGACY-UNVERSIONED");
    expect(rule.priority).toBe("specialized");
    expect(rule.expression).toEqual({ kind: "condition", questionKey: "digital", operator: "equals", value: "YES" });
    expect(rule.orientationCode).toBe("ORIENT-DIGITAL-001");
  });

  it("ignora regras remotas inactivas", () => {
    expect(adaptRemoteRiskRules([{
      id: "rule-1", code: "RULE-OFF", name: "Off", description: null, priority: 50,
      condition: {}, actions: {}, signals: null, signal_priority: null, special_flows: null, is_active: false,
    }])).toEqual([]);
  });
});
