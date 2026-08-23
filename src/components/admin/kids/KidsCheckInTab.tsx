"use client";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Check, LogIn, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase/client";
import { useKidsOpenSessions, useKidsDependents, useKidsGuardians, useKidsSessionCustody } from "@/hooks/use-queries";
import * as KidsCustody from "@/services/kidsCustody";
import type { KidsDependent } from "@/types/domain";

/**
 * KIDS — Check-in (operador). Exige uma sessão ABERTA e confirmação
 * humana explícita — nunca automático (KIDS-000, princípio central).
 */
export function KidsCheckInTab({ churchId }: { churchId: string }) {
  const { data: openSessions = [] } = useKidsOpenSessions(churchId);
  const [sessionId, setSessionId] = useState("");
  const { data: dependents = [] } = useKidsDependents(churchId);
  const { data: custodyRows = [] } = useKidsSessionCustody(sessionId || null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<KidsDependent | null>(null);

  const checkedInIds = new Set(
    (custodyRows as { dependent_id: string; status: string }[])
      .filter((r) => r.status === "in_custody" || r.status === "pickup_requested")
      .map((r) => r.dependent_id)
  );
  const filtered = dependents.filter((d) => d.full_name.toLowerCase().includes(search.toLowerCase()));

  if (!sessionId) {
    return (
      <Card>
        <CardContent className="space-y-3 pt-4">
          <p className="text-sm font-bold text-navy">Selecione a sessão aberta pra fazer check-in</p>
          {openSessions.length === 0 && (
            <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Nenhuma sessão aberta agora. Abre uma na aba "Sessões" primeiro.
            </p>
          )}
          <div className="space-y-1.5">
            {openSessions.map((s) => (
              <button key={s.id} onClick={() => setSessionId(s.id)} className="block w-full rounded-md border bg-card p-2.5 text-left hover:border-gold/50">
                <p className="text-sm font-semibold text-navy">{s.name}</p>
                <p className="text-xs text-muted-foreground">{new Date(s.starts_at).toLocaleString("pt-BR")}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <button onClick={() => setSessionId("")} className="text-sm text-muted-foreground hover:text-navy">← Trocar sessão</button>

      {selected ? (
        <CheckInConfirm dependent={selected} sessionId={sessionId} onDone={() => setSelected(null)} onCancel={() => setSelected(null)} />
      ) : (
        <Card>
          <CardContent className="space-y-3 pt-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar criança pelo nome…" className="pl-8" />
            </div>
            <div className="space-y-1.5">
              {filtered.map((d) => {
                const already = checkedInIds.has(d.id);
                return (
                  <button key={d.id} onClick={() => !already && setSelected(d)} disabled={already}
                    className={`flex w-full items-center justify-between rounded-md border p-2.5 text-left ${already ? "bg-green-50 opacity-70" : "bg-card hover:border-gold/50"}`}>
                    <div className="flex items-center gap-2.5">
                      {d.photo_url ? <img src={d.photo_url} alt="" className="h-9 w-9 rounded-full object-cover" /> : (
                        <div className="grid h-9 w-9 place-items-center rounded-full bg-navy/10 text-sm font-bold text-navy">{d.full_name[0]}</div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-navy">{d.full_name}</p>
                        {(d.health_notes || d.special_needs) && (
                          <p className="flex items-center gap-1 text-[10px] font-semibold text-amber-700"><AlertTriangle className="h-3 w-3" />Atenção especial</p>
                        )}
                      </div>
                    </div>
                    {already ? <Check className="h-4 w-4 text-green-600" /> : <LogIn className="h-4 w-4 text-muted-foreground" />}
                  </button>
                );
              })}
              {filtered.length === 0 && <p className="text-sm italic text-muted-foreground">Nenhuma criança encontrada.</p>}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CheckInConfirm({ dependent: d, sessionId, onDone, onCancel }: { dependent: KidsDependent; sessionId: string; onDone: () => void; onCancel: () => void }) {
  const { data: guardians = [] } = useKidsGuardians(d.id);
  const qc = useQueryClient();
  const [deliveredBy, setDeliveredBy] = useState("");
  const [entryNotes, setEntryNotes] = useState("");
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    try {
      await KidsCustody.checkIn(supabase, d.id, sessionId, deliveredBy || undefined, entryNotes || undefined);
      qc.invalidateQueries({ queryKey: ["kids-session-custody", sessionId] });
      onDone();
    } finally { setBusy(false); }
  }

  return (
    <Card className="border-2 border-gold/40 bg-gold/5">
      <CardContent className="space-y-3 pt-4">
        <div className="flex items-center gap-3">
          {d.photo_url ? <img src={d.photo_url} alt="" className="h-12 w-12 rounded-full object-cover" /> : (
            <div className="grid h-12 w-12 place-items-center rounded-full bg-navy/10 text-lg font-bold text-navy">{d.full_name[0]}</div>
          )}
          <div>
            <p className="font-display text-lg text-navy">{d.full_name}</p>
            <p className="text-xs text-muted-foreground">Confirmar check-in</p>
          </div>
        </div>

        {(d.health_notes || d.special_needs) && (
          <div className="rounded-md border border-amber-300 bg-amber-50 p-2">
            <p className="flex items-center gap-1.5 text-xs font-bold text-amber-800"><AlertTriangle className="h-3.5 w-3.5" />Atenção</p>
            {d.health_notes && <p className="text-xs text-amber-900">{d.health_notes}</p>}
            {d.special_needs && <p className="text-xs text-amber-900">{d.special_needs}</p>}
          </div>
        )}

        <select value={deliveredBy} onChange={(e) => setDeliveredBy(e.target.value)} className="h-9 w-full rounded-md border bg-background px-2 text-sm">
          <option value="">Quem está entregando? (opcional)</option>
          {guardians.map((g) => <option key={g.id} value={g.profile_id}>{g.profile_name ?? g.profile_id}</option>)}
        </select>
        <Textarea value={entryNotes} onChange={(e) => setEntryNotes(e.target.value)} placeholder="Alguma observação na entrada? (ex: chegou sonolento) — opcional" rows={2} />

        <div className="flex gap-2">
          <Button onClick={confirm} disabled={busy} className="flex-1 gap-1.5"><Check className="h-4 w-4" />{busy ? "Confirmando…" : "Confirmar check-in"}</Button>
          <Button onClick={onCancel} variant="ghost">Cancelar</Button>
        </div>
      </CardContent>
    </Card>
  );
}
