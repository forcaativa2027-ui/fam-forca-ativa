# Caderno de Protocolos Institucionais e Pendências
## Liberação do Atendimento 24 Horas — FAM

**Versão:** 1.0  
**Instituição:** FAM — Força Ativa da Mulher  
**Escopo:** Fale Conosco, chat próprio, Análise de Risco orientativa e encaminhamento humano  
**Status:** Preparação para homologação — não liberar atendimento real até concluir os itens bloqueantes

> **Aviso de governança:** este documento é uma base de organização operacional e técnica. Não substitui revisão por advogado, psicóloga responsável, profissional de proteção de dados ou autoridade pública competente. A plataforma não deve concluir se houve crime, emitir diagnóstico, produzir laudo ou substituir emergência policial, saúde, assistência social ou a rede oficial de proteção.

## 1. Decisão de liberação

O atendimento 24 horas só deve ser anunciado como operacional depois que a FAM comprovar simultaneamente equipe disponível em todos os turnos, supervisão, protocolo de risco, canais de escalonamento, proteção dos dados, testes técnicos e registro formal da aprovação institucional.

A existência das tabelas e do bucket privado no Supabase confirma apenas a infraestrutura básica. Ela não comprova que exista plantão, que os profissionais estejam habilitados, que haja supervisão ou que o encaminhamento funcione fora do horário administrativo.

### Critério go/no-go

| Área | Go somente quando | Status atual |
|---|---|---|
| Governança | Diretoria aprovar responsável, escopo, limites e protocolo | Pendente |
| Plantão 24h | Escala nominal, cobertura, substituta e supervisora por turno | Pendente |
| Equipe | Habilitação, treinamento, termo de confidencialidade e acesso individual | Pendente |
| Emergência | Fluxo para risco imediato, 190, 192, 193 e Ligue 180 validado | Pendente |
| Proteção de dados | Base legal, aviso de privacidade, retenção, eliminação e resposta a incidentes definidos | Pendente |
| Segurança técnica | RLS, MFA da equipe, logs, armazenamento privado e testes de acesso aprovados | Parcial — estrutura criada |
| Chat | Fila, assumir, responder, pausar, escalar e encerrar testados | Pendente de homologação |
| Análise de Risco | Perguntas, linguagem, limites e encaminhamento revisados por profissional responsável | Pendente |
| Anexos | Tipos, tamanho, varredura, retenção, acesso e exclusão definidos | Parcial — fluxo técnico inicial |
| Homologação | Testes com dados fictícios e aceite formal registrados | Pendente |

## 2. Protocolo institucional mínimo

### 2.1 Responsabilidade e limites do serviço

A FAM deve publicar internamente uma decisão que defina o serviço como acolhimento, orientação inicial e encaminhamento. O texto deve proibir promessas de proteção, garantia de sigilo absoluto, conclusões sobre autoria ou materialidade do fato e orientação que possa aumentar o risco da usuária.

A interface deve informar, em linguagem simples, que o chat não é canal de emergência. Situações de perigo atual devem ser direcionadas imediatamente aos serviços oficiais. O Ligue 180 é uma central nacional de orientação e denúncia, disponível 24 horas, e o 190 deve ser indicado para emergência policial imediata.[1] [2]

### 2.2 Responsável institucional

A FAM deve designar formalmente:

| Função | Responsabilidade |
|---|---|
| Responsável pelo programa | Aprovar escopo, orçamento, horários e indicadores. |
| Coordenação técnica | Administrar sistema, acessos, backups, incidentes e fornecedores. |
| Coordenação de atendimento | Supervisionar fila, scripts, qualidade e escalonamentos. |
| Supervisora de turno | Apoiar decisões difíceis e assumir casos críticos. |
| Responsável por proteção de dados | Coordenar privacidade, solicitações de titulares e incidentes. |
| Responsável clínico/psicológico | Revisar linguagem de acolhimento e limites de atuação psicológica. |
| Responsável jurídico | Revisar termos, consentimentos, encaminhamentos e retenção. |

Uma mesma pessoa pode acumular funções apenas se a FAM registrar a justificativa, os conflitos de interesse e a cobertura de substituição.

## 3. Protocolo de plantão 24 horas

### 3.1 Escala

