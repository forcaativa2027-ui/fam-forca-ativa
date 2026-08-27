# Jornada do Conhecimento FAM — Arquitetura de Implementação

## Objetivo

Criar uma área pública de legislação, direitos, proteção e serviços, com conteúdo governado, fontes identificáveis, linguagem clara, trilhas opcionais e integração futura com busca e Policy Engine.

## Rotas

```text
/jornada-conhecimento                         página pública
/jornada-conhecimento/temas/[slug]            conteúdo por tema
/jornada-conhecimento/conteudo/[contentKey]   detalhe de conteúdo
/jornada-conhecimento/trilhas/[trailKey]      trilha de conhecimento
/admin/fam-conhecimento                        curadoria e governança
```

A navegação pública deverá inserir **Conheça seus direitos** entre Doação e Entrar. O item só deve ser renderizado quando o módulo `knowledge_journey` estiver habilitado para o tenant. A rota também deve verificar o módulo; esconder o link não é suficiente para proteger o acesso por URL direta.

## Componentes públicos

```text
src/app/jornada-conhecimento/page.tsx
src/app/jornada-conhecimento/temas/[slug]/page.tsx
src/app/jornada-conhecimento/conteudo/[contentKey]/page.tsx
src/app/jornada-conhecimento/trilhas/[trailKey]/page.tsx

src/components/public/KnowledgeJourneyHome.tsx
src/components/public/KnowledgeSearch.tsx
src/components/public/KnowledgeTopicCards.tsx
src/components/public/KnowledgeContentCard.tsx
src/components/public/KnowledgeContentView.tsx
src/components/public/KnowledgeSourceList.tsx
src/components/public/KnowledgeMediaList.tsx
src/components/public/KnowledgeTrailView.tsx
src/components/public/KnowledgeProgress.tsx
src/components/public/KnowledgeDisclaimer.tsx
```

`KnowledgeJourneyHome` organiza a entrada, temas e destaques. `KnowledgeSearch` deve pesquisar somente conteúdos publicados e públicos. `KnowledgeContentView` apresenta resumo, significado, próximo passo e fontes. `KnowledgeTrailView` controla etapas, retorno, avanço e saída sem obrigar o salvamento de progresso. `KnowledgeDisclaimer` deixa explícito que a informação é educativa e não substitui a análise de um caso concreto.

## Serviços e hooks

```text
src/services/famKnowledge.ts
src/hooks/useFamKnowledge.ts
src/lib/famKnowledgeTypes.ts
```

O serviço deve expor funções como:

```ts
listPublishedKnowledgeContents(filters)
searchPublishedKnowledgeContents(query)
getPublishedKnowledgeContent(contentKey, version?)
listKnowledgeSources(contentId)
listKnowledgeTrails(filters)
getPublishedKnowledgeTrail(trailKey)
```

A consulta pública deve sempre aplicar `tenant_key = 'FAM'`, `status = 'published'`, `classification = 'publico'` e as datas de vigência. A busca localiza candidatos; a política de acesso decide o que pode ser exibido.

## Componentes administrativos

```text
src/app/admin/fam-conhecimento/page.tsx
src/components/admin/FamKnowledgeAdmin.tsx
src/components/admin/KnowledgeContentEditor.tsx
src/components/admin/KnowledgeSourceEditor.tsx
src/components/admin/KnowledgeTaxonomyEditor.tsx
src/components/admin/KnowledgeTrailEditor.tsx
src/components/admin/KnowledgeReviewPanel.tsx
src/components/admin/KnowledgeAuditPanel.tsx
```

O painel deve mostrar conteúdo, tipo, status, versão, proprietário, fonte, última revisão, próxima revisão e pendências. O editor nunca deve publicar diretamente ao salvar. O fluxo deve ser:

```text
DRAFT → CURATION → UNDER_REVIEW → APPROVED → PUBLISHED
                                  ├→ REJECTED
PUBLISHED → SUPERSEDED / ARCHIVED
```

Para conteúdo jurídico, a publicação deve exigir fonte, versão, data de revisão, revisão jurídica quando aplicável e referência de aprovação institucional. O administrador técnico não deve receber automaticamente autorização para editar ou ler conteúdo restrito.

## Roteamento administrativo

Adicionar `knowledge_journey` ao mapa de módulos do tenant FAM e integrar a chave a:

```text
AdminSidebar
TabRouter
TenantModuleGuard
```

O painel deve usar a função `fam_is_knowledge_manager()` inicialmente. Em uma etapa posterior, esse acesso pode ser migrado para uma matriz de papéis de curador, revisor técnico, revisor jurídico, aprovador e publicador, sem conceder acesso a casos ou arquivos sensíveis.

## Modelo de estado para o frontend

```ts
type KnowledgeStatus =
  | 'draft' | 'curation' | 'under_review' | 'approved'
  | 'published' | 'superseded' | 'archived' | 'rejected';

type KnowledgeViewState =
  | { kind: 'loading' }
  | { kind: 'ready'; items: KnowledgeContent[] }
  | { kind: 'empty' }
  | { kind: 'error' };
```

A interface deve distinguir carregamento, ausência de resultados, falha técnica e conteúdo indisponível. Não deve mostrar mensagens internas como códigos SQL, nomes de policies ou classificações confidenciais.

## Ordem de implantação

1. Aplicar `FAM029_knowledge_service_jornada_conhecimento.sql` no Supabase.
2. Confirmar as tabelas e a função `fam_is_knowledge_manager()`.
3. Habilitar `knowledge_journey` apenas para `FAM-Samambaia-DF`.
4. Criar o serviço e os hooks públicos.
5. Criar a aba e as rotas públicas.
6. Criar o painel de curadoria protegido pelo guard de tenant.
7. Cadastrar dois ou três conteúdos fictícios como `draft`.
8. Testar a transição editorial até `published`.
9. Publicar conteúdos oficiais após validação técnica, jurídica e institucional.
10. Adicionar busca, taxonomia, trilhas, vídeos, PDFs e transcrições.

## Testes mínimos

```text
JK-T01 — conteúdo draft não aparece publicamente
JK-T02 — conteúdo published aparece para FAM
JK-T03 — conteúdo de outro tenant não aparece
JK-T04 — fonte oficial aparece no detalhe
JK-T05 — conteúdo expirado não aparece como vigente
JK-T06 — publicação sem aprovação é bloqueada
JK-T07 — administrador técnico sem papel de curador é bloqueado
JK-T08 — trilha permite voltar, avançar e sair
JK-T09 — vídeo possui alternativa textual
JK-T10 — navegação funciona por teclado e leitor de tela
```

## Regra de conteúdo

O primeiro acervo deve distinguir texto oficial, resumo educativo e orientação institucional. Nenhum conteúdo deve apresentar interpretação jurídica individualizada como se fosse texto legal oficial. Conteúdos nacionais e regionais devem possuir fonte, órgão responsável, link original, data de verificação e data de revisão.
