# BACKLOG-02 — Módulo 04
## Arquivos e Evidências Documentais

**Projeto:** FAM  
**Versão:** 1.0  
**Status:** Especificação funcional

## 1. Objetivo

Definir os requisitos para recebimento, validação, armazenamento, utilização, acesso, compartilhamento, retenção e exclusão de arquivos.

A FAM poderá receber, proteger, organizar e encaminhar informações, mas não deverá declarar automaticamente que determinado arquivo constitui prova de crime ou que seu conteúdo é verdadeiro.

## 2. Fluxo geral

```text
ARQUIVO ENVIADO
      ↓
VALIDAÇÃO
      ↓
QUARENTENA
      ↓
VERIFICAÇÃO DE SEGURANÇA
      ↓
ARMAZENAMENTO PROTEGIDO
      ↓
USO NA FINALIDADE AUTORIZADA
      ↓
RETENÇÃO
      ↓
EXCLUSÃO
```

## BLG-048 — Tipos de arquivo

| Categoria | Formatos iniciais |
|---|---|
| Documento | PDF, DOCX, ODT |
| Imagem | JPG/JPEG, PNG, WEBP |
| Áudio | MP3, M4A, WAV |
| Vídeo | MP4, MOV, WEBM |

A lista deverá ser configurável. A extensão não poderá determinar sozinha o tipo real do arquivo.

## BLG-049 — Limites técnicos

| Categoria | Limite inicial |
|---|---:|
| PDF/documentos | 25 MB |
| Imagem | 15 MB |
| Áudio | 50 MB |
| Vídeo | 200 MB |

Valores sujeitos à validação antes da produção. Os limites deverão ser aplicados no servidor.

## BLG-050 — Validação

```text
UPLOAD
  ↓
EXTENSÃO
  ↓
MIME TYPE
  ↓
MAGIC BYTES
  ↓
TAMANHO
  ↓
ANTIMALWARE
  ↓
PROCESSAMENTO SEGURO
  ↓
ARMAZENAMENTO
```

Mensagem em caso de falha:

> **Não foi possível validar este arquivo. Tente outro arquivo ou utilize outro formato disponível.**

## BLG-051 — Quarentena

```text
RECEBIDO → QUARENTENA → VALIDADO → DISPONÍVEL
                         └→ BLOQUEADO
```

Arquivo bloqueado não poderá ser disponibilizado.

## BLG-052 — Antimalware

Estados técnicos:

```text
CLEAN
SUSPICIOUS
MALICIOUS
ERROR
```

Logs não deverão armazenar desnecessariamente o conteúdo integral.

## BLG-053 — Criptografia

Arquivos sensíveis deverão utilizar criptografia em trânsito e em repouso, gerenciamento seguro de chaves, segregação de ambientes e controle de acesso.

## BLG-054 — Armazenamento privado

Arquivos sensíveis serão privados por padrão. Não deverá existir URL pública para conteúdo sensível. O acesso deverá ocorrer mediante autorização controlada, preferencialmente por mecanismo temporário.

## BLG-055 — Metadados

Tratar como potencialmente sensíveis: nome original, data, localização, dispositivo, autor, software e EXIF.

Quando possível e compatível com a finalidade, aplicar minimização ou remoção. Não alterar silenciosamente o original quando isso puder comprometer sua integridade.

## BLG-056 — Original e derivados

```text
ORIGINAL
   ├── versão processada
   ├── miniatura
   ├── transcrição
   └── pré-visualização
```

Cada derivado deverá manter relação explícita com o original.

## BLG-057 — Integridade

Poderá ser utilizada referência como SHA-256 para verificar alteração do arquivo. Isso não constitui, por si só, autenticação jurídica da veracidade do conteúdo.

## BLG-058 — Visualização

Visualização, download, compartilhamento e exclusão são permissões distintas:

```text
VIEW
DOWNLOAD
SHARE
DELETE
```