A escala deve conter nome ou identificador profissional, horário de início e fim, contato de substituição, supervisora responsável e confirmação de presença. Não basta declarar “24 horas” sem cobertura comprovada.

Cada turno deve ter pelo menos uma atendente habilitada e uma pessoa de retaguarda. Para períodos de maior risco, a FAM deve definir quando duas pessoas são obrigatórias. A supervisora deve ser alcançável por telefone seguro e ter autoridade para pausar, escalar ou encerrar uma conversa.

### 3.2 Abertura e encerramento de turno

No início do turno, a atendente deve confirmar identidade, MFA, dispositivo autorizado, conexão segura, disponibilidade e leitura do protocolo. Ao terminar, deve transferir atendimentos abertos, registrar pendências e encerrar a sessão. Contas compartilhadas são proibidas.

### 3.3 Tempo de resposta

A FAM deve estabelecer metas realistas e publicá-las como expectativa, não como garantia de proteção. Recomenda-se medir tempo até primeira resposta, tempo até assumir a conversa, tempo de escalonamento e tempo de encerramento. Se não houver atendente disponível, a interface deve informar a situação e exibir encaminhamentos oficiais, sem fingir atendimento humano ativo.

## 4. Protocolo de triagem e Análise de Risco

A Análise de Risco deve ser chamada de **triagem orientativa**. O sistema pode organizar informações fornecidas pela usuária e identificar necessidade de atenção, mas não deve afirmar “houve crime”, “não houve crime”, “o agressor é culpado” ou “a vítima está segura”.

### 4.1 Perguntas mínimas

| Tema | Pergunta funcional | Conduta de interface |
|---|---|---|
| Perigo atual | “Você está em perigo agora ou teme que algo aconteça nas próximas horas?” | Exibir orientação imediata, interromper análise longa e oferecer canais oficiais. |
| Ferimento | “Há ferimento grave ou necessidade de atendimento médico urgente?” | Orientar serviço de emergência adequado; não diagnosticar. |
| Arma ou ameaça | “Há arma, ameaça de morte ou impedimento de sair?” | Prioridade máxima e encaminhamento humano, sem pedir confronto ou coleta arriscada. |
| Violência sexual | “Houve violência sexual ou contato sem consentimento?” | Linguagem não culpabilizante e encaminhamento especializado. |
| Criança/adolescente | “Há criança ou adolescente em risco?” | Escalonar conforme protocolo institucional e rede oficial; não investigar pelo chat. |
| Local seguro | “É seguro continuar conversando neste dispositivo?” | Oferecer saída rápida, texto neutro e opção de pausar. |
| Preferência | “Você deseja falar com uma atendente?” | Criar encaminhamento humano sem condicionar ajuda à entrega de provas. |

### 4.2 Regras de decisão

| Sinal | Classificação interna | Ação obrigatória |
|---|---|---|
| Perigo atual, arma, ameaça de morte ou ferimento grave | `immediate` | Orientar emergência, oferecer atendente e registrar escalonamento. |
| Violência recente ou risco relevante sem perigo atual confirmado | `relevant` | Encaminhar para atendente especializada e rede adequada. |
| Necessidade de apoio psicológico, jurídico ou social sem urgência aparente | `specialized` | Encaminhar ao serviço correspondente. |
| Informação insuficiente | `insufficient_information` | Não inferir segurança; oferecer conversa humana e orientações gerais. |

A classificação não deve ser exibida como diagnóstico ou veredito. A tela deve usar expressões como “sinais que merecem atenção” e “a informação fornecida não permite concluir o que ocorreu”.

### 4.3 Evidências e anexos

A FAM não deve exigir foto, vídeo, áudio ou documento para iniciar acolhimento. A usuária deve ser alertada para não se colocar em risco coletando material e para não manter arquivos no dispositivo se isso puder ser descoberto pelo agressor.

Antes de aceitar anexos reais, devem estar definidos: tipos permitidos, tamanho máximo, criptografia em trânsito e repouso, varredura antimalware, status de quarentena, prazo de retenção, quem pode abrir, registro de acesso, exclusão e resposta a arquivo malicioso. Enquanto esses itens não forem aprovados, o upload deve permanecer desativado em produção ou limitado a homologação.

## 5. Protocolo de atendimento humano

