"use client";
import { useState } from "react";
import { ShieldCheck, ShieldAlert, Smartphone, X, Loader2, Power } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase/client";
import { useMfaFactors, useMfaRequired, useMfaEnforcement } from "@/hooks/use-queries";
import * as Mfa from "@/services/mfa";

/**
 * UX-004 §6.1/§9.4 — Ativação/desativação de MFA (TOTP) pelo
 * próprio usuário. Fica na tela de Segurança e Senha.
 */
export function MfaSettings({ profileId, isApostolo }: { profileId: string | null; isApostolo?: boolean }) {
  const { data: factors = [], refetch } = useMfaFactors();
  const { data: required } = useMfaRequired(profileId);
  const { data: enforcementEnabled, refetch: refetchEnforcement } = useMfaEnforcement();
  const [togglingEnforcement, setTogglingEnforcement] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [factorId, setFactorId] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [confirmingDisable, setConfirmingDisable] = useState(false);
  const [disableCode, setDisableCode] = useState("");

  const verified = factors.find((f) => f.status === "verified");

  async function startEnroll() {
    setErr(""); setBusy(true);
    try {
      const r = await Mfa.enrollTotp(supabase);
      setFactorId(r.factorId); setQrCode(r.qrCodeSvg); setSecret(r.secret);
      setEnrolling(true);
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? "Erro ao iniciar a ativação.");
    } finally { setBusy(false); }
  }

  async function confirmEnroll() {
    if (code.length !== 6) { setErr("Digite o código de 6 dígitos do seu aplicativo autenticador."); return; }
    setErr(""); setBusy(true);
    try {
      await Mfa.confirmEnrollment(supabase, factorId, code);
      setEnrolling(false); setCode(""); setMsg("Autenticação de dois fatores ativada com sucesso!");
      refetch();
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? "Código inválido. Confira o app e tente de novo.");
    } finally { setBusy(false); }
  }

  async function disable() {
    if (!verified) return;
    if (!confirm("Desativar a autenticação de dois fatores? Sua conta ficará protegida só pela senha.")) return;
    setErr("");
    try {
      const { current } = await Mfa.getAssuranceLevel(supabase);
      if (current !== "aal2") {
        // A sessão atual só validou a senha — o Supabase exige confirmar o código
        // de novo antes de permitir desativar o 2FA (senão, quem só roubasse a
        // senha já conseguiria desligar a proteção).
        setConfirmingDisable(true);
        return;
      }
    } catch { /* segue tentando direto — o erro real, se houver, aparece abaixo */ }
    await doDisable();
  }

  async function doDisable() {
    if (!verified) return;
    setBusy(true); setErr("");
    try {
      await Mfa.unenroll(supabase, verified.id);
      setMsg("Autenticação de dois fatores desativada.");
      setConfirmingDisable(false); setDisableCode("");
      refetch();
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? "Erro ao desativar.");
    } finally { setBusy(false); }
  }

  async function confirmThenDisable() {
    if (!verified || disableCode.length !== 6) { setErr("Digite o código de 6 dígitos do seu aplicativo autenticador."); return; }
    setErr(""); setBusy(true);
    try {
      await Mfa.verifyLoginChallenge(supabase, verified.id, disableCode);
      await doDisable();
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? "Código inválido. Confira o app e tente de novo.");
      setBusy(false);
    }
  }

  async function toggleEnforcement() {
    if (!profileId) return;
    const next = !enforcementEnabled;
    const msgConfirm = next
      ? "Voltar a exigir 2FA obrigatório pra administradores?"
      : "Desligar a exigência de 2FA pra toda a plataforma? Quem já ativou continua protegido, mas ninguém mais será obrigado a ativar.";
    if (!confirm(msgConfirm)) return;
    setTogglingEnforcement(true);
    try {
      await Mfa.setMfaEnforcement(supabase, next, profileId);
      refetchEnforcement();
    } catch (e: unknown) {
      alert((e as { message?: string })?.message ?? "Erro ao alterar a configuração.");
    } finally { setTogglingEnforcement(false); }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {verified ? <ShieldCheck className="h-5 w-5 text-green-600" /> : <ShieldAlert className="h-5 w-5 text-amber-500" />}
          Autenticação de Dois Fatores (2FA)
        </CardTitle>
        <CardDescription>
          Adiciona uma segunda camada de proteção — além da senha, você precisa de um código gerado por um aplicativo autenticador (Google Authenticator, Authy, etc.).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {required && !verified && (
          <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Sua conta tem acesso administrativo — a ativação do 2FA é <b>obrigatória</b>.
          </p>
        )}
        {msg && <p className="text-sm text-green-700">{msg}</p>}
        {err && <p className="text-sm text-destructive">{err}</p>}

        {verified ? (
          confirmingDisable ? (
            <div className="space-y-3 rounded-lg border border-amber-300 bg-amber-50 p-4">
              <p className="text-sm text-amber-800">Por segurança, confirme o código do seu aplicativo autenticador antes de desativar.</p>
              <Input value={disableCode} onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" className="text-center text-lg tracking-widest" autoFocus onKeyDown={(e) => { if (e.key === "Enter") confirmThenDisable(); }} />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { setConfirmingDisable(false); setDisableCode(""); setErr(""); }} className="gap-1.5"><X className="h-4 w-4" />Cancelar</Button>
                <Button onClick={confirmThenDisable} disabled={busy} className="flex-1 gap-1.5 bg-red-600 hover:bg-red-700">
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}Confirmar e desativar
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-lg border bg-green-50 p-3">
              <span className="flex items-center gap-2 text-sm font-semibold text-green-800"><Smartphone className="h-4 w-4" />Ativo — {verified.friendly_name ?? "aplicativo autenticador"}</span>
              <Button size="sm" variant="outline" className="text-red-600" onClick={disable} disabled={busy}>Desativar</Button>
            </div>
          )
        ) : enrolling ? (
          <div className="space-y-3 rounded-lg border p-4">
            <p className="text-sm text-ink">1. Escaneie este QR Code com seu aplicativo autenticador:</p>
            <div className="flex justify-center rounded-lg bg-white p-3" dangerouslySetInnerHTML={{ __html: qrCode }} />
            <p className="text-xs text-muted-foreground">Não consegue escanear? Digite manualmente: <span className="select-all font-mono">{secret}</span></p>
            <div>
              <Label className="text-xs">2. Digite o código de 6 dígitos gerado pelo app</Label>
              <Input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" className="text-center text-lg tracking-widest" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setEnrolling(false); setErr(""); }} className="gap-1.5"><X className="h-4 w-4" />Cancelar</Button>
              <Button onClick={confirmEnroll} disabled={busy} className="flex-1 gap-1.5">
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}Confirmar ativação
              </Button>
            </div>
          </div>
        ) : (
          <Button onClick={startEnroll} disabled={busy} className="gap-1.5">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}Ativar autenticação de dois fatores
          </Button>
        )}

        {isApostolo && (
          <div className="mt-2 rounded-lg border border-dashed border-navy/30 bg-navy/5 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="flex items-center gap-1.5 text-sm font-bold text-navy"><Power className="h-4 w-4" />Exigir 2FA pra toda a plataforma</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Desativar aqui remove a obrigatoriedade pra todo mundo (Apóstolo, Pastores, delegados) —
                  útil se a segunda camada estiver travando o uso de quem tem menos familiaridade com o app.
                  Quem já ativou o 2FA continua com ele funcionando normalmente.
                </p>
              </div>
              <button
                onClick={toggleEnforcement}
                disabled={togglingEnforcement}
                className={`relative h-7 w-12 shrink-0 rounded-full transition ${enforcementEnabled ? "bg-gold" : "bg-border"}`}
              >
                <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${enforcementEnabled ? "left-[22px]" : "left-0.5"}`} />
              </button>
            </div>
            <p className="mt-2 text-xs font-semibold">
              Status atual: {enforcementEnabled
                ? <span className="text-green-700">2FA obrigatório está ATIVO pra toda a plataforma</span>
                : <span className="text-amber-700">2FA obrigatório está DESATIVADO pra toda a plataforma</span>}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
