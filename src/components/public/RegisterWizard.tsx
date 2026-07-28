"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft, ArrowRight, Check, X, Heart, Users, MessageCircleHeart,
  Home as HomeIcon, Eye, EyeOff, HandHeart, Droplets, Hand, HelpCircle, Loader2,
  MessageCircle, Phone as PhoneIcon, Flame, Church as ChurchIcon,
  BookHeart, UsersRound, PartyPopper,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Turnstile } from "@marsidev/react-turnstile";
import { DarkBlueTheme } from "@/components/shared/DarkBlueTheme";
import { supabase } from "@/lib/supabase/client";
import { useChurches, useActiveCommunity, useCells } from "@/hooks/use-queries";
import { lookupCep, maskPhone, maskCep, createPipelineEntryFull } from "@/services/pipeline";
import type { PipelineIntent } from "@/types/domain";

const INTENT_LABELS: Record<PipelineIntent, { label: string; description: string; icon: React.ComponentType<{className?:string}> }> = {
  lifegroup:                { label: "Quero um Life Group",         description: "Participar de uma célula próxima de mim", icon: Users },
  discipulado:              { label: "Quero discipulado",            description: "Ser discipulado por um líder",            icon: Heart },
  acompanhamento_pastoral:  { label: "Acompanhamento pastoral",      description: "Conversar com um pastor",                 icon: MessageCircleHeart },
  visita:                   { label: "Quero ser visitado",           description: "Receber um líder em casa",                icon: HomeIcon },
  conhecer:                 { label: "Quero conhecer a igreja",      description: "Conhecer melhor a comunidade",            icon: Eye },
  batismo:                  { label: "Quero me batizar",             description: "Iniciar o processo de batismo",           icon: Droplets },
  servir:                   { label: "Quero servir",                 description: "Servir em algum ministério",              icon: Hand },
  outro:                    { label: "Outro",                        description: "Conte-nos como podemos ajudar",           icon: HelpCircle },
};

const EMAIL_DOMAINS = ["gmail.com", "hotmail.com", "outlook.com", "yahoo.com.br", "icloud.com"];

interface State {
  step: number;
  flow: "completo" | "basico" | null;
  // Conta
  full_name: string; cpf: string; email: string; phone: string;
  verify_method: "whatsapp" | "sms";
  password: string;
  // Dados pessoais
  marital_status: string; birth_date: string; gender: string;
  // Localização
  country: string; cep: string; state: string; city: string; address: string; number: string; complemento: string; neighborhood: string;
  // Comunidade
  community_id: string; life_group_id: string;
  // História de fé
  baptized: boolean | null; baptism_date: string; last_church: string;
  holy_spirit_baptized: boolean | null; holy_spirit_baptism_date: string;
  // Jornada (opcionais)
  seeking_reason: string; life_before_church: string; testimony: string;
  belongs_to_group: boolean | null; group_name: string;
  intent: PipelineIntent;
}

const INITIAL_STATE: State = {
  step: 1,
  flow: null,
  full_name: "", cpf: "", email: "", phone: "", verify_method: "whatsapp", password: "",
  marital_status: "", birth_date: "", gender: "",
  country: "Brasil", cep: "", state: "", city: "", address: "", number: "", complemento: "", neighborhood: "",
  community_id: "", life_group_id: "",
  baptized: null, baptism_date: "", last_church: "",
  holy_spirit_baptized: null, holy_spirit_baptism_date: "",
  seeking_reason: "", life_before_church: "", testimony: "",
  belongs_to_group: null, group_name: "",
  intent: "conhecer",
};

const TOTAL_STEPS = 10;
const BASICO_STEP = 90; // sentinel: fluxo curto (Cadastro Básico) não segue a numeração 1-10

export default function RegisterWizard() {
  const params = useSearchParams();
  const initialIntent = (params.get("intent") as PipelineIntent | null) ?? "conhecer";
  const { data: churches = [] } = useChurches();
  const { data: cells = [] } = useCells();
  const { data: activeCommunity } = useActiveCommunity();
  const [s, setS] = useState<State>({ ...INITIAL_STATE, intent: initialIntent });
  const [done, setDone] = useState(false);
  const [globalErr, setGlobalErr] = useState("");

  useEffect(() => {
    if (activeCommunity?.id && !s.community_id) {
      setS((prev) => ({ ...prev, community_id: activeCommunity.id }));
    }
  }, [activeCommunity?.id, s.community_id]);

  function update<K extends keyof State>(k: K, v: State[K]) {
    setS((prev) => ({ ...prev, [k]: v }));
  }
  function goTo(step: number) { setS((prev) => ({ ...prev, step })); }

  if (done) return <FinishedScreen hasLg={!!s.life_group_id} />;

  return (
    <DarkBlueTheme className="p-4">
      <div className="mx-auto max-w-xl py-8">
        <Link href="/" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Voltar à página inicial
        </Link>

        <Card className="overflow-hidden">
          <div className="border-b border-white/10 bg-white/5 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <img src="/images/cec-family-logo.png" alt="CEC Family" className="h-6 w-6 object-contain" />
                <b className="font-display text-base">Cadastro CEC Family</b>
              </div>
              {s.step !== BASICO_STEP && (
                <span className="text-xs font-bold uppercase tracking-wider text-white/60">Etapa {s.step} de {TOTAL_STEPS}</span>
              )}
            </div>
            <div className="mt-3 flex gap-1">
              {Array.from({ length: s.step === BASICO_STEP ? 2 : TOTAL_STEPS }).map((_, i) => (
                <div key={i} className={`h-1 flex-1 rounded-full ${s.step === BASICO_STEP ? "bg-gold" : i < s.step ? "bg-gold" : "bg-border"}`} />
              ))}
            </div>
          </div>

          <CardContent className="p-6">
            {globalErr && <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{globalErr}</p>}

            {s.step === 1 && <StepConta s={s} update={update} onNext={() => goTo(2)} />}
            {s.step === 2 && (
              <StepTipoCadastro
                s={s} update={update}
                onBack={() => goTo(1)}
                onBasico={() => { update("flow", "basico"); goTo(BASICO_STEP); }}
                onCompleto={() => { update("flow", "completo"); goTo(3); }}
              />
            )}
            {s.step === 3 && <StepVerificacao s={s} update={update} onBack={() => goTo(2)} onNext={() => goTo(4)} />}
            {s.step === 4 && <StepPessoal s={s} update={update} onBack={() => goTo(3)} onNext={() => goTo(5)} />}
            {s.step === 5 && <StepLocalizacao s={s} update={update} onBack={() => goTo(4)} onNext={() => goTo(6)} />}
            {s.step === 6 && <StepComunidade s={s} update={update} churches={churches} cells={cells} onBack={() => goTo(5)} onNext={() => goTo(7)} />}
            {s.step === 7 && <StepFe s={s} update={update} onBack={() => goTo(6)} onNext={() => goTo(8)} />}
            {s.step === 8 && <StepJornada s={s} update={update} onBack={() => goTo(7)} onNext={() => goTo(9)} />}
            {s.step === 9 && <StepIntencao s={s} update={update} onBack={() => goTo(8)} onNext={() => goTo(10)} />}
            {s.step === 10 && <StepFinalizacao s={s} update={update} onBack={() => goTo(9)} onDone={() => setDone(true)} setGlobalErr={setGlobalErr} />}
            {s.step === BASICO_STEP && <StepFinalizacaoBasica s={s} update={update} onBack={() => goTo(2)} onDone={() => setDone(true)} setGlobalErr={setGlobalErr} />}
          </CardContent>
        </Card>
      </div>
    </DarkBlueTheme>
  );
}