A atendente deve começar verificando se é seguro conversar. Ela deve usar linguagem acolhedora, não culpabilizante e não investigativa. Não deve pressionar a usuária a relatar detalhes, confrontar suspeitos, prometer resultado, recomendar encontro presencial inseguro ou orientar publicação de provas.

### Fluxo recomendado

1. **Acolher:** reconhecer a procura e agradecer a confiança, sem validar fatos ainda não apurados como conclusão jurídica.
2. **Verificar segurança:** perguntar se é seguro continuar e se há risco atual.
3. **Reduzir exposição:** evitar solicitar nome completo, endereço exato ou dados desnecessários.
4. **Entender necessidade:** identificar se a usuária busca segurança, informação, apoio emocional ou encaminhamento.
5. **Encaminhar:** oferecer rede adequada e canais oficiais, conforme o protocolo aprovado.
6. **Escalonar:** chamar supervisora em risco imediato, dúvida ética, ameaça, criança em risco ou falha de comunicação.
7. **Registrar minimamente:** documentar apenas o necessário, sem opiniões pessoais ou juízo sobre credibilidade.
8. **Encerrar com segurança:** combinar próximo passo, confirmar se a conversa pode ser encerrada e informar como retornar.

## 6. Encaminhamentos oficiais

A interface deve manter os contatos configuráveis pela FAM e validá-los periodicamente. No contexto brasileiro, a documentação oficial informa o Ligue 180 como canal de orientação e denúncia 24 horas, com ligação e outros canais oficiais.[1] Para perigo policial imediato, o 190 deve ser apresentado como emergência policial, não como atendimento da FAM.[2]

A FAM deve validar localidade, disponibilidade e adequação de outros canais antes de publicá-los. O sistema não deve exibir telefone de voluntária, número pessoal de atendente ou contato sem autorização formal.

## 7. Privacidade e proteção de dados

Relatos de violência, informações de saúde, áudio, vídeo, fotos e documentos podem envolver dados pessoais de alto risco. A FAM deve definir finalidade, necessidade, base legal, acesso, retenção, eliminação e resposta a solicitações dos titulares. A LGPD disciplina o tratamento de dados pessoais, inclusive em meios digitais, e prevê atenção especial aos dados sensíveis.[3] [4]

### Controles mínimos

| Controle | Requisito |
|---|---|
| Minimização | Coletar somente o necessário para acolhimento e encaminhamento. |
| Consentimento informado | Explicar finalidade, limites e possibilidade de encaminhamento antes da coleta, quando aplicável. |
| Acesso | Acesso por função, perfil individual e necessidade de saber. |
| Autenticação | MFA obrigatório para atendentes, supervisão e administração. |
| Logs | Registrar acesso, alteração, download, encaminhamento e exclusão. |
| Retenção | Definir prazo por tipo de dado; não guardar indefinidamente. |
| Exclusão | Permitir rotina aprovada de eliminação e tratamento de backups. |
| Incidentes | Definir detecção, contenção, avaliação, comunicação e documentação. |
| Fornecedores | Formalizar responsabilidades com Supabase, Vercel e demais serviços. |
| Privacidade por design | Manter bucket privado, RLS, URLs temporárias e sem exposição em logs. |

A FAM deve nomear quem atenderá solicitações relacionadas a dados e quem avaliará incidentes. A revisão jurídica e de proteção de dados é obrigatória antes de coletar casos reais em escala.

## 8. Segurança técnica para a implantação

O Supabase já confirmou as seis tabelas funcionais e o bucket privado `fam-attachments`. Antes da produção, a equipe técnica deve verificar se as políticas RLS realmente impedem que uma usuária leia conversa, resposta, caso ou anexo de outra pessoa. Também deve confirmar que atendentes só acessam o que corresponde à sua função e que administradores não recebem acesso irrestrito sem justificativa.

O teste mínimo deve usar duas contas de usuária, duas contas de atendente e uma conta administrativa fictícias. Cada conta deve tentar ler, inserir, atualizar e baixar registros fora de sua autorização. O resultado deve ser documentado com data, ambiente, conta de teste e evidência.

A aplicação deve configurar, no ambiente da Vercel, somente variáveis públicas necessárias no frontend. Chaves administrativas, senhas de banco, tokens e `service_role` nunca devem ser enviadas ao navegador ou gravadas no GitHub.

## 9. Homologação funcional obrigatória

