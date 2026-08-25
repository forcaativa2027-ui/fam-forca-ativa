"use client";
import { useState } from "react";
import { QrCode, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase/client";
import * as KidsCustody from "@/services/kidsCustody";
import type { KidsDependentStatus } from "@/types/domain";

/**
 * KIDS — Credenciais Avançadas (KIDS-006, versão prática).
 * Responsável escolhe quais filhos incluir (credencial familiar —
 * cada um continua sendo validado individualmente no handoff) e
 * gera um QR com token real, com PIN opcional.
 */
export function KidsCredentialIssuer({ inCustody, onClose }: { inCustody: KidsDependentStatus[]; onClose: () => void }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(inCustody.map((d) => d.custody_record_id!)));
  const [usePin, setUsePin] = useState(false);
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ rawToken: string } | null>(null);
  const [err, setErr] = useState("");

  function toggle(id: string) {
    setSelectedIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  async function issue() {
    if (selectedIds.size === 0) { setErr("Selecione ao menos uma criança."); return; }
    if (usePin && pin.length < 4) { setErr("O PIN precisa ter pelo menos 4 dígitos."); return; }
    setErr(""); setBusy(true);
    try {
      const { rawToken } = await KidsCustody.issueCredential(supabase, Array.from(selectedIds), usePin ? pin : undefined);
      setResult({ rawToken });
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Erro ao emitir credencial");
    } finally { setBusy(false); }
  }

  if (result) {
    return (
      <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
        <Card className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
          <CardContent className="space-y-3 pt-4 text-center">
            <div className="flex items-center justify-between text-left">
              <p className="text-sm font-bold text-navy">Credencial de retirada</p>
              <button onClick={onClose}><X className="h-4 w-4 text-muted-foreground" /></button>
            </div>
            <img src={KidsCustody.qrImageUrl(result.rawToken)} alt="QR da credencial" className="mx-auto rounded-md border" />
            <p className="text-xs text-muted-foreground">Mostre esse QR pro operador na hora da retirada. Ele é válido só pra essa vez — guarde até usar.</p>
            {usePin && <p className="rounded-md bg-gold/10 px-2 py-1.5 text-xs font-semibold text-navy">PIN: {pin}</p>}
            <Button onClick={onClose} className="w-full">Fechar</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <Card className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <CardContent className="space-y-3 pt-4">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-sm font-bold text-navy"><QrCode className="h-4 w-4 text-gold" />Emitir credencial de retirada</p>
            <button onClick={onClose}><X className="h-4 w-4 text-muted-foreground" /></button>
          </div>
          <p className="text-xs text-muted-foreground">Selecione quem você vai retirar — pode ser mais de um filho numa credencial só.</p>

          <div className="space-y-1.5">
            {inCustody.map((d) => (
              <button key={d.custody_record_id} onClick={() => toggle(d.custody_record_id!)}
                className={`flex w-full items-center gap-2 rounded-md border p-2 text-left text-sm ${selectedIds.has(d.custody_record_id!) ? "border-gold bg-gold/10" : "bg-card"}`}>
                <input type="checkbox" checked={selectedIds.has(d.custody_record_id!)} readOnly className="pointer-events-none" />
                {d.preferred_name || d.full_name}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 text-xs text-ink">
            <input type="checkbox" checked={usePin} onChange={(e) => setUsePin(e.target.checked)} />
            Adicionar um PIN (extra segurança, opcional)
          </label>
          {usePin && <Input value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} placeholder="PIN (mínimo 4 dígitos)" maxLength={6} />}

          {err && <p className="text-xs text-destructive">{err}</p>}
          <Button onClick={issue} disabled={busy || selectedIds.size === 0} className="w-full">{busy ? "Gerando…" : "Gerar credencial"}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
