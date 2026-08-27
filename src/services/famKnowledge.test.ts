import { describe, expect, it } from "vitest";
import { validateKnowledgeTransition } from "./famKnowledge";

describe("famKnowledge — governança de publicação", () => {
  it("permite transições intermediárias sem metadados de publicação", () => {
    expect(validateKnowledgeTransition("curation")).toEqual({ ok: true });
    expect(validateKnowledgeTransition("under_review", { notes: "Revisado pela equipe" })).toEqual({ ok: true });
    expect(validateKnowledgeTransition("approved")).toEqual({ ok: true });
  });

  it("exige referência de parecer ou ata para publicar", () => {
    expect(validateKnowledgeTransition("published", { reviewDate: "2026-12-31" })).toEqual({
      ok: false,
      message: "A publicação exige a referência do parecer ou ata de aprovação.",
    });
  });

  it("exige data da próxima revisão para publicar", () => {
    expect(validateKnowledgeTransition("published", { approvalReference: "ATA-FAM-2026-001" })).toEqual({
      ok: false,
      message: "A publicação exige a data da próxima revisão.",
    });
  });

  it("aceita publicação quando os dois metadados estão preenchidos", () => {
    expect(validateKnowledgeTransition("published", {
      approvalReference: " ATA-FAM-2026-001 ",
      reviewDate: "2026-12-31",
    })).toEqual({ ok: true });
  });

  it("rejeita valores vazios ou apenas espaços", () => {
    expect(validateKnowledgeTransition("published", { approvalReference: "   ", reviewDate: "2026-12-31" }).ok).toBe(false);
    expect(validateKnowledgeTransition("published", { approvalReference: "ATA-1", reviewDate: "   " }).ok).toBe(false);
  });
});
