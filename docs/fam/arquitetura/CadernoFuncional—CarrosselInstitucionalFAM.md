# Caderno Funcional — Carrossel Institucional FAM

**Código:** FAM-UX-002  
**Versão:** 1.0  
**Status:** Especificação para implantação  
**Componente:** Carrossel de banners da página inicial  
**Referência de experiência:** organização visual observada no site da Eudora [1]

## 1. Objetivo do componente

O carrossel institucional será o principal espaço de comunicação visual da página inicial da FAM. Ele deverá destacar projetos, campanhas, eventos, cursos, canais de acolhimento e oportunidades de participação, conduzindo a usuária para uma ação clara.

O componente deve aproveitar a lógica visual de sites de beleza e bem-estar: imagens amplas, mensagens curtas, cores de campanha, indicadores de posição e chamadas de ação. A adaptação para a FAM deve preservar o caráter institucional, social e acolhedor da organização.

> **Regra de comunicação:** cada banner deve comunicar uma mensagem principal e possuir, no máximo, uma ação primária.

## 2. Princípios de experiência

O carrossel deve ser imediatamente compreensível, visualmente agradável e fácil de operar. A usuária precisa identificar rapidamente o tema do banner, entender por que ele é relevante e saber qual ação pode realizar.

O componente não deve funcionar como um mural de avisos com textos longos. Informações detalhadas devem aparecer na página de destino do banner. O carrossel é uma porta de entrada, não o conteúdo completo.

| Princípio | Aplicação |
|---|---|
| Clareza | Um tema principal por banner. |
| Acolhimento | Linguagem humana, direta e respeitosa. |
| Ação | CTA visível e específico. |
| Ritmo | Alternância equilibrada entre campanhas e serviços. |
| Confiança | Uso de imagens autorizadas e informações atualizadas. |
| Legibilidade | Overlay ou painel de contraste sobre imagens. |
| Inclusão | Teclado, leitores de tela, pausa e texto alternativo. |
| Segurança | Mensagens de emergência nunca devem depender apenas do carrossel. |

## 3. Fluxo de navegação da usuária

### 3.1. Entrada na página inicial

Ao acessar a página inicial, a usuária visualiza o primeiro banner publicado e elegível para o seu contexto. O banner deve carregar com título, subtítulo, CTA, imagem ou fundo de campanha e indicador de posição.

A página não deve esperar o carregamento de todos os banners para exibir a primeira comunicação. Quando houver falha de imagem ou de conexão, o componente deve utilizar um fundo de cor e manter título e CTA disponíveis.

```text
Abrir página inicial
→ Carregar primeiro banner elegível
→ Exibir título, texto e CTA
→ Iniciar temporizador, se permitido
→ Usuária lê ou interage
→ Usuária pode clicar, avançar, voltar, pausar ou selecionar slide
→ Registrar impressão e interação
→ Abrir destino do CTA
```

### 3.2. Navegação por avanço automático

O avanço automático deve ocorrer somente quando houver mais de um banner publicado e elegível. O intervalo recomendado é de **6 a 8 segundos**, permitindo leitura do conteúdo.

O temporizador deve ser pausado quando:

- a usuária posicionar o cursor sobre o carrossel;
- qualquer elemento do carrossel receber foco;
- a usuária interagir com setas ou indicadores;
- a página estiver em segundo plano;
- o sistema operacional indicar preferência por movimento reduzido;
- o carrossel estiver em uma largura móvel com leitura mais lenta.

Depois de uma interação manual, o temporizador pode ser reiniciado após alguns segundos, desde que a usuária não esteja com foco ou cursor sobre o componente.

### 3.3. Navegação manual

A usuária deve poder avançar, voltar ou selecionar diretamente qualquer banner elegível.

```text
Seta anterior → banner anterior
Seta próxima  → próximo banner
Indicador     → banner correspondente
Swipe         → banner anterior/próximo em dispositivo touch
Teclado       → Tab, Enter e setas quando aplicável
```

Ao mudar de banner, o conteúdo deve ser atualizado sem recarregar a página. O foco não deve saltar inesperadamente para o topo. Se a mudança ocorrer por teclado, o novo título deve ser anunciado de forma acessível.

### 3.4. Clique no CTA

O CTA deve conduzir a uma página interna, seção da página inicial, formulário, inscrição ou recurso externo previamente autorizado.

| Destino | Comportamento |
|---|---|
| Rota interna FAM | Abrir na mesma aba. |
| Seção da página inicial | Fazer rolagem suave até a seção. |
| Formulário de atendimento | Abrir a página correspondente com contexto preservado. |
| Link externo oficial | Abrir em nova aba apenas quando necessário, com indicação visual. |
| Telefone | Usar `tel:` em dispositivos compatíveis. |
| Emergência | Exibir ação claramente identificada; não ocultar em banner promocional. |