// ============================================================
// ETAPA 1 — Conta (nome, CPF, e-mail com autocomplete, telefone)
// ============================================================
function StepConta({ s, update, onNext }: { s: State; update: <K extends keyof State>(k: K, v: State[K]) => void; onNext: () => void }) {
  const [err, setErr] = useState<Record<string,string>>({});
  const [showDomains, setShowDomains] = useState(false);

  function next() {
    const errs: Record<string,string> = {};
    if (s.full_name.trim().length < 3) errs.full_name = "Nome muito curto";
    const cleanPhone = s.phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) errs.phone = "Telefone incompleto";
    if (!s.email || !/^\S+@\S+\.\S+$/.test(s.email)) errs.email = "E-mail inválido";
    setErr(errs);
    if (Object.keys(errs).length === 0) onNext();
  }

  const atIndex = s.email.indexOf("@");
  const emailPrefix = atIndex >= 0 ? s.email.slice(0, atIndex) : s.email;
  const domainTyped = atIndex >= 0 ? s.email.slice(atIndex + 1) : "";
  const domainSuggestions = atIndex >= 0
    ? EMAIL_DOMAINS.filter((d) => d.startsWith(domainTyped)).slice(0, 4)
    : [];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-2xl font-bold text-navy">Vamos começar</h2>
        <p className="text-base text-muted">Conta um pouco sobre você</p>
      </div>

      <Field label="Nome completo" error={err.full_name}>
        <Input className="h-12 text-base" value={s.full_name} onChange={(e) => update("full_name", e.target.value)} placeholder="Maria Silva" autoFocus />
      </Field>

      <Field label="CPF (opcional)">
        <Input className="h-12 text-base" value={s.cpf} onChange={(e) => update("cpf", maskCpf(e.target.value))} placeholder="000.000.000-00" inputMode="numeric" />
      </Field>

      <div className="relative">
        <Field label="E-mail" error={err.email}>
          <Input className="h-12 text-base"
            value={s.email} type="text"
            onChange={(e) => { update("email", e.target.value); setShowDomains(e.target.value.includes("@")); }}
            onFocus={() => setShowDomains(s.email.includes("@"))}
            onBlur={() => setTimeout(() => setShowDomains(false), 150)}
            placeholder="seu@email.com"
          />
        </Field>
        {showDomains && domainSuggestions.length > 0 && (
          <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border bg-card shadow-lg">
            {domainSuggestions.map((d) => (
              <button key={d} type="button"
                onMouseDown={() => { update("email", `${emailPrefix}@${d}`); setShowDomains(false); }}
                className="block w-full px-3 py-2 text-left text-sm text-ink hover:bg-muted/40">
                {emailPrefix}@<b>{d}</b>
              </button>
            ))}
          </div>
        )}
      </div>

      <Field label="Telefone / WhatsApp" error={err.phone}>
        <Input className="h-12 text-base" value={s.phone} onChange={(e) => update("phone", maskPhone(e.target.value))} placeholder="(00) 00000-0000" inputMode="tel" />
      </Field>

      <div className="flex justify-end">
        <Button onClick={next} className="h-12 gap-2 rounded-xl text-base shadow-md transition hover:shadow-lg active:scale-95">Continuar <ArrowRight className="h-5 w-5" /></Button>
      </div>
    </div>
  );
}

