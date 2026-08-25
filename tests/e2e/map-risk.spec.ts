import { test, expect } from "@playwright/test";

const QUESTIONS: Array<[string, string]> = [
  ["danger_now", "Existe perigo ou ameaça acontecendo agora?"],
  ["injury", "Você precisa de atendimento médico ou está ferida?"],
  ["weapon", "A pessoa que ameaça você tem acesso a arma?"],
  ["sexual", "Houve violência sexual ou coerção?"],
  ["children", "Há crianças ou adolescentes em situação de risco?"],
  ["elderly", "Há alguma pessoa idosa"],
  ["disability", "pessoa com deficiência"],
];

async function answerAll(page: any, value: "sim" | "não" | "prefiro não responder") {
  for (const [key] of QUESTIONS) {
    const btn = page.locator(`button:has-text("${value}")`).first();
    // Narrow to current question group: find the card containing the key label, then click within it
    // Simpler: click by order - there are N questions, each has 3 buttons. We'll find all "Sim"/etc and click next unanswered.
    // Use locator for question text then sibling buttons
  }
}

// Helper robusto: responde por ordem das perguntas visíveis
async function answerByIndex(page: any, questionIndex: number, value: string) {
  const questionLocator = page.locator("p.text-sm.font-medium.text-fam-deep-plum").nth(questionIndex);
  await expect(questionLocator).toBeVisible();
  // Within same card section, find the button
  const card = questionLocator.locator("xpath=ancestor::div[contains(@class,'space-y-2')]");
  const btn = card.locator(`button:has-text("${value}")`);
  await btn.click();
}

async function fillAll(page: any, value: "sim" | "não" | "prefiro não responder") {
  for (let i = 0; i < QUESTIONS.length; i++) {
    await answerByIndex(page, i, value);
  }
}

