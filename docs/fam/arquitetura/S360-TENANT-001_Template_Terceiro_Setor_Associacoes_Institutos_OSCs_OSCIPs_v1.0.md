# S360-TENANT-001 — Template Terceiro Setor
## Associações, Institutos, OSCs, OSCIPs, Projetos Sociais e Organizações Parceiras

**Plataforma:** Servo360  
**Documento:** S360-TENANT-001  
**Versão:** 1.0  
**Status:** Baseline funcional e técnico para implementação  
**Perfil inicial de referência:** FAM – Força Ativa da Mulher  
**Escopo:** parametrização visual, menus, módulos, comunicação, acompanhamento, voluntariado, parceiros, doações, Academy, administração e experiência pública/autenticada

---

# 1. Objetivo

Este caderno define como o Servo360 deverá ser organizado para atender associações, institutos, OSCs, OSCIPs, organizações do terceiro setor, fundações, projetos sociais, organizações comunitárias e outras entidades parceiras.

A diretriz é **não criar uma segunda plataforma**. O Servo360 continuará sendo o núcleo comum e cada organização receberá identidade, branding, módulos, menus, labels, permissões, conteúdos e configurações próprias.

O primeiro tenant de referência deste perfil será:

```text
FAM – Força Ativa da Mulher
```

---

# 2. Princípio central

```text
SERVO360
   ↓
ADMINISTRADOR GERAL / MASTER
   ↓
TENANT
   ↓
TIPO DA ORGANIZAÇÃO
   ↓
TEMPLATE FUNCIONAL
   ↓
CONFIGURAÇÃO
```

Exemplo:

```text
Plataforma: Servo360
Tenant: FAM – Força Ativa da Mulher
Tipo: third_sector
Template: THIRD_SECTOR_DEFAULT
```

---

# 3. Administrador Geral / Master

O Administrador Geral será o responsável pela configuração estrutural da organização. Esse perfil pertence à camada da plataforma, e não ao tenant.

Responsabilidades:

- cadastrar tenant;
- definir nome e nome curto;
- subir logos;
- selecionar tema;
- cadastrar contatos;
- configurar módulos;
- ocultar módulos;
- renomear módulos;
- ordenar menus;
- configurar ícones;
- cadastrar administrador local;
- bloquear ou ativar recursos;
- definir permissões de customização;
- auditar alterações.

---

# 4. Separação plataforma × tenant

Nunca hardcodar `CEC Family`, `CEC Manaus`, `FAM`, `Instituto X` ou `Associação Y` no código funcional.

Preferir:

```text
platform.name
tenant.display_name
tenant.short_name
tenant.logo
tenant.labels
tenant.modules
tenant.menus
```

---

# 5. Identidade da FAM

```text
platform_name: Servo360
tenant_display_name: FAM – Força Ativa da Mulher
tenant_short_name: FAM
tenant_type: third_sector
tenant_template: THIRD_SECTOR_DEFAULT
```

Onde hoje houver referências fixas a `CEC Family`, `CEC Manaus` ou `CEC Manaus – Comunidade Evangélica Cristã`, a experiência FAM deverá ser resolvida pela configuração do tenant.

---

# 6. Branding configurável

Campos mínimos:

```text
display_name
short_name
legal_name
logo_primary
logo_light
logo_dark
favicon
app_icon
primary_color
secondary_color
accent_color
login_image
welcome_image
instagram
whatsapp
phone
email
website
address
cnpj
pix
```

---

# 7. Usuário não logado — Home pública

## 7.1 Próximos Cultos → Próximos Eventos

Alterar para:

```text
Próximos Eventos
```

CTA:

```text
Ver todos os eventos
```

A alteração deve refletir o domínio de Eventos, não apenas uma troca visual de texto.

---

# 8. Notícias

A página de Notícias deverá se aproximar de um jornal online.

Categorias iniciais FAM:

```text
Todas
FAM
Projetos
Ações Sociais
Institucional
Parceiros
```

As categorias devem ser parametrizáveis pelo administrador.

## Card de notícia

