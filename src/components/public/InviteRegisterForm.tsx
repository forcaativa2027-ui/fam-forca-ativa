"use client";
import { useState } from "react";
import { CheckCircle2, XCircle, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabase/client";
import { consumeInviteLink } from "@/services/invites";
import type { InviteTokenValidation } from "@/types/domain";

const REASON_MESSAGES: Record<string, string> = {
  nao_encontrado: "Este link de convite não existe ou foi digitado incorretamente.",
  revogado: "Este link de convite foi revogado por quem o gerou.",
  expirado: "Este link de convite expirou. Peça um novo link a quem te convidou.",
  esgotado: "Este link de convite já atingiu o limite de usos.",
};

interface Props { token: string; validation: InviteTokenValidation; }

export function InviteRegisterForm({ token, validation }: Props) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  if (!validation.valid) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_30%_20%,#16345A,#0E2A47_60%)] grid place-items-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-3">
            <XCircle className="mx-auto text-destructive" size={40} />
            <p className="text-sm text-muted-foreground">
              {REASON_MESSAGES[validation.reason ?? ""] ?? "Não foi possível validar este convite."}
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (done) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_30%_20%,#16345A,#0E2A47_60%)] grid place-items-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-3">
            <CheckCircle2 className="mx-auto text-primary" size={40} />
            <p className="font-medium">Cadastro concluído!</p>
            <p className="text-sm text-muted-foreground">
              Você já está vinculado a {validation.church_name}
              {validation.life_group_name ? ` — ${validation.life_group_name}` : ""}.
              Confirme seu e-mail para acessar o painel.
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      const { error: signErr } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: fullName } },
      });
      if (signErr) {
        setErr(signErr.message.includes("already") ? "Este e-mail já está cadastrado. Tente fazer login." : signErr.message);
        setBusy(false); return;
      }
      await consumeInviteLink(supabase, token, phone);
      setDone(true);
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Erro ao concluir cadastro.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_30%_20%,#16345A,#0E2A47_60%)] grid place-items-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 space-y-4">
          <div className="text-center space-y-1">
            <Sparkles className="mx-auto text-primary" size={28} />
            <p className="font-medium">Você foi convidado(a)</p>
            <p className="text-sm text-muted-foreground">
              {validation.church_name}
              {validation.life_group_name ? ` · ${validation.life_group_name}` : ""}
              {validation.ministry_name ? ` · ${validation.ministry_name}` : ""}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label>Nome completo</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
            <div>
              <Label>E-mail</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label>Senha</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>
            {err && <p className="text-sm text-destructive">{err}</p>}
            <Button type="submit" disabled={busy} className="w-full gap-1.5">
              {busy ? <Loader2 size={16} className="animate-spin" /> : null}
              Concluir cadastro
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
