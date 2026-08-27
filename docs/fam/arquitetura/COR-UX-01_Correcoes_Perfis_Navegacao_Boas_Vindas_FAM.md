# COR-UX-01 --- Correções de Perfis, Navegação e Card de Boas-vindas da Plataforma FAM

**Natureza:** Correção funcional e padronização de UX\
**Prioridade:** Alta\
**Escopo:** Perfis de acesso, Análise de Risco, navegação e
personalização da experiência\
**Objetivo:** Corrigir referências herdadas de outra plataforma e
padronizar comportamentos da interface FAM.

------------------------------------------------------------------------

# 1. OBJETIVO GERAL

Realizar três correções principais na Plataforma FAM:

1.  remover definitivamente referências ao perfil eclesiástico
    `Apóstolo`;
2.  padronizar o botão de retorno da aba **Análise de Risco**;
3.  melhorar o comportamento do card **"Boas-vindas à FAM ---
    Personalize sua experiência"**, permitindo ocultação permanente
    voluntária e reativação posterior em Configurações.

As alterações deverão respeitar a arquitetura e os componentes
existentes, evitando duplicação de componentes, regras ou sistemas de
preferência.

------------------------------------------------------------------------

# 2. CORREÇÃO DOS PERFIS DE USUÁRIO

O perfil `Apóstolo` pertence à arquitetura de outra plataforma e **não
faz parte da Plataforma FAM**.

Realizar busca global por:

``` text
apostolo
apóstolo
APOSTOLO
APOSTLE
apostle
```

Verificar banco, enums, types, componentes, guards, middleware, menus,
hooks, services, APIs, migrations, políticas, mocks, seeds e testes.

Nenhuma nova implementação da FAM deverá utilizar esse perfil.

------------------------------------------------------------------------

# 3. PERFIS OFICIAIS DA PLATAFORMA FAM

## 3.1 Administrador Geral

Perfil de maior autoridade administrativa da plataforma.

Conta administrativa principal atualmente definida:

``` text
tecnologiaagilize@gmail.com
```

O endereço identifica a conta atualmente designada, mas **a autorização
não deverá depender de e-mail hardcoded no frontend**.

Representar a autoridade por role/permissão, por exemplo:

``` text
GENERAL_ADMIN
```

Pode administrar estrutura global, instituições, configurações,
permissões, usuários administrativos, módulos, políticas, segurança,
auditoria e conteúdos globais.

## 3.2 Administrador da Instituição

Exemplo conceitual:

``` text
INSTITUTION_ADMIN
```

Administra apenas sua instituição, podendo configurar demandas,
funcionalidades, usuários, delegados, conteúdos e recursos conforme
permissões.

Não deverá automaticamente administrar outras instituições.

## 3.3 Usuários Delegados

Exemplo:

``` text
DELEGATED_USER
```

Recebem permissões específicas, como:

``` text
MEDIA_MANAGE
NEWS_MANAGE
POSTS_MANAGE
RADIO_MANAGE
EVENTS_MANAGE
INFO_MANAGE
REPORTS_VIEW
```

Um delegado poderá possuir algumas atribuições sem se tornar
administrador geral ou administrador integral da instituição.

## 3.4 Usuário Comum

Exemplo:

``` text
USER
```

Possui acesso restrito às funções destinadas ao público autorizado.

------------------------------------------------------------------------

# 4. ARQUITETURA DE AUTORIZAÇÃO

Preferir:

``` text
ROLE
+
PERMISSIONS
+
INSTITUTION_SCOPE
```

em vez de concentrar todas as decisões em `if role === ...`.

Conceitualmente:

``` text
Usuário
   │
   ├── Role
   ├── Institution
   └── Permissions[]
```

Caso existam registros históricos com `APOSTOLO`, não excluir usuários
nem converter todos automaticamente para Administrador Geral. A nova
classificação deverá refletir a função real de cada conta.

------------------------------------------------------------------------

# 5. CORREÇÃO DO BOTÃO DA ABA ANÁLISE DE RISCO