| Cenário | Resultado esperado |
|---|---|
| Usuária cria conversa | Conversa aparece com referência pública e status `waiting`. |
| Usuária envia mensagem | Mensagem aparece para a própria usuária e para a atendente autorizada. |
| Atendente abre fila | Conversas não atribuídas aparecem somente para atendentes ativas. |
| Duas atendentes clicam “Assumir” | Apenas uma consegue assumir; a outra recebe retorno seguro. |
| Atendente responde | Resposta aparece em tempo real e fica registrada. |
| Atendimento pausado | Status e motivo ficam claros; retomada exige perfil autorizado. |
| Conversa encerrada | Não permite novas mensagens indevidas e registra encerramento. |
| Triagem sem risco imediato | Mostra orientação, limites e CTA para atendimento humano. |
| Triagem com risco imediato | Exibe orientação de emergência e encaminhamento sem concluir crime. |
| Upload permitido | Arquivo vai para bucket privado e fica pendente de varredura. |
| Usuária tenta acessar anexo de outra | Acesso é negado. |
| Atendente sem autorização tenta abrir anexo | Acesso é negado. |
| Plantão sem atendente | Sistema não simula disponibilidade; mostra encaminhamentos oficiais. |
| Saída rápida | A usuária consegue deixar a tela sem depender do histórico do navegador. |

## 10. Pendências bloqueantes da FAM

1. Aprovar formalmente o escopo e os limites do atendimento.
2. Nomear coordenação, supervisão, responsável técnico e responsável por privacidade.
3. Definir equipe habilitada, treinamento obrigatório, termo de confidencialidade e critérios de suspensão.
4. Criar escala 24 horas real, com substituição e supervisão por turno.
5. Aprovar protocolo de emergência e escalonamento para risco imediato.
6. Validar scripts e perguntas da Análise de Risco com psicóloga responsável e revisão jurídica.
7. Definir política de retenção, eliminação, solicitação de titular e incidentes.
8. Homologar RLS, MFA, logs, armazenamento privado e acesso a anexos.
9. Definir limites técnicos para tamanho, formato, varredura e quarentena de arquivos.
10. Criar contas de teste separadas e executar a matriz de homologação.
11. Validar variáveis da Vercel e o projeto Supabase de produção/homologação.
12. Aprovar textos públicos, canais oficiais, disponibilidade e expectativa de resposta.
13. Registrar aceite formal da diretoria para ativação gradual.

## 11. Plano de liberação em etapas

### Etapa A — Homologação fechada

Usar somente dados fictícios, equipe interna e contas de teste. O chat pode ser exercitado sem divulgar atendimento 24 horas. Upload real permanece bloqueado até aprovação do protocolo de anexos.

### Etapa B — Piloto controlado

Liberar para um grupo pequeno, em janela definida, com supervisão nominal e monitoramento diário. O texto público deve dizer que é um piloto ou atendimento em implantação, se a cobertura ainda não for integral.

### Etapa C — Operação 24 horas

Liberar somente depois do aceite institucional, escala comprovada, protocolo assinado, segurança validada e teste de encaminhamento realizado em todos os turnos. A FAM deve manter revisão periódica dos indicadores e incidentes.

## 12. Indicadores após liberação

Os indicadores devem medir qualidade e segurança, não pressionar atendentes a encerrar conversas rapidamente. Recomenda-se acompanhar tempo até primeira resposta, abandonos, escalonamentos, indisponibilidade, falhas de upload, solicitações de exclusão, incidentes e avaliação voluntária da experiência.

Nenhum indicador deve ser usado para inferir culpa, veracidade do relato ou desempenho psicológico da usuária. Relatórios devem ser agregados e evitar reidentificação.

## Referências

[1]: https://www.gov.br/mulheres/pt-br/ligue180 "Ligue 180 — Central de Atendimento à Mulher — Gov.br"
[2]: https://www.gov.br/pt-br/servicos/denunciar-e-buscar-ajuda-a-vitimas-de-violencia-contra-mulheres "Denunciar e buscar ajuda a vítimas de violência contra mulheres — Gov.br"
[3]: https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm "Lei Geral de Proteção de Dados Pessoais — Lei nº 13.709/2018 — Planalto"
[4]: https://www.gov.br/saude/pt-br/acesso-a-informacao/lgpd "Lei Geral de Proteção de Dados Pessoais — Ministério da Saúde"