```text
┌──────────────────────────────────┐
│ [ FOTO OU VÍDEO ]                │
│                                  │
│ Título da notícia                │
│                                  │
│ Resumo                           │
│                                  │
│ Data • Autor                     │
│ Fonte                            │
│                                  │
│ [ Ver mais → ]                   │
└──────────────────────────────────┘
```

Campos mínimos:

```text
title
subtitle
summary
body
image
video_url
author
source
published_at
category
status
```

Autor, data e fonte devem ser obrigatórios.

Ao clicar em `Ver mais`, mostrar título, subtítulo, imagem, autor, data, fonte, texto completo, galeria opcional, vídeo opcional, links e compartilhamento.

Vídeos externos devem usar estrutura neutra:

```text
media_type
media_url
provider
embed_url
```

---

# 9. Remoções públicas para FAM

Desabilitar no template FAM:

```text
CEC Manaus – Comunidade
Cultos
Quero um Life Group
Quero Discipulado
```

Esses recursos não serão apagados globalmente.

---

# 10. Rádio Web

Manter Rádio Web. As categorias deixam de ser rígidas.

O Admin poderá criar e alterar categorias como:

```text
Todos
Música
Notícias
Entrevistas
Direitos da Mulher
Projetos
Informação
Especial
```

Estrutura conceitual:

```text
radio_categories
├── tenant_id
├── name
├── slug
├── order
├── enabled
└── metadata
```

---

# 11. Vídeos

Eliminar categoria fixa `Pregação` para o template terceiro setor.

Categorias administráveis:

```text
Projetos
Entrevistas
Palestras
Eventos
Cursos
Institucional
Ações Sociais
```

Modelo conceitual:

```text
video_categories
├── tenant_id
├── name
├── slug
├── order
└── enabled
```

---

# 12. Cultos

Para o template terceiro setor:

```text
Cultos → DESABILITADO
```

Nenhuma rota ou dado deve ser apagado globalmente.

---

# 13. Agenda

Manter Agenda para eventos, reuniões, cursos, ações sociais, campanhas, palestras, capacitações, mutirões e projetos.

---

# 14. Participar

Nova estrutura:

```text
PARTICIPAR

[ Quero ser voluntário ]
[ Quero participar de uma ação ]
[ Conte-nos um pouco sobre você ]
[ Quero ser visitado ]

Já tem conta?
Acesse a área do membro
```

Remover no perfil FAM:

```text
Quero um Life Group
Quero Discipulado
```

---

# 15. Quero ser voluntário

Ao clicar:

```text
Nome
Telefone
WhatsApp
Cidade
Área de interesse

[ Falar pelo WhatsApp ]
```

Número:

```text
tenant.contact.whatsapp
```

Mensagem parametrizável:

```text
Olá! Acessei a plataforma da FAM e gostaria de saber como posso participar como voluntário.
```

---

# 16. Conte-nos um pouco sobre você

Substitui o conceito de `Acompanhamento Pastoral` no tenant FAM.

Abrir formulário de minicurrículo:

```text
Nome
Cidade/UF
Profissão
Formação
Área de atuação
Habilidades
Experiência profissional
Experiência voluntária
Projetos sociais anteriores
Disponibilidade
Áreas em que pode ajudar
Deseja ser contatado?
Observações
```

Esse cadastro poderá alimentar futuramente uma **Central de Talentos e Voluntariado**.

---

# 17. Central de Talentos e Voluntariado

```text
CENTRAL DE TALENTOS
        ↓
VOLUNTÁRIOS
        ↓
EXPERTISE
        ↓
NECESSIDADES DOS PROJETOS
        ↓
MATCHING
```

Áreas de exemplo: advocacia, psicologia, medicina, enfermagem, educação, tecnologia, administração, comunicação, design, logística, assistência social e eventos.

---

# 18. Quero ser visitado

Manter, com label parametrizável:

```text
Quero ser visitado
Solicitar visita
Solicitar atendimento
Solicitar contato
```

---

# 19. Acesso à área do membro

Manter:

```text
Já tem conta?
Acesse a área do membro
```

A URL deve ser resolvida pela configuração/ambiente do tenant.

---

# 20. Fale Conosco

Remover `Pedido de oração` e substituir por:

```text
Preencha seus dados
```

Campos:

```text
Nome
WhatsApp
E-mail
Assunto
Mensagem
```

