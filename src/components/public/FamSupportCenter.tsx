"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, ChevronLeft, MessageCircle, Phone, ShieldAlert, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFamConversations, useFamMessages, useFamRiskCase } from "@/hooks/useFamSupport";
import { FileUploader } from "@/components/ui/FileUploader";
import { useActiveLegalBases } from "@/hooks/useLegalBases";
import { LEGAL_BASIS_LABELS } from "@/services/legalBases";
import { supabase } from "@/lib/supabase";

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

export function FamContactPage() {
  const [started, setStarted] = useState(false);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [name, setName] = useState("");
  const [safe, setSafe] = useState(false);
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [convId, setConvId] = useState<string | undefined>(undefined);

  const { conversations, startConversation, loading: convLoading } = useFamConversations(userId);
  const { messages, sendMessage, loading: msgLoading } = useFamMessages(convId);

  // Get current user on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
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
            <Button
              disabled={!safe || convLoading}
              onClick={handleStart}
              className="w-full gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              {convLoading ? "Conectando..." : "Entrar na fila de atendimento"}
            </Button>
          
            <Link href="/" className="flex items-center gap-2 text-fam-plum font-medium hover:underline">
              <ChevronLeft className="h-4 w-4" /> Voltar
            </Link>
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

// --- Análise de Risco (com persistência no Supabase + Fluxos Especiais JUR-01 / REV-02) ---
const QUESTIONS = [
  ["danger_now", "Existe perigo ou ameaça acontecendo agora?"],
  ["injury", "Você precisa de atendimento médico ou está ferida?"],
  ["weapon", "A pessoa que ameaça você tem acesso a arma?"],
  ["sexual", "Houve violência sexual ou coerção?"],
  ["children", "Há crianças ou adolescentes em situação de risco?"],
  ["elderly", "Há alguma pessoa idosa que pode estar sofrendo violência, abuso, negligência ou exploração?"],
  ["disability", "A situação envolve uma pessoa com deficiência que pode estar em risco ou precisando de proteção?"],
] as const;

function SpecialFlowsPanel({ answers }: { answers: Record<string, string> }) {
  const has = (k: string) => answers[k] === "sim";
  const flows: { key: string; title: string; desc: string; icon: any }[] = [];
  if (has("children")) flows.push({ key: "children", title: "Proteção de criança/adolescente", desc: "Você informou que há criança ou adolescente em situação de risco. A FAM não realiza investigação, não confirma crimes e não substitui os órgãos da rede de proteção. Se houver perigo imediato, procure um local seguro e acione o serviço de emergência adequado. Em situações de violência, a orientação poderá indicar serviços oficiais de proteção, como Conselho Tutelar ou autoridade policial. Você não precisa enviar fotos, vídeos, áudios ou documentos para receber esta orientação.", icon: "👧" });
  if (has("sexual")) flows.push({ key: "sexual", title: "Violência sexual / coerção", desc: "Situações envolvendo violência sexual ou coerção podem exigir atendimento de saúde, proteção e orientação especializada. Você não precisa descrever o que aconteceu para receber orientação inicial. Se estiver em perigo agora ou precisar de atendimento médico, informe. O envio de arquivos é opcional e não valida autenticidade.", icon: "🛡️" });
  if (has("elderly")) flows.push({ key: "elderly", title: "Pessoa idosa em possível situação de risco", desc: "Você informou que há pessoa idosa que pode estar em situação de risco. A pessoa idosa deve ser tratada como titular de direitos, sem presumir incapacidade. Você pode pedir ajuda para preencher, mas isso não autoriza outra pessoa a ter acesso às suas informações. Procure apoio conforme a necessidade e, se houver perigo imediato, acione o serviço de emergência. Considere também a rede de proteção.", icon: "🧓" });
  if (has("disability")) flows.push({ key: "disability", title: "Pessoa com deficiência", desc: "A deficiência não reduz autonomia, privacidade ou direito de decidir. Se precisar de forma diferente de comunicação, use a opção de acessibilidade. Apoio de pessoa de confiança é possível, mas apoio não significa autorização irrestrita para acesso aos dados.", icon: "♿" });
  if (has("danger_now")) flows.push({ key: "emergency", title: "Sua segurança vem primeiro", desc: "Você informou que pode existir perigo ou ameaça acontecendo agora. Se estiver em perigo imediato, procure um local seguro e acione o serviço de emergência adequado à situação. Você não precisa preencher todo o formulário antes de buscar ajuda.", icon: "🚨" });
  if (flows.length === 0) return null;
  return (
    <div className="space-y-3">
      {flows.map(f => (
        <div key={f.key} className="rounded-xl border border-fam-lavender bg-fam-ivory-pink p-4">
          <p className="font-semibold text-fam-plum flex items-center gap-2"><span>{f.icon}</span>{f.title}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-fam-deep-plum">{f.desc}</p>
          <p className="mt-2 text-xs text-fam-muted">A FAM orienta, identifica sinais de atenção, protege a informação e conecta à rede competente. Não investiga, não produz laudo e não confirma crime.</p>
        </div>
      ))}
    </div>
  );
}

function LegalBasisNotice({ purpose, category }: { purpose: string; category: string }) {
  const { bases } = useActiveLegalBases();
  const base = bases.find(b => b.purpose_code === purpose && b.data_category === category);
  if (!base) return null;
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
      <p className="font-semibold">Base jurídica aplicável (JUR-02): {LEGAL_BASIS_LABELS[base.legal_basis as any] ?? base.legal_basis}</p>
      <p className="mt-1">{base.legal_basis_description ?? ""} • Retenção {base.retention_class} • v{base.version}</p>
    </div>
  );
}

