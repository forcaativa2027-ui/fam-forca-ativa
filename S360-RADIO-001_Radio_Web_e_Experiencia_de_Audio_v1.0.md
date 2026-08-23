# S360-RADIO-001 — Rádio Web e Experiência de Áudio
## Subsistema público de áudio, transmissão, conteúdo sob demanda e acesso direto da instituição parceira

**Plataforma:** Servo360  
**Documento:** S360-RADIO-001  
**Versão:** 1.0  
**Status:** Baseline funcional e técnico para implementação  
**Escopo inicial:** Área pública / usuário não logado, com evolução futura para área autenticada e administração

---

# 1. Propósito

A Rádio Web será uma camada permanente de comunicação sonora do Servo360.

Ela não será apenas uma página contendo arquivos de áudio. O objetivo é disponibilizar uma experiência contínua para:

- pregações;
- mensagens;
- louvores;
- notícias;
- informações da igreja ou instituição parceira;
- devocionais;
- entrevistas;
- programações especiais;
- transmissões ao vivo;
- conteúdos gravados sob demanda.

Princípio central:

> **A Rádio Web deve acompanhar o usuário durante a navegação, e não obrigá-lo a permanecer parado em uma única tela.**

---

# 2. Entrada na navegação pública

Na barra inferior do perfil público / usuário não logado, inserir o novo item:

```text
Notícias → Rádio Web → Vídeos
```

O item utilizará:

```text
Asset: s360-icon-web-radio
Arquivo: web-radio.webp
Pasta: public/assets/servo360/icons/content/
```

Ao tocar em **Rádio Web**, o usuário será direcionado à página pública da rádio vinculada à igreja ou instituição correspondente ao tenant atual.

---

# 3. Página principal da Rádio Web

Estrutura inicial:

```text
RÁDIO WEB
├── Player principal
├── Ao vivo agora
├── Próximo programa
├── Programação
├── Pregações
├── Louvores
├── Notícias
├── Informações
├── Devocionais
├── Entrevistas
├── Conteúdos recentes
└── Compartilhar
```

---

# 4. Player principal

O player principal deve suportar:

- play;
- pause;
- volume;
- mute;
- identificação do conteúdo atual;
- capa ou imagem do programa;
- indicação `AO VIVO` quando aplicável;
- duração/progresso em conteúdo sob demanda;
- compartilhamento;
- retorno rápido à página da Rádio.

O estado do áudio deverá ser controlado fora da página individual da Rádio, para evitar reinicialização do player durante a navegação interna.

---

# 5. Mini-player persistente

Após o usuário iniciar a reprodução, deverá ser exibido um mini-player persistente.

```text
┌────────────────────────────────────┐
│ ▶  Programa / Pregação atual       │
│    Rádio Web • AO VIVO       🔊  ↑ │
└────────────────────────────────────┘
```

Funções mínimas:

- play/pause;
- identificação do conteúdo;
- indicador ao vivo;
- volume;
- expandir;
- retornar à Rádio.

Requisito crítico:

> **Mudar de página dentro do Servo360 não deve interromper o áudio em reprodução.**

---

# 6. Dois acessos instaláveis para cada parceiro

O Servo360 deverá prever **dois acessos distintos na tela inicial do dispositivo**, personalizados para cada igreja ou instituição parceira.

## 6.1 Acesso principal Servo360

Representa o acesso geral à plataforma.

Exemplo:

```text
Servo360
Comunidade Evangélica de Águas Claras
```

ou:

```text
Servo360
Nome da Instituição Parceira
```

Esse ícone abre a experiência completa do Servo360.

## 6.2 Acesso direto Rádio Web

Além do ícone do Servo360, deverá existir um segundo acesso:

```text
Rádio Web
Nome da Igreja / Instituição
```

Exemplos:

```text
Rádio Web
CEC Águas Claras
```

```text
Rádio Web
Comunidade Esperança
```

```text
Rádio Web
Instituto Parceiro
```

Esse segundo ícone funcionará como **atalho instalável para abrir diretamente a Rádio Web** do parceiro.

Princípio:

> **O usuário deve reconhecer a Rádio da sua própria comunidade diretamente na tela inicial do celular, sem precisar entrar primeiro no menu geral do Servo360.**

---

# 7. Botão externo “Rádio Web”

Na página pública e em pontos estratégicos deverá existir um botão:

```text
[ 🎙️ Instalar Rádio Web ]
```

ou:

```text
[ Adicionar Rádio Web à tela inicial ]
```

Sua função será preparar o acesso direto à Rádio daquela instituição.

Quando a instalação direta não estiver disponível, a interface deverá orientar o usuário para adicionar o atalho à tela inicial.

---

# 8. Identidade visual dos dois acessos

