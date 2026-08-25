# S360-RADIO-002 — Broadcast Engine, Grade de Programação e Studio Remoto

**Plataforma:** Servo360  
**Módulo:** Rádio Web  
**Versão:** 1.0  
**Status:** Especificação funcional e técnica  
**Relacionado:** S360-RADIO-001 — Rádio Web e Experiência de Áudio

---

## 1. Objetivo

Transformar a Rádio Web do Servo360 em uma plataforma de automação de rádio, combinando grade de programação, biblioteca de áudio, playlists, transmissão ao vivo, participantes remotos, gravação automática, fallback e reprise.

> O usuário entra na Rádio Web e encontra imediatamente o conteúdo correspondente à programação daquele momento.

## 2. Modos de programação

Cada faixa poderá operar em:

- **AUTOMÁTICO:** reprodução controlada pelo sistema a partir da biblioteca ou playlists.
- **AO VIVO:** apresentador transmite pelo Servo360 Radio Studio.
- **HÍBRIDO:** apresentador fala ao vivo e dispara músicas, vinhetas e outros conteúdos cadastrados.

Exemplo:

```text
06:00–08:00 | Louvor da Manhã | AUTOMÁTICO
08:00–08:15 | Notícias        | AUTOMÁTICO
12:00–12:30 | Palavra do Dia  | GRAVADO
19:00–20:00 | Palavra e Vida  | AO VIVO
20:00–21:30 | Culto           | AO VIVO
21:30–23:59 | Louvor Noturno  | AUTOMÁTICO
```

## 3. Grade de programação

O Admin deverá permitir cadastrar:

- nome e descrição;
- apresentador;
- categoria;
- data/dia da semana;
- horário inicial e final;
- recorrência;
- modo;
- playlist ou conteúdo;
- fallback;
- status;
- gravação automática;
- permissão de reprise.

Categorias iniciais: Música, Louvor, Culto, Pregação, Entrevista, Notícias, Devocional, Estudo, Informações, Institucional, Especial, Podcast e Reprise.

## 4. Biblioteca e playlists

A biblioteca central armazenará músicas, pregações, cultos, entrevistas, devocionais, notícias, vinhetas, chamadas, institucionais e programas completos.

Cada mídia poderá conter título, descrição, duração, autor/ministro/artista, categoria, data, capa, tags e permissões.

As playlists poderão ser ordenadas, aleatórias, temáticas ou vinculadas a horários/programas.

## 5. Broadcast Engine

O Broadcast Engine responde continuamente:

> **O que deve estar no ar agora?**

```text
Relógio oficial do backend
          ↓
       Scheduler
          ↓
 Grade de Programação
          ↓
  Broadcast Engine
   ├─ Automático
   ├─ Gravado
   ├─ Ao Vivo
   └─ Híbrido
          ↓
        Stream
          ↓
       Ouvintes
```

O Scheduler controla início, término, recorrência, transições, especiais, reprises, prioridades e fallback.

## 6. Regra contra silêncio e fallback

A ausência do apresentador não deverá deixar a Rádio em silêncio.

```text
Programa AO VIVO
      ↓
Apresentador conectado?
   ┌──────┴──────┐
  SIM           NÃO
   ↓              ↓
 LIVE          FALLBACK
                  ↓
       Playlist/programa gravado
```

Cada programa ao vivo poderá definir uma política de contingência.

## 7. Servo360 Radio Studio

O ambiente remoto será denominado **Servo360 Radio Studio** e deverá funcionar pelo navegador sempre que tecnicamente possível.

Exemplo:

```text
SERVO360 RADIO STUDIO

PALAVRA E VIDA
Hoje • 19:00–20:00
Apresentador: João Silva

🎙 Microfone    OK
🎧 Retorno      OK
📶 Conexão      Excelente

Início em 04:32

[ ENTRAR NO ESTÚDIO ]
```

## 8. Acesso temporário do apresentador

O Admin poderá gerar um convite conceitualmente semelhante a:

```text
/radio/studio/invite/{token}
```

O convite será individual, temporário, assinado, revogável e associado ao tenant, programa, horário e papel.

