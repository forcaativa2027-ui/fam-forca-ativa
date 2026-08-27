import { describe, expect, it } from "vitest";
import { loadFamOperationalGovernanceReport } from "./famOperationalGovernanceReport";

function mockSupabase(dataByTable: Record<string, unknown[]>, errorByTable: Record<string, Error | null> = {}) {
  return {
    from(table: string) {
      const result = { data: dataByTable[table] ?? [], error: errorByTable[table] ?? null };
      const builder = {
        select: () => builder,
        eq: () => builder,
        order: () => builder,
        limit: () => Promise.resolve(result),
        then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
      };
      return builder;
    },
  } as never;
}

describe("loadFamOperationalGovernanceReport", () => {
  it("agrega retenção, legal hold e decisões sem expor payload sensível", async () => {
    const report = await loadFamOperationalGovernanceReport(mockSupabase({
      fam_retention_policies: [
        { retention_class: "R1", label: "Respostas", default_retention_days: 30, is_active: true, policy_version: "POL-ARQ-01-v1.1" },
        { retention_class: "R2", label: "Arquivos", default_retention_days: null, is_active: true, policy_version: "POL-ARQ-01-v1.1" },
      ],
      fam_risk_attachments: [
        { id: "a1", retention_class: "R1", legal_hold: false, retention_expires_at: "2026-08-01T00:00:00Z", deleted_at: null },
        { id: "a2", retention_class: "R2", legal_hold: true, retention_expires_at: "2026-08-01T00:00:00Z", deleted_at: null },
      ],
      fam_file_governance_events: [
        { id: "e1", attachment_id: "a2", event_type: "LEGAL_HOLD_ENABLED", retention_class: "R2", purpose: "preservar", metadata: { secret_payload: "não deve ser exibido no resumo" }, created_at: "2026-08-20T00:00:00Z" },
      ],
      fam_access_audit_events: [
        { id: "x1", actor_user_id: "u1", profile_id: "u1", case_id: "case-secret", purpose: "revisar", decision: "DENY", reason: "MFA_REQUIRED", created_at: "2026-08-20T00:00:00Z" },
      ],
    }), Date.parse("2026-08-27T00:00:00Z"));

    expect(report.policy_version).toBe("POL-ARQ-01-v1.1");
    expect(report.totals.attachments).toBe(2);
    expect(report.totals.legal_hold).toBe(1);
    expect(report.totals.expired).toBe(1);
    expect(report.totals.denied_access).toBe(1);
    expect(report.totals.mfa_required).toBe(0);
    expect(report.retention.find((item) => item.retention_class === "R1")?.expired_attachments).toBe(1);
    expect(report.governance_events[0].metadata.secret_payload).toBe("não deve ser exibido no resumo");
  });

  it("falha fechada quando uma tabela protegida não pode ser consultada", async () => {
    await expect(loadFamOperationalGovernanceReport(mockSupabase(
      { fam_retention_policies: [], fam_risk_attachments: [], fam_file_governance_events: [], fam_access_audit_events: [] },
      { fam_file_governance_events: new Error("RLS") },
    ))).rejects.toThrow("RLS");
  });
});
