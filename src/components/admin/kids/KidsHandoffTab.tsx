"use client";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Check, LogOut, QrCode, ShieldCheck, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase/client";
import { useKidsOpenSessions, useKidsSessionCustody, useKidsGuardians, useKidsAuthorizedPersons } from "@/hooks/use-queries";
import * as KidsCustody from "@/services/kidsCustody";
import type { CredentialValidationRow } from "@/types/domain";

interface CustodyRow {
  id: string; dependent_id: string; status: string; claim_code: string | null;
  kids_dependents: { full_name: string; preferred_name: string | null; photo_url: string | null } | null;
}

/**
 * KIDS — Retirada (Handoff). Transação de retirada com
 * conferência humana obrigatória (KIDS-003 §33) — o operador
 * confere a pessoa contra a lista de autorizados, sempre.
 */
export function KidsHandoffTab({ churchId }: { churchId: string }) {
  const { data: openSessions = [] } = useKidsOpenSessions(churchId);
  const [sessionId, setSessionId] = useState("");
  const { data: custodyRows = [] } = useKidsSessionCustody(sessionId || null);
  const [selected, setSelected] = useState<CustodyRow | null>(null);
  const [validatedCredentialId, setValidatedCredentialId] = useState<string | undefined>(undefined);

  const pending = (custodyRows as unknown as CustodyRow[]).filter((r) => r.status === "in_custody" || r.status === "pickup_requested");

  if (!sessionId) {
    return (
      <Card>
        <CardContent className="space-y-3 pt-4">
          <p className="text-sm font-bold text-navy">Selecione a sessão</p>
          <div className="space-y-1.5">
            {openSessions.map((s) => (
              <button key={s.id} onClick={() => setSessionId(s.id)} className="block w-full rounded-md border bg-card p-2.5 text-left hover:border-gold/50">
                <p className="text-sm font-semibold text-navy">{s.name}</p>
              </button>
            ))}
            {openSessions.length === 0 && <p className="text-sm italic text-muted-foreground">Nenhuma sessão aberta agora.</p>}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (selected) {
    return <HandoffConfirm row={selected} sessionId={sessionId} credentialId={validatedCredentialId} onDone={() => { setSelected(null); setValidatedCredentialId(undefined); }} onCancel={() => { setSelected(null); setValidatedCredentialId(undefined); }} />;
  }

  return (
    <div className="space-y-3">
      <button onClick={() => setSessionId("")} className="text-sm text-muted-foreground hover:text-navy">← Trocar sessão</button>

      <CredentialValidator pending={pending} onMatch={(row, credId) => { setSelected(row); setValidatedCredentialId(credId); }} />

      <Card>
        <CardContent className="space-y-2 pt-4">
          <p className="text-sm font-bold text-navy">Crianças em custódia</p>
          {pending.map((r) => (
            <button key={r.id} onClick={() => setSelected(r)} className="flex w-full items-center justify-between rounded-md border bg-card p-2.5 text-left hover:border-gold/50">
              <div className="flex items-center gap-2.5">
                {r.kids_dependents?.photo_url ? <img src={r.kids_dependents.photo_url} alt="" className="h-9 w-9 rounded-full object-cover" /> : (
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-navy/10 text-sm font-bold text-navy">{r.kids_dependents?.full_name?.[0]}</div>
                )}
                <div>
                  <p className="text-sm font-semibold text-navy">{r.kids_dependents?.preferred_name || r.kids_dependents?.full_name}</p>
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${r.status === "pickup_requested" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                    {r.status === "pickup_requested" ? "Retirada solicitada" : "Em custódia"}
                  </span>
                </div>
              </div>
              <LogOut className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
          {pending.length === 0 && <p className="text-sm italic text-muted-foreground">Nenhuma criança em custódia nessa sessão.</p>}
        </CardContent>
      </Card>
    </div>
  );
}

function CredentialValidator({ pending, onMatch }: { pending: CustodyRow[]; onMatch: (row: CustodyRow, credentialId: string) => void }) {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState("");
  const [pin, setPin] = useState("");
  const [rows, setRows] = useState<CredentialValidationRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function validate() {
    if (!token.trim()) return;
    setBusy(true); setErr(""); setRows([]);
    try {
      const result = await KidsCustody.validateCredential(supabase, token.trim(), pin || undefined);
      if (result.length === 0 || result[0].status === "not_found") { setErr("Credencial não encontrada."); return; }
      if (result[0].status !== "active" && result[0].status !== "issued") { setErr(`Credencial ${result[0].status === "expired" ? "expirada" : result[0].status === "revoked" ? "revogada" : result[0].status}.`); return; }
      if (result[0].pin_required && !result[0].pin_ok) { setErr(pin ? "PIN incorreto." : "Essa credencial exige PIN."); return; }
      setRows(result.filter((r) => !r.scope_consumed));
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Erro ao validar");
    } finally { setBusy(false); }
  }

  function pick(custodyRecordId: string, credentialId: string) {
    const row = pending.find((p) => p.id === custodyRecordId);
    if (row) onMatch(row, credentialId);
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} variant="outline" className="w-full gap-1.5"><QrCode className="h-4 w-4" />Validar credencial (QR/token)</Button>
    );
  }

  return (
    <Card className="border-2 border-dashed border-gold/40">
      <CardContent className="space-y-2 pt-4">
        <p className="text-sm font-bold text-navy">Validar credencial</p>
        <Input value={token} onChange={(e) => setToken(e.target.value)} placeholder="Cole ou digite o token (K6_...)" className="text-xs" />
        <Input value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} placeholder="PIN (se a credencial exigir)" className="text-xs" />
        {err && <p className="text-xs text-destructive">{err}</p>}
        <div className="flex gap-1.5">
          <Button size="sm" onClick={validate} disabled={busy || !token.trim()}>{busy ? "Validando…" : "Validar"}</Button>
          <Button size="sm" variant="ghost" onClick={() => { setOpen(false); setRows([]); setErr(""); }}>Fechar</Button>
        </div>

        {rows.length > 0 && (
          <div className="space-y-1.5 border-t pt-2">
            <p className="text-xs font-bold uppercase text-muted-foreground">Selecione quem está sendo retirado</p>
            {rows.map((r) => (
              <button key={r.custody_record_id} onClick={() => pick(r.custody_record_id!, r.credential_id!)}
                className="flex w-full items-center gap-2 rounded-md border bg-card p-2 text-left text-sm hover:border-gold/50">
                <ShieldCheck className="h-4 w-4 text-green-600" />{r.dependent_name}
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function HandoffConfirm({ row, sessionId, credentialId, onDone, onCancel }: { row: CustodyRow; sessionId: string; credentialId?: string; onDone: () => void; onCancel: () => void }) {
  const qc = useQueryClient();
  const { data: guardians = [] } = useKidsGuardians(row.dependent_id);
  const { data: authorizedPersons = [] } = useKidsAuthorizedPersons(row.dependent_id);
  const [pickupMode, setPickupMode] = useState<"guardian" | "authorized_person" | "">("");
  const [pickupId, setPickupId] = useState("");
  const [claimCode, setClaimCode] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const activePersons = authorizedPersons.filter((p) => p.status === "active");

  async function confirm() {
    if (!pickupMode || !pickupId) { setErr("Selecione quem está retirando."); return; }
    setErr(""); setBusy(true);
    try {
      await KidsCustody.handoff(supabase, {
        custody_record_id: row.id,
        pickup_guardian_id: pickupMode === "guardian" ? pickupId : undefined,
        pickup_authorized_person_id: pickupMode === "authorized_person" ? pickupId : undefined,
        claim_code: claimCode || undefined, notes: notes || undefined,
        credential_id: credentialId,
      });
      qc.invalidateQueries({ queryKey: ["kids-session-custody", sessionId] });
      onDone();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Erro ao confirmar a entrega");
    } finally { setBusy(false); }
  }

  return (
    <Card className="border-2 border-gold/40 bg-gold/5">
      <CardContent className="space-y-3 pt-4">
        <div className="flex items-center gap-3">
          {row.kids_dependents?.photo_url ? <img src={row.kids_dependents.photo_url} alt="" className="h-12 w-12 rounded-full object-cover" /> : (
            <div className="grid h-12 w-12 place-items-center rounded-full bg-navy/10 text-lg font-bold text-navy">{row.kids_dependents?.full_name?.[0]}</div>
          )}
          <div>
            <p className="font-display text-lg text-navy">{row.kids_dependents?.full_name}</p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5" />Confirme quem está retirando</p>
            {credentialId && <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-green-700"><Check className="h-3 w-3" />Credencial validada</p>}
          </div>
        </div>

        {row.claim_code && (
          <Input value={claimCode} onChange={(e) => setClaimCode(e.target.value.toUpperCase())} placeholder="Código de retirada (opcional, mostrado no check-in)" className="text-sm" />
        )}

        <div className="space-y-1.5">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Responsável</p>
          {guardians.map((g) => (
            <button key={g.id} onClick={() => { setPickupMode("guardian"); setPickupId(g.profile_id); }}
              className={`flex w-full items-center gap-2 rounded-md border p-2 text-left text-sm ${pickupMode === "guardian" && pickupId === g.profile_id ? "border-gold bg-gold/10" : "bg-card"}`}>
              <User className="h-4 w-4 text-navy" />{g.profile_name ?? g.profile_id}
            </button>
          ))}
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Pessoas autorizadas</p>
          {activePersons.map((p) => (
            <button key={p.id} onClick={() => { setPickupMode("authorized_person"); setPickupId(p.id); }}
              className={`flex w-full items-center gap-2 rounded-md border p-2 text-left text-sm ${pickupMode === "authorized_person" && pickupId === p.id ? "border-gold bg-gold/10" : "bg-card"}`}>
              <ShieldCheck className="h-4 w-4 text-navy" />{p.full_name}{p.relationship_label && ` (${p.relationship_label})`}
            </button>
          ))}
          {activePersons.length === 0 && <p className="text-xs italic text-muted-foreground">Nenhuma pessoa autorizada além do(s) responsável(is).</p>}
        </div>

        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observações (opcional)" rows={2} />

        {err && <p className="flex items-center gap-1.5 text-xs text-destructive"><AlertCircle className="h-3.5 w-3.5" />{err}</p>}

        <div className="flex gap-2">
          <Button onClick={confirm} disabled={busy || !pickupId} className="flex-1 gap-1.5"><Check className="h-4 w-4" />{busy ? "Confirmando…" : "Confirmar entrega"}</Button>
          <Button onClick={onCancel} variant="ghost">Cancelar</Button>
        </div>
      </CardContent>
    </Card>
  );
}
