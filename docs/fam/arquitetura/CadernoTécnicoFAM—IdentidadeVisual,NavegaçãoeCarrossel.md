# Caderno Técnico FAM — Identidade Visual, Navegação e Carrossel

**Código:** FAM-UX-001  
**Versão:** 1.0  
**Status:** Base para implantação  
**Instituição:** Instituto Força Ativa da Mulher — FAM  
**Plataforma:** Servo360 / FAM  
**Referência visual:** experiência de navegação e campanhas observada no site da Eudora [1]

---

## 1. Objetivo

Este caderno define a direção visual para implantação da plataforma FAM, com foco na atualização da paleta de cores, menus, submenus, cabeçalho, navegação inferior e carrossel da página inicial.

A proposta deve produzir uma experiência feminina, alegre, elegante e contemporânea, inspirada no universo visual de marcas de beleza, sem transformar a plataforma em uma cópia comercial. A identidade deve continuar transmitindo confiança, acolhimento, força institucional e facilidade de navegação.

## 2. Decisão visual principal

A FAM não utilizará azul como cor predominante. A base visual será composta por **ameixa, roxo, pink, coral, lilás, pêssego, branco quente e dourado**.

O dourado será usado como elemento de sofisticação e destaque. Não deverá ocupar grandes áreas da interface nem ser utilizado em excesso.

> **Diretriz central:** fundo claro para leveza; ameixa e roxo para estrutura; rosa, pink, coral e lilás para energia; dourado para sofisticação e destaque.

## 3. Paleta oficial para implantação

### 3.1. Cores estruturais

| Token | Nome | Hexadecimal | Uso |
|---|---|---:|---|
| `fam-plum` | Ameixa Profundo | `#4A173F` | Barras de menu, rodapé, cabeçalhos e áreas estruturais. |
| `fam-purple` | Roxo FAM | `#6D2C68` | Submenus, degradês, seções institucionais e estados de destaque. |
| `fam-night` | Ameixa Noturno | `#32132D` | Overlays, rodapés profundos e fundos de alto contraste. |
| `fam-ink` | Texto Ameixa | `#321B2F` | Títulos, textos principais e informações de alta prioridade. |
| `fam-muted` | Cinza Ameixa | `#6F596B` | Textos secundários, descrições e metadados. |
| `fam-background` | Marfim Rosado | `#FFFCFD` | Fundo geral da aplicação. |
| `fam-surface` | Branco | `#FFFFFF` | Cards, formulários e áreas de leitura. |
| `fam-border` | Lavanda Cinza | `#E6DDE7` | Bordas, divisórias e campos. |

### 3.2. Cores alegres e femininas

| Token | Nome | Hexadecimal | Uso |
|---|---|---:|---|
| `fam-pink` | Pink FAM | `#D93683` | Botões principais, chamadas de ação e links importantes. |
| `fam-rose` | Rosa Vivo | `#F05A9D` | Item ativo, ícones, indicadores e badges. |
| `fam-coral` | Coral Acolhimento | `#F47C83` | Campanhas, banners de acolhimento e chamadas humanas. |
| `fam-peach` | Pêssego | `#F6B38A` | Cards sociais, projetos e áreas de destaque leve. |
| `fam-lilac` | Lilás FAM | `#B58AD9` | Cursos, capacitações, formação e conteúdos. |
| `fam-purple-light` | Lilás Claro | `#EFE4FA` | Fundos de módulos, filtros e blocos informativos. |
| `fam-soft-pink` | Rosa Suave | `#F8EAF1` | Fundos de acolhimento, cards e seções leves. |

### 3.3. Dourados

| Token | Nome | Hexadecimal | Uso |
|---|---|---:|---|
| `gold` | Dourado FAM | `#C9A24A` | Bordas, linhas, ícones, detalhes e indicadores ativos. |
| `gold-soft` | Dourado Claro | `#E8C978` | Indicadores, detalhes de banners e destaques suaves. |
| `gold-dark` | Dourado Escuro | `#9A7626` | Texto dourado sobre fundo claro e detalhes institucionais. |

### 3.4. Estados funcionais

| Estado | Nome | Hexadecimal | Uso |
|---|---|---:|---|
| Sucesso | Verde Esperança | `#4FAF87` | Confirmações, atendimentos concluídos e ações realizadas. |
| Atenção | Âmbar | `#B56B24` | Avisos e informações que exigem atenção. |
| Emergência | Vermelho Segurança | `#B4233C` | Situações críticas, segurança e emergência. |

O vermelho deve ser reservado para situações realmente críticas. Não deve ser usado como cor decorativa da identidade FAM.

## 4. Regras de contraste

### 4.1. Barra superior e barra inferior