// ============================================================
// ETAPA 2 — Escolha do Tipo de Cadastro (Básico ou Completo)
// ============================================================
function StepTipoCadastro({ s, onBack, onBasico, onCompleto }: {
  s: State; update: <K extends keyof State>(k: K, v: State[K]) => void;
  onBack: () => void; onBasico: () => void; onCompleto: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <PartyPopper className="h-5 w-5 text-gold" />
        <div>
          <h2 className="font-display text-2xl font-bold text-navy">Sua conta foi criada com sucesso!</h2>
          <p className="text-base text-muted">Como você quer continuar, {s.full_name.split(" ")[0] || "amigo(a)"}?</p>
        </div>
      </div>

      <div className="rounded-xl border-2 border-border bg-card p-4">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-navy/10"><Eye className="h-5 w-5 text-navy" /></div>
          <div className="flex-1">
            <b className="text-navy">Cadastro Básico</b>
            <p className="mt-1 text-sm text-muted">
              Você já pode acessar a plataforma com o e-mail e a senha cadastrados. Com o Cadastro Básico você pode:
            </p>
            <ul className="mt-2 space-y-1 text-sm text-ink">
              <li>• Acessar a Home do Usuário</li>
              <li>• Inscrever-se em eventos</li>
              <li>• Receber notificações</li>
              <li>• Conhecer melhor nossa igreja</li>
            </ul>
            <p className="mt-2 text-xs text-muted">
              Caso futuramente deseje se tornar membro ou participar de um Life Group, será necessário concluir o Cadastro Completo.
            </p>
          </div>
        </div>
        <Button type="button" onClick={onBasico} variant="outline" className="mt-3 h-14 w-full gap-2 rounded-xl text-base shadow-sm transition active:scale-95">
          Entrar na Home do Usuário <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="rounded-xl border-2 border-gold bg-gold/5 p-4">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gold/20"><Heart className="h-5 w-5 text-gold" /></div>
          <div className="flex-1">
            <b className="text-navy">Continuar Cadastro Completo</b>
            <p className="mt-1 text-sm text-muted">
              Quanto mais informações conhecermos sobre você, melhor poderemos acolhê-lo, acompanhá-lo e oferecer uma experiência personalizada dentro da igreja.
            </p>
            <p className="mt-2 text-xs text-muted">Obrigatório para: membros efetivos, emissão da Carteira de Membro, Life Groups, discipulado e acompanhamento pastoral.</p>
          </div>
        </div>
        <Button type="button" onClick={onCompleto} className="mt-3 h-14 w-full gap-2 rounded-xl text-base shadow-md transition hover:shadow-lg active:scale-95">
          Continuar Cadastro <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <button type="button" onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-muted hover:text-navy">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>
    </div>
  );
}

