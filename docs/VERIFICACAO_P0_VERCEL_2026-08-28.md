# Verificação P0 da Vercel — 2026-08-28

## Projeto

URL consultada: https://vercel.com/fam-0cef/forcaativa2027-ui-fam-forca-ativa/settings/git

A página confirma que o projeto `forcaativa2027-ui-fam-forca-ativa` existe na equipe `fam-0cef` e está conectado ao repositório GitHub `forcaativa2027-ui/fam-forca-ativa`. A conexão aparece como `Connected 2d ago`.

## Deployments

URL consultada: https://vercel.com/fam-0cef/forcaativa2027-ui-fam-forca-ativa/deployments

O deployment mais recente listado foi criado a partir do commit `6bf5714`, branch `main`, mensagem `feat(fam): add global navigation shell preferences`. A listagem exibiu filtro `Status Error`, embora a URL do deployment tenha servido a aplicação e exibido a nova navegação e o prompt de preferências.

## Aplicação servida

URL consultada: https://forcaativa2027-ui-fam-forca-ativa-hd8s6ql9i-fam-0cef.vercel.app/

A aplicação exibiu `FAM · Força Ativa da Mulher`, barra inferior pública, card `Configure sua navegação` e os itens de navegação FAM. Isso comprova que o código do commit de navegação está sendo servido nessa URL.

## Variáveis

URL consultada: https://vercel.com/fam-0cef/forcaativa2027-ui-fam-forca-ativa/settings/environment-variables

Foram visualizadas as variáveis:

- `NEXT_PUBLIC_SUPABASE_URL`, configurada para `Production and Preview`.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`, configurada para `All Environments`.

Os valores foram mantidos ocultos. A página não exibiu `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` na listagem observada.

## Conclusão provisória

GitHub e Vercel estão conectados ao repositório correto e a branch `main`. A principal lacuna de configuração observada é a ausência aparente da variável moderna `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, enquanto o projeto possui a variável legada `NEXT_PUBLIC_SUPABASE_ANON_KEY`. É necessário validar no código se a chave legada é aceita como fallback e confirmar a URL/chave como pertencentes ao mesmo projeto Supabase. Também é necessário investigar o status `Error` do deployment `6bf5714` pelos logs da Vercel antes de considerar a infraestrutura P0 encerrada.

## Atualização após configuração da Publishable key

A Vercel confirmou a variável `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` como adicionada agora, com escopo `Production and Preview`. O valor permaneceu oculto.

A página de deployments passou a exibir o deployment do commit `6bf5714` como `Ready`, com duração de build de 1m39s e ambiente `Production`. A URL de produção associada é `https://forcaativa2027-ui-fam-forca-ativa-hd8s6ql9i-fam-0cef.vercel.app`.

Conclusão: a configuração P0 de ambiente foi aplicada e o último deployment está pronto. O rótulo de filtro `Status Error` observado na página não corresponde ao estado do deployment mais recente, que aparece explicitamente como `Ready`.

## Homologação pública

A página inicial carregou em produção com a identidade FAM, o menu inferior persistente e o onboarding de preferências locais. O card de onboarding pôde ser dispensado sem erro.

A ação `Conheça seus direitos` abriu a rota `/jornada-conhecimento` corretamente. A página exibiu busca, filtros `Todos`, `Direitos`, `Proteção`, `Atendimento`, `Segurança`, `Privacidade` e `Serviços`, além do aviso de que os conteúdos devem ter fonte oficial e não substituem análise de caso concreto.

Não foram encontrados conteúdos publicados na consulta inicial. Isso é coerente com o catálogo de homologação ainda conter registros em `draft`, mas impede validar a renderização de um artigo publicado nesta etapa.

Foi encontrada uma inconsistência de terminologia na barra inferior da rota pública: o item aparece como `CEC Mais`, enquanto o dicionário institucional FAM aprovado exige `FAM Mais`. Esse item deve ser corrigido antes de encerrar a auditoria visual P0.

## Correção aplicada

Foi corrigido o fallback central em `src/services/orgTerminology.ts` para `Adm`, `FAM Mais` e `FAM ID`. Também foi corrigido o fallback do cabeçalho de membro em `src/components/panel/MemberHeader.tsx`, preservando a rota técnica interna `/painel/cecmais`.

O TypeScript foi validado diretamente pelo binário local com `tsc --noEmit`. A execução via pnpm ficou bloqueada pelo mecanismo de aprovação de scripts de dependências (`core-js` e `unrs-resolver`), sem apontar erro de código.

Commit enviado ao GitHub: `84546de` — `fix(fam): align institutional terminology fallbacks`.

A Vercel criou o deployment `7nn15sr5d` para Production e, na última observação, ele ainda estava com status `Building`. A URL de validação é `https://forcaativa2027-ui-fam-forca-ativa-7nn15sr5d-fam-0cef.vercel.app/jornada-conhecimento`.

## Correção estrutural do tenant público

A primeira correção não foi suficiente porque a rota `/jornada-conhecimento` carregava a terminologia global legada por meio de `useOrgTerminology(null)`. O componente `GlobalPublicBottomNavigation` passou a consultar explicitamente o UUID institucional FAM `3f440664-450c-45f8-ae6e-6ccef31f2993`, preservando as rotas técnicas internas.

