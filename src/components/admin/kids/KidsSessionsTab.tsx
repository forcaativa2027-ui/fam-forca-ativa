"use client";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarPlus, Play, Square, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase/client";
import { useMyProfile, useKidsSessions, useKidsGroups } from "@/hooks/use-queries";
import * as KidsCustody from "@/services/kidsCustody";
import type { CustodySessionStatus } from "@/types/domain";

const STATUS_LABELS: Record<CustodySessionStatus, string> = {
  scheduled: "Agendada", open: "Aberta (check-in liberado)", closed: "Encerrada", cancelled: "Cancelada",
};
const STATUS_COLOR: Record<CustodySessionStatus, string> = {
  scheduled: "bg-gray-100 text-gray-600", open: "bg-green-100 text-green-700",
  closed: "bg-blue-100 text-blue-700", cancelled: "bg-red-100 text-red-600",
};

/** KIDS — Sessões de Custódia (ex: "Culto Infantil — domingo 19h"). */
export function KidsSessionsTab({ churchId }: { churchId: string }) {
  const { data: me } = useMyProfile();
  const qc = useQueryClient();
  const { data: sessions = [] } = useKidsSessions(churchId);
  const { data: groups = [] } = useKidsGroups(churchId);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [groupId, setGroupId] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [busy, setBusy] = useState(false);

  async function create() {
    if (!name.trim() || !startsAt) return;
    setBusy(true);
    try {
      await KidsCustody.createSession(supabase, {
        church_id: churchId, name, group_id: groupId || undefined,
        starts_at: new Date(startsAt).toISOString(), created_by: me?.id,
      });
      setName(""); setStartsAt(""); setGroupId(""); setShowForm(false);
      qc.invalidateQueries({ queryKey: ["kids-sessions", churchId] });
    } finally { setBusy(false); }
  }
  async function setStatus(id: string, status: CustodySessionStatus) {
    await KidsCustody.setSessionStatus(supabase, id, status);
    qc.invalidateQueries({ queryKey: ["kids-sessions", churchId] });
    qc.invalidateQueries({ queryKey: ["kids-open-sessions", churchId] });
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5"><CalendarPlus className="h-4 w-4" />Nova sessão</Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="space-y-2 pt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-navy">Nova sessão</p>
              <button onClick={() => setShowForm(false)}><X className="h-4 w-4 text-muted-foreground" /></button>
            </div>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome (ex: Culto Infantil — Manhã)" />
            <select value={groupId} onChange={(e) => setGroupId(e.target.value)} className="h-9 w-full rounded-md border bg-background px-2 text-sm">
              <option value="">Turma (opcional — sessão pra todas)</option>
              {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
            <Button onClick={create} disabled={busy || !name.trim() || !startsAt} className="w-full">{busy ? "Criando…" : "Criar sessão"}</Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {sessions.map((s) => (
          <Card key={s.id}>
            <CardContent className="flex items-center justify-between pt-4">
              <div>
                <p className="text-sm font-semibold text-navy">{s.name}</p>
                <p className="text-xs text-muted-foreground">{new Date(s.starts_at).toLocaleString("pt-BR")}</p>
                <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_COLOR[s.status]}`}>{STATUS_LABELS[s.status]}</span>
              </div>
              <div className="flex gap-1.5">
                {s.status !== "open" && s.status !== "closed" && (
                  <Button size="sm" variant="outline" onClick={() => setStatus(s.id, "open")} className="gap-1"><Play className="h-3.5 w-3.5" />Abrir</Button>
                )}
                {s.status === "open" && (
                  <Button size="sm" variant="outline" onClick={() => setStatus(s.id, "closed")} className="gap-1"><Square className="h-3.5 w-3.5" />Encerrar</Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {sessions.length === 0 && <p className="py-6 text-center text-sm italic text-muted-foreground">Nenhuma sessão cadastrada ainda.</p>}
      </div>
    </div>
  );
}