O destino do CTA deve ser validado antes da publicação. Links quebrados devem impedir a publicação ou gerar alerta bloqueante no painel administrativo.

## 4. Estrutura de cada banner

Cada registro de banner deve possuir os seguintes campos:

| Campo | Obrigatório | Regra |
|---|---:|---|
| Título | Sim | Curto, claro e sem excesso de pontuação. |
| Subtítulo | Não | Complementa o título em até poucas linhas. |
| Imagem desktop | Não | Deve ter proporção definida e direitos de uso confirmados. |
| Imagem mobile | Não | Recomendada quando o recorte desktop prejudicar a leitura. |
| Cor de fundo | Sim | Fallback visual e identidade da campanha. |
| Cor do texto | Sim | Deve passar por validação de contraste. |
| Label institucional | Não | Ex.: “FAM · FORÇA ATIVA DA MULHER”. |
| CTA | Não | Quando presente, deve ser único e específico. |
| URL do CTA | Condicional | Obrigatória quando houver CTA. |
| Ordem | Sim | Define a posição padrão. |
| Status | Sim | Rascunho, revisão, agendado, publicado, pausado ou arquivado. |
| Início | Não | Data/hora de início da exibição. |
| Fim | Não | Data/hora de término da exibição. |
| Público | Não | Público geral, beneficiárias, voluntárias ou equipe. |
| Campanha | Não | Agrupa banners para análise. |
| Texto alternativo | Sim quando houver imagem | Descreve a informação relevante da imagem. |

## 5. Regras de negócio

### RN-001 — Elegibilidade

Somente banners com status publicado, dentro do período de validade, pertencentes ao tenant FAM e elegíveis para o público da sessão podem aparecer no carrossel público.

### RN-002 — Ordenação

A ordenação deve respeitar a prioridade definida no painel. Em caso de empate, o banner mais recentemente atualizado aparece depois do banner com maior prioridade. Banners sem prioridade não podem ocupar automaticamente a posição de campanhas prioritárias.

### RN-003 — Período de publicação

Quando houver data de início, o banner não deve aparecer antes desse momento. Quando houver data de fim, deve deixar de aparecer após o encerramento. O sistema deve interpretar datas no fuso horário configurado para a FAM.

### RN-004 — Limite de banners ativos

O sistema deve permitir vários banners publicados, mas recomenda-se manter entre **3 e 6 banners ativos** na página inicial. Quantidades maiores reduzem a chance de cada campanha ser compreendida e tornam a navegação cansativa.

### RN-005 — Um CTA principal

Cada banner pode possuir somente um CTA primário. Links secundários devem ser evitados no próprio banner. Se houver necessidade de mais opções, elas devem estar na página de destino.

### RN-006 — Destino válido

Um banner com CTA não pode ser publicado sem destino válido. O painel deve aceitar rotas internas, âncoras permitidas e domínios externos previamente autorizados.

### RN-007 — Conteúdo de emergência

Mensagens de risco, emergência ou proteção não devem depender exclusivamente do carrossel. O site deve manter acesso permanente aos canais de apoio em menu, rodapé ou área fixa apropriada.

### RN-008 — Análise de Risco

O banner de Análise de Risco deve utilizar linguagem orientativa. É proibido utilizar expressões como “confirme se houve crime”, “descubra se é culpada” ou “resultado definitivo”. O CTA deve conduzir para orientação inicial e atendimento humano.

### RN-009 — Fale Conosco

O banner de Fale Conosco deve informar que o contato é com a equipe da FAM e que a disponibilidade real depende da escala de atendimento. Não deve prometer resposta imediata caso não haja atendente conectada.

### RN-010 — Imagens institucionais

Imagens de mulheres, crianças, famílias, atendimentos ou beneficiárias só podem ser utilizadas quando houver autorização institucional adequada. O sistema deve permitir registrar a origem e a situação de autorização do asset.

### RN-011 — Identidade visual

A paleta do banner pode variar entre rosa, pink, coral, lilás, roxo, pêssego e dourado. As cores não podem comprometer a leitura do título, subtítulo ou CTA.

### RN-012 — Dourado

O dourado deve ser utilizado em detalhes, indicadores, linhas, molduras, selos e pequenos elementos de destaque. Não deve ser aplicado em grandes áreas com texto pequeno sem validação de contraste.

### RN-013 — Conteúdo expirado

Banner expirado deve deixar de ser elegível automaticamente. O registro deve permanecer arquivado para histórico, métricas e eventual reutilização controlada.

### RN-014 — Pausa manual

A equipe autorizada pode pausar um banner publicado sem excluí-lo. A pausa deve registrar usuário, data, motivo opcional e estado anterior.

