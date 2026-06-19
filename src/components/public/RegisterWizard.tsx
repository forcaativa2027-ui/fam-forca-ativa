"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft, ArrowRight, Check, Sparkles, Heart, Users, MessageCircleHeart,
  Home as HomeIcon, Eye, HandHeart, Droplets, Hand, HelpCircle, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabase/client";
import { useChurches, useActiveCommunity } from "@/hooks/use-queries";
import { lookupCep, maskPhone, maskCep, createPipelineEntry } from "@/services/pipeline";
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

interface State {
  step: number;
  full_name: string;
  phone: string;
  email: string;
  cep: string;
  state: string;
  city: string;
  community_id: string;
  intent: PipelineIntent;
  password: string;
}

const INITIAL_STATE: State = {
  step: 1,
  full_name: "", phone: "", email: "",
  cep: "", state: "", city: "",
  community_id: "", intent: "conhecer",
  password: "",
};

export default function RegisterWizard() {
  const params = useSearchParams();
  const initialIntent = (params.get("intent") as PipelineIntent | null) ?? "conhecer";
  const { data: churches = [] } = useChurches();
  const { data: activeCommunity } = useActiveCommunity();
  const [s, setS] = useState<State>({ ...INITIAL_STATE, intent: initialIntent });
  const [done, setDone] = useState(false);
  const [globalErr, setGlobalErr] = useState("");

  // Quando souber a comunidade ativa, pre-seleciona na Etapa 3
  useEffect(() => {
    if (activeCommunity?.id && !s.community_id) {
      setS((prev) => ({ ...prev, community_id: activeCommunity.id }));
    }
  }, [activeCommunity?.id, s.community_id]);

  function update<K extends keyof State>(k: K, v: State[K]) {
    setS((prev) => ({ ...prev, [k]: v }));
  }

  const TOTAL_STEPS = 5;

  if (done) return <FinishedScreen />;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_30%_20%,#16345A,#0E2A47_60%)] p-4">
      <div className="mx-auto max-w-xl py-8">
        <Link href="/" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Voltar à página inicial
        </Link>

        <Card className="overflow-hidden">
          {/* Progresso */}
          <div className="border-b bg-navy-50 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-navy">
                <Sparkles className="h-4 w-4 text-gold" />
                <b className="font-display text-base">Cadastro CEC Family</b>
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted">Etapa {s.step} de {TOTAL_STEPS}</span>
            </div>
            <div className="mt-3 flex gap-1">
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <div key={i} className={`h-1 flex-1 rounded-full ${i < s.step ? "bg-gold" : "bg-border"}`} />
              ))}
            </div>
          </div>

          <CardContent className="p-6">
            {globalErr && <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{globalErr}</p>}

            {s.step === 1 && <Step1 s={s} update={update} onNext={() => setS({ ...s, step: 2 })} />}
            {s.step === 2 && <Step2 s={s} update={update} onBack={() => setS({ ...s, step: 1 })} onNext={() => setS({ ...s, step: 3 })} />}
            {s.step === 3 && <Step3 s={s} update={update} churches={churches} onBack={() => setS({ ...s, step: 2 })} onNext={() => setS({ ...s, step: 4 })} />}
            {s.step === 4 && <Step4 s={s} update={update} onBack={() => setS({ ...s, step: 3 })} onNext={() => setS({ ...s, step: 5 })} />}
            {s.step === 5 && <Step5 s={s} update={update} onBack={() => setS({ ...s, step: 4 })} onDone={() => setDone(true)} setGlobalErr={setGlobalErr} />}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

// ============================================================
// ETAPA 1 — Dados básicos
// ============================================================
function Step1({ s, update, onNext }: { s: State; update: <K extends keyof State>(k: K, v: State[K]) => void; onNext: () => void }) {
  const [err, setErr] = useState<Record<string,string>>({});

  function next() {
    const errs: Record<string,string> = {};
    if (s.full_name.trim().length < 3) errs.full_name = "Nome muito curto";
    const cleanPhone = s.phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) errs.phone = "Telefone incompleto";
    if (s.email && !/^\S+@\S+\.\S+$/.test(s.email)) errs.email = "E-mail inválido";
    setErr(errs);
    if (Object.keys(errs).length === 0) onNext();
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl text-navy">Vamos começar</h2>
        <p className="text-sm text-muted">Conta um pouco sobre você</p>
      </div>

      <Field label="Nome completo" error={err.full_name}>
        <Input value={s.full_name} onChange={(e) => update("full_name", e.target.value)} placeholder="Maria Silva" autoFocus />
      </Field>

      <Field label="Telefone / WhatsApp" error={err.phone}>
        <Input value={s.phone} onChange={(e) => update("phone", maskPhone(e.target.value))} placeholder="(00) 00000-0000" inputMode="tel" />
      </Field>

      <Field label="E-mail (opcional)" error={err.email}>
        <Input value={s.email} type="email" onChange={(e) => update("email", e.target.value)} placeholder="seu@email.com" />
        <p className="mt-1 text-[11px] text-muted">Será exigido na última etapa para criar sua conta.</p>
      </Field>

      <div className="flex justify-end">
        <Button onClick={next} className="gap-2">Continuar <ArrowRight className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}

