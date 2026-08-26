import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile } from "@/types/domain";

/**
 * Guard server-side pros workspaces paralelos (Executivo, Organizacional,
 * Pessoas, Recursos, Governança). Sem isso, qualquer pessoa logada — mesmo
 * um membro comum — via e editava tudo, porque essas páginas só buscavam
 * o perfil pro nome de exibição, sem checar cargo ou delegação nenhuma.
 *
 * Regra: qualquer pessoa precisa ter pelo menos UMA delegação ativa
 * (Governança → Delegações) — a função real é determinada por permissões,
 * não por um perfil herdado.
 */
export async function requireWorkspaceAccess(supabase: SupabaseClient, profile: Profile | null): Promise<void> {
  if (!profile) redirect("/entrar");
  const { data, error } = await supabase.rpc("my_active_modules");
  const myModules: string[] = error ? [] : (data ?? []);

  if (myModules.length === 0) redirect("/painel");
}
