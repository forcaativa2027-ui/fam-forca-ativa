# Resultado da trilha de homologação — 2026-08-27

A consulta remota retornou a trilha `teste-jornada-conhecimento-001`, com título `TESTE — Primeiros passos na Jornada do Conhecimento`, versão `1.0` e status `draft`.

Foram encontradas três etapas ordenadas: posição 1 `Conheça a Jornada`, posição 2 `Explore os temas` e posição 3 `Escolha o próximo passo`. A consulta exibiu `content_key` vazio na área visível porque a tabela resultante foi truncada horizontalmente; é necessário consultar `content_id`/`content_key` isoladamente para confirmar a associação da primeira etapa ao conteúdo de teste.

A trilha permanece corretamente invisível para visitantes enquanto estiver em `draft`.

## Validação da aplicação

O `npm run typecheck` concluiu sem erros. O `npm run test:fam` concluiu com 93 testes aprovados e 3 testes de integração de MFA ignorados por dependerem de ambiente remoto.

O `npm run build` também concluiu com sucesso e incluiu as rotas `/jornada-conhecimento` e `/admin/fam-conhecimento`.

Ao abrir a rota pública localmente, a aplicação apresentou `Application error: a client-side exception has occurred`. A causa identificada no código é a ausência de `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` no ambiente local; o cliente em `src/lib/supabase.ts` lança `Supabase env ausente.` quando essas variáveis não estão disponíveis. O deployment de referência informado também redirecionou para o login da Vercel, e o acesso temporário não pôde ser criado, portanto a validação visual da versão publicada ficou bloqueada por configuração de acesso/ambiente, não por falha de compilação.

## Associação de conteúdo

A consulta específica confirmou que a etapa 1 está associada ao conteúdo `teste-jornada-direitos-001`, ID `bc971828-c44b-408b-8b32-33922f021923`, ainda em status `draft`. As etapas 2 e 3 estão sem `content_id` e sem `content_key`, funcionando apenas como etapas orientativas. Isso é aceitável para a homologação inicial, mas a trilha não poderá ser considerada editorialmente completa até que essas etapas sejam vinculadas a conteúdos aprovados ou sejam marcadas explicitamente como etapas sem conteúdo.

## Configuração Supabase/Vercel

O projeto remoto identificado é `untlbpzafiojirmpogqp`. A área Data API está ativa e expõe os schemas necessários. O painel redirecionou a rota antiga `/settings/api` para a área de integrações; a chave anon ainda precisa ser copiada pela área de conexão/API do projeto, sem utilizar a service-role key no navegador ou na Vercel como variável pública.

## Deployment e painel de fontes — 2026-08-27

O commit `79abfbc` foi implantado com sucesso pela integração do GitHub em dois deployments de produção: `forcaativa2027-ui-fam-forca-ativa-m48ty9f3p-fam-0cef.vercel.app` e `fam-forca-ativa-q54n0u00a-fam-0cef.vercel.app`.

A rota pública `/jornada-conhecimento` carregou sem o erro `Supabase env ausente`, exibindo busca, filtros por tema e a identidade visual FAM.

A rota `/admin/fam-conhecimento` também carregou o painel com os campos de referência de aprovação, próxima revisão e notas. O texto de bloqueio apareceu corretamente quando esses campos estavam vazios. Contudo, a lista administrativa retornou `Não foi possível carregar a curadoria`, indicando que a sessão atual não possui autenticação/permissão suficiente para consultar os conteúdos de curadoria; por isso não foi possível clicar em um conteúdo aprovado e observar o botão `Publicar` em estado disabled. O bloqueio visual está presente no código e depende de um registro em status `approved` para ser observado diretamente.

O painel de fontes foi implementado no código com listagem e cadastro de tipo, título, referência, URL oficial, órgão emissor e data de publicação. O typecheck deve ser executado novamente após esta integração.

## Fontes oficiais preliminares para P7 — 2026-08-27

- Lei nº 11.340/2006 (Lei Maria da Penha), Planalto: https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2006/lei/l11340.htm. A página oficial descreve a criação de mecanismos para coibir e prevenir a violência doméstica e familiar contra a mulher e estabelece medidas de assistência e proteção.
- Ligue 180 — Central de Atendimento à Mulher, Ministério das Mulheres: https://www.gov.br/mulheres/pt-br/ligue180. A fonte informa ligação gratuita, funcionamento 24 horas, orientação sobre leis, direitos e serviços, registro/encaminhamento de denúncias, WhatsApp (61) 9610-0180 e que emergências devem acionar a Polícia Militar pelo 190.
- Denunciar e buscar ajuda a vítimas de violência contra mulheres, Gov.br: https://www.gov.br/pt-br/servicos/denunciar-e-buscar-ajuda-a-vitimas-de-violencia-contra-mulheres. A página informa canais do Ligue 180, acompanhamento de denúncia e referências legais do serviço.
- Decreto nº 48.878/2026, SINJ-DF: https://www.sinj.df.gov.br/sinj/Norma/3fcea62e0d4f4cd9af87bb69da8ca2c4/Decreto_48878_01_07_2026.html. A norma institui o Plano Distrital de Combate à Violência e de Proteção à Mulher (PDCV-MULHER), com vigência indicada de 2025 a 2034 e ciclos bienais de atualização.

Essas fontes foram apenas pesquisadas e não foram cadastradas nem publicadas no Supabase. Qualquer conteúdo derivado deve entrar primeiro como draft e passar por revisão jurídica e aprovação institucional.
