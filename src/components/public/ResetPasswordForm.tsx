"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase/client";
import * as Mfa from "@/services/mfa";

type Stage = "loading"|"mfa"|"form"|"success"|"invalid";

export default function ResetPasswordForm() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("loading");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event !== "PASSWORD_RECOVERY") return;
      // Se a conta tem 2FA ativo, o link de recuperação só dá uma sessão "aal1" —
      // precisa confirmar o código do autenticador antes de poder trocar a senha.
      try {
        const factors = await Mfa.listFactors(supabase);
        const verified = factors.find((f) => f.status === "verified");
        if (verified) { setMfaFactorId(verified.id); setStage("mfa"); return; }
      } catch { /* segue pro formulário normal se a checagem falhar */ }
      setStage("form");
    });
    const t = setTimeout(() => setStage(s => s === "loading" ? "invalid" : s), 5000);
    return () => { subscription.unsubscribe(); clearTimeout(t); };
  }, []);

  async function confirmMfa() {
    if (!mfaFactorId || mfaCode.length !== 6) { setErr("Digite o código de 6 dígitos do seu aplicativo autenticador."); return; }
    setErr(""); setBusy(true);
    try {
      await Mfa.verifyLoginChallenge(supabase, mfaFactorId, mfaCode);
      setStage("form");
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? "Código inválido. Confira o app e tente de novo.");
    } finally { setBusy(false); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    if (password.length < 6) { setErr("A senha precisa ter ao menos 6 caracteres."); return; }
    if (password !== confirm) { setErr("As senhas não conferem."); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    setStage("success");
    setTimeout(() => router.push("/painel"), 2500);
  }

  return (
    <main className="relative grid min-h-screen place-items-center bg-[radial-gradient(circle_at_30%_20%,#6B214F,#3A1236_65%)] p-5">
      <Link href="/entrar" className="absolute left-5 top-5 flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Voltar ao login
      </Link>
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
        <div className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-fam-gold"/><h1 className="font-display text-2xl text-fam-plum">Nova senha</h1></div>
        <div className="my-3 h-[3px] w-16 rounded bg-fam-gold"/>
        {stage==="loading"&&<p className="text-sm text-muted-foreground text-center py-6">Verificando link…</p>}
        {stage==="invalid"&&<div className="space-y-4 text-center"><AlertTriangle className="mx-auto h-12 w-12 text-amber-500"/><p className="font-semibold text-fam-plum">Link inválido ou expirado</p><Link href="/recuperar-senha"><Button className="w-full mt-2">Solicitar novo link</Button></Link></div>}
        {stage==="mfa"&&(
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><ShieldCheck className="h-4 w-4 text-fam-gold" />Sua conta tem verificação em duas etapas ativa — confirme o código antes de trocar a senha.</div>
            <div>
              <Label htmlFor="mfa-code">Código do aplicativo autenticador</Label>
              <Input id="mfa-code" value={mfaCode} onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" className="text-center text-lg tracking-widest" autoFocus onKeyDown={(e) => { if (e.key === "Enter") confirmMfa(); }} />
            </div>
            {err&&<p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">{err}</p>}
            <Button onClick={confirmMfa} disabled={busy} className="w-full">{busy?"Verificando…":"Confirmar"}</Button>
          </div>
        )}
        {stage==="form"&&(
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-muted-foreground">Defina sua nova senha abaixo.</p>
            <div><Label htmlFor="password">Nova senha</Label><Input id="password" type="password" placeholder="Mínimo 6 caracteres" value={password} onChange={e=>setPassword(e.target.value)} autoFocus/></div>
            <div><Label htmlFor="confirm">Confirme a senha</Label><Input id="confirm" type="password" placeholder="Repita a senha" value={confirm} onChange={e=>setConfirm(e.target.value)}/></div>
            {err&&<p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">{err}</p>}
            <Button type="submit" disabled={busy} className="w-full">{busy?"Salvando…":"Redefinir senha"}</Button>
          </form>
        )}
        {stage==="success"&&<div className="space-y-4 text-center"><CheckCircle2 className="mx-auto h-12 w-12 text-green-500"/><p className="font-semibold text-fam-plum">Senha redefinida!</p><p className="text-sm text-muted-foreground">Redirecionando…</p></div>}
      </div>
    </main>
  );
}