As barras de navegação devem utilizar fundo ameixa ou roxo profundo, sempre com texto branco ou quase branco.

```text
Fundo da barra:       #4A173F
Texto principal:      #FFFFFF
Texto secundário:     rgba(255,255,255,.78)
Item ativo:           #E8C978 ou #F05A9D
Fundo do item ativo:  rgba(201,162,74,.18)
Borda de destaque:    #C9A24A
```

É proibido utilizar texto branco sobre fundo branco em menus, submenus, cabeçalhos ou rodapés.

### 4.2. Áreas claras

Em fundos marfim, branco, rosa suave ou lilás claro, os textos devem utilizar ameixa profundo, texto ameixa ou cinza ameixa. Rosa claro, lilás claro e dourado claro não devem ser usados como texto pequeno sobre branco.

### 4.3. Botões

O botão primário deve utilizar pink FAM com texto branco. O botão secundário deve utilizar fundo rosa suave ou transparente, com texto ameixa e borda pink ou dourada.

```text
Botão primário:       #D93683 + #FFFFFF
Botão primário hover: #B52A6E + #FFFFFF
Botão secundário:     #F8EAF1 + #4A173F
Botão institucional:  #4A173F + #FFFFFF
Botão de emergência:  #B4233C + #FFFFFF
```

## 5. Cabeçalho principal

O cabeçalho deve possuir três níveis visuais, quando houver conteúdo suficiente:

1. **Faixa institucional opcional**, para campanhas, avisos ou chamadas especiais.
2. **Área principal**, com logo da FAM, busca ou chamada principal, acesso à conta e ações de apoio.
3. **Menu de categorias**, com navegação horizontal e possibilidade de submenu.

A área principal deve utilizar fundo claro ou ameixa, dependendo da composição. Para preservar a logo e facilitar a leitura, recomenda-se:

```text
Cabeçalho principal: Branco ou Marfim Rosado
Logo:               preservada em suas cores originais
Ícones:             Ameixa Profundo
Links:              Ameixa Profundo
Ação principal:     Pink FAM
Linha inferior:     Dourado FAM
```

Quando o cabeçalho for escuro:

```text
Cabeçalho:          Ameixa Profundo
Logo:               versão clara ou original com área de respiro
Texto:              Branco
Ação:               Rosa Vivo ou Dourado Claro
```

## 6. Menu principal

O menu principal deve funcionar como uma navegação por áreas de interesse, e não como uma lista extensa de funcionalidades técnicas.

### 6.1. Categorias públicas recomendadas

```text
Início
Quem Somos
Projetos FAM
Eventos
Cursos e Capacitações
Notícias
Vídeos
Parceiros
Quero Participar
Fale Conosco
Análise de Risco
```

A ordem deve privilegiar primeiro a instituição e seus projetos, depois conteúdos e, em posição de destaque, os canais de apoio.

### 6.2. Estilo do menu

```css
.fam-main-menu {
  background: #4A173F;
  color: #FFFFFF;
  border-bottom: 1px solid #C9A24A;
}

.fam-main-menu a {
  color: rgba(255, 255, 255, 0.84);
}

.fam-main-menu a:hover,
.fam-main-menu a[aria-current="page"] {
  color: #FFFFFF;
  background: rgba(201, 162, 74, 0.18);
}

.fam-main-menu a[aria-current="page"]::after {
  background: #E8C978;
}
```

O item **Fale Conosco** pode receber um pequeno destaque pink, enquanto **Análise de Risco** deve possuir ícone e texto claros, sem utilizar vermelho salvo quando houver indicação de emergência.

## 7. Submenus e megamenu

A referência visual analisada utiliza categorias principais com navegação organizada em subcategorias. Para a FAM, o submenu deve ser simples, limpo e orientado por necessidades reais da usuária.

### 7.1. Estrutura recomendada

```text
Projetos FAM
├── Lar dos Sonhos
├── Sonho de Princesas
├── Casamento Comunitário
├── FAM Cup
└── Ações sociais

Cursos e Capacitações
├── Capacitação profissional
├── Oficinas
├── Palestras
├── Desenvolvimento pessoal
└── Próximas turmas

Apoio e Proteção
├── Fale Conosco
├── Análise de Risco
├── Apoio psicológico
├── Orientações
└── Rede de atendimento
```

### 7.2. Aparência do submenu

O submenu deve aparecer como um painel claro sobre o conteúdo, com sombra suave, bordas arredondadas e títulos em ameixa. O item em foco pode usar fundo rosa suave ou lilás claro.