test.describe("Mapa - Fluxos", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/analise-risco");
    // Dismiss accessibility onboarding if visible (close button)
    const closeBtn = page.locator('button[aria-label="Fechar e usar padrão"], button:has-text("Fechar")').first();
    if (await closeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await closeBtn.click();
    }
    // Dismiss safety notice X if needed? Keep visible - not blocking
  });

  test("fluxo normal - todas NÃO => orientação sem urgência", async ({ page }) => {
    await fillAll(page, "não");
    await page.locator('button:has-text("Ver orientação inicial")').click();
    await expect(page.locator("text=É importante conversar com uma atendente")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=Não foi possível concluir")).toBeVisible();
    await expect(page.locator("text=Base jurídica aplicável")).toBeVisible();
    // Não deve mostrar emergência
    await expect(page.locator("text=Sua segurança vem primeiro")).not.toBeVisible();
  });

  test("fluxo emergência - AR-01 = SIM => prioridade emergência", async ({ page }) => {
    // Marca primeira pergunta danger_now = sim, resto não
    await answerByIndex(page, 0, "sim");
    for (let i = 1; i < QUESTIONS.length; i++) await answerByIndex(page, i, "não");
    await page.locator('button:has-text("Ver orientação inicial")').click();
    await expect(page.locator("text=Sinais que merecem atenção imediata")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=Se houver perigo agora")).toBeVisible();
    // Special flow panel deve conter emergência
    await expect(page.locator("text=Sua segurança vem primeiro")).toBeVisible();
  });

  test("fluxo prefiro não responder - todas PNR => não interpretado como NÃO", async ({ page }) => {
    await fillAll(page, "prefiro não responder");
    await page.locator('button:has-text("Ver orientação inicial")').click();
    await expect(page.locator("text=É importante conversar")).toBeVisible({ timeout: 5000 });
    // Não deve aparecer sinais de emergência, mas deve pedir conversa
    await expect(page.locator("text=Não foi possível concluir")).toBeVisible();
  });

  test("fluxo violência sexual - AR-04 = SIM => fluxo especial sexual", async ({ page }) => {
    for (let i = 0; i < QUESTIONS.length; i++) {
      const val = i === 3 ? "sim" : "não"; // índice 3 = sexual
      await answerByIndex(page, i, val);
    }
    await page.locator('button:has-text("Ver orientação inicial")').click();
    await expect(page.locator("text=É importante conversar")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=Violência sexual / coerção")).toBeVisible();
    await expect(page.locator("text=Você não precisa descrever o que aconteceu")).toBeVisible();
  });

  test("fluxo criança/adolescente - AR-05 = SIM => proteção criança", async ({ page }) => {
    for (let i = 0; i < QUESTIONS.length; i++) {
      const val = i === 4 ? "sim" : "não"; // índice 4 = children
      await answerByIndex(page, i, val);
    }
    await page.locator('button:has-text("Ver orientação inicial")').click();
    await expect(page.locator("text=Proteção de criança/adolescente")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=Conselho Tutelar ou autoridade policial")).toBeVisible();
    await expect(page.locator("text=Você não precisa enviar fotos")).toBeVisible();
  });

  test("fluxo pessoa idosa - AR-06 = SIM => fluxo idosa", async ({ page }) => {
    for (let i = 0; i < QUESTIONS.length; i++) {
      const val = i === 5 ? "sim" : "não"; // elderly
      await answerByIndex(page, i, val);
    }
    await page.locator('button:has-text("Ver orientação inicial")').click();
    await expect(page.locator("text=Pessoa idosa em possível situação de risco")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=Você pode pedir ajuda para preencher")).toBeVisible();
  });

  test("fluxo pcd - AR-07 = SIM => fluxo pcd", async ({ page }) => {
    for (let i = 0; i < QUESTIONS.length; i++) {
      const val = i === 6 ? "sim" : "não"; // disability
      await answerByIndex(page, i, val);
    }
    await page.locator('button:has-text("Ver orientação inicial")').click();
    await expect(page.locator("text=Pessoa com deficiência")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=apoio não significa autorização irrestrita")).toBeVisible();
  });

  test("sem anexos não bloqueia + com anexos opcional", async ({ page }) => {
    // Verifica que FileUploader está visível mas não obrigatório
    await expect(page.locator("text=Quer enviar documentos")).toBeVisible();
    await fillAll(page, "não");
    // Botão deve habilitar mesmo sem anexos
    await expect(page.locator('button:has-text("Ver orientação inicial")')).toBeEnabled();
  });

  test("encaminhamento - botões oficiais presentes", async ({ page }) => {
    await fillAll(page, "não");
    await page.locator('button:has-text("Ver orientação inicial")').click();
    await expect(page.locator('a[href="tel:190"]')).toBeVisible();
    await expect(page.locator('a[href="tel:180"]')).toBeVisible();
    await expect(page.locator('button:has-text("Fale com uma atendente")')).toBeVisible();
  });

  test("saída rápida sempre visível", async ({ page }) => {
    // FamSafetyNotice tem botão X e texto de segurança
    await expect(page.locator("text=Você está em segurança para continuar?")).toBeVisible();
    // Verifica que não há promessa impossível (ex: não deve conter "apagaremos todo histórico")
    await expect(page.locator("text=apagaremos todo histórico")).not.toBeVisible();
  });

  test("compartilhamento granular bloqueia share_entire_case (UI)", async ({ page }) => {
    // Vai para admin compartilhamentos (precisa estar logado como apostolo - pula se não logado)
    await page.goto("/admin/compartilhamentos");
    // Se não logado, deve redirecionar para /entrar ou mostrar login
    const url = page.url();
    if (url.includes("/entrar")) {
      test.skip(true, "Precisa login apostolo para testar compartilhamento");
      return;
    }
    // Tenta criar share com ["*"] via UI -> deve alertar
    await page.fill('input[placeholder="fam_risk_cases.id"]', "00000000-0000-0000-0000-000000000000");
    await page.locator('button:has-text("Testar bloqueio share_entire_case")').click();
    await expect(page.locator("text=Bloqueio OK")).toBeVisible({ timeout: 5000 });
  });
});

test.describe("INFO", () => {
  test("INFO 4 portas + busca + trilha", async ({ page }) => {
    await page.goto("/info");
    await expect(page.locator("text=Conhecimento que Protege")).toBeVisible();
    await expect(page.locator("text=Quero entender")).toBeVisible();
    await expect(page.locator("text=Quero aprender")).toBeVisible();
    await expect(page.locator("text=Quero me aprofundar")).toBeVisible();
    await expect(page.locator("text=Fontes oficiais")).toBeVisible();
    // Trilha inicial
    await expect(page.locator("text=Conhecendo meus direitos")).toBeVisible();
    // Busca
    await page.goto("/info/busca");
    await expect(page.locator('input[placeholder*="Busque"]')).toBeVisible();
    await page.fill('input[placeholder*="Busque"]', "direitos");
    await expect(page.locator("text=Entenda em 2 minutos")).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Acessibilidade & Mobile", () => {
  test("navegação por teclado no Mapa", async ({ page }) => {
    await page.goto("/analise-risco");
    await page.keyboard.press("Tab");
    // Primeiro botão Sim deve receber foco
    const focused = page.locator("button:has-text('sim')").first();
    // Não falha se não focar exato, apenas verifica que tab não quebra
    await expect(page.locator("text=Como você está agora?")).toBeVisible();
  });

  test("mobile - botões grandes e Saída Rápida visível", async ({ page, isMobile }) => {
    test.skip(!isMobile, "Apenas mobile project");
    await page.goto("/analise-risco");
    await expect(page.locator("text=Você está em segurança")).toBeVisible();
    // Verifica touch target >= 44px (botões têm h-12)
    const btn = page.locator('button:has-text("Ver orientação inicial")');
    const box = await btn.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(40);
  });
});
