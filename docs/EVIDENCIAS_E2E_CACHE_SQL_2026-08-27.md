# Evidências da validação E2E, cache e SQL — 2026-08-27

## Vercel

URL do deployment: https://vercel.com/fam-0cef/fam-forca-ativa/F5iU9fzQ9AEzmWYEd8wQMhRX3Ggm

O deployment do commit `79b6724` (`fix(fam): refresh service worker assets and questionnaire`) ficou com status **Ready**, ambiente Production, duração aproximada de 1m13s, e domínios `https://fam-forca-ativa.vercel.app` e `https://fam-forca-ativa-4a3h0khd4-fam-0cef.vercel.app`.

## Questionário público

URL testada: https://fam-forca-ativa.vercel.app/analise-risco

A tela exibiu FAM — Força Ativa da Mulher, telefones 180 e 190, Quick Exit, cinco perguntas, coleta progressiva, `OC-04-v1.1/AR-01` e o aviso de que a ferramenta não diagnostica, não produz laudo e não classifica crime.

Teste manual: selecionar `Sim` exibiu imediatamente o aviso de perigo e o botão de orientação imediata; trocar para `Não` removeu o aviso e habilitou imediatamente `Próxima pergunta`, sem recarregar a página.

## Testes E2E

Suíte Playwright criada em `e2e/fam-risk.spec.ts` com configuração em `playwright.config.ts`. Execução contra `https://fam-forca-ativa.vercel.app` resultou em **2 testes aprovados**: percurso das cinco perguntas sem recarga e verificação do service worker `fam-shell-v2`/referência metodológica.

## Supabase

URL do SQL Editor usada para leitura: https://supabase.com/dashboard/project/untlbpzafiojirmpogqp/sql/new

Objetos confirmados: `public.fam_professional_credentials`, `public.fam_access_audit_events`, `public.fam_can_access_sensitive_content(uuid,uuid,text)`, `public.fam_confirm_credential_mfa()`, `public.fam_is_credential_manager()`; ambas as tabelas apresentaram `rowsecurity = true`. Policies observadas incluem `fam_credentials_manager_write`, `fam_credentials_self_read` e `fam_access_audit_manager_read`.

A FAM027 contém o catálogo `fam_legal_purpose_catalog`, com registros inativos por padrão, e adiciona metadados de finalidade/base/retencao a `fam_referral_requests`. A FAM028 corrigida usa criação idempotente do tipo enum via bloco `DO` e não depende de `module_delegations`.
