"use client";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useMyProfile, useMyMember } from "@/hooks/use-queries";
import { supabase } from "@/lib/supabase/client";
import { MemberHeader } from "@/components/panel/MemberHeader";
import { CECmaisLogo, Mais } from "@/components/shared/CECmaisBrand";
import { logAudit } from "@/services/audit";

const CATEGORIES = ["Saúde", "Proteção", "Formação", "Fé", "Leitura", "Vantagens"];

export default function CECmaisPage() {
  const { data: profile } = useMyProfile();
  const { data: member } = useMyMember();
  const isAdmin = profile?.role && profile.role !== "membro" && profile.role !== "visitante";
  const firstName = (member?.full_name ?? profile?.full_name ?? "").split(" ")[0];

  async function signOut() {
    if (profile) await logAudit(supabase, "logout", "auth", profile.id);
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <div className="min-h-screen bg-background">
      <MemberHeader active="cecmais" isAdmin={!!isAdmin} onSignOut={signOut} />

      <main className="container max-w-3xl space-y-8 py-12 text-center">
        <CECmaisLogo size="lg" className="justify-center" />

        <div>
          <p className="text-lg text-muted-foreground">Olá, {firstName || "membro"}.</p>
          <p className="mt-2 font-display text-2xl leading-snug text-navy">
            <Mais className="text-2xl" /> cuidado.<br />
            <Mais className="text-2xl" /> conhecimento.<br />
            <Mais className="text-2xl" /> oportunidades para você e sua família.
          </p>
        </div>

        <div className="relative mx-auto max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar no CECmais…" className="h-12 pl-9 text-sm" disabled />
        </div>

        <div className="rounded-xl border border-dashed border-gold/40 bg-gold/5 p-6">
          <p className="text-sm text-muted-foreground">
            Em breve: <Mais className="text-base" /> Saúde, <Mais className="text-base" /> Proteção,{" "}
            <Mais className="text-base" /> Formação, <Mais className="text-base" /> Fé,{" "}
            <Mais className="text-base" /> Leitura e <Mais className="text-base" /> Vantagens —
            serviços, formação, conteúdos e oportunidades para você e sua família.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {CATEGORIES.map((c) => (
              <span key={c} className="rounded-full border border-navy/10 bg-white px-3 py-1 text-xs font-semibold text-navy/60">
                <Mais className="text-xs" /> {c}
              </span>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