export function FamRiskAnalysisPage() {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [openContact, setOpenContact] = useState(false);
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [caseId, setCaseId] = useState<string | undefined>(undefined);
  const { riskCase, create, saveAnswers, submitAssessment, loading: riskLoading, error: riskError } = useFamRiskCase(userId);
  const urgent = ["danger_now", "injury", "weapon", "sexual", "children"].some(
    (key) => answers[key] === "sim"
  );
  const complete = QUESTIONS.every(([key]) => answers[key]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  const handleSubmit = async () => {
    if (!complete) return;
    try {
      // Visitantes podem concluir a orientação sem cadastro. Nesse caso,
      // respostas e resultado permanecem somente nesta sessão do navegador.
      if (userId) {
        const activeCaseId = caseId ?? (await create({ user_id: userId, contact_name: undefined })).id;
        if (!caseId) setCaseId(activeCaseId);
        await saveAnswers(activeCaseId, answers);
        const attention = urgent ? "immediate" : "relevant";
        await submitAssessment(activeCaseId, {
          attention,
          preliminary_summary: urgent
            ? "Sinais de risco imediato identificados na triagem."
            : "Sinais de risco relevantes; recomenda-se acompanhamento especializado.",
          limitations_acknowledged_at: new Date().toISOString(),
        });
      }
      setSubmitted(true);
    } catch (e) {
      console.error("Erro ao salvar análise:", e);
      alert("Não foi possível registrar a análise. A orientação local continua disponível; tente novamente quando estiver em segurança.");
    }
  };

  const handleRestart = () => {
    setAnswers({});
    setSubmitted(false);
    setCaseId(undefined);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-6">
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
            {QUESTIONS.map(([key, label]) => (
              <div key={key} className="space-y-2">
                <p className="text-sm font-medium text-fam-deep-plum">{label}</p>
                <div className="flex flex-wrap gap-2">
                  {["sim", "não", "prefiro não responder"].map((value) => (
                    <Button
                      key={value}
                      type="button"
                      variant={answers[key] === value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAnswers((prev) => ({ ...prev, [key]: value }))}
                    >
                      {value}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
            {userId ? (
              <FileUploader userId={userId} caseId={caseId} accept="image/*,application/pdf,audio/*,video/*" />
            ) : (
              <div className="rounded-lg border border-fam-gold/30 bg-fam-gold-soft/10 p-4 text-sm text-fam-deep-plum">
                <p className="font-semibold">Quer enviar documentos, fotos, áudios ou vídeos?</p>
                <p className="mt-1">Entre na sua conta para anexar arquivos com segurança. Não é necessário ser associada à FAM.</p>
                <Button asChild variant="outline" size="sm" className="mt-3">
                  <Link href="/entrar?redirect=/analise-risco">Entrar para enviar anexos</Link>
                </Button>
              </div>
            )}
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
              <CardTitle>
                {urgent ? "Sinais que merecem atenção imediata" : "É importante conversar com uma atendente"}
              </CardTitle>
            </div>
            <CardDescription>
              Este resultado é orientativo e foi baseado somente nas respostas fornecidas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SpecialFlowsPanel answers={answers} />
            <LegalBasisNotice purpose={urgent ? "protecao_vida_incolumidade" : "orientacao_inicial"} category={answers["sexual"] === "sim" ? "vida_sexual" : answers["children"] === "sim" ? "crianca_adolescente" : "respostas_risco"} />
            <p className="rounded-lg bg-fam-lavender p-4 text-sm leading-relaxed">
              {urgent
                ? "Se houver perigo agora, procure um local seguro quando puder e acione a emergência pelo 190. Para orientação e encaminhamento sobre violência contra a mulher, o Ligue 180 funciona 24 horas. Uma atendente especializada da FAM também pode acolher você quando houver disponibilidade."
                : "Não foi possível concluir uma situação a partir destas respostas. Isso não significa que esteja tudo bem ou que não exista risco. Converse com uma atendente especializada para avaliar com cuidado o próximo passo."}
            </p>
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
            
            <Link href="/" className="flex items-center gap-2 text-fam-plum font-medium hover:underline">
              <ChevronLeft className="h-4 w-4" /> Voltar
            </Link>
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
