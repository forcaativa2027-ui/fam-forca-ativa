"use client";
import { useState } from "react";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabase/client";
import { consumeInviteLink } from "@/services/invites";
import { CommunityIdentity } from "@/components/shared/CommunityIdentity";
import { KIND_LABELS } from "@/components/admin/InviteLinksAdmin";
import type { InviteTokenValidation } from "@/types/domain";

// Seção 9 do script de melhoria — mensagens específicas por motivo,
// citando o nome da comunidade quando disponível (expirado).
function reasonMessage(reason: string | null, churchName: string | null): string {
  switch (reason) {
    case "nao_encontrado":
      return "Não foi possível localizar este convite. Solicite um novo link ao responsável pela comunidade.";
    case "revogado":
      return "Este link de convite foi revogado por quem o gerou. Solicite um novo link.";
    case "expirado":
      return churchName
        ? `Este convite expirou. Entre em contato com ${churchName} para solicitar um novo convite.`
        : "Este convite expirou. Peça um novo link a quem te convidou.";
    case "esgotado":
      return "Este convite já foi utilizado. Caso o cadastro tenha sido concluído, acesse sua conta usando o e-mail informado.";
    default:
      return "Não foi possível validar este convite.";
  }
}

interface Props { token: string; validation: InviteTokenValidation; }

export function InviteRegisterForm({ token, validation }: Props) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  const roleName = validation.kind ? KIND_LABELS[validation.kind] : null;

  if (!validation.valid) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_30%_20%,#16345A,#0E2A47_60%)] grid place-items-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-3">
            <XCircle className="mx-auto text-destructive" size={40} />
            <p className="text-sm text-muted-foreground">
              {reasonMessage(validation.reason, validation.church_name)}
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
          <CardContent className="pt-6 text-center space-y-4">
            <CommunityIdentity
              variant="registration"
              communityName={validation.church_name ?? "CEC Family"}
              logoUrl={validation.church_logo_url}
              organizationalUnitName={validation.org_unit_name}
            />
            <div className="space-y-2">
              <CheckCircle2 className="mx-auto text-primary" size={36} />
              <p className="font-medium">Cadastro concluído!</p>
              <p className="text-sm text-muted-foreground">
                Você já está vinculado a {validation.church_name}
                {validation.life_group_name ? ` — ${validation.life_group_name}` : ""}.
                Confirme seu e-mail para acessar o painel.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      const { data: signData, error: signErr } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: fullName } },
      });
      if (signErr) {
        setErr(signErr.message.includes("already") ? "Este e-mail já está cadastrado. Tente fazer login." : signErr.message);
        setBusy(false); return;
      }
      // signUp() pode não retornar sessão ativa (projeto exige confirmação de e-mail) —
      // por isso passamos o id do usuário explicitamente, não dependemos de auth.uid() no banco.
      await consumeInviteLink(supabase, token, phone, signData.user?.id);
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
          <CommunityIdentity
            variant="registration"
            communityName={validation.church_name ?? "CEC Family"}
            logoUrl={validation.church_logo_url}
            organizationalUnitName={validation.org_unit_name}
            roleName={roleName}
          />
          <p className="text-center text-sm text-muted-foreground">
            Você foi convidado(a) para fazer parte desta comunidade. Preencha os dados abaixo para concluir seu cadastro.
          </p>

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
