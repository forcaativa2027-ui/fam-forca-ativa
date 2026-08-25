# Auditoria do banco legado CEC para a plataforma FAM

**Status:** auditoria somente leitura concluída em 22 de agosto de 2026.

> Nenhuma tabela, coluna, política RLS ou dado foi apagado durante esta auditoria. A remoção física exige backup, ambiente de homologação, mapeamento de dependências e confirmação explícita.

## 1. Resumo executivo

O banco atual ainda possui uma estrutura ampla herdada do Servo360/CEC. A plataforma FAM já possui um núcleo próprio de atendimento protegido, triagem orientativa e anexos privados nas tabelas `fam_*`, mas o código ainda utiliza campos e tabelas legadas para autenticação, perfil, escopo organizacional, eventos e compatibilidade de dados.

A conclusão principal é que **não é seguro apagar agora as tabelas `churches`, `life_groups`, `ministries` ou os campos `church_id` e `life_group_id`**. Eles aparecem em muitas consultas, políticas RLS, tipos e funções. A limpeza correta deve ocorrer por isolamento progressivo: primeiro retirar a exposição na interface FAM; depois introduzir nomes institucionais de domínio; somente então migrar dependências e, por último, aposentar objetos sem uso comprovado.

## 2. Núcleo FAM já isolado

As migrations `FAM001_atendimento_protecao.sql` e `FAM002_fila_anexos_rls.sql` criam ou complementam os seguintes objetos:

| Grupo | Objetos | Situação |
|---|---|---|
| Atendimento | `fam_attendants`, `fam_conversations`, `fam_messages` | Núcleo próprio FAM; manter. |
| Análise orientativa | `fam_risk_cases`, `fam_risk_answers` | Núcleo próprio FAM; manter. |
| Anexos sensíveis | `fam_risk_attachments` e políticas `fam_storage_*` | Deve permanecer privado; manter e homologar. |
| Status e classificação | `fam_attendant_status`, `fam_conversation_status`, `fam_risk_attention` | Tipos específicos FAM; manter. |
| Segurança de equipe | `fam_is_active_attendant` e políticas de fila | Manter; revisar com testes de duas usuárias e duas atendentes. |

A migration FAM ainda usa `community_id` sem chave estrangeira para o legado, o que reduz o acoplamento imediato, mas também indica que a migração de identidade institucional ainda não foi finalizada.

## 3. Objetos legados identificados

| Grupo legado | Exemplos encontrados | Classificação inicial |
|---|---|---|
| Identidade organizacional | `churches`, `church_info`, `church_giving_info`, `nucleos`, `states`, funções `church_*` | **Compatibilidade crítica.** Não apagar. Deve ser substituído gradualmente por unidades/polos institucionais. |
| Participação antiga | `life_groups`, `lg_*`, `visitor_pipeline`, `members_at_risk_evasion` | **Legado funcional.** Pode ser remodelado para projetos, grupos de voluntariado e acompanhamento, mas possui muitas dependências. |
| Terminologia religiosa | `ministries`, `ministerial_tasks`, `ministry_*`, `pastoral_*`, `discipleship` | **Alta prioridade de isolamento.** Remover da navegação FAM; migrar apenas os dados que tenham finalidade institucional válida. |
| Conteúdo religioso | `sermons`, `daily_words`, `bible_*`, `knowledge_*` e funções relacionadas | **Fora do domínio FAM atual.** Deve ficar inacessível no tenant FAM; remoção física depende de confirmação de que não atende outro tenant. |
| CEC ID e comércio legado | `cec_id_checkins`, `validate_cec_id`, `cec_news_videos`, `cecmais_*` | **Não expor na FAM.** Avaliar aposentadoria por tenant, não exclusão global. |
| Comunicação sensível antiga | `prayer_requests`, `public_prayer_requests`, `visit_requests` | **Substituir por FAM Support.** Não apagar enquanto houver histórico ou integrações ativas. |
| Relatórios MDA | `mda_*`, `relmda_*` | **Legado restrito.** Ocultar e bloquear no tenant FAM; manter para compatibilidade até confirmar inexistência de outros tenants. |

## 4. Chaves e colunas com dependência elevada

A varredura encontrou aproximadamente **1.153 referências a `church_id`**, **433 a `life_group_id`**, **80 a `ministry_id`**, **61 a `community_id`** e **53 a `cec_id`** em código e migrations.