Botão:

```text
Enviar
```

Adicionar botão responsivo:

```text
[ Falar pelo WhatsApp ]
```

---

# 21. Doação

Exibir dados institucionais:

```text
Razão Social
Nome Fantasia
CNPJ
PIX
Banco
Agência
Conta
Endereço
Telefone
WhatsApp
Instagram
Site
E-mail
```

Exemplo:

```text
FAM – Força Ativa da Mulher
Razão Social: ...
CNPJ: ...
PIX: ...

[ Copiar PIX ]
[ Compartilhar ]
[ Falar com a FAM ]
```

---

# 22. Configuração institucional compartilhada

Os dados institucionais devem vir de uma fonte única, por exemplo:

```text
tenant_organization_profile
```

Campos:

```text
legal_name
display_name
cnpj
pix
address
phone
whatsapp
instagram
website
email
```

Doação, Fale Conosco, footer e outras áreas reutilizam a mesma fonte.

---

# 23. Footer

Remover qualquer texto hardcoded `CEC Manaus – Comunidade Evangélica Cristã` e utilizar:

```text
tenant.display_name
```

---

# 24. Botão Voltar

Todas as páginas acessadas pelo menu inferior deverão possuir:

```text
← Voltar
```

Usar histórico real de navegação, com fallback seguro. Não hardcodar retorno para `/home`.

---

# 25. Usuário logado — menu inferior

Manter as mesmas áreas públicas e acrescentar:

```text
Visão Geral
```

Objetivo: reduzir diferença entre navegação pública e autenticada.

---

# 26. Visão Geral

Substituir `Paz, Admin` por saudação dinâmica:

```text
Bom dia, Maria!
Boa tarde, Maria!
Boa noite, Maria!
```

Usar nome real do usuário + horário local.

---

# 27. Meu Caminho

Alterar:

```text
Discipulado → Acompanhamento
```

Remover no tenant FAM:

```text
Ministério
```

---

# 28. Comunidade → Comunicação

Submenus recomendados:

```text
Notícias
Vídeos
Agenda
Eventos
Rádio Web
Parceiros
```

Remover `Cultos`.

---

# 29. Igreja → Parceiros

Alterar label:

```text
Igreja → Parceiros
```

Cards:

```text
[ LOGO/FOTO ]
Empresa Parceira
Descrição
Benefício / Desconto
[ Ver benefício ]
```

Campos administrativos:

```text
name
logo
description
benefit
discount
coupon
url
whatsapp
address
valid_from
valid_until
conditions
status
```

---

# 30. Header autenticado

No tenant FAM:

```text
CEC FAMILY → FAM – Força Ativa da Mulher
```

Tecnicamente:

```text
tenant.display_name
```

---

# 31. FAM Academy

Para a FAM, exibir:

```text
FAM Academy
```

Cards:

```text
Cursos Online
E-books
Livros
Vídeos
Palestras
Capacitações
Biblioteca
Bíblia
```

A Bíblia permanece disponível neste tenant.

---

# 32. Kids

Manter a funcionalidade. Ao entrar, usar nome do usuário e saudação de Bom dia/Boa tarde/Boa noite.

Manter o comportamento existente relacionado a eventos Kids. O label `Kids` deve continuar parametrizável.

---

# 33. CECmais → FAM Mais

Para FAM:

```text
CECmais → FAM Mais
```

Preferir chave técnica neutra, como `more` ou `benefits`, sem alterar rota desnecessariamente.

---

# 34. Dashboard Admin

No template FAM:

```text
MDA → Acompanhamento
```

Não alterar globalmente para tenants religiosos.

---

# 35. Estrutura Organizacional

Remover no FAM:

```text
Comunidades
Genealogia
Life Groups
```

Estrutura recomendada:

```text
Organização
├── Diretoria
├── Coordenações
├── Equipes
├── Projetos
├── Voluntários
├── Unidades
└── Parceiros
```

---

# 36. Ministério de Crianças

Para FAM:

```text
Ministério de Crianças → Kids
```

---

# 37. Grupo de Evangelismo

Alterar label:

```text
Grupo de Evangelismo → Grupo de Voluntários
```

A chave técnica deve permanecer estável ou ser migrada de forma controlada.

