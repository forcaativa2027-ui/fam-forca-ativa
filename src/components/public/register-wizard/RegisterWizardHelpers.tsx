"use client";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { DarkBlueTheme } from "@/components/shared/DarkBlueTheme";

export function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-base font-bold text-navy">{label}</Label>{children}
      {error && <p className="text-sm font-semibold text-destructive">{error}</p>}
    </div>
  );
}

export function NavButtons({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  return (
    <div className="flex justify-between gap-2">
      <Button type="button" variant="outline" onClick={onBack} className="h-12 gap-2 rounded-xl text-base shadow-sm transition active:scale-95"><ArrowLeft className="h-5 w-5" /> Voltar</Button>
      <Button type="button" onClick={onNext} className="h-12 gap-2 rounded-xl text-base shadow-md transition hover:shadow-lg active:scale-95">Continuar <ArrowRight className="h-5 w-5" /></Button>
    </div>
  );
}

/** Divisor discreto entre seções do formulário (§9.8). */
export function SectionDivider({ label }: { label: string }) {
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
export function TermsCheckbox({ checked, onChange, error }: { checked: boolean; onChange: (v: boolean) => void; error?: string }) {
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

export function YesNoIcon({ value, onChange, icon }: { value: boolean | null; onChange: (v: boolean) => void; icon: React.ReactNode }) {
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

export function FinishedScreen({ hasLg }: { hasLg: boolean }) {
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