// ============================================================
// ETAPA 2 — Localização (CEP + ViaCEP)
// ============================================================
function Step2({ s, update, onBack, onNext }: { s: State; update: <K extends keyof State>(k: K, v: State[K]) => void; onBack: () => void; onNext: () => void }) {
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState("");

  async function searchCep() {
    setBusy(true); setInfo("");
    const data = await lookupCep(s.cep);
    setBusy(false);
    if (!data) { setInfo("CEP não encontrado"); return; }
    update("state", data.uf ?? "");
    update("city", data.localidade ?? "");
    setInfo("Endereço preenchido — você pode ajustar se quiser.");
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl text-navy">Onde você mora?</h2>
        <p className="text-sm text-muted">Pra encontrarmos um Life Group próximo de você</p>
      </div>

      <Field label="CEP">
        <div className="flex gap-2">
          <Input value={s.cep} onChange={(e) => update("cep", maskCep(e.target.value))}
            placeholder="00000-000" inputMode="numeric" />
          <Button type="button" onClick={searchCep} disabled={busy} variant="outline" className="whitespace-nowrap">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
          </Button>
        </div>
        {info && <p className="mt-1 text-xs text-gold">{info}</p>}
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Estado"><Input value={s.state} onChange={(e) => update("state", e.target.value.toUpperCase().slice(0,2))} placeholder="AM" /></Field>
        <Field label="Cidade"><Input value={s.city} onChange={(e) => update("city", e.target.value)} placeholder="Manaus" /></Field>
      </div>

      <NavButtons onBack={onBack} onNext={onNext} />
    </div>
  );
}

