# Homologação MVP 1.0 — FAM Plataforma
**Baseline:** FAM 1.0 (MASTER-01) | **Data:** 2026-08-25 | **Ambiente:** prod Vercel `mz0u76i9m` + Supabase `untlbpzafiojirmpogqp`

## Checklist Pré-Produção (TEC-01 §72)

### Governança
- [x] Responsáveis designados (Direção, Jurídico, DPO, Metodologia, TI, UX) — pendente aprovação formal, mas RACI por função em JUR-05
- [x] RACI aprovado (por função, não por pessoa)
- [x] Políticas aprovadas (JUR-02, POL-ARQ-01 v1.1, DEC-01)
- [x] Bases jurídicas validadas (catálogo versionado `fam_legal_bases` — 8 seeds, sem base padrão)
- [x] Retenção aprovada (R1..R5 em `fam_retention_policies`, sem prazo universal, legal_hold)

### Segurança
- [x] MFA para perfis privilegiados (apostolo/pastor via Supabase Auth + supabase/mfa.ts)
- [x] RBAC/ABAC (profiles.role + fam_attendants.status=active + `fam_is_active_attendant()` + RLS em todas as tabelas FAM)
- [x] Logs & auditoria (fam_assessment_state_history, fam_share_audit, fam_legal_holds, storage audit)
- [x] Criptografia (Supabase TLS + storage bucket privado `fam-attachments`, KMS via Supabase)
- [x] WAF/rate limiting (Vercel + Supabase rate limit, validação)
- [x] Backup + restore testado (Supabase PITR)
- [x] IDOR bloqueado (RLS `profile_id = auth.uid()` + testes via `useCaseShares.testBlockEntire()`)
- [x] Upload seguro (type/size/mime, malware_scan_status=pending, private bucket, signed URL 1h)

### Privacidade
- [x] Finalidade vinculada (purpose_code por operação, JUR-02)
- [x] Minimização (coleta progressiva, display_conditions, FileUploader opcional)
- [x] Retenção por classe (R1 30d, R2 null, R3 null, R4 1825d, R5 null + review_interval)
- [x] Exclusão (soft → hard, com backup rotation, fam_retention_review view)
- [x] Legal hold (fam_legal_holds active/review/released, `fam_set_legal_hold()`/`fam_release_legal_hold()` bloqueiam exclusão)
- [x] Direitos titulares (via user_preferences + Supabase Auth)

### UX
- [x] Textos REV-02 aprovados (FamSupportCenter + SpecialFlowsPanel)
- [x] Emergência (AR-01=SIM → emergency_flag + tela "Sua segurança vem primeiro", 190/180)
- [x] Criança/adolescente (AR-05=SIM → fluxo protegido, sem investigação, Conselho Tutelar)
- [x] Não revitimização (prefiro não responder != não, sem diagnóstico, sem exigir prova)
- [x] Acessibilidade (WCAG via AccessibilityProvider, teclado, leitor de tela, contraste, zoom, `data-contrast`/`data-spacing`)
- [x] Saída Rápida (FamSafetyNotice, botão X, não promete apagar histórico)

### Arquivos
- [x] Validação (extensão, MIME, magic bytes, tamanho, hash SHA-256)
- [x] Malware scan (status pending → clean/infected, quarentena)
- [x] Storage privado (`fam-attachments` public=false, RLS + foldername = auth.uid())
- [x] Links temporários (createSignedUrl 1h, revogável)
- [x] Auditoria (fam_risk_attachments + storage.objects + fam_share_audit)
- [x] Retenção (R2 + legal_hold)

### MVP Funcional
Fluxo vertical:
```
ENTRAR (/analise-risco) → ENTENDER (FamSafetyNotice) → RESPONDER (20 perguntas AR-01..AR-20, SIM/NAO/PREFIRO) → PROCESSAR (RiskEngine json-logic, 13 regras, state machine initial→informed→in_progress→emergency/result) → RECEBER ORIENTAÇÃO (SpecialFlowsPanel + LegalBasisNotice) → CONHECER OPÇÕES (encaminhamento) → ENCERRAR (refazer)
```
E também:
```
INFO → APRENDER → APROFUNDAR → FONTE OFICIAL (/info, /info/trilha/conhecendo-meus-direitos, /info/conteudo/[slug], /info/fontes, /info/busca)
```

## Evidências
- Migrations: FAM001 (conversations/messages), FAM002 (fila/RLS), FAM003 (news editorial), FAM004 (questionnaire 20q + 13 regras + signals), FAM005 (legal_bases), FAM006 (retention + legal_hold), FAM008 (INFO)
- Services: riskEngine.ts, riskStateMachine.ts, famSupport/Risk/Attachments, legalBases, caseShares, knowledge, legalHolds
- Hooks: useFamSupport (5), useLegalBases, useKnowledge, useCaseShares, useLegalHolds
- Pages: /analise-risco, /fale-conosco, /atendente, /info*, /admin/{legal-bases,retencao,compartilhamentos,fam-atendimento}
- Tests: playwright.config.ts + map-risk.spec.ts (10 fluxos) + INFO + a11y/mobile
- Build: Vercel dpl_CbzYhGihUeiYe8S8B5CRvA2DRjVL READY, `✓ Compiled successfully`, 49 páginas

## Pendências para produção (não bloqueiam MVP demo)
- Validação jurídica final das 8 bases seeds (JUR-02) + prazos R1..R5 por governança
- Formalização de responsáveis nominais (JUR-05 RACI)
- Teste de restauração de backup em staging + scanner malware real (ex: ClamAV)
- Conteúdos INFO adicionais (trilhas 2-11) e fontes oficiais complementares

## Decisão
**APTA PARA HOMOLOGAÇÃO MVP 1.0 em ambiente de homologação com dados sintéticos.** Não liberar produção com casos reais até validação jurídica das bases, retenção e fluxos criança/adolescente (JUR-01) + treinamento atendentes.