---

# 38. Estrutura MDA → Estrutura de Acompanhamento

```text
Responsável pelo acompanhamento
        ↓
Pessoa acompanhada
        ↓
Caso
        ↓
Resumo
        ↓
Interações
        ↓
Encaminhamentos
        ↓
Status
```

Campos sugeridos:

```text
Pessoa acompanhada
Responsável
Data inicial
Motivo
Resumo
Necessidades
Providências
Próxima ação
Situação
Observações
```

---

# 39. Relatórios Operacionais

No FAM, orientados ao Acompanhamento.

Filtros:

```text
responsável
período
status
tipo de acompanhamento
projeto
pessoa
unidade
```

---

# 40. Central de Conteúdo

Transformar em hub editorial e de comunicação:

```text
CENTRAL DE CONTEÚDO
│
├── Notícias
├── Vídeos
├── Rádio Web
│   ├── Áudios
│   ├── Programas
│   └── Categorias
├── Banners
├── Eventos
├── Agenda
├── FAM Academy
│   ├── Cursos
│   ├── E-books
│   └── Vídeos
├── Parceiros
├── Comunicados
└── Biblioteca de Mídia
```

---

# 41. Biblioteca de Mídia

Uma mídia enviada uma vez poderá ser reutilizada em:

```text
Notícia
Evento
Banner
Rádio
Curso
Parceiro
Vídeo
Campanha
```

Evitar uploads duplicados.

Campos comuns:

```text
title
description
media
category
tags
author
source
published_at
visibility
status
tenant_id
```

---

# 42. Programação

Alterações FAM:

```text
CEC News Vídeos → FAM Vídeos
Momento Generosidade → Doação
CEC Academy → FAM Academy
```

---

# 43. Doação no Admin

Criar:

```text
CONFIGURAÇÃO INSTITUCIONAL E DOAÇÕES
```

Campos:

```text
Nome
Razão Social
CNPJ
Endereço
Telefone
WhatsApp
Instagram
E-mail
Site
PIX
Banco
Agência
Conta
Responsável
Texto institucional
```

---

# 44. Gestão de Recursos

Manter a lógica já existente, retirando dependência de cargos eclesiásticos obrigatórios.

Evitar como papéis padrão:

```text
Pastor
Apóstolo
Supervisor eclesiástico
Líder espiritual
```

Preferir:

```text
Diretor
Coordenador
Gestor
Responsável
Líder de equipe
Voluntário
Colaborador
```

---

# 45. CEC ID → Membro ID

```text
CEC ID → Membro ID
```

Chave técnica recomendada:

```text
member_id
```

---

# 46. Administração de Usuários

Estrutura simplificada:

```text
Usuários
├── Membros
├── Administradores
├── Lideranças
├── Coordenadores
├── Voluntários
├── Colaboradores
└── Permissões
```

---

# 47. Regra de parametrização

Nunca fazer:

```text
if tenant == "FAM":
    label = "Acompanhamento"
```

Preferir:

```text
module_key: discipleship
tenant_label: Acompanhamento
```

Exemplos:

```text
module_key: discipleship
church_label: Discipulado
fam_label: Acompanhamento
```

```text
module_key: academy
church_label: Academy
fam_label: FAM Academy
```

```text
module_key: churches
church_label: Igrejas
fam_label: Parceiros
```

---

# 48. Matriz funcional FAM

| Módulo técnico | Ativo | Label FAM |
|---|---:|---|
| `events` | sim | Eventos |
| `news` | sim | Notícias |
| `radio` | sim | Rádio Web |
| `videos` | sim | Vídeos |
| `services` | não | — |
| `agenda` | sim | Agenda |
| `participation` | sim | Participar |
| `discipleship` | sim | Acompanhamento |
| `life_group` | não | — |
| `ministry` | não | — |
| `partners` | sim | Parceiros |
| `giving` | sim | Doação |
| `academy` | sim | FAM Academy |
| `bible` | sim | Bíblia |
| `kids` | sim | Kids |
| `member_id` | sim | Membro ID |
| `more` | sim | FAM Mais |

---

# 49. Módulos adicionais recomendados

Para terceiro setor:

