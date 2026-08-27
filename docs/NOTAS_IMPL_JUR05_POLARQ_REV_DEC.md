# Notas de implementação — JUR-05 / POL-ARQ-01 / REV-01 / REV-02 / DEC-01

## Decisões vinculantes para o código

- Pertencer à FAM ou possuir cargo não concede acesso a conteúdo sensível.
- Acesso deve combinar usuário, função, necessidade, finalidade, credenciamento, permissão, caso e auditoria.
- Administração técnica é diferente de leitura de casos.
- Acesso excepcional deve exigir justificativa, autorização, escopo, prazo, registro e revisão.
- Arquivos são opcionais para orientação inicial; somente o necessário deve ser enviado.
- Compartilhamento exige destinatário, finalidade, fundamento, seleção mínima, responsável e registro.
- Retenção deve ser separada por classes: R1 respostas, R2 arquivos, R3 atendimento/encaminhamento, R4 segurança/auditoria e R5 incidentes/violações. Não usar 30 dias como prazo universal.
- Legal hold suspende exclusão apenas do conjunto necessário.
- Fluxo de criança/adolescente não deve investigar, pedir narrativa detalhada ou classificar crime; deve priorizar proteção e rede competente.
- Textos devem usar orientação, sinais de atenção, possível situação de risco, encaminhamento e rede competente; evitar diagnóstico, laudo, prova, crime confirmado e investigação.
- Textos críticos devem ser versionados e aprovados, não hardcoded sem governança.

## Estado actual identificado

- FAM024 criou credenciamento profissional com validade, finalidade, escopo, MFA e auditoria.
- AdminSidebar/TabRouter já receberam integração do tab fam-credenciamento na alteração local em andamento.
- A RPC fam_can_access_sensitive_content deve exigir aal2 e finalidade compatível.
- O código deve continuar sem activar credenciais automaticamente.

## Bloqueadores institucionais ainda não convertidos em autorização automática

- Bases jurídicas concretas dependem de validação jurídica.
- Prazos finais de retenção dependem de aprovação institucional.
- Responsáveis RACI precisam ser designados por função, não nomes improvisados.
- Fluxo jurídico operacional para criança/adolescente precisa de homologação final.

## Próximas entregas técnicas

1. Concluir integração visual do painel no AdminSidebar e guard de módulo.
2. Validar serviço MFA e testes RPC com ambiente de homologação.
3. Implementar ciclo de vida de arquivos, legal hold e retenção configurável sem apagar dados.
4. Adicionar catálogo versionado de bases/finalidades e controles de compartilhamento granular.
5. Revisar textos críticos e registrar versão/aprovação.
