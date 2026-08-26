import { describe, expect, it, vi } from "vitest";
import { createFamReferralRequest } from "./famReferralRequests";
import type { FamReferralOption } from "./famReferrals";

const option: FamReferralOption = {
  code: "REF-TEST-001",
  recipient: "SAUDE",
  label: "Saúde",
  purpose: "Orientar sobre atendimento de saúde.",
  priority: "specialized",
  reason: "Fluxo especializado.",
  dataScope: ["identificador do caso"],
  requiresProfessionalConfirmation: true,
  disclaimer: "O recebimento não significa atendimento.",
};

describe("createFamReferralRequest", () => {
  it("não acessa o banco sem confirmação explícita", async () => {
    const from = vi.fn();
    await expect(createFamReferralRequest({ from } as never, { caseId: "case-1", userId: "user-1", option, confirmationAccepted: false })).rejects.toThrow("Confirmação explícita");
    expect(from).not.toHaveBeenCalled();
  });

  it("insere o pedido confirmado com o escopo catalogado", async () => {
    const single = vi.fn().mockResolvedValue({ data: { id: "request-1" }, error: null });
    const select = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select });
    const sb = { from: vi.fn().mockReturnValue({ insert }) };
    await expect(createFamReferralRequest(sb as never, { caseId: "case-1", userId: "user-1", option, confirmationAccepted: true })).resolves.toMatchObject({ id: "request-1" });
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ case_id: "case-1", requested_by: "user-1", requested_data: ["identificador do caso"] }));
  });
});


describe("selected attachments", () => {
  it("rejeita anexo pendente antes de criar o encaminhamento", async () => {
    const single = vi.fn();
    const inFilter = vi.fn().mockResolvedValue({ data: [{ id: "att-1", malware_scan_status: "pending", deleted_at: null, retention_expires_at: null }], error: null });
    const sb = { from: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ in: inFilter }) }) }) }) };
    await expect(createFamReferralRequest(sb as never, { caseId: "case-1", userId: "user-1", option, confirmationAccepted: true, selectedAttachmentIds: ["att-1"] })).rejects.toThrow("anexos selecionados");
    expect(single).not.toHaveBeenCalled();
  });

  it("normaliza IDs e insere apenas anexos limpos dentro da retenção", async () => {
    const single = vi.fn().mockResolvedValue({ data: { id: "request-2", selected_attachment_ids: ["att-1"] }, error: null });
    const insert = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single }) });
    const inFilter = vi.fn().mockResolvedValue({ data: [{ id: "att-1", malware_scan_status: "clean", deleted_at: null, retention_expires_at: null }], error: null });
    const sb = { from: vi.fn().mockImplementation((table: string) => table === "fam_risk_attachments" ? { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ in: inFilter }) }) }) } : { insert }) };
    await expect(createFamReferralRequest(sb as never, { caseId: "case-1", userId: "user-1", option, confirmationAccepted: true, selectedAttachmentIds: ["att-1", "att-1"] })).resolves.toMatchObject({ id: "request-2" });
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ selected_attachment_ids: ["att-1"] }));
  });
});
