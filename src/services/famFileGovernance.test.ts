import { describe, expect, it } from "vitest";
import { canFamAttachmentBePurged, classifyFamAttachment, validateFamFile } from "./famFileGovernance";

describe("FAM file governance", () => {
  it("accepts PDF within the documented limit", () => {
    expect(validateFamFile("orientacao.pdf", "application/pdf", 10 * 1024 * 1024)).toEqual({ ok: true, category: "pdf" });
  });

  it("rejects dangerous or unknown extensions", () => {
    expect(validateFamFile("arquivo.exe", "application/octet-stream", 10)).toEqual({ ok: false, reason: "EXTENSION_NOT_ALLOWED" });
    expect(validateFamFile("arquivo.zip", "application/zip", 10)).toEqual({ ok: false, reason: "EXTENSION_NOT_ALLOWED" });
  });

  it("requires MIME and extension to agree", () => {
    expect(validateFamFile("imagem.png", "application/pdf", 10)).toEqual({ ok: false, reason: "MIME_NOT_ALLOWED" });
  });

  it("rejects files over the category limit", () => {
    expect(validateFamFile("audio.mp3", "audio/mpeg", 50 * 1024 * 1024 + 1)).toEqual({ ok: false, reason: "FILE_TOO_LARGE" });
  });

  it("classifies retention without applying a universal 30-day rule", () => {
    expect(classifyFamAttachment({ hasContinuedSupport: false, isSecurityOrAudit: false, isIncident: false })).toBe("R2");
    expect(classifyFamAttachment({ hasContinuedSupport: true, isSecurityOrAudit: false, isIncident: false })).toBe("R3");
    expect(classifyFamAttachment({ hasContinuedSupport: false, isSecurityOrAudit: true, isIncident: false })).toBe("R4");
    expect(classifyFamAttachment({ hasContinuedSupport: false, isSecurityOrAudit: false, isIncident: true })).toBe("R5");
  });

  it("does not purge an expired attachment under legal hold", () => {
    expect(canFamAttachmentBePurged({ legalHold: true, retentionExpiresAt: "2020-01-01T00:00:00Z", now: Date.parse("2026-01-01T00:00:00Z") })).toBe(false);
  });

  it("purges only an undeleted attachment whose retention expired", () => {
    expect(canFamAttachmentBePurged({ legalHold: false, retentionExpiresAt: "2020-01-01T00:00:00Z", now: Date.parse("2026-01-01T00:00:00Z") })).toBe(true);
    expect(canFamAttachmentBePurged({ deletedAt: "2025-01-01T00:00:00Z", legalHold: false, retentionExpiresAt: "2020-01-01T00:00:00Z", now: Date.parse("2026-01-01T00:00:00Z") })).toBe(false);
  });
});
