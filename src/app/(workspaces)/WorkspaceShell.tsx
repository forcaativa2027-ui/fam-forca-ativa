"use client";
import Link from "next/link";
import { ArrowLeft, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";

/**
 * Shell inicial do grupo (workspaces). Piloto: só topbar com identificação
 * e navegação de volta ao painel legado (/admin). A navegação completa entre
 * os 7 workspaces (Executivo, Organizacional, Pessoas, Operacional,
 * Comunicação, Recursos, Governança) é uma decisão de design em aberto —
 * ver CONTEXTO_NOVO_CHAT_CEC_FAMILY_V3.md — e será adicionada aqui conforme
 * cada workspace for migrado.
 */
export function WorkspaceShell({
  title,
  userName,
  children,
}: {
  title: string;
  userName?: string;
  children: React.ReactNode;
}) {
  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/entrar";
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <header className="flex h-14 items-center justify-between border-b-[3px] border-gold bg-navy px-4 text-white">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="text-white/70 hover:bg-white/10 hover:text-white">
            <Link href="/admin"><ArrowLeft className="mr-1 h-3.5 w-3.5" /> Painel</Link>
          </Button>
          <span className="font-display text-sm font-semibold">CEC Family · {title}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-white/60">
          {userName && <span>{userName}</span>}
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-white/60 hover:bg-white/10 hover:text-white">
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