```text
Painel do submenu:    #FFFFFF
Título da coluna:     #4A173F
Texto:                #6F596B
Hover:                #F8EAF1
Ícone ativo:          #D93683
Linha de destaque:    #C9A24A
Borda:                #E6DDE7
```

O submenu deve abrir por clique ou foco de teclado. Não depender apenas de hover, especialmente em dispositivos móveis e para usuários que navegam por teclado ou tecnologia assistiva.

### 7.3. Submenu de apoio

O submenu de apoio deve manter as duas funções principais visíveis:

```text
Fale Conosco
Converse com uma atendente especializada.

Análise de Risco
Receba uma orientação inicial e veja opções de encaminhamento.
```

O texto deve deixar claro que a plataforma não é serviço de emergência e que, em perigo imediato, a usuária deve acionar os canais oficiais apropriados.

## 8. Barra inferior de navegação

A barra inferior fixa deve permanecer escura para garantir legibilidade e continuidade com o cabeçalho. A cor recomendada é `#4A173F`.

```css
.fam-bottom-nav {
  background: #4A173F;
  color: #FFFFFF;
  border-top: 1px solid rgba(201, 162, 74, 0.45);
  box-shadow: 0 -6px 20px rgba(74, 23, 63, 0.22);
}

.fam-bottom-nav__item {
  color: rgba(255, 255, 255, 0.75);
}

.fam-bottom-nav__item:hover {
  color: #FFFFFF;
  background: rgba(255, 255, 255, 0.08);
}

.fam-bottom-nav__item--active {
  color: #E8C978;
  background: rgba(201, 162, 74, 0.20);
}
```

A barra deve possuir rolagem horizontal em telas pequenas, item ativo sempre visível e área de toque confortável.

## 9. Carrossel da página inicial

O carrossel será o principal elemento de destaque da página inicial, seguindo a lógica observada na referência Eudora: imagens amplas, mensagens curtas, uma ação principal por banner, indicadores e navegação clara.

### 9.1. Estrutura do banner

```text
┌────────────────────────────────────────────────────────────┐
│  imagem institucional ou campanha                          │
│                                                            │
│  FAM · FORÇA ATIVA DA MULHER                               │
│  Título curto e forte                                       │
│  Texto de apoio                                             │
│  [Saiba mais]                                               │
│                                                            │
│                 ‹       ● ○ ○ ○       ›                    │
└────────────────────────────────────────────────────────────┘
```

### 9.2. Temas dos primeiros banners

| Ordem | Tema | Fundo sugerido | CTA |
|---:|---|---|---|
| 1 | Fale Conosco | Coral, rosa suave e imagem acolhedora | Conversar agora |
| 2 | Análise de Risco | Lilás, roxo e branco | Buscar orientação |
| 3 | Lar dos Sonhos | Pêssego, champanhe e rosa | Conhecer o projeto |
| 4 | Cursos e Capacitações | Lilás, branco e dourado | Ver capacitações |
| 5 | Eventos e palestras | Pink, coral e ameixa | Ver agenda |
| 6 | Quero participar | Rosa vivo e marfim | Participar da FAM |

### 9.3. Tratamento visual

O carrossel pode utilizar fundos coloridos em degradê ou fotografias institucionais. O texto nunca deve ficar diretamente sobre uma imagem sem proteção de contraste.

```css
.fam-carousel {
  background: linear-gradient(135deg, #6D2C68 0%, #4A173F 58%, #32132D 100%);
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 14px 40px rgba(74, 23, 63, 0.18);
}

.fam-carousel__cta {
  background: #D93683;
  color: #FFFFFF;
}

.fam-carousel__cta:hover {
  background: #B52A6E;
}

.fam-carousel__indicator--active {
  background: #E8C978;
}
```

Quando houver imagem de fundo, utilizar overlay ameixa:

```css
background-image:
  linear-gradient(
    90deg,
    rgba(74, 23, 63, 0.94) 0%,
    rgba(74, 23, 63, 0.72) 48%,
    rgba(50, 19, 45, 0.28) 100%
  ),
  url('/caminho-da-imagem.webp');
```

### 9.4. Acessibilidade do carrossel

O carrossel deve possuir botões anterior e próximo com rótulos acessíveis, indicadores identificáveis, navegação por teclado e pausa quando o usuário passa o mouse ou posiciona o foco. A troca automática não deve ocorrer em velocidade que impeça a leitura.

O texto de cada imagem deve possuir descrição alternativa adequada. Imagens decorativas devem utilizar `alt=""`. Banners com conteúdo importante devem comunicar o mesmo conteúdo no texto HTML, não apenas dentro da imagem.

## 10. Cards de acesso rápido

Abaixo do carrossel, recomenda-se uma faixa de atalhos coloridos. Esses cards devem utilizar fundos claros e ícones em cores fortes.