### RN-015 — Conflito de campanhas

Quando duas campanhas tiverem o mesmo período e prioridade, o painel deve alertar a administradora. O sistema pode permitir a publicação, mas deve indicar o conflito antes da confirmação.

### RN-016 — Fallback

Se não houver banner elegível, a página deve apresentar um hero institucional padrão da FAM com fundo ameixa/roxo, logo, mensagem de acolhimento e CTA institucional.

### RN-017 — Falha de imagem

Se a imagem falhar, o banner deve preservar fundo, texto e CTA. A falha deve ser registrada para manutenção, mas não pode deixar texto ilegível ou uma área vazia sem contexto.

### RN-018 — Alteração posterior

A edição de um banner publicado deve criar registro de auditoria. Alterações em CTA, imagem, datas ou texto devem atualizar a data de revisão e, quando configurado, enviar o banner novamente para revisão.

## 6. Fluxo administrativo

### 6.1. Criação e publicação

```text
Administradora
→ Abrir Banners da Página Inicial
→ Criar banner
→ Definir campanha e público
→ Inserir título, texto, imagem, cores e CTA
→ Validar contraste e destino
→ Salvar como rascunho
→ Enviar para revisão
→ Aprovar
→ Definir período e prioridade
→ Publicar
→ Monitorar impressões e cliques
```

### 6.2. Estados do banner

```text
DRAFT
IN_REVIEW
APPROVED
SCHEDULED
PUBLISHED
PAUSED
EXPIRED
ARCHIVED
REJECTED
```

| Estado | Pode aparecer publicamente? | Ação permitida |
|---|---:|---|
| Rascunho | Não | Editar e enviar para revisão. |
| Em revisão | Não | Revisar, aprovar ou rejeitar. |
| Aprovado | Não necessariamente | Agendar ou publicar. |
| Agendado | Somente na data | Editar antes do início, se permitido. |
| Publicado | Sim | Pausar, editar com auditoria ou arquivar. |
| Pausado | Não | Reativar ou arquivar. |
| Expirado | Não | Duplicar, editar e programar novamente. |
| Arquivado | Não | Consultar histórico ou duplicar. |
| Rejeitado | Não | Corrigir e reenviar para revisão. |

### 6.3. Perfis administrativos

| Perfil | Criar | Editar | Aprovar | Publicar | Métricas |
|---|---:|---:|---:|---:|---:|
| Conteúdo | Sim | Próprios/atribuídos | Não | Não | Sim, agregadas |
| Comunicação | Sim | Todos | Sim | Sim | Sim |
| Supervisão | Sim | Todos | Sim | Sim | Sim |
| Administradora técnica | Configuração | Configuração | Não necessariamente | Não necessariamente | Sim, sem conteúdo sensível |

## 7. Modelo de dados sugerido

```text
fam_home_banners
├── id
├── tenant_id
├── title
├── subtitle
├── institutional_label
├── desktop_image_url
├── mobile_image_url
├── image_alt
├── background_color
├── text_color
├── cta_label
├── cta_url
├── cta_kind
├── priority
├── audience
├── campaign_key
├── status
├── starts_at
├── ends_at
├── created_by
├── approved_by
├── published_at
├── paused_at
├── archived_at
├── created_at
└── updated_at
```

Para métricas, recomenda-se separar eventos de visualização e interação:

```text
fam_banner_events
├── id
├── tenant_id
├── banner_id
├── event_type
├── session_hash
├── device_type
├── occurred_at
└── metadata_minimal
```

Os eventos não devem armazenar conteúdo de atendimento, nomes, telefone, e-mail ou qualquer material sensível. Para métricas públicas, utilizar dados agregados e, quando possível, identificadores de sessão não reversíveis.

## 8. Regras de segmentação

A segmentação deve ser simples no primeiro lançamento. O padrão é exibir o banner para o público geral. Segmentações mais específicas devem ser ativadas somente quando houver necessidade institucional clara.

| Segmentação | Exemplo |
|---|---|
| Público geral | Campanhas, eventos e projetos públicos. |
| Usuária autenticada | Cursos, inscrições e recursos da área da beneficiária. |
| Beneficiária | Acompanhamento, capacitação e serviços direcionados. |
| Voluntária | Oportunidades de participação e escala. |
| Equipe interna | Comunicados operacionais em área autenticada. |

Não utilizar dados sensíveis para escolher banners sem avaliação específica. O carrossel público não deve inferir situação de violência, saúde, renda ou vulnerabilidade a partir de comportamento da usuária.

## 9. Acessibilidade

O carrossel deve cumprir as seguintes regras funcionais:

