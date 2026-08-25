# Testes E2E — FAM

Cobrem:
- normal, emergência (AR-01), prefiro não responder, sexual (AR-04), criança/adolescente (AR-05), idosa, pcd
- sem anexos não bloqueia, encaminhamento (190/180/atendente), saída rápida, compartilhamento granular (bloqueio share_entire_case)
- INFO 4 portas + busca + trilha + fontes
- Acessibilidade (teclado) + mobile (touch target)

Rodar local:
```bash
npm run test:e2e
npm run test:e2e:ui
```

CI: usa `PLAYWRIGHT_BASE_URL` para apontar para preview do Vercel.
