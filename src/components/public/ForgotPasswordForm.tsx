"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, Mail, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase/client";
import { Turnstile } from "@marsidev/react-turnstile";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !/\S+@\S+\.\S+/.test(email)) { setErr("Informe um e-mail válido."); return; }
    if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !captchaToken) { setErr("Confirme que você não é um robô."); return; }
    setBusy(true); setErr("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/nova-senha`,
      captchaToken: captchaToken ?? undefined,
    });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    setSent(true);
  }

  return (
    <main className="relative grid min-h-screen place-items-center bg-[radial-gradient(circle_at_30%_20%,#6B214F,#3A1236_65%)] p-5">
      <Link href="/entrar" className="absolute left-5 top-5 flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Voltar ao login
      </Link>
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
        <div className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-fam-gold"/><h1 className="font-display text-2xl text-fam-plum">Recuperar senha</h1></div>
        <div className="my-3 h-[3px] w-16 rounded bg-fam-gold"/>
        {sent ? (
          <div className="space-y-4 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500"/>
            <p className="font-semibold text-fam-plum">E-mail enviado!</p>
            <p className="text-sm text-muted-foreground">Verifique sua caixa de entrada e o spam. O link expira em <strong>1 hora</strong>.</p>
            <Link href="/entrar"><Button variant="outline" className="w-full mt-2">Voltar ao login</Button></Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-muted-foreground">Informe o e-mail cadastrado e enviaremos um link para redefinir sua senha.</p>
            <div>
              <Label htmlFor="email">E-mail</Label>
              <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                <Input id="email" type="email" className="pl-9" placeholder="seu@email.com" value={email} onChange={e=>setEmail(e.target.value)} autoFocus/>
              </div>
            </div>
            {err&&<p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">{err}</p>}
            {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
              <div className="flex justify-center">
                <Turnstile
                  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                  onSuccess={(token) => setCaptchaToken(token)}
                  onExpire={() => setCaptchaToken(null)}
                  options={{ theme: "light", language: "pt-BR" }}
                />
              </div>
            )}
            <Button type="submit" disabled={busy} className="w-full">{busy?"Enviando…":"Enviar link de recuperação"}</Button>
            <p className="text-center text-xs text-muted-foreground">Lembrou a senha? <Link href="/entrar" className="font-semibold text-fam-plum hover:underline">Entrar</Link></p>
          </form>
        )}
      </div>
    </main>
  );
}