Commit enviado: `a02623c` — `fix(fam): bind public navigation to fam tenant`.

O deployment `3k69x19ad` ficou `Ready` em Production. Na URL `https://forcaativa2027-ui-fam-forca-ativa-3k69x19ad-fam-0cef.vercel.app/jornada-conhecimento`, a barra inferior passou a exibir corretamente `FAM Mais` e `Grupo`. A rota da Jornada permanece acessível, com busca, filtros e aviso editorial.

## Teste controlado do cadastro

A rota `/entrar` carregou sem a mensagem `Invalid API key` e apresentou os links para recuperação de senha e criação de conta. A rota `/cadastrar` carregou como `Cadastro FAM`, com a primeira etapa exibindo nome, CPF opcional, e-mail, telefone/WhatsApp, barra de progresso e navegação inferior FAM.

Ao acionar `Continuar` com o formulário vazio, a validação exibiu `Nome muito curto`, `E-mail inválido` e `Telefone incompleto`, impedindo o avanço. Com dados fictícios em formato válido e CPF vazio, o fluxo avançou para a etapa 2 e exibiu `Sua conta foi criada com sucesso!`. O teste foi interrompido nessa etapa para não criar mais dados de produção e não enviar foto ou emitir um FAM ID.

O texto da etapa 2 foi corrigido no commit `07c22c3` para não afirmar que a conta já foi criada. A nova mensagem informa que os dados iniciais foram validados e que o cadastro ainda precisa ser concluído. O fluxo básico agora também informa que o acesso só estará disponível após a finalização.

A Vercel marcou o deployment `07c22c3` como `Ready`, com URL `https://forcaativa2027-ui-fam-forca-ativa-8w0u00tyz-fam-0cef.vercel.app`; contudo, a URL ainda exibiu temporariamente `Deployment is building` durante a propagação. A validação visual final deve ser repetida após a conclusão dessa propagação.

Na URL já propagada `https://forcaativa2027-ui-fam-forca-ativa-8w0u00tyz-fam-0cef.vercel.app/cadastrar`, a etapa 1 carregou normalmente, e o avanço controlado exibiu `Escolha como continuar` e `Seus dados iniciais foram validados, Maria. Ainda falta concluir o cadastro.`. A barra inferior manteve `Grupo` e `FAM Mais`. Nenhuma etapa de finalização foi acionada.

O teste funcional não concluiu o cadastro nem enviou foto ou emitiu FAM ID. A homologação completa deve usar uma conta de teste previamente autorizada ou um ambiente de staging.

## Integração da configuração institucional na Home

A Home pública não consultava `organization_configs`; ela dependia apenas do resolvedor legado de comunidades. Foi adicionada a consulta ao hook existente `useOrganizationConfig`, com validação de `is_public` e `setup_status = active`. O componente agora renderiza o nome aprovado no cabeçalho e no rodapé, além de um bloco institucional acessível com endereço, e-mail, telefone, WhatsApp, site e redes sociais, usando somente URLs HTTP/HTTPS válidas.

O UUID público FAM foi centralizado em `PUBLIC_FAM_TENANT_ID`, reutilizado pela Home e pela navegação pública, sem duplicação de identificadores. A alteração foi validada com `tsc --noEmit` e `git diff --check`.

Commit enviado: `306e56c` — `fix(fam): resolve public institutional tenant centrally`.

A Vercel identificou o deployment `b9ucx7qdq` como `Building` durante a primeira janela de propagação; a URL deixou de exibir `Deployment is building` após a propagação.

## Sanitização de placeholders

A validação do deployment `e0a63a0` confirmou que a Home passou a exibir apenas `FAM` e `Força Ativa da Mulher`. Os valores técnicos `<CNPJ_REAL_DA_FAM>`, `<LOGRADOURO>`, `<EMAIL_INSTITUCIONAL>`, `<TELEFONE>` e `<WHATSAPP>` não são mais renderizados. O filtro foi aplicado tanto ao nome institucional quanto aos campos de endereço, contato, redes sociais e documento, sem remover os registros do banco.

Commit enviado: `e0a63a0` — `fix(fam): hide institutional placeholders publicly`.

## Correção dos cartões de boas-vindas

A primeira remoção havia retirado o cartão original de preferências de navegação, embora o pedido se referisse ao novo cartão institucional `AccessibilityOnboarding`, com o texto `Seja muito bem-vindo(a)!`. A montagem do layout foi corrigida: `NavigationPreferencesPrompt` voltou a ser exibido na Home, enquanto `AccessibilityOnboarding` deixou de ser montado globalmente. A implementação foi validada com TypeScript.

Commit enviado: `888d971` — `fix(fam): keep navigation preferences card only`.

Na URL `https://forcaativa2027-ui-fam-forca-ativa-6pye8739s-fam-0cef.vercel.app/`, a validação confirmou a presença exclusiva de `Personalização — Configure sua navegação` e a ausência de `Seja muito bem-vindo(a)!`. As preferências locais continuam preservadas; apenas o cartão duplicado foi removido.