Esses números não significam quantidade de colunas físicas; representam ocorrências textuais em consultas, tipos, políticas, funções e componentes. Por isso, não devem ser tratados como comandos de exclusão automática.

| Campo | Uso atual provável | Ação recomendada |
|---|---|---|
| `church_id` | Escopo de perfil, eventos, RLS e organização | Manter temporariamente; criar camada de nomenclatura FAM e migrar referências por etapas. |
| `life_group_id` | Participação e relatórios legados | Manter para histórico; mapear projetos/grupos FAM apenas quando houver modelo aprovado. |
| `community_id` | Atendimento FAM e conversas | Manter como chave de transição; definir se representará unidade, polo ou região FAM. |
| `ministry_id` | Módulos de ministério e relatórios antigos | Não usar em novas telas FAM; migrar somente registros necessários. |
| `cec_id` | Carteira/check-in legado | A carteira FAM deve receber novo identificador institucional antes de qualquer remoção. |

## 5. Dependências críticas no código

A aplicação ainda consulta diretamente `churches`, `life_groups`, `cec_news_videos`, `cecmais_ofertas`, `sermons`, `prayer_requests`, `public_prayer_requests`, rotinas `relmda_*`, rotinas `mda_*` e funções de validação CEC. Também existem tipos de domínio com `church_id`, `life_group_id` e `cec_id`.

A estratégia aplicada na interface FAM foi de **bloqueio por tenant**, não de exclusão física. O sidebar e o roteador administrativo agora impedem a exposição ou reabertura de módulos religiosos para o tenant FAM, enquanto os objetos continuam disponíveis para eventual compatibilidade de outros tenants.

## 6. Limpeza segura em fases

### Fase A — concluída nesta etapa

Apenas leitura do repositório e das migrations; inventário de objetos; identificação das referências; nenhuma alteração destrutiva no banco.

### Fase B — recomendada antes de qualquer DROP

Criar uma migration institucional não destrutiva com comentários de depreciação, views ou aliases controlados para os conceitos que serão mantidos, políticas de acesso específicas do tenant FAM e uma tabela de mapeamento entre unidade legada e unidade FAM.

### Fase C — migração de domínio

Substituir gradualmente os acessos de interface e serviços que usam `church_id`, `life_group_id`, `ministry_id` e `cec_id`. Os dados históricos devem permanecer consultáveis por administradores autorizados, mas não devem aparecer com nomenclatura religiosa no tenant FAM.

### Fase D — aposentadoria

Somente depois de confirmar, em homologação e produção, que não existem tenants, rotinas, relatórios ou políticas dependentes dos objetos, criar migrations separadas para revogar exposição, arquivar dados e eventualmente remover objetos. Cada remoção deve ser precedida por backup e aceite institucional.

## 7. Verificações SQL recomendadas no Supabase

Executar primeiro como consultas de leitura no SQL Editor:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name ilike any (array['%cec%', '%church%', '%life%', '%mda%', '%minist%', '%pastor%', '%prayer%', '%sermon%', '%bible%'])
order by table_name;
```

```sql
select schemaname, tablename, policyname, roles, cmd
from pg_policies
where schemaname = 'public'
  and (
    tablename ilike any (array['%cec%', '%church%', '%life%', '%mda%', '%minist%', '%pastor%', '%prayer%', '%sermon%', '%bible%'])
    or policyname ilike any (array['%cec%', '%church%', '%life%', '%mda%', '%minist%', '%pastor%', '%prayer%', '%sermon%', '%bible%'])
  )
order by tablename, policyname;
```

```sql
select n.nspname as schema_name,
       p.proname as function_name,
       pg_get_function_identity_arguments(p.oid) as arguments
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname ilike any (array['%cec%', '%church%', '%life%', '%mda%', '%minist%', '%pastor%', '%prayer%', '%sermon%', '%bible%'])
order by p.proname;
```

## 8. Decisão recomendada

**Não executar `DROP TABLE`, `DROP COLUMN`, `DROP FUNCTION` ou renomeações físicas neste momento.** O próximo passo seguro é aprovar o mapa institucional FAM — unidades/polos, projetos, voluntariado, associados, comunicação e atendimento — e criar uma migration de compatibilidade não destrutiva. Depois disso, o código poderá deixar de depender progressivamente dos nomes antigos sem risco de quebrar RLS, eventos, perfis ou histórico.
