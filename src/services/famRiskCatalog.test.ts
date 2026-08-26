import { describe, expect, it } from "vitest";
import { FAM_RISK_CATALOG_VERSION, FAM_RISK_QUESTIONS, isKnownFamRiskQuestion } from "./famRiskCatalog";

describe("FAM risk catalog", () => {
  it("exposes the documented OC-04 version", () => {
    expect(FAM_RISK_CATALOG_VERSION).toBe("OC-04-v1.1");
  });

  it("keeps stable AR question keys and documented sources", () => {
    expect(FAM_RISK_QUESTIONS.map((question) => question.key)).toEqual([
      "danger_now",
      "injury",
      "weapon",
      "sexual",
      "children",
    ]);
    expect(FAM_RISK_QUESTIONS.map((question) => question.source)).toEqual([
      "OC-04-v1.1/AR-01",
      "OC-04-v1.1/AR-02",
      "OC-04-v1.1/AR-03",
      "OC-04-v1.1/AR-04",
      "OC-04-v1.1/AR-05",
    ]);
  });

  it("preserves the three distinct answer values", () => {
    const values = FAM_RISK_QUESTIONS[0].options.map((option) => option.value);
    expect(values).toEqual(["YES", "NO", "PREFER_NOT_TO_ANSWER"]);
    expect(isKnownFamRiskQuestion("danger_now")).toBe(true);
    expect(isKnownFamRiskQuestion("unknown")).toBe(false);
  });
});