## BLG-059 — Download

Downloads de arquivos sensíveis deverão verificar autorização, registrar evento, evitar URLs permanentes e utilizar expiração quando aplicável.

```text
FILE_DOWNLOAD
file_id
actor_id
purpose
timestamp
authorization_reference
```

## BLG-060 — Compartilhamento

```text
ARQUIVO
 ↓
FINALIDADE
 ↓
DESTINATÁRIO
 ↓
AUTORIZAÇÃO / BASE APLICÁVEL
 ↓
DADOS MÍNIMOS
 ↓
TRANSMISSÃO
 ↓
AUDITORIA
```

Não haverá compartilhamento genérico baseado apenas na escolha de um órgão.

## BLG-061 — Profissional credenciado

O profissional autorizado não terá acesso automático a todos os arquivos. A autorização deverá considerar:

```text
PROFISSIONAL + CASO + FUNÇÃO + FINALIDADE + ESCOPO
```

## BLG-062 — Retenção

Não haverá prazo universal. Cada classe deverá possuir finalidade, evento inicial, prazo, exceções e regra de exclusão. Prazos definitivos dependem de aprovação institucional e jurídica.

## BLG-063 — Exclusão

```text
ARQUIVO → DERIVADOS → REFERÊNCIAS → ÍNDICES → EXCLUSÃO
```

Backups terão ciclo de vida próprio.

## BLG-064 — Legal Hold

```text
RETENÇÃO NORMAL
      ↓
LEGAL HOLD
      ↓
EXCLUSÃO SUSPENSA
```

A suspensão limita-se ao escopo coberto pelo legal hold.

## BLG-065 — Interface de upload

> **Envie somente os arquivos necessários para esta finalidade.**
>
> Seus arquivos serão tratados de acordo com as regras de segurança e privacidade da FAM.

**Botão:** Adicionar arquivo

Após envio:

> **Arquivo recebido. Ele será verificado antes de ficar disponível.**

## BLG-066 — Arquivo bloqueado

> **Este arquivo não pôde ser disponibilizado porque não passou pelas verificações de segurança. Nenhum conteúdo será compartilhado a partir deste arquivo.**

## BLG-067 — Erro de tamanho ou formato

> **Este arquivo não atende aos formatos ou limites disponíveis. Escolha outro arquivo e tente novamente.**

## BLG-068 — Critérios de aceite

- [ ] formatos controlados
- [ ] limites aplicados no servidor
- [ ] MIME type validado
- [ ] magic bytes verificados
- [ ] antimalware executado
- [ ] quarentena implementada
- [ ] armazenamento privado
- [ ] criptografia aplicada
- [ ] acesso granular
- [ ] visualização e download separados
- [ ] compartilhamento auditado
- [ ] original e derivados relacionados
- [ ] metadados tratados
- [ ] integridade verificável
- [ ] retenção orientada por política
- [ ] legal hold suportado
- [ ] exclusão de derivados e referências
- [ ] ciclo de backup documentado

## BLG-069 — Testes

### Upload
- T35 — formato permitido
- T36 — formato proibido
- T37 — arquivo acima do limite
- T38 — MIME incompatível
- T39 — arquivo malicioso
- T40 — arquivo corrompido

### Segurança
- T41 — acesso sem autorização
- T42 — acesso a outro caso
- T43 — URL expirada
- T44 — download auditado
- T45 — compartilhamento não autorizado

### Retenção
- T46 — expiração normal
- T47 — exclusão de derivado
- T48 — legal hold
- T49 — encerramento do legal hold
- T50 — ciclo de backup

## 3. Regra institucional transversal

> **Nenhum membro, parceiro ou dirigente da FAM terá acesso ao conteúdo sensível simplesmente em razão de seu cargo.**

O acesso depende de função, necessidade, finalidade, autorização e credenciamento aplicável.

## 4. Próximo módulo

**M05 — Encaminhamento e Compartilhamento.**
