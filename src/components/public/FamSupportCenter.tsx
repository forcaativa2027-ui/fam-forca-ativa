"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, LogOut, MessageCircle, Phone, ShieldAlert, Send, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFamAttachments, useFamConversations, useFamMessages, useFamRiskCase } from "@/hooks/useFamSupport";
import type { FamAttachment } from "@/services/famAttachments";
import type { FamConversation } from "@/services/famSupport";
import type { FamReferralRequest } from "@/services/famReferralRequests";
import { FileUploader } from "@/components/ui/FileUploader";
import { supabase } from "@/lib/supabase";
import {
  FAM_RISK_QUESTIONS,
  evaluateFamRisk,
  type FamRiskAnswerValue,
} from "@/services/famRiskEngine";
import {
  resolveFamReferralOptions,
  type FamReferralOption,
} from "@/services/famReferrals";
import { stateForEvaluation, type FamAssessmentState } from "@/services/famAssessmentState";
import { createRiskAuditEvent, transitionRiskAssessment } from "@/services/famRiskStateMachine";
import { recordFamRiskAuditEvents } from "@/services/famRiskAudit";
import { decideFamProtection } from "@/services/famProtectionFlow";

const EMERGENCY_180 = "180";
const EMERGENCY_190 = "190";

function getFamAttachmentStatus(attachment: FamAttachment): { label: string; selectable: boolean; className: string } {
  const expired = Boolean(attachment.retention_expires_at && Date.parse(attachment.retention_expires_at) <= Date.now());
  if (expired || attachment.deleted_at) return { label: "Expirado ou removido — não pode ser selecionado", selectable: false, className: "text-fam-muted" };
  if (attachment.malware_scan_status === "clean") return { label: "Limpo — disponível para encaminhamento", selectable: true, className: "text-fam-success" };
  if (attachment.malware_scan_status === "pending") return { label: "Em quarentena — aguardando verificação", selectable: false, className: "text-fam-muted" };
  return { label: "Bloqueado — falha ou ameaça identificada", selectable: false, className: "text-fam-danger" };
}

function getFamReferralStatusLabel(status: FamReferralRequest["status"]): string {
  const labels: Record<FamReferralRequest["status"], string> = {
    requested: "Pedido registrado",
    under_review: "Em revisão pela atendente",
    sent: "Enviado ao destinatário",
    received: "Recebimento confirmado",
    cancelled: "Cancelado",
  };
  return labels[status] ?? "Em atualização";
}

function getFamConversationStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    waiting: "Aguardando atendente",
    in_progress: "Em atendimento",
    paused_safe_contact: "Pausada por segurança",
    referred: "Encaminhada",
    resolved: "Resolvida",
    closed: "Encerrada",
    escalated: "Escalada",
  };
  return labels[status] ?? "Em atualização";
}

