# POL-ARQ-01 — Política de Arquivos, Segurança, Retenção e Exclusão

**Instituição:** Força Ativa da Mulher — FAM  
**Plataforma:** Plataforma FAM  
**Versão:** 1.1  
**Data:** 24/08/2026  
**Status:** minuta institucional + técnica  
**Classificação:** proteção de dados, arquivos, segurança, retenção e descarte

> **Nota de validação:** os prazos abaixo constituem política operacional proposta. Antes da produção, devem ser validados juridicamente conforme finalidade, obrigação legal, exercício regular de direitos, defesa institucional e demais bases aplicáveis.

## 1. Objetivo

Estabelecer regras para recebimento, armazenamento, acesso, processamento, compartilhamento, retenção, revisão e exclusão de arquivos enviados à Plataforma FAM.

Aplica-se a PDF, imagens, áudio, vídeo e demais documentos relacionados às ferramentas de orientação e atendimento.

## 2. Princípio central

> **A FAM deve guardar somente aquilo que tenha finalidade definida, seja necessário e possua prazo justificável de retenção.**

O armazenamento indefinido não deve ser adotado como padrão.

## 3. Finalidades

Os arquivos poderão ser tratados, conforme o caso e a base jurídica aplicável, para:

**A — orientação e identificação de sinais de atenção;**

**B — atendimento e encaminhamento;**

**C — proteção, segurança, exercício regular de direitos, cumprimento de obrigações legais ou atendimento a solicitações de autoridades competentes, quando juridicamente aplicável.**

A finalidade C possui caráter excepcional e não autoriza armazenamento indiscriminado.

## 4. Regra de minimização

A plataforma deverá informar:

> **Você não precisa enviar um arquivo para receber orientação inicial.**

E:

> **Envie somente o que for necessário para a finalidade indicada.**

## 5. Formatos aceitos

### Documentos

- PDF;
- quando indispensável, DOCX ou formatos equivalentes previamente autorizados.

**Limite recomendado inicial:** 20 MB por arquivo.

### Imagens

- JPG/JPEG;
- PNG;
- WEBP.

**Limite recomendado:** 15 MB por arquivo.

### Áudio

- MP3;
- M4A;
- WAV.

**Limite recomendado:** 50 MB por arquivo.

### Vídeo

- MP4;
- MOV, somente se tecnicamente suportado.

**Limite recomendado:** 200 MB por arquivo.

> Os limites são parâmetros operacionais iniciais e devem ser revisados após testes de infraestrutura, segurança e experiência do usuário.

## 6. Quantidade de arquivos

Recomendação inicial:

**até 10 arquivos por envio**, sujeito a limite total da solicitação.

A plataforma deverá evitar incentivar o envio de grandes volumes de documentos.

Texto:

> **Envie apenas os arquivos necessários. Você poderá continuar sem anexos.**

## 7. Arquivos proibidos

Bloquear:

- executáveis;
- scripts;
- arquivos compactados sem necessidade;
- arquivos com extensões desconhecidas;
- conteúdo malicioso detectado;
- arquivos incompatíveis com o fluxo.

O bloqueio deverá ocorrer antes da disponibilização do arquivo ao usuário interno.

## 8. Segurança no upload

Todo arquivo deverá passar, conforme capacidade técnica:

1. validação de extensão;
2. validação do tipo MIME;
3. verificação de assinatura do arquivo;
4. antivírus/antimalware;
5. análise de tamanho;
6. geração de identificador interno;
7. armazenamento controlado;
8. registro do evento.

## 9. Nome do arquivo

Não utilizar o nome original como identificador interno quando isso revelar informação sensível.

Exemplo inadequado:

`relato_violencia_maria_joao.pdf`

Preferir identificador técnico:

`FILE-8F3A2C...`

O nome original poderá ser preservado separadamente, com acesso controlado, quando houver finalidade legítima.

## 10. Metadados

A plataforma deverá considerar que arquivos podem conter:

- localização GPS;
- data/hora;
- dispositivo;
- autor;
- dados de terceiros;
- informações médicas;
- documentos;
- imagens;
- informações de contato.

Quando tecnicamente possível e juridicamente adequado, reduzir metadados desnecessários.

## 11. Criptografia

Os arquivos deverão ser protegidos:

- em trânsito;
- em armazenamento;
- durante transferência entre componentes;
- em backups, quando aplicável.

As chaves criptográficas devem possuir controles próprios e não ficar expostas no código-fonte.

## 12. Controle de acesso

O acesso seguirá JUR-05.

> **Nenhum membro, diretor, parceiro, voluntário ou colaborador possui acesso automático aos arquivos.**

Apenas profissionais e funções formalmente autorizados, dentro da necessidade de sua atividade.

## 13. Acesso técnico

A equipe técnica não terá acesso ao conteúdo por padrão.

Acesso excepcional:

