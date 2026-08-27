# Documentação FAM

Este diretório reúne a base documental da plataforma FAM — Força Ativa da Mulher, organizada para facilitar desenvolvimento, curadoria, auditoria e implantação.

## Estrutura

| Diretório | Conteúdo |
|---|---|
| `jornada-conhecimento/` | JK-01 a JK-08: arquitetura, taxonomia, conteúdo, busca, curadoria, trilhas, experiência e acessibilidade |
| `governanca/` | JUR, POL-ARQ, OC, AC e matrizes de revisão |
| `backlog/` | Backlogs M04, M05, M06 e M07-B/M07-C/M07-C1 |
| `arquitetura/` | Especificações técnicas, UX, protocolos, implantação e identidade |
| `referencia/` | Índices, matrizes, cadernos mestres e referenciais institucionais |
| `sql/` | Cópias documentais das migrations FAM027 e FAM028 recebidas como anexos |

## Governança documental

Os nomes e versões dos documentos foram preservados. Os arquivos nesta pasta são base documental; uma regra só deve ser implementada depois de passar pelo fluxo de revisão técnica, jurídica e institucional correspondente.

## Atenção às migrations SQL

As cópias em `sql/` são mantidas para referência documental. A FAM028 anexada originalmente contém `CREATE TYPE IF NOT EXISTS`, sintaxe não aceita pelo PostgreSQL, e referencia uma tabela que não existe no banco atual. Para execução, utilize a versão corrigida versionada em `supabase/migrations/FAM028_reparar_credenciamento_auditoria_mfa.sql` na raiz do projeto.

Da mesma forma, a ativação de finalidades jurídicas não deve ocorrer automaticamente. Registros do catálogo devem permanecer inativos até que exista aprovação institucional documentada, com aprovador, referência do parecer/ata, data de vigência e data de revisão.

## Princípio de reutilização

M04–M07 constituem módulos de governança reutilizáveis no Servo360, enquanto JK-01–JK-08 definem a Jornada do Conhecimento. Conteúdos de proteção feminina, bases jurídicas, fontes, contatos e fluxos FAM permanecem específicos do tenant FAM e não devem ser promovidos a defaults globais sem parametrização.