```text
Projetos
Beneficiários
Voluntariado
Transparência
```

## Projetos
Campos: nome, descrição, objetivo, público atendido, datas, equipe, responsável, parceiros, orçamento, status, indicadores e resultados.

## Beneficiários
Separar conceitualmente `Membro ≠ Beneficiário`. Uma mesma pessoa poderá acumular papéis.

## Voluntariado

```text
Pessoa → Expertise → Disponibilidade → Interesse → Projeto → Match → Convite → Participação
```

## Transparência
Página pública futura com projetos, relatórios, documentos, parcerias, resultados, campanhas e prestação institucional.

---

# 50. Navegação proposta — público

```text
Home
Notícias
Rádio Web
Vídeos
Agenda
Eventos
Participar
Parceiros
Doação
Fale Conosco
Entrar
```

A ordem permanece parametrizável.

---

# 51. Navegação proposta — autenticado

```text
Visão Geral
Notícias
Rádio Web
Vídeos
Agenda
Eventos
Participar
Parceiros
FAM Academy
Kids
FAM Mais
Perfil
```

---

# 52. Administração — menu sugerido

```text
Dashboard
Organização
Usuários
Acompanhamento
Projetos
Voluntariado
Eventos
Agenda
Central de Conteúdo
Rádio Web
FAM Academy
Kids
Parceiros
Doações
Gestão de Recursos
Relatórios
Configurações
```

---

# 53. Permissões

Exemplos:

```text
tenant.branding.update
tenant.menu.update
tenant.labels.update
tenant.modules.configure
tenant.content.manage
tenant.users.manage
tenant.events.manage
tenant.radio.manage
tenant.academy.manage
tenant.partners.manage
tenant.donations.manage
```

O Administrador Geral define o que o admin local poderá alterar.

---

# 54. Entidades conceituais

Avaliar reutilização ou criação de:

```text
tenant_content_categories
radio_categories
video_categories
partners
volunteer_profiles
follow_up_cases
follow_up_entries
projects
beneficiaries
organization_profile
```

Não criar tabelas automaticamente se já houver equivalentes.

---

# 55. Segurança e privacidade

Atenção especial para minicurrículos, acompanhamentos, beneficiários, dados pessoais, contatos e relatórios.

Aplicar:

```text
tenant isolation
role/scope
audit
minimum necessary access
```

O resumo de acompanhamento pode conter dados sensíveis. Deve ter acesso restrito, auditoria, escopo por responsável e regras de retenção.

---

# 56. Responsividade e WhatsApp

Botões de WhatsApp e demais ações devem funcionar em mobile, tablet e desktop e não depender de hover.

Número e mensagem devem ser configuráveis por tenant.

---

# 57. Acessibilidade

Todo template continua subordinado à CT-017.

Validar:

```text
Light
Dark
Fonte Grande
Fonte Extra Grande
Teclado
Focus
Contraste
Reduced Motion
```

---

# 58. Critérios de aceite — público

- Próximos Eventos substitui Próximos Cultos.
- Cultos não aparece.
- Notícias possui formato editorial.
- Fonte, data e autor são apresentados.
- Rádio possui categorias configuráveis.
- Vídeos possui categorias configuráveis.
- Participar possui fluxo de voluntariado.
- Fale Conosco usa WhatsApp configurado.
- Doação usa dados institucionais.
- Todas as páginas possuem retorno apropriado.

---

# 59. Critérios de aceite — autenticado

- menu reaproveita áreas públicas;
- Visão Geral existe;
- saudação usa nome real e horário;
- Discipulado aparece como Acompanhamento;
- Ministério não aparece no tenant FAM;
- Comunidade aparece como Comunicação;
- Parceiros substitui Igrejas;
- FAM Academy está disponível;
- Kids continua funcional;
- FAM Mais substitui CECmais.

---

# 60. Critérios de aceite — Admin

- Dashboard mostra Acompanhamento e não MDA;
- estrutura não exibe Life Group/Genealogia/Comunidades;
- Grupo de Voluntários substitui Evangelismo;
- Estrutura de Acompanhamento funciona;
- Central de Conteúdo centraliza mídia e informação;
- FAM Vídeos substitui CEC News Vídeos;
- Doação possui configuração institucional;
- FAM Academy é administrável;
- Gestão de Recursos não exige cargos eclesiásticos;
- Membro ID substitui CEC ID;
- gestão de usuários está simplificada.