- indispensável;
- autorizado;
- limitado;
- registrado;
- auditável;
- temporário quando possível.

## 14. Compartilhamento externo

O envio de arquivo para órgão público, profissional ou outra entidade somente ocorrerá quando houver:

- finalidade definida;
- destinatário legítimo;
- base jurídica aplicável;
- necessidade;
- segurança;
- autorização pelo fluxo institucional;
- registro.

Não usar:

- contas pessoais;
- e-mail pessoal;
- armazenamento pessoal;
- mensageiros pessoais;

para transportar arquivos sensíveis fora de fluxo formalmente aprovado.

## 15. Órgãos e autoridades

A FAM poderá encaminhar informações a órgãos ou serviços competentes quando houver fundamento jurídico e necessidade, conforme JUR-02 e OC-01.

Exemplos possíveis, conforme o caso:

- CRAS;
- Ministério Público;
- delegacias;
- serviços de saúde;
- demais autoridades ou serviços legalmente competentes.

A lista não constitui autorização automática.

## 16. Download

Sempre que possível, preferir visualização controlada a download.

Downloads deverão:

- ser autorizados pelo perfil;
- ser registrados;
- possuir finalidade;
- ser minimizados.

## 17. Compartilhamento por link

Links públicos permanentes são proibidos para arquivos sensíveis.

Quando tecnicamente necessário:

- link privado;
- autenticação;
- expiração;
- controle de acesso;
- registro;
- revogação.

## 18. Retenção

A retenção deverá considerar a finalidade.

### Classe A — orientação sem atendimento continuado

**Retenção operacional proposta: até 30 dias**, salvo necessidade juridicamente justificada.

Após o prazo:

- excluir arquivo;
- eliminar referências desnecessárias;
- manter somente registros mínimos necessários à auditoria, segurança ou obrigação aplicável.

### Classe B — atendimento/encaminhamento

**Retenção proposta: durante o período necessário ao atendimento e à finalidade documentada**, com revisão periódica.

O prazo definitivo deverá ser definido pela política institucional de retenção e pelo enquadramento jurídico de cada processo.

### Classe C — obrigação legal, defesa de direitos ou determinação de autoridade

Reter pelo período necessário à finalidade que justificou a conservação.

A classificação deve ser registrada.

## 19. Regra contra retenção indefinida

> **“Pode ser útil algum dia” não é justificativa suficiente para retenção indefinida.**

Toda retenção prolongada deverá possuir justificativa documentada.

## 20. Exclusão

A exclusão deverá considerar:

- arquivo principal;
- cópias;
- cache;
- versões;
- thumbnails;
- índices;
- backups;
- logs que contenham referências;
- cópias em sistemas integrados.

A exclusão lógica não deve ser confundida automaticamente com eliminação imediata de todos os backups.

## 21. Backups

Backups deverão:

- ser protegidos;
- possuir retenção definida;
- ter acesso restrito;
- ser criptografados quando aplicável;
- possuir procedimento de restauração;
- possuir procedimento de descarte.

## 22. Exclusão segura

Quando aplicável, o descarte deverá impedir recuperação razoável do conteúdo, conforme a tecnologia utilizada.

Para armazenamento criptografado, o descarte de chaves pode ser componente do processo, mas não deve ser considerado automaticamente suficiente para todas as situações.

## 23. Solicitação da titular

A FAM deverá possuir procedimento para receber e avaliar solicitações relacionadas aos dados pessoais.

A resposta deverá considerar:

- identidade;
- legitimidade;
- finalidade;
- obrigação de conservação;
- defesa de direitos;
- restrições legais;
- segurança.

Não prometer exclusão imediata quando houver fundamento jurídico para conservação.

## 24. Conta encerrada

Encerramento de conta não significa necessariamente exclusão imediata de todos os registros.

Deverá ocorrer:

1. revogação de acesso;
2. classificação dos dados;
3. aplicação dos prazos;
4. exclusão quando cabível;
5. preservação excepcional quando juridicamente necessária.

## 25. Arquivos de crianças e adolescentes

Devem receber nível de proteção elevado.

A plataforma deverá evitar:

- coleta excessiva;
- perguntas investigativas;
- armazenamento sem finalidade;
- compartilhamento informal;
- exposição a pessoas não autorizadas.

## 26. Imagens íntimas

Não incentivar o envio.

Texto:

> **Você não precisa enviar imagens íntimas para receber orientação.**

Se um arquivo desse tipo for recebido:

- restringir acesso;
- não redistribuir;
- não copiar;
- registrar somente o necessário;
- aplicar fluxo especializado;
- avaliar retenção e compartilhamento juridicamente.

## 27. Áudio e vídeo

Áudio e vídeo devem ser tratados como potencialmente altamente reveladores.

Antes do upload:

> **Áudios e vídeos podem conter informações sobre você e outras pessoas. Envie somente se isso for necessário e seguro.**

