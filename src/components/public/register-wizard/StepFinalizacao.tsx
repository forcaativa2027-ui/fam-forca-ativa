"use client";
import { useState } from "react";
import { ArrowLeft, Check, Eye, EyeOff, Loader2, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase/client";
import { createPipelineEntryFull } from "@/services/pipeline";
import { Field, SectionDivider, TermsCheckbox } from "./RegisterWizardHelpers";
import type { RegisterState, UpdateFn } from "./RegisterWizardTypes";

// ============================================================
// ETAPA 10 — Finalização (cria auth.user + profile + pipeline completo)
// ============================================================
export function StepFinalizacao({ s, update, onBack, onDone, setGlobalErr }: { s: RegisterState; update: UpdateFn; onBack: () => void; onDone: () => void; setGlobalErr: (msg: string) => void }) {
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [err, setErr] = useState<Record<string,string>>({});
  const [busy, setBusy] = useState(false);
  const [lgpdAccepted, setLgpdAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  async function finish() {
    if (busy) return;
    const errs: Record<string,string> = {};
    if (!s.community_id) errs.community = "Selecione uma região de atendimento antes de finalizar o cadastro.";
    if (s.password.length < 6) errs.password = "Senha precisa ter ao menos 6 caracteres";
    if (s.password !== passwordConfirm) errs.password_confirm = "Senhas não conferem";
    if (!lgpdAccepted) errs.lgpd = "Você precisa aceitar os Termos e a Política de Privacidade para continuar.";
    setErr(errs);
    if (Object.keys(errs).length > 0) return;

    setBusy(true); setGlobalErr("");
    try {
      const { data: signUpData, error: signError } = await supabase.auth.signUp({
        email: s.email, password: s.password,
        options: { data: { full_name: s.full_name } },
      });
      if (signError) {
        const msg = signError.message.toLowerCase();
        if (msg.includes("already")) {
          setGlobalErr("Este e-mail já está cadastrado. Tente fazer login.");
        } else if (msg.includes("rate limit") || msg.includes("too many requests") || msg.includes("email rate limit")) {
          setGlobalErr("O serviço de confirmação por e-mail atingiu o limite temporário de envios. Nenhum novo cadastro foi concluído nesta tentativa. Aguarde alguns minutos antes de tentar novamente e evite tocar em Concluir várias vezes.");
        } else {
          setGlobalErr(signError.message);
        }
        setBusy(false); return;
      }
      if (!signUpData.session) {
        setGlobalErr("Sua conta foi criada, mas precisa ser confirmada pelo e-mail antes de concluir o cadastro. Verifique sua caixa de entrada e faça login para finalizar.");
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
      {err.community && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{err.community}</p>}

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

      <div className="flex justify-between gap-2">
        <Button type="button" variant="outline" onClick={onBack} className="h-12 gap-2 rounded-xl text-base shadow-sm transition active:scale-95"><ArrowLeft className="h-5 w-5" /> Voltar</Button>
        <Button type="button" onClick={finish} disabled={busy} className="h-12 gap-2 rounded-xl text-base shadow-md transition hover:shadow-lg active:scale-95">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {busy ? "Enviando..." : "Concluir cadastro"}
        </Button>
      </div>
    </div>
  );
}