---

# 61. Critérios de aceite — parametrização

- o mesmo código atende igreja e FAM;
- labels variam por tenant;
- módulos variam por tenant;
- menus variam por tenant;
- identidade varia por tenant;
- dados permanecem isolados;
- módulo oculto não apaga dados;
- não existe hardcode específico FAM em componentes comuns.

---

# 62. Backlog recomendado

## Fase 1 — Tenant FAM

```text
branding
labels
menus
módulos
contatos
dados institucionais
```

## Fase 2 — Público

```text
Eventos
Notícias
Rádio
Vídeos
Participar
Fale Conosco
Doação
Botão voltar
```

## Fase 3 — Área autenticada

```text
Visão Geral
Acompanhamento
Comunicação
Parceiros
FAM Academy
Kids
FAM Mais
```

## Fase 4 — Admin

```text
Dashboard
Estrutura
Acompanhamento
Central de Conteúdo
Programação
Recursos
Usuários
```

## Fase 5 — Terceiro setor ampliado

```text
Projetos
Beneficiários
Voluntariado
Transparência
```

---

# 63. Não fazer

```text
NO fork específico FAM
NO remover recursos religiosos globalmente
NO hardcode FAM
NO renomear chaves técnicas
NO duplicar dados institucionais
NO deletar dados por esconder módulo
NO WhatsApp fixo no código
NO categorias rígidas de Rádio/Vídeo
```

---

# 64. Resultado esperado

Para igreja:

```text
Servo360
→ MDA
→ Life Groups
→ Discipulado
→ Cultos
→ Academy
```

Para FAM:

```text
Servo360
→ Acompanhamento
→ Voluntários
→ Projetos
→ Eventos
→ Comunicação
→ Parceiros
→ FAM Academy
→ Kids
→ Rádio Web
```

Mesmo núcleo. Configuração diferente.

---

# 65. Decisões congeladas

**THIRD-001** — FAM será tenant, não fork.  
**THIRD-002** — Template inicial será `THIRD_SECTOR_DEFAULT`.  
**THIRD-003** — Nome e logo serão parametrizados.  
**THIRD-004** — Próximos Cultos vira Próximos Eventos no template.  
**THIRD-005** — Cultos ficará desabilitado.  
**THIRD-006** — Notícias terá formato editorial e fonte/data/autor.  
**THIRD-007** — Categorias da Rádio serão administráveis.  
**THIRD-008** — Categorias de Vídeos serão administráveis.  
**THIRD-009** — Discipulado será exibido como Acompanhamento.  
**THIRD-010** — Life Group ficará desabilitado.  
**THIRD-011** — Igreja será exibido como Parceiros.  
**THIRD-012** — Comunidade será exibido como Comunicação.  
**THIRD-013** — Academy será exibido como FAM Academy.  
**THIRD-014** — CECmais será exibido como FAM Mais.  
**THIRD-015** — CEC ID será exibido como Membro ID.  
**THIRD-016** — Grupo de Evangelismo vira Grupo de Voluntários.  
**THIRD-017** — Central de Conteúdo será hub editorial.  
**THIRD-018** — Dados institucionais terão fonte única.  
**THIRD-019** — WhatsApp será configurável por tenant.  
**THIRD-020** — Terceiro setor poderá evoluir com Projetos, Beneficiários, Voluntariado e Transparência.

---

# 66. Síntese

```text
SERVO360
   ↓
ADMIN MASTER
   ↓
TENANT FAM
   ↓
THIRD_SECTOR_DEFAULT
   ↓
BRANDING
   ↓
LABELS
   ↓
MÓDULOS
   ↓
MENUS
   ↓
EXPERIÊNCIA PÚBLICA
   +
ÁREA DO MEMBRO
   +
ADMIN
```

> **O Servo360 deve adaptar a plataforma à organização, e não obrigar a organização a parecer uma igreja para conseguir usar o sistema.**

---

**S360-TENANT-001 v1.0 — TEMPLATE TERCEIRO SETOR**
