"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, MessageCircle, Phone, ShieldAlert, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const EMERGENCY_180 = "180";
const EMERGENCY_190 = "190";

export function FamSafetyNotice() {
  const [hidden, setHidden] = useState(false);
  if (hidden) return <Button variant="outline" size="sm" onClick={() => setHidden(false)}>Mostrar aviso de segurança</Button>;
  return (
    <Card className="border-red-200 bg-red-50/70">
      <CardContent className="flex items-start gap-3 p-4">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />
        <div className="min-w-0 flex-1 text-sm text-red-950">
          <p className="font-semibold">Você está em segurança para continuar?</p>
          <p className="mt-1">Se houver perigo imediato, afaste-se quando puder e ligue <b>{EMERGENCY_190}</b>. Para orientação sobre violência contra a mulher, ligue <b>{EMERGENCY_180}</b>. Este site não é um serviço de emergência.</p>
        </div>
        <Button variant="ghost" size="icon" aria-label="Ocultar aviso" onClick={() => setHidden(true)}><X className="h-4 w-4" /></Button>
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

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-6">
      <FamSafetyNotice />
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">FAM · acolhimento</p>
        <h1 className="mt-2 font-display text-3xl text-navy">Fale Conosco</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">Converse com uma pessoa da equipe de atendimento da FAM. Você pode parar, pedir uma pausa ou solicitar encaminhamento a qualquer momento.</p>
      </div>
      {!started ? (
        <Card>
          <CardHeader><CardTitle>Iniciar conversa</CardTitle><CardDescription>O atendimento depende de uma pessoa habilitada estar disponível. Nunca compartilhe algo que coloque você em mais risco.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label htmlFor="fam-name">Como podemos chamar você? (opcional)</Label><Input id="fam-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome ou apelido" /></div>
            <label className="flex items-start gap-3 rounded-lg border p-3 text-sm"><input type="checkbox" checked={safe} onChange={(e) => setSafe(e.target.checked)} className="mt-1" /><span>Estou em uma condição razoavelmente segura para conversar agora e entendo que este chat não substitui emergência policial, atendimento médico ou orientação jurídica.</span></label>
            <Button disabled={!safe} onClick={() => setStarted(true)} className="w-full gap-2"><MessageCircle className="h-4 w-4" />Entrar na fila de atendimento</Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader><div className="flex items-center justify-between"><div><CardTitle>Conversa protegida</CardTitle><CardDescription>{name ? `Olá, ${name}. ` : ""}A equipe receberá sua mensagem conforme a disponibilidade real.</CardDescription></div><span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">Na fila</span></div></CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted/30 p-4 text-sm text-muted">Ainda não há atendente conectada nesta demonstração. Quando o backend estiver configurado, esta área receberá mensagens em tempo real e permitirá transferência para supervisão.</div>
            {sent && <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-800"><CheckCircle2 className="h-4 w-4" />Mensagem registrada para atendimento.</div>}
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} placeholder="Escreva somente o que você se sente segura para compartilhar." className="w-full rounded-md border bg-background p-3 text-sm" />
            <div className="flex flex-wrap gap-2"><Button disabled={!message.trim()} onClick={() => { setSent(true); setMessage(""); }} className="gap-2"><Send className="h-4 w-4" />Enviar mensagem</Button><Button variant="outline" onClick={() => setStarted(false)}>Sair da conversa</Button><Button variant="outline" asChild><a href="tel:190"><Phone className="mr-2 h-4 w-4" />Emergência 190</a></Button></div>
          </CardContent>
        </Card>
      )}
      <p className="text-xs leading-relaxed text-muted">O chat apresentado nesta etapa é uma interface inicial. Para produção, a FAM ainda precisa aprovar protocolo de emergência, escala 24 horas, equipe habilitada, política de dados e regras de supervisão.</p>
    </div>
  );
}

