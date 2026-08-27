"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, LockKeyhole, RefreshCw, ShieldAlert, UserCheck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase/client";
import {
  listFamProfessionalCredentials,
  requestFamProfessionalCredential,
  reviewFamProfessionalCredential,
  type FamCredentialScope,
  type FamProfessionalCredential,
} from "@/services/famProfessionalAccess";

const STATUS_LABELS: Record<string, string> = {
  requested: "Solicitado",
  under_review: "Em análise",
  active: "Activo",
  suspended: "Suspenso",
  revoked: "Revogado",
  expired: "Expirado",
};

const STATUS_CLASS: Record<string, string> = {
  requested: "bg-amber-50 text-amber-800 border-amber-200",
  under_review: "bg-blue-50 text-blue-800 border-blue-200",
  active: "bg-emerald-50 text-emerald-800 border-emerald-200",
  suspended: "bg-orange-50 text-orange-800 border-orange-200",
  revoked: "bg-slate-100 text-slate-700 border-slate-200",
  expired: "bg-slate-100 text-slate-700 border-slate-200",
};

function isoDateFromInput(value: string): string | null {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function FamProfessionalAccessAdmin() {
  const [credentials, setCredentials] = useState<FamProfessionalCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [profileId, setProfileId] = useState("");
  const [professionalRole, setProfessionalRole] = useState("");
  const [qualification, setQualification] = useState("");
  const [purpose, setPurpose] = useState("");
  const [scopeType, setScopeType] = useState<FamCredentialScope>("case");
  const [scopeId, setScopeId] = useState("");
  const [allowedPurposes, setAllowedPurposes] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setCredentials(await listFamProfessionalCredentials(supabase));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível carregar os credenciamentos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const clearForm = () => {
    setProfileId(""); setProfessionalRole(""); setQualification(""); setPurpose("");
    setScopeType("case"); setScopeId(""); setAllowedPurposes(""); setValidFrom(""); setValidUntil("");
  };

  async function handleRequest() {
    setMessage(null); setError(null);
    const from = isoDateFromInput(validFrom);
    const until = isoDateFromInput(validUntil);
    if (!from) { setError("Informe uma data de início válida."); return; }
    if (validUntil && !until) { setError("Informe uma data final válida."); return; }
    setBusy(true);
    try {
      await requestFamProfessionalCredential(supabase, {
        profileId: profileId.trim(), professionalRole, qualification, purpose,
        scopeType, scopeId: scopeId.trim() || null,
        allowedPurposes: allowedPurposes.split(","), validFrom: from, validUntil: until,
      });
      setMessage("Solicitação registrada. A activação depende de análise e aprovação.");
      clearForm();
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível registrar a solicitação.");
    } finally { setBusy(false); }
  }

  async function handleReview(id: string, decision: "active" | "under_review" | "suspended" | "revoked") {
    setBusy(true); setMessage(null); setError(null);
    try {
      await reviewFamProfessionalCredential(supabase, id, decision, reviewNotes[id] ?? "");
      setMessage(`Credenciamento ${STATUS_LABELS[decision].toLowerCase()} com sucesso.`);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível actualizar o credenciamento.");
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-6">
      <Card className="border-fam-lavender">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-fam-plum"><UserCheck className="h-5 w-5" /> Credenciamento profissional FAM</CardTitle>
          <CardDescription>
            O credenciamento é individual, possui finalidade, escopo e validade. Cargo, hierarquia ou pertencimento à FAM não concedem acesso automático a conteúdo sensível.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2"><Label htmlFor="fam-credential-profile">ID do perfil</Label><Input id="fam-credential-profile" value={profileId} onChange={(event) => setProfileId(event.target.value)} placeholder="UUID do usuário já cadastrado" /></div>
          <div className="space-y-2"><Label htmlFor="fam-credential-role">Função profissional</Label><Input id="fam-credential-role" value={professionalRole} onChange={(event) => setProfessionalRole(event.target.value)} placeholder="Ex.: psicóloga, assistente social" /></div>
          <div className="space-y-2"><Label htmlFor="fam-credential-qualification">Qualificação verificável</Label><Input id="fam-credential-qualification" value={qualification} onChange={(event) => setQualification(event.target.value)} placeholder="Registro ou qualificação aplicável" /></div>
          <div className="space-y-2"><Label htmlFor="fam-credential-purpose">Finalidade principal</Label><Input id="fam-credential-purpose" value={purpose} onChange={(event) => setPurpose(event.target.value)} placeholder="Ex.: revisar encaminhamentos atribuídos" /></div>
          <div className="space-y-2"><Label htmlFor="fam-credential-scope">Escopo</Label><select id="fam-credential-scope" className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={scopeType} onChange={(event) => setScopeType(event.target.value as FamCredentialScope)}><option value="case">Caso atribuído</option><option value="regional">Regional</option><option value="all_fam">Toda a FAM</option></select></div>
          <div className="space-y-2"><Label htmlFor="fam-credential-scope-id">ID do escopo (opcional)</Label><Input id="fam-credential-scope-id" value={scopeId} onChange={(event) => setScopeId(event.target.value)} placeholder="ID da região ou caso" /></div>
          <div className="space-y-2 md:col-span-2"><Label htmlFor="fam-credential-purposes">Finalidades permitidas</Label><Input id="fam-credential-purposes" value={allowedPurposes} onChange={(event) => setAllowedPurposes(event.target.value)} placeholder="Separadas por vírgula; vazio = finalidade principal" /></div>
          <div className="space-y-2"><Label htmlFor="fam-credential-from">Válido a partir de</Label><Input id="fam-credential-from" type="date" value={validFrom} onChange={(event) => setValidFrom(event.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor="fam-credential-until">Válido até (opcional)</Label><Input id="fam-credential-until" type="date" value={validUntil} onChange={(event) => setValidUntil(event.target.value)} /></div>
          <div className="md:col-span-2 flex items-center justify-between gap-3"><p className="text-xs text-fam-muted">MFA é requerido por padrão e deve ser confirmado antes de acesso sensível.</p><Button type="button" disabled={busy} onClick={handleRequest}>Registrar solicitação</Button></div>
        </CardContent>
      </Card>

      {(message || error) && <div role="status" className={error ? "rounded-md bg-fam-danger/10 p-3 text-sm text-fam-danger" : "rounded-md bg-fam-success/10 p-3 text-sm text-fam-success"}>{error ?? message}</div>}

      <Card>
        <CardHeader><div className="flex items-center justify-between gap-3"><div><CardTitle>Credenciamentos FAM</CardTitle><CardDescription>Visualização protegida por RLS. O painel não exibe conteúdo de casos.</CardDescription></div><Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}><RefreshCw className="mr-2 h-4 w-4" />Actualizar</Button></div></CardHeader>
        <CardContent className="space-y-3">
          {loading ? <p className="text-sm text-fam-muted">Carregando...</p> : credentials.length === 0 ? <p className="text-sm text-fam-muted">Nenhum credenciamento visível para esta sessão.</p> : credentials.map((credential) => (
            <div key={credential.id} className="rounded-lg border border-fam-lavender p-4">
              <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold text-fam-deep-plum">{credential.profile_name ?? credential.profile_id}</p><p className="text-sm text-fam-muted">{credential.profile_email ?? "E-mail não disponível"} · {credential.professional_role}</p><p className="mt-1 text-xs text-fam-muted">Finalidade: {credential.purpose} · Escopo: {credential.scope_type}</p></div><span className={`rounded-full border px-2 py-1 text-xs font-medium ${STATUS_CLASS[credential.status] ?? STATUS_CLASS.requested}`}>{STATUS_LABELS[credential.status] ?? credential.status}</span></div>
              <div className="mt-3 grid gap-2 text-xs text-fam-muted md:grid-cols-3"><span>Validade: {credential.valid_from ? new Date(credential.valid_from).toLocaleDateString("pt-BR") : "não definida"} {credential.valid_until ? `até ${new Date(credential.valid_until).toLocaleDateString("pt-BR")}` : ""}</span><span>MFA: {credential.mfa_required ? (credential.mfa_verified_at ? "confirmado" : "pendente") : "não requerido"}</span><span>Finalidades: {credential.allowed_purposes.length ? credential.allowed_purposes.join(", ") : "principal"}</span></div>
              <div className="mt-3 space-y-2"><Label htmlFor={`fam-review-${credential.id}`} className="text-xs">Nota de análise</Label><Textarea id={`fam-review-${credential.id}`} rows={2} value={reviewNotes[credential.id] ?? ""} onChange={(event) => setReviewNotes((current) => ({ ...current, [credential.id]: event.target.value }))} placeholder="Registre a justificativa da decisão." /></div>
              <div className="mt-3 flex flex-wrap gap-2">{credential.status === "requested" && <Button size="sm" onClick={() => void handleReview(credential.id, "under_review")} disabled={busy}><LockKeyhole className="mr-1 h-3 w-3" />Enviar para análise</Button>}{["requested", "under_review"].includes(credential.status) && <Button size="sm" onClick={() => void handleReview(credential.id, "active")} disabled={busy}><CheckCircle2 className="mr-1 h-3 w-3" />Aprovar e activar</Button>}{credential.status === "active" && <Button size="sm" variant="outline" onClick={() => void handleReview(credential.id, "suspended")} disabled={busy}><ShieldAlert className="mr-1 h-3 w-3" />Suspender</Button>}{["active", "suspended"].includes(credential.status) && <Button size="sm" variant="outline" className="text-fam-danger" onClick={() => void handleReview(credential.id, "revoked")} disabled={busy}><XCircle className="mr-1 h-3 w-3" />Revogar</Button>}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
