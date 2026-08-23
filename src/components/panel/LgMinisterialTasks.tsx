"use client";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ListChecks, Plus, Check, X, Play, Clock, UserPlus, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useLgTasks } from "@/hooks/use-queries";
import { createTask, updateTaskStatus } from "@/services/ministerialTasks";
import { feedback } from "@/lib/feedback";
import type { MinisterialTask, MinisterialTaskStatus, MinisterialTaskPriority } from "@/types/domain";

const ORIGIN_LABELS: Record<string, string> = {
  manual: "Manual",
  relatorio_visitante: "Visitante do relatório",
  relatorio_ausencia: "Ausência recorrente",
  pedido_oracao: "Pedido de oração",
};

const PRIORITY_STYLE: Record<MinisterialTaskPriority, string> = {
  baixa: "bg-slate-100 text-slate-600",
  media: "bg-blue-50 text-blue-700",
  alta: "bg-amber-50 text-amber-700",
  urgente: "bg-red-50 text-red-700",
};

const STATUS_LABELS: Record<MinisterialTaskStatus, string> = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  aguardando_retorno: "Aguardando retorno",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

const DONE_STATUSES: MinisterialTaskStatus[] = ["concluida", "cancelada"];

/**
 * CT-020 §14 — Tarefas Ministeriais do Life Group. Exclusivo de
 * Líder/Colíder (mesma matriz das outras funções de gestão do LG).
 * Já recebe automaticamente as tarefas geradas pelo relatório
 * (origin = "relatorio_visitante" etc.) junto com as manuais.
 */
