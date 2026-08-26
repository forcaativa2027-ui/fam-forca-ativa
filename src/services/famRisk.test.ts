import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  FAM_RISK_METHODOLOGY_SOURCE_DOCUMENT,
  FAM_RISK_METHODOLOGY_VERSION,
  FAM_RISK_QUESTIONNAIRE_VERSION,
  createRiskCase,
  getRiskCase,
} from "./famRisk";

function clientFrom(handler: (table: string) => unknown): SupabaseClient {
  return { from: handler } as unknown as SupabaseClient;
}

describe("famRisk versionamento explícito", () => {
  it("persiste as versões e a fonte no momento da criação do caso", async () => {
    let inserted: Record<string, unknown> | undefined;
    const sb = clientFrom((table) => {
      expect(table).toBe("fam_risk_cases");
      return {
        insert: (row: Record<string, unknown>) => {
          inserted = row;
          return {
            select: () => ({
              single: async () => ({
                data: { id: "case-1", ...row },
                error: null,
              }),
            }),
          };
        },
      };
    });

    const result = await createRiskCase(sb, { user_id: "user-1" });

    expect(result.methodology_version).toBe(FAM_RISK_METHODOLOGY_VERSION);
    expect(inserted).toMatchObject({
      risk_engine_version: "FAM-RISK-1.0",
      methodology_version: FAM_RISK_METHODOLOGY_VERSION,
      questionnaire_version: FAM_RISK_QUESTIONNAIRE_VERSION,
      methodology_source_document: FAM_RISK_METHODOLOGY_SOURCE_DOCUMENT,
    });
  });

  it("recupera as versões persistidas sem substituí-las pela versão atual", async () => {
    const persisted = {
      id: "case-legacy-versioned",
      methodology_version: "OC-04-v1.0",
      questionnaire_version: "OC-04-v1.0",
      methodology_source_document: "OC-04-v1.0.md",
      risk_engine_version: "FAM-RISK-0.9",
    };
    const sb = clientFrom((table) => {
      expect(table).toBe("fam_risk_cases");
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: persisted, error: null }),
          }),
        }),
      };
    });

    const result = await getRiskCase(sb, persisted.id);

    expect(result).toMatchObject(persisted);
    expect(result?.methodology_version).not.toBe(FAM_RISK_METHODOLOGY_VERSION);
  });
});