Teremos duas identidades complementares:

```text
ÍCONE 1
Servo360
→ identidade da plataforma
→ nome da igreja/instituição
→ abre a plataforma completa

ÍCONE 2
Rádio Web
→ identidade sonora
→ nome da igreja/instituição
→ abre diretamente a Rádio
```

Asset base da Rádio:

```text
s360-icon-web-radio
web-radio.webp
public/assets/servo360/icons/content/web-radio.webp
```

Para instalação externa, poderão existir variantes otimizadas para launcher/app icon.

---

# 9. Personalização por tenant

A Rádio deverá receber a identidade do parceiro atual sem alteração manual de código por instituição.

Configuração conceitual:

```text
radio_enabled
radio_display_name
radio_short_name
radio_logo
radio_icon
radio_theme
radio_stream_url
```

Exemplo:

```text
radio_display_name = "Rádio Web — CEC Águas Claras"
radio_short_name = "Rádio CEC"
```

---

# 10. URL direta

Cada parceiro deverá possuir rota estável para sua Rádio, respeitando a estratégia multi-tenant existente.

Conceitualmente:

```text
/radio
```

em contexto tenant-aware, ou:

```text
/{tenant}/radio
```

O atalho instalado deverá abrir diretamente essa rota.

---

# 11. Fluxo do acesso pelo ícone Rádio Web

```text
Ícone Rádio Web
      ↓
Identificação do tenant
      ↓
Página Rádio Web
      ↓
Player principal
      ↓
Programação / conteúdo
```

Não será necessário passar primeiro pela Home pública.

---

# 12. Um subsistema, não dois produtos

Apesar dos dois ícones, Servo360 e Rádio Web continuam sendo a mesma plataforma.

```text
SERVO360
└── Subsistema Rádio Web
    ├── mesmo tenant
    ├── mesma administração
    ├── mesma identidade institucional
    ├── mesma camada de segurança
    └── entrada própria
```

Evitar:

- banco duplicado;
- usuários duplicados;
- conteúdo duplicado;
- manutenção paralela;
- divergência de identidade.

---

# 13. Conteúdo ao vivo

Quando houver transmissão ativa:

```text
🔴 AO VIVO

Programa atual
Apresentador
Horário
Descrição

[ ▶ Ouvir agora ]

Próximo:
19:30 — Palavra e Vida
```

---

# 14. Conteúdo sob demanda

Categorias iniciais:

```text
Pregações
Mensagens
Louvores
Devocionais
Notícias
Informações
Entrevistas
Estudos
Especiais
```

Cada item poderá conter:

- título;
- descrição;
- imagem;
- autor/ministro/apresentador;
- duração;
- data;
- categoria;
- áudio;
- link de compartilhamento.

---

# 15. Programação

Visualização por dia:

```text
SEGUNDA
06:00 Devocional
08:00 Notícias
12:00 Palavra do Dia
18:00 Louvor
20:00 Pregação
```

Itens ao vivo e gravados poderão coexistir conforme a operação definida pela instituição.

---

# 16. Administração da Rádio

Prever gestão de:

```text
Rádio Web
├── Configuração
├── Stream
├── Programação
├── Programas
├── Episódios
├── Pregações
├── Louvores
├── Notícias
├── Capas
├── Destaques
└── Status da transmissão
```

Antes de criar novas tabelas, verificar estruturas existentes.

---

# 17. Branding institucional

A Rádio deverá herdar:

- nome da igreja/instituição;
- logomarca;
- identificação local;
- cores permitidas pelo tema;
- dados de contato;
- endereço;
- links oficiais.

A experiência pública deve transmitir claramente:

> **“Esta é a Rádio Web da minha comunidade.”**

---

# 18. Card público da Rádio Web

A Home poderá exibir:

```text
┌───────────────────────────────┐
│ 🎙️ Rádio Web                 │
│                               │
│ 🔴 AO VIVO                    │
│ Palavra e Louvor              │
│                               │
│ [ ▶ Ouvir agora ]             │
└───────────────────────────────┘
```

O card deve seguir o padrão tátil Servo360:

```text
REST
HOVER
PRESSED
FOCUS
```

---

# 19. Ícone no menu inferior

No menu público:

```text
Notícias
Rádio Web
Vídeos
```

O asset 3D completo poderá ter uma variante simplificada para bottom navigation, preservando a identidade.

---

# 20. Mobile e acessibilidade

A Rádio será desenhada prioritariamente para celular.

Requisitos:

- Play grande;
- mini-player acessível;
- baixo número de toques;
- reflow em fontes grandes;
- labels acessíveis;
- indicação textual de estado Ao Vivo;
- Light/Dark;
- reduced motion;
- integração com CT-017.

---

# 21. Compartilhamento