Exemplo de janela:

```text
18:50 sala de espera
18:55 teste técnico
19:00 transmissão autorizada
20:00 encerramento programado
20:10 acesso operacional encerrado
```

O servidor, e não apenas o frontend, deverá validar a autorização.

## 9. Estúdio compartilhado

Uma sessão poderá reunir pessoas em qualquer lugar:

```text
Host — Brasília
Co-host — Manaus
Convidado — Portugal
Convidado — Estados Unidos
```

Papéis previstos: Host, Co-host, Convidado e Produtor, com permissões diferentes.

Convidados entram inicialmente em sala de espera, testam microfone/conexão e somente entram no ar quando autorizados.

## 10. Arquitetura de mídia

Arquitetura conceitual:

```text
Navegador
   ↓
WebRTC
   ↓
Ingestão de mídia
   ↓
Media Server
   ↓
Mixer
 ┌─┴──────────┐
 ↓            ↓
Recorder   Broadcast
              ↓
           Ouvintes
```

A implementação poderá avaliar WHIP para ingestão WebRTC, sujeito à prova de conceito e à infraestrutura de mídia escolhida.

## 11. Mixer e modo híbrido

```text
Host ──────────┐
Co-host ───────┤
Convidado A ───┼──→ MIXER → PROGRAMA FINAL
Convidado B ───┤
Vinheta ───────┤
Música ────────┘
```

No modo híbrido, o Studio poderá oferecer botões para vinhetas, músicas, chamadas e outros áudios autorizados, reduzindo a necessidade de mesa de som física.

## 12. Gravação automática

```text
Programa inicia
       ↓
     REC ON
       ↓
      Mixer
   ┌────┴─────┐
   ↓          ↓
Stream     Gravação
```

Ao terminar:

```text
Arquivo bruto
     ↓
Processamento
     ↓
Metadados automáticos
     ↓
Biblioteca
     ↓
Revisão
  ┌──┴──┐
Publicar Reprise
```

Como a grade já contém os dados do programa, título, apresentador, categoria, data, horário e origem poderão ser associados automaticamente à gravação.

## 13. Reprise e patrimônio de conteúdo

Uma gravação aprovada poderá retornar à grade:

```text
Domingo 14:00
REPRISE — Palavra e Vida
Episódio de 18/08/2026
```

Assim:

```text
AO VIVO → GRAVAÇÃO → ACERVO
                       ├─ Reprise
                       ├─ Podcast
                       ├─ Pregação
                       └─ Compartilhamento
```

## 14. Painel administrativo

```text
RÁDIO WEB
├── Agora no Ar
├── Grade de Programação
├── Programas
├── Biblioteca
├── Playlists
├── Apresentadores
├── Radio Studio
├── Convites
├── Gravações
├── Reprises
├── Vinhetas
├── Relatórios
└── Configurações
```

O painel “Agora no Ar” poderá exibir programa, apresentador, horário, participantes conectados, estado da gravação e audiência quando houver fonte confiável.

## 15. Segurança

Requisitos mínimos:

- tokens não previsíveis e com expiração;
- TLS;
- autorização no servidor;
- rate limiting;
- revogação;
- auditoria;
- separação multi-tenant;
- validação de horário e papel;
- proteção dos endpoints administrativos.

Conhecer a URL do convite não poderá conceder privilégios além daqueles explicitamente autorizados.

## 16. Queda e reconexão

```text
LIVE
 ↓
Queda
 ↓
Janela de reconexão
 ├─ Reconectou → LIVE
 └─ Não reconectou → FALLBACK
```

A recuperação do áudio para o ouvinte não deverá depender exclusivamente de intervenção humana.

## 17. Programação especial

A grade poderá ser temporariamente sobrescrita por congresso, conferência, vigília, culto especial, entrevista extraordinária ou evento.

Finalizado o especial, a programação normal deverá ser retomada.

## 18. Experiência pública

O player poderá mostrar:

```text
🔴 AO VIVO
Palavra e Vida
com João Silva
19:00–20:00

Próximo:
20:00 Culto da Noite
```

