import { expect, test } from "@playwright/test";

test.describe("FAM — Jornada do Conhecimento", () => {
  async function dismissWelcome(page: Parameters<typeof test>[0]["page"]) {
    const defaultButton = page.getByRole("button", { name: "Usar configuração padrão" });
    if (await defaultButton.isVisible().catch(() => false)) await defaultButton.click();
  }

  test("carrega a rota pública com busca e filtros acessíveis", async ({ page }) => {
    await page.goto("/jornada-conhecimento", { waitUntil: "networkidle" });
    await dismissWelcome(page);
    await expect(page.getByRole("heading", { name: "Conheça seus direitos" })).toBeVisible();
    await expect(page.getByRole("search")).toBeVisible();
    await expect(page.getByLabel("O que você precisa saber?")).toBeVisible();
    await expect(page.getByRole("button", { name: "Todos", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Direitos", exact: true })).toBeVisible();
  });

  test("permite filtrar por tema sem recarregar o documento", async ({ page }) => {
    await page.goto("/jornada-conhecimento", { waitUntil: "networkidle" });
    await dismissWelcome(page);
    let reloads = 0;
    page.on("load", () => { reloads += 1; });
    await page.getByRole("button", { name: "Proteção", exact: true }).click();
    await expect(page.getByRole("button", { name: "Proteção", exact: true })).toHaveClass(/bg-fam-plum/);
    expect(reloads).toBe(0);
  });

  test("não expõe conteúdo de homologação enquanto estiver em draft", async ({ page }) => {
    await page.goto("/jornada-conhecimento", { waitUntil: "networkidle" });
    await dismissWelcome(page);
    await expect(page.getByText("TESTE — Como funciona a Jornada do Conhecimento")).not.toBeVisible();
    await expect(page.getByText("Conteúdos publicados, revisados e com fonte identificada.")).toBeVisible();
  });

  test("mostra a proteção editorial no painel administrativo", async ({ page }) => {
    await page.goto("/admin/fam-conhecimento", { waitUntil: "networkidle" });
    await dismissWelcome(page);
    await expect(page.getByRole("heading", { name: "Curadoria e publicação" })).toBeVisible();
    await expect(page.getByLabel("Referência do parecer ou ata")).toBeVisible();
    await expect(page.getByLabel("Próxima revisão")).toBeVisible();
    await expect(page.getByText("A publicação ficará bloqueada até que a referência de aprovação e a próxima data de revisão sejam preenchidas.")).toBeVisible();
  });
});
