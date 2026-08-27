import { describe, expect, it, vi } from "vitest";
import { recordFamRiskAuditEvent, recordFamRiskAuditEvents } from "./famRiskAudit";
import type { FamRiskAuditEvent } from "./famRiskStateMachine";

const event: FamRiskAuditEvent = {
  eventType: "STATE_TRANSITIONED",
  assessmentId: "assessment-1",
  actorUserId: "user-1",
  occurredAt: "2026-08-26T00:00:00.000Z",
  fromState: "IN_PROGRESS",
  toState: "EMERGENCY",
  ruleCode: "RULE-EMERGENCY-001",
  metadata: { reasonCode: "POSSIBLE_URGENCY" },
  stateMachineVersion: "FAM-STATE-1.0",
};

function mockClient() {
  const insert = vi.fn().mockResolvedValue({ error: null });
  return { insert, from: vi.fn().mockReturnValue({ insert }) } as any;
}

describe("famRiskAudit", () => {
  it("persiste evento estruturado no contrato SQL", async () => {
    const sb = mockClient();
    await recordFamRiskAuditEvent(sb, event);
    expect(sb.from).toHaveBeenCalledWith("fam_risk_audit_events");
    expect(sb.from.mock.results[0].value.insert).toHaveBeenCalledWith(expect.objectContaining({
      assessment_id: "assessment-1",
      event_type: "STATE_TRANSITIONED",
      from_state: "IN_PROGRESS",
      to_state: "EMERGENCY",
      rule_code: "RULE-EMERGENCY-001",
    }));
  });

  it("não faz chamada para lote vazio", async () => {
    const sb = mockClient();
    await recordFamRiskAuditEvents(sb, []);
    expect(sb.from).not.toHaveBeenCalled();
  });
});