| Card | Fundo | Ícone/texto |
|---|---|---|
| Fale Conosco | `#F8EAF1` | `#D93683` |
| Análise de Risco | `#EFE4FA` | `#8C5BC7` |
| Eventos | `#FFF1EA` | `#E77845` |
| Cursos | `#EFE4FA` | `#6D2C68` |
| Projetos FAM | `#FFF8D9` | `#9A7626` |

A faixa não deve utilizar cinco cores saturadas simultaneamente. O objetivo é criar ritmo visual, mantendo predominância de branco quente e superfícies claras.

## 11. CSS global consolidado

```css
:root {
  --fam-plum: #4A173F;
  --fam-purple: #6D2C68;
  --fam-night: #32132D;
  --fam-ink: #321B2F;
  --fam-muted: #6F596B;
  --fam-background: #FFFCFD;
  --fam-surface: #FFFFFF;
  --fam-border: #E6DDE7;

  --fam-pink: #D93683;
  --fam-rose: #F05A9D;
  --fam-coral: #F47C83;
  --fam-peach: #F6B38A;
  --fam-lilac: #B58AD9;
  --fam-purple-light: #EFE4FA;
  --fam-soft-pink: #F8EAF1;

  --fam-gold: #C9A24A;
  --fam-gold-soft: #E8C978;
  --fam-gold-dark: #9A7626;

  --fam-success: #4FAF87;
  --fam-warning: #B56B24;
  --fam-danger: #B4233C;
}

body {
  background: var(--fam-background);
  color: var(--fam-ink);
}

.fam-dark-surface {
  background: var(--fam-plum);
  color: #FFFFFF;
}

.fam-light-surface {
  background: var(--fam-surface);
  color: var(--fam-ink);
  border: 1px solid var(--fam-border);
}

.fam-gold-line {
  background: linear-gradient(
    90deg,
    var(--fam-gold),
    var(--fam-gold-soft),
    var(--fam-gold)
  );
}
```

## 12. Configuração Tailwind

```ts
const famColors = {
  plum: "#4A173F",
  purple: "#6D2C68",
  night: "#32132D",
  ink: "#321B2F",
  muted: "#6F596B",
  background: "#FFFCFD",
  surface: "#FFFFFF",
  border: "#E6DDE7",
  pink: "#D93683",
  rose: "#F05A9D",
  coral: "#F47C83",
  peach: "#F6B38A",
  lilac: "#B58AD9",
  purpleLight: "#EFE4FA",
  softPink: "#F8EAF1",
  gold: "#C9A24A",
  goldSoft: "#E8C978",
  goldDark: "#9A7626",
  success: "#4FAF87",
  warning: "#B56B24",
  danger: "#B4233C",
};
```

## 13. Critérios de aceite para implantação

A atualização visual será considerada aprovada quando:

1. As barras superior e inferior apresentarem fundo ameixa ou roxo profundo com textos claramente legíveis.
2. Nenhum menu ou submenu utilizar texto branco sobre fundo branco.
3. O azul deixar de ser a cor predominante da interface pública.
4. O dourado aparecer como detalhe de sofisticação, sem dominar a tela.
5. A página inicial possuir carrossel com banners institucionais e chamadas de ação.
6. O carrossel apresentar setas, indicadores, pausa e navegação por teclado.
7. Os cards de acesso rápido utilizarem fundos claros e acentos coloridos equilibrados.
8. Fale Conosco e Análise de Risco permanecerem visualmente acessíveis e fáceis de localizar.
9. A identidade da logo FAM não for distorcida nem substituída por texto genérico.
10. A interface mantiver leitura adequada em desktop, tablet e celular.
11. Os estados de erro, atenção, sucesso e emergência forem diferenciados por cor, texto e ícone.
12. O modo de acessibilidade existente continuar funcionando com a nova paleta.

## 14. Ordem recomendada de implantação

A implantação deve ocorrer em quatro etapas. Primeiro, atualizar tokens globais e superfícies. Depois, atualizar cabeçalho, menu principal, submenus e barra inferior. Em seguida, aplicar o novo tratamento ao carrossel e aos cards de acesso rápido. Por fim, testar contraste, responsividade, teclado, leitores de tela e modo de acessibilidade.

Não se recomenda alterar todos os componentes individualmente com cores fixas. A implementação deve priorizar tokens e classes compartilhadas para que futuras mudanças de identidade visual possam ser realizadas sem refatoração ampla.

## Referência

[1]: https://www.eudora.com.br/ — Referência visual analisada para estrutura de cabeçalho, organização de menus, submenus, carrossel, banners, cards e uso combinado de roxo, rosa, branco e dourado.