// ============================================================
// ETAPA 3 — Comunidade
// ============================================================
function Step3({ s, update, churches, onBack, onNext }: { s: State; update: <K extends keyof State>(k: K, v: State[K]) => void; churches: { id: string; name: string; type: string; city: string | null; state: string | null }[]; onBack: () => void; onNext: () => void }) {
  const [err, setErr] = useState("");

  function next() {
    if (!s.community_id) { setErr("Selecione uma comunidade"); return; }
    onNext();
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl text-navy">Qual comunidade?</h2>
        <p className="text-sm text-muted">Onde você gostaria de ser acompanhado</p>
      </div>

      <div className="space-y-2">
        {churches.map((c) => {
          const selected = s.community_id === c.id;
          return (
            <button key={c.id} type="button" onClick={() => { update("community_id", c.id); setErr(""); }}
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

      {err && <p className="text-xs text-destructive">{err}</p>}
      <NavButtons onBack={onBack} onNext={next} />
    </div>
  );
}

// ============================================================
// ETAPA 4 — Intenção
// ============================================================
function Step4({ s, update, onBack, onNext }: { s: State; update: <K extends keyof State>(k: K, v: State[K]) => void; onBack: () => void; onNext: () => void }) {
  const intents: PipelineIntent[] = ["lifegroup","discipulado","acompanhamento_pastoral","visita","conhecer","batismo","servir","outro"];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl text-navy">Como podemos te servir?</h2>
        <p className="text-sm text-muted">Escolha o que melhor descreve seu desejo agora</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {intents.map((k) => {
          const cfg = INTENT_LABELS[k];
          const Ico = cfg.icon;
          const selected = s.intent === k;
          return (
            <button key={k} type="button" onClick={() => update("intent", k)}
              className={`flex items-start gap-3 rounded-xl border-2 p-3 text-left transition ${selected ? "border-gold bg-gold/5" : "border-border bg-card hover:border-navy/30"}`}>
              <Ico className={`h-5 w-5 shrink-0 ${selected ? "text-gold" : "text-muted"}`} />
              <div>
                <b className="text-sm text-navy">{cfg.label}</b>
                <p className="text-[11px] text-muted">{cfg.description}</p>
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
// ETAPA 5 — Finalização (cria auth.user + profile + pipeline)
// ============================================================
function Step5({ s, update, onBack, onDone, setGlobalErr }: { s: State; update: <K extends keyof State>(k: K, v: State[K]) => void; onBack: () => void; onDone: () => void; setGlobalErr: (msg: string) => void }) {
  const [email, setEmail] = useState(s.email);
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [err, setErr] = useState<Record<string,string>>({});
  const [busy, setBusy] = useState(false);

  async function finish() {
    const errs: Record<string,string> = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) errs.email = "E-mail inválido";
    if (s.password.length < 6) errs.password = "Senha precisa ter ao menos 6 caracteres";
    if (s.password !== passwordConfirm) errs.password_confirm = "Senhas não conferem";
    setErr(errs);
    if (Object.keys(errs).length > 0) return;

    setBusy(true); setGlobalErr("");
    try {
      // 1) signUp no Supabase Auth (trigger cria o profile)
      const { error: signError } = await supabase.auth.signUp({
        email, password: s.password,
        options: { data: { full_name: s.full_name } },
      });
      if (signError) {
        setGlobalErr(signError.message.includes("already") ? "Este e-mail já está cadastrado. Tente fazer login." : signError.message);
        setBusy(false); return;
      }

      // 2) Cria entrada no pipeline
      await createPipelineEntry(supabase, {
        community_id: s.community_id,
        intent: s.intent,
        full_name: s.full_name,
        phone: s.phone,
        email,
        state: s.state || undefined,
        city: s.city || undefined,
        cep: s.cep || undefined,
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
      <div>
        <h2 className="font-display text-xl text-navy">Crie sua conta</h2>
        <p className="text-sm text-muted">Defina e-mail e senha para acessar a área do membro</p>
      </div>

      <Field label="E-mail" error={err.email}>
        <Input type="email" value={email} onChange={(e) => { setEmail(e.target.value); update("email", e.target.value); }} placeholder="seu@email.com" />
      </Field>
      <Field label="Senha" error={err.password}>
        <Input type="password" value={s.password} onChange={(e) => update("password", e.target.value)} placeholder="Mínimo 6 caracteres" />
      </Field>
      <Field label="Confirme a senha" error={err.password_confirm}>
        <Input type="password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} />
      </Field>

      {/* Resumo */}
      <details className="rounded-md border bg-navy-50/40 p-3 text-xs">
        <summary className="cursor-pointer font-bold uppercase tracking-wider text-navy-600">Confirme seus dados</summary>
        <div className="mt-2 space-y-1 text-ink">
          <p><b>Nome:</b> {s.full_name}</p>
          <p><b>Telefone:</b> {s.phone}</p>
          {(s.city || s.state) && <p><b>Cidade:</b> {[s.city, s.state].filter(Boolean).join(" / ")}</p>}
          <p><b>Intenção:</b> {INTENT_LABELS[s.intent].label}</p>
        </div>
      </details>

      <div className="flex justify-between gap-2">
        <Button type="button" variant="outline" onClick={onBack} className="gap-2"><ArrowLeft className="h-4 w-4" /> Voltar</Button>
        <Button type="button" onClick={finish} disabled={busy} className="gap-2">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {busy ? "Criando…" : "Finalizar cadastro"}
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// TELA FINAL
// ============================================================
function FinishedScreen() {
  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_30%_20%,#16345A,#0E2A47_60%)] p-5">
      <Card className="max-w-md text-center">
        <CardContent className="space-y-3 px-8 py-10">
          <Check className="mx-auto h-12 w-12 text-gold" />
          <h1 className="font-display text-2xl text-navy">Cadastro recebido!</h1>
          <p className="text-sm text-muted">
            Sua conta foi criada e sua intenção foi registrada com a liderança.
            Em breve um líder entrará em contato com você.
          </p>
          <div className="flex flex-col gap-2 pt-2">
            <Button asChild><Link href="/painel">Entrar na área do membro</Link></Button>
            <Button asChild variant="outline"><Link href="/">Voltar à página inicial</Link></Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

// ============================================================
// HELPERS
// ============================================================
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>{children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
function NavButtons({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  return (
    <div className="flex justify-between gap-2">
      <Button type="button" variant="outline" onClick={onBack} className="gap-2"><ArrowLeft className="h-4 w-4" /> Voltar</Button>
      <Button type="button" onClick={onNext} className="gap-2">Continuar <ArrowRight className="h-4 w-4" /></Button>
    </div>
  );
}