// ============================================================
// FINALIZAÇÃO — Cadastro Básico (fluxo curto)
// ============================================================
function StepFinalizacaoBasica({ s, onBack, onDone, setGlobalErr }: {
  s: State; update: <K extends keyof State>(k: K, v: State[K]) => void;
  onBack: () => void; onDone: () => void; setGlobalErr: (msg: string) => void;
}) {
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [err, setErr] = useState<Record<string,string>>({});
  const [busy, setBusy] = useState(false);
  const [lgpdAccepted, setLgpdAccepted] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  async function finish() {
    const errs: Record<string,string> = {};
    if (password.length < 6) errs.password = "Senha precisa ter ao menos 6 caracteres";
    if (password !== passwordConfirm) errs.password_confirm = "Senhas não conferem";
    if (!lgpdAccepted) errs.lgpd = "Você precisa aceitar os Termos e a Política de Privacidade para continuar.";
    if (turnstileSiteKey && !captchaToken) errs.captcha = "Confirme que você não é um robô.";
    setErr(errs);
    if (Object.keys(errs).length > 0) return;

    setBusy(true); setGlobalErr("");
    try {
      const { error: signError } = await supabase.auth.signUp({
        email: s.email, password,
        options: { data: { full_name: s.full_name }, captchaToken: captchaToken ?? undefined },
      });
      if (signError) {
        setGlobalErr(signError.message.includes("already") ? "Este e-mail já está cadastrado. Tente fazer login." : signError.message);
        setBusy(false); return;
      }

      await createPipelineEntryFull(supabase, {
        community_id: s.community_id,
        intent: s.intent,
        full_name: s.full_name,
        phone: s.phone,
        email: s.email,
      });

      onDone();
    } catch (e: unknown) {
      const msg = (e as { message?: string })?.message ?? (e instanceof Error ? e.message : null);
      setGlobalErr(msg || "Erro ao finalizar cadastro. Tente novamente em instantes.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <PartyPopper className="h-5 w-5 text-gold" />
        <div>
          <h2 className="font-display text-2xl font-bold text-navy">Falta só a senha!</h2>
          <p className="text-base text-muted">Crie uma senha para acessar sua conta</p>
        </div>
      </div>

      <Field label="Senha" error={err.password}>
        <div className="relative">
          <Input type={showPassword ? "text" : "password"} value={password}
            onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" className="h-12 text-base pr-10" />
          <button type="button" onClick={() => setShowPassword((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-navy" tabIndex={-1}>
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </Field>
      <Field label="Confirmar senha" error={err.password_confirm}>
        <Input className="h-12 text-base" type={showPassword ? "text" : "password"} value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} />
      </Field>

      <SectionDivider label="Termos de Uso" />
      <TermsCheckbox checked={lgpdAccepted} onChange={setLgpdAccepted} error={err.lgpd} />

      {turnstileSiteKey && (
        <div className="flex justify-center">
          <Turnstile siteKey={turnstileSiteKey} onSuccess={setCaptchaToken} />
          {err.captcha && <p className="mt-1 text-xs text-destructive">{err.captcha}</p>}
        </div>
      )}

      <div className="flex justify-between gap-2">
        <Button type="button" variant="outline" onClick={onBack} className="h-12 gap-2 rounded-xl text-base shadow-sm transition active:scale-95"><ArrowLeft className="h-5 w-5" /> Voltar</Button>
        <Button type="button" onClick={finish} disabled={busy} className="h-12 gap-2 rounded-xl text-base shadow-md transition hover:shadow-lg active:scale-95">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {busy ? "Criando…" : "Entrar na plataforma"}
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// ETAPA 3 — Verificação (WhatsApp ou SMS — escolha do usuário)
// ============================================================
function StepVerificacao({ s, update, onBack, onNext }: { s: State; update: <K extends keyof State>(k: K, v: State[K]) => void; onBack: () => void; onNext: () => void }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-2xl font-bold text-navy">Como prefere validar seu número?</h2>
        <p className="text-base text-muted">Enviamos um código de confirmação pra {s.phone || "seu telefone"}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => update("verify_method", "whatsapp")}
          className={`flex flex-col items-center gap-2 rounded-xl border-2 p-5 transition ${s.verify_method === "whatsapp" ? "border-gold bg-gold/5" : "border-border bg-card hover:border-navy/30"}`}>
          <MessageCircle className={`h-7 w-7 ${s.verify_method === "whatsapp" ? "text-green-600" : "text-muted"}`} />
          <b className="text-sm text-navy">WhatsApp</b>
        </button>
        <button type="button" onClick={() => update("verify_method", "sms")}
          className={`flex flex-col items-center gap-2 rounded-xl border-2 p-5 transition ${s.verify_method === "sms" ? "border-gold bg-gold/5" : "border-border bg-card hover:border-navy/30"}`}>
          <PhoneIcon className={`h-7 w-7 ${s.verify_method === "sms" ? "text-navy" : "text-muted"}`} />
          <b className="text-sm text-navy">SMS</b>
        </button>
      </div>

      <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800">
        A verificação automática por {s.verify_method === "whatsapp" ? "WhatsApp" : "SMS"} ainda está sendo configurada pela nossa equipe.
        Por enquanto, sua conta é confirmada pelo e-mail — pode continuar o cadastro normalmente.
      </div>

      <NavButtons onBack={onBack} onNext={onNext} />
    </div>
  );
}

// ============================================================
// ETAPA 3 — Dados pessoais (estado civil, nascimento/idade, sexo)
// ============================================================
function StepPessoal({ s, update, onBack, onNext }: { s: State; update: <K extends keyof State>(k: K, v: State[K]) => void; onBack: () => void; onNext: () => void }) {
  const [err, setErr] = useState("");
  const MARITAL = [
    { label: "Solteiro(a)", icon: "🙂" }, { label: "Casado(a)", icon: "💍" },
    { label: "Divorciado(a)", icon: "💔" }, { label: "Viúvo(a)", icon: "🕊️" },
    { label: "União estável", icon: "❤️" },
  ];

  const age = (() => {
    if (!s.birth_date) return null;
    const b = new Date(s.birth_date);
    if (isNaN(b.getTime())) return null;
    const today = new Date();
    let a = today.getFullYear() - b.getFullYear();
    const m = today.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < b.getDate())) a--;
    return a;
  })();

  function next() {
    if (!s.gender) { setErr("Selecione uma opção"); return; }
    setErr("");
    onNext();
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-2xl font-bold text-navy">Um pouco mais sobre você</h2>
      </div>

      <Field label="Estado civil">
        <div className="grid grid-cols-2 gap-2">
          {MARITAL.map((m) => (
            <button key={m.label} type="button" onClick={() => update("marital_status", m.label)}
              className={`flex items-center gap-2.5 rounded-xl border-2 p-3.5 text-left text-base transition hover:scale-[1.01] hover:shadow-sm ${s.marital_status === m.label ? "border-gold bg-gold/10 font-bold text-navy shadow-md" : "border-border bg-card text-ink hover:border-navy/30"}`}>
              <span className="text-xl">{m.icon}</span>{m.label}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Data de nascimento">
        <Input className="h-12 text-base" type="date" value={s.birth_date} onChange={(e) => update("birth_date", e.target.value)} />
        {age !== null && <p className="mt-1 text-sm font-semibold text-gold">Idade: {age} anos</p>}
      </Field>

      <Field label="Sexo" error={err}>
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => update("gender", "masculino")}
            className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition hover:scale-[1.02] hover:shadow-sm ${s.gender === "masculino" ? "border-blue-500 bg-blue-500/10 shadow-md" : "border-border bg-card hover:border-blue-300"}`}>
            <div className={`relative grid aspect-square w-full max-w-[140px] place-items-center overflow-hidden rounded-2xl transition ${s.gender === "masculino" ? "ring-4 ring-blue-500" : "ring-2 ring-blue-100"}`}>
              <img src="/images/avatar-masculino.png" alt="Masculino" className="h-full w-full object-cover" />
              {s.gender === "masculino" && (
                <span className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-blue-500 text-white shadow">
                  <Check className="h-4 w-4" strokeWidth={3} />
                </span>
              )}
            </div>
            <b className="text-base text-navy">Masculino</b>
          </button>
          <button type="button" onClick={() => update("gender", "feminino")}
            className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition hover:scale-[1.02] hover:shadow-sm ${s.gender === "feminino" ? "border-pink-500 bg-pink-500/10 shadow-md" : "border-border bg-card hover:border-pink-300"}`}>
            <div className={`relative grid aspect-square w-full max-w-[140px] place-items-center overflow-hidden rounded-2xl transition ${s.gender === "feminino" ? "ring-4 ring-pink-500" : "ring-2 ring-pink-100"}`}>
              <img src="/images/avatar-feminino.png" alt="Feminino" className="h-full w-full object-cover" />
              {s.gender === "feminino" && (
                <span className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-pink-500 text-white shadow">
                  <Check className="h-4 w-4" strokeWidth={3} />
                </span>
              )}
            </div>
            <b className="text-base text-navy">Feminino</b>
          </button>
        </div>
      </Field>

      <NavButtons onBack={onBack} onNext={next} />
    </div>
  );
}

// ============================================================
// ETAPA 4 — Localização (país + CEP com autocomplete)
// ============================================================
function StepLocalizacao({ s, update, onBack, onNext }: { s: State; update: <K extends keyof State>(k: K, v: State[K]) => void; onBack: () => void; onNext: () => void }) {
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState("");

  async function searchCep() {
    setBusy(true); setInfo("");
    const data = await lookupCep(s.cep);
    setBusy(false);
    if (!data) { setInfo("CEP não encontrado"); return; }
    update("state", data.uf ?? "");
    update("city", data.localidade ?? "");
    update("address", data.logradouro ?? "");
    update("neighborhood", data.bairro ?? "");
    setInfo("Endereço preenchido — você pode ajustar se quiser.");
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-2xl font-bold text-navy">Onde você mora?</h2>
        <p className="text-base text-muted">Pra encontrarmos a igreja mais próxima de você</p>
      </div>

      <Field label="País">
        <Input className="h-12 text-base" value={s.country} onChange={(e) => update("country", e.target.value)} placeholder="Brasil" />
      </Field>

      <Field label="CEP">
        <div className="flex gap-2">
          <Input className="h-12 text-base" value={s.cep} onChange={(e) => update("cep", maskCep(e.target.value))}
            placeholder="00000-000" inputMode="numeric" />
          <Button type="button" onClick={searchCep} disabled={busy} variant="outline" className="h-12 whitespace-nowrap rounded-xl px-5 text-base shadow-sm transition active:scale-95">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
          </Button>
        </div>
        {info && <p className="mt-1 text-xs text-gold">{info}</p>}
      </Field>

      <Field label="Endereço">
        <Input className="h-12 text-base" value={s.address} onChange={(e) => update("address", e.target.value)} placeholder="Rua, avenida..." />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Número (opcional)">
          <Input className="h-12 text-base" value={s.number} onChange={(e) => update("number", e.target.value)} placeholder="123" inputMode="numeric" />
        </Field>
        <Field label="Complemento (opcional)">
          <Input className="h-12 text-base" value={s.complemento} onChange={(e) => update("complemento", e.target.value)} placeholder="Apto, bloco, casa..." />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Bairro"><Input className="h-12 text-base" value={s.neighborhood} onChange={(e) => update("neighborhood", e.target.value)} /></Field>
        <Field label="Cidade"><Input className="h-12 text-base" value={s.city} onChange={(e) => update("city", e.target.value)} placeholder="Manaus" /></Field>
      </div>
      <Field label="Estado"><Input className="h-12 text-base" value={s.state} onChange={(e) => update("state", e.target.value.toUpperCase().slice(0,2))} placeholder="AM" /></Field>

      <NavButtons onBack={onBack} onNext={onNext} />
    </div>
  );
}

// ============================================================
// ETAPA 5 — Comunidade (igreja mais próxima + Life Group)
// ============================================================
function StepComunidade({ s, update, churches, cells, onBack, onNext }: {
  s: State;
  update: <K extends keyof State>(k: K, v: State[K]) => void;
  churches: { id: string; name: string; type: string; city: string | null; state: string | null }[];
  cells: { id: string; name: string; church_id: string | null; state: string | null; city: string | null; neighborhood: string | null; meeting_weekday: string | null; meeting_time: string | null; is_active: boolean }[];
  onBack: () => void; onNext: () => void;
}) {
  const [err, setErr] = useState("");

  function next() {
    if (!s.community_id) { setErr("Selecione uma comunidade"); return; }
    onNext();
  }

  const lgsAll = cells.filter((c) => c.is_active && c.church_id === s.community_id);
  const lgsSameCity   = s.city  ? lgsAll.filter((c) => c.city  && c.city.toLowerCase()  === s.city.toLowerCase())   : [];
  const lgsSameState  = s.state ? lgsAll.filter((c) => c.state && c.state.toUpperCase() === s.state.toUpperCase() && !lgsSameCity.find(x => x.id === c.id)) : [];
  const lgsOthers     = lgsAll.filter((c) => !lgsSameCity.find(x => x.id === c.id) && !lgsSameState.find(x => x.id === c.id));

  const WEEKDAYS: Record<string, string> = {
    domingo: "Dom", segunda: "Seg", terca: "Ter", quarta: "Qua",
    quinta: "Qui", sexta: "Sex", sabado: "Sáb",
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-2xl font-bold text-navy">Igreja mais próxima</h2>
        <p className="text-base text-muted">Onde você gostaria de ser acompanhado</p>
      </div>

      <div className="space-y-2">
        {churches.map((c) => {
          const selected = s.community_id === c.id;
          return (
            <button key={c.id} type="button"
              onClick={() => {
                if (s.community_id !== c.id) update("life_group_id", "");
                update("community_id", c.id); setErr("");
              }}
              className={`flex w-full items-start gap-3 rounded-xl border-2 p-4 text-left transition ${selected ? "border-gold bg-gold/5" : "border-border bg-card hover:border-navy/30"}`}>
              <div className={`mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 ${selected ? "border-gold bg-gold" : "border-border"}`}>
                {selected && <Check className="h-4 w-4 text-navy" />}
              </div>
              <div>
                <b className="text-navy">{c.name}</b>
                {(c.city || c.state) && <p className="text-xs text-muted">{[c.city, c.state].filter(Boolean).join(", ")}</p>}
              </div>
            </button>
          );
        })}
      </div>

      {s.community_id && lgsAll.length > 0 && (
        <div className="rounded-xl border-2 border-dashed border-gold/40 bg-gold/5 p-4">
          <h3 className="font-display text-base text-navy">Encontre seu Life Group</h3>
          <p className="text-xs text-muted">Opcional — você pode escolher agora ou pular e a liderança te ajuda depois</p>

          {lgsSameCity.length > 0 && (
            <LgGroup label={`Em ${s.city}`} cells={lgsSameCity} selected={s.life_group_id} onSelect={(id) => update("life_group_id", id)} weekdays={WEEKDAYS} />
          )}
          {lgsSameState.length > 0 && (
            <LgGroup label={s.state ? `Em outras cidades de ${s.state}` : "Outras"} cells={lgsSameState} selected={s.life_group_id} onSelect={(id) => update("life_group_id", id)} weekdays={WEEKDAYS} />
          )}
          {lgsOthers.length > 0 && lgsSameCity.length === 0 && lgsSameState.length === 0 && (
            <LgGroup label="Todos os Life Groups" cells={lgsOthers} selected={s.life_group_id} onSelect={(id) => update("life_group_id", id)} weekdays={WEEKDAYS} />
          )}

          <button type="button" onClick={() => update("life_group_id", "")}
            className={`mt-3 w-full rounded-lg border-2 p-3 text-left text-sm transition ${!s.life_group_id ? "border-gold bg-card" : "border-border bg-card/50 hover:border-navy/30"}`}>
            <b className="text-navy">Não sei / preciso de ajuda</b>
            <p className="text-xs text-muted">A liderança vai entrar em contato pra te indicar o LG ideal</p>
          </button>
        </div>
      )}

      {err && <p className="text-xs text-destructive">{err}</p>}
      <NavButtons onBack={onBack} onNext={next} />
    </div>
  );
}

function LgGroup({ label, cells, selected, onSelect, weekdays }: {
  label: string;
  cells: { id: string; name: string; neighborhood: string | null; city: string | null; meeting_weekday: string | null; meeting_time: string | null }[];
  selected: string;
  onSelect: (id: string) => void;
  weekdays: Record<string, string>;
}) {
  return (
    <div className="mt-3">
      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-gold">{label}</p>
      <div className="space-y-1.5">
        {cells.map((c) => {
          const isSelected = selected === c.id;
          return (
            <button key={c.id} type="button" onClick={() => onSelect(c.id)}
              className={`flex w-full items-start gap-3 rounded-lg border-2 p-2.5 text-left transition ${isSelected ? "border-gold bg-card" : "border-border bg-card/50 hover:border-navy/30"}`}>
              <div className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 ${isSelected ? "border-gold bg-gold" : "border-border"}`}>
                {isSelected && <Check className="h-3 w-3 text-navy" />}
              </div>
              <div className="min-w-0 flex-1">
                <b className="block text-sm text-navy">{c.name}</b>
                <p className="text-[11px] text-muted">
                  {[c.neighborhood, c.city].filter(Boolean).join(", ")}
                  {c.meeting_weekday && c.meeting_time && ` · ${weekdays[c.meeting_weekday] ?? c.meeting_weekday} às ${c.meeting_time.slice(0,5)}`}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// ETAPA 6 — História de fé (batismo, última igreja, Espírito Santo)
// ============================================================
function StepFe({ s, update, onBack, onNext }: { s: State; update: <K extends keyof State>(k: K, v: State[K]) => void; onBack: () => void; onNext: () => void }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-2xl font-bold text-navy">Sua história de fé</h2>
        <p className="text-base text-muted">Isso nos ajuda a te acompanhar melhor — seja você novo ou antigo na fé</p>
      </div>

      <Field label="Você já foi batizado(a) nas águas?">
        <YesNoIcon value={s.baptized} onChange={(v) => update("baptized", v)} icon={<Droplets className="h-7 w-7" />} />
      </Field>
      {s.baptized && (
        <Field label="Data do batismo"><Input className="h-12 text-base" type="date" value={s.baptism_date} onChange={(e) => update("baptism_date", e.target.value)} /></Field>
      )}

      <Field label="Qual foi a última igreja que você frequentou? (opcional)">
        <Input className="h-12 text-base" value={s.last_church} onChange={(e) => update("last_church", e.target.value)} placeholder="Nome da igreja" />
      </Field>

      <Field label="Você já foi batizado(a) no Espírito Santo?">
        <YesNoIcon value={s.holy_spirit_baptized} onChange={(v) => update("holy_spirit_baptized", v)} icon={<Flame className="h-7 w-7" />} />
      </Field>
      {s.holy_spirit_baptized && (
        <Field label="Data do batismo no Espírito Santo"><Input className="h-12 text-base" type="date" value={s.holy_spirit_baptism_date} onChange={(e) => update("holy_spirit_baptism_date", e.target.value)} /></Field>
      )}

      <NavButtons onBack={onBack} onNext={onNext} />
    </div>
  );
}

function YesNoIcon({ value, onChange, icon }: { value: boolean | null; onChange: (v: boolean) => void; icon: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <button type="button" onClick={() => onChange(true)}
        className={`relative flex flex-col items-center gap-2 rounded-xl border-2 p-5 transition hover:scale-[1.02] ${value === true ? "border-green-600 bg-green-600 shadow-md" : "border-border bg-card hover:border-green-400"}`}>
        {value === true && (
          <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-white text-green-600">
            <Check className="h-4 w-4" strokeWidth={3} />
          </span>
        )}
        <span className={value === true ? "text-white" : "text-muted"}>{icon}</span>
        <b className={`text-base ${value === true ? "text-white" : "text-navy"}`}>Sim</b>
      </button>
      <button type="button" onClick={() => onChange(false)}
        className={`relative flex flex-col items-center gap-2 rounded-xl border-2 p-5 transition hover:scale-[1.02] ${value === false ? "border-gray-500 bg-gray-500 shadow-md" : "border-border bg-card hover:border-gray-400"}`}>
        {value === false && (
          <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-white text-gray-600">
            <X className="h-4 w-4" strokeWidth={3} />
          </span>
        )}
        <span className={value === false ? "text-white" : "text-muted"}>{icon}</span>
        <b className={`text-base ${value === false ? "text-white" : "text-navy"}`}>Ainda não</b>
      </button>
    </div>
  );
}

// ============================================================
// ETAPA 7 — Jornada (motivo, vida antes, testemunho, grupo) — opcionais
// ============================================================
function StepJornada({ s, update, onBack, onNext }: { s: State; update: <K extends keyof State>(k: K, v: State[K]) => void; onBack: () => void; onNext: () => void }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-2xl font-bold text-navy">Sua jornada</h2>
        <p className="text-base text-muted">Tudo aqui é opcional — pode deixar em branco e continuar</p>
      </div>

      <Field label="O que te fez procurar a igreja? (opcional)">
        <Textarea value={s.seeking_reason} onChange={(e) => update("seeking_reason", e.target.value)} rows={2} placeholder="Conte um pouco, se quiser..." />
      </Field>

      <Field label="Como era sua vida antes de vir pra igreja? (opcional)">
        <Textarea value={s.life_before_church} onChange={(e) => update("life_before_church", e.target.value)} rows={2} placeholder="Vamos analisar com carinho..." />
      </Field>

      <Field label="Quer compartilhar seu testemunho? (opcional)">
        <div className="mb-1.5 flex items-center gap-1.5 text-xs text-gold"><BookHeart className="h-3.5 w-3.5" />Sua história pode inspirar outras pessoas</div>
        <Textarea value={s.testimony} onChange={(e) => update("testimony", e.target.value)} rows={3} placeholder="O que Deus tem feito na sua vida..." />
      </Field>

      <Field label="Você já pertence a algum grupo da igreja?">
        <YesNoIcon value={s.belongs_to_group} onChange={(v) => update("belongs_to_group", v)} icon={<UsersRound className="h-7 w-7" />} />
      </Field>
      {s.belongs_to_group && (
        <Field label="Qual grupo?"><Input className="h-12 text-base" value={s.group_name} onChange={(e) => update("group_name", e.target.value)} placeholder="Nome do grupo/ministério" /></Field>
      )}

      <NavButtons onBack={onBack} onNext={onNext} />
    </div>
  );
}

// ============================================================
// ETAPA 8 — Como podemos te servir (intenção)
// ============================================================
function StepIntencao({ s, update, onBack, onNext }: { s: State; update: <K extends keyof State>(k: K, v: State[K]) => void; onBack: () => void; onNext: () => void }) {
  const intents: PipelineIntent[] = ["lifegroup","discipulado","acompanhamento_pastoral","visita","conhecer","batismo","servir","outro"];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-2xl font-bold text-navy">Como podemos te servir?</h2>
        <p className="text-base text-muted">Escolha o que melhor descreve seu desejo agora</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {intents.map((k) => {
          const cfg = INTENT_LABELS[k];
          const Ico = cfg.icon;
          const selected = s.intent === k;
          return (
            <button key={k} type="button" onClick={() => update("intent", k)}
              className={`relative flex items-start gap-3 rounded-xl border-2 p-4 text-left transition hover:scale-[1.01] ${selected ? "border-gold bg-gold/10 shadow-md" : "border-border bg-card hover:border-gold/40"}`}>
              {selected && (
                <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-gold text-navy">
                  <Check className="h-4 w-4" strokeWidth={3} />
                </span>
              )}
              <Ico className={`h-6 w-6 shrink-0 ${selected ? "text-gold" : "text-muted"}`} />
              <div>
                <b className="text-base text-navy">{cfg.label}</b>
                <p className="text-base text-muted">{cfg.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      <NavButtons onBack={onBack} onNext={onNext} />
    </div>
  );
}

// ============================================================
// ETAPA 9 — Finalização (cria auth.user + profile + pipeline completo)
// ============================================================
function StepFinalizacao({ s, update, onBack, onDone, setGlobalErr }: { s: State; update: <K extends keyof State>(k: K, v: State[K]) => void; onBack: () => void; onDone: () => void; setGlobalErr: (msg: string) => void }) {
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [err, setErr] = useState<Record<string,string>>({});
  const [busy, setBusy] = useState(false);
  const [lgpdAccepted, setLgpdAccepted] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  async function finish() {
    const errs: Record<string,string> = {};
    if (s.password.length < 6) errs.password = "Senha precisa ter ao menos 6 caracteres";
    if (s.password !== passwordConfirm) errs.password_confirm = "Senhas não conferem";
    if (!lgpdAccepted) errs.lgpd = "Você precisa aceitar os Termos e a Política de Privacidade para continuar.";
    if (turnstileSiteKey && !captchaToken) errs.captcha = "Confirme que você não é um robô.";
    setErr(errs);
    if (Object.keys(errs).length > 0) return;

    setBusy(true); setGlobalErr("");
    try {
      const { error: signError } = await supabase.auth.signUp({
        email: s.email, password: s.password,
        options: { data: { full_name: s.full_name }, captchaToken: captchaToken ?? undefined },
      });
      if (signError) {
        setGlobalErr(signError.message.includes("already") ? "Este e-mail já está cadastrado. Tente fazer login." : signError.message);
        setBusy(false); return;
      }

      await createPipelineEntryFull(supabase, {
        community_id: s.community_id,
        intent: s.intent,
        full_name: s.full_name,
        phone: s.phone,
        email: s.email,
        state: s.state || undefined,
        city: s.city || undefined,
        cep: s.cep || undefined,
        life_group_id: s.life_group_id || undefined,
        cpf: s.cpf || undefined,
        gender: s.gender || undefined,
        marital_status: s.marital_status || undefined,
        birth_date: s.birth_date || undefined,
        country: s.country || undefined,
        address: s.number ? `${s.address}, ${s.number}` : (s.address || undefined),
        complemento: s.complemento || undefined,
        neighborhood: s.neighborhood || undefined,
        baptized: s.baptized ?? undefined,
        baptism_date: s.baptism_date || undefined,
        last_church: s.last_church || undefined,
        holy_spirit_baptized: s.holy_spirit_baptized ?? undefined,
        holy_spirit_baptism_date: s.holy_spirit_baptism_date || undefined,
        seeking_reason: s.seeking_reason || undefined,
        life_before_church: s.life_before_church || undefined,
        testimony: s.testimony || undefined,
        belongs_to_group: s.belongs_to_group ?? undefined,
        group_name: s.group_name || undefined,
      });

      onDone();
    } catch (e: unknown) {
      setGlobalErr(e instanceof Error ? e.message : "Erro ao finalizar cadastro");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <PartyPopper className="h-5 w-5 text-gold" />
        <div>
          <h2 className="font-display text-2xl font-bold text-navy">Quase lá, {s.full_name.split(" ")[0] || "amigo(a)"}!</h2>
          <p className="text-base text-muted">Crie uma senha para acessar sua conta</p>
        </div>
      </div>

      <Field label="Senha" error={err.password}>
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"} value={s.password}
            onChange={(e) => update("password", e.target.value)} placeholder="Mínimo 6 caracteres"
            className="h-12 text-base pr-10"
          />
          <button
            type="button" onClick={() => setShowPassword((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-navy"
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </Field>
      <Field label="Confirmar senha" error={err.password_confirm}>
        <div className="relative">
          <Input
            type={showPasswordConfirm ? "text" : "password"} value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            className="h-12 text-base pr-10"
          />
          <button
            type="button" onClick={() => setShowPasswordConfirm((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-navy"
            aria-label={showPasswordConfirm ? "Ocultar senha" : "Mostrar senha"}
            tabIndex={-1}
          >
            {showPasswordConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </Field>

      <SectionDivider label="Termos de Uso" />
      <TermsCheckbox checked={lgpdAccepted} onChange={setLgpdAccepted} error={err.lgpd} />

      {turnstileSiteKey && (
        <div className="flex justify-center">
          <Turnstile siteKey={turnstileSiteKey} onSuccess={setCaptchaToken} />
          {err.captcha && <p className="mt-1 text-xs text-destructive">{err.captcha}</p>}
        </div>
      )}

      <div className="flex justify-between gap-2">
        <Button type="button" variant="outline" onClick={onBack} className="h-12 gap-2 rounded-xl text-base shadow-sm transition active:scale-95"><ArrowLeft className="h-5 w-5" /> Voltar</Button>
        <Button type="button" onClick={finish} disabled={busy} className="h-12 gap-2 rounded-xl text-base shadow-md transition hover:shadow-lg active:scale-95">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Concluir cadastro
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// TELA FINAL
// ============================================================
function FinishedScreen({ hasLg }: { hasLg: boolean }) {
  return (
    <DarkBlueTheme className="grid place-items-center p-5">
      <Card className="max-w-md text-center">
        <CardContent className="space-y-3 px-8 py-10">
          <Check className="mx-auto h-12 w-12 text-gold" />
          <h1 className="font-display text-2xl text-white">Cadastro recebido!</h1>

          <div className="rounded-lg bg-blue-500/10 border border-blue-400/30 px-4 py-3 text-sm text-blue-100 text-left space-y-1">
            <p className="font-semibold">📧 Verifique seu e-mail</p>
            <p>
              Enviamos um link de confirmação para o e-mail informado.
              Clique no link para ativar sua conta antes de fazer login.
            </p>
            <p className="text-xs text-blue-200">Não recebeu? Verifique a pasta de spam.</p>
          </div>

          {hasLg ? (
            <p className="text-sm text-white/70">
              Sua história foi registrada com a liderança.
              Em breve um líder entrará em contato com você.
            </p>
          ) : (
            <p className="text-sm text-white/70">
              Sua história foi registrada com a liderança.
              <br /><br />
              <b className="text-white">Um(a) pastor(a) entrará em contato em breve</b> para te indicar o Life Group ideal pra você.
            </p>
          )}
          <div className="flex flex-col gap-2 pt-2">
            <Button asChild className="h-12 rounded-xl text-base shadow-md"><Link href="/entrar">Ir para o Portal</Link></Button>
            <Button asChild variant="outline" className="h-12 rounded-xl text-base shadow-sm"><Link href="/">Voltar à página inicial</Link></Button>
          </div>
        </CardContent>
      </Card>
    </DarkBlueTheme>
  );
}

// ============================================================
// HELPERS
// ============================================================
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-base font-bold text-navy">{label}</Label>{children}
      {error && <p className="text-sm font-semibold text-destructive">{error}</p>}
    </div>
  );
}
function NavButtons({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  return (
    <div className="flex justify-between gap-2">
      <Button type="button" variant="outline" onClick={onBack} className="h-12 gap-2 rounded-xl text-base shadow-sm transition active:scale-95"><ArrowLeft className="h-5 w-5" /> Voltar</Button>
      <Button type="button" onClick={onNext} className="h-12 gap-2 rounded-xl text-base shadow-md transition hover:shadow-lg active:scale-95">Continuar <ArrowRight className="h-5 w-5" /></Button>
    </div>
  );
}

/** Divisor discreto entre seções do formulário (§9.8). */
function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <span className="text-xs font-bold uppercase tracking-wider text-gold">{label}</span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

/**
 * Etapa de Termos/LGPD — versão acessível (checkbox e área clicável
 * maiores, fonte maior, melhor contraste) conforme CTI-001.
 */
function TermsCheckbox({ checked, onChange, error }: { checked: boolean; onChange: (v: boolean) => void; error?: string }) {
  return (
    <div className="rounded-xl border-2 border-gold/40 bg-gold/5 p-4">
      <label htmlFor="lgpd" className="flex cursor-pointer items-start gap-4">
        <Checkbox
          id="lgpd" checked={checked} onCheckedChange={(v) => onChange(!!v)}
          className="mt-0.5 h-6 w-6 shrink-0"
        />
        <span className="text-base leading-relaxed text-ink">
          Li e aceito os{" "}
          <Link href="/termos" target="_blank" className="font-bold text-navy underline decoration-2 underline-offset-2 hover:text-gold">
            Termos de Uso
          </Link>{" "}
          e a{" "}
          <Link href="/privacidade" target="_blank" className="font-bold text-navy underline decoration-2 underline-offset-2 hover:text-gold">
            Política de Privacidade
          </Link>
          , e autorizo o tratamento dos meus dados pessoais para fins pastorais, conforme a LGPD.
        </span>
      </label>
      {error && <p className="mt-2 pl-10 text-sm font-semibold text-destructive">{error}</p>}
    </div>
  );
}
function maskCpf(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`;
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
}
