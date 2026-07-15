"use client";
import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMyProfile, useMyMember } from "@/hooks/use-queries";
import { supabase } from "@/lib/supabase/client";
import { MemberHeader } from "@/components/panel/MemberHeader";
import { MaisCategoria } from "@/components/shared/CECmaisBrand";
import { getCategoria } from "@/lib/cecmais-categorias";
import { logAudit } from "@/services/audit";

export default function CategoriaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const categoria = getCategoria(slug);

  const { data: profile } = useMyProfile();
  const { data: member } = useMyMember();
  const isAdmin = profile?.role && profile.role !== "membro" && profile.role !== "visitante";

  async function signOut() {
    if (profile) await logAudit(supabase, "logout", "auth", profile.id);
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (!categoria) return notFound();

  return (
    <div className="min-h-screen bg-background">
      <MemberHeader active="cecmais" isAdmin={!!isAdmin} onSignOut={signOut} />

      <main className="container max-w-3xl space-y-6 py-8">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="gap-1">
            <Link href="/painel/cecmais/explorar"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <MaisCategoria nome={categoria.nome} size="md" />
        </div>

        <p className="text-muted-foreground">{categoria.descricao}</p>

        <Card>
          <CardContent className="pt-5">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-navy">O que vem por aí</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {categoria.ofertas.map((oferta) => (
                <div key={oferta} className="flex items-center justify-between rounded-md border bg-muted/20 px-3 py-2 text-sm">
                  <span>{oferta}</span>
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
                    <Clock className="h-3 w-3" /> Em breve
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <p className="rounded-md border bg-muted/20 p-3 text-center text-xs text-muted-foreground">
          Essas ofertas ainda estão sendo preparadas. Assim que estiverem disponíveis, você poderá
          conhecer, contratar ou se matricular direto por aqui.
        </p>
      </main>
    </div>
  );
}
