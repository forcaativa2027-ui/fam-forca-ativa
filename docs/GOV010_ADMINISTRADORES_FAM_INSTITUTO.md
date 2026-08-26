# GOV-010 — Administradores do Instituto e da FAM

## Objetivo

A governança administrativa do sistema utiliza o modelo de **delegações granulares**, e não a simples atribuição do papel de negócio `apostolo`. Isso reduz o privilégio excessivo e mantém rastreabilidade sobre quem pode administrar cada módulo.

## Perfis prontos

A migration `GOV010_perfis_administrativos_fam_instituto.sql` cria dois presets na tabela `role_delegations`.

| Perfil | Módulos principais |
|---|---|
| Administrador FAM | Administrativo, usuários, documentação/INFO e supervisão |
| Administrador Instituto | Administrativo, usuários, documentação, financeiro, patrimônio, relatórios e supervisão |

A criação de um preset **não atribui acesso a nenhuma pessoa**. A atribuição deve ser feita pela Ficha do Usuário, com revisão de escopo, nível de confiança, validade e aprovação explícita.

## Conta técnica de bootstrap

O painel de Governança possui o procedimento GOV-002 para provisionar `tecnologiaagilize@gmail.com`. A conta nasce sem privilégios administrativos efetivos e gera uma delegação pendente. Um administrador autorizado precisa aprovar essa delegação na aba **Pendentes**.

O e-mail técnico pode receber o preset **Administrador Instituto** ou **Administrador FAM**, conforme a finalidade aprovada. O sistema não atribui automaticamente o papel amplo `apostolo` ao e-mail técnico. A compatibilidade operacional é obtida pelos módulos delegados, com escopo nacional e trilha de auditoria.

## Procedimento recomendado

1. Execute `GOV010_perfis_administrativos_fam_instituto.sql` no SQL Editor do Supabase.
2. No painel de Governança, provisiona a conta técnica por GOV-002.
3. Aprove a delegação pendente somente após conferir o solicitante e a finalidade.
4. Abra a Ficha do Usuário do administrador e aplique o preset apropriado.
5. Revise os módulos, o nível, o escopo e a data de expiração antes de confirmar.
6. Crie o administrador da FAM como uma conta separada quando a operação institucional exigir segregação de funções.

## Segurança

As credenciais não devem ser inseridas em migrations nem no código-fonte. A senha deve ser definida pelo fluxo de convite/reset do Supabase. A `service_role` permanece exclusivamente server-side. Qualquer necessidade de acesso excepcional deve usar o mecanismo de acesso emergencial com motivo, aprovação e expiração.