A programação pública deverá permitir consultar **Agora, Próximo, Hoje, Amanhã e Semana**.

## 19. Direitos e consentimento

A operação deverá considerar direitos autorais, licenciamento musical, execução pública e demais autorizações aplicáveis ao conteúdo utilizado.

Participantes deverão ser informados quando a sessão estiver sendo gravada, com indicação clara de `REC` e mecanismo de aceite quando juridicamente necessário.

## 20. Armazenamento e processamento

Separar conceitualmente:

```text
Biblioteca permanente
Gravações brutas
Gravações processadas
Temporários
Cache
```

Após gravação poderão ocorrer normalização, waveform, transcodificação, extração de duração, geração de capa e metadados. Processamentos pesados não devem bloquear a transmissão.

## 21. Observabilidade e auditoria

Monitorar status do stream, encoder, participantes, latência, quedas, reconexões, gravação, Scheduler, fallback e armazenamento.

Auditar eventos como início/fim de programa, conexões, convites, fallback, gravações e alterações de grade.

## 22. MVP recomendado

Primeiro ciclo:

```text
1. Grade
2. Biblioteca
3. Playlists
4. Automação
5. Programa ao vivo
6. Link temporário
7. Studio com microfone
8. Fallback
9. Gravação
10. Reprise
```

Segundo ciclo:

```text
11. Multi-convidados
12. Mixer avançado
13. Modo híbrido
14. Soundboard
15. Podcasts
16. Analytics avançado
```

## 23. Critérios de aceite

### Automação
- A grade determina o conteúdo vigente.
- Programações recorrentes funcionam.
- O próximo programa é conhecido.
- Fallback evita silêncio por ausência do apresentador.

### Studio
- Convite válido identifica programa e papel.
- Convite expirado não transmite.
- Microfone pode ser testado.
- Entrada no ar respeita a janela autorizada.
- Queda de conexão é detectada.

### Gravação
- Programa configurado gera gravação.
- `REC` é visível.
- Metadados são associados.
- Conteúdo pode ser revisado e reutilizado como reprise.

### Ouvinte
- Ao abrir a Rádio, recebe o conteúdo correspondente à grade atual.
- O player identifica o programa.
- A programação pode ser consultada.
- Transições não exigem ação do ouvinte.

## 24. Decisões congeladas

**RADIO2-001** — Rádio orientada por grade.  
**RADIO2-002** — Modos AUTOMÁTICO, AO VIVO e HÍBRIDO.  
**RADIO2-003** — Broadcast Engine decide o conteúdo vigente.  
**RADIO2-004** — Programas ao vivo suportam fallback.  
**RADIO2-005** — Acesso remoto temporário para apresentadores.  
**RADIO2-006** — Ambiente denominado Servo360 Radio Studio.  
**RADIO2-007** — Convites associados a programa, horário e papel.  
**RADIO2-008** — Evolução para múltiplos participantes.  
**RADIO2-009** — Participantes podem estar geograficamente distribuídos.  
**RADIO2-010** — Gravação automática de programas configurados.  
**RADIO2-011** — Gravações alimentam acervo e reprises.  
**RADIO2-012** — Ausência do apresentador não interrompe a Rádio quando houver fallback.  
**RADIO2-013** — Autorização validada no servidor.  
**RADIO2-014** — Isolamento multi-tenant obrigatório.  
**RADIO2-015** — MVP precede recursos avançados.

## 25. Síntese arquitetural

```text
GRADE / SCHEDULER
        ↓
BROADCAST ENGINE
   ┌────┴────┐
AUTOMÁTICO  AO VIVO
   ↓           ↓
Biblioteca  Radio Studio
Playlist       ↓
             WebRTC
               ↓
          Media Server
           ┌───┴───┐
           ↓       ↓
         Mixer   Recorder
           └───┬───┘
               ↓
             Stream
               ↓
            OUVINTES
```

> **A tecnologia deve simplificar a transmissão da mensagem, não transformar a operação da Rádio em uma barreira técnica.**

---

**S360-RADIO-002 v1.0 — BROADCAST ENGINE, GRADE DE PROGRAMAÇÃO E STUDIO REMOTO**