const QUESTIONS = [
  ["danger_now", "Existe perigo ou ameaça acontecendo agora?"],
  ["injury", "Você precisa de atendimento médico ou está ferida?"],
  ["weapon", "A pessoa que ameaça você tem acesso a arma?"],
  ["sexual", "Houve violência sexual ou coerção?"],
  ["children", "Há crianças ou adolescentes em situação de risco?"],
] as const;

export function FamRiskAnalysisPage() {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [openContact, setOpenContact] = useState(false);
  const urgent = ["danger_now", "injury", "weapon", "sexual", "children"].some((key) => answers[key] === "sim");
  const complete = QUESTIONS.every(([key]) => answers[key]);

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-6">
      <FamSafetyNotice />
      <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">FAM · orientação inicial</p><h1 className="mt-2 font-display text-3xl text-navy">Análise de Risco</h1><p className="mt-2 text-sm text-muted">Responda apenas o que puder com segurança. Esta ferramenta organiza sinais de atenção e não confirma nem descarta crime, não produz laudo e não substitui polícia, emergência, saúde ou atendimento profissional.</p></div>
      {!submitted ? <Card><CardHeader><CardTitle>Como você está agora?</CardTitle><CardDescription>Se não souber ou não quiser responder, escolha “Prefiro não responder”.</CardDescription></CardHeader><CardContent className="space-y-5">{QUESTIONS.map(([key, label]) => <div key={key} className="space-y-2"><p className="text-sm font-medium text-ink">{label}</p><div className="flex flex-wrap gap-2">{["sim", "não", "prefiro não responder"].map((value) => <Button key={value} type="button" variant={answers[key] === value ? "default" : "outline"} size="sm" onClick={() => setAnswers((prev) => ({ ...prev, [key]: value }))}>{value}</Button>)}</div></div>)}<Button disabled={!complete} onClick={() => setSubmitted(true)} className="w-full">Ver orientação inicial</Button></CardContent></Card> : <Card className={urgent ? "border-red-200" : "border-gold/30"}><CardHeader><div className="flex items-center gap-2">{urgent ? <AlertTriangle className="h-5 w-5 text-red-700" /> : <CheckCircle2 className="h-5 w-5 text-gold" />}<CardTitle>{urgent ? "Sinais que merecem atenção imediata" : "É importante conversar com uma atendente"}</CardTitle></div><CardDescription>Este resultado é orientativo e foi baseado somente nas respostas fornecidas.</CardDescription></CardHeader><CardContent className="space-y-4"><p className="rounded-lg bg-muted/30 p-4 text-sm leading-relaxed">{urgent ? "Se houver perigo agora, procure um local seguro quando puder e acione a emergência pelo 190. Para orientação e encaminhamento sobre violência contra a mulher, o Ligue 180 funciona 24 horas. Uma atendente especializada da FAM também pode acolher você quando houver disponibilidade." : "Não foi possível concluir uma situação a partir destas respostas. Isso não significa que esteja tudo bem ou que não exista risco. Converse com uma atendente especializada para avaliar com cuidado o próximo passo."}</p><div className="flex flex-wrap gap-2"><Button onClick={() => setOpenContact(true)} className="gap-2"><MessageCircle className="h-4 w-4" />Falar com atendente</Button><Button variant="outline" asChild><a href="tel:180"><Phone className="mr-2 h-4 w-4" />Ligue 180</a></Button><Button variant="outline" onClick={() => { setSubmitted(false); setAnswers({}); }}>Refazer</Button></div>{openContact && <div className="rounded-lg border border-gold/30 bg-gold/5 p-4 text-sm">O encaminhamento para o chat próprio da FAM será conectado ao atendimento em tempo real na próxima etapa de backend. Por enquanto, acesse <a className="font-semibold underline" href="/fale-conosco">Fale Conosco</a>.</div>}</CardContent></Card>}
      <p className="text-xs leading-relaxed text-muted">Não envie fotos, vídeos, áudios ou documentos nesta versão de triagem. O recebimento seguro de anexos exige bucket privado, varredura, retenção e autorização institucional definidos antes da produção.</p>
    </div>
  );
}