export function LgMinisterialTasks({ lifeGroupId, profileId }: { lifeGroupId: string; profileId: string | null }) {
  const qc = useQueryClient();
  const { data: tasks = [], isLoading } = useLgTasks(lifeGroupId);
  const [showDone, setShowDone] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<MinisterialTaskPriority>("media");
  const [savingId, setSavingId] = useState<string | null>(null);

  const pending = tasks.filter((t) => !DONE_STATUSES.includes(t.status));
  const done = tasks.filter((t) => DONE_STATUSES.includes(t.status));

  async function invalidate() {
    await qc.invalidateQueries({ queryKey: ["lg-tasks", lifeGroupId] });
  }

  async function handleCreate() {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      await createTask(supabase, {
        title: newTitle.trim(),
        origin: "manual",
        life_group_id: lifeGroupId,
        priority: newPriority,
        responsible_id: profileId,
        created_by: profileId,
      });
      feedback("save", "success");
      setNewTitle(""); setNewPriority("media");
      await invalidate();
    } catch {
      feedback("error", "error");
    } finally {
      setCreating(false);
    }
  }

  async function changeStatus(id: string, status: MinisterialTaskStatus) {
    setSavingId(id);
    try {
      await updateTaskStatus(supabase, id, status);
      feedback(status === "concluida" ? "success" : "select", status === "concluida" ? "success" : "select");
      await invalidate();
    } catch {
      feedback("error", "error");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><ListChecks className="h-5 w-5 text-gold" />Tarefas Ministeriais</CardTitle>
        <CardDescription>Necessidades de cuidado identificadas — manuais ou geradas pelo relatório</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Criar tarefa manual */}
        <div className="flex flex-col gap-2 rounded-xl border-2 border-dashed border-border p-3 sm:flex-row sm:items-center">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
            placeholder="Nova tarefa (ex: ligar pra visitante, visitar membro ausente)"
            className="h-10 flex-1 rounded-lg border-2 border-border bg-background px-3 text-sm"
          />
          <select
            value={newPriority}
            onChange={(e) => setNewPriority(e.target.value as MinisterialTaskPriority)}
            className="h-10 rounded-lg border-2 border-border bg-background px-2 text-sm"
          >
            <option value="baixa">Baixa</option>
            <option value="media">Média</option>
            <option value="alta">Alta</option>
            <option value="urgente">Urgente</option>
          </select>
          <Button size="sm" onClick={handleCreate} disabled={creating || !newTitle.trim()} className="gap-1.5">
            <Plus className="h-4 w-4" /> Adicionar
          </Button>
        </div>

        {isLoading ? (
          <p className="text-sm italic text-muted">Carregando tarefas...</p>
        ) : pending.length === 0 ? (
          <p className="text-sm italic text-muted">Nenhuma tarefa pendente. 🎉</p>
        ) : (
          <ul className="divide-y">
            {pending.map((t) => (
              <TaskRow key={t.id} task={t} saving={savingId === t.id} onChangeStatus={changeStatus} />
            ))}
          </ul>
        )}

        {done.length > 0 && (
          <div>
            <button
              type="button"
              onClick={() => setShowDone((v) => !v)}
              className="flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-navy"
            >
              {showDone ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {done.length} concluída(s)/cancelada(s)
            </button>
            {showDone && (
              <ul className="mt-2 divide-y opacity-70">
                {done.map((t) => (
                  <TaskRow key={t.id} task={t} saving={savingId === t.id} onChangeStatus={changeStatus} />
                ))}
              </ul>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TaskRow({
  task, saving, onChangeStatus,
}: { task: MinisterialTask; saving: boolean; onChangeStatus: (id: string, status: MinisterialTaskStatus) => void }) {
  const isDone = DONE_STATUSES.includes(task.status);
  return (
    <li className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <b className={`text-navy ${isDone ? "line-through" : ""}`}>{task.title}</b>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${PRIORITY_STYLE[task.priority]}`}>{task.priority}</span>
        </div>
        <p className="mt-0.5 text-xs text-muted">
          {ORIGIN_LABELS[task.origin] ?? task.origin} · {STATUS_LABELS[task.status]}
          {task.due_date && <> · prazo {new Date(`${task.due_date}T00:00:00`).toLocaleDateString("pt-BR")}</>}
        </p>
        {task.notes && <p className="mt-1 text-xs italic text-muted">{task.notes}</p>}
      </div>

      {!isDone && (
        <div className="flex shrink-0 items-center gap-1.5">
          {task.status === "pendente" && (
            <button
              type="button" disabled={saving}
              onClick={() => onChangeStatus(task.id, "em_andamento")}
              title="Iniciar"
              className="flex h-8 items-center gap-1 rounded-full border-2 border-blue-300 px-2.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
            >
              <Play className="h-3.5 w-3.5" /> Iniciar
            </button>
          )}
          {task.status !== "aguardando_retorno" && (
            <button
              type="button" disabled={saving}
              onClick={() => onChangeStatus(task.id, "aguardando_retorno")}
              title="Aguardando retorno"
              className="flex h-8 items-center gap-1 rounded-full border-2 border-border px-2.5 text-xs font-semibold text-muted hover:border-amber-400 hover:text-amber-600"
            >
              <Clock className="h-3.5 w-3.5" /> Aguardar
            </button>
          )}
          <button
            type="button" disabled={saving}
            onClick={() => onChangeStatus(task.id, "concluida")}
            title="Concluir"
            className="flex h-8 items-center gap-1 rounded-full border-2 border-green-600 px-2.5 text-xs font-semibold text-green-700 hover:bg-green-50"
          >
            <Check className="h-3.5 w-3.5" /> Concluir
          </button>
          <button
            type="button" disabled={saving}
            onClick={() => onChangeStatus(task.id, "cancelada")}
            title="Cancelar"
            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-border text-muted hover:border-red-300 hover:text-red-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      {isDone && (
        <button
          type="button" disabled={saving}
          onClick={() => onChangeStatus(task.id, "pendente")}
          title="Reabrir"
          className="flex h-8 shrink-0 items-center gap-1 rounded-full border-2 border-border px-2.5 text-xs font-semibold text-muted hover:border-gold hover:text-gold"
        >
          <UserPlus className="h-3.5 w-3.5" /> Reabrir
        </button>
      )}
    </li>
  );
}