Prever:

```text
Compartilhar programa
Compartilhar pregação
Compartilhar Rádio
Copiar link
```

O link deve preservar o contexto do tenant.

---

# 22. Evoluções futuras

Poderão ser incorporados:

- favoritos;
- histórico;
- continuar ouvindo;
- podcasts;
- séries;
- episódios;
- playlists;
- recomendações;
- notificações de programas;
- distribuição externa.

Esses itens não bloqueiam o MVP público.

---

# 23. Arquitetura conceitual de frontend

```text
RadioPage
   ↓
RadioPlayer
   ↓
useRadioPlayer
   ↓
RadioService
   ↓
API/RPC
   ↓
Backend
```

Player persistente:

```text
App Shell
└── RadioPlayerProvider
    ├── Current Media
    ├── Playback State
    ├── Volume
    ├── Live State
    └── Mini Player
```

Estado mínimo:

```text
currentTrack
currentProgram
isPlaying
isLive
volume
duration
currentTime
streamStatus
tenant
```

---

# 24. Resiliência

Tratar:

- stream indisponível;
- perda temporária de conexão;
- conteúdo removido;
- erro de mídia;
- tenant sem Rádio configurada.

Nunca apresentar um player quebrado como se estivesse funcionando.

---

# 25. Tenant sem Rádio

Quando `radio_enabled = false`:

- menu Rádio Web não aparece;
- card da Home não aparece;
- botão de instalação não aparece;
- rota trata acesso direto adequadamente.

---

# 26. Segurança

A Rádio pública não deve expor:

- credenciais;
- URLs privadas;
- configurações administrativas;
- dados internos;
- permissões sensíveis.

---

# 27. Analytics

Métricas futuras:

```text
inícios de reprodução
tempo ouvido
programas mais ouvidos
pregações mais ouvidas
origem do acesso
acesso pelo Servo360
acesso pelo ícone Rádio Web
```

---

# 28. Critérios de aceite — navegação

- Rádio Web aparece entre Notícias e Vídeos.
- Funciona para usuário não logado.
- Respeita tenant.
- Ícone correto é exibido.
- Não quebra menu mobile.
- CT-017 continua funcional.

---

# 29. Critérios de aceite — player

- Play funciona.
- Pause funciona.
- Volume funciona.
- Estado Ao Vivo é identificado.
- Navegação não interrompe o áudio sem necessidade.
- Mini-player aparece durante reprodução.
- Mini-player retorna à Rádio.
- Erros são tratados.

---

# 30. Critérios de aceite — segundo acesso

- Existe acesso visual distinto do Servo360.
- Exibe o nome da Rádio/instituição.
- Abre diretamente a rota da Rádio.
- Identifica corretamente o tenant.
- Não cria segundo backend.
- Pode ser adicionado à tela inicial quando o ambiente permitir.
- Possui orientação alternativa quando instalação direta não estiver disponível.

---

# 31. Decisões congeladas

**RADIO-001** — Rádio Web entra entre Notícias e Vídeos.  
**RADIO-002** — O recurso é público no MVP.  
**RADIO-003** — Player deve persistir durante a navegação.  
**RADIO-004** — Haverá mini-player.  
**RADIO-005** — Rádio suportará ao vivo e sob demanda.  
**RADIO-006** — Conteúdos iniciais: pregação, louvor, notícias e informações.  
**RADIO-007** — A Rádio pertence ao mesmo tenant Servo360.  
**RADIO-008** — Haverá segundo acesso instalável/atalho para a Rádio.  
**RADIO-009** — O ícone Rádio Web será distinto do ícone Servo360.  
**RADIO-010** — Os dois acessos mostrarão o nome da instituição parceira.  
**RADIO-011** — O atalho Rádio Web abrirá diretamente a Rádio.  
**RADIO-012** — Não será criado um segundo backend para a Rádio.  
**RADIO-013** — CT-017 permanece soberana em acessibilidade.  
**RADIO-014** — Estruturas existentes devem ser verificadas antes de novas tabelas.  
**RADIO-015** — O recurso poderá evoluir para favoritos, histórico, podcasts e notificações.

---

# 32. Síntese

```text
[ Servo360 — Igreja Parceira ]
             +
[ Rádio Web — Igreja Parceira ]

Servo360
   ↓
plataforma completa

Rádio Web
   ↓
acesso direto
   ↓
player
   ↓
ao vivo / pregações / louvores / notícias
```

A instituição ganha dois pontos de presença na tela inicial do usuário sem manter dois produtos independentes.

> **Servo360 conecta a comunidade. Rádio Web mantém a comunidade ouvindo.**

---

**S360-RADIO-001 v1.0 — BASELINE FUNCIONAL E TÉCNICO**