export function FamSafetyNotice() {
  const [hidden, setHidden] = useState(false);
  if (hidden) return (
    <Button variant="outline" size="sm" onClick={() => setHidden(false)}>
      Mostrar aviso de segurança
    </Button>
  );
  return (
    <Card className="border-fam-danger/30 bg-fam-danger/5">
      <CardContent className="flex items-start gap-3 p-4">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-fam-danger" />
        <div className="min-w-0 flex-1 text-sm text-fam-deep-plum">
          <p className="font-semibold">Você está em segurança para continuar?</p>
          <p className="mt-1">
            Se houver perigo imediato, afaste-se quando puder e ligue <b>{EMERGENCY_190}</b>.
            Para orientação sobre violência contra a mulher, ligue <b>{EMERGENCY_180}</b>.
            Este site não é um serviço de emergência.
          </p>
        </div>
        <Button variant="ghost" size="icon" aria-label="Ocultar aviso" onClick={() => setHidden(true)}>
          <X className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

export function QuickExit() {
  const handleQuickExit = () => {
    if (typeof window !== "undefined") {
      window.location.replace("https://www.google.com/");
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="gap-2 border-fam-danger/40 text-fam-danger"
      onClick={handleQuickExit}
      title="Sai rapidamente desta página; isso não apaga o histórico do navegador"
    >
      <LogOut className="h-4 w-4" />
      Sair rapidamente
    </Button>
  );
}

export function FamContactPage() {
  const [started, setStarted] = useState(false);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [name, setName] = useState("");
  const [safe, setSafe] = useState(false);
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [authLoading, setAuthLoading] = useState(true);
  const [convId, setConvId] = useState<string | undefined>(undefined);

  const { conversations, startConversation, loading: convLoading } = useFamConversations(userId);
  const { messages, sendMessage, loading: msgLoading } = useFamMessages(convId);
  const resumableConversation = conversations.find((conversation) => !["closed", "resolved"].includes(conversation.status));

  // Get current user on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    }).finally(() => setAuthLoading(false));
  }, []);

  // Auto-select latest conversation if not started
  useEffect(() => {
    if (started && conversations.length > 0 && !convId) {
      setConvId(conversations[0].id);
    }
  }, [started, conversations, convId]);

  const handleStart = async () => {
    if (!userId || !safe) return;
    try {
      const conv = await startConversation({
        user_id: userId,
        contact_name: name || undefined,
      });
      setConvId(conv.id);
      setStarted(true);
    } catch (e) {
      console.error("Erro ao iniciar conversa:", e);
      alert("Erro ao iniciar conversa. Tente novamente.");
    }
  };

  const handleSend = async () => {
    if (!message.trim() || !convId || !userId) return;
    try {
      await sendMessage(message.trim(), userId);
      setMessage("");
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    } catch (e) {
      console.error("Erro ao enviar:", e);
      alert("Erro ao enviar mensagem.");
    }
  };

  const handleResumeConversation = (conversation: FamConversation) => {
    setConvId(conversation.id);
    setName(conversation.contact_name ?? "");
    setStarted(true);
    setSent(false);
  };

  const handleExit = () => {
    setStarted(false);
    setConvId(undefined);
    setMessage("");
    setSent(false);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-6">
      <div className="flex justify-end">
        <QuickExit />
      </div>
      <FamSafetyNotice />
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">FAM · acolhimento</p>
        <h1 className="mt-2 font-display text-3xl text-fam-plum">Fale Conosco</h1>
        <p className="mt-2 max-w-2xl text-sm text-fam-muted">
          Converse com uma pessoa da equipe de atendimento da FAM. Você pode parar, pedir uma pausa
          ou solicitar encaminhamento a qualquer momento.
        </p>
      </div>

      {!started ? (
        <>
          {resumableConversation && (
            <Card className="border-fam-gold/30 bg-fam-gold-soft/10">
              <CardHeader>
                <CardTitle>Retomar atendimento</CardTitle>
                <CardDescription>Encontramos uma conversa que ainda pode continuar com segurança.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-fam-deep-plum">
                  Status atual: <b>{getFamConversationStatusLabel(resumableConversation.status)}</b> · referência <b>{resumableConversation.public_reference}</b>.
                </p>
                <Button onClick={() => handleResumeConversation(resumableConversation)} className="w-full gap-2">
                  <MessageCircle className="h-4 w-4" /> Retomar esta conversa
                </Button>
              </CardContent>
            </Card>
          )}
          <Card>
          <CardHeader>
            <CardTitle>Iniciar conversa</CardTitle>
            <CardDescription>
              O atendimento depende de uma pessoa habilitada estar disponível. Nunca compartilhe algo
              que coloque você em mais risco.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fam-name">Como podemos chamar você? (opcional)</Label>
              <Input
                id="fam-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome ou apelido"
              />
            </div>
            <label className="flex items-start gap-3 rounded-lg border p-3 text-sm">
              <input
                type="checkbox"
                checked={safe}
                onChange={(e) => setSafe(e.target.checked)}
                className="mt-1"
              />
              <span>
                Estou em uma condição razoavelmente segura para conversar agora e entendo que este
                chat não substitui emergência policial, atendimento médico ou orientação jurídica.
              </span>
            </label>
            {authLoading ? (
              <Button disabled className="w-full gap-2">
                Verificando sua sessão...
              </Button>
            ) : userId ? (
              <Button
                disabled={!safe || convLoading}
                onClick={handleStart}
                className="w-full gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                {convLoading ? "Conectando..." : "Entrar na fila de atendimento"}
              </Button>
            ) : (
              <div className="space-y-2">
                <p className="text-xs leading-relaxed text-fam-muted">
                  Para proteger a conversa e permitir que você retome o atendimento, entre na sua conta antes de iniciar.
                </p>
                <Button asChild disabled={!safe} className="w-full gap-2">
                  <Link href="/entrar?next=/fale-conosco">
                    <LogOut className="h-4 w-4 rotate-180" /> Entrar para iniciar atendimento
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                  <CardTitle>Conversa protegida</CardTitle>
                  <CardDescription>
                    {name ? `Olá, ${name}. ` : ""}
                    {messages.length > 0
                      ? "Mensagens carregadas."
                      : "Aguardando mensagens..."}
                  </CardDescription>
                  <p className="mt-2 text-xs text-fam-muted" aria-live="polite">
                    Status operacional: <b>{getFamConversationStatusLabel(conversations.find((conversation) => conversation.id === convId)?.status ?? "waiting")}</b>.
                  </p>
              </div>
              <span className="rounded-full bg-fam-soft-pink px-2 py-1 text-xs font-medium text-fam-plum">
                {getFamConversationStatusLabel(conversations.find((conversation) => conversation.id === convId)?.status ?? "waiting")}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {messages.length === 0 ? (
                <div className="rounded-lg bg-fam-lavender p-4 text-sm text-fam-muted text-center">
                  Nenhuma mensagem ainda. Comece a conversa abaixo.
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_user_id ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                        msg.sender_user_id
                          ? "bg-fam-magenta text-white"
                          : "bg-fam-soft-pink text-fam-deep-plum"
                      }`}
                    >
                      {msg.body}
                    </div>
                  </div>
                ))
              )}
            </div>

            {sent && (
              <div role="status" aria-live="polite" className="flex items-center gap-2 rounded-lg bg-fam-success/10 p-3 text-sm text-fam-success">
                <CheckCircle2 className="h-4 w-4" />
                Mensagem registrada para atendimento.
              </div>
            )}

            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <label htmlFor="fam-message" className="sr-only">Mensagem para a atendente</label>
                <textarea
                  id="fam-message"
                  aria-describedby="fam-message-help"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  placeholder="Escreva somente o que você se sente segura para compartilhar."
                  className="flex-1 rounded-md border bg-background p-3 text-sm"
                  disabled={msgLoading}
                />
                <span id="fam-message-help" className="sr-only">Compartilhe somente o que você se sente segura para informar.</span>
                <Button
                  disabled={!message.trim() || msgLoading}
                  onClick={handleSend}
                  className="gap-2 shrink-0"
                >
                  <Send className="h-4 w-4" />
                  Enviar
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={handleExit}>
                  Sair da conversa
                </Button>
                <Button variant="outline" asChild>
                  <a href="tel:190">
                    <Phone className="mr-2 h-4 w-4" /> Emergência 190
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="tel:180">
                    <Phone className="mr-2 h-4 w-4" /> Ligue 180
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <p className="text-xs leading-relaxed text-fam-muted">
        O chat apresentado nesta etapa é uma interface inicial. Para produção, a FAM ainda precisa
        aprovar protocolo de emergência, escala 24 horas, equipe habilitada, política de dados e
        regras de supervisão.
      </p>
    </div>
  );
}

// --- Análise de Risco (com persistência no Supabase) ---
export function FamRiskAnalysisPage() {
  const [answers, setAnswers] = useState<Record<string, FamRiskAnswerValue>>({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [assessmentState, setAssessmentState] = useState<FamAssessmentState>("IN_PROGRESS");
  const [openContact, setOpenContact] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState<FamReferralOption | null>(null);
  const [referralConfirmed, setReferralConfirmed] = useState(false);
  const [referralRequestStatus, setReferralRequestStatus] = useState<"idle" | "requested">("idle");
  const [referralRequest, setReferralRequest] = useState<FamReferralRequest | null>(null);
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [caseId, setCaseId] = useState<string | undefined>(undefined);
  const [attachments, setAttachments] = useState<FamAttachment[]>([]);
  const [selectedAttachmentIds, setSelectedAttachmentIds] = useState<string[]>([]);
  const { listForCase } = useFamAttachments();
  const { riskCase, create, saveAnswers, submitAssessment, requestReferral, loading: riskLoading, error: riskError } = useFamRiskCase(userId);
  const evaluation = evaluateFamRisk(answers);
  const protectionDecision = decideFamProtection({ evaluation, referralConfirmed });
  const referralOptions = resolveFamReferralOptions(evaluation);
  const urgent = evaluation.emergency;
  const currentQuestion = FAM_RISK_QUESTIONS[questionIndex];
  const currentAnswer = currentQuestion ? answers[currentQuestion.key] : undefined;
  const dangerNowAffirmed = answers.danger_now === "YES";
  const canAdvance = Boolean(currentAnswer);
  const canSubmit = dangerNowAffirmed || (questionIndex === FAM_RISK_QUESTIONS.length - 1 && canAdvance);

    useEffect(() => {
    if (!caseId || !submitted) return;
    listForCase(caseId).then(setAttachments).catch(() => setAttachments([]));
  }, [caseId, submitted, listForCase]);

  useEffect(() => {
    if (!userId || !caseId) return;
    const channel = supabase
      .channel(`fam_user_referrals:${caseId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "fam_referral_requests", filter: `case_id=eq.${caseId}` },
        (payload) => {
          const updated = payload.new as FamReferralRequest;
          setReferralRequest((current) => current?.id === updated.id ? { ...current, ...updated } : current);
        },
      )
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, [caseId, userId]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);
  const handleNextQuestion = () => {
    if (!canAdvance || dangerNowAffirmed) return;
    setQuestionIndex((index) => Math.min(index + 1, FAM_RISK_QUESTIONS.length - 1));
  };

  const handlePreviousQuestion = () => {
    setQuestionIndex((index) => Math.max(index - 1, 0));
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    try {
      const attention = evaluation.attention;
      const next = stateForEvaluation(evaluation);
      // Visitantes podem concluir a orientação sem cadastro. Nesse caso,
      // respostas e resultado permanecem somente nesta sessão do navegador.
      if (userId) {
        const activeCaseId = caseId ?? (await create({ user_id: userId, contact_name: undefined })).id;
        if (!caseId) setCaseId(activeCaseId);
        const transition = transitionRiskAssessment({
          assessmentId: activeCaseId,
          actorUserId: userId,
          from: assessmentState,
          to: next.state,
          reasonCode: next.reasonCode,
          ruleCode: next.ruleCode,
        });
        await saveAnswers(activeCaseId, answers);
        await submitAssessment(activeCaseId, {
          attention,
          preliminary_summary: evaluation.summary,
          limitations_acknowledged_at: new Date().toISOString(),
          current_step: "result",
          assessment_state: next.state,
          transition_reason_code: next.reasonCode,
          transition_rule_code: next.ruleCode,
          special_flow_flags: evaluation.specialFlowFlags,
          triggered_indicators: evaluation.triggeredIndicators,
        });
        const auditEvents = [
          createRiskAuditEvent({ eventType: "ASSESSMENT_STARTED", assessmentId: activeCaseId, actorUserId: userId, state: "IN_PROGRESS" }),
          ...Object.keys(answers).map((questionCode) => createRiskAuditEvent({
            eventType: "ANSWER_RECORDED",
            assessmentId: activeCaseId,
            actorUserId: userId,
            state: "IN_PROGRESS",
            questionCode,
          })),
          ...evaluation.triggeredRules.map((ruleCode) => createRiskAuditEvent({
            eventType: "RULE_TRIGGERED",
            assessmentId: activeCaseId,
            actorUserId: userId,
            state: next.state,
            ruleCode,
          })),
          ...evaluation.specialFlowFlags.map((specialFlow) => createRiskAuditEvent({
            eventType: "SPECIAL_FLOW_TRIGGERED",
            assessmentId: activeCaseId,
            actorUserId: userId,
            state: "PROTECTION_SPECIAL",
            metadata: { specialFlow },
          })),
          transition.auditEvent,
          createRiskAuditEvent({
            eventType: "RESULT_GENERATED",
            assessmentId: activeCaseId,
            actorUserId: userId,
            state: next.state,
            metadata: {
              attention,
              rulesVersion: evaluation.rulesVersion,
              engineVersion: evaluation.engineVersion,
            },
          }),
        ];
        // Auditoria não deve impedir a orientação urgente; a falha fica registada no console técnico.
        await recordFamRiskAuditEvents(supabase, auditEvents).catch((auditError) => {
          console.error("Não foi possível persistir a auditoria da avaliação:", auditError);
        });
        setAssessmentState(next.state);
      } else {
        // Validação local da transição para a sessão sem persistência.
        const transition = transitionRiskAssessment({
          assessmentId: "local-session",
          from: assessmentState,
          to: next.state,
          reasonCode: next.reasonCode,
          ruleCode: next.ruleCode,
        });
        setAssessmentState(transition.transition.to);
      }
      setSubmitted(true);
    } catch (e) {
      console.error("Erro ao salvar análise:", e);
      alert("Não foi possível registrar a análise. A orientação local continua disponível; tente novamente quando estiver em segurança.");
    }
  };

  const handleReferralRequest = async () => {
    if (!selectedReferral || !referralConfirmed || !userId || !caseId) return;
    try {
      const createdRequest = await requestReferral(caseId, userId, selectedReferral, referralConfirmed, selectedAttachmentIds);
      setReferralRequest(createdRequest);
      setReferralRequestStatus("requested");
    } catch (e) {
      console.error("Erro ao registrar encaminhamento:", e);
      alert("Não foi possível registrar o pedido. Nenhum dado foi enviado ao destinatário.");
    }
  };

  const handleRestart = () => {
    setAnswers({});
    setQuestionIndex(0);
    setAttachments([]);
    setSelectedAttachmentIds([]);
    setSubmitted(false);
    setAssessmentState("IN_PROGRESS");
    setSelectedReferral(null);
    setReferralConfirmed(false);
    setReferralRequestStatus("idle");
    setReferralRequest(null);
    setCaseId(undefined);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-6">
      <div className="flex justify-end">
        <QuickExit />
      </div>
      <FamSafetyNotice />
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">FAM · orientação inicial</p>
        <h1 className="mt-2 font-display text-3xl text-fam-plum">Análise de Risco</h1>
        <p className="mt-2 text-sm text-fam-muted">
          Responda apenas o que puder com segurança. Esta ferramenta organiza sinais de atenção e
          não confirma nem descarta crime, não produz laudo e não substitui polícia, emergência,
          saúde ou atendimento profissional.
        </p>
      </div>
      {!submitted ? (
        <Card>
          <CardHeader>
            <CardTitle>Como você está agora?</CardTitle>
            <CardDescription>
              Se não souber ou não quiser responder, escolha "Prefiro não responder".
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {currentQuestion && (
              <fieldset className="space-y-3" aria-describedby={`fam-source-${currentQuestion.key}`}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-fam-muted">
                    Pergunta {questionIndex + 1} de {FAM_RISK_QUESTIONS.length}
                  </p>
                  <p className="text-xs text-fam-muted">Coleta progressiva</p>
                </div>
                <legend className="text-sm font-medium text-fam-deep-plum">{currentQuestion.text}</legend>
                <p id={`fam-source-${currentQuestion.key}`} className="text-xs text-fam-muted">
                  Referência metodológica: {currentQuestion.source}
                </p>
                <div className="flex flex-wrap gap-2" role="group" aria-label={`Respostas para: ${currentQuestion.text}`}>
                  {currentQuestion.options.map(({ value, label }) => (
                    <Button
                      key={value}
                      type="button"
                      variant={answers[currentQuestion.key] === value ? "default" : "outline"}
                      size="sm"
                      aria-pressed={answers[currentQuestion.key] === value}
                      onClick={() => setAnswers((prev) => ({ ...prev, [currentQuestion.key]: value }))}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </fieldset>
            )}
            {dangerNowAffirmed && (
              <div role="alert" className="rounded-lg border border-fam-danger/30 bg-fam-danger/10 p-3 text-sm text-fam-deep-plum">
                Você indicou perigo actual. A orientação imediata será apresentada sem prolongar esta triagem.
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {questionIndex > 0 && (
                <Button type="button" variant="outline" onClick={handlePreviousQuestion}>Voltar</Button>
              )}
              {!dangerNowAffirmed && questionIndex < FAM_RISK_QUESTIONS.length - 1 && (
                <Button type="button" disabled={!canAdvance} onClick={handleNextQuestion}>Próxima pergunta</Button>
              )}
            </div>
            <p className="text-xs text-fam-muted">Você poderá anexar arquivos depois de ver esta orientação. Assim, cada arquivo fica vinculado ao caso correto.</p>
            <Button disabled={!canSubmit || riskLoading} onClick={handleSubmit} className="w-full">
              {riskLoading ? "Salvando..." : dangerNowAffirmed ? "Ver orientação imediata" : "Ver orientação inicial"}
            </Button>
            {riskError && <p className="text-sm text-fam-danger">{riskError}</p>}
          </CardContent>
        </Card>
      ) : (
        <Card className={urgent ? "border-fam-danger/30" : "border-gold/30"}>
          <CardHeader>
            <div className="flex items-center gap-2">
              {urgent ? (
                <AlertTriangle className="h-5 w-5 text-fam-danger" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-gold" />
              )}
              <CardTitle>{protectionDecision.title}</CardTitle>
            </div>
            <CardDescription>
              Este resultado é orientativo e foi baseado somente nas respostas fornecidas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="rounded-lg bg-fam-lavender p-4 text-sm leading-relaxed">{protectionDecision.guidance}</p>
            <p className="text-xs leading-relaxed text-fam-muted">{protectionDecision.disclaimer}</p>
            {userId && caseId ?             <Card className="border-fam-lavender"><CardContent className="space-y-3 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-fam-deep-plum">Anexos do caso</p><p className="mt-1 text-xs text-fam-muted">Arquivos enviados ficam em quarentena até a verificação. Somente arquivos limpos e dentro do prazo de retenção podem ser selecionados.</p></div><Button type="button" size="sm" variant="outline" onClick={() => listForCase(caseId).then(setAttachments).catch(() => setAttachments([]))}><RefreshCw className="mr-2 h-3 w-3" /> Atualizar status</Button></div><FileUploader userId={userId} caseId={caseId} accept="image/*,application/pdf,audio/*,video/*" onUploadComplete={() => listForCase(caseId).then(setAttachments).catch(() => setAttachments([]))} />{attachments.length > 0 && <div className="space-y-2">{attachments.map((attachment) => { const state = getFamAttachmentStatus(attachment); return <label key={attachment.id} className="flex items-start gap-2 rounded-md border p-2 text-xs"><input type="checkbox" disabled={!state.selectable} checked={selectedAttachmentIds.includes(attachment.id)} onChange={(event) => setSelectedAttachmentIds((previous) => event.target.checked ? [...previous, attachment.id] : previous.filter((id) => id !== attachment.id))} /><span><b>{attachment.original_name}</b><span className={`ml-1 ${state.className}`}>{state.label}</span></span></label>; })}</div>}</CardContent></Card> : null}
            <div className="rounded-lg border border-fam-gold/30 bg-fam-gold-soft/10 p-3 text-xs text-fam-deep-plum">
              Estado da jornada: <b>{assessmentState}</b>.
              {evaluation.specialFlowFlags.length > 0 && (
                <> Fluxo especial acionado: <b>{evaluation.specialFlowFlags.join(", ")}</b>.</>
              )}
              {riskCase?.methodology_version && riskCase.methodology_version !== "LEGACY-UNVERSIONED" && (
                <span className="mt-1 block text-fam-muted">
                  Versão metodológica registrada: <b>{riskCase.methodology_version}</b>.
                </span>
              )}
            </div>
            {referralOptions.length > 0 && (
              <div className="space-y-3 rounded-lg border border-fam-gold/30 bg-fam-gold-soft/10 p-4">
                <div>
                  <h3 className="font-semibold text-fam-deep-plum">Possíveis caminhos de proteção</h3>
                  <p className="mt-1 text-xs leading-relaxed text-fam-muted">
                    Estas são possibilidades informativas. Nenhum dado será enviado sem uma escolha explícita e confirmação adequada.
                  </p>
                </div>
                <div className="space-y-2">
                  {referralOptions.map((option) => (
                    <button
                      key={option.code}
                      type="button"
                      onClick={() => setSelectedReferral(option)}
                      aria-pressed={selectedReferral?.code === option.code}
                      className={`w-full rounded-lg border p-3 text-left transition ${selectedReferral?.code === option.code ? "border-fam-magenta bg-white" : "border-fam-gold/30 bg-white/70 hover:border-fam-magenta/60"}`}
                    >
                      <span className="block text-sm font-semibold text-fam-deep-plum">{option.label}</span>
                      <span className="mt-1 block text-xs text-fam-muted">{option.purpose}</span>
                      <span className="mt-1 block text-[11px] text-fam-muted">Prioridade: {option.priority}</span>
                    </button>
                  ))}
                </div>
                {selectedReferral && (
                  <div className="rounded-md bg-white p-3 text-xs leading-relaxed text-fam-deep-plum">
                    <p><b>O que pode ser compartilhado:</b> {selectedReferral.dataScope.join(", ")}.</p>
                    <p className="mt-1">{selectedReferral.disclaimer}</p>
                    {!userId || !caseId ? (
                      <p className="mt-3 text-xs text-fam-muted">
                        Entre na sua conta para registrar um pedido de encaminhamento. Você também pode conversar com uma atendente sem enviar esse pedido.
                      </p>
                    ) : referralRequest ? (
                      <div className="mt-3 space-y-2 rounded-md bg-fam-success/10 p-2 text-xs text-fam-success">
                        <p>Pedido registrado. Status: <b>{getFamReferralStatusLabel(referralRequest.status)}</b>.</p>
                        <p className="text-fam-muted">O pedido só é enviado após revisão e confirmação operacional de uma profissional autorizada.</p>
                        {referralRequest.sent_package_hash && (
                          <p className="break-all text-fam-deep-plum"><b>Recibo do pacote congelado:</b> {referralRequest.sent_at ? new Date(referralRequest.sent_at).toLocaleString("pt-BR") : "enviado"} · hash {referralRequest.sent_package_hash}</p>
                        )}
                      </div>
                    ) : (
                      <>
                        <label className="mt-3 flex items-start gap-2 text-xs">
                          <input
                            type="checkbox"
                            checked={referralConfirmed}
                            onChange={(event) => setReferralConfirmed(event.target.checked)}
                            className="mt-0.5"
                          />
                          <span>Confirmo que entendi o destinatário, a finalidade e o escopo mínimo de informações acima.</span>
                        </label>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button type="button" size="sm" disabled={!referralConfirmed || riskLoading} onClick={handleReferralRequest}>
                            Registrar pedido de encaminhamento
                          </Button>
                          <Button type="button" size="sm" variant="outline" onClick={() => setOpenContact(true)}>
                            Conversar com uma atendente
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setOpenContact(true)} className="gap-2">
                <MessageCircle className="h-4 w-4" /> Fale com uma atendente
              </Button>
              <Button variant="outline" asChild>
                <a href="tel:190"><Phone className="mr-2 h-4 w-4" /> Emergência 190</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="tel:180"><Phone className="mr-2 h-4 w-4" /> Ligue 180</a>
              </Button>
            </div>
            <Button variant="outline" onClick={handleRestart}>
              Refazer análise
            </Button>
          </CardContent>
        </Card>
      )}
      <p className="text-xs leading-relaxed text-fam-muted">
        A triagem pode ser feita sem login. O envio de fotos, vídeos, áudios ou documentos exige apenas
        uma conta autenticada — não é necessário ser associada à FAM — e depende de regras de segurança,
        varredura, retenção e supervisão aprovadas pela instituição.
      </p>
    </div>
  );
}
