import { expect, test } from "@playwright/test";

test.describe("FAM — questionário de risco", () => {
  test("percorre as cinco perguntas sem recarregar a página", async ({ page }) => {
    await page.goto("/analise-risco", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "Análise de Risco" })).toBeVisible();
    await expect(page.getByText("Pergunta 1 de 5")).toBeVisible();

    let documentReloads = 0;
    page.on("load", () => {
      documentReloads += 1;
    });
    documentReloads = 0;

    for (let question = 1; question <= 5; question += 1) {
      await expect(page.getByText(`Pergunta ${question} de 5`)).toBeVisible();
      await page.getByRole("button", { name: "Não", exact: true }).click();

      if (question < 5) {
        await expect(page.getByRole("button", { name: "Próxima pergunta" })).toBeEnabled();
        await page.getByRole("button", { name: "Próxima pergunta" }).click();
        await expect(page.getByText(`Pergunta ${question + 1} de 5`)).toBeVisible();
      } else {
        await expect(page.getByRole("button", { name: "Ver orientação inicial" })).toBeEnabled();
      }
    }

    expect(documentReloads).toBe(0);
  });

  test("não mantém uma versão antiga do service worker ou do shell", async ({ page, request }) => {
    const serviceWorker = await request.get("/sw.js");
    expect(serviceWorker.ok()).toBeTruthy();
    expect(await serviceWorker.text()).toContain('CACHE_NAME = "fam-shell-v2"');

    await page.goto("/analise-risco", { waitUntil: "networkidle" });
    const registrations = await page.evaluate(async () => {
      if (!("serviceWorker" in navigator)) return [];
      const list = await navigator.serviceWorker.getRegistrations();
      return list.map((registration) => ({ scope: registration.scope, scriptURL: registration.active?.scriptURL ?? null }));
    });

    expect(registrations.some((registration) => registration.scriptURL?.endsWith("/sw.js"))).toBeTruthy();
    await expect(page.getByText("Referência metodológica: OC-04-v1.1/AR-01")).toBeVisible();
  });
});
