"use client";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, Check, Shuffle, Loader2, X } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useLgMeetingRoles } from "@/hooks/use-queries";
import { MEETING_MOMENTS, upsertMeetingRole, setMeetingRoleConfirmed, confirmOwnMeetingRole, suggestRotation } from "@/services/lgMeetingRoles";
import { feedback } from "@/lib/feedback";
import type { Cell, Member, LgMeetingMomentKey } from "@/types/domain";

const WEEKDAY_INDEX: Record<string, number> = {
  domingo: 0, segunda: 1, terca: 2, quarta: 3, quinta: 4, sexta: 5, sabado: 6,
};

/** Próxima ocorrência do dia de reunião do LG (hoje, se hoje já for o dia). */
function nextMeetingDate(weekday: string | null): string | null {
  if (!weekday || !(weekday in WEEKDAY_INDEX)) return null;
  const target = WEEKDAY_INDEX[weekday];
  const now = new Date();
  const diff = (target - now.getDay() + 7) % 7;
  const d = new Date(now);
  d.setDate(now.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

function formatDateLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });
}

/**
 * CT-019 §4.2/§4.3 — Programação e Escala da reunião do Life Group.
 * Todo membro vê os 7 momentos e quem é o responsável; só Líder e
 * Colíder podem atribuir/trocar responsáveis, sugerir rodízio
 * automático e confirmar participação (matriz de permissões §7).
 */
export function LgMeetingSchedule({ cell, members, canManage, myMemberId }: { cell: Cell; members: Member[]; canManage: boolean; myMemberId: string | null }) {
  const qc = useQueryClient();
  const meetingDate = nextMeetingDate(cell.meeting_weekday);
  const { data: roles = [], isLoading } = useLgMeetingRoles(cell.id, meetingDate);
  const [savingKey, setSavingKey] = useState<LgMeetingMomentKey | null>(null);
  const [suggesting, setSuggesting] = useState(false);

  if (!meetingDate) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-gold" />Programação da Reunião</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm italic text-muted">O dia da reunião ainda não foi configurado pra este Life Group.</p>
        </CardContent>
      </Card>
    );
  }

  function roleFor(momentKey: LgMeetingMomentKey) {
    return roles.find((r) => r.moment_key === momentKey) ?? null;
  }

  async function invalidate() {
    await qc.invalidateQueries({ queryKey: ["lg-meeting-roles", cell.id, meetingDate] });
  }

  async function saveResponsible(momentKey: LgMeetingMomentKey, order: number, memberId: string | null) {
    setSavingKey(momentKey);
    try {
      await upsertMeetingRole(supabase, {
        life_group_id: cell.id,
        meeting_date: meetingDate!,
        moment_key: momentKey,
        moment_order: order,
        responsible_member_id: memberId,
        confirmed: false,
      });
      feedback("save", "success");
      await invalidate();
    } catch {
      feedback("error", "error");
    } finally {
      setSavingKey(null);
    }
  }

  async function toggleConfirmed(id: string, confirmed: boolean) {
    try {
      await setMeetingRoleConfirmed(supabase, id, confirmed);
      feedback("select", "select");
      await invalidate();
    } catch {
      feedback("error", "error");
    }
  }

  async function respondOwnRole(id: string, confirmed: boolean) {
    try {
      await confirmOwnMeetingRole(supabase, id, confirmed, confirmed ? undefined : "Membro sinalizou indisponibilidade");
      feedback(confirmed ? "success" : "select", confirmed ? "success" : "select");
      await invalidate();
    } catch {
      feedback("error", "error");
    }
  }

  async function handleSuggestRotation() {
    setSuggesting(true);
    try {
      const memberIds = members.map((m) => m.id);
      const picks = suggestRotation(memberIds);
      await Promise.all(
        MEETING_MOMENTS.map((m, i) =>
          upsertMeetingRole(supabase, {
            life_group_id: cell.id,
            meeting_date: meetingDate!,
            moment_key: m.key,
            moment_order: m.order,
            responsible_member_id: picks[i],
            confirmed: false,
          })
        )
      );
      feedback("success", "success");
      await invalidate();
    } catch {
      feedback("error", "error");
    } finally {
      setSuggesting(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-gold" />Programação da Reunião</CardTitle>
          <CardDescription className="capitalize">{formatDateLabel(meetingDate)}</CardDescription>
        </div>
        {canManage && (
          <Button
            variant="outline" size="sm"
            onClick={handleSuggestRotation}
            disabled={suggesting || members.length === 0}
            className="shrink-0 gap-1.5"
          >
            {suggesting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Shuffle className="h-3.5 w-3.5" />}
            Sugerir escala
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm italic text-muted">Carregando escala...</p>
        ) : (
          <ul className="divide-y">
            {MEETING_MOMENTS.map((m) => {
              const role = roleFor(m.key);
              const responsibleName = role?.responsible?.full_name ?? null;
              const isSaving = savingKey === m.key;
              return (
                <li key={m.key} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <b className="text-navy">{m.order}. {m.label}</b>
                    {m.note && <span className="ml-1.5 text-xs italic text-muted">({m.note})</span>}
                  </div>

                  {canManage ? (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <select
                          value={role?.responsible_member_id ?? ""}
                          onChange={(e) => saveResponsible(m.key, m.order, e.target.value || null)}
                          disabled={isSaving}
                          className="h-10 min-w-[180px] rounded-lg border-2 border-border bg-background px-2 text-sm"
                        >
                          <option value="">Sem responsável</option>
                          {members.map((mem) => (
                            <option key={mem.id} value={mem.id}>{mem.full_name}</option>
                          ))}
                        </select>
                        {role?.id && role.responsible_member_id && (
                          <button
                            type="button"
                            onClick={() => toggleConfirmed(role.id, !role.confirmed)}
                            aria-pressed={role.confirmed}
                            title={role.confirmed ? "Confirmado — clique pra desmarcar" : "Marcar como confirmado"}
                            className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 transition ${role.confirmed ? "border-green-600 bg-green-50 text-green-600" : "border-border text-muted hover:border-gold"}`}
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                        {isSaving && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted" />}
                      </div>
                      {role?.notes === "Membro sinalizou indisponibilidade" && !role.confirmed && (
                        <span className="text-xs font-semibold text-amber-600">⚠ Sinalizou indisponibilidade — realoque este momento</span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm">
                      {responsibleName ? (
                        <>
                          <span className="text-ink">{responsibleName}</span>
                          {role?.confirmed && <Check className="h-3.5 w-3.5 text-green-600" aria-label="Confirmado" />}
                          {role?.notes === "Membro sinalizou indisponibilidade" && !role.confirmed && (
                            <span className="text-xs italic text-amber-600">Indisponível</span>
                          )}
                        </>
                      ) : (
                        <span className="italic text-muted">A definir</span>
                      )}
                      {role?.id && role.responsible_member_id === myMemberId && !role.confirmed && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => respondOwnRole(role.id, true)}
                            className="flex h-8 items-center gap-1 rounded-full border-2 border-green-600 px-2.5 text-xs font-semibold text-green-700 hover:bg-green-50"
                          >
                            <Check className="h-3.5 w-3.5" /> Confirmar
                          </button>
                          <button
                            type="button"
                            onClick={() => respondOwnRole(role.id, false)}
                            className="flex h-8 items-center gap-1 rounded-full border-2 border-border px-2.5 text-xs font-semibold text-muted hover:border-amber-500 hover:text-amber-600"
                          >
                            <X className="h-3.5 w-3.5" /> Não poderei
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