O botão de retorno da aba **Análise de Risco** deverá seguir exatamente
o padrão das demais abas, correspondente à referência visual `voltar1`,
substituindo o padrão divergente de `voltar2`.

Texto:

> **Voltar à página anterior**

Reutilizar o mesmo componente existente, preservando:

-   ícone;
-   tipografia;
-   espaçamento;
-   altura;
-   borda;
-   hover;
-   focus;
-   comportamento mobile;
-   acessibilidade.

Não criar um segundo botão apenas visualmente semelhante.

Exemplo conceitual:

``` tsx
<BackButton />
```

Se ainda não existir componente compartilhado, extrair o padrão atual
para um componente reutilizável.

A ação deverá representar retorno à página anterior, preferencialmente
utilizando o histórico da aplicação quando apropriado, com fallback
seguro.

Adicionar label acessível equivalente a:

``` text
aria-label="Voltar à página anterior"
```

------------------------------------------------------------------------

# 6. CARD "BOAS-VINDAS À FAM --- PERSONALIZE SUA EXPERIÊNCIA"

O card deverá continuar existindo, mas com comportamento controlável
pelo usuário.

## 6.1 Onde pode aparecer

Prioritariamente na **Página Inicial / Dashboard**, conforme as regras
de onboarding.

## 6.2 Onde não pode aparecer

O card **não deverá aparecer dentro da aba Análise de Risco**,
independentemente da preferência do usuário.

A experiência do Mapa/Análise de Risco não deverá ser interrompida pelo
onboarding geral.

------------------------------------------------------------------------

# 7. NOVA OPÇÃO "NÃO MOSTRAR NOVAMENTE"

Adicionar ao card:

``` text
☐ Não mostrar novamente
```

Ao selecionar a opção e fechar/confirmar o card, persistir preferência
equivalente a:

``` text
show_welcome_card = false
```

A partir daí o card não deverá reaparecer automaticamente em novos
acessos.

------------------------------------------------------------------------

# 8. PERSISTÊNCIA

Não utilizar exclusivamente `sessionStorage`.

Evitar depender apenas de `localStorage` caso a aplicação já possua
preferências persistentes vinculadas à conta.

Preferir o sistema de preferências existente.

Exemplo conceitual:

``` json
{
  "ui": {
    "show_welcome_card": false
  }
}
```

A preferência deverá acompanhar a conta quando a arquitetura atual
permitir.

------------------------------------------------------------------------

# 9. REATIVAÇÃO EM CONFIGURAÇÕES

Mesmo após selecionar **Não mostrar novamente**, o usuário deverá poder
reativar o card.

Em:

**Configurações → Personalização**

adicionar ou reutilizar controle equivalente a:

``` text
[ ] Exibir card de boas-vindas e personalização
```

ou:

``` text
Mostrar novamente o guia de personalização
```

Ao ativar:

``` text
show_welcome_card = true
```

O card poderá voltar a aparecer no Dashboard.

Essa preferência controla apenas a exibição automática do card e **não
desativa tema, fonte, acessibilidade ou outras configurações de
personalização**.

------------------------------------------------------------------------

# 10. REGRA DE RENDERIZAÇÃO

Conceitualmente:

``` text
SE route == ANALISE_DE_RISCO
    NÃO EXIBIR

SENÃO SE userPreference.showWelcomeCard == false
    NÃO EXIBIR

SENÃO
    EXIBIR CONFORME REGRA DE ONBOARDING
```

Centralizar essa lógica no componente ou gerenciador de onboarding. Não
espalhar condições de rota por diversas páginas.

Exemplo conceitual:

``` tsx
<WelcomePersonalizationCard />
```

------------------------------------------------------------------------

# 11. FLUXO ESPERADO

``` text
LOGIN
 ↓
DASHBOARD
 ↓
WELCOME CARD
 ↓
usuário personaliza
 ↓
marca "Não mostrar novamente"
 ↓
preferência salva
 ↓
próximos acessos
 ↓
card não aparece
```

Reativação:

``` text
CONFIGURAÇÕES
 ↓
PERSONALIZAÇÃO
 ↓
"Mostrar novamente card de boas-vindas"
 ↓
ativar
 ↓
preferência atualizada
 ↓
DASHBOARD
 ↓
card pode aparecer novamente
```

