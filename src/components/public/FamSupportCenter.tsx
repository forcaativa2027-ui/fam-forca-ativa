"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, LogOut, MessageCircle, Phone, ShieldAlert, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFamAttachments, useFamConversations, useFamMessages, useFamRiskCase } from "@/hooks/useFamSupport";
import type { FamAttachment } from "@/services/famAttachments";
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
import {
  stateForEvaluation,
  transitionAssessment,
  type FamAssessmentState,
} from "@/services/famAssessmentState";
import { decideFamProtection } from "@/services/famProtectionFlow";

const EMERGENCY_180 = "180";
const EMERGENCY_190 = "190";

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
              </div>
              <span className="rounded-full bg-fam-soft-pink px-2 py-1 text-xs font-medium text-fam-plum">
                {messages.length > 0 ? "Ativo" : "Conectado"}
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
              <div className="flex items-center gap-2 rounded-lg bg-fam-success/10 p-3 text-sm text-fam-success">
                <CheckCircle2 className="h-4 w-4" />
                Mensagem registrada para atendimento.
              </div>
            )}

            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  placeholder="Escreva somente o que você se sente segura para compartilhar."
                  className="flex-1 rounded-md border bg-background p-3 text-sm"
                  disabled={msgLoading}
                />
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
  const [submitted, setSubmitted] = useState(false);
  const [assessmentState, setAssessmentState] = useState<FamAssessmentState>("IN_PROGRESS");
  const [openContact, setOpenContact] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState<FamReferralOption | null>(null);
  const [referralConfirmed, setReferralConfirmed] = useState(false);
  const [referralRequestStatus, setReferralRequestStatus] = useState<"idle" | "requested">("idle");
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
  const complete = FAM_RISK_QUESTIONS.every(({ key }) => answers[key]);

    useEffect(() => {
    if (!caseId || !submitted) return;
    listForCase(caseId).then(setAttachments).catch(() => setAttachments([]));
  }, [caseId, submitted, listForCase]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);
  const handleSubmit = async () => {
    if (!complete) return;
    try {
      const attention = evaluation.attention;
      const next = stateForEvaluation(evaluation);
      transitionAssessment(assessmentState, next.state, {
        reasonCode: next.reasonCode,
        ruleCode: next.ruleCode,
      });
      setAssessmentState(next.state);
      // Visitantes podem concluir a orientação sem cadastro. Nesse caso,
      // respostas e resultado permanecem somente nesta sessão do navegador.
      if (userId) {
        const activeCaseId = caseId ?? (await create({ user_id: userId, contact_name: undefined })).id;
        if (!caseId) setCaseId(activeCaseId);
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
      await requestReferral(caseId, userId, selectedReferral, referralConfirmed, selectedAttachmentIds);
      setReferralRequestStatus("requested");
    } catch (e) {
      console.error("Erro ao registrar encaminhamento:", e);
      alert("Não foi possível registrar o pedido. Nenhum dado foi enviado ao destinatário.");
    }
  };

  const handleRestart = () => {
    setAnswers({});
    setAttachments([]);
    setSelectedAttachmentIds([]);
    setSubmitted(false);
    setAssessmentState("IN_PROGRESS");
    setSelectedReferral(null);
    setReferralConfirmed(false);
    setReferralRequestStatus("idle");
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
            {FAM_RISK_QUESTIONS.map(({ key, text, options, source }) => (
              <fieldset key={key} className="space-y-2">
                <legend className="text-sm font-medium text-fam-deep-plum">{text}</legend>
                <p id={`fam-source-${key}`} className="text-xs text-fam-muted">Referência metodológica: {source}</p>
                <div className="flex flex-wrap gap-2" role="group" aria-describedby={`fam-source-${key}`}>
                  {options.map(({ value, label }) => (
                    <Button
                      key={value}
                      type="button"
                      variant={answers[key] === value ? "default" : "outline"}
                      size="sm"
                      aria-pressed={answers[key] === value}
                      onClick={() => setAnswers((prev) => ({ ...prev, [key]: value }))}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </fieldset>
            ))}
            <p className="text-xs text-fam-muted">Você poderá anexar arquivos depois de ver esta orientação. Assim, cada arquivo fica vinculado ao caso correto.</p>
            <Button disabled={!complete || riskLoading} onClick={handleSubmit} className="w-full">
              {riskLoading ? "Salvando..." : "Ver orientação inicial"}
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
            {userId && caseId ? <Card className="border-fam-lavender"><CardContent className="space-y-3 p-4"><div><p className="text-sm font-semibold text-fam-deep-plum">Anexos do caso</p><p className="mt-1 text-xs text-fam-muted">Arquivos enviados ficam em quarentena até a verificação. Somente arquivos marcados como limpos podem ser selecionados para encaminhamento.</p></div><FileUploader userId={userId} caseId={caseId} accept="image/*,application/pdf,audio/*,video/*" onUploadComplete={() => listForCase(caseId).then(setAttachments).catch(() => setAttachments([]))} />{attachments.length > 0 && <div className="space-y-2">{attachments.map((attachment) => <label key={attachment.id} className="flex items-start gap-2 rounded-md border p-2 text-xs"><input type="checkbox" disabled={attachment.malware_scan_status !== "clean"} checked={selectedAttachmentIds.includes(attachment.id)} onChange={(event) => setSelectedAttachmentIds((previous) => event.target.checked ? [...previous, attachment.id] : previous.filter((id) => id !== attachment.id))} /><span><b>{attachment.original_name}</b><span className="ml-1 text-fam-muted">{attachment.malware_scan_status === "clean" ? "Disponível para seleção" : "Aguardando verificação de segurança"}</span></span></label>)}</div>}</CardContent></Card> : null}
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
                    ) : referralRequestStatus === "requested" ? (
                      <p className="mt-3 rounded-md bg-fam-success/10 p-2 text-xs text-fam-success">
                        Pedido registrado. Ele ainda não foi enviado ao destinatário e será revisado por uma profissional autorizada.
                      </p>
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
