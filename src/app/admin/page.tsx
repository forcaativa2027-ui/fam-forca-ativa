"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, hasSupabaseEnv } from "@/lib/supabase/client";

const AdminPanel = dynamic(() => import("@/components/admin/AdminPanel"), {
  ssr: false, loading: () => <main className="grid h-screen place-items-center text-muted">Carregando…</main>,
});

// Cargos que dão acesso ao painel administrativo (o controle fino de QUAIS
// módulos cada um vê dentro do painel é feito pelas Delegações — isso aqui
// é só o portão de entrada, pra membro comum nunca cair no /admin).
const ADMIN_ROLES = new Set(["apostolo", "pastor", "supervisor", "lider", "discipulador", "anfitriao"]);

export default function Page() {
  const envOk = hasSupabaseEnv();
  const [session, setSession] = useState<Session | null | "loading">("loading");
  const [authorized, setAuthorized] = useState<boolean | "checking">("checking");

  useEffect(() => {
    if (!envOk) { setSession(null); return; }
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { window.location.href = "/entrar"; return; }
      setSession(data.session);

      const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.session.user.id).maybeSingle();
      if (!profile || !ADMIN_ROLES.has(profile.role)) {
        window.location.href = "/painel";
        return;
      }
      setAuthorized(true);
    });
  }, [envOk]);

  if (!envOk) return <main className="grid h-screen place-items-center px-4 text-center text-muted">Configure as variáveis de ambiente do Supabase na Vercel.</main>;
  if (session === "loading" || authorized === "checking") return <main className="grid h-screen place-items-center text-muted">Carregando…</main>;
  if (!session || !authorized) return null;
  return <AdminPanel />;
}
