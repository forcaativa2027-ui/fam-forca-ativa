# Pacote de upload — FAM

Este pacote contém o projeto da plataforma FAM — Força Ativa da Mulher.

## Upload para o GitHub

Envie a estrutura do projeto mantendo as pastas `src/`, `public/`, `supabase/`, `docs/` e os arquivos de configuração da raiz, como `package.json`, `package-lock.json`, `next.config.*`, `tailwind.config.*`, `tsconfig.json` e `.gitignore`.

Não envie `node_modules/`, `.next/`, `.git/`, arquivos `.env`, chaves privadas, tokens ou connection strings. Depois do upload, a Vercel deve instalar as dependências novamente usando o `package.json`.

## Relatório de banco

O arquivo `docs/FAM_AUDITORIA_BANCO_LEGADO.md` contém a varredura de tabelas, chaves, migrations e políticas legadas. Nenhuma alteração destrutiva no Supabase está autorizada apenas com base neste relatório.

## Estado das migrations FAM

As migrations próprias estão em `supabase/migrations/` e incluem `FAM001_atendimento_protecao.sql` e `FAM002_fila_anexos_rls.sql`. A aplicação deve ser feita somente no Supabase correto, em ordem e preferencialmente após backup e homologação.