Na Análise de Risco:

``` text
ANÁLISE DE RISCO
 ↓
WELCOME CARD = OFF
```

sempre.

------------------------------------------------------------------------

# 12. TESTES --- PERFIS

-   **TEST-ROLE-001:** busca global por `APOSTOLO` não encontra
    utilização funcional remanescente.
-   **TEST-ROLE-002:** Administrador Geral possui permissões globais
    previstas.
-   **TEST-ROLE-003:** Administrador da Instituição não acessa
    instituição diferente.
-   **TEST-ROLE-004:** Delegado acessa somente funcionalidades
    delegadas.
-   **TEST-ROLE-005:** Usuário comum não acessa funcionalidades
    administrativas.

------------------------------------------------------------------------

# 13. TESTES --- BOTÃO VOLTAR

-   **TEST-UX-001:** Análise de Risco apresenta "Voltar à página
    anterior".
-   **TEST-UX-002:** utiliza o mesmo componente das demais abas.
-   **TEST-UX-003:** validar mouse, touch, teclado, foco e mobile.

------------------------------------------------------------------------

# 14. TESTES --- CARD

-   **TEST-WELCOME-001:** usuário sem preferência pode receber o card no
    Dashboard.
-   **TEST-WELCOME-002:** "Não mostrar novamente" persiste a
    preferência.
-   **TEST-WELCOME-003:** após logout/login, o card continua oculto.
-   **TEST-WELCOME-004:** Configurações → Personalização permite
    reativá-lo.
-   **TEST-WELCOME-005:** mesmo com
    `showWelcomePersonalizationCard = true`, o card não aparece em
    Análise de Risco.
-   **TEST-WELCOME-006:** tema, fonte e acessibilidade continuam
    funcionando independentemente da ocultação do card.

------------------------------------------------------------------------

# 15. CRITÉRIOS DE ACEITE

-   [ ] `Apóstolo` não existe mais como perfil funcional da FAM;
-   [ ] Administrador Geral está corretamente representado;
-   [ ] Administrador da Instituição possui escopo institucional;
-   [ ] usuários delegados funcionam por atribuições/permissões;
-   [ ] usuário comum permanece com acesso restrito;
-   [ ] autorização crítica não depende somente de e-mail hardcoded no
    frontend;
-   [ ] botão de voltar da Análise de Risco utiliza o componente padrão;
-   [ ] texto é "Voltar à página anterior";
-   [ ] Welcome Card possui "Não mostrar novamente";
-   [ ] preferência é persistente;
-   [ ] card não aparece na Análise de Risco;
-   [ ] card pode ser reativado em Configurações;
-   [ ] personalizações existentes continuam funcionando;
-   [ ] comportamento é validado em desktop e mobile.

------------------------------------------------------------------------

# 16. ORIENTAÇÃO FINAL AO DESENVOLVEDOR

Antes de implementar:

1.  localizar o modelo atual de usuários;
2.  localizar roles e permissões existentes;
3.  localizar o sistema atual de preferências;
4.  localizar o componente padrão do botão Voltar;
5.  localizar o componente atual do Welcome Card;
6.  localizar as Configurações de personalização;
7.  adaptar o que já existe;
8.  criar somente o que estiver realmente ausente.

> **Corrigir, padronizar e reutilizar --- não reconstruir.**

------------------------------------------------------------------------

# RESUMO EXECUTIVO

## Perfis

Remover:

``` text
APOSTOLO
```

Modelo FAM:

``` text
Administrador Geral
Administrador da Instituição
Usuário Delegado
Usuário Comum
```

Preferencialmente:

``` text
ROLE + PERMISSIONS + INSTITUTION_SCOPE
```

## Análise de Risco

Usar o mesmo botão:

> **Voltar à página anterior**

das demais abas.

## Boas-vindas

Adicionar:

> **Não mostrar novamente**

Persistir a preferência.

Não apresentar o card na **Análise de Risco**.

Permitir reativação em:

> **Configurações → Personalização**

sem interferir nas demais configurações da experiência.
