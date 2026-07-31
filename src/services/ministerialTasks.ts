import type { SupabaseClient } from "@supabase/supabase-js";
import type { MinisterialTask, MinisterialTaskInput, MinisterialTaskStatus } from "@/types/domain";

const STATUS_ORDER: Record<MinisterialTaskStatus, number> = {
  pendente: 0, em_andamento: 1, aguardando_retorno: 2, concluida: 3, cancelada: 4,
};

function sortTasks(tasks: MinisterialTask[]): MinisterialTask[] {
  return [...tasks].sort((a, b) => {
    const s = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    if (s !== 0) return s;
    if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
    if (a.due_date) return -1;
    if (b.due_date) return 1;
    return b.created_at.localeCompare(a.created_at);
  });
}

/** Tarefas de um Life Group específico (visão do Líder/Colíder — RLS já restringe quem pode ver). */
export async function listLgTasks(sb: SupabaseClient, lifeGroupId: string): Promise<MinisterialTask[]> {
  const { data, error } = await sb.from("ministerial_tasks").select("*").eq("life_group_id", lifeGroupId);
  if (error) throw error;
  return sortTasks((data ?? []) as MinisterialTask[]);
}

/** Minhas tarefas — onde sou o responsável, em qualquer Life Group/escopo. */
export async function listMyTasks(sb: SupabaseClient, profileId: string): Promise<MinisterialTask[]> {
  const { data, error } = await sb.from("ministerial_tasks").select("*").eq("responsible_id", profileId);
  if (error) throw error;
  return sortTasks((data ?? []) as MinisterialTask[]);
}

export async function createTask(sb: SupabaseClient, input: MinisterialTaskInput & { title: string }): Promise<void> {
  const { error } = await sb.from("ministerial_tasks").insert(input);
  if (error) throw error;
}

export async function updateTaskStatus(sb: SupabaseClient, id: string, status: MinisterialTaskStatus): Promise<void> {
  const { error } = await sb.from("ministerial_tasks").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function updateTask(sb: SupabaseClient, id: string, patch: MinisterialTaskInput): Promise<void> {
  const { error } = await sb.from("ministerial_tasks").update(patch).eq("id", id);
  if (error) throw error;
}
