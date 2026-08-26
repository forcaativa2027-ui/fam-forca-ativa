import { describe, expect, it, vi } from "vitest";
import { listFamReferralRequests, updateFamReferralRequestStatus } from "./famReferralOperations";

describe("famReferralOperations", () => {
  it("lista solicitações ordenadas e limitadas", async () => {
    const rows = [{ id: "request-1", status: "requested" }];
    const limit = vi.fn().mockResolvedValue({ data: rows, error: null });
    const order = vi.fn().mockReturnValue({ limit });
    const select = vi.fn().mockReturnValue({ order });
    const sb = { from: vi.fn().mockReturnValue({ select }) };

    await expect(listFamReferralRequests(sb as never)).resolves.toEqual(rows);
    expect(sb.from).toHaveBeenCalledWith("fam_referral_requests");
    expect(select).toHaveBeenCalledWith("*");
    expect(order).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(limit).toHaveBeenCalledWith(100);
  });

  it("chama a RPC com a transição explícita", async () => {
    const result = { id: "request-1", status: "under_review" };
    const rpc = vi.fn().mockResolvedValue({ data: result, error: null });
    const sb = { rpc };

    await expect(updateFamReferralRequestStatus(sb as never, "request-1", "under_review")).resolves.toEqual(result);
    expect(rpc).toHaveBeenCalledWith("fam_update_referral_status", {
      p_request_id: "request-1",
      p_next_status: "under_review",
    });
  });

  it("propaga erro de autorização ou transição inválida", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "active_attendant_required" },
    });
    const sb = { rpc };

    await expect(updateFamReferralRequestStatus(sb as never, "request-1", "sent"))
      .rejects.toMatchObject({ message: "active_attendant_required" });
  });
});
