import type { SupabaseClient } from "@supabase/supabase-js";
import type { Member } from "@/types/domain";

/** Cria (uma única vez) o registro de membro do próprio usuário logado, quando ele ainda não existe. */
export async function createMyMemberRecord(sb: SupabaseClient): Promise<string> {
  const { data, error } = await sb.rpc("create_my_member_record");
  if (error) {
    const detail = [error.message, error.details, error.hint, error.code]
      .filter(Boolean)
      .join(" — ");
    throw new Error(detail || "Não foi possível criar o cadastro de membro.");
  }
  if (!data) throw new Error("A RPC não retornou o identificador do cadastro criado.");
  return data as string;
}

export async function getMyMember(sb: SupabaseClient): Promise<Member | null> {
  const { data: u } = await sb.auth.getUser();
  if (!u.user) return null;
  try {
    const { data, error } = await sb.from("members").select("*").eq("profile_id", u.user.id).maybeSingle();
    if (error) return null;
    return (data as Member) ?? null;
  } catch { return null; }
}

const completionValue = (value: unknown) =>
  typeof value === "string" ? value.trim().length > 0 : value !== null && value !== undefined;

function calculateMemberCompletion(row: Record<string, unknown>): number {
  const filled = [
    completionValue(row.birth_date),
    completionValue(row.cpf),
    completionValue(row.rg) || completionValue(row.cnh),
    completionValue(row.phone),
    completionValue(row.phone_recado),
    completionValue(row.cep),
    completionValue(row.address),
    completionValue(row.numero),
    completionValue(row.neighborhood),
    completionValue(row.city),
    completionValue(row.photo_url),
    completionValue(row.gender),
  ].filter(Boolean).length;
  return Math.max(0, Math.min(100, Math.round((filled / 12) * 100)));
}

export async function getMemberCompletionPercent(sb: SupabaseClient, memberId: string): Promise<number> {
  const { data, error } = await sb.rpc("member_completion_percent", { p_member_id: memberId });
  if (!error && typeof data === "number") return Math.max(0, Math.min(100, data));

  const { data: member } = await sb
    .from("members")
    .select("birth_date, cpf, rg, cnh, phone, phone_recado, cep, address, numero, neighborhood, city, photo_url, gender")
    .eq("id", memberId)
    .maybeSingle();
  return member ? calculateMemberCompletion(member as Record<string, unknown>) : 0;
}

export async function uploadMemberPhoto(sb: SupabaseClient, memberId: string, file: File): Promise<string> {
  const { data: u } = await sb.auth.getUser();
  if (!u.user) throw new Error("Sessão expirada, faça login novamente.");
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${u.user.id}/${memberId}.${ext}`;
  const { error: upErr } = await sb.storage.from("member-photos").upload(path, file, {
    contentType: file.type, upsert: true,
  });
  if (upErr) throw upErr;
  const { data } = sb.storage.from("member-photos").getPublicUrl(path);
  return data.publicUrl;
}
/** Lista os membros ativos de um Life Group, opcionalmente excluindo um deles (ex: ao trocar de líder). */
export async function listCellMembers(sb: SupabaseClient, cellId: string, excludeMemberId?: string): Promise<Member[]> {
  let q = sb.from("members").select("*").eq("life_group_id", cellId).eq("status", "ativo").order("full_name");
  if (excludeMemberId) q = q.neq("id", excludeMemberId);
  const { data, error } = await q;
  if (error) return [];
  return (data ?? []) as Member[];
}

export async function listAllMembers(sb: SupabaseClient): Promise<Member[]> {
  const { data, error } = await sb.from("members").select("*").order("full_name");
  if (error) return [];
  return (data ?? []) as Member[];
}

export async function createMember(sb: SupabaseClient, input: Partial<Member>): Promise<Member> {
  const { data, error } = await sb.from("members").insert(input).select().single();
  if (error) throw error;
  return data as Member;
}

export async function updateMember(sb: SupabaseClient, id: string, input: Partial<Member>): Promise<void> {
  const { data, error } = await sb.from("members").update(input).eq("id", id).select("id");
  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error(
      "Nada foi salvo. Você pode não ter permissão para editar este cadastro, ou o registro não foi encontrado."
    );
  }
}

export async function deleteMember(sb: SupabaseClient, id: string): Promise<void> {
  const { data, error } = await sb.from("members").delete().eq("id", id).select("id");
  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error(
      "Nada foi excluído. Provavelmente este membro está fora do seu escopo de permissão (church_id não bate com o seu acesso), ou já foi removido antes."
    );
  }
}

/** Resolve o nome real de Igreja/Life Group do membro, mesmo que estejam fora do escopo territorial de quem pergunta (desde que já tenha acesso ao membro). */
export async function getMemberStructureNames(
  sb: SupabaseClient, memberId: string
): Promise<{ church_name: string | null; life_group_name: string | null } | null> {
  const { data, error } = await sb.rpc("member_structure_names", { p_member_id: memberId }).maybeSingle();
  if (error) throw error;
  return data as { church_name: string | null; life_group_name: string | null } | null;
}
