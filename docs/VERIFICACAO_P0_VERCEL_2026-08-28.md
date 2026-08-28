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
