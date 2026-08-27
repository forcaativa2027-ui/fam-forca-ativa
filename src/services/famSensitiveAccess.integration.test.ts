import { describe, expect, it } from "vitest";

const url = process.env.FAM_TEST_SUPABASE_URL;
const anonKey = process.env.FAM_TEST_SUPABASE_ANON_KEY;
const accessToken = process.env.FAM_TEST_ACCESS_TOKEN;
const profileId = process.env.FAM_TEST_PROFILE_ID;
const caseId = process.env.FAM_TEST_CASE_ID ?? "00000000-0000-0000-0000-000000000000";
const purpose = process.env.FAM_TEST_PURPOSE ?? "revisar_encaminhamento";
const enabled = Boolean(url && anonKey && accessToken && profileId);

async function callSensitiveRpc(subjectProfileId: string) {
  const response = await fetch(`${url}/rest/v1/rpc/fam_can_access_sensitive_content`, {
    method: "POST",
    headers: {
      apikey: anonKey!,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      p_profile_id: subjectProfileId,
      p_case_id: caseId,
      p_purpose: purpose,
    }),
  });
  const body = await response.json();
  return { response, body };
}

describe.skipIf(!enabled)("RPC fam_can_access_sensitive_content — integração", () => {
  it("rejeita um profile_id diferente do usuário autenticado", async () => {
    const { response, body } = await callSensitiveRpc("00000000-0000-0000-0000-000000000001");
    expect(response.ok).toBe(true);
    expect(body).toBe(false);
  });

  it("retorna uma decisão booleana para a combinação real de usuário, caso e finalidade", async () => {
    const { response, body } = await callSensitiveRpc(profileId!);
    expect(response.ok).toBe(true);
    expect(typeof body).toBe("boolean");
  });

  it("não expõe erro interno quando a finalidade não está autorizada", async () => {
    const response = await fetch(`${url}/rest/v1/rpc/fam_can_access_sensitive_content`, {
      method: "POST",
      headers: {
        apikey: anonKey!,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        p_profile_id: profileId,
        p_case_id: caseId,
        p_purpose: "finalidade_nao_autorizada_homologacao",
      }),
    });
    expect(response.ok).toBe(true);
    expect(await response.json()).toBe(false);
  });
});
