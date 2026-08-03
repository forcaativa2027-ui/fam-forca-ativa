"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase/client";
import * as Mfa from "@/services/mfa";
import { logAudit } from "@/services/audit";

/**
 * UX-004 §6.1 — Segunda etapa do login pra quem tem 2FA ativo. O
 * LoginForm já validou a senha; essa tela confirma o código do
 * aplicativo autenticador antes de liberar o acesso de verdade.
 */
export default function Verificacao2FAPage() {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) { window.location.href = "/entrar"; return; }
      const { current, next } = await Mfa.getAssuranceLevel(supabase);
      if (current === "aal2" || current === next) {
        // Já está no nível certo (ou não tem 2FA configurado) — nada a fazer aqui.
        window.location.href = "/painel";
        return;
      }
      const factors = await Mfa.listFactors(supabase);
      const verified = factors.find((f) => f.status === "verified");
      if (!verified) { window.location.href = "/painel"; return; }
      setFactorId(verified.id);
      setLoading(false);
    })();
  }, []);

  async function confirm() {
    if (!factorId || code.length !== 6) { setErr("Digite o código de 6 dígitos do seu aplicativo autenticador."); return; }
    setBusy(true); setErr("");
    try {
      await Mfa.verifyLoginChallenge(supabase, factorId, code);
      const { data } = await supabase.auth.getUser();
      if (data.user) await logAudit(supabase, "login", "auth", data.user.id, { mfa: true });
      window.location.href = "/painel";
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? "Código inválido. Tente de novo.");
    } finally { setBusy(false); }
  }

  async function cancel() {
    await supabase.auth.signOut();
    window.location.href = "/entrar";
  }

  if (loading) {
    return <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_30%_20%,#16345A,#0E2A47_60%)]"><Loader2 className="h-6 w-6 animate-spin text-white" /></main>;
  }

  return (
    <main className="relative grid min-h-screen place-items-center bg-[radial-gradient(circle_at_30%_20%,#16345A,#0E2A47_60%)] p-5">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-[#C9A227]" />
          <h1 className="font-display text-2xl text-[#0E2A47]">Verificação em duas etapas</h1>
        </div>
        <div className="my-3 h-[3px] w-16 rounded bg-[#C9A227]" />
        <p className="mb-5 text-sm text-muted-foreground">Digite o código de 6 dígitos gerado pelo seu aplicativo autenticador.</p>

        <Label className="text-xs">Código de verificação</Label>
        <Input
          value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="000000" className="text-center text-lg tracking-widest" autoFocus
          onKeyDown={(e) => { if (e.key === "Enter") confirm(); }}
        />
        {err && <p className="mt-2 text-sm text-destructive">{err}</p>}

        <Button onClick={confirm} disabled={busy} className="mt-4 w-full gap-1.5 bg-[#0E2A47] text-white hover:bg-[#16345A]">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}Confirmar
        </Button>
        <button onClick={cancel} className="mt-3 flex w-full items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-navy">
          <ArrowLeft className="h-3.5 w-3.5" />Cancelar e sair
        </button>
      </div>
    </main>
  );
}