1. Todas as setas devem possuir rótulos como “Banner anterior” e “Próximo banner”.
2. Cada indicador deve informar a posição, por exemplo, “Banner 2 de 5”.
3. O banner ativo deve possuir indicação acessível de estado.
4. O carrossel deve funcionar sem mouse.
5. O movimento automático deve parar ao receber foco.
6. Deve existir controle de pausa visível quando houver avanço automático.
7. O texto deve continuar legível com zoom e fonte ampliada.
8. O conteúdo não deve depender apenas da imagem.
9. Usuários com preferência por movimento reduzido devem receber avanço manual ou transição sem animação.
10. O contraste deve ser validado para título, descrição, CTA e indicadores.

## 10. Métricas recomendadas

As métricas devem ajudar a FAM a entender quais comunicações são úteis, sem transformar a navegação em rastreamento invasivo.

| Métrica | Finalidade |
|---|---|
| Impressões | Saber quantas vezes o banner foi exibido. |
| Cliques no CTA | Medir interesse na ação proposta. |
| Taxa de interação | Comparar banners proporcionalmente às impressões. |
| Avanço manual | Identificar se o conteúdo está sendo ignorado. |
| Pausa | Entender se a usuária precisa de mais tempo de leitura. |
| Conversão de destino | Medir chegada à página alvo, quando permitido. |
| Erro de imagem/link | Detectar falhas de manutenção. |

Para Fale Conosco e Análise de Risco, recomenda-se priorizar métricas agregadas de acesso ao serviço, início de fluxo e encaminhamento, sem criar ranking de usuárias ou expor conteúdo de casos.

## 11. Conteúdo inicial recomendado

### Banner 1 — Acolhimento

```text
Selo: FAM · FORÇA ATIVA DA MULHER
Título: Você não precisa enfrentar tudo sozinha
Texto: Encontre acolhimento e converse com nossa equipe.
CTA: Fale Conosco
Fundo: coral + rosa suave
```

### Banner 2 — Orientação

```text
Selo: FAM · ORIENTAÇÃO E PROTEÇÃO
Título: Precisa entender melhor uma situação?
Texto: Faça uma orientação inicial e veja caminhos seguros para buscar ajuda.
CTA: Análise de Risco
Fundo: lilás + roxo
```

### Banner 3 — Capacitação

```text
Selo: FAM · FORMAÇÃO
Título: Novas oportunidades começam com conhecimento
Texto: Conheça nossos cursos, oficinas e capacitações.
CTA: Ver capacitações
Fundo: pêssego + champanhe
```

### Banner 4 — Projetos sociais

```text
Selo: FAM · PROJETOS
Título: Transformando histórias com ações reais
Texto: Conheça os projetos que fortalecem mulheres e famílias.
CTA: Conhecer projetos
Fundo: pink + marfim
```

## 12. Critérios de aceite

O componente será considerado pronto para homologação quando:

1. Exibir somente banners elegíveis e publicados.
2. Respeitar ordem, prioridade, datas e público configurados.
3. Permitir navegação por setas, indicadores, toque e teclado.
4. Pausar o avanço automático durante interação e foco.
5. Exibir fallback quando não houver banners ou quando a imagem falhar.
6. Validar título, CTA, destino, imagem e contraste antes da publicação.
7. Manter menus e textos legíveis em fundos claros e escuros.
8. Registrar auditoria de publicação, pausa, edição e arquivamento.
9. Não exibir informação sensível em métricas, URLs ou notificações.
10. Apresentar Fale Conosco e Análise de Risco com linguagem segura e não conclusiva.
11. Funcionar corretamente em desktop, tablet e celular.
12. Respeitar o modo de movimento reduzido e as configurações de acessibilidade.
13. Permitir que a equipe publique campanhas sem alterar código-fonte.
14. Manter o carrossel visualmente alinhado à paleta FAM: roxo, ameixa, rosa, coral, lilás, pêssego e dourado.

## 13. Decisão de implantação

O carrossel deve ser implementado como um componente administrável e orientado por dados. Textos, imagens, CTA, ordem, datas e cores não devem ficar hardcoded no frontend.

A primeira versão deve priorizar uma estrutura simples e confiável: banners públicos, programação, ordenação, CTA, fallback, métricas básicas e acessibilidade. Personalização avançada, múltiplas campanhas simultâneas e segmentação complexa podem ser adicionadas depois que a FAM validar o fluxo de publicação.

> **Resultado esperado:** uma página inicial leve e clara, com estrutura semelhante à experiência de sites de beleza, mas com conteúdo institucional, acolhedor e socialmente responsável da FAM.

## Referência

[1]: https://www.eudora.com.br/ — Referência visual utilizada para analisar a organização de cabeçalho, menus, submenus, carrossel, banners, cards e uso combinado de roxo, rosa, branco e dourado.