## 28. Arquivos de terceiros

A usuária deverá ser alertada:

> **Seu arquivo pode conter dados de outras pessoas. Certifique-se de que o envio seja necessário para a finalidade informada.**

## 29. Detecção de malware

Arquivo suspeito:

> **Não foi possível aceitar este arquivo por motivos de segurança.**

Não revelar detalhes técnicos que possam facilitar evasão dos controles.

## 30. Falha no processamento

Não apresentar conteúdo sensível em mensagens de erro.

Preferir:

> **Não foi possível processar este arquivo. Tente novamente com um arquivo compatível.**

## 31. Auditoria

Registrar, quando aplicável:

- upload;
- download;
- visualização;
- compartilhamento;
- alteração;
- exclusão;
- tentativa de acesso;
- alteração de permissão.

## 32. Rastreabilidade

Cada arquivo deverá possuir:

- identificador;
- proprietário/titular lógico;
- finalidade;
- classificação;
- data de entrada;
- origem;
- política de retenção;
- estado;
- histórico de acesso.

## 33. Estado do arquivo

Modelo:

```text
UPLOADED
   ↓
SCANNING
   ↓
APPROVED / REJECTED
   ↓
STORED
   ↓
ACCESSED / SHARED
   ↓
RETENTION_REVIEW
   ↓
DELETED / LEGALLY_PRESERVED
```

## 34. Requisitos técnicos

- **POL-ARQ-TEC-01:** validação de extensão e MIME.
- **POL-ARQ-TEC-02:** antimalware.
- **POL-ARQ-TEC-03:** criptografia em trânsito.
- **POL-ARQ-TEC-04:** criptografia em armazenamento.
- **POL-ARQ-TEC-05:** controle de acesso.
- **POL-ARQ-TEC-06:** logs.
- **POL-ARQ-TEC-07:** links privados e expiráveis.
- **POL-ARQ-TEC-08:** política de backup.
- **POL-ARQ-TEC-09:** política de exclusão.
- **POL-ARQ-TEC-10:** classificação de arquivos.
- **POL-ARQ-TEC-11:** retenção configurável.
- **POL-ARQ-TEC-12:** revisão periódica.
- **POL-ARQ-TEC-13:** segregação de ambientes.
- **POL-ARQ-TEC-14:** bloqueio de extensões perigosas.
- **POL-ARQ-TEC-15:** trilha de auditoria.

## 35. Experiência da usuária

A interface deverá evitar transformar o upload em requisito.

Texto principal:

> **O envio de arquivos é opcional.**

Texto de segurança:

> **Envie somente o que for necessário.**

Botões:

`Enviar arquivo`  
`Continuar sem arquivo`

A usuária deverá conseguir concluir a orientação sem anexar documentos quando o fluxo permitir.

## 36. Critérios de aceitação

A solução será considerada adequada quando:

- arquivos forem opcionais quando a finalidade não exigir;
- formatos e limites estiverem documentados;
- acesso for controlado;
- uploads forem verificados;
- arquivos forem criptografados;
- downloads forem auditáveis;
- retenção possuir justificativa;
- exclusão possuir procedimento;
- backups forem considerados;
- incidentes puderem ser rastreados;
- administradores não tiverem acesso automático ao conteúdo.

## 37. Governança de exceções

Qualquer exceção deverá conter:

- motivo;
- responsável;
- aprovação;
- prazo;
- escopo;
- registro;
- revisão.

## 38. Documentos relacionados

- JUR-01 — Fluxos Especiais de Proteção;
- JUR-02 — Bases Jurídicas, Finalidades e Compartilhamento;
- JUR-03 — Atendimento e Não Revitimização;
- JUR-04 — Incidentes e Violações;
- JUR-05 — Responsabilidades e RACI;
- OC-01 — Matriz de Órgãos e Encaminhamento;
- OC-04 — Matriz de Situações de Risco.

## 39. Próxima etapa

Após validação desta política:

**Revisão cruzada completa dos documentos JUR-01 a JUR-05 + OC-04 + POL-ARQ-01.**

Objetivos:

- eliminar conflitos;
- conferir coerência jurídica;
- conferir coerência técnica;
- conferir coerência de UX;
- verificar retenção;
- verificar acessos;
- verificar compartilhamentos;
- fechar os requisitos para desenvolvimento.

## 40. Aprovação

| Área | Status |
|---|---|
| Direção FAM | Pendente |
| Assessoria jurídica | Pendente |
| Proteção de dados / encarregado | Pendente |
| Segurança da informação | Pendente |
| Tecnologia | Pendente |
| UX/UI | Pendente |

## 41. Princípio final

> **Arquivo sensível não deve ser tratado como simples anexo. Ele é um ativo de alto risco que exige finalidade, acesso controlado, retenção justificada, rastreabilidade e descarte seguro.**
