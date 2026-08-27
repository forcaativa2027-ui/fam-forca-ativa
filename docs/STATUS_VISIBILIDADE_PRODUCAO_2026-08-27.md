# Status de visibilidade em produção — 2026-08-27

## Fontes verificadas

- Vercel: https://vercel.com/fam-0cef/fam-forca-ativa
- Produção: https://fam-forca-ativa.vercel.app/
- Análise de risco: https://fam-forca-ativa.vercel.app/analise-risco
- Admin de credenciamento: https://fam-forca-ativa.vercel.app/admin/fam-credenciamento

## Evidências

O projeto Vercel `fam-forca-ativa` está conectado ao repositório `https://github.com/forcaativa2027-ui/fam-forca-ativa`. O deployment de produção criado a partir do commit `80699db` (`fix(fam): use organization name in admin branding`) ficou com status `Ready`, duração aproximada de 1m10s, ambiente Production e domínio `fam-forca-ativa.vercel.app`.

A página pública de produção apresenta a marca `FAM · FORÇA ATIVA DA MULHER`, os botões `Falar com a FAM`, `Informação FAM`, `Acolhimento e proteção`, o menu `Notícias`, `Rádio Web`, `FAM Vídeos`, `Agenda`, `Participar`, `Análise de Risco`, `Doação` e `Entrar`.

A rota pública `/analise-risco` apresenta os telefones 180 e 190, `Voltar à página anterior`, `Sair rapidamente`, coleta progressiva, a pergunta de segurança, `Prefiro não responder` e o aviso de que a ferramenta não confirma crime, não produz laudo e não substitui atendimento profissional.

A rota `/admin/fam-credenciamento` redireciona usuários não autenticados para `/entrar?next=/admin/fam-credenciamento`, portanto os painéis administrativos não aparecem na navegação pública. O shell administrativo exige sessão, permissões/delegações e, para conteúdo sensível, MFA.

## Diagnóstico técnico

O componente `AdminSidebar.tsx` usava `myChurch?.short_name`, mas a tabela `churches` verificada anteriormente possui `name`, `slug` e `is_active`; isso explicava o fallback legado `CEC FAMILY`. O commit `80699db` corrigiu o branding para usar `name` e detectar o tenant `fam-samambaia-df`.

A página pública já está FAM-branded em produção. As implementações de governança, credenciamento, auditoria, retenção e catálogo jurídico estão em rotas administrativas ou dependem de migrations remotas; por isso não aparecem como mudanças na página inicial.

## Estado remoto pendente

A aplicação da migration FAM027 no SQL Editor não foi confirmada. O catálogo jurídico e as regras remotas FAM-RULES-1.1 precisam ser conferidos no Supabase. O arquivo de ativação controlada é `supabase/migrations/FAM027_ativacao_catalogo_juridico_aprovado.sql` e não deve ser executado sem aprovação institucional específica.
